import { _, abs, advancement, Advancement, execute, MCFunction, NBT, Selector, summon, tag, title, kill } from 'sandstone'
import { songCount, songNames } from '../config/songs'
import { GameStatus, Tags, status, songSelect } from './state'
import { startGame, cancelStart } from './start'
import { Positions } from '../../../shared'

const CYCLE_POS = abs(...Positions.BTN_CYCLE)
const START_POS = abs(...Positions.BTN_START)
const CYCLE_DISPLAY_POS = abs(...Positions.BTN_CYCLE_DISPLAY)
const START_DISPLAY_POS = abs(...Positions.BTN_START_DISPLAY)

const cycleSongAdv = Advancement('cycle_song', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { type: 'minecraft:interaction', nbt: `{Tags:["${Tags.BUTTON_CYCLE}"]}` },
			},
		},
	},
})

const startGameAdv = Advancement('start_game', {
	criteria: {
		click: {
			trigger: 'minecraft:player_interacted_with_entity',
			conditions: {
				entity: { type: 'minecraft:interaction', nbt: `{Tags:["${Tags.BUTTON_START}"]}` },
			},
		},
	},
})

const onCycleSong = MCFunction('sections/rhythm/buttons/on_cycle', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		songSelect.add(1)
		_.if(songSelect.greaterOrEqualThan(songCount), () => {
			songSelect.set(0)
		})

		if (songNames.length > 0) {
			let chain = _.if(songSelect.equalTo(0), () => {
				title('@s').actionbar({ text: songNames[0], color: 'aqua' })
			})
			for (let i = 1; i < songNames.length; i++) {
				const idx = i
				chain = chain.elseIf(songSelect.equalTo(idx), () => {
					title('@s').actionbar({ text: songNames[idx], color: 'aqua' })
				})
			}
		}

		execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
	})
}, { lazy: true })

const onStartGame = MCFunction('sections/rhythm/buttons/on_start', () => {
	_.if(status.equalTo(GameStatus.WAITING), () => {
		tag('@s').add(Tags.PLAYER)
		tag('@s').add(Tags.ALIVE)
		startGame()
	}).elseIf(status.equalTo(GameStatus.STARTING), () => {
		cancelStart()
		tag('@s').remove(Tags.PLAYER)
		tag('@s').remove(Tags.ALIVE)
	})
	execute.at('@s').run.playsound('minecraft:ui.button.click', 'master', '@s')
}, { lazy: true })

MCFunction('sections/rhythm/buttons/tick', () => {
	execute.as(Selector('@a', { advancements: { [`sandstone_summit_booth:cycle_song`]: true } })).run(() => {
		onCycleSong()
		advancement.revoke('@s').only('sandstone_summit_booth:cycle_song')
	})

	execute.as(Selector('@a', { advancements: { [`sandstone_summit_booth:start_game`]: true } })).run(() => {
		onStartGame()
		advancement.revoke('@s').only('sandstone_summit_booth:start_game')
	})
}, { runEveryTick: true })

MCFunction('sections/rhythm/buttons/spawn', () => {
	// TODO: These entities should use hardcoded UUIDs instead of tags
	kill(Selector('@e', { tag: Tags.BUTTON_CYCLE }))
	kill(Selector('@e', { tag: Tags.BUTTON_START }))
	kill(Selector('@e', { tag: Tags.BUTTON_CYCLE_DISPLAY }))
	kill(Selector('@e', { tag: Tags.BUTTON_START_DISPLAY }))

	summon('minecraft:interaction', CYCLE_POS, {
		Tags: [Tags.BUTTON_CYCLE],
		width: NBT.float(1),
		height: NBT.float(1),
	})

	summon('minecraft:interaction', START_POS, {
		Tags: [Tags.BUTTON_START],
		width: NBT.float(1),
		height: NBT.float(1),
	})

	summon('minecraft:text_display', CYCLE_DISPLAY_POS, {
		Tags: [Tags.BUTTON_CYCLE_DISPLAY],
		text: { text: 'Song Select', color: 'aqua', bold: true },
		billboard: 'center',
		view_range: NBT.float(0.5),
	})

	summon('minecraft:text_display', START_DISPLAY_POS, {
		Tags: [Tags.BUTTON_START_DISPLAY],
		text: { text: 'Start Game', color: 'green', bold: true },
		billboard: 'center',
		view_range: NBT.float(0.5),
	})
}, { runOnLoad: true })
