import { _, data, execute, MCFunction, type MCFunctionClass, raw, say, Selector, sleep, tellraw } from 'sandstone'
import { type JSONTextComponent } from 'sandstone/arguments'
import { DialogueLineIndex, NpcDisplayLabel } from './NPC'

// ticks per revealed character
const DEFAULT_SPEED = 1

// ticks to hold a fully-revealed line before auto advancing
const DEFAULT_AUTO_DELAY = 40

export interface DialogueLine {
    text: string | JSONTextComponent[]

    // Ticks per revealed character for this line. Defaults to 2
    speed?: number
    
    // Runs as the interactor right when this line starts appearing
    onShow?: () => void

    // Runs as the interactor once this line has fully revealed
    onComplete?: () => void
}

export interface DialogueTreeOptions {
    lines: DialogueLine[]
    advance?: 'click' | 'auto'
    autoDelay?: number
}

export interface DialogueTree {
    id: string
    
    // Run as the NPC to start this dialogue at line 0 
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

export function DialogueTree(id: string, options: DialogueTreeOptions): DialogueTree {
    const { lines, advance: advanceMode = 'click', autoDelay = DEFAULT_AUTO_DELAY } = options
    if (lines.length === 0) {
        throw new Error(`DialogueTree "${id}" needs at least one line`)
    }

    // TODO: this will not work if the dialogue tree and NPC have different IDs
    const interactorTag = `sandstone_summit_booth.npc.${id}.interactor` as `${any}${string}`

    // runs a line hook as the player currently talking to this npc
    function runAsPlayer(callback: () => void) {
        execute.as(Selector('@a', { tag: interactorTag, limit: 1 })).run(callback)
    }

    // functions to show each line of dialogue
    const showFns: MCFunctionClass[] = []

    const end = MCFunction(`sections/npcs/dialogue/${id}/end`, () => {
        DialogueLineIndex('@s').reset()
        mergeDisplayText('')
        raw(`tag @a[tag=${interactorTag}] remove ${interactorTag}`)
    })

    const advance = MCFunction(`sections/npcs/dialogue/${id}/advance`, () => {
        _.switch(DialogueLineIndex('@s'), lines.map((_line, i) => {
            const goToNext = i + 1 < lines.length ? () => showFns[i + 1]() : () => end()
            return ['case', i, goToNext] as const
        }))
    })

    for (let i = 0; i < lines.length; i++) {
        const { text, speed = DEFAULT_SPEED, onShow, onComplete } = lines[i]
        const runs = normalizeRuns(text)
        const length = plainLength(runs)

        const show = MCFunction(`sections/npcs/dialogue/${id}/line_${i}/show`, async () => {
            DialogueLineIndex('@s').set(i)
            mergeDisplayText('')
            if (onShow) {
                runAsPlayer(onShow)
            }
            for (let n = 1; n <= length; n++) {
                sleep(`${speed}t`)
                _.if(DialogueLineIndex('@s').equalTo(i), () => {
                    mergeDisplayText(revealedPrefix(runs, n))
                })
            }
            _.if(DialogueLineIndex('@s').equalTo(i), () => {
                if (onComplete) {
                    runAsPlayer(onComplete)
                }
            })
            if (advanceMode === 'auto') {
                sleep(`${autoDelay}t`)
                _.if(DialogueLineIndex('@s').equalTo(i), () => {
                    advance()
                })
            }
        }, { lazy: true, asyncContext: true })

        showFns.push(show)
    }

    const start = MCFunction(`sections/npcs/dialogue/${id}/start_impl`, () => {
        showFns[0]()
    })

    return { id, start, advance, end }
}