import { join } from 'path'
import { Font, MCFunction, Model, NBT, raw, Texture, Variant, Tag } from 'sandstone'

import monospace from '../../../resources/assets/font/monospace/providers.json'

import './showcase'


// Summon for missing bridge block displays
const summonBridgeDisplays = MCFunction('sections/main/summon_missing_bridge_displays', () => {
    raw('summon minecraft:block_display -71.0 65.0 65.0 {Tags:["summit.static","summit.booth_entity.sandstone_summit_booth"],Passengers: [{Tags:["summit.static","summit.booth_entity.sandstone_summit_booth"],block_state: {Name: "minecraft:yellow_bed", Properties: {facing: "north", occupied: "false", part: "foot"}}, id: "minecraft:block_display", transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.0f, 0.0f, 0.0f]}}, {Tags:["summit.static","summit.booth_entity.sandstone_summit_booth"],block_state: {Name: "minecraft:yellow_bed", Properties: {facing: "north", occupied: "false", part: "foot"}}, id: "minecraft:block_display", transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [2.0f, 0.0f, 0.0f]}}, {Tags:["summit.static","summit.booth_entity.sandstone_summit_booth"],block_state: {Name: "minecraft:yellow_bed", Properties: {facing: "north", occupied: "false", part: "foot"}}, id: "minecraft:block_display", transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.0f, -1.0f, 2.0f]}}, {Tags:["summit.static","summit.booth_entity.sandstone_summit_booth"],block_state: {Name: "minecraft:yellow_bed", Properties: {facing: "north", occupied: "false", part: "foot"}}, id: "minecraft:block_display", transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [2.0f, -1.0f, 2.0f]}}, {Tags:["summit.static","summit.booth_entity.sandstone_summit_booth"],block_state: {Name: "minecraft:yellow_bed", Properties: {facing: "north", occupied: "false", part: "foot"}}, id: "minecraft:block_display", transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.0f, -1.0f, 2.0f]}}], block_state: {Name: "minecraft:yellow_bed", Properties: {facing: "north", occupied: "false", part: "foot"}}}')
})
Tag('function', 'summit.booth:sandstone_summit_booth/entities/summon', [summonBridgeDisplays], { onConflict: 'append' })


const asset = (...path: string[]) => Bun.file(
    join(process.cwd(), 'resources', 'assets', ...path)
).arrayBuffer()

Texture('font', 'monospace/ascii', asset('font', 'monospace', 'ascii.png'))

Texture('font', 'monospace/nonlatin_european', asset('font', 'monospace', 'nonlatin_european.png'))

Font('monospace', monospace.providers as Parameters<typeof Font>[1])

const mascot = 'sandstone_mascot'

Variant('painting', mascot, {
    asset_id: Texture('painting', mascot, asset('mascot.png')).name.replace('painting/', '') as `${string}:${string}`,
    height: NBT.int(4),
    width: NBT.int(3),
})

Texture('item', 'balloon/primary', asset('balloon', 'primary.png'))
Texture('item', 'balloon/secondary', asset('balloon', 'secondary.png'))

Model('balloons', 'sand_castle',
    // Specifically not using ESM import due to Sandstone's strict types, WAI
    await Bun.file(join(process.cwd(), 'resources/assets/balloon/model.json')).json()
)

Texture('sticker', 'arcane_arts', asset('stickers', 'arcane_arts.png'))
Texture('sticker', 'enter_booth', asset('stickers', 'enter_booth.png'))
Texture('sticker', 'hidden', asset('stickers', 'hidden.png'))
Texture('sticker', 'rhythm', asset('stickers', 'rhythm.png'))