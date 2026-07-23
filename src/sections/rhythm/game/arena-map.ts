import { _, abs, execute, fill, type ItemModelDefinitionClass, kill, MCFunction, NBT, Selector, summon } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import { arena } from '@rhythm/config/internal/arena'
import { mapCount, mapList, mapStructures } from '@rhythm/config/internal/maps'
import { mapSelect, Tags, boothTags } from './state'
import { NAMESPACE } from '@shared'

/*
 * strict fill + strict place skip block updates, and placing into air a tick later
 * keeps support-needing blocks (flowers, buttons, signs) from popping off
 */
export const placeMap = MCFunction(
	'sections/rhythm/arena/place_map',
	() => {
		if (mapCount === 0) return
		const [ox, oy, oz] = arena.mapOrigin
		const [ex, ey, ez] = arena.mapEnd
		fill(abs(ox, oy, oz), abs(ex, ey, ez), 'minecraft:air').strict()
		placeMapBlocks.schedule.function('1t', 'replace')
	},
	{ lazy: true },
)

const placeMapBlocks = MCFunction(
	'sections/rhythm/arena/place_map/blocks',
	() => {
		const [px, py, pz] = arena.mapPlacement
		const rotation = arena.structureRotation === 'none' ? undefined : arena.structureRotation
		for (let i = 0; i < mapCount; i++) {
			_.if(mapSelect.equalTo(i), () => {
				execute.run.place.template(
					`${NAMESPACE}:${mapStructures[i]}`,
					abs(px, py, pz),
					rotation,
					arena.structureMirror,
					undefined,
					undefined,
					'strict',
				)
			})
		}
		spawnSkybox()
	},
	{ lazy: true },
)

const skyboxCenter: [number, number, number] = [
	(arena.mapOrigin[0] + arena.mapEnd[0]) / 2,
	(arena.mapOrigin[1] + arena.mapEnd[1]) / 2,
	(arena.mapOrigin[2] + arena.mapEnd[2]) / 2,
]

function skyboxNbt(model: ItemModelDefinitionClass, map: number): SymbolEntity['item_display'] {
	return {
		// `map` is a tag suffix so each map's summon body is byte-distinct
		// even when two maps share the same skybox import — otherwise the
		// if/elseIf chain dedups identical bodies and the second skybox vanishes.
		Tags: boothTags(Tags.SKYBOX, `map${map}`),
		brightness: { sky: NBT.int(15), block: NBT.int(15) },
		transformation: {
			left_rotation: NBT.float(arena.wallRotation),
			right_rotation: NBT.float([0, 0, 0, 1]),
			translation: NBT.float([0, 0, 0]),
			scale: NBT.float(arena.skyboxScale),
		},
		item: {
			id: 'minecraft:leather_horse_armor',
			count: NBT.int(1),
			components: {
				// @ts-ignore
				// keys containing ':' must be pre-quoted for snbt
				'"minecraft:item_model"': `${model}`,
			},
		},
	}
}

export const spawnSkybox = MCFunction(
	'sections/rhythm/arena/spawn_skybox',
	() => {
		killSkybox()
		if (mapCount === 0) return
		const [cx, cy, cz] = skyboxCenter
		
		const summonDisplay = (map: number) => summon('minecraft:item_display', abs(cx, cy, cz), skyboxNbt(mapList[map].skybox, map))
		if (mapCount === 1) {
			summonDisplay(0)
		} else {
			// elseIf returns a *new* IfStatement that links via nextFlowNode.
		// The for loop must reassign each iteration, otherwise the previous
		// link gets overwritten by the last iteration's return value and
		// every intermediate elseIf is orphaned (silently dropped from output).
		let ifStatement = _.if(mapSelect.equalTo(0), () => summonDisplay(0))

			for (let i = 1; i < mapCount; i++) {
				ifStatement = ifStatement.elseIf(mapSelect.equalTo(i), () => summonDisplay(i))
			}
		}
	},
	{ lazy: true },
)

export const killSkybox = MCFunction(
	'sections/rhythm/arena/kill_skybox',
	() => {
		kill(Selector('@e', { tag: Tags.SKYBOX }))
	},
	{ lazy: true },
)
