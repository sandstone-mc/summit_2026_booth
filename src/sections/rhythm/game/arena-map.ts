import { _, abs, execute, fill, kill, MCFunction, NBT, Selector, summon } from 'sandstone'
import { arena } from '@rhythm/config/internal/arena'
import { mapCount, mapSafeNames } from '@rhythm/config/internal/maps'
import { mapSelect, Tags } from './state'
import { DIMENSION, NAMESPACE } from '@shared'

export const placeMap = MCFunction('sections/rhythm/arena/place_map', () => {
	if (mapCount === 0) return
	const [px, py, pz] = arena.mapPlacement
	const rotation = arena.structureRotation === 'none' ? undefined : arena.structureRotation
	for (let i = 0; i < mapCount; i++) {
		_.if(mapSelect.equalTo(i), () => {
			execute.in(DIMENSION).run.place.template(`${NAMESPACE}:generated/maps/${mapSafeNames[i]}`, abs(px, py, pz), rotation, arena.structureMirror)
		})
	}
	spawnSkybox()
}, { lazy: true })

export const clearMap = MCFunction('sections/rhythm/arena/clear_map', () => {
	if (mapCount === 0) return
	const [ox, oy, oz] = arena.mapOrigin
	const [ex, ey, ez] = arena.mapEnd
	execute.in(DIMENSION).run(() => {
		fill(abs(ox, oy, oz), abs(ex, ey, ez), 'minecraft:air')
	})
	killSkybox()
}, { lazy: true })

const skyboxCenter: [number, number, number] = [
	(arena.mapOrigin[0] + arena.mapEnd[0]) / 2,
	(arena.mapOrigin[1] + arena.mapEnd[1]) / 2,
	(arena.mapOrigin[2] + arena.mapEnd[2]) / 2,
]

const skyboxModels = ['skybox_neon', 'skybox_cave', 'skybox_void']

function skyboxNbt(model: string) {
	return {
		Tags: [Tags.SKYBOX],
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
				'"minecraft:item_model"': model,
			},
		},
	}
}

export const spawnSkybox = MCFunction('sections/rhythm/arena/spawn_skybox', () => {
	killSkybox()
	const [cx, cy, cz] = skyboxCenter
	execute.in(DIMENSION).run(() => {
		if (mapCount <= 1) {
			summon('minecraft:item_display', abs(cx, cy, cz), skyboxNbt(skyboxModels[0] ?? 'skybox_neon'))
		} else {
			for (let i = 0; i < mapCount; i++) {
				const model = skyboxModels[i % skyboxModels.length]
				_.if(mapSelect.equalTo(i), () => {
					summon('minecraft:item_display', abs(cx, cy, cz), skyboxNbt(model))
				})
			}
		}
	})
}, { lazy: true })

const killSkybox = MCFunction('sections/rhythm/arena/kill_skybox', () => {
	kill(Selector('@e', { tag: Tags.SKYBOX }))
}, { lazy: true })
