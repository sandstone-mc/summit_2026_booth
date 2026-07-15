import { DialogueTree } from '../DialogueTree'
import { CreateNPC, type NPCOptions } from '../NPC'
import { PLACEHOLDER_SKIN } from './skins'

const presentationWatcherDialogue = DialogueTree('casino_crowd_1', {
    nodes: [{
        id: 'main',
        advance: 'click',
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

const merchFiendDialogue = DialogueTree('casino_crowd_2', {
    nodes: [{
        id: 'main',
        advance: 'click',
        lines: [
            {
                variants: [
                    "If I'm being completely honest with you... I'm just here for the merch",
                    "I don't understand any of what is going on here, this whole island confuses me",
                    "I came to the Sandstone booth and all I got was this shirt.\n\nAnd I couldn't be happier",
                    "There's a whole lot of words on that screen, give me another balloon!",
                    "I can't find this last sticker!"
                ],
            },
        ],
    }],
})

const gamblerDialogue = DialogueTree('casino_crowd_3', {
    nodes: [{
        id: 'main',
        advance: 'click',
        lines: [
            {
                variants: [
                    "All in on red!",
                    "I keep betting but this wheel never spins..."
                ],
            },
        ],
    }],
})

const CROWD: (Omit<NPCOptions, 'name'> & { id: string })[] = [
    { id: 'casino_crowd_1', position: [-85, 84.5, 55], rotation: [210, 0], pose: 'sitting', dialogue: presentationWatcherDialogue, lookAt: 'interactor', skin: {
        properties: {
            value:"e3RleHR1cmVzOntTS0lOOnt1cmw6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZTUyOGViMmQ3ZjczZWVkN2JlYjY2NWMxNzliYjJiM2VkNjUzM2Y0NTljNTM5YTJhYzZlMjRhNDRlNDRmZWRhYiJ9fX0="
        }
    } },
    { id: 'casino_crowd_2', position: [-55, 85, 62], rotation: [90, 0], pose: 'standing', dialogue: merchFiendDialogue, lookAt: 'interactor', skin: { properties: {
        value:"e3RleHR1cmVzOntTS0lOOnt1cmw6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvMTJmN2Y1YmQwM2IyZTIyYzQ4MzJlNzVkZTY1MzhiNWY1ZjcyNGIxOTZkMjAxZTM0ZWFhZGFkMzg4ZmRkZGEwYiJ9fX0="
    }, model: 'slim' } },
    { id: 'casino_crowd_3', position: [-74, 74, 53], rotation: [180, 0], pose: 'crouching', dialogue: gamblerDialogue, lookAt: 'none', mainHand: 'minecraft:diamond', skin: PLACEHOLDER_SKIN },
]

for (const { id, ...options } of CROWD) {
    CreateNPC(id, { ...options, name: 'Casino Patron' })
}
