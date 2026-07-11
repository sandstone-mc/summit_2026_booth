import { _, abs, Advancement, advancement, execute, kill, Label, MCFunction, NBT, Objective, raw, Selector, summon } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import { NAMESPACE } from '@shared'
import type { DialogueTree } from './DialogueTree'

const BOOTH_ENTITY_TAG = 'summit.booth_entity.sandstone_summit_booth' as `${any}${string}`

// Label for NPC text displays
export const NpcDisplayLabel = Label('npc.display')

// No score = no active dialogue
// 0+ = current line
export const DialogueLineIndex = Objective.create('npc.dialogue.line')

// blocks above the mannequin head the display sits at
const HEAD_HEIGHT = 0.2

// Pick NPC skin using either username of a player or specific texture
export interface NPCSkin {
    username?: string

    texture?: string
    signature?: string
}

export type LookAtMode = 'nearest' | 'none'
export interface NPCOptions {
    name: string
    skin: NPCSkin
    position: [number, number, number]
    // Initial [yaw, pitch]. Defaults to facing south
    rotation?: [number, number]
    // Defaults to 'nearest'
    lookAt?: LookAtMode
    dialogue: DialogueTree
}

interface RegisteredNPC extends NPCOptions {
    id: string
    instanceTag: `${any}${string}`
    interactorTag: `${any}${string}`
}

const registry: RegisteredNPC[] = []

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
        kill(Selector('@e', { tag: npc.instanceTag }))

        const [x, y, z] = npc.position
        const [yaw, pitch] = npc.rotation ?? [0, 0]

        const mannequinNbt: SymbolEntity['mannequin'] = {
            Tags: [npc.instanceTag, BOOTH_ENTITY_TAG],
            Rotation: NBT.float([yaw, pitch]),
            immovable: true,
            profile: profileFor(npc.skin),
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

        summon('minecraft:interaction', abs(x, y, z), {
            Tags: [npc.instanceTag, BOOTH_ENTITY_TAG],
            width: NBT.float(0.8),
            height: NBT.float(2),
            response: true,
        })

        Advancement(`npcs/interact/${npc.id}`, {
            criteria: {
                click: {
                    trigger: 'minecraft:player_interacted_with_entity',
                    conditions: {
                        entity: { entity_type: 'minecraft:interaction', nbt: `{Tags:["${npc.instanceTag}"]}` },
                    },
                },
            },
        })
    }
}, { runOnLoad: true })

MCFunction('sections/npcs/tick', () => {
    for (const npc of registry) {
        const npcSelector = Selector('@e', { tag: npc.instanceTag, type: 'minecraft:mannequin' })

        execute.as(Selector('@a', { 
            advancements: { [`${NAMESPACE}:npcs/interact/${npc.id}`]: true }
        })).run(() => {
            // @s is the clicking player here 
            raw(`tag @a[tag=${npc.interactorTag}] remove ${npc.interactorTag}`)
            raw(`tag @s add ${npc.interactorTag}`)
            advancement.revoke('@s').only(`${NAMESPACE}:npcs/interact/${npc.id}`)

            execute.as(npcSelector).run(() => {
                _.if(DialogueLineIndex('@s').greaterThanOrEqualTo(0), () => {
                    npc.dialogue.advance()
                }).else(() => {
                    npc.dialogue.start()
                })
            })
        })

        // cancel the dialogue if nobody is around
        execute.as(npcSelector).at('@s').run(() => {
            _.if(DialogueLineIndex('@s').greaterThanOrEqualTo(0), () => {
                execute.unless.entity(Selector('@p', { distance: [0, 5] })).run(() => {
                    npc.dialogue.end()
                })
            })
        })

        if (npc.lookAt === 'nearest') {
            execute.as(npcSelector).at('@s').run(() => {
                raw('rotate @s facing entity @p feet')
            })
        }
    }
}, { runEveryTick: true })
