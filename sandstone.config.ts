import type { DatapackConfig, ResourcePackConfig, SandstoneConfig } from 'sandstone'

export default {
    name: 'sandstone_summit_booth',
    packs: {
        datapack: {
            description: ['The ', { text: 'Sandstone', color: 'gold' }, ' booth datapack for Smithed Summit 2026.'],
            packFormat: 101,
        } as DatapackConfig,
        resourcepack: {
            description: ['A ', { text: 'Sandstone', color: 'gold' }, ' resource pack.'],
            packFormat: 79,
        } as ResourcePackConfig
    },
    onConflict: {
        default: 'warn',
    },
    namespace: 'sandstone_summit_booth',
    packUid: 'WnYlBycD',
    mcmeta: 'latest',
    saveOptions: {},
} as SandstoneConfig
