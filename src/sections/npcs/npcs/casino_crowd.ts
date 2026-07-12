import { DialogueTree } from '../DialogueTree'
import { CreateNPC, type NPCOptions } from '../NPC'
import { PLACEHOLDER_SKIN } from './skins'

const presentationWatcherDialogue = DialogueTree('casino_crowd_1', {
    nodes: [{
        id: 'main',
        advance: 'auto',
        lines: [
            {
                variants: [
                    "This presentation is amazing, right?",
                    "I've already watched this fifteen times.\nStill good.",
                    "Best seat in the house for the show.",
                ],
            },
        ],
    }],
})

const CROWD: (Omit<NPCOptions, 'skin' | 'name'> & { id: string })[] = [
    { id: 'casino_crowd_1', position: [-85, 84.5, 55], rotation: [210, 0], pose: 'sitting', dialogue: presentationWatcherDialogue },
]

for (const { id, ...options } of CROWD) {
    CreateNPC(id, { ...options, name: 'Casino Patron', skin: PLACEHOLDER_SKIN })
}
