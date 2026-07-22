import { DialogueTree } from '../DialogueTree'
import { CreateNPC } from '../NPC'
import { PLACEHOLDER_SKIN } from './skins'

const blueTentDialogue = DialogueTree('blue_tent_guide', {
    nodes: [{
        id: 'main',
        advance: 'click',
        lines: [
            { text: "Welcome to the Sandstone booth!\nThere's plenty to check out around here." },
            { text: 'Head downstairs and you\'ll find an informative presentation all about Sandstone!' },
            { text: 'Keep going down the elevator and you\'ll be able to play a couple demos of projects built in the Sandstone betas.' },
            { text: "Go on and explore a bit! You won't regret it." },
        ],
    }],
})

CreateNPC('blue_tent_guide', {
    name: 'Greg',
    skin: {
        properties: {
            value:"e3RleHR1cmVzOntTS0lOOnt1cmw6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvY2E3MTdmNzVlNGQ2YTlhMDM0ZTMxOGUwZDZiMTI5OTRkNTc1Y2IzODdiYmRhZDk3ZWJjYWFjMmI2NTMzMTZhNCJ9fX0="
        }, model: 'slim'
    },
    position: [-60, 93, 59],
    lookAt: 'nearest',
    dialogue: blueTentDialogue,
})
