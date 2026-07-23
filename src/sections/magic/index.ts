import './PlayerDB.ts'
import './pack_setup.ts'
import './player_handler.ts'
import './spellbook/index.ts'
import './items/items'
import './Spells'
import './StatusEffects'

import './SummitShowcase'
import { abs, execute, kill, MCFunction, NBT, place, RawResource, Selector, summon } from 'sandstone'
import { type JSONTextComponent } from 'sandstone/arguments'
import { panels } from '@rhythm/config/internal/derived'
import { summonMarker, killMarker } from './SummitShowcase'
import { NAMESPACE } from 'src/shared.ts'
import { join } from 'path'

const INFO_PANEL_TAG = 'sandstone_summit_booth.magic.info_panel' as `${any}${string}`
const BOOTH_ENTITY_TAG = 'summit.booth_entity.sandstone_summit_booth' as `${any}${string}`

// shown in the shared showcase panel slot (see rhythm's `panels.settings`) while magic is the active showcase
const INFO_TEXT: JSONTextComponent = [
    { text: "LilSpartan's Magic Pack\n\n", color: 'light_purple', bold: true },
    { text: 'Left-Click: ', color: 'gray' },
    { text: 'Select Spell\n', color: 'white' },
    { text: 'Right-Click: ', color: 'gray' },
    { text: 'Cast Spell\n\n', color: 'white' },
    { text: 'Step inside to begin!', color: 'yellow' },
]

RawResource(
    `${NAMESPACE}/structure/magic.nbt`,
    Bun.file(
        join(process.cwd(), 'resources', 'data', 'showcase', 'magic.nbt')
    ).arrayBuffer() as unknown as Buffer<ArrayBufferLike>,
)

export const setup = MCFunction('sections/magic/setup', () => {
    execute.positioned(abs(-80, 63, 22)).run(() => {
        place.template("sandstone_summit_booth:magic")
    })
    execute.positioned(abs(-79, 64, 23)).run(() => {
        summonMarker()
    })

    summon('minecraft:text_display', abs(panels.settings.x, panels.settings.y + 1, panels.settings.z), {
        Tags: [INFO_PANEL_TAG, BOOTH_ENTITY_TAG],
        text: INFO_TEXT,
        alignment: 'center',
        billboard: 'fixed',
        Rotation: NBT.float([panels.settings.facing, 0]),
        shadow: true,
        line_width: NBT.int(400),
        background: NBT.int(0),
        brightness: { sky: NBT.int(15), block: NBT.int(15) },
    })
})

// Clean up when swapping out magic game
export const cleanup = MCFunction('sections/magic/cleanup', () => {
    killMarker()
    kill(Selector('@e', { tag: INFO_PANEL_TAG }))
})