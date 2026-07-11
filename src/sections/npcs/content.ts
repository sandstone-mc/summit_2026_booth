import { advancement, Dialog, dialog } from 'sandstone'
import { DialogueTree } from './DialogueTree'
import { CreateNPC } from './NPC'

const blueTentDialogue = DialogueTree('blue_tent_guide', {
    lines: [
        { text: "Welcome to the Sandstone booth!\nThere's plenty to check out around here." },
        { text: 'Head downstairs and you\'ll find an informative presentation all about Sandstone!' },
        { text: 'Keep going down the elevator and you\'ll be able to play a couple demos of projects built in the Sandstone betas.' },
        { text: "Go on and explore a bit! You won't regret it." },
    ],
    advance: 'click',
})

CreateNPC('blue_tent_guide', {
    name: 'Greg',
    skin: { 
        signature: 'FTCqCqR0H++f9cUNR1kAeSjGybzm9PWzju3sELylI/ZrJjZfH7YfkkSBRxp+eUngorLENDtdHS7hs2bOrjPJWytYMsQiQAWFOOsX1VrBBW/VNp5vWgx6PtD5MaaDJ6f4fea3VV80DshquyU1xt3T/09Gb0mDv/ECJJpvf52TbErMmf/lzYMsC5E6O/79rSVGkajvAMwFc38mvdWv7WtVeh4eELnGpNsc38a3pS5hxT/BNmYa7WkniZNw3/P4q8vQfFj6GXxg3QQPPu6uKGIutk+JquFJjNxoS6oLM6NgI/7SqrId8MrntMzsZDOlK6Pu42p/2vMb/T5d5VCPNWswTwIJG/E23wWD2EV0HmBqsgZ1v9NeDNk3q8iXbY0f7qA86VjBJyJr9M/Hywx2IO+MSXOgrAeM476JA7r32bhFWX1KsqFxUf7gObyAuZsJmfehA8cdSEKhVyZU6MqcyJfLgqnKqVJp3zHZ85NZGzkwjSVi7R64mspTPqnHkLItzpzcmOc3p/InpQCQ32qtCV4FnGUkKHsRdao4RJyeSM+F8/2UxpBVF73Zw9oNo+d4nQtw9sXOhNnc2E5nwguRclUWYLZrL0b3N+aHjFlQJrfQq85ETaHPLE7S1gR79EaOIZARP7pNK0QauGu+Wqoh38iZL0Hg2mK+csowPCgeBK3SneQ=',
        texture:'ewogICJ0aW1lc3RhbXAiIDogMTc4Mzc0ODUxMTQ2NiwKICAicHJvZmlsZUlkIiA6ICJhN2Y3MzllNmFmY2U0ZGY3ODM3YmJhZWY1MzUyNWMzZiIsCiAgInByb2ZpbGVOYW1lIiA6ICJWM24wbW1YXyIsCiAgInNpZ25hdHVyZVJlcXVpcmVkIiA6IHRydWUsCiAgInRleHR1cmVzIiA6IHsKICAgICJTS0lOIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS8zY2Q4ZjAyNTAxNzg1ZDE2YjA5M2Y0ZDY1OTY5OGE3OWZjZDUwYTAwOTRmNTMzNDlkNDhkNjYzMmZjNmUxMzJkIiwKICAgICAgIm1ldGFkYXRhIiA6IHsKICAgICAgICAibW9kZWwiIDogInNsaW0iCiAgICAgIH0KICAgIH0KICB9Cn0=' 
    },
    position: [-60, 93, 59],
    lookAt: 'nearest',
    dialogue: blueTentDialogue,
})

const redTentDialogue = DialogueTree('red_tent_sandstone', {
    lines: [
        { text: "I have no idea what Sandstone is..." },
        { text: "Wait, yes I do it's right in this script they gave me.\n\nLet me see . . . " },
        { text: "Right!\nSandstone is a framework for writing datapacks in real TypeScript instead of raw commands." },
        { text: "You get autocomplete, type-checking, reusable functions... the stuff you'd expect from real software, but for vanilla Minecraft." },
        { text: [
            { text: "*That sounds too good to be true*", color: 'gray', italic: true }
        ], speed: 2 },
        { text: 'No mods, no plugins needed. It all compiles down to a normal datapack anyone can drop into their world.' },
        { text: 'Everything you\'ll see here started out as TypeScript!' },
    ],
    advance: 'click',
})

CreateNPC('red_tent_sandstone', {
    name: 'James',
    skin: { 
        signature: 'FTCqCqR0H++f9cUNR1kAeSjGybzm9PWzju3sELylI/ZrJjZfH7YfkkSBRxp+eUngorLENDtdHS7hs2bOrjPJWytYMsQiQAWFOOsX1VrBBW/VNp5vWgx6PtD5MaaDJ6f4fea3VV80DshquyU1xt3T/09Gb0mDv/ECJJpvf52TbErMmf/lzYMsC5E6O/79rSVGkajvAMwFc38mvdWv7WtVeh4eELnGpNsc38a3pS5hxT/BNmYa7WkniZNw3/P4q8vQfFj6GXxg3QQPPu6uKGIutk+JquFJjNxoS6oLM6NgI/7SqrId8MrntMzsZDOlK6Pu42p/2vMb/T5d5VCPNWswTwIJG/E23wWD2EV0HmBqsgZ1v9NeDNk3q8iXbY0f7qA86VjBJyJr9M/Hywx2IO+MSXOgrAeM476JA7r32bhFWX1KsqFxUf7gObyAuZsJmfehA8cdSEKhVyZU6MqcyJfLgqnKqVJp3zHZ85NZGzkwjSVi7R64mspTPqnHkLItzpzcmOc3p/InpQCQ32qtCV4FnGUkKHsRdao4RJyeSM+F8/2UxpBVF73Zw9oNo+d4nQtw9sXOhNnc2E5nwguRclUWYLZrL0b3N+aHjFlQJrfQq85ETaHPLE7S1gR79EaOIZARP7pNK0QauGu+Wqoh38iZL0Hg2mK+csowPCgeBK3SneQ=',
        texture:'ewogICJ0aW1lc3RhbXAiIDogMTc4Mzc0ODUxMTQ2NiwKICAicHJvZmlsZUlkIiA6ICJhN2Y3MzllNmFmY2U0ZGY3ODM3YmJhZWY1MzUyNWMzZiIsCiAgInByb2ZpbGVOYW1lIiA6ICJWM24wbW1YXyIsCiAgInNpZ25hdHVyZVJlcXVpcmVkIiA6IHRydWUsCiAgInRleHR1cmVzIiA6IHsKICAgICJTS0lOIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS8zY2Q4ZjAyNTAxNzg1ZDE2YjA5M2Y0ZDY1OTY5OGE3OWZjZDUwYTAwOTRmNTMzNDlkNDhkNjYzMmZjNmUxMzJkIiwKICAgICAgIm1ldGFkYXRhIiA6IHsKICAgICAgICAibW9kZWwiIDogInNsaW0iCiAgICAgIH0KICAgIH0KICB9Cn0=' 
    },
    position: [-68, 93, 54],
    lookAt: 'nearest',
    dialogue: redTentDialogue,
})

interface Contributor {
    name: string
    role: string
    url: string
}

// TODO: FInalize this list
const CONTRIBUTORS: Contributor[] = [
    { name: 'MulverineX', role: 'Sandstone Maintainer', url: 'https://github.com/MulverineX' },
    { name: 'Ori', role: 'Rhythm Showcase', url: 'https://github.com/OrigamingWasTaken' },
    { name: 'LilSpartan', role: 'Magic Showcase', url: 'https://github.com/Lilspartan' },
    // { name: 'Ewan', role: 'Stickers, Balloon, and Casino Build', url: 'h' },
    // { name: 'Comqote', role: 'Booth Build', url: 'h' },
    // { name: 'Meek', role: 'Rhythm Showcase Shaders', url: 'h' }
]

const creditsDialogue = DialogueTree('credits', {
    lines: [
        // { text: "This whole thing didn't build itself, you know." },
        // { text: 'A bunch of people poured lots time into making this booth happen.' },
        {
            text: '',
            onComplete: () => dialog.show('@s', {
                type: 'minecraft:notice',
                title: { text: 'Thanks for stopping by!' },
                body: CONTRIBUTORS.map((contributor) => ({
                    type: 'minecraft:plain_message',
                    contents: {
                        text: `${contributor.name} - ${contributor.role}`,
                        click_event: { action: 'open_url', url: contributor.url },
                    },
                })) as any,
            }),
        },
    ],
    advance: 'click',
})

CreateNPC('credits', {
    name: 'Carl',
    skin: { 
        signature: 'FTCqCqR0H++f9cUNR1kAeSjGybzm9PWzju3sELylI/ZrJjZfH7YfkkSBRxp+eUngorLENDtdHS7hs2bOrjPJWytYMsQiQAWFOOsX1VrBBW/VNp5vWgx6PtD5MaaDJ6f4fea3VV80DshquyU1xt3T/09Gb0mDv/ECJJpvf52TbErMmf/lzYMsC5E6O/79rSVGkajvAMwFc38mvdWv7WtVeh4eELnGpNsc38a3pS5hxT/BNmYa7WkniZNw3/P4q8vQfFj6GXxg3QQPPu6uKGIutk+JquFJjNxoS6oLM6NgI/7SqrId8MrntMzsZDOlK6Pu42p/2vMb/T5d5VCPNWswTwIJG/E23wWD2EV0HmBqsgZ1v9NeDNk3q8iXbY0f7qA86VjBJyJr9M/Hywx2IO+MSXOgrAeM476JA7r32bhFWX1KsqFxUf7gObyAuZsJmfehA8cdSEKhVyZU6MqcyJfLgqnKqVJp3zHZ85NZGzkwjSVi7R64mspTPqnHkLItzpzcmOc3p/InpQCQ32qtCV4FnGUkKHsRdao4RJyeSM+F8/2UxpBVF73Zw9oNo+d4nQtw9sXOhNnc2E5nwguRclUWYLZrL0b3N+aHjFlQJrfQq85ETaHPLE7S1gR79EaOIZARP7pNK0QauGu+Wqoh38iZL0Hg2mK+csowPCgeBK3SneQ=',
        texture:'ewogICJ0aW1lc3RhbXAiIDogMTc4Mzc0ODUxMTQ2NiwKICAicHJvZmlsZUlkIiA6ICJhN2Y3MzllNmFmY2U0ZGY3ODM3YmJhZWY1MzUyNWMzZiIsCiAgInByb2ZpbGVOYW1lIiA6ICJWM24wbW1YXyIsCiAgInNpZ25hdHVyZVJlcXVpcmVkIiA6IHRydWUsCiAgInRleHR1cmVzIiA6IHsKICAgICJTS0lOIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS8zY2Q4ZjAyNTAxNzg1ZDE2YjA5M2Y0ZDY1OTY5OGE3OWZjZDUwYTAwOTRmNTMzNDlkNDhkNjYzMmZjNmUxMzJkIiwKICAgICAgIm1ldGFkYXRhIiA6IHsKICAgICAgICAibW9kZWwiIDogInNsaW0iCiAgICAgIH0KICAgIH0KICB9Cn0=' 
    },
    position: [-75, 93, 63],
    lookAt: 'nearest',
    dialogue: creditsDialogue,
})

const secretDialogue = DialogueTree('glitchy', {
    lines: [
        { text: '[DEBUG] Running function "sandstone_summit_booth:sections/npcs/dialogue/glitchy/line_0/show"' },
        { text: [
                { text: 'aaaaaaaaaaa', obfuscated: true }
            ] 
        },
        {
            text: [
                { text: 'This whole booth?\nJust lines of ' },
                { text: 'code', color: 'light_purple' },
                { text: '.\nIt\'s ' }, 
                { text: 'TypeScript', color: 'blue' }, 
                { text: ' all the way down.' },
            ],
        },
        {
            text: "And guess what...\n\nThey don't want you to know this, but this whole world is just a simulation"
        },
        {
            text: " . . . ",
            speed: 2
        },
        {
            text: "Anyway. Now you know the secret. Take this as a token of your new knowledge.",
            // Grants hidden sticker "What was that guy rambling about?"
            onComplete: () => advancement.grant('@s').only('summit.sticker_book:sandstone_summit_booth/hidden'),
        },
    ],
    advance: 'click',
})

CreateNPC('secret_glitch', {
    name: 'Sandy',
    skin: { 
        signature: 'FTCqCqR0H++f9cUNR1kAeSjGybzm9PWzju3sELylI/ZrJjZfH7YfkkSBRxp+eUngorLENDtdHS7hs2bOrjPJWytYMsQiQAWFOOsX1VrBBW/VNp5vWgx6PtD5MaaDJ6f4fea3VV80DshquyU1xt3T/09Gb0mDv/ECJJpvf52TbErMmf/lzYMsC5E6O/79rSVGkajvAMwFc38mvdWv7WtVeh4eELnGpNsc38a3pS5hxT/BNmYa7WkniZNw3/P4q8vQfFj6GXxg3QQPPu6uKGIutk+JquFJjNxoS6oLM6NgI/7SqrId8MrntMzsZDOlK6Pu42p/2vMb/T5d5VCPNWswTwIJG/E23wWD2EV0HmBqsgZ1v9NeDNk3q8iXbY0f7qA86VjBJyJr9M/Hywx2IO+MSXOgrAeM476JA7r32bhFWX1KsqFxUf7gObyAuZsJmfehA8cdSEKhVyZU6MqcyJfLgqnKqVJp3zHZ85NZGzkwjSVi7R64mspTPqnHkLItzpzcmOc3p/InpQCQ32qtCV4FnGUkKHsRdao4RJyeSM+F8/2UxpBVF73Zw9oNo+d4nQtw9sXOhNnc2E5nwguRclUWYLZrL0b3N+aHjFlQJrfQq85ETaHPLE7S1gR79EaOIZARP7pNK0QauGu+Wqoh38iZL0Hg2mK+csowPCgeBK3SneQ=',
        texture:'ewogICJ0aW1lc3RhbXAiIDogMTc4Mzc0ODUxMTQ2NiwKICAicHJvZmlsZUlkIiA6ICJhN2Y3MzllNmFmY2U0ZGY3ODM3YmJhZWY1MzUyNWMzZiIsCiAgInByb2ZpbGVOYW1lIiA6ICJWM24wbW1YXyIsCiAgInNpZ25hdHVyZVJlcXVpcmVkIiA6IHRydWUsCiAgInRleHR1cmVzIiA6IHsKICAgICJTS0lOIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS8zY2Q4ZjAyNTAxNzg1ZDE2YjA5M2Y0ZDY1OTY5OGE3OWZjZDUwYTAwOTRmNTMzNDlkNDhkNjYzMmZjNmUxMzJkIiwKICAgICAgIm1ldGFkYXRhIiA6IHsKICAgICAgICAibW9kZWwiIDogInNsaW0iCiAgICAgIH0KICAgIH0KICB9Cn0=' 
    },
    position: [-87, 74, 43],
    lookAt: 'nearest',
    dialogue: secretDialogue,
})
