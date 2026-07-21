import {_, abs, Advancement, attribute, Data, execute, fill, functionCmd, kill, Label, MCFunction, NBT, playsound, raw, rel, say, type Score, Selector, sleep, summon, Tag, Variable } from 'sandstone'
import { BOOTH_ENTITY_TAG, NAMESPACE } from '@shared'
import { CarLabel, CarPartLabel, SouthInnerDoor, WestInnerDoor, summonElevator, BUTTON_INTERACTION_OFFSETS } from './summon'

type Door = {
    min: {
        x: number,
        y: number,
        z: number,
    };
    max: {
        x: number,
        y: number,
        z: number,
    },
    direction: 'south' | 'west'
    display_door: number,
}

type CallButton = {
    light: {
        pos: [number, number, number],
        rotation: [number, number, number, number],
        scale: [number, number, number],
        translation: [number, number, number],
    },
}

type Floor = {
    elevator_pos: [number, number, number],
    name: string,
    number: number,
    doors: Door[],
    callButton: CallButton,
}

export const FLOORS: Floor[] = [
    { 
        elevator_pos: [-55, 83.5, 46],
        name: 'Casino | Upper Level',
        number: 3,
        doors: [
            {
                min: {
                    x: -58,
                    y: 84,
                    z: 45
                },
                max: {
                    x: -58,
                    y: 86,
                    z: 46
                },
                direction: 'west',
                display_door: 2
            }
        ],
        callButton: {
            light: {
                pos: [-57.5, 86.6875, 46.001], // TODO
                rotation: [1, 0, 0, 0],
                scale: [1, 1, 1],
                translation: [-0.5, 0.75, 0.5],
            },
        },
    },
    {
        elevator_pos: [-55, 73.5, 46],
        name: 'Casino | Lower Level',
        number: 2,
        doors: [
            {
                min: {
                    x: -58,
                    y: 74,
                    z: 45
                },
                max: {
                    x: -58,
                    y: 77,
                    z: 46
                },
                direction: 'west',
                display_door: 2
            }
        ],
        callButton: {
            light: {
                pos: [-57.5, 77.6875, 46.001], // TODO
                rotation: [1, 0, 0, 0],
                scale: [1, 1, 1],
                translation: [-0.5, 0.75, 0.5],
            },
        },
    },
    {
        elevator_pos: [-55, 63.5, 46],
        name: 'Showcases',
        number: 1,
        doors: [
            {
                min: {
                    x: -54,
                    y: 64,
                    z: 49
                },
                max: {
                    x: -55,
                    y: 67,
                    z: 49
                },
                direction: 'south',
                display_door: 1
            }
        ],
        callButton: {
            light: {
                pos: [-54.001, 67.6875, 49.5], // TODO
                rotation: [1, 0, 0, 0],
                scale: [1, 1, 1],
                translation: [-0.5, 0.75, 0.5],
            },
        },
    },
]

// index of the floor to spawn the elevator at
export const STARTING_FLOOR = 2

// Elevator car selector and tag
const Car = CarLabel(Selector('@e', { limit: 1 }))

const ButtonLabel = Label('elevator.button')
export const ButtonFloorLabels = FLOORS.map((_, floorIdx) => Label(`elevator.button.${floorIdx}` as `${any}${string}`))

// id for the gravity modifier given to players riding the elevator
const GRAVITY_MODIFIER = `${NAMESPACE}:elevator_ride` as const

// where is the elevator (only ever set inside spawnElevator, so a /reload doesn't reset an already-spawned car)
const CurrentFloor = Variable()
// where is it going
const TargetFloor = Variable()

// Riders are anyone currently standing in the 5x5x5 volume directly above the floor, relative to the car's own position
const FLOOR_TOP = 0.53125
const FOOTPRINT_CORNER = [-2.5, FLOOR_TOP, -2.5] as const
const FOOTPRINT = { dx: 5, dy: 5, dz: 5 } as const

// tag for players riding the elevator
const RiderLabel = Label('elevator.rider')
const GRAVITY_ATTRIBUTE = 'minecraft:gravity' as const
const SAFE_FALL_ATTRIBUTE = 'minecraft:safe_fall_distance' as const
const SAFE_FALL_BOOST = 1000

// all floors share the same x/z so the car only ever needs to move on Y
const [SHAFT_X, , SHAFT_Z] = FLOORS[STARTING_FLOOR].elevator_pos
export const CAR_TELEPORT_DURATION = 1

// the car is driven by whichever rider currently holds this tag
const DriverLabel = Label('elevator.driver')
const RiderDriver = Selector('@a', { tag: DriverLabel, limit: 1, gamemode: "!spectator" })
const RiderY = Variable(undefined, 'elevator.rider_y')

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

const ElevatorIsMoving = Variable()

function floorBarrierCorners(floorIdx: number) {
    const [x, yRaw, z] = FLOORS[floorIdx].elevator_pos
    const y = Math.floor(yRaw)
    return [abs(x - 2, y, z - 2), abs(x + 2, y, z + 2)] as const
}

function fillFloorBarrier(floorIdx: number) {
    const [corner1, corner2] = floorBarrierCorners(floorIdx)
    fill(corner1, corner2, 'minecraft:barrier')

    for (const door of FLOORS[floorIdx].doors) {
        if (door.direction === 'south') {
            fill(abs(door.min.x, door.min.y - 1, door.min.z - 1), abs(door.max.x, door.min.y - 1, door.max.z - 1), 'minecraft:barrier')
        }
        if (door.direction === 'west') {
            fill(abs(door.min.x + 1, door.min.y - 1, door.min.z), abs(door.max.x + 1, door.min.y - 1, door.max.z), 'minecraft:barrier')
        }
    }
}

function clearFloorBarrier(floorIdx: number) {
    const [corner1, corner2] = floorBarrierCorners(floorIdx)
    fill(corner1, corner2, 'minecraft:air').replace('minecraft:barrier')

    for (const door of FLOORS[floorIdx].doors) {
        if (door.direction === 'south') {
            fill(abs(door.min.x, door.min.y - 1, door.min.z - 1), abs(door.max.x, door.min.y - 1, door.max.z - 1), 'minecraft:oxidized_copper_trapdoor[open=true,facing=north]')
        }
        if (door.direction === 'west') {
            fill(abs(door.min.x + 1, door.min.y - 1, door.min.z), abs(door.max.x + 1, door.min.y - 1, door.max.z), 'minecraft:oxidized_copper_trapdoor[open=true,facing=east]')
        }
    }
}

function setDoorDisplayScale(displayDoor: number, scale: number) {
    const label = displayDoor === 1 ? SouthInnerDoor : WestInnerDoor
    execute.as(Selector('@e', { tag: [label] })).run(() => {
        Data('entity', '@s', 'transformation.scale').set(NBT.float([scale, scale, scale]))
    })
}

function openFloorDoors(floorIdx: number) {
    for (const door of FLOORS[floorIdx].doors) {
        if (door.direction === 'south') {
            fill(abs(door.min.x, door.min.y, door.min.z - 1), abs(door.max.x, door.max.y, door.max.z), 'minecraft:air').strict()
        }
        if (door.direction === 'west') {
            fill(abs(door.min.x + 1, door.min.y, door.min.z), abs(door.max.x, door.max.y, door.max.z), 'minecraft:air').strict()
        }
        setDoorDisplayScale(door.display_door, 0)
    }
}

function closeFloorDoors(floorIdx: number) {
    for (const door of FLOORS[floorIdx].doors) {
        fill(abs(door.min.x, door.min.y, door.min.z), abs(door.max.x, door.max.y, door.max.z), `minecraft:dark_oak_shelf[facing=${door.direction}]`).strict()
        if (door.direction === 'south') {
            fill(abs(door.min.x, door.min.y, door.min.z - 1), abs(door.max.x, door.max.y, door.max.z - 1), `minecraft:oxidized_copper_trapdoor[open=true,facing=north]`).strict()
        }
        if (door.direction === 'west') {
            fill(abs(door.min.x + 1, door.min.y, door.min.z), abs(door.max.x + 1, door.max.y, door.max.z), `minecraft:oxidized_copper_trapdoor[open=true,facing=east]`).strict()
        }
        setDoorDisplayScale(door.display_door, 1)
    }
}

function closeAllDoors() {
    for (let floorIdx = 0; floorIdx < FLOORS.length; floorIdx++) {
        closeFloorDoors(floorIdx)
    }
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

function snapToFloor(floorIdx: number) {
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

// lights/unlights a single floor's call button torch
function setButtonLight(floorIdx: number, lit: boolean) {
    execute.as(Selector('@e', { tag: ButtonFloorLabels[floorIdx], type: 'minecraft:block_display' })).run(() => {
        Data('entity', '@s', 'block_state.Properties.lit').set(lit ? 'true' : 'false')
    })
}

function setExteriorButtonLight(floorIdx: number, lit: boolean) {
    execute.as(Selector('@e', { tag: [ButtonFloorLabels[floorIdx], ButtonLabel], type: 'minecraft:block_display' })).run(() => {
        Data('entity', '@s', 'block_state.Properties.lit').set(lit ? 'true' : 'false')
    })
}

// only `activeFloorIdx`'s call button is lit; every other floor's button goes dark
function updateButtonLights(activeFloorIdx: number) {
    for (let floorIdx = 0; floorIdx < FLOORS.length; floorIdx++) {
        setButtonLight(floorIdx, floorIdx === activeFloorIdx)
    }
}

function openArrivalDoors(floorIdx: number) {
    openFloorDoors(floorIdx)
    setExteriorButtonLight(floorIdx, false)
}

// arrives at `floorIdx`: this is always the final stop
function arriveAt(floorIdx: number) {
    snapToFloor(floorIdx)
    openArrivalDoors(floorIdx)

    // playsound('minecraft:block.note_block.bell', 'music', '@a', abs(...FLOORS[floorIdx].elevator_pos), 1, 0.5)

    ElevatorIsMoving.set(0)
}

// starts a trip from CurrentFloor to TargetFloor
function beginTrip() {
    closeAllDoors()

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

    // light the floor the car is heading to while the trip is in progress
    _.switch(TargetFloor, FLOORS.map((_floor, idx) => ['case', idx, () => updateButtonLights(idx)] as const))

    ElevatorIsMoving.set(1)
}

function requestFloor(floorIdx: number) {
    // ignore requests made mid-trip, and requests for the floor the car is at
    _.if(_.and(CurrentFloor.equalTo(TargetFloor), CurrentFloor.notEqualTo(floorIdx)), () => {
        TargetFloor.set(floorIdx)
        beginTrip()
    })
}

function detectBell(x: number, y: number, z: number, targetFloor: number) {
    const rungBell = Advancement(`sections/elevator/ring_bell_${targetFloor}`, {
        criteria: {
            [`rung_bell_${targetFloor}` as const]: {
                trigger: 'minecraft:default_block_use',
                conditions: {
                    location: [
                        {
                            condition: 'minecraft:location_check',
                            predicate: {
                                // because of radius based checks in predicates, the context origin is in the center of the block
                                position: { x: x + .5, y: y + .5, z: z + .5 },
                                block: { blocks: 'minecraft:bell' }
                            }
                        },
                        {
                            condition: 'minecraft:inverted',
                            term: {
                                condition: 'minecraft:value_check',
                                value: {
                                    type: 'minecraft:score',
                                    target: { type: 'minecraft:fixed', name: CurrentFloor.target },
                                    score: CurrentFloor.objective
                                },
                                range: targetFloor
                            }
                        },
                        {
                            condition: 'minecraft:value_check',
                            value: {
                                type: 'minecraft:score',
                                target: { type: 'minecraft:fixed', name: ElevatorIsMoving.target },
                                score: ElevatorIsMoving.objective
                            },
                            range: 0
                        }
                    ]
                }
            }
        },
        rewards: {
            function: MCFunction(`sections/elevator/call_elevator_${targetFloor}`, async () => {
                rungBell.revoke('@s')

                TargetFloor.set(targetFloor)

                _.if(_.entity(Riders), () => {
                    beginTrip()
                }).else(async () => {
                    ElevatorIsMoving.set(1)
                    updateButtonLights(targetFloor)
                    closeAllDoors()
                    sleep('2s')
                    arriveAt(targetFloor)
                })
            })
        }
    })
}

detectBell(-53, 65, 50, 2)
detectBell(-59, 75, 47, 1)
detectBell(-59, 85, 48, 0)

function detectInsideButton(floorIdx: number) {
    const clicked = Advancement(`sections/elevator/inside_button_${floorIdx}`, {
        criteria: {
            click: {
                trigger: 'minecraft:player_interacted_with_entity',
                conditions: {
                    entity: { entity_type: 'minecraft:interaction', entity_tags: { all_of: [ButtonFloorLabels[floorIdx].fullName] } },
                },
            },
        },
        rewards: {
            function: MCFunction(`sections/elevator/inside_button_reward/${floorIdx}`, () => {
                clicked.revoke('@s')
                requestFloor(floorIdx)
            })
        }
    })
}

for (let floorIdx = 0; floorIdx < FLOORS.length; floorIdx++) {
    detectInsideButton(floorIdx)
}

export const killElevator = MCFunction('sections/elevator/kill', () => {
    execute.as(Riders).run(() => {
        attribute('@s', GRAVITY_ATTRIBUTE).remove(GRAVITY_MODIFIER)
        attribute('@s', SAFE_FALL_ATTRIBUTE).remove(GRAVITY_MODIFIER)
        RiderLabel('@s').remove()
        DriverLabel('@s').remove()
    })

    kill(Car)
    kill(CarPartLabel('@e' as '@s'))
    kill(ButtonLabel('@e' as '@s'))

    for (let floorIdx = 0; floorIdx < FLOORS.length; floorIdx++) {
        clearFloorBarrier(floorIdx)
    }

    closeAllDoors()

    ElevatorIsMoving.set(-1)
})

export const spawnElevator = MCFunction('sections/elevator/spawn', () => {
    // clean up anything left over from a previous spawn so re-running this is always safe
    killElevator()

    CurrentFloor.set(STARTING_FLOOR)
    TargetFloor.set(STARTING_FLOOR)
    ElevatorIsMoving.set(0)

    summonElevator()

    for (let floorIdx = 0; floorIdx < FLOORS.length; floorIdx++) {
        const [ox, oy, oz] = BUTTON_INTERACTION_OFFSETS[floorIdx]
        const [ex, ey, ez] = FLOORS[STARTING_FLOOR].elevator_pos

        summon('minecraft:interaction', abs(ex + ox, ey + oy, ez + oz), {
            Tags: [ButtonFloorLabels[floorIdx].fullName, CarPartLabel.fullName, BOOTH_ENTITY_TAG],
            width: NBT.float(0.25),
            height: NBT.float(0.25),
            response: true,
        })
    }

    fillFloorBarrier(STARTING_FLOOR)
    closeAllDoors()
    openFloorDoors(STARTING_FLOOR)

    // outside call buttons: one redstone_torch light + one interaction hitbox per floor
    for (let floorIdx = 0; floorIdx < FLOORS.length; floorIdx++) {
        const floor = FLOORS[floorIdx]
        const floorLabel = ButtonFloorLabels[floorIdx]
        const { light } = floor.callButton

        summon('minecraft:block_display', abs(...light.pos), {
            Tags: [ButtonLabel.fullName, floorLabel.fullName, BOOTH_ENTITY_TAG],
            block_state: {
                Name: 'minecraft:redstone_torch',
                Properties: { lit: 'false' },
            },
            transformation: {
                left_rotation: NBT.float(light.rotation),
                right_rotation: NBT.float([0, 0, 0, 1]),
                scale: NBT.float(light.scale),
                translation: NBT.float(light.translation),
            },
        })
    }
})

Tag('function', 'summit.booth:sandstone_summit_booth/entities/summon', [spawnElevator], { onConflict: 'append' })
Tag('function', 'summit.booth:sandstone_summit_booth/entities/kill', [killElevator], { onConflict: 'append' })

MCFunction('sections/elevator/step', () => {
    for (let floorIdx = 0; floorIdx < FLOORS.length; floorIdx++) {
        const [ox, oy, oz] = BUTTON_INTERACTION_OFFSETS[floorIdx]
        execute.at(Car).run.tp(Selector('@e', { tag: ButtonFloorLabels[floorIdx], type: 'minecraft:interaction', limit: 1 }), rel(ox, oy, oz))
    }

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
        _.switch(TargetFloor, FLOORS.map((_floor, idx) => ['case', idx, () => updateButtonLights(idx)] as const))

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
