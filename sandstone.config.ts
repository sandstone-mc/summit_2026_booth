import type { DatapackConfig, ResourcePackConfig, SandstoneConfig } from 'sandstone'

export default {
    name: 'sandstone_summit_booth',
    packs: {
        datapack: {
            description: ['The ', { text: 'Sandstone', color: 'gold' }, ' booth datapack for Smithed Summit 2026.'],
            packFormat: 107.1,
        } as DatapackConfig,
        resourcepack: {
            description: ['A ', { text: 'Sandstone', color: 'gold' }, ' resource pack.'],
            packFormat: 88,
        } as ResourcePackConfig
    },
    onConflict: {
        default: 'warn',
    },
    namespace: 'sandstone_summit_booth',
    packUid: 'WnYlBycD',
    mcmeta: '26.2',
    saveOptions: process.env.CLIENT_PATH && process.env.WORLD ? { clientPath: process.env.CLIENT_PATH, world: process.env.WORLD } : {},
} as SandstoneConfig
