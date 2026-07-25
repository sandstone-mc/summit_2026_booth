import { DialogueTree } from '../DialogueTree'
import { CreateNPC, NPCHeldItemWithComponents, type NPCOptions } from '../NPC'
import { ProfileProperties } from './skins'
import { functionCmd, NBT } from 'sandstone'

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
                    "I can't find this last sticker!",
                    "I got lost in the jungle for a little bit earlier, but I'm not too worried because I got a sick banner out of it!"
                ],
            }
        ],
        next: 'choice'
    },
    {
        id: 'choice',
        lines: [
            { text: "Talk to me again and I might just let you have one of these extra balloons I got." }
        ],
        next: 'balloon'
    },
    {
        id: 'balloon',
        advance: 'auto',
        lines: [
            {
                text: 'Here you go.',
                onComplete: () => {
                    functionCmd('summit.balloon:give/sandstone_summit_booth/sand_castle')
                }
            }
        ]
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
                    "I keep betting but this wheel never spins...",
                    "Let it ride!!!!"
                ],
            },
        ],
    }],
})

const balloonBundleHeldItem: NPCHeldItemWithComponents = {
    id: 'minecraft:bundle',
    count: NBT.int(1),
    components: {
        'minecraft:item_model': 'summit_balloons:balloon_bundle',
        'minecraft:custom_model_data': {
            floats: [3],
            strings: [
                'sandstone_summit_booth.sand_castle',
                'sandstone_summit_booth.sand_castle',
                'sandstone_summit_booth.sand_castle',
            ],
        },
        'minecraft:custom_data': {
            summit: {
                balloon: {
                    stamp: '00c50030-a86a-490c-8134-aebc531cbe84',
                    bundle: true,
                    count: NBT.int(3),
                },
            },
        },
    },
}

const CROWD: (Omit<NPCOptions, 'name'> & { id: string })[] = [
    { id: 'casino_crowd_1', position: [-85, 84.5, 55], rotation: [210, 0], pose: 'sitting', dialogue: presentationWatcherDialogue, lookAt: 'interactor', skin: {
        properties: ProfileProperties('e528eb2d7f73eed7beb665c179bb2b3ed6533f459c539a2ac6e24a44e44fedab'),
    }},
    { id: 'casino_crowd_2', position: [-55, 85, 62], rotation: [90, 0], pose: 'standing', dialogue: merchFiendDialogue, lookAt: 'interactor', mainHand: balloonBundleHeldItem, skin: {
        properties: ProfileProperties('12f7f5bd03b2e22c4832e75de6538b5f5f724b196d201e34eaadad388fddda0b'),
        model: 'slim',
    }},
    { id: 'casino_crowd_3', position: [-74, 74, 53], rotation: [180, 0], pose: 'crouching', dialogue: gamblerDialogue, lookAt: 'none', mainHand: 'minecraft:diamond', skin: {
        properties: ProfileProperties('e98928001556810034fa2fa8bb77453e8d1072c53f3e0bfa93527261685df1a7'),
        model: 'slim',
    }},
]

for (const { id, ...options } of CROWD) {
    CreateNPC(id, { ...options, name: 'Casino Patron' })
}
