import {
	_,
	abs,
	data,
	execute,
	kill,
	MCFunction,
	NBT,
	Objective,
	Selector,
	summon,
	tag,
	tp,
	tellraw,
	Variable,
} from 'sandstone'
import { gameplay } from '@rhythm/config'
import { rgba } from '@rhythm/config/internal/colors'
import { boothReturn } from '@rhythm/config/internal/derived'
import { GameStatus, Tags, boothTags, status } from './state'
import { updateSettingsPanel } from './settings'

const { beats, countInBeats, intervalTicks, minSamples } = gameplay.calibration

export const calOffsetMs = Objective.create('rhythm.cal', 'dummy')
export const calibrationDepth = Variable(0)

const beatGametime = Variable(0)
const tapGametime = Variable(0)
const tapDelta = Variable(0)
const sampleSum = Variable(0)
const sampleCount = Variable(0)
const beatsLeft = Variable(0)
const sampling = Variable(0)

const calibrator = Selector('@a', { tag: Tags.CALIBRATOR, limit: 1 })
const pad = Selector('@e', { type: 'minecraft:interaction', tag: Tags.CAL_PAD })
const padEntities = Selector('@e', { tag: Tags.CAL_PAD })

const PAD_FORWARD = 2.5

const cleanup = MCFunction(
	'sections/rhythm/calibration/cleanup',
	() => {
		kill(padEntities)
		tag(calibrator).remove(Tags.CALIBRATOR)
		sampling.set(0)
	},
	{ lazy: true },
)

export const cancelCalibration = MCFunction(
	'sections/rhythm/calibration/cancel',
	() => {
		metronomeBeat.schedule.clear()
		finishCalibration.schedule.clear()
		cleanup()
		_.if(status.equalTo(GameStatus.CALIBRATING), () => {
			status.set(GameStatus.WAITING)
		})
	},
	{ lazy: true },
)

const metronomeBeat = MCFunction(
	'sections/rhythm/calibration/beat',
	(self) => {
		execute.unless.entity(calibrator).run(() => {
			cancelCalibration()
		})
		_.if(status.equalTo(GameStatus.CALIBRATING), () => {
			beatsLeft.remove(1)
			execute.store.result.score(beatGametime).run.time.query('gametime')
			_.if(beatsLeft.lessThan(beats), () => {
				sampling.set(1)
				execute.as(calibrator).at('@s').run.playsound('minecraft:block.note_block.hat', 'master', '@s', '~ ~ ~', 1, 2)
			}).else(() => {
				execute
					.as(calibrator)
					.at('@s')
					.run.playsound('minecraft:block.note_block.hat', 'master', '@s', '~ ~ ~', 0.6, 1.4)
			})
			_.if(beatsLeft.greaterThan(0), () => {
				self.schedule.function(`${intervalTicks}t`, 'replace')
			}).else(() => {
				finishCalibration.schedule.function(`${intervalTicks}t`, 'replace')
			})
		})
	},
	{ lazy: true },
)

const takeSample = MCFunction(
	'sections/rhythm/calibration/sample',
	() => {
		execute.store.result.score(tapGametime).run.time.query('gametime')
		tapDelta.set(tapGametime)
		tapDelta.remove(beatGametime)
		_.if(tapDelta.greaterThan(intervalTicks / 2), () => {
			tapDelta.remove(intervalTicks)
		})
		_.if(tapDelta.lessThanOrEqualTo(intervalTicks / 2), () => {
			sampleSum.add(tapDelta)
			sampleCount.add(1)
			execute.as(calibrator).at('@s').run.playsound('minecraft:block.note_block.bit', 'master', '@s', '~ ~ ~', 0.4, 1.8)
		})
	},
	{ lazy: true },
)

export const calibrationTick = MCFunction(
	'sections/rhythm/calibration/tick',
	() => {
		_.if(status.equalTo(GameStatus.CALIBRATING), () => {
			execute
				.as(pad)
				.if.data.entity('@s', 'attack')
				.run(() => {
					data.remove.entity('@s', 'attack')
					_.if(sampling.equalTo(1), () => {
						takeSample()
					})
				})
			execute
				.as(pad)
				.if.data.entity('@s', 'interaction')
				.run(() => {
					data.remove.entity('@s', 'interaction')
					_.if(sampling.equalTo(1), () => {
						takeSample()
					})
				})
		})
	},
	{ lazy: true },
)

const finishCalibration = MCFunction(
	'sections/rhythm/calibration/finish',
	() => {
		_.if(status.equalTo(GameStatus.CALIBRATING), () => {
			_.if(sampleCount.greaterThanOrEqualTo(minSamples), () => {
				sampleSum.multiply(50)
				sampleSum.divide(sampleCount)
				execute.as(calibrator).run(() => {
					calOffsetMs('@s').set(sampleSum)
					tellraw('@s', [
						{ text: '⧗ ', color: 'aqua' },
						{ text: 'Calibration saved: ', color: 'gray' },
						calOffsetMs('@s'),
						{ text: 'ms', color: 'aqua' },
						{ text: ' (applied to your future runs).', color: 'gray' },
					])
					tellraw('@s', [
						{ text: '⧗ ', color: 'aqua' },
						{ text: 'Estimated latency to the server: ', color: 'gray' },
						calOffsetMs('@s'),
						{ text: 'ms', color: 'aqua' },
						{ text: ' (network + audio + reaction time)', color: 'dark_gray' },
					])
					execute.at('@s').run.playsound('minecraft:entity.player.levelup', 'master', '@s', '~ ~ ~', 0.8, 1.5)
				})
			}).else(() => {
				tellraw(calibrator, [
					{ text: '⧗ ', color: 'aqua' },
					{ text: 'Not enough taps, calibration discarded.', color: 'gray' },
				])
			})
			cleanup()
			status.set(GameStatus.WAITING)
			updateSettingsPanel()
		})
	},
	{ lazy: true },
)

export const startCalibration = MCFunction(
	'sections/rhythm/calibration/start',
	() => {
		_.if(status.equalTo(GameStatus.WAITING), () => {
			status.set(GameStatus.CALIBRATING)
			tag('@s').add(Tags.CALIBRATOR)
			const [x, y, z] = boothReturn
			tp('@s', abs(x, y, z), abs(180, 0))
			sampleSum.set(0)
			sampleCount.set(0)
			sampling.set(0)
			beatsLeft.set(beats + countInBeats)

			summon('minecraft:interaction', abs(x, y, z - PAD_FORWARD), {
				Tags: boothTags(Tags.CAL_PAD),
				width: NBT.float(1.5),
				height: NBT.float(1.5),
				response: true,
			})
			summon('minecraft:text_display', abs(x, y, z - PAD_FORWARD), {
				Tags: boothTags(Tags.CAL_PAD),
				text: [
					{ text: '⧗\n', color: 'aqua' },
					{ text: 'TAP', color: 'white', bold: true },
				] as unknown as string,
				billboard: 'fixed' as const,
				Rotation: NBT.float([0, 0]),
				background: NBT.int(rgba(0, 0, 0, 0.33)),
				see_through: false,
				transformation: {
					left_rotation: NBT.float([0, 0, 0, 1]),
					right_rotation: NBT.float([0, 0, 0, 1]),
					translation: NBT.float([0, 0, 0]),
					scale: NBT.float([3, 3, 3]),
				},
			})

			tellraw('@s', [
				{ text: '⧗ ', color: 'aqua' },
				{ text: 'Tap the pad on every ', color: 'gray' },
				{ text: 'high click.', color: 'aqua' },
				{ text: 'Four low count-in clicks first.', color: 'gray' },
			])
			updateSettingsPanel()
			metronomeBeat.schedule.function(`${intervalTicks}t`, 'replace')
		})
	},
	{ lazy: true },
)
