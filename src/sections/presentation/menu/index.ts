import { join } from 'path'
import { abs, Advancement, Data, kill, Label, type LabelClass, MCFunction, NBT, say, summon, Texture } from 'sandstone'
import { ImageDisplayModel } from '../utils'
import { BOOTH_ENTITY_TAG, fmt } from '@shared'
import { mount, nextSlide, unmount } from '..'
import { argb, rgb } from 'src/sections/rhythm/config/internal/colors';

const ORIGIN = [-76, 76, 42] as const
const BOUNDS = [4, 2] as const

const point = (x: number, y: number, z?: number) => `${fmt(ORIGIN[0] + x)} ${fmt(ORIGIN[1] + y)} ${fmt(ORIGIN[2] + 0.197 + (z ?? 0))}`

function click_entity(buttonTag: `${any}${string}` | LabelClass) {
	return { entity_type: 'minecraft:interaction' as const, entity_tags: { all_of: [`${buttonTag}`] } }
}

const start_button_text = Label('sections.presentation.menu.start_text')
const start_button_entity = Label('sections.presentation.menu.start_button')

function kill_0 () {
    kill(start_button_text('@e' as '@s'))
    kill(start_button_entity('@e' as '@s'))
}

const spawn_0 = MCFunction('sections/presentation/menu/spawn_0', () => {
    kill_0()
    summon('text_display', point(2, .85), {
        Tags: [BOOTH_ENTITY_TAG, start_button_text],
        text: {
            text: '|< Start Presentation >|'
        },
        text_opacity: NBT.int(0),
        background: NBT.int(argb(255, rgb(168, 214, 226))),
        brightness: {
            block: NBT.int(15),
            sky: NBT.int(15)
        },
        transformation: {
            scale: NBT.float([1.25, 1.25, 1]),
            translation: NBT.float([0, 0, 0]),
			left_rotation: NBT.float([0, 0, 0, 1]),
			right_rotation: NBT.float([0, 0, 0, 1]),
        }
    })

    summon('text_display', point(2, .85, 0.01), {
        Tags: [BOOTH_ENTITY_TAG, start_button_text],
        text: {
            text: '< Start Presentation >',
            color: '#6d6a5c'
        },
        background: NBT.int(0),
        brightness: {
            block: NBT.int(15),
            sky: NBT.int(15)
        },
        transformation: {
            scale: NBT.float([1.25, 1.25, 1]),
            translation: NBT.float([0, 0, 0]),
			left_rotation: NBT.float([0, 0, 0, 1]),
			right_rotation: NBT.float([0, 0, 0, 1]),
        }
    })
    summon('interaction', point(2, .85, -2), {
        Tags: [ BOOTH_ENTITY_TAG, start_button_entity ],
        interaction: {},
        attack: {},
        response: true,
        width: NBT.float(3.75),
        height: NBT.float(0.3),
    })
})

const start_button = Advancement('sections/presentation/menu/start_button', {
	criteria: {
		click: { trigger: 'minecraft:player_interacted_with_entity', conditions: { entity: click_entity(start_button_entity) } },
	},
	rewards: { function: MCFunction('sections/presentation/menu/start', () => {
        start_button.revoke('@s')

        mount()

        kill(screen_saver_entity('@e' as '@s'))
        kill_0()

        spawn_1()
    }) }
})

const Logo = ImageDisplayModel(Texture('item', 'presentation/large_logo',
    await Bun.file(join(process.cwd(), 'resources', 'assets', 'large_logo.png')).arrayBuffer() as unknown as Buffer<ArrayBufferLike>
))

const screen_saver_entity = Label('presentation.menu.screen_saver')

const screen_saver = MCFunction('sections/presentation/menu/screen_saver', () => {
    unmount()

    kill(screen_saver_entity('@e' as '@s'))

    summon('item_display', point(2, 8.625), {
        item: {
            id: 'paper',
            count: NBT.int(1),
            components: {
                /* @ts-ignore */
                '"minecraft:item_model"': `${Logo}`
            }
        },
        transformation: {
			scale: NBT.float([47 / 4, 30 / 4, 1 / 4]),
			translation: NBT.float([0, 0, 0]),
			left_rotation: NBT.float([0, 1, 0, 0]),
			right_rotation: NBT.float([0, 0, 0, 1]),
		},
		brightness: { sky: NBT.int(15), block: NBT.int(15) },
        Tags: [ BOOTH_ENTITY_TAG, screen_saver_entity ],
    })
})

const next_button_text = Label('sections.presentation.menu.next_text')
const next_button_entity = Label('sections.presentation.menu.next_button')

function kill_1 () {
    kill(next_button_text('@e' as '@s'))
    kill(next_button_entity('@e' as '@s'))
}

const spawn_1 = MCFunction('sections/presentation/menu/spawn_1', () => {
    kill_1()
    summon('text_display', point(2, .85), {
        Tags: [BOOTH_ENTITY_TAG, next_button_text],
        text: {
            text: '|->|'
        },
        text_opacity: NBT.int(0),
        background: NBT.int(argb(255, rgb(168, 214, 226))),
        brightness: {
            block: NBT.int(15),
            sky: NBT.int(15)
        },
        transformation: {
            scale: NBT.float([1.25, 1.25, 1]),
            translation: NBT.float([0, 0, 0]),
			left_rotation: NBT.float([0, 0, 0, 1]),
			right_rotation: NBT.float([0, 0, 0, 1]),
        }
    })

    summon('text_display', point(2, .85, 0.01), {
        Tags: [BOOTH_ENTITY_TAG, next_button_text],
        text: {
            text: '->',
            color: '#6d6a5c'
        },
        background: NBT.int(0),
        brightness: {
            block: NBT.int(15),
            sky: NBT.int(15)
        },
        transformation: {
            scale: NBT.float([1.25, 1.25, 1]),
            translation: NBT.float([0, 0, 0]),
			left_rotation: NBT.float([0, 0, 0, 1]),
			right_rotation: NBT.float([0, 0, 0, 1]),
        }
    })
    summon('interaction', point(2, .85, -2), {
        Tags: [ BOOTH_ENTITY_TAG, next_button_entity ],
        interaction: {},
        attack: {},
        response: true,
        width: NBT.float(3.75),
        height: NBT.float(0.3),
    })
})

const next_button = Advancement('sections/presentation/menu/next_button', {
	criteria: {
		click: { trigger: 'minecraft:player_interacted_with_entity', conditions: { entity: click_entity(next_button_entity) } },
	},
	rewards: { function: MCFunction('sections/presentation/menu/next', () => {
        next_button.revoke('@s')

        nextSlide()
    }) }
})