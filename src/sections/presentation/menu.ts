import { join } from 'path'
import { abs, Advancement, data, Data, dialog, execute, kill, Label, type LabelClass, MCFunction, NBT, say, schedule, Selector, sleep, summon, Tag, Texture } from 'sandstone'
import { ImageDisplayModel } from './utils'
import { BOOTH_ENTITY_TAG, fmt } from '@shared'
import { mount, nextSlide, unmount } from '.'
import { argb, rgb } from 'src/sections/rhythm/config/internal/colors'
import { creditsDialog, creditsPageContent, CREDITS } from 'src/sections/npcs/npcs/credits'

const ORIGIN = [-76, 76, 42] as const

const point = (x: number, y: number, z?: number) => `${fmt(ORIGIN[0] + x - 0.01)} ${fmt(ORIGIN[1] + y)} ${fmt(ORIGIN[2] + 0.197 + (z ?? 0))}`

function click_entity(buttonTag: `${any}${string}` | LabelClass) {
	return { entity_type: 'minecraft:interaction' as const, entity_tags: { all_of: [`${buttonTag}`] } }
}

const large_logo = ImageDisplayModel(Texture('item', 'presentation/large_logo',
    await Bun.file(join(process.cwd(), 'resources', 'assets', 'large_logo.png')).arrayBuffer() as unknown as Buffer<ArrayBufferLike>
))

const screen_saver_entity = Label('presentation.menu.screen_saver')

const screen_saver = MCFunction('sections/presentation/menu/screen_saver', () => {
    unmount()

    kill(screen_saver_entity('@e' as '@s'))

    summon('item_display', point(2, 8.625, -0.195), {
        item: {
            id: 'paper',
            count: NBT.int(1),
            components: {
                /* @ts-ignore */
                '"minecraft:item_model"': `${large_logo}`
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

const small_logo_entity = Label('presentation.menu.small_logo')

const small_logo = ImageDisplayModel(Texture('item', 'presentation/small_logo',
    await Bun.file(join(process.cwd(), 'resources', 'assets', 'small_logo.png')).arrayBuffer() as unknown as Buffer<ArrayBufferLike>
))

const start_button = Advancement('sections/presentation/menu/start_button', {
	criteria: {
		click: { trigger: 'minecraft:player_interacted_with_entity', conditions: { entity: click_entity(start_button_entity) } },
	},
	rewards: { function: MCFunction('sections/presentation/menu/start', () => {
        start_button.revoke('@s')

        mount()

        summon('item_display', point(-6.25, 13.5, -0.195), {
            item: {
                id: 'paper',
                count: NBT.int(1),
                components: {
                    /* @ts-ignore */
                    '"minecraft:item_model"': `${small_logo}`
                }
            },
            transformation: {
                scale: NBT.float([23 / 20, 13 / 20, 1 / 4]),
                translation: NBT.float([0, 0, 0]),
                left_rotation: NBT.float([0, 1, 0, 0]),
                right_rotation: NBT.float([0, 0, 0, 1]),
            },
            brightness: { sky: NBT.int(15), block: NBT.int(15) },
            Tags: [ BOOTH_ENTITY_TAG, small_logo_entity ],
        })

        kill(screen_saver_entity('@e' as '@s'))
        kill_0()

        spawn_1()
    }) }
})

const next_button_text = Label('sections.presentation.menu.next_text')
const next_button_entity = Label('sections.presentation.menu.next_button')

function kill_1 () {
    kill(next_button_text('@e' as '@s'))
    kill(next_button_entity('@e' as '@s'))
}

const spawn_1 = MCFunction('sections/presentation/menu/spawn_1', () => {
    kill_1()
    summon('text_display', point(2, .65), {
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
            scale: NBT.float([3, 3, 1]),
            translation: NBT.float([0, 0, 0]),
			left_rotation: NBT.float([0, 0, 0, 1]),
			right_rotation: NBT.float([0, 0, 0, 1]),
        }
    })

    summon('text_display', point(2, .65, 0.01), {
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
            scale: NBT.float([3, 3, 1]),
            translation: NBT.float([0, 0, 0]),
			left_rotation: NBT.float([0, 0, 0, 1]),
			right_rotation: NBT.float([0, 0, 0, 1]),
        }
    })
    summon('interaction', point(2, .65, -0.4), {
        Tags: [ BOOTH_ENTITY_TAG, next_button_entity ],
        interaction: {},
        attack: {},
        response: true,
        width: NBT.float(1.2),
        height: NBT.float(.75),
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

const credits_button_entity = Label('sections.presentation.menu.credits')

function kill_2() {
    kill(credits_button_entity('@e' as '@s'))
}

const spawn_2 = MCFunction('sections/presentation/menu/spawn_2', () => {
    kill_2()
    summon('interaction', point(2, 0.4, -2), {
        Tags: [ BOOTH_ENTITY_TAG, credits_button_entity ],
        interaction: {},
        attack: {},
        response: true,
        width: NBT.float(4.1),
        height: NBT.float(1.25),
    })

    spawn_credits_display()
})

const PAGE_COUNT = CREDITS.length + 1 // +1 for the LINKS page
const PAGE_SECONDS = 10

const credits_display_entity = Label('sections.presentation.menu.credits_display')

const credits_loop = MCFunction('sections/presentation/menu/credits_loop', () => {
    for (let i = 0; i < PAGE_COUNT; i++) {
        data.modify
            .entity(credits_display_entity('@e' as '@s'), 'text')
            .set.value(creditsPageContent(i))
        sleep(`${PAGE_SECONDS}s`)
    }
    schedule.function(credits_loop, '1t', 'replace')
})

const kill_credits_display = MCFunction('sections/presentation/menu/credits_display/kill', () => {
    kill(credits_display_entity('@e' as '@s'))
    schedule.clear(credits_loop.name)
    schedule.clear(`${credits_loop.name}/schedule`)
    for (let i = 1; i <= PAGE_COUNT; i++) {
        schedule.clear(`${credits_loop.name}/${i === 1 ? '__sleep' : `__sleep${i}`}`)
    }
})

const spawn_credits_display = MCFunction('sections/presentation/menu/credits_display/spawn', () => {
    kill_credits_display()
    summon('text_display', point(2, 0.4), {
        Tags: [BOOTH_ENTITY_TAG, credits_display_entity],
        text: creditsPageContent(0),
        background: NBT.int(0),
        brightness: { block: NBT.int(15), sky: NBT.int(15) },
        line_width: NBT.int(160),
        transformation: {
            scale: NBT.float([1, 1, 1]),
            translation: NBT.float([0, 0, 0]),
            left_rotation: NBT.float([0, 0, 0, 1]),
            right_rotation: NBT.float([0, 0, 0, 1]),
        },
    })
    schedule.function(credits_loop, '1t', 'replace')
})

const credits_button = Advancement('sections/presentation/menu/credits_button', {
	criteria: {
		click: { trigger: 'minecraft:player_interacted_with_entity', conditions: { entity: click_entity(credits_button_entity) } },
	},
	rewards: { function: MCFunction('sections/presentation/menu/credits', () => {
        credits_button.revoke('@s')

        dialog.show('@s', creditsDialog({ text: 'Booth Credits' }))
    }) }
})

MCFunction('sections/presentation/end', () => {
    kill_1()

    spawn_2()

    schedule.function(() => {
        kill_2()
        kill_credits_display()
        kill(small_logo_entity('@e' as '@s'))

        spawn_0()
        screen_saver()
    }, `${60 * 5}s`)
}, { onConflict: 'append' })

Tag('function', 'summit.booth:sandstone_summit_booth/entities/summon', [
    MCFunction('sections/presentation/menu/spawn', () => {
        spawn_0()
        screen_saver()
    })
], { onConflict: 'append' })

Tag('function', 'summit.booth:sandstone_summit_booth/entities/kill', [
    MCFunction('sections/presentation/menu/kill', () => {
        kill_0()
        kill_1()
        kill_2()
        kill_credits_display()
        kill(small_logo_entity('@e' as '@s'))
        kill(screen_saver_entity('@e' as '@s'))
        unmount()
    })
], { onConflict: 'append' })