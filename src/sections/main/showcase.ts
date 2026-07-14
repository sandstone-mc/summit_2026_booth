import { _, abs, execute, fill, kill, MCFunction, NBT, place, raw, say, Selector, summon, Tag, tp, Variable } from 'sandstone'
import { panels } from '@rhythm/config/internal/derived'
import { Tags as RhythmTags } from '@rhythm/game/state'
import { spawnSettingsPanel } from '@rhythm/game/settings'
import { spawnLeaderboardPanel } from '@rhythm/game/leaderboard'

import { setup as rhythmSetup, cleanup as rhythmCleanup } from '../rhythm'
import { setup as magicSetup, cleanup as magicCleanup } from '../magic'

const BOOTH_ENTITY_TAG = 'summit.booth_entity.sandstone_summit_booth' as `${any}${string}`

export enum ShowcaseId {
    NONE,
    RHYTHM,
    MAGIC,
}

export const currentShowcase = Variable(ShowcaseId.NONE, 'main.showcase.current')
export const showcaseActive = Variable(0, 'main.showcase.active')

export const startShowcaseSession = MCFunction('sections/main/showcase/session/start', () => {
    showcaseActive.set(1)
})

export const endShowcaseSession = MCFunction('sections/main/showcase/session/end', () => {
    showcaseActive.set(0)
})


// how many players are currently inside the shared showcase area
// export const ShowcaseOccupancy = Variable(0, 'main.showcase.occupancy')

// MCFunction('sections/main/showcase/enter', () => {
//     ShowcaseOccupancy.add(1)
//     raw('tellraw LilSpartan904 [{selector:"@s"},{text:" enter"}]')
// })

// MCFunction('sections/main/showcase/exit', () => {
//     ShowcaseOccupancy.remove(1)
//     raw('tellraw LilSpartan904 [{selector:"@s"},{text:" exit"}]')
// })

// showcase bounding box (see `bounding_boxes.showcase` in booth_definition.json)
const SHOWCASE_MIN = { x: -80, y: 63, z: 21 }
const SHOWCASE_MAX = { x: -60, y: 72, z: 51 }
const SHOWCASE_BOUNDS = [abs(SHOWCASE_MIN.x, SHOWCASE_MIN.y, SHOWCASE_MIN.z), abs(SHOWCASE_MAX.x, SHOWCASE_MAX.y, SHOWCASE_MAX.z)] as const

export const PlayersInShowcase = Selector('@a', {
    x: SHOWCASE_MIN.x,
    y: SHOWCASE_MIN.y,
    z: SHOWCASE_MIN.z,
    dx: SHOWCASE_MAX.x - SHOWCASE_MIN.x,
    dy: SHOWCASE_MAX.y - SHOWCASE_MIN.y,
    dz: SHOWCASE_MAX.z - SHOWCASE_MIN.z,
})

const RESET_POS = abs(-69.5, 64, 53)
const RESET_ROTATION = abs(180, 0)

// order showcases advance through when cycling
const SHOWCASE_ORDER = [ShowcaseId.RHYTHM, ShowcaseId.MAGIC] as const

const SHOWCASE_SETUP: Record<(typeof SHOWCASE_ORDER)[number], () => void> = {
    [ShowcaseId.RHYTHM]: rhythmSetup,
    [ShowcaseId.MAGIC]: magicSetup,
}

function swapShowcase(target: ShowcaseId, setup: () => void) {
    _.if(showcaseActive.equalTo(0), () => {
        // clear anyone still standing in the shared area before it gets wiped out from under them
        execute.as(PlayersInShowcase).run(() => {
            tp('@s', RESET_POS, RESET_ROTATION)
        })

        _.switch(currentShowcase, [
            ['case', ShowcaseId.NONE, () => killPlaceholder()] as const,
            ['case', ShowcaseId.RHYTHM, () => rhythmCleanup()] as const,
            ['case', ShowcaseId.MAGIC, () => magicCleanup()] as const,
        ])
        
        fill(...SHOWCASE_BOUNDS, 'minecraft:air').strict()

        setup()

        currentShowcase.set(target)
        showcaseIdleTicks.set(0)
    })
}

export const swapToRhythm = MCFunction('sections/main/showcase/swap_to_rhythm', () => {
    swapShowcase(ShowcaseId.RHYTHM, rhythmSetup)
})

export const swapToMagic = MCFunction('sections/main/showcase/swap_to_magic', () => {
    swapShowcase(ShowcaseId.MAGIC, magicSetup)
})

const PLACEHOLDER_TAG = 'sandstone_summit_booth.showcase.placeholder' as `${any}${string}`

// backdrop shown while no showcase has been active for a while (see `showcaseIdleTicks` below)
const setupPlaceholder = () => {
    raw('summon minecraft:text_display -70 65.375 52.01 {Tags:["summit.static","summit.booth_entity.sandstone_summit_booth","sandstone_summit_booth.showcase.placeholder"],Passengers: [{alignment: "center", background: -16777216, default_background: 0b, id: "minecraft:text_display",Tags:["summit.static","summit.booth_entity.sandstone_summit_booth","sandstone_summit_booth.showcase.placeholder"], line_width: 300, see_through: 0b, shadow: 0b, text: {bold: 0b, color: "gray", text: "         (Start one using the controls to the right)           "}, text_opacity: -1b, transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.377f, 0.375f, 0.375f], translation: [0.012287293f, -0.0625f, 0.0f]}}], alignment: "center", background: -16777216, default_background: 0b, line_width: 300, see_through: 0b, shadow: 0b, text: {bold: 0b, color: "aqua", text: "Minigame Inactive"}, text_opacity: -1b, transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.3125f, 1.3125f, 1.3125f], translation: [0.0f, 0.0f, 0.0f]}}')
    raw('summon minecraft:block_display -80.0 64 45.0 {Tags:["summit.static","summit.booth_entity.sandstone_summit_booth","sandstone_summit_booth.showcase.placeholder"],block_state: {Name: "minecraft:end_gateway"}, transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [21.0f, 8.0f, 6.0f], translation: [0.0f, 0.0f, 0.0f]}}')

    execute.positioned(abs(SHOWCASE_MIN.x, SHOWCASE_MIN.y, SHOWCASE_MIN.z + 1)).run(() => {
        place.template('sandstone_summit_booth:empty_facade')
    })
}

const killPlaceholder = () => {
    kill(Selector('@e', { tag: PLACEHOLDER_TAG }))
}

export const swapToPlaceholder = MCFunction('sections/main/showcase/swap_to_placeholder', () => {
    swapShowcase(ShowcaseId.NONE, setupPlaceholder)
})

// how many ticks the showcase has gone without an active session (reset whenever one starts, or already idle)
const IDLE_TIMEOUT_TICKS = 20 * 10 * 60
const showcaseIdleTicks = Variable(0, 'main.showcase.idle_ticks')

// debounces the change-showcase button so a rapid double-click can't queue up overlapping swaps
const CHANGE_SHOWCASE_COOLDOWN_TICKS = 20
const changeShowcaseCooldown = Variable(0, 'main.showcase.change_cooldown')

MCFunction('sections/main/showcase/tick', () => {
    _.if(changeShowcaseCooldown.greaterThan(0), () => {
        changeShowcaseCooldown.remove(1)
    })

    _.if(currentShowcase.equalTo(ShowcaseId.NONE), () => {
        showcaseIdleTicks.set(0)
    }).elseIf(showcaseActive.equalTo(1), () => {
        showcaseIdleTicks.set(0)
    }).else(() => {
        showcaseIdleTicks.add(1)
        _.if(showcaseIdleTicks.greaterThanOrEqualTo(IDLE_TIMEOUT_TICKS), () => {
            swapToPlaceholder()
        })
    })
}, { runEveryTick: true })

// advances to the next showcase in `SHOWCASE_ORDER`
export const cycleShowcase = MCFunction('sections/main/showcase/cycle', () => {
    _.if(changeShowcaseCooldown.lessThanOrEqualTo(0), () => {
        changeShowcaseCooldown.set(CHANGE_SHOWCASE_COOLDOWN_TICKS)

        _.switch(currentShowcase, [
            ['case', ShowcaseId.NONE, () => swapShowcase(SHOWCASE_ORDER[0], SHOWCASE_SETUP[SHOWCASE_ORDER[0]])] as const,
            ...SHOWCASE_ORDER.map((id, i) => {
                const next = SHOWCASE_ORDER[(i + 1) % SHOWCASE_ORDER.length]
                return ['case', id, () => swapShowcase(next, SHOWCASE_SETUP[next])] as const
            }),
        ])
    })
})

const CHANGE_SHOWCASE_TAG = 'sandstone_summit_booth.showcase.change_button' as `${any}${string}`

const CHANGE_SHOWCASE_POS = abs(panels.settings.x, panels.settings.y - 0.5, panels.settings.z)

const CHANGE_SHOWCASE_WIDTH = 3
const CHANGE_SHOWCASE_HEIGHT = 0.6

const CLICK_FRONT_MARGIN = 0.1
const settingsFacingRad = (panels.settings.facing * Math.PI) / 180
const changeShowcaseForward = CHANGE_SHOWCASE_WIDTH / 2 - CLICK_FRONT_MARGIN
const CHANGE_SHOWCASE_INTERACTION_POS = abs(
    panels.settings.x + Math.sin(settingsFacingRad) * changeShowcaseForward,
    panels.settings.y - 0.5,
    panels.settings.z - Math.cos(settingsFacingRad) * changeShowcaseForward,
)

// always present regardless of which showcase is active
const spawnChangeShowcaseButton = MCFunction('sections/main/showcase/ui/spawn_button', () => {
    kill(Selector('@e', { tag: CHANGE_SHOWCASE_TAG }))

    summon('minecraft:text_display', CHANGE_SHOWCASE_POS, {
        Tags: [CHANGE_SHOWCASE_TAG, BOOTH_ENTITY_TAG, 'summit.interactable', 'summit.static'],
        text: [
            { text: '⇄ ', color: 'yellow' },
            { text: 'Change Showcase', color: 'white', bold: true },
        ],
        alignment: 'center',
        billboard: 'fixed',
        Rotation: NBT.float([panels.settings.facing, 0]),
        background: NBT.int(0),
        brightness: { sky: NBT.int(15), block: NBT.int(15) },
    })

    summon('minecraft:interaction', CHANGE_SHOWCASE_INTERACTION_POS, {
        Tags: [CHANGE_SHOWCASE_TAG, BOOTH_ENTITY_TAG, 'summit.interactable', 'summit.static'],
        width: NBT.float(CHANGE_SHOWCASE_WIDTH),
        height: NBT.float(CHANGE_SHOWCASE_HEIGHT / 2),
        response: false,
        data: {
            summit_interactable: {
                on_right_click: 'execute on target run function sandstone_summit_booth:sections/main/showcase/cycle',
            },
        },
    })
})

const killChangeShowcaseButton = MCFunction('sections/main/showcase/ui/kill_button', () => {
    kill(Selector('@e', { tag: CHANGE_SHOWCASE_TAG }))
})

const killSettingsPanel = MCFunction('sections/main/showcase/ui/kill_settings', () => {
    kill(Selector('@e', { tag: RhythmTags.UI_SETTINGS }))
})

const killLeaderboardPanel = MCFunction('sections/main/showcase/ui/kill_leaderboard', () => {
    kill(Selector('@e', { tag: RhythmTags.UI_LEADERBOARD }))
})

// Summit compliance:
const spawnShowcaseUI = MCFunction('sections/main/showcase/ui/spawn', () => {
    spawnChangeShowcaseButton()
    spawnSettingsPanel()
    spawnLeaderboardPanel()
})

const killShowcaseUI = MCFunction('sections/main/showcase/ui/kill', () => {
    killChangeShowcaseButton()
    killSettingsPanel()
    killLeaderboardPanel()
})

Tag('function', 'summit.booth:sandstone_summit_booth/entities/summon', [spawnShowcaseUI], { onConflict: 'append' })
Tag('function', 'summit.booth:sandstone_summit_booth/entities/kill', [killShowcaseUI], { onConflict: 'append' })