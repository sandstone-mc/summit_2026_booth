import { join } from 'path'
import { NBT, Texture, Variant } from 'sandstone'

const mascot = 'sandstone_mascot'

Variant('painting', mascot, {
    asset_id: Texture('painting', mascot,
        Bun.file(
            join(process.cwd(), 'resources', 'assets', `${mascot}.png`)
        ).arrayBuffer() as unknown as Promise<Buffer<ArrayBuffer>>
    ).name.replace('painting/', '') as `${string}:${string}`,
    height: NBT.int(4),
    width: NBT.int(3),
})