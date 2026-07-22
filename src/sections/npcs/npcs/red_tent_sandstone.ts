import { DialogueTree } from '../DialogueTree'
import { CreateNPC } from '../NPC'
import { PLACEHOLDER_SKIN } from './skins'

const redTentDialogue = DialogueTree('red_tent_sandstone', {
    nodes: [{
        id: 'main',
        advance: 'click',
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
    }],
})

CreateNPC('red_tent_sandstone', {
    name: 'James',
    skin: {
        properties: {
            value: "e3RleHR1cmVzOntTS0lOOnt1cmw6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvYWQwZmEyZWVhNjlmZDNjNWE4NmIyZTM1ODBmY2E4MzJmOTRkYjkyZDM2YmFjMjY2NWJjNWJjNjc0NzQ1N2Y0OCJ9fX0="
        }
    },
    position: [-68, 93, 54],
    lookAt: 'nearest',
    dialogue: redTentDialogue,
})
