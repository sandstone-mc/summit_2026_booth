import { Label, LootTable, NBT, Objective, rel, fill, MCFunction, execute, Selector, summon, tp, abs, kill, _, raw, scoreboard, say, Tag, tellraw } from 'sandstone'

import { ShowcaseMarker } from '.'
import { clearSelf, getSelf, saveSelf, io } from '../PlayerDB'
import { mana, maxMana, manaRegen } from '../player_handler'
import { setSchoolTrigger, setSpellTrigger } from '../pack_setup'

export const State = Objective.create('showcase.state', 'dummy')
export const GlobalState = State('#global')

const resetTrigger = Objective.create('showcase.reset', 'trigger')

export const STATES = {
    IDLE: 0,
    INTRO: 1,
    SELECTION: 2,
    FIGHTING: 3,
    WIN: 4,
    RESETTING: 5
}

interface Spawner {
    x: number
    y: number
    z: number
}

const Spawners: Spawner[] = [
    { x: 4.5, y: 1.1, z: 4.5 },
    { x: 9.5, y: 1.1, z: 4.5 },
    { x: 14.5, y: 1.1, z: 4.5 },
]

// active player tag
const SessionPlayerLabel = Label('showcase.player')
export const SessionPlayer = Selector('@a', {
    tag: SessionPlayerLabel
})

// tracks any player physically inside the booth volume (updated every tick)
const InBoothLabel = Label('showcase.in_booth')
const InBoothPlayer = Selector('@a', { tag: InBoothLabel })
const InBoothCount = State('#in_booth_count')

// booth interior volume relative to ShowcaseMarker (x 0-19, y 0-5, z 0-26)
const BOOTH_DX = 19
const BOOTH_DY = 5
const BOOTH_DZ = 26

const RESET_POS = rel(9, 1, 27)

// session UI buttons (exit + change school) — spawned on entry, killed on reset
const ButtonLabel = Label('showcase.button')
const ShowcaseButtons = Selector('@e', { tag: ButtonLabel })

// showcase mobs
const ShowcaseMobLabel = Label('showcase.mob')
export const ShowcaseMobs = Selector('@e', {
    type: '#sandstone_summit_booth:targetable',
    tag: ShowcaseMobLabel
})

LootTable('showcase/empty_mob', { type: 'minecraft:entity', pools: [] })

const MobCount = State('#mob_count')

const MOB_ARMOR = [
    { head: 'minecraft:leather_helmet',   chest: 'minecraft:leather_chestplate',   legs: 'minecraft:leather_leggings',   feet: 'minecraft:leather_boots'   },
    { head: 'minecraft:chainmail_helmet', chest: 'minecraft:chainmail_chestplate', legs: 'minecraft:chainmail_leggings', feet: 'minecraft:chainmail_boots' },
    { head: 'minecraft:iron_helmet',      chest: 'minecraft:iron_chestplate',      legs: 'minecraft:iron_leggings',      feet: 'minecraft:iron_boots'      },
]

const BOOTH_ENTITY_TAG = 'summit.booth_entity.sandstone_summit_booth'

function zombieNbt(armor: (typeof MOB_ARMOR)[0]) {
    return {
        Tags: [`sandstone_summit_booth.${ShowcaseMobLabel.name}`, BOOTH_ENTITY_TAG],
        PersistenceRequired: true,
        CanPickUpLoot: false,
        CanBreakDoors: false,
        DeathLootTable: 'sandstone_summit_booth:showcase/empty_mob',
        // ArmorItems: [
        //     { id: armor.feet,  count: NBT.int(1) },
        //     { id: armor.legs,  count: NBT.int(1) },
        //     { id: armor.chest, count: NBT.int(1) },
        //     { id: armor.head,  count: NBT.int(1) },
        // ],
        // ArmorDropChances: [NBT.float(0), NBT.float(0), NBT.float(0), NBT.float(0)],
        // HandDropChances:  [NBT.float(0), NBT.float(0)],
    }
}

// Door config
const ENTRANCE_X = 8
const ENTRANCE_Y = 0
const ENTRANCE_Z = 27
const ENTRANCE_DX = 3
const ENTRANCE_DY = 3
const ENTRANCE_DZ = 1

export const closeDoor = MCFunction('sections/magic/showcase/door/close', () => {
    execute.as(ShowcaseMarker).at('@s').run(() => {
        fill(rel(ENTRANCE_X, ENTRANCE_Y, ENTRANCE_Z), rel(ENTRANCE_X + (ENTRANCE_DX - 1), ENTRANCE_Y + (ENTRANCE_DY - 1), ENTRANCE_Z + (ENTRANCE_DZ - 1)), 'minecraft:glass')
    })
}, { lazy: true })


export const openDoor = MCFunction('sections/magic/showcase/door/open', () => {
    execute.as(ShowcaseMarker).at('@s').run(() => {
        fill(rel(ENTRANCE_X, ENTRANCE_Y, ENTRANCE_Z), rel(ENTRANCE_X + (ENTRANCE_DX - 1), ENTRANCE_Y + (ENTRANCE_DY - 1), ENTRANCE_Z + (ENTRANCE_DZ - 1)), 'minecraft:air')
    })
}, { lazy: true })


export const reset = MCFunction('sections/magic/showcase/reset', () => {
    GlobalState.set(STATES.RESETTING)

    execute.as(ShowcaseMarker).at('@s').positioned(RESET_POS).run(() => {
        // teleport all players in the booth out (handles both session player and extras)
        execute.as(InBoothPlayer).run(() => {
            tp('@s', rel(0.5, 0, 3), abs(0, 0))
            raw('clear @s minecraft:stick[custom_data~{\'sandstone_summit_booth.id\':\'magic_wand\'}]')
            SessionPlayerLabel('@s').remove()
            InBoothLabel('@s').remove()
        })
        // also clean up session player if they already left the volume
        execute.as(SessionPlayer).run(() => {
            raw('clear @s minecraft:stick[custom_data~{\'sandstone_summit_booth.id\':\'magic_wand\'}]')
            SessionPlayerLabel('@s').remove()
        })
    })

    execute.as(ShowcaseMarker).at('@s').run(() => {
        // kill showcase mobs, selection pedestals, and session UI buttons
        kill(ShowcaseMobs)
        raw('kill @e[tag=sandstone_summit_booth.showcase.pedestal]')
        kill(ShowcaseButtons)

        openDoor()

        GlobalState.set(STATES.IDLE)
    })
})


const spawnButtons = MCFunction('sections/magic/showcase/spawn_buttons', () => {
    execute.as(ShowcaseMarker).at('@s').run(() => {
        const buttonTag = `sandstone_summit_booth.${ButtonLabel.name}`

        // Exit button — inside face of the entrance door
        summon('text_display', rel(9.5, 1.4, 26.5), {
            Tags: [buttonTag, BOOTH_ENTITY_TAG, 'summit.interactable'],
            text: [{ text: '↩ ', color: 'red' }, { text: 'Exit Showcase', color: 'white', bold: true }],
            alignment: 'center',
            billboard: 'center',
            brightness: { sky: NBT.int(15), block: NBT.int(15) },
        })
        summon('interaction', rel(9.5, 0, 27), {
            Tags: [buttonTag, BOOTH_ENTITY_TAG, 'summit.interactable'],
            width: NBT.float(1.0),
            height: NBT.float(3.0),
            response: false,
            data: {
                summit_interactable: {
                    on_right_click: 'execute on target run function sandstone_summit_booth:sections/magic/showcase/reset',
                },
            },
        })

        // Change School button — back of room behind the pedestals
        summon('text_display', rel(9.5, 1.5, 18), {
            Tags: [buttonTag, BOOTH_ENTITY_TAG, 'summit.interactable'],
            text: [{ text: '✦ ', color: 'yellow' }, { text: 'Change School', color: 'white', bold: true }],
            alignment: 'center',
            billboard: 'center',
            brightness: { sky: NBT.int(15), block: NBT.int(15) },
        })
        summon('interaction', rel(9.5, 0, 18), {
            Tags: [buttonTag, BOOTH_ENTITY_TAG, 'summit.interactable'],
            width: NBT.float(1.2),
            height: NBT.float(3.0),
            response: false,
            data: {
                summit_interactable: {
                    on_right_click: 'execute on target run function sandstone_summit_booth:sections/magic/showcase/selection/change_school',
                },
            },
        })
    })
}, { lazy: true })

const intro = MCFunction('sections/magic/showcase/intro', () => {
    GlobalState.set(STATES.INTRO)
    closeDoor()
    spawnButtons()
    execute.as(ShowcaseMarker).at('@s').run(() => {
        startSelection()
    })
})

export const startSelection = MCFunction('sections/magic/showcase/selection/start', () => {
    GlobalState.set(STATES.SELECTION)
    raw('function sandstone_summit_booth:sections/magic/showcase/selection/spawn_pedestals')
})

export const startSession = MCFunction('sections/magic/showcase/session/start', () => {
    _.if(GlobalState.equalTo(STATES.IDLE), () => {
        SessionPlayerLabel('@s').add()

        // Init player state fresh for each showcase run
        clearSelf()
        getSelf()
        io.merge({ current_school: 'fire', selected_spell: 'firebolt' })
        saveSelf()
        mana('@s').set(100)
        maxMana('@s').set(100)
        manaRegen('@s').set(20)

        // Ensure spell/school triggers are enabled
        scoreboard.players.enable('@s', setSchoolTrigger)
        scoreboard.players.enable('@s', setSpellTrigger)

        intro()
    })
}, { lazy: true })

MCFunction('sections/magic/showcase/tick', () => {
    // Update which players are physically inside the booth volume
    InBoothLabel('@p').remove()
    execute.as(ShowcaseMarker).at('@s').run(() => {
        execute.as(Selector('@a', { dx: BOOTH_DX, dy: BOOTH_DY, dz: BOOTH_DZ })).run(() => {
            InBoothLabel('@s').add()
        })
    })

    _.if(GlobalState.equalTo(STATES.IDLE), () => {
        execute.as(ShowcaseMarker).at('@s').positioned(rel(ENTRANCE_X, ENTRANCE_Y, ENTRANCE_Z - 1)).run(() => {
            execute.as(Selector('@a', {
                tag: `!sandstone_summit_booth.${SessionPlayerLabel.name}`,
                dx: ENTRANCE_DX, dy: ENTRANCE_DY, dz: ENTRANCE_DZ - 2
            })).run(() => {
                startSession()
            })
        })
    })

    _.if(GlobalState.equalTo(STATES.FIGHTING), () => {
        MobCount.set(0)
        execute.as(ShowcaseMobs).run(() => { MobCount.add(1); })

        execute.as(ShowcaseMarker).at('@s').run(() => {
            for (let i = 0; i < Spawners.length; i++) {
                _.if(MobCount.lessThan(9), () => {
                    summon('zombie', rel(Spawners[i].x, Spawners[i].y, Spawners[i].z), zombieNbt(MOB_ARMOR[i % MOB_ARMOR.length]))
                    MobCount.add(1)
                })
            }
        })
    })

    _.if(GlobalState.greaterThan(STATES.IDLE), () => {
        // Reset if session player left
        execute.unless.entity(SessionPlayer).run(() => {
            reset()
        })
        // Reset if a second player entered the booth
        InBoothCount.set(0)
        execute.as(InBoothPlayer).run(() => { InBoothCount.add(1); })
        _.if(InBoothCount.greaterThan(1), () => {
            reset()
        })
    })

    execute.as(Selector('@a', { scores: { 'sandstone_summit_booth.showcase.reset': [1, null] } })).run(() => {
        reset()
        raw(`scoreboard players reset @s sandstone_summit_booth.showcase.reset`)
        scoreboard.players.enable('@a', resetTrigger)
    })
}, { runEveryTick: true })

MCFunction('sections/magic/showcase/load', () => {
    GlobalState.set(STATES.IDLE)
    scoreboard.players.enable('@a', resetTrigger)
}, { runOnLoad: true })

// Summit compliance: kill all booth entities (ShowcaseMarker, mobs, buttons, pedestals)
const killAllBoothEntities = MCFunction('sections/magic/showcase/kill_all', () => {
    kill(Selector('@e', { tag: BOOTH_ENTITY_TAG }))
})
Tag('function', 'summit.booth:sandstone_summit_booth/entities/kill', [killAllBoothEntities])

// Summit compliance: reset_player is called AS the player leaving the booth
const resetPlayer = MCFunction('sections/magic/showcase/reset_player', () => {
    _.if(GlobalState.greaterThan(STATES.IDLE), () => {
        reset()
    })
})
Tag('function', 'summit:api/reset_player', [resetPlayer]);