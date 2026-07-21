import { _, abs, Advancement, advancement, execute, kill, Label, MCFunction, NBT, particle, raw, rel, Selector, summon, tellraw, title } from 'sandstone'
import { SpellLibrary } from '../spellbook/SpellLibrary'
import { ShowcaseMarker } from '.'
import { STATES, GlobalState, SessionPlayer, ShowcaseMobs, startSelection, spawnChangeSchoolButton, ChangeSchoolButtonEntities } from './ShowcaseState'
import { setSchoolTrigger } from '../pack_setup'
import { NAMESPACE } from '@shared'
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

export const PedestalLabel = Label('showcase.pedestal')
export const AllPedestals = Selector('@e', { tag: PedestalLabel })

function clickEntity(buttonTag: `${any}${string}`) {
  return { entity_type: 'minecraft:interaction' as const, entity_tags: { all_of: [buttonTag] } }
}

const SELECT_ADVANCEMENTS = PEDESTALS.map(ped => `showcase_select_${ped.schoolId}` as const)

// Per-school click handlers, one advancement (left+right click) per pedestal
for (const ped of PEDESTALS) {
  const school = SpellLibrary[ped.schoolId]
  const schoolTag = `sandstone_summit_booth.showcase.pedestal.${ped.schoolId}` as `${any}${string}`
  const advancementName = `showcase_select_${ped.schoolId}` as const

  const selectSchool = MCFunction(`sections/magic/showcase/selection/select/${ped.schoolId}`, () => {
    // @s is the clicking player, per player_interacted_with_entity/player_hurt_entity reward semantics
    advancement.revoke('@s').only(`${NAMESPACE}:${advancementName}`)

    setSchoolTrigger('@s').set(school.uid)

    title(SessionPlayer).title([{ text: school.name, color: ped.color, bold: true } as any])
    title(SessionPlayer).subtitle([{ text: 'School selected!', color: 'gray', italic: true } as any])

    kill(AllPedestals)
    raw('loot give @s loot sandstone_summit_booth:items/magic_wand')
    GlobalState.set(STATES.FIGHTING)
    spawnChangeSchoolButton()

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

  Advancement(advancementName, {
    criteria: {
      click: { trigger: 'minecraft:player_interacted_with_entity', conditions: { entity: clickEntity(schoolTag) } },
      hit: { trigger: 'minecraft:player_hurt_entity', conditions: { entity: clickEntity(schoolTag) } },
    },
    requirements: [['click', 'hit']],
    rewards: { function: selectSchool },
  })
}

MCFunction('sections/magic/showcase/selection/load', () => {
  for (const name of SELECT_ADVANCEMENTS) {
    advancement.revoke('@a').only(`${NAMESPACE}:${name}`)
  }
}, { runOnLoad: true })

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

      // Clickable hitbox — click detected via the showcase_select_<school> advancement
      summon('interaction', rel(ped.x, ped.y, ped.z), {
        Tags: [commonTag, schoolTag, BOOTH_ENTITY_TAG, 'summit.static'],
        width: NBT.float(1.0),
        height: NBT.float(2.5),
        response: true,
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

// @s is the clicking player, called as the reward of showcase_change_school_click
export const changeSchool = MCFunction('sections/magic/showcase/selection/change_school', () => {
  _.if(GlobalState.equalTo(STATES.FIGHTING), () => {
    raw('clear @s minecraft:stick[custom_data~{\'sandstone_summit_booth.id\':\'magic_wand\'}]')
    kill(ShowcaseMobs)
    kill(AllPedestals)
    kill(ChangeSchoolButtonEntities)
    startSelection()
  })
})

