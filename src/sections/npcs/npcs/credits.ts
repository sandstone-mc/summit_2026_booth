import { dialog, NBT } from 'sandstone'
import { DialogueTree } from '../DialogueTree'
import { CreateNPC } from '../NPC'
import { PLACEHOLDER_SKIN } from './skins'
import { SymbolEntity } from 'sandstone/arguments';

function uuidToIntArray(uuid: string): [number, number, number, number] {
    const hex = uuid.replace(/-/g, '')
    const parts: number[] = []
    for (let i = 0; i < 4; i++) {
        const chunk = hex.substring(i * 8, i * 8 + 8)
        parts.push(Number(BigInt.asIntN(32, BigInt(`0x${chunk}`))))
    }
    return parts as [number, number, number, number]
}

type SocialType = 'github' | 'modrinth' | 'discord' | 'website' | 'instagram'

interface SocialLink {
    type: SocialType
    url: string
}

interface CreditMember {
    name: string
    minecraft: string
    role?: string
    socials?: SocialLink[]
}

interface CreditSection {
    section: string
    members: CreditMember[]
}

export const CREDITS: CreditSection[] = [
    {
        section: 'Development & Leadership',
        members: [
            { name: 'Origaming', minecraft: '75c4fe91-1f0f-4b98-b34d-0b630b2a4257', socials: [{ type: 'github', url: 'https://github.com/OrigamingWasTaken' }], role: 'Rhythm Game Showcase' },
            { name: 'Lilspartan', minecraft: '65574243-8a4d-48e8-9341-9655db14b122', socials: [{ type: 'modrinth', url: 'https://modrinth.com/user/Lilspartan' }, { type: 'github', url: 'https://github.com/Lilspartan' }], role: 'Magic Showcase, Elevator, NPCs' },
            { name: 'MulverineX', minecraft: '87f0b42b-7777-442b-9be3-d134c6727cf8', socials: [{type: 'modrinth', url: 'https://modrinth.com/user/MulverineX' }, { type: 'github', url: 'https://github.com/MulverineX' }], role: 'Sandstone Owner, Presentation, Booth Design' },
        ],
    },
    {
        section: 'Building & Art',
        members: [
            { name: 'Comqote', minecraft: '7b3a539b-224c-40b5-96a5-2f81835980fe', socials: [{ type: 'instagram', url: 'https://www.instagram.com/comqote/' }], role: 'Castle & Canal builds' },
            { name: 'Ewwwwwan', minecraft: '5a10b42b-926d-4b35-b282-72e6aa206e7e', role: 'Casino Interior & Magic Showcase builds, Logo, Stickers, Balloon' },
            { name: 'Tofetta', minecraft: '88e07a01-5212-405a-bab6-7425f373b1c1', role: 'Rhythm Showcase builds' }
        ],
    },
    {
        section: 'Shader Development',
        members: [
            { name: 'Meek', minecraft: '8c0fd7d2-bed5-411f-91b6-eed5558f55cc', socials: [{ type: 'website', url: 'https://meekhasto.rest/' }, { type: 'github', url: 'https://github.com/Meekiavelique' }], role: 'Skybox Shaders for the Rhythm Game Showcase' },
        ],
    },
    {
        section: 'Prior Art',
        members: [
            { name: 'SnaveSutit', minecraft: '10360b5a-27d5-480f-b335-4c58e679072b', socials: [{ type: 'website', url: 'https://animated-java.dev/' }, { type: 'github', url: 'https://github.com/SnaveSutit' }], role: 'Text Display Rendering in Animated Java' },
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
    { name: 'Java Minecraft Scripting Discord', url: 'https://discord.com/invite/4tzM5aXDRe', icon: 'summit_icons.discord' },
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
    const nameText: Record<string, unknown> = { text: ` ${member.name} `, font: 'minecraft:default' }
    if (member.role) {
        nameText.hover_event = {
            action: 'show_text',
            value: { text: member.role, italic: true, color: 'gray' },
        }
    }

    const socials = member.socials ?? []
    return {
        type: 'minecraft:plain_message',
        contents: [
            avatarComponent(member.minecraft),
            nameText,
            ...socials.flatMap((social, i) => {
                const icon = social.type === 'website'
                    ? { text: '🌐', click_event: { action: 'open_url', url: social.url } }
                    : {
                        font: 'summit_icons:icons',
                        translate: `summit_icons.${social.type}`,
                        click_event: { action: 'open_url', url: social.url },
                    }
                // Spacer between icons; no trailing space on the last.
                return i < socials.length - 1 ? [icon, { text: ' ' }] : [icon]
            }),
        ],
    }
}

/** Re-export so consumers (e.g. the mini-screen credits display) can
 *  reuse the exact line composition from the dialog. */
export { memberBody }

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

/** Re-export so the mini-screen credits display can reuse the same
 *  link line composition from the dialog. */
export { linkBody }

export const creditsDialog = (title: NonNullable<SymbolEntity['text_display']['text']>) => ({
    type: 'minecraft:notice',
    title,
    body: [
        ...CREDITS.flatMap((section) => [
            sectionHeader(section.section),
            ...section.members.map(memberBody),
        ]),
        { type: 'minecraft:plain_message', contents: { text: ' ' } },
        ...LINKS.map((l) => linkBody(l.name, l.url, l.icon, l.glyph)),
    ] as any,
})

/**
 * Build a single-page text component for the mini-screen credits
 * display (NOT the dialog). Returns `{ text: '', extra: [...] }` so
 * Minecraft renders the array as one multi-line text_display entity.
 *
 * Pages:
 *   - `0 .. CREDITS.length - 1` — one section per page. Bold gold header
 *     + member lines via `memberBody`. Sections with fewer than 3
 *     members are padded with empty lines so all pages have the same
 *     visual height.
 *   - `CREDITS.length` — the LINKS page. No section header; just the
 *     reusable link lines (name + icon/glyph) from the dialog.
 */
export const creditsPageContent = (sectionIdx: number) => {
    if (sectionIdx >= CREDITS.length) {
        return {
            text: '',
            extra: LINKS.flatMap((l, i) => {
                const line = linkBody(l.name, l.url, l.icon, l.glyph).contents
                return i < LINKS.length - 1 ? [...line, '\n'] : line
            }) as any,
        }
    }
    const section = CREDITS[sectionIdx]
    const padding = Math.max(0, 3 - section.members.length)
    return {
        text: '',
        extra: [
            { text: section.section, bold: true, color: 'gold' },
            '\n',
            ...section.members.flatMap((m, i) => {
                const line = memberBody(m).contents
                return i < section.members.length - 1 ? [...line, '\n'] : line
            }),
            ...Array(padding).fill('\n'),
        ] as any,
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
            lines: [{
                text: '',
                onComplete: () => dialog.show('@s', creditsDialog({ text: 'Thanks for stopping by!' })),
            }]
        }
    ],
})

CreateNPC('credits', {
    name: 'Carl',
    skin: {
        properties: {
            value:"e3RleHR1cmVzOntTS0lOOnt1cmw6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvYWRmZjRiYWJlN2Y3YzY0NzhjNzI3NTAwMDNjODE1MjMwNzA0ZjM1NjAyNTMwYzFlZWMwNzNhMTk4MzRiNjUxYSJ9fX0="
        }
    },
    position: [-75, 93, 63],
    lookAt: 'nearest',
    dialogue: creditsDialogue,
})
