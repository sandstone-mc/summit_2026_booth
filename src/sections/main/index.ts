import { join } from 'path'
import { Font, Model, NBT, Texture, Variant } from 'sandstone'

import monospace from '../../../resources/assets/font/monospace/providers.json'
import balloonModel from '../../../resources/assets/balloon/model.json'

import './showcase'

const asset = (...path: string[]) => Bun.file(
    join(process.cwd(), 'resources', 'assets', ...path)
).arrayBuffer() as unknown as Promise<Buffer<ArrayBufferLike>> // TODO: Sandstone bug

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
Texture('item', 'balloon/strings', asset('balloon', 'strings.png'))

// TODO: Sandstone bug
Model('balloons' as 'item', 'sand_castle', balloonModel as Parameters<typeof Model>[2])

// TODO: Sandstone bug
Texture('sticker' as 'font', 'arcane_arts', asset('stickers', 'arcane_arts.png'))
Texture('sticker' as 'font', 'enter_booth', asset('stickers', 'enter_booth.png'))
Texture('sticker' as 'font', 'hidden', asset('stickers', 'hidden.png'))
Texture('sticker' as 'font', 'rhythm', asset('stickers', 'rhythm.png'))
