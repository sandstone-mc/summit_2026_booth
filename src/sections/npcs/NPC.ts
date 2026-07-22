import { _, abs, Advancement, Data, execute, kill, Label, MCFunction, NBT, Objective, raw, ride, Selector, summon, Tag } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import type { DialogueTree } from './DialogueTree'

const BOOTH_ENTITY_TAG = 'summit.booth_entity.sandstone_summit_booth' as `${any}${string}`

// Label for NPC text displays
export const NpcDisplayLabel = Label('npc.display')

// No score = no active dialogue
// 0+ = current line
export const DialogueLineIndex = Objective.create('npc.dialogue.line')

// typewriter reveal state, driven by the tick loop below

// characters revealed so far in the active line
export const RevealCount = Objective.create('npc.dialogue.reveal_count')

// ticks left before the next character reveals
export const RevealDelay = Objective.create('npc.dialogue.reveal_delay')

// ticks per character for the active line; reset to 1 during the post-reveal auto-hold countdown
export const RevealSpeed = Objective.create('npc.dialogue.reveal_speed')

// total character count of the active line/variant
export const RevealTotal = Objective.create('npc.dialogue.reveal_total')

// gates whether the tick loop should keep stepping this NPC's reveal
export const RevealingLabel = Label('npc.dialogue.revealing')

// ticks to ignore new clicks after processing one
const INTERACT_COOLDOWN_TICKS = 4
const InteractCooldown = Objective.create('npc.interact_cooldown')

// shared per-tick counter (stored on a fake-player, not per-entity) used to
// throttle checks that don't need to run every single tick
const NpcTickCounter = Objective.create('npc.tick_counter')
const THROTTLE_TICKS = 5

// blocks above the mannequin head the display sits at
const HEAD_HEIGHT = 0.2

// Pick NPC skin via a player profile lookup, a signed skin property, and/or
// direct resource-pack texture overrides
export interface NPCSkin {
    // Resolves a player's profile (skin/cape/elytra) from Mojang's servers by username
    username?: string

    // Signed skin texture property (base64 texture JSON + signature), overriding username
    properties?: { value: string; signature?: string }

    // Namespaced texture resource locations, overriding whatever username/properties resolved
    texture?: string
    cape?: string
    elytra?: string

    model?: 'wide' | 'slim'
}

// 'interactor' faces whoever's currently talking to this NPC, and looks back
// to the spawn rotation once nobody is (only meaningful with `dialogue` set)
export type LookAtMode = 'nearest' | 'interactor' | 'none'

// 'sitting' is faked by mounting the mannequin on an invisible zero-height interaction seat
export type NPCPose = 'standing' | 'crouching' | 'sleeping' | 'sitting'

export interface NPCItemStack {
    id: string
    count?: any
    components?: Record<string, any>
}

export type NPCHeldItem = string | NPCItemStack

export interface NPCOptions {
    name: string
    skin: NPCSkin
    position: [number, number, number]
    // Initial [yaw, pitch]. Defaults to facing south
    rotation?: [number, number]
    // Defaults to 'nearest'
    lookAt?: LookAtMode
    // Defaults to 'standing'
    pose?: NPCPose
    mainHand?: NPCHeldItem
    offHand?: NPCHeldItem
    // Omit for a purely decorative NPC, no click detection gets set up for it
    dialogue?: DialogueTree
}

export interface RegisteredNPC extends NPCOptions {
    id: string
    instanceTag: `${any}${string}`
    interactorTag: `${any}${string}`
}

export const registry: RegisteredNPC[] = []

function profileFor(skin: NPCSkin) {
    return {
        ...(skin.username ? { name: skin.username } : {}),
        ...(skin.properties ? { properties: [{ name: 'textures', value: skin.properties.value, ...(skin.properties.signature ? { signature: skin.properties.signature } : {}) }] } : {}),
        ...(skin.texture ? { texture: skin.texture as any } : {}),
        ...(skin.cape ? { cape: skin.cape as any } : {}),
        ...(skin.elytra ? { elytra: skin.elytra as any } : {}),
        ...(skin.model ? { model: skin.model } : {}),
    }
}

export function CreateNPC(id: string, options: NPCOptions) {
    registry.push({
        ...options,
        id,
        instanceTag: `sandstone_summit_booth.npc.${id}` as `${any}${string}`,
        interactorTag: `sandstone_summit_booth.npc.${id}.interactor` as `${any}${string}`,
    })
}

const spawnNpcs = MCFunction('sections/npcs/spawn', () => {
    for (const npc of registry) {
        const seatTag = `${npc.instanceTag}.seat` as `${any}${string}`

        kill(Selector('@e', { tag: npc.instanceTag }))
        kill(Selector('@e', { tag: seatTag }))

        const [x, y, z] = npc.position
        const [yaw, pitch] = npc.rotation ?? [0, 0]

        const mannequinNbt: SymbolEntity['mannequin'] = {
            Tags: [npc.instanceTag, BOOTH_ENTITY_TAG],
            Rotation: NBT.float([yaw, pitch]),
            immovable: true,
            profile: profileFor(npc.skin),
            pose: npc.pose === 'sitting' ? 'standing' : (npc.pose ?? 'standing'),
            equipment: {
                ...(typeof npc.mainHand === 'string' ? { mainhand: { id: npc.mainHand as any, count: NBT.int(1) } } : {}),
                ...(typeof npc.offHand === 'string' ? { offhand: { id: npc.offHand as any, count: NBT.int(1) } } : {}),
            },
            Passengers: [
                {
                    id: 'minecraft:text_display',
                    Tags: [npc.instanceTag, NpcDisplayLabel, BOOTH_ENTITY_TAG],
                    text: '',
                    alignment: 'center',
                    billboard: 'vertical',
                    // background: NBT.int(0),
                    shadow: true,
                    line_width: NBT.int(200),
                    transformation: {
                        translation: [NBT.float(0), NBT.float(HEAD_HEIGHT), NBT.float(0)],
                        left_rotation: [NBT.float(0), NBT.float(0), NBT.float(0), NBT.float(1)],
                        right_rotation: [NBT.float(0), NBT.float(0), NBT.float(0), NBT.float(1)],
                        scale: [NBT.float(0.6), NBT.float(0.6), NBT.float(0.6)],
                    },
                    brightness: { sky: NBT.int(15), block: NBT.int(15) },
                } as any,
            ],
        }

        summon('minecraft:mannequin', abs(x, y, z), mannequinNbt)

        if (typeof npc.mainHand === 'object' || typeof npc.offHand === 'object') {
            execute.as(Selector('@e', { tag: npc.instanceTag, type: 'minecraft:mannequin', limit: 1 })).run(() => {
                if (typeof npc.mainHand === 'object') {
                    Data('entity', '@s', 'equipment.mainhand').set(npc.mainHand as any)
                }
                if (typeof npc.offHand === 'object') {
                    Data('entity', '@s', 'equipment.offhand').set(npc.offHand as any)
                }
            })
        }

        if (npc.pose === 'sitting') {
            summon('minecraft:interaction', abs(x, y, z), {
                Tags: [seatTag, BOOTH_ENTITY_TAG],
                width: NBT.float(1),
                height: NBT.float(0),
                response: false,
            })
            ride(Selector('@e', { tag: npc.instanceTag, type: 'minecraft:mannequin', limit: 1 })).mount(Selector('@e', { tag: seatTag, type: 'minecraft:interaction', limit: 1 }))
        }

        if (npc.dialogue) {
            const dialogue = npc.dialogue
            const npcSelector = Selector('@e', { tag: npc.instanceTag, type: 'minecraft:mannequin' })

            // invisible hitbox that catches right-clicks on the NPC
            summon('minecraft:interaction', abs(x, y, z), {
                Tags: [npc.instanceTag, BOOTH_ENTITY_TAG],
                width: NBT.float(0.8),
                height: NBT.float(2),
                response: true,
            })

            // click detection lives entirely in the reward function
            const interactAdvancement = Advancement(`npcs/interact/${npc.id}`, {
                criteria: {
                    click: {
                        trigger: 'minecraft:player_interacted_with_entity',
                        conditions: {
                            entity: { entity_type: 'minecraft:interaction', entity_tags: { all_of: [npc.instanceTag] } },
                        },
                    },
                },
                rewards: {
                    // runs "as and at" the clicking player
                    function: MCFunction(`sections/npcs/interact_reward/${npc.id}`, () => {
                        // track which player is talking to this NPC DialogueTree's
                        // runAsPlayer/runAsMyNpc helpers switch context using this tag
                        raw(`tag @a[tag=${npc.interactorTag}] remove ${npc.interactorTag}`)
                        raw(`tag @s add ${npc.interactorTag}`)
                        interactAdvancement.revoke('@s')

                        execute.as(npcSelector).run(() => {
                            _.if(_.not(InteractCooldown('@s').greaterThan(0)), () => {
                                InteractCooldown('@s').set(INTERACT_COOLDOWN_TICKS)
                                _.if(DialogueLineIndex('@s').greaterThanOrEqualTo(0), () => {
                                    dialogue.advance()
                                }).else(() => {
                                    dialogue.start()
                                })
                            })
                        })
                    }),
                },
            })
        }
    }
})

const killNpcs = MCFunction('sections/npcs/kill', () => {
    for (const npc of registry) {
        const seatTag = `${npc.instanceTag}.seat` as `${any}${string}`

        kill(Selector('@e', { tag: npc.instanceTag }))
        kill(Selector('@e', { tag: seatTag }))
    }
})

// Summit compliance
Tag('function', 'summit.booth:sandstone_summit_booth/entities/summon', [spawnNpcs], { onConflict: 'append' })
Tag('function', 'summit.booth:sandstone_summit_booth/entities/kill', [killNpcs], { onConflict: 'append' })

MCFunction('sections/npcs/tick', () => {
    // shared by every NPC below, so the throttled distance check only needs one increment/tick
    NpcTickCounter('#global').add(1)

    for (const npc of registry) {
        if (!npc.dialogue && npc.lookAt !== 'nearest' && npc.lookAt !== 'interactor') {
            continue
        }

        const npcSelector = Selector('@e', { tag: npc.instanceTag, type: 'minecraft:mannequin' })

        execute.as(npcSelector).at('@s').run(() => {
            if (npc.dialogue) {
                const dialogue = npc.dialogue

                // count down the click debounce
                _.if(InteractCooldown('@s').greaterThan(0), () => {
                    InteractCooldown('@s').remove(1)
                })

                // cancel the dialogue if nobody is around
                _.if(_.and(DialogueLineIndex('@s').greaterThanOrEqualTo(0), NpcTickCounter('#global').moduloBy(THROTTLE_TICKS).equalTo(0)), () => {
                    execute.unless.entity(Selector('@a', { distance: [0, 5], limit: 1 })).run(() => {
                        dialogue.end()
                    })
                })

                // typewriter reveal driver: step RevealCount once every RevealSpeed ticks
                _.if(_.and(DialogueLineIndex('@s').greaterThanOrEqualTo(0), RevealingLabel('@s')), () => {
                    RevealDelay('@s').remove(1)
                    _.if(RevealDelay('@s').lessThanOrEqualTo(0), () => {
                        RevealCount('@s').add(1)
                        RevealDelay('@s').set(RevealSpeed('@s'))
                        dialogue.render()
                    })
                })
            }

            // decorative NPCs: keep facing whoever's closest
            if (npc.lookAt === 'nearest') {
                raw('rotate @s facing entity @p[distance=..5] feet')
            }

            // face the interactor while talking; look back to the spawn rotation once they leave
            if (npc.lookAt === 'interactor') {
                const [yaw, pitch] = npc.rotation ?? [0, 0]
                execute.if.entity(Selector('@a', { tag: npc.interactorTag, limit: 1 })).run(() => {
                    raw(`rotate @s facing entity @a[tag=${npc.interactorTag},limit=1] feet`)
                })
                execute.unless.entity(Selector('@a', { tag: npc.interactorTag, limit: 1 })).run(() => {
                    raw(`rotate @s ${yaw} ${pitch}`)
                })
            }
        })
    }
}, { runEveryTick: true })
