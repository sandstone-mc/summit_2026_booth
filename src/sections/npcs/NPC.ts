import { _, abs, Advancement, execute, kill, Label, MCFunction, NBT, Objective, raw, ride, Selector, summon } from 'sandstone'
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

// gates whether the tick loop should keep stepping this NPC's reveal
export const RevealingLabel = Label('npc.dialogue.revealing')

// blocks above the mannequin head the display sits at
const HEAD_HEIGHT = 0.2

// Pick NPC skin using either username of a player or specific texture
export interface NPCSkin {
    username?: string

    texture?: string
    signature?: string
}

export type LookAtMode = 'nearest' | 'none'

// 'sitting' is faked by mounting the mannequin on an invisible zero-height interaction seat
export type NPCPose = 'standing' | 'crouching' | 'sleeping' | 'sitting'

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
    mainHand?: string
    offHand?: string
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
    if (skin.texture) {
        return {
            properties: [{ name: 'textures', value: skin.texture, ...(skin.signature ? { signature: skin.signature } : {}) }],
        }
    }
    return { name: skin.username }
}

export function CreateNPC(id: string, options: NPCOptions) {
    registry.push({
        ...options,
        id,
        instanceTag: `sandstone_summit_booth.npc.${id}` as `${any}${string}`,
        interactorTag: `sandstone_summit_booth.npc.${id}.interactor` as `${any}${string}`,
    })
}

MCFunction('sections/npcs/spawn', () => {
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
                ...(npc.mainHand ? { mainhand: { id: npc.mainHand as any, count: NBT.int(1) } } : {}),
                ...(npc.offHand ? { offhand: { id: npc.offHand as any, count: NBT.int(1) } } : {}),
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
                            entity: { entity_type: 'minecraft:interaction', nbt: `{Tags:["${npc.instanceTag}"]}` },
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
                        // revoke so this reward can fire again on the next click
                        interactAdvancement.revoke('@s')

                        execute.as(npcSelector).run(() => {
                            _.if(DialogueLineIndex('@s').greaterThanOrEqualTo(0), () => {
                                dialogue.advance()
                            }).else(() => {
                                dialogue.start()
                            })
                        })
                    }),
                },
            })
        }
    }
}, { runOnLoad: true })

MCFunction('sections/npcs/tick', () => {
    for (const npc of registry) {
        const npcSelector = Selector('@e', { tag: npc.instanceTag, type: 'minecraft:mannequin' })

        if (npc.dialogue) {
            const dialogue = npc.dialogue

            // cancel the dialogue if nobody is around
            execute.as(npcSelector).at('@s').run(() => {
                _.if(DialogueLineIndex('@s').greaterThanOrEqualTo(0), () => {
                    execute.unless.entity(Selector('@p', { distance: [0, 5] })).run(() => {
                        dialogue.end()
                    })
                })
            })

            // typewriter reveal driver: step RevealCount once every RevealSpeed ticks
            execute.as(npcSelector).run(() => {
                _.if(_.and(DialogueLineIndex('@s').greaterThanOrEqualTo(0), RevealingLabel('@s')), () => {
                    RevealDelay('@s').remove(1)
                    _.if(RevealDelay('@s').lessThanOrEqualTo(0), () => {
                        RevealCount('@s').add(1)
                        RevealDelay('@s').set(RevealSpeed('@s'))
                        dialogue.render()
                    })
                })
            })
        }

        if (npc.lookAt === 'nearest') {
            execute.as(npcSelector).at('@s').run(() => {
                raw('rotate @s facing entity @p feet')
            })
        }
    }
}, { runEveryTick: true })
