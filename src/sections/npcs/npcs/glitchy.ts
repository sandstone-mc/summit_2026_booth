import { advancement, Selector } from 'sandstone'
import { DialogueTree } from '../DialogueTree'
import { CreateNPC } from '../NPC'
import { PLACEHOLDER_SKIN, ProfileProperties } from './skins'

const HIDDEN_STICKER_ADVANCEMENT = 'summit.sticker_book:sandstone_summit_booth/hidden'

const secretDialogue = DialogueTree('glitchy', {
    nodes: [{
        id: 'main',
        advance: 'click',
        lines: [
            { text: [
                    { text: 'aaaaaaaaaaa', obfuscated: true }
                ]
            },
            {
                variants: [
                    [
                        { text: 'This whole booth?\nJust lines of ' },
                        { text: 'code', color: 'light_purple' },
                        { text: '.\nIt\'s ' },
                        { text: 'TypeScript', color: 'blue' },
                        { text: ' all the way down.' },
                    ],
                    "Truth is I'm not even a real player, I'm just a mannequin",
                ],
            },
            {
                variants: [
                    "And guess what...\n\nThey don't want you to know this, but this whole island is just a simulation",
                    "Don't tell the others, but I think that Smithie is in on the conspiracy...",
                ],
            },
            {
                text: " . . . ",
                speed: 2
            },
            {
                text: "Anyway. Now you know the secret. Take this as a token of your new knowledge.",
                // skip if they've already been granted the sticker on a prior visit
                condition: Selector('@s', { advancements: { [HIDDEN_STICKER_ADVANCEMENT]: false } }),
                // Grants hidden sticker "What was that guy rambling about?"
                onComplete: () => advancement.grant('@s').only(HIDDEN_STICKER_ADVANCEMENT),
            },
        ],
    }],
})

CreateNPC('glitchy', {
    name: 'glitchy',
    skin: {
        properties: ProfileProperties('e65c67e0fc054e5990018159db151ad55b70aed81eabe83b20d3f35528a00285'),
        model: 'slim'
    },
    position: [-82, 104, 48],
    lookAt: 'interactor',
    dialogue: secretDialogue,
})
