import { DialogueTree } from '../DialogueTree'
import { CreateNPC } from '../NPC'
import { ProfileProperties } from './skins'

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
        properties: ProfileProperties('ca717f75e4d6a9a034e318e0d6b12994d575cb387bbdad97ebcaac2b653316a4'),
        model: 'slim'
    },
    position: [-60, 93, 59],
    lookAt: 'nearest',
    dialogue: blueTentDialogue,
})
