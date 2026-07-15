import { _, abs, execute, kill, Label, MCFunction, NBT, particle, raw, rel, Selector, summon, tellraw, title } from 'sandstone'
import { SpellLibrary } from '../spellbook/SpellLibrary'
import { ShowcaseMarker } from '.'
import { STATES, GlobalState, SessionPlayer, ShowcaseMobs, startSelection } from './ShowcaseState'
import { setSchoolTrigger } from '../pack_setup'
import type { Registry } from 'sandstone/arguments'

interface Pedestal {
  schoolId: keyof typeof SpellLibrary
  x: number
  y: number
  z: number
  // TODO: TextColor once its exported
  color: any
  particleType: string
  item: Registry['minecraft:item']
}

const BOOTH_ENTITY_TAG = 'summit.booth_entity.sandstone_summit_booth'

const PEDESTALS: Pedestal[] = [
  { schoolId: 'fire',      x: 5,    y: 0, z: 22,   color: 'red',          particleType: 'flame',          item: 'minecraft:blaze_rod' },
  { schoolId: 'ice',       x: 7,    y: 0, z: 21,   color: 'aqua',         particleType: 'snowflake',      item: 'minecraft:blue_ice' },
  { schoolId: 'arcane',    x: 9.5,  y: 0, z: 20.5, color: 'light_purple', particleType: 'portal',         item: 'minecraft:amethyst_shard' },
  { schoolId: 'lightning', x: 12, y: 0, z: 21,   color: 'yellow',       particleType: 'electric_spark', item: 'minecraft:lightning_rod' },
  { schoolId: 'nature',    x: 14, y: 0, z: 22,   color: 'green',        particleType: 'falling_spore_blossom', item: 'minecraft:flowering_azalea' },
]

const PedestalLabel = Label('showcase.pedestal')
const AllPedestals = Selector('@e', { tag: PedestalLabel })

// Per-school click handlers — called by name via raw so not lazy
for (const ped of PEDESTALS) {
  const school = SpellLibrary[ped.schoolId]

  MCFunction(`sections/magic/showcase/selection/select/${ped.schoolId}`, () => {
    // @s is the player who right-clicked (via execute on target run)
    setSchoolTrigger('@s').set(school.uid)

    title(SessionPlayer).title([{ text: school.name, color: ped.color, bold: true } as any])
    title(SessionPlayer).subtitle([{ text: 'School selected!', color: 'gray', italic: true } as any])

    kill(AllPedestals)
    raw('loot give @s loot sandstone_summit_booth:items/magic_wand')
    GlobalState.set(STATES.FIGHTING)

    tellraw(SessionPlayer, [
      { text: '\n' },
      { text: '✦ Arcane Arts  ', color: 'light_purple', bold: true },
      { text: 'Left-click', color: 'yellow', bold: true },
      { text: ' to select spell  •  ', color: 'gray' },
      { text: 'Right-click', color: 'yellow', bold: true },
      { text: ' to cast\n\n', color: 'gray' },
      { text: `  ${school.name}`, color: ped.color as any, bold: true },
      { text: `  ${school.description}\n`, color: 'gray', italic: true },
      ...Object.values(school.spells).flatMap(spell => [
        { text: '  › ', color: ped.color as any },
        { text: spell.name, color: 'white', bold: true },
        { text: `  ${spell.mana_cost}✦  `, color: 'aqua' },
        { text: spell.description + '\n', color: 'gray' },
      ]),
    ] as any)
  })
}

// Called from ShowcaseState.startSelection via raw
MCFunction('sections/magic/showcase/selection/spawn_pedestals', () => {
  execute.as(ShowcaseMarker).at('@s').run(() => {
    for (const ped of PEDESTALS) {
      const school = SpellLibrary[ped.schoolId]
      const commonTag = `sandstone_summit_booth.${PedestalLabel.name}` as `${any}${string}`
      const schoolTag = `sandstone_summit_booth.showcase.pedestal.${ped.schoolId}` as `${any}${string}`

      // Floating item at pedestal center
      summon('item_display', rel(ped.x, ped.y + 1.5, ped.z), {
        Tags: [commonTag, schoolTag, BOOTH_ENTITY_TAG, 'summit.static'],
        item: { id: ped.item, count: NBT.int(1) },
        item_display: 'fixed',
        transformation: {
          translation: [NBT.float(0), NBT.float(0), NBT.float(0)],
          left_rotation: [NBT.float(0), NBT.float(0), NBT.float(0), NBT.float(1)],
          scale: [NBT.float(1.5), NBT.float(1.5), NBT.float(1.5)],
          right_rotation: [NBT.float(0), NBT.float(0), NBT.float(0), NBT.float(1)],
        },
        brightness: { sky: NBT.int(15), block: NBT.int(15) },
      })

      // School name label above item
      summon('text_display', rel(ped.x, ped.y + 2.8, ped.z), {
        Tags: [commonTag, schoolTag, BOOTH_ENTITY_TAG, 'summit.static'],
        text: { text: school.name, color: ped.color, bold: true },
        alignment: 'center',
        billboard: 'vertical',
        brightness: { sky: NBT.int(15), block: NBT.int(15) },
        transformation: {
          translation: [NBT.float(0), NBT.float(0), NBT.float(0)],
          left_rotation: [NBT.float(0), NBT.float(0), NBT.float(0), NBT.float(1)],
          scale: [NBT.float(1.2), NBT.float(1.2), NBT.float(1.2)],
          right_rotation: [NBT.float(0), NBT.float(0), NBT.float(0), NBT.float(1)],
        },
      })

      // Clickable hitbox — Smithed API handles right-click dispatch
      summon('interaction', rel(ped.x, ped.y, ped.z), {
        Tags: [commonTag, schoolTag, BOOTH_ENTITY_TAG, 'summit.interactable', 'summit.static'],
        width: NBT.float(1.0),
        height: NBT.float(2.5),
        response: false,
        data: {
          summit_interactable: {
            on_right_click: `execute on target run function sandstone_summit_booth:sections/magic/showcase/selection/select/${ped.schoolId}`,
          },
        },
      })
    }
  })
})

// Runs every tick; only active during SELECTION state
MCFunction('sections/magic/showcase/selection/tick', () => {
  _.if(GlobalState.equalTo(STATES.SELECTION), () => {
    // Ambient particles at each pedestal
    execute.as(ShowcaseMarker).at('@s').run(() => {
      for (const ped of PEDESTALS) {
        particle(ped.particleType as any, rel(ped.x, ped.y + 1.5, ped.z), abs(0.3, 0.5, 0.3), 0.01, 1)
      }
    })
  })
}, { runEveryTick: true })

// Called via Smithed on_right_click — @s is the player
MCFunction('sections/magic/showcase/selection/change_school', () => {
  _.if(GlobalState.equalTo(STATES.FIGHTING), () => {
    raw('clear @s minecraft:stick[custom_data~{\'sandstone_summit_booth.id\':\'magic_wand\'}]')
    kill(ShowcaseMobs)
    kill(AllPedestals)
    startSelection()
  })
})

