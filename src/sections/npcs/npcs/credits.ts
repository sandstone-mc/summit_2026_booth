import { dialog, NBT } from 'sandstone'
import { DialogueTree } from '../DialogueTree'
import { CreateNPC } from '../NPC'
import { PLACEHOLDER_SKIN } from './skins'

function uuidToIntArray(uuid: string): [number, number, number, number] {
    const hex = uuid.replace(/-/g, '')
    const parts: number[] = []
    for (let i = 0; i < 4; i++) {
        const chunk = hex.substring(i * 8, i * 8 + 8)
        parts.push(Number(BigInt.asIntN(32, BigInt(`0x${chunk}`))))
    }
    return parts as [number, number, number, number]
}

type SocialType = 'github' | 'modrinth' | 'discord' | 'website'

interface SocialLink {
    type: SocialType
    url: string
}

interface CreditMember {
    name: string
    minecraft: string
    socials?: SocialLink[]
}

interface CreditSection {
    section: string
    members: CreditMember[]
}

// TODO: FInalize this list
const CREDITS: CreditSection[] = [
    {
        section: 'Development & Leadership',
        members: [
            { name: 'Origaming', minecraft: '75c4fe91-1f0f-4b98-b34d-0b630b2a4257', socials: [{ type: 'github', url: 'https://github.com/OrigamingWasTaken' }] },
            { name: 'Lilspartan', minecraft: '65574243-8a4d-48e8-9341-9655db14b122', socials: [{ type: 'modrinth', url: 'https://modrinth.com/user/Lilspartan' }, { type: 'github', url: 'https://github.com/Lilspartan' }] },
            { name: 'MulverineX', minecraft: '87f0b42b-7777-442b-9be3-d134c6727cf8', socials: [{ type: 'github', url: 'https://github.com/MulverineX' }] },
        ],
    },
    {
        section: 'Building & Art',
        members: [
            { name: 'Comqote', minecraft: '7b3a539b-224c-40b5-96a5-2f81835980fe' },
            { name: 'Ewwwwwan', minecraft: '5a10b42b-926d-4b35-b282-72e6aa206e7e' },
        ],
    },
    {
        section: 'Shader Development',
        members: [
            { name: 'Meek', minecraft: '8c0fd7d2-bed5-411f-91b6-eed5558f55cc', socials: [{ type: 'website', url: 'https://meekhasto.rest/' }, { type: 'github', url: 'https://github.com/Meekiavelique' }] },
        ],
    },
    {
        section: 'Prior Art',
        members: [
            { name: 'Snave', minecraft: '10360b5a-27d5-480f-b335-4c58e679072b', socials: [{ type: 'website', url: 'https://animated-java.dev/' }, { type: 'github', url: 'https://github.com/SnaveSutit' }] },
        ],
    },
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

function avatarComponent(uuid: string) {
    return {
        type: 'object',
        object: 'player',
        player: { id: NBT.intArray(uuidToIntArray(uuid)) },
        hat: true,
    }
}

function sectionHeader(name: string) {
    return {
        type: 'minecraft:plain_message',
        contents: { text: name, color: 'gold', bold: true },
    }
}

function memberBody(member: CreditMember) {
    return {
        type: 'minecraft:plain_message',
        contents: [
            avatarComponent(member.minecraft),
            { text: ` ${member.name} `, font: 'minecraft:default' },
            ...(member.socials ?? []).map((social) =>
                social.type === 'website'
                    ? { text: '🌐', click_event: { action: 'open_url', url: social.url } }
                    : {
                        font: 'summit_icons:icons',
                        translate: `summit_icons.${social.type}`,
                        click_event: { action: 'open_url', url: social.url },
                    }
            ),
        ],
    }
}

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
                            ...CREDITS.flatMap((section) => [
                                sectionHeader(section.section),
                                ...section.members.map(memberBody),
                            ]),
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
