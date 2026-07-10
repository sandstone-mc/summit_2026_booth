import { _, abs, execute, fill, kill, MCFunction, NBT, Selector, summon, tp, Variable } from 'sandstone'
import { panels } from '@rhythm/config/internal/derived'

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
const ShowcaseOccupancy = Variable(0, 'main.showcase.occupancy')

// true (1) while at least one player is inside the shared showcase area, false (0) otherwise -
// lets other sections (e.g. magic's tick) skip work entirely while the showcase is empty
export const IsPlayerInShowcase = Variable(0, 'main.showcase.occupied')

MCFunction('sections/main/showcase/enter', () => {
    ShowcaseOccupancy.add(1)
    IsPlayerInShowcase.set(1)
})

MCFunction('sections/main/showcase/exit', () => {
    ShowcaseOccupancy.remove(1)
    _.if(ShowcaseOccupancy.lessThanOrEqualTo(0), () => {
        ShowcaseOccupancy.set(0)
        IsPlayerInShowcase.set(0)
    })
})

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

function swapShowcase(target: ShowcaseId.RHYTHM | ShowcaseId.MAGIC, setup: () => void) {
    _.if(showcaseActive.equalTo(0), () => {
        // clear anyone still standing in the shared area before it gets wiped out from under them
        execute.as(PlayersInShowcase).run(() => {
            tp('@s', RESET_POS, RESET_ROTATION)
        })

        _.switch(currentShowcase, [
            ['case', ShowcaseId.RHYTHM, () => rhythmCleanup()] as const,
            ['case', ShowcaseId.MAGIC, () => magicCleanup()] as const,
        ])

        fill(...SHOWCASE_BOUNDS, 'minecraft:air').strict()

        setup()

        currentShowcase.set(target)
    })
}

export const swapToRhythm = MCFunction('sections/main/showcase/swap_to_rhythm', () => {
    swapShowcase(ShowcaseId.RHYTHM, rhythmSetup)
})

export const swapToMagic = MCFunction('sections/main/showcase/swap_to_magic', () => {
    swapShowcase(ShowcaseId.MAGIC, magicSetup)
})

// advances to the next showcase in `SHOWCASE_ORDER`
export const cycleShowcase = MCFunction('sections/main/showcase/cycle', () => {
    _.switch(currentShowcase, [
        ['case', ShowcaseId.NONE, () => swapShowcase(SHOWCASE_ORDER[0], SHOWCASE_SETUP[SHOWCASE_ORDER[0]])] as const,
        ...SHOWCASE_ORDER.map((id, i) => {
            const next = SHOWCASE_ORDER[(i + 1) % SHOWCASE_ORDER.length]
            return ['case', id, () => swapShowcase(next, SHOWCASE_SETUP[next])] as const
        }),
    ])
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
MCFunction('sections/main/showcase/spawn_button', () => {
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
}, { runOnLoad: true })
