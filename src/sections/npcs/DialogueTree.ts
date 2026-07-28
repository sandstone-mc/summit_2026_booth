import { _, data, Data, execute, functionCmd, MCFunction, type MCFunctionClass, Objective, raw, Selector, type Condition } from 'sandstone'
import { TextObject, type JSONTextComponent } from 'sandstone/arguments'
import { NAMESPACE } from '@shared'
import { DialogueLineIndex, NpcDisplayLabel, registry, RevealCount, RevealDelay, RevealingLabel, RevealSpeed, RevealTotal } from './NPC'
import { JSONTextComponentClass, TextComponentClass } from 'sandstone/variables';

// ticks per revealed character
const DEFAULT_SPEED = 1

// ticks to hold a fully-revealed line before auto advancing
const DEFAULT_AUTO_DELAY = 40

const VariantPickObjective = Objective.create('npc.dialogue.variant')
const VariantPick = VariantPickObjective('@s')

// scratch score + storage shared by every NPC/line/variant, used to cut a
// runtime-length substring out of the currently-revealing text run
const RevealCutObjective = Objective.create('npc.dialogue.reveal_cut')
const REVEAL_STORAGE = `${NAMESPACE}:npcs_reveal`
// active run's full (un-cut) text, written fresh each reveal step
const revealFull = Data('storage', REVEAL_STORAGE, 'full')
// [0, end) slice of `full`, filled in by _computeRevealCut
const revealCut = Data('storage', REVEAL_STORAGE, 'cut')
const revealRuns = Data('storage', REVEAL_STORAGE, 'runs')

const _computeRevealCut = MCFunction('sections/npcs/dialogue/_compute_reveal_cut', () => {
    raw(`$data modify storage ${REVEAL_STORAGE} cut set string storage ${REVEAL_STORAGE} full 0 $(end)`)
}, { lazy: true })

export interface DialogueLine {
    // Static text. Ignored if `variants` is set
    text?: JSONTextComponent
    
    // Pick one at random each time this line plays
    variants?: JSONTextComponent
    
    // Skip this line (falls through to whatever comes next) if this evaluates false
    condition?: Condition

    // Ticks per revealed character for this line. Defaults to 1
    speed?: number

    // Runs as the interactor right when this line starts appearing
    onShow?: () => void

    // Runs as the interactor once this line has fully revealed
    onComplete?: () => void
}

export interface DialogueNode {
    id: string
    lines: DialogueLine[]
    // Defaults to 'click'
    advance?: 'click' | 'auto'
    autoDelay?: number
    // Auto-continue to this node once the last line finishes.
    // Pass an object to branch to a different node depending on a condition,
    next?: string | { condition: Condition | (() => Condition), then: string, else: string }
}

export interface DialogueTreeOptions {
    nodes: DialogueNode[]
    // Defaults to nodes[0].id
    start?: string
}

export interface DialogueTree {
    id: string

    // Run as the NPC to start this dialogue at its start node
    start: MCFunctionClass

    // Run as the NPC to go to the next line (can interupt a line)
    advance: MCFunctionClass

    // Run as the NPC to end the dialogue early
    end: MCFunctionClass

    // Run as the NPC to (re-)render the current line at its current reveal count
    render: MCFunctionClass
}

// runs callback as/at the NPC's text display entity
function withDisplay(callback: () => void) {
    execute.at('@s').run(() => {
        execute.as(Selector('@e', { type: 'minecraft:text_display', tag: NpcDisplayLabel, distance: [0, 2] })).run(callback)
    })
}

// merges text onto the NPC text display
function mergeDisplayText(text: JSONTextComponent) {
    withDisplay(() => {
        data.merge.entity('@s',
            { text }
        )
    })
}

function normalizeRuns(text: JSONTextComponent): TextObject[] {
    if (typeof text === 'string') return [{ text }]
    if (text instanceof JSONTextComponentClass) return normalizeRuns(text.toJSON())
    if (text instanceof TextComponentClass) {
        return normalizeRuns((text as any)._toChatComponent())
    }
    if (Array.isArray(text)) {
        return text.map(normalizeRuns).flat()
    }
    return [text]
}

function plainLength(runs: TextObject[]): number {
    return runs.reduce((sum, run) => {
        if (typeof run === 'string' || !('text' in run)) {
            throw new Error()
        }
        return sum + run.text.length
    }, 0)
}

// character offset each run starts at, so render() can tell which run a
// given RevealCount falls into
interface RunBound {
    run: TextObject
    offset: number
    length: number
}

function runBoundaries(runs: TextObject[]): RunBound[] {
    let offset = 0
    return runs.map((run) => {
        if (typeof run === 'string' || !('text' in run)) {
            throw new Error()
        }
        const bound: RunBound = { run, offset, length: run.text.length }
        offset += run.text.length
        return bound
    })
}

interface FlatLine {
    line: DialogueLine
    node: DialogueNode
    globalIndex: number
    isLastInNode: boolean
}

export function DialogueTree(id: string, options: DialogueTreeOptions): DialogueTree {
    const { nodes } = options
    if (nodes.length === 0) {
        throw new Error(`DialogueTree "${id}" needs at least one node`)
    }

    const flat: FlatLine[] = []
    const nodeFirstIndex: Record<string, number> = {}
    for (const node of nodes) {
        if (node.lines.length === 0) {
            throw new Error(`DialogueTree "${id}" node "${node.id}" needs at least one line`)
        }
        nodeFirstIndex[node.id] = flat.length
        node.lines.forEach((line, li) => {
            flat.push({ line, node, globalIndex: flat.length, isLastInNode: li === node.lines.length - 1 })
        })
    }

    const startNodeId = options.start ?? nodes[0].id
    if (!(startNodeId in nodeFirstIndex)) {
        throw new Error(`DialogueTree "${id}": start node "${startNodeId}" does not exist`)
    }

    for (const node of nodes) {
        if (node.next && typeof node.next !== 'string') {
            for (const branchId of [node.next.then, node.next.else]) {
                if (!(branchId in nodeFirstIndex)) {
                    throw new Error(`DialogueTree "${id}": node "${node.id}" branches to "${branchId}", which does not exist`)
                }
            }
        }
    }

    // NPCs this tree is actually attached to via CreateNPC
    function owners() {
        return registry.filter((npc) => npc.dialogue?.id === id)
    }

    function runAsPlayer(callback: () => void) {
        for (const npc of owners()) {
            execute.if.entity(Selector('@s', { tag: npc.instanceTag })).run(() => {
                execute.as(Selector('@a', { tag: npc.interactorTag, limit: 1 })).run(callback)
            })
        }
    }

    function runAsMyNpc(callback: () => void) {
        for (const npc of owners()) {
            execute.if.entity(Selector('@s', { tag: npc.interactorTag })).run(() => {
                execute.as(Selector('@e', { tag: npc.instanceTag, type: 'minecraft:mannequin' })).run(callback)
            })
        }
    }

    const end = MCFunction(`sections/npcs/dialogue/${id}/end`, () => {
        DialogueLineIndex('@s').reset()
        RevealingLabel('@s').remove()
        mergeDisplayText('')
        for (const npc of registry) {
            raw(`tag @a[tag=${npc.interactorTag}] remove ${npc.interactorTag}`)
        }
    })

    // functions to show each line of dialogue
    const showFns: MCFunctionClass[] = []

    // what happens after line `i` finishes/gets skipped
    const nextFns: (() => void)[] = flat.map((f) => {
        if (!f.isLastInNode) {
            const targetIndex = f.globalIndex + 1
            return () => showFns[targetIndex]()
        }
        if (f.node.next) {
            if (typeof f.node.next === 'string') {
                const nextNodeId = f.node.next
                return () => showFns[nodeFirstIndex[nextNodeId]]()
            }
            const { condition, then: thenId, else: elseId } = f.node.next
            const thenIndex = nodeFirstIndex[thenId]
            const elseIndex = nodeFirstIndex[elseId]
            return () => {
                runAsPlayer(() => {
                    _.if(typeof condition === 'function' ? condition() : condition, () => {
                        runAsMyNpc(() => showFns[thenIndex]())
                    }).else(() => {
                        runAsMyNpc(() => showFns[elseIndex]())
                    })
                })
            }
        }
        return () => end()
    })

    // clicking a still-revealing line completes it instead of skipping to the next one
    const advance = MCFunction(`sections/npcs/dialogue/${id}/advance`, () => {
        _.switch(DialogueLineIndex('@s'), flat.map((f) => ['case', f.globalIndex, () => {
            _.if(RevealCount('@s').lessThan(RevealTotal('@s')), () => {
                RevealCount('@s').set(RevealTotal('@s'))
                render()
            }).else(() => {
                nextFns[f.globalIndex]()
            })
        }] as const))
    })

    // (re-)renders the active line/variant at the current RevealCount
    const render = MCFunction(`sections/npcs/dialogue/${id}/render`, () => {
        _.switch(DialogueLineIndex('@s'), flat.map((f) => ['case', f.globalIndex, () => {
            const { line, globalIndex } = f
            const advanceMode = f.node.advance ?? 'click'
            const autoDelay = f.node.autoDelay ?? DEFAULT_AUTO_DELAY

            function renderRuns(runs: TextObject[]) {
                const bounds = runBoundaries(runs)
                const total = plainLength(runs)

                // find which run RevealCount currently falls into, cut its text down to
                // size, and push the whole array to the display (see revealRuns above)
                bounds.forEach(({ run, offset, length }, i) => {
                    _.if(_.and(RevealCount('@s').greaterThan(offset), RevealCount('@s').lessThanOrEqualTo(offset + length)), () => {
                        // cut = RevealCount - offset, computed via scratch score since offset is compile-time
                        RevealCutObjective('@s').set(RevealCount('@s'))
                        if (offset > 0) {
                            RevealCutObjective('@s').remove(offset)
                        }
                        if (typeof run === 'string' || !('text' in run)) {
                            throw new Error()
                        }
                        revealFull.set(run.text)
                        execute.store.result.storage(REVEAL_STORAGE, 'end', 'int', 1).run.scoreboard.players.get('@s', RevealCutObjective.name)
                        functionCmd(_computeRevealCut, 'with', 'storage', REVEAL_STORAGE)
                        // prior runs shown in full, active run's text left blank until patched below
                        revealRuns.set([...bounds.slice(0, i).map((b) => b.run), { ...run, text: '' }])
                        Data('storage', REVEAL_STORAGE, `runs[${i}].text`).set(revealCut)
                        withDisplay(() => {
                            Data('entity', '@s', 'text').set(revealRuns)
                        })
                    })
                })

                // fully revealed: fire onComplete, then either wait for a click or start
                // the auto-hold countdown
                _.if(RevealCount('@s').equalTo(total), () => {
                    if (line.onComplete) {
                        runAsPlayer(line.onComplete)
                    }
                    if (advanceMode === 'auto') {
                        RevealSpeed('@s').set(1)
                    } else {
                        RevealingLabel('@s').remove()
                    }
                })
                if (advanceMode === 'auto') {
                    _.if(RevealCount('@s').equalTo(total + autoDelay), () => {
                        RevealingLabel('@s').remove()
                        nextFns[globalIndex]()
                    })
                }
            }

            if (Array.isArray(line.variants) && line.variants.length > 0) {
                _.switch(VariantPick, line.variants.map((variant, vi) => ['case', vi, () => renderRuns(normalizeRuns(variant))] as const))
            } else {
                renderRuns(normalizeRuns(line.text ?? ''))
            }
        }] as const))
    })

    for (const f of flat) {
        const { line, globalIndex } = f
        const speed = line.speed ?? DEFAULT_SPEED

        function setupReveal() {
            DialogueLineIndex('@s').set(globalIndex)
            RevealCount('@s').set(0)
            RevealSpeed('@s').set(speed)
            RevealDelay('@s').set(speed)
            RevealingLabel('@s').add()
            mergeDisplayText('')
            if (Array.isArray(line.variants) && line.variants.length > 0) {
                _.switch(VariantPick, line.variants.map((variant, vi) => ['case', vi, () => {
                    RevealTotal('@s').set(plainLength(normalizeRuns(variant)))
                }] as const))
            } else {
                RevealTotal('@s').set(plainLength(normalizeRuns(line.text ?? '')))
            }
            if (line.onShow) {
                runAsPlayer(line.onShow)
            }
            // renders immediately so zero-length lines (onComplete-only) fire without waiting for a tick
            render()
        }

        let revealFn: () => void
        if (Array.isArray(line.variants) && line.variants.length > 0) {
            // pick a variant into VariantPick; render() reads it back via the switch above
            const dispatch = MCFunction(`sections/npcs/dialogue/${id}/line_${globalIndex}/reveal`, () => {
                execute.store.result.score(VariantPick.target, VariantPick.objective)
                    .run.random.value([0, (line.variants! as TextObject[]).length - 1], 'dialogue_variant')
                setupReveal()
            }, { lazy: true })
            revealFn = () => dispatch()
        } else {
            revealFn = () => setupReveal()
        }

        const show = line.condition
            ? MCFunction(`sections/npcs/dialogue/${id}/line_${globalIndex}/show`, () => {
                runAsPlayer(() => {
                    _.if(line.condition!, () => {
                        runAsMyNpc(() => revealFn())
                    }).else(() => {
                        runAsMyNpc(() => nextFns[globalIndex]())
                    })
                })
            }, { lazy: true })
            : MCFunction(`sections/npcs/dialogue/${id}/line_${globalIndex}/show`, () => {
                revealFn()
            }, { lazy: true })

        showFns.push(show)
    }

    const start = MCFunction(`sections/npcs/dialogue/${id}/start_impl`, () => {
        showFns[nodeFirstIndex[startNodeId]]()
    })

    return { id, start, advance, end, render }
}