import { abs, Label, NBT, summon } from 'sandstone'

import { FLOORS, CAR_TELEPORT_DURATION, STARTING_FLOOR, CarLabel } from '.'
import { BOOTH_ENTITY_TAG } from '@shared'

const part = Label('elevator.car_part')

const id = 'minecraft:block_display'

const scale = NBT.float([1, 1, 1])

const right_rotation = NBT.float([0, 0, 0, 1])

const transform = { left_rotation: right_rotation, right_rotation, scale }

const transform_a = {
    ...transform,
    left_rotation: NBT.float([0, 0, -0.7071068, 0.7071068]),
}

const transform_b = {
    ...transform,
    left_rotation: NBT.float([-0.5, 0.5, -0.5, 0.5]),
}

const transform_c = {
    ...transform,
    left_rotation: NBT.float([0.5, 0.5, 0.5, 0.5]),
}

const transform_d = {
    ...transform,
    left_rotation: NBT.float([0, 0, 0.7071068, 0.7071068]),
}

// I don't feel like finishing this lol, its good enough
const palette2 = [
    { Name: 'mushroom_stem', Properties: { down: 'true', east: 'true', north: 'true', south: 'true', up: 'true', west: 'true' } },
    { Name: 'black_wool' },
    { Name: 'stripped_dark_oak_log' },
    { Name: 'yellow_glazed_terracotta', Properties: { facing: 'north' } },
    { Name: 'crafter' },
    { Name: 'dark_oak_fence', Properties: { east: 'false', north: 'false', south: 'false', waterlogged: 'false', west: 'false' } },
    { Name: 'black_carpet' },
    { Name: 'redstone_lamp' },
    { Name: 'redstone_torch', Properties: {lit: 'false' } },
] as const

const palette = [
    'mushroom_stem',
    'black_wool',
    'stripped_dark_oak_log',
    'yellow_glazed_terracotta',
    'crafter',
    'dark_oak_fence',
    'black_carpet',
    'redstone_lamp',
    'redstone_torch',
] as const

export const summonElevator = () => summon(id, abs(...FLOORS[STARTING_FLOOR].elevator_pos), {
    Tags: [
        CarLabel,
        BOOTH_ENTITY_TAG,
    ],
    teleport_duration: NBT.int(CAR_TELEPORT_DURATION),

        // mushroom_stem
    ...{                                      transformation: { ...transform, translation: NBT.float([-0.5, -0.5, -0.5]) }, block_state: palette2[0]},
    Passengers: [
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, -0.5, -1.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-0.5, -0.5, -1.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, -0.5, -0.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, -0.5, 0.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-0.5, -0.5, 0.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, -0.5, 0.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, -0.5, -0.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, -0.5, -1.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, 4.5, -1.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-0.5, 4.5, -1.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, 4.5, -1.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, 4.5, -0.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, 4.5, 0.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-0.5, 4.5, 0.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, 4.5, 0.5]) }, block_state: palette2[0] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, 4.5, -0.5]) }, block_state: palette2[0] },

        // TODO: Redstone Torches
        // translation: NBT.float([-0.5, 0.5, 0])
        // left_rotation: NBT.float([0.7071068, 0, 0, 0.7071068])
        // scale: scale
        //
        // Ground Floor:
        // -54.6875 65.6875 44.43775
        // -54.5 65.5 44.43775
        // -54.3125 65.3125 44.43775

        // crafter
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-0.5, 1.5, -2.5]) }, block_state: { Name: palette[4], Properties: { crafting: 'false', orientation: 'up_south', triggered: 'true' } } },

        // black_wool
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-2.5, -0.5, -0.5]) }, block_state: { Name: palette[1] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-2.5, -0.5, -1.5]) }, block_state: { Name: palette[1] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-2.5, 4.5, -0.5]) }, block_state: { Name: palette[1] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-2.5, 4.5, -1.5]) }, block_state: { Name: palette[1] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, -0.5, 1.5]) }, block_state: { Name: palette[1] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-0.5, -0.5, 1.5]) }, block_state: { Name: palette[1] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-0.5, 4.5, 1.5]) }, block_state: { Name: palette[1] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, 4.5, 1.5]) }, block_state: { Name: palette[1] } },

        // stripped_dark_oak_log
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, 0.5, -2.5]) }, block_state: { Name: palette[2], Properties: { axis: 'z' } } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-0.5, 0.5, -2.5]) }, block_state: { Name: palette[2], Properties: { axis: 'z' } } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-2.5, 0.5, 0.5]) }, block_state: { Name: palette[2], Properties: { axis: 'x' } } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 0.5, -1.5]) }, block_state: { Name: palette[2], Properties: { axis: 'x' } } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 0.5, -0.5]) }, block_state: { Name: palette[2], Properties: { axis: 'x' } } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 0.5, 0.5]) }, block_state: { Name: palette[2], Properties: { axis: 'x' } } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, 0.5, -2.5]) }, block_state: { Name: palette[2], Properties: { axis: 'z' } } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, 0.5, 1.5]) }, block_state: { Name: palette[2], Properties: { axis: 'z' } } },

        // yellow_glazed_terracotta
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 3.5, 0.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, 1.5, -2.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, 2.5, -2.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, 2.5, -2.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([0.5, 3.5, -2.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-0.5, 3.5, -2.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, 3.5, -2.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 3.5, -1.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 2.5, -1.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 1.5, -1.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 1.5, -0.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 1.5, 0.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 2.5, 0.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 2.5, -0.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([1.5, 3.5, -0.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, 1.5, -2.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-2.5, 1.5, 0.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-2.5, 3.5, 0.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-2.5, 2.5, 0.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, 1.5, 1.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, 2.5, 1.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-1.5, 3.5, 1.5]) }, block_state: palette2[3] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-0.5, 2.5, -2.5]) }, block_state: palette2[3] },

        // dark_oak_fence
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_a, translation: NBT.float([-1.5, 2.125, -2]) }, block_state: palette2[5] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_a, translation: NBT.float([0.5, 2.125, -2]) }, block_state: palette2[5] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_b, translation: NBT.float([1, 2.125, -0.5]) }, block_state: palette2[5] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_b, translation: NBT.float([1, 2.125, 0.5]) }, block_state: palette2[5] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_b, translation: NBT.float([1, 2.125, 1.5]) }, block_state: palette2[5] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_b, translation: NBT.float([-2, 2.125, 1.5]) }, block_state: palette2[5] },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { translation: NBT.float([-1.5, 2.125, 1]), left_rotation: NBT.float([0, 0, -0.7071068, 0.7071068]), right_rotation, scale }, block_state: palette2[5] },

        // black_carpet
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_a, translation: NBT.float([-0.5, 2.5, 1.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_a, translation: NBT.float([-0.5, 3.5, 1.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_a, translation: NBT.float([-0.5, 4.5, 1.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_a, translation: NBT.float([-0.5, 1.5, 1.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_b, translation: NBT.float([-2.5, 1.5, 0.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_b, translation: NBT.float([-2.5, 2.5, 0.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_b, translation: NBT.float([-2.5, 3.5, 0.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_b, translation: NBT.float([-2.5, 4.5, 0.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_c, translation: NBT.float([-2.5, 0.5, -1.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_c, translation: NBT.float([-2.5, 3.5, -1.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_c, translation: NBT.float([-2.5, 2.5, -1.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_c, translation: NBT.float([-2.5, 1.5, -1.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_d, translation: NBT.float([1.5, 0.5, 1.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_d, translation: NBT.float([1.5, 3.5, 1.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_d, translation: NBT.float([1.5, 2.5, 1.5]) }, block_state: { Name: palette[6] } },
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform_d, translation: NBT.float([1.5, 1.5, 1.5]) }, block_state: { Name: palette[6] } },

        // redstone_lamp
        { id, Tags: [part, BOOTH_ENTITY_TAG], transformation: { ...transform, translation: NBT.float([-0.5, 4.3125, -0.5]) }, block_state: { Name: palette[7], Properties: { lit: 'true' } }, brightness: { block: NBT.int(15), sky: NBT.int(15) } },
    ],
})