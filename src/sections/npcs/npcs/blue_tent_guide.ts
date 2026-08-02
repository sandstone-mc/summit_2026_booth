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
        properties: ProfileProperties('3cb978a6709823e1b887cccaef82f8e7385b1969e0225c49186de55776bbc92b'),
    },
    position: [-60, 93, 59],
    lookAt: 'nearest',
    dialogue: blueTentDialogue,
})
