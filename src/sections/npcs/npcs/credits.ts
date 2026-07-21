import { dialog } from 'sandstone'
import { DialogueTree } from '../DialogueTree'
import { CreateNPC } from '../NPC'
import { PLACEHOLDER_SKIN } from './skins'

interface Contributor {
    name: string
    role: string
    url?: string
    icon?: string
}

// TODO: FInalize this list
const CONTRIBUTORS: Contributor[] = [
    { name: 'MulverineX', role: 'Sandstone Maintainer', url: 'https://github.com/MulverineX', icon: 'summit_icons.github' },
    { name: 'Origaming_', role: 'Rhythm Showcase', url: 'https://github.com/OrigamingWasTaken', icon: 'summit_icons.github' },
    { name: 'LilSpartan904', role: 'Magic Showcase', url: 'https://github.com/Lilspartan', icon: 'summit_icons.github' },
    { name: 'Comqote', role: 'Booth Build' },
    { name: 'Ewwwwwan', role: 'Stickers, Balloon, and Casino Build' },
    { name: 'Meek', role: 'Rhythm Showcase Shaders', url: 'https://github.com/Meekiavelique', icon: 'summit_icons.github' }
]

interface ResourceLink {
    name: string
    url: string
    icon?: string
    glyph?: string
}

const LINKS: ResourceLink[] = [
    { name: 'Sandstone Docs', url: 'https://sandstone.dev', glyph: '🌐' },
    { name: 'Sandstone GitHub', url: 'https://github.com/sandstone-mc/sandstone', icon: 'summit_icons.github' },
    { name: 'JMCS Discord', url: 'https://discord.com/invite/4tzM5aXDRe', icon: 'summit_icons.discord' },
]

function linkBody(name: string, url: string, icon?: string, glyph?: string) {
    return {
        type: 'minecraft:plain_message',
        contents: [
            { text: ` ${name} `, font: 'minecraft:default' },
            icon
                ? { font: 'summit_icons:icons', translate: icon, click_event: { action: 'open_url', url } }
                : glyph
                    ? { text: glyph, click_event: { action: 'open_url', url } }
                    : "",
        ],
    }
}

const creditsDialogue = DialogueTree('credits', {
    nodes: [
        {
            id: 'main',
            advance: 'click',
            lines: [
                { text: "This whole thing didn't build itself, you know." },
                { text: 'A bunch of people poured lots time into making this booth happen.' },
                { text: 'Click me again and I\'ll tell you about them.' },
            ],
            next: 'credits'
        },
        {
            id: 'credits',
            advance: 'auto',
            lines: [
                { 
                    text: '',
                    onComplete: () => dialog.show('@s', {
                        type: 'minecraft:notice',
                        title: { text: 'Thanks for stopping by!' },
                        body: [
                            ...CONTRIBUTORS.map((c) => linkBody(`${c.name} - ${c.role}`, c.url || "", c.icon)),
                            { type: 'minecraft:plain_message', contents: { text: ' ' } },
                            ...LINKS.map((l) => linkBody(l.name, l.url, l.icon, l.glyph)),
                        ] as any,
                    }),
                }
            ]
        }
    ],
})

CreateNPC('credits', {
    name: 'Carl',
    skin: PLACEHOLDER_SKIN,
    position: [-75, 93, 63],
    lookAt: 'nearest',
    dialogue: creditsDialogue,
})
