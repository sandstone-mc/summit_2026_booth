import {_, abs, attribute, Data, execute, fill, functionCmd, kill, Label, MCFunction, raw, rel, Selector, Tag, Variable } from 'sandstone'
import { VectorClass } from 'sandstone/variables'
import { NAMESPACE } from '@shared'
import { sleep } from 'bun';

type Floor = {
    elevator_pos: [number, number, number],
    name: string;
    number: number;
}

const FLOORS: Floor[] = [
    { 
        elevator_pos: [-55, 83.5, 46],
        name: 'Casino | Upper Level',
        number: 3
    },
    { 
        elevator_pos: [-55, 73.5, 46],
        name: 'Casino | Lower Level',
        number: 2
    },
    { 
        elevator_pos: [-55, 63.5, 46],
        name: 'Showcases',
        number: 1
    },
]

// index of the floor to spawn the elevator at
const STARTING_FLOOR = 2
const BOOTH_ENTITY_TAG = `summit.booth_entity.${NAMESPACE}` as `${any}${string}`

// Elevator car selector and tag
const CarLabel = Label('elevator.car')
const Car = Selector('@e', { tag: CarLabel, limit: 1 })

const CarPartLabel = Label('elevator.car_part')

// id for the gravity modifier given to players riding the elevator
const GRAVITY_MODIFIER = `${NAMESPACE}:elevator_ride` as `${string}:${string}`

// where is the elevator
const CurrentFloor = Variable(STARTING_FLOOR)
// where is it going
const TargetFloor = Variable(STARTING_FLOOR)

// Riders are anyone currently standing in the 5x5x5 volume directly above the floor, relative to the car's own position
const FLOOR_TOP = 0.53125
const FOOTPRINT_CORNER = [-2.5, FLOOR_TOP, -2.5] as const
const FOOTPRINT = { dx: 5, dy: 5, dz: 5 } as const

// tag for players riding the elevator
const RiderLabel = Label('elevator.rider')
const GRAVITY_ATTRIBUTE = 'minecraft:gravity' as `${string}:${string}`
const SAFE_FALL_ATTRIBUTE = 'minecraft:safe_fall_distance' as `${string}:${string}`
const SAFE_FALL_BOOST = 1000

// all floors share the same x/z so the car only ever needs to move on Y
const [SHAFT_X, , SHAFT_Z] = FLOORS[STARTING_FLOOR].elevator_pos
const CAR_TELEPORT_DURATION = 1

// the car is driven by whichever rider currently holds this tag
const DriverLabel = Label('elevator.driver')
const RiderDriver = Selector('@a', { tag: DriverLabel, limit: 1 })
const RiderY = Variable(0, 'elevator.rider_y')

const RIDER_SPEED_BLOCKS_PER_TICK = 0.2
const DEFAULT_GRAVITY = 0.08
const AIR_DRAG_PER_TICK = 0.98
const RIDE_ACCEL = RIDER_SPEED_BLOCKS_PER_TICK * (1 - AIR_DRAG_PER_TICK)

const gravityMultiplierFor = (totalGravity: number) => totalGravity / DEFAULT_GRAVITY - 1
const GRAVITY_MULT_UP = gravityMultiplierFor(-RIDE_ACCEL)
const GRAVITY_MULT_DOWN = gravityMultiplierFor(RIDE_ACCEL)

const LAUNCH_SCALE = 10000
const LIFTOFF_LAUNCH_SCORE = Math.round(RIDER_SPEED_BLOCKS_PER_TICK * LAUNCH_SCALE)

const Riders = Selector('@a', { tag: RiderLabel })

function floorBarrierCorners(floorIdx: number) {
    const [x, yRaw, z] = FLOORS[floorIdx].elevator_pos
    const y = Math.floor(yRaw)
    return [abs(x - 2, y, z - 2), abs(x + 2, y, z + 2)] as const
}

function fillFloorBarrier(floorIdx: number) {
    const [corner1, corner2] = floorBarrierCorners(floorIdx)
    fill(corner1, corner2, 'minecraft:barrier')
}

function clearFloorBarrier(floorIdx: number) {
    const [corner1, corner2] = floorBarrierCorners(floorIdx)
    fill(corner1, corner2, 'minecraft:air').replace('minecraft:barrier')
}

// tags anyone currently standing in the car's footprint as a rider
function tagFootprintRiders() {
    execute
        .at(Car)
        .positioned(rel(...FOOTPRINT_CORNER))
        .as(Selector('@a', { ...FOOTPRINT, tag: `!${RiderLabel.fullName}` }))
        .run(() => {
            RiderLabel('@s').add()
        })
}

function ensureDriver() {
    _.if(_.not(_.entity(RiderDriver)), () => {
        execute.as(Selector('@a', { tag: RiderLabel, limit: 1 })).run(() => {
            DriverLabel('@s').add()
        })
    })
}

// applies this trip's directional gravity to every current rider
function applyRiderGravityForTrip() {
    execute.as(Riders).run(() => {
        attribute('@s', GRAVITY_ATTRIBUTE).remove(GRAVITY_MODIFIER)
        _.if(TargetFloor.greaterThan(CurrentFloor), () => {
            attribute('@s', GRAVITY_ATTRIBUTE).add(GRAVITY_MODIFIER, GRAVITY_MULT_DOWN, 'add_multiplied_total')
        }).else(() => {
            attribute('@s', GRAVITY_ATTRIBUTE).add(GRAVITY_MODIFIER, GRAVITY_MULT_UP, 'add_multiplied_total')
        })
        attribute('@s', SAFE_FALL_ATTRIBUTE).add(GRAVITY_MODIFIER, SAFE_FALL_BOOST, 'add_value')
    })
}

function releaseAllRiders() {
    execute.as(Riders).run(() => {
        attribute('@s', GRAVITY_ATTRIBUTE).remove(GRAVITY_MODIFIER)
        attribute('@s', SAFE_FALL_ATTRIBUTE).remove(GRAVITY_MODIFIER)
    })
}

// one-off vertical kick to break ground contact
function launchRidersUp() {
    execute.as(Riders).run(() => {
        raw(`scoreboard players set $y player_motion.api.launch ${LIFTOFF_LAUNCH_SCORE}`)
        raw('scoreboard players set $x player_motion.api.launch 0')
        raw('scoreboard players set $z player_motion.api.launch 0')
        functionCmd('player_motion:api/launch_xyz')
    })
}

// arrives at `floorIdx`: this is always the final stop
function arriveAt(floorIdx: number) {
    // riders rest at car.y + FLOOR_TOP (the floor's walkable surface)
    const restY = FLOORS[floorIdx].elevator_pos[1] + FLOOR_TOP

    // snap to current floor
    execute.as(Car).run.tp('@s', abs(...FLOORS[floorIdx].elevator_pos))
    CurrentFloor.set(floorIdx)

    // snap the player just in case
    execute.as(Riders).at('@s').run.tp('@s', [rel(0), abs(restY), rel(0)])
    fillFloorBarrier(floorIdx)
    releaseAllRiders()
}

// starts a trip from CurrentFloor to TargetFloor
function beginTrip() {
    _.switch(CurrentFloor, FLOORS.map((_fromFloor, fromIdx) => ['case', fromIdx, () => {
        _.switch(TargetFloor, FLOORS.map((_toFloor, toIdx) => ['case', toIdx, () => {
            const lo = Math.min(fromIdx, toIdx)
            const hi = Math.max(fromIdx, toIdx)
            for (let i = lo; i <= hi; i++) {
                if (i !== fromIdx || toIdx > fromIdx) {
                    clearFloorBarrier(i)
                }
            }
        }] as const))
    }] as const))

    tagFootprintRiders()
    ensureDriver()
    applyRiderGravityForTrip()

    _.if(TargetFloor.lessThan(CurrentFloor), () => launchRidersUp())
}

function requestFloor(floorIdx: number) {
    // ignore requests made mid-trip, and requests for the floor the car is at
    _.if(_.and(CurrentFloor.equalTo(TargetFloor), CurrentFloor.notEqualTo(floorIdx)), () => {
        TargetFloor.set(floorIdx)
        beginTrip()
    })
}

export const spawnElevator = MCFunction('sections/elevator/spawn', () => {
    CurrentFloor.set(STARTING_FLOOR)
    TargetFloor.set(STARTING_FLOOR)

    raw(`summon minecraft:block_display ${FLOORS[STARTING_FLOOR].elevator_pos.join(' ')} {Tags: ["${CarLabel.fullName}", "${BOOTH_ENTITY_TAG}"], teleport_duration: ${CAR_TELEPORT_DURATION},Passengers: [{block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, -0.5f, -1.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, -0.5f, -1.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, -0.5f, -0.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, -0.5f, 0.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, -0.5f, 0.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, -0.5f, 0.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, -0.5f, -0.5f]}}, {block_state: {Name: "minecraft:black_wool"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-2.5f, -0.5f, -0.5f]}}, {block_state: {Name: "minecraft:black_wool"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-2.5f, -0.5f, -1.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, -0.5f, -1.5f]}}, {block_state: {Name: "minecraft:stripped_dark_oak_log", Properties: {axis: "z"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, 0.5f, -2.5f]}}, {block_state: {Name: "minecraft:stripped_dark_oak_log", Properties: {axis: "z"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, 0.5f, -2.5f]}}, {block_state: {Name: "minecraft:stripped_dark_oak_log", Properties: {axis: "x"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-2.5f, 0.5f, 0.5f]}}, {block_state: {Name: "minecraft:stripped_dark_oak_log", Properties: {axis: "x"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 0.5f, -1.5f]}}, {block_state: {Name: "minecraft:stripped_dark_oak_log", Properties: {axis: "x"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 0.5f, -0.5f]}}, {block_state: {Name: "minecraft:stripped_dark_oak_log", Properties: {axis: "x"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 0.5f, 0.5f]}}, {block_state: {Name: "minecraft:stripped_dark_oak_log", Properties: {axis: "z"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, 0.5f, -2.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 3.5f, 0.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, 1.5f, -2.5f]}}, {block_state: {Name: "minecraft:crafter", Properties: {crafting: "false", orientation: "down_south", triggered: "false"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, 2.5f, -2.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, 2.5f, -2.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, 2.5f, -2.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, 3.5f, -2.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, 3.5f, -2.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, 3.5f, -2.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 3.5f, -1.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 2.5f, -1.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 1.5f, -1.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 1.5f, -0.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 1.5f, 0.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 2.5f, 0.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 2.5f, -0.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [1.5f, 3.5f, -0.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, 1.5f, -2.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-2.5f, 1.5f, 0.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-2.5f, 3.5f, 0.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-2.5f, 2.5f, 0.5f]}}, {block_state: {Name: "minecraft:dark_oak_fence", Properties: {east: "false", north: "false", south: "false", waterlogged: "false", west: "false"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, -0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.99999994f, 0.99999994f, 1.0f], translation: [-1.5f, 2.125f, -2.0f]}}, {block_state: {Name: "minecraft:dark_oak_fence", Properties: {east: "false", north: "false", south: "false", waterlogged: "false", west: "false"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, -0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.99999994f, 0.99999994f, 1.0f], translation: [-0.5f, 2.125f, -2.0f]}}, {block_state: {Name: "minecraft:dark_oak_fence", Properties: {east: "false", north: "false", south: "false", waterlogged: "false", west: "false"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, -0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.99999994f, 0.99999994f, 1.0f], translation: [0.5f, 2.125f, -2.0f]}}, {block_state: {Name: "minecraft:dark_oak_fence", Properties: {east: "false", north: "false", south: "false", waterlogged: "false", west: "false"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [-0.5f, 0.5f, -0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999997f, 0.9999997f, 0.99999964f], translation: [1.0f, 2.125f, -0.5f]}}, {block_state: {Name: "minecraft:dark_oak_fence", Properties: {east: "false", north: "false", south: "false", waterlogged: "false", west: "false"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [-0.5f, 0.5f, -0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999997f, 0.9999997f, 0.99999964f], translation: [1.0f, 2.125f, 0.5f]}}, {block_state: {Name: "minecraft:dark_oak_fence", Properties: {east: "false", north: "false", south: "false", waterlogged: "false", west: "false"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [-0.5f, 0.5f, -0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999997f, 0.9999997f, 0.99999964f], translation: [1.0f, 2.125f, 1.5f]}}, {block_state: {Name: "minecraft:dark_oak_fence", Properties: {east: "false", north: "false", south: "false", waterlogged: "false", west: "false"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [-0.5f, 0.5f, -0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999997f, 0.9999997f, 0.99999964f], translation: [-2.0f, 2.125f, 1.5f]}}, {block_state: {Name: "minecraft:crafter", Properties: {crafting: "false", orientation: "up_south", triggered: "false"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, 1.5f, -2.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.5f, 0.5f, 0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.99999934f, 0.99999934f, 0.99999905f], translation: [-2.5f, 0.5f, -1.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [-0.5f, 0.5f, -0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999997f, 0.9999997f, 0.99999964f], translation: [-2.5f, 1.5f, 0.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [-0.5f, 0.5f, -0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999997f, 0.9999997f, 0.99999964f], translation: [-2.5f, 2.5f, 0.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [-0.5f, 0.5f, -0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999997f, 0.9999997f, 0.99999964f], translation: [-2.5f, 3.5f, 0.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [-0.5f, 0.5f, -0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999997f, 0.9999997f, 0.99999964f], translation: [-2.5f, 4.5f, 0.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.5f, 0.5f, 0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.99999934f, 0.99999934f, 0.99999905f], translation: [-2.5f, 3.5f, -1.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.5f, 0.5f, 0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.99999934f, 0.99999934f, 0.99999905f], translation: [-2.5f, 2.5f, -1.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.5f, 0.5f, 0.5f, 0.5f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.99999934f, 0.99999934f, 0.99999905f], translation: [-2.5f, 1.5f, -1.5f]}}, {block_state: {Name: "minecraft:black_wool"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-2.5f, 4.5f, -0.5f]}}, {block_state: {Name: "minecraft:black_wool"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-2.5f, 4.5f, -1.5f]}}, {block_state: {Name: "minecraft:redstone_lamp", Properties: {lit: "true"}}, brightness: {block: 15, sky: 15}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, 4.3125f, -0.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, 4.5f, -1.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, 4.5f, -1.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, 4.5f, -1.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, 4.5f, -0.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, 4.5f, 0.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, 4.5f, 0.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, 4.5f, 0.5f]}}, {block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, 4.5f, -0.5f]}}, {block_state: {Name: "minecraft:black_wool"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, -0.5f, 1.5f]}}, {block_state: {Name: "minecraft:black_wool"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, -0.5f, 1.5f]}}, {block_state: {Name: "minecraft:stripped_dark_oak_log", Properties: {axis: "z"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, 0.5f, 1.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, 1.5f, 1.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, 2.5f, 1.5f]}}, {block_state: {Name: "minecraft:yellow_glazed_terracotta", Properties: {facing: "north"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-1.5f, 3.5f, 1.5f]}}, {block_state: {Name: "minecraft:dark_oak_fence", Properties: {east: "false", north: "false", south: "false", waterlogged: "false", west: "false"}}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, -0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999993f, 0.9999993f, 0.9999997f], translation: [-1.5f, 2.125f, 0.99999994f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999999f, 0.9999999f, 1.0f], translation: [1.5f, 0.5f, 1.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, -0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.99999994f, 0.99999994f, 1.0f], translation: [-0.5f, 2.5f, 1.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, -0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.99999994f, 0.99999994f, 1.0f], translation: [-0.5f, 3.5f, 1.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, -0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.99999994f, 0.99999994f, 1.0f], translation: [-0.5f, 4.5f, 1.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999999f, 0.9999999f, 1.0f], translation: [1.5f, 3.5f, 1.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999999f, 0.9999999f, 1.0f], translation: [1.5f, 2.5f, 1.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.9999999f, 0.9999999f, 1.0f], translation: [1.5f, 1.5f, 1.5f]}}, {block_state: {Name: "minecraft:black_wool"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, 4.5f, 1.5f]}}, {block_state: {Name: "minecraft:black_wool"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [0.5f, 4.5f, 1.5f]}}, {block_state: {Name: "minecraft:black_carpet"}, id: "minecraft:block_display", Tags: ["sandstone_summit_booth.elevator.car_part"], transformation: {left_rotation: [0.0f, 0.0f, -0.7071068f, 0.7071068f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [0.99999994f, 0.99999994f, 1.0f], translation: [-0.5f, 1.5f, 1.5f]}}], block_state: {Name: "minecraft:mushroom_stem", Properties: {down: "true", east: "true", north: "true", south: "true", up: "true", west: "true"}}, transformation: {left_rotation: [0.0f, 0.0f, 0.0f, 1.0f], right_rotation: [0.0f, 0.0f, 0.0f, 1.0f], scale: [1.0f, 1.0f, 1.0f], translation: [-0.5f, -0.5f, -0.5f]}}`)

    fillFloorBarrier(STARTING_FLOOR)
})

export const killElevator = MCFunction('sections/elevator/kill', () => {
    execute.as(Riders).run(() => {
        attribute('@s', GRAVITY_ATTRIBUTE).remove(GRAVITY_MODIFIER)
        attribute('@s', SAFE_FALL_ATTRIBUTE).remove(GRAVITY_MODIFIER)
        RiderLabel('@s').remove()
        DriverLabel('@s').remove()
    })

    kill(Car)
    kill(Selector('@e', { tag: CarPartLabel }))

    for (let floorIdx = 0; floorIdx < FLOORS.length; floorIdx++) {
        clearFloorBarrier(floorIdx)
    }
})

Tag('function', 'summit.booth:sandstone_summit_booth/entities/summon', [spawnElevator], { onConflict: 'append' })
Tag('function', 'summit.booth:sandstone_summit_booth/entities/kill', [killElevator], { onConflict: 'append' })

MCFunction('sections/elevator/step', () => {
    tagFootprintRiders()

    execute
        .as(Riders)
        .at(Car)
        .positioned(rel(...FOOTPRINT_CORNER))
        .unless.entity(Selector('@s', { ...FOOTPRINT }))
        .run(() => {
            RiderLabel('@s').remove()
            DriverLabel('@s').remove()
            attribute('@s', GRAVITY_ATTRIBUTE).remove(GRAVITY_MODIFIER)
            attribute('@s', SAFE_FALL_ATTRIBUTE).remove(GRAVITY_MODIFIER)
        })

    _.if(CurrentFloor.notEqualTo(TargetFloor), () => {
        applyRiderGravityForTrip()
        ensureDriver()

        _.if(_.entity(RiderDriver), () => {
            execute.as(Car).at(RiderDriver).run.tp('@s', [abs(SHAFT_X), rel(-0.5), abs(SHAFT_Z)])

            execute.as(RiderDriver).run(() => {
                RiderY.set(Data('entity', '@s', 'Pos[1]'), 10)
            })

            // has the driver actually reached the target floor yet?
            _.switch(TargetFloor, FLOORS.map((floor, idx) => ['case', idx, () => {
                const destYScaled = Math.round((floor.elevator_pos[1] + FLOOR_TOP) * 10)
                _.if(TargetFloor.greaterThan(CurrentFloor), () => {
                    _.if(RiderY.lessThanOrEqualTo(destYScaled), () => arriveAt(idx))
                }).else(() => {
                    _.if(RiderY.greaterThanOrEqualTo(destYScaled), () => arriveAt(idx))
                })
            }] as const))
        })
    })
}, { runEveryTick: true })

export const goToFloor = FLOORS.map((_floor, idx) =>
    MCFunction(`sections/elevator/floors/${idx}/go`, () => requestFloor(idx))
)
