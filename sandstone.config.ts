import type { DatapackConfig, ResourcePackConfig, SandstoneConfig } from 'sandstone'

export default {
  name: 'magic',
  packs: {
    datapack: {
      description: [ 'A ', { text: 'Sandstone', color: 'gold' }, ' datapack.' ],
      packFormat: 98,
    } as DatapackConfig,
    resourcepack: {
      description: [ 'A ', { text: 'Sandstone', color: 'gold' }, ' resource pack.' ],
      packFormat: 79,
    } as ResourcePackConfig
  },
  onConflict: {
    default: 'warn',
  },
  namespace: 'magic',
  packUid: 'MJU1fHcF',
  mcmeta: 'latest',
  saveOptions: { clientPath: 'D:\\\\Modrinth\\\\profiles\\\\Datapack Development', world: 'New World' },
} as SandstoneConfig
