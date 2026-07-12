import { _, data, execute, MCFunction, type MCFunctionClass, Objective, raw, Selector, sleep, type Condition } from 'sandstone'
import { type JSONTextComponent } from 'sandstone/arguments'
import { DialogueLineIndex, NpcDisplayLabel, registry } from './NPC'

// ticks per revealed character
const DEFAULT_SPEED = 1

// ticks to hold a fully-revealed line before auto advancing
const DEFAULT_AUTO_DELAY = 40

const VariantPickObjective = Objective.create('npc.dialogue.variant')
const VariantPick = VariantPickObjective('@s')

export interface DialogueLine {
    // Static text. Ignored if `variants` is set
    text?: string | JSONTextComponent[]
    
    // Pick one at random each time this line plays
    variants?: (string | JSONTextComponent[])[]
    
    // Skip this line (falls through to whatever comes next) if this evaluates false
    condition?: Condition

    // Ticks per revealed character for this line. Defaults to 2
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
    next?: string
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
}

// merges text onto the NPC text display
function mergeDisplayText(text: string | JSONTextComponent[]) {
    execute.at('@s').run(() => {
        execute.as(Selector('@e', { type: 'minecraft:text_display', tag: NpcDisplayLabel, distance: [0, 2] })).run(() => {
            data.merge.entity('@s', { text })
        })
    })
}

type TextRun = { text: string } & Record<string, unknown>
function normalizeRuns(text: string | JSONTextComponent[]): TextRun[] {
    if (typeof text === 'string') return [{ text }]
    return text.map((component) => (typeof component === 'string' ? { text: component } : component as TextRun))
}

function plainLength(runs: TextRun[]): number {
    return runs.reduce((sum, run) => sum + run.text.length, 0)
}

function revealedPrefix(runs: TextRun[], n: number): TextRun[] {
    const result: TextRun[] = []
    let remaining = n
    for (const run of runs) {
        if (remaining <= 0) break
        if (run.text.length <= remaining) {
            result.push(run)
            remaining -= run.text.length
        } else {
            result.push({ ...run, text: run.text.substring(0, remaining) })
            remaining = 0
        }
    }
    return result
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

    function runAsPlayer(callback: () => void) {
        for (const npc of registry) {
            execute.if.entity(Selector('@s', { tag: npc.instanceTag })).run(() => {
                execute.as(Selector('@a', { tag: npc.interactorTag, limit: 1 })).run(callback)
            })
        }
    }

    function runAsMyNpc(callback: () => void) {
        for (const npc of registry) {
            execute.if.entity(Selector('@s', { tag: npc.interactorTag })).run(() => {
                execute.as(Selector('@e', { tag: npc.instanceTag, type: 'minecraft:mannequin' })).run(callback)
            })
        }
    }

    const end = MCFunction(`sections/npcs/dialogue/${id}/end`, () => {
        DialogueLineIndex('@s').reset()
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
            const nextNodeId = f.node.next
            return () => showFns[nodeFirstIndex[nextNodeId]]()
        }
        return () => end()
    })

    const advance = MCFunction(`sections/npcs/dialogue/${id}/advance`, () => {
        _.switch(DialogueLineIndex('@s'), flat.map((f) => ['case', f.globalIndex, () => nextFns[f.globalIndex]()] as const))
    })

    for (const f of flat) {
        const { line, globalIndex } = f
        const speed = line.speed ?? DEFAULT_SPEED
        const advanceMode = f.node.advance ?? 'click'
        const autoDelay = f.node.autoDelay ?? DEFAULT_AUTO_DELAY

        function buildRevealChain(pathSuffix: string, runs: TextRun[]): MCFunctionClass {
            const length = plainLength(runs)
            return MCFunction(`sections/npcs/dialogue/${id}/line_${globalIndex}/${pathSuffix}`, async () => {
                DialogueLineIndex('@s').set(globalIndex)
                mergeDisplayText('')
                if (line.onShow) {
                    runAsPlayer(line.onShow)
                }
                for (let n = 1; n <= length; n++) {
                    sleep(`${speed}t`)
                    _.if(DialogueLineIndex('@s').equalTo(globalIndex), () => {
                        mergeDisplayText(revealedPrefix(runs, n))
                    })
                }
                _.if(DialogueLineIndex('@s').equalTo(globalIndex), () => {
                    if (line.onComplete) {
                        runAsPlayer(line.onComplete)
                    }
                })
                if (advanceMode === 'auto') {
                    sleep(`${autoDelay}t`)
                    _.if(DialogueLineIndex('@s').equalTo(globalIndex), () => {
                        nextFns[globalIndex]()
                    })
                }
            }, { lazy: true, asyncContext: true })
        }

        let revealFn: () => void
        if (line.variants && line.variants.length > 0) {
            const variantChains = line.variants.map((variant, vi) => buildRevealChain(`variant_${vi}`, normalizeRuns(variant)))
            const dispatch = MCFunction(`sections/npcs/dialogue/${id}/line_${globalIndex}/reveal`, () => {
                execute.store.result.score(VariantPick.target, VariantPick.objective)
                    .run.random.value([0, variantChains.length - 1], 'dialogue_variant')
                _.switch(VariantPick, variantChains.map((fn, vi) => ['case', vi, () => fn()] as const))
            }, { lazy: true })
            revealFn = () => dispatch()
        } else {
            const chain = buildRevealChain('reveal', normalizeRuns(line.text ?? ''))
            revealFn = () => chain()
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

    return { id, start, advance, end }
}