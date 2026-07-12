// SlideShow — orchestrates the MCFunctions backing a multi-slide scene:
// per-slide show/hide, setSlide, rerenderSlide, the auto-advance loop,
// nextSlide, mount/unmount. Owns the auto-advance slide index tracker.

import {
	MCFunction,
	type MCFunctionClass,
	Selector,
	NBT,
	data,
	Data,
	execute,
	sleep,
	schedule,
	Objective,
	_,
	scoreboard,
} from 'sandstone'
import {
	summonVisibleElements,
	isVisibleType,
	computeSlideScrollSpecs,
	resetScrollIds,
	type ScrollSpec,
} from '../layout'
import { prepareImgResources } from '../prepare/img-resources'
import { flatWalk } from '../tree/walk'
import { extractText } from '../tree/extract'
import type { VNode } from '../render'
import type { NodeWithPath } from '../tree/walk'
import type { Styles } from '../style'
import type { ImgResourceMap, CodePrecomputedMap } from '../layout'
import { SCENE_TAG, slideTag } from './tags'
import { computeDurationsSeconds, type SlidesTiming } from '../../slides'

export interface SlideShowInput {
	trees: VNode[]
	sceneW: number
	sceneH: number
	origin: readonly [number, number, number]
	styles: Styles
	slideTexts: string[]
	timing?: SlidesTiming
	codePrecomputed: CodePrecomputedMap
	imgResources?: ImgResourceMap
}

export class SlideShow {
	readonly totalSlides: number
	readonly durations: number[]
	readonly slideVisibles: NodeWithPath[][]
	readonly showSlide: MCFunctionClass<undefined, undefined>[]
	readonly hideSlide: MCFunctionClass<undefined, undefined>[]
	private readonly setSlideFns: MCFunctionClass<undefined, undefined>[]
	private readonly scrollTickFns: MCFunctionClass<undefined, undefined>[]
	private readonly scrollSpecsPerSlide: ScrollSpec[][]
	private readonly slideIdx = Objective.create('presentation.slide_idx', 'dummy')
	private readonly currentSlide = this.slideIdx('#current')
	private readonly scrollObj = Objective.create('presentation.scroll', 'dummy')
	// Gametime recorded when the current slide started showing. Read each
	// tick by the scroll-tick to compute the elapsed-time fraction.
	private readonly slideShownAt = this.scrollObj('#shown_at')
	// Scratch scores for the per-tick scroll math. Shared across slides —
	// each MCFunction fully rewrites them on entry.
	private readonly tempCurrentTime = this.scrollObj('#current_time')
	private readonly tempElapsed = this.scrollObj('#elapsed')
	private readonly tempOffset = this.scrollObj('#offset')
	private readonly tempTarget = this.scrollObj('#target')
	// Scratch score reused to hold per-spec constants (lineHeightInt,
	// scrollSteps) inside the scroll-tick MCFunction. Reading the source
	// while holding scratch data is fine since MCFunctions run sequentially
	// within a tick — no other reader reads these temps.
	private readonly tempLimit = this.scrollObj('#limit')
	private readonly imgResources: ImgResourceMap
	private readonly styles: Styles
	private readonly sceneW: number
	private readonly sceneH: number
	private readonly origin: readonly [number, number, number]
	private readonly codePrecomputed: CodePrecomputedMap
	private readonly slideLoop: MCFunctionClass<undefined, undefined>
	readonly nextSlide: MCFunctionClass<undefined, undefined>
	readonly mount: MCFunctionClass<undefined, undefined>
	readonly tick: MCFunctionClass<undefined, undefined>
	readonly unmount: MCFunctionClass<undefined, undefined>

	constructor(input: SlideShowInput) {
		this.totalSlides = input.trees.length
		this.styles = input.styles
		this.sceneW = input.sceneW
		this.sceneH = input.sceneH
		this.origin = input.origin
		this.codePrecomputed = input.codePrecomputed
		this.imgResources = input.imgResources ?? new Map()
		this.durations = computeDurationsSeconds(input.slideTexts, input.timing)
		this.slideVisibles = input.trees.map((t) =>
			flatWalk(t).filter(({ node }) => isVisibleType(node.type)),
		)
		// Pre-pass: run the placement math to discover each scrolling
		// `<code>`'s start Y + total scroll distance. Runs without emitting
		// any `summon` commands (the same helper powers the actual emit).
		// The collected specs drive scroll-tick generation below.
		this.scrollSpecsPerSlide = this.slideVisibles.map((visible) =>
			computeSlideScrollSpecs(
				visible,
				this.styles,
				this.sceneW,
				this.sceneH,
				this.origin,
				this.codePrecomputed,
				this.imgResources,
			),
		)
		// The pre-pass walked the layout counter; reset so the actual
		// summon pass in `mount` produces the same tag sequence.
		resetScrollIds()

		this.showSlide = []
		this.hideSlide = []
		for (let s = 0; s < this.totalSlides; s++) {
			const tag = slideTag(s)
			this.showSlide.push(
				MCFunction(`presentation/slides/show/${s}`, () => {
					execute.as(Selector('@e', { tag })).run.data.modify
						.entity('@s', 'text_opacity')
						.set.value(NBT.int(-1))
					execute.as(Selector('@e', { tag })).run.data.modify
						.entity('@s', 'view_range')
						.set.value(NBT.float(1.0))
				}),
			)
			this.hideSlide.push(
				MCFunction(`presentation/slides/hide/${s}`, () => {
					execute.as(Selector('@e', { tag })).run.data.modify
						.entity('@s', 'text_opacity')
						.set.value(NBT.int(0))
					execute.as(Selector('@e', { tag })).run.data.modify
						.entity('@s', 'view_range')
						.set.value(NBT.float(0.0))
				}),
			)
		}

		this.setSlideFns = []
		for (let i = 0; i < this.totalSlides; i++) {
			const index = i
			this.setSlideFns.push(
				MCFunction(`presentation/slides/set/${index}`, () => {
					// Stamp the moment this slide became visible so the
					// scroll-tick can derive elapsed time per-tick.
					execute.store.result
						.score(this.slideShownAt)
						.run.time.query('gametime')
					for (let s = 0; s < this.totalSlides; s++) {
						if (s !== index) this.hideSlide[s]()
					}
					this.showSlide[index]()
				}),
			)
		}

		// Per-slide scroll-tick. Each reads gametime, computes elapsed
		// since `slideShownAt`, and rewrites the entity's Pos[1] so the
		// code content slides downward one line (TUI-style) per tick.
		// Generated for every slide (no-op when that slide has none).
		// `offset = elapsed * lineHeightInt` advances by exactly one visual
		// line per tick; we clamp against `scrollDistInt` so the entity
		// parks at the bottom of the scroll once it has fully traversed
		// the content (further ticks are no-ops).
		this.scrollTickFns = []
		for (let s = 0; s < this.totalSlides; s++) {
			const idx = s
			const specs = this.scrollSpecsPerSlide[idx]
			if (specs.length === 0) {
				this.scrollTickFns.push(
					MCFunction(`presentation/slides/scroll/${idx}`, () => {}),
				)
				continue
			}
			this.scrollTickFns.push(
				MCFunction(`presentation/slides/scroll/${idx}`, () => {
					execute.store.result
						.score(this.tempCurrentTime)
						.run.time.query('gametime')
					scoreboard.players.operation(this.tempElapsed, '=', this.tempCurrentTime)
					scoreboard.players.operation(this.tempElapsed, '-=', this.slideShownAt)
					for (const spec of specs) {
						const scrollDistInt = Math.round(spec.scrollDistBlocks * 10000)
						const startYInt = Math.round(spec.startY * 10000)
						const lineHeightInt = Math.round(spec.lineHeightBlocks * 10000)
						// TUI-style line-by-line scroll: clamp `elapsed`
						// (number of ticks since slide shown) to the line-step
						// count, then multiply by line height for the offset.
						// Each tick advances exactly one visual line; once we
						// hit the bottom the entity parks at the end position.
						const scrollSteps = Math.max(
							1,
							Math.round(spec.scrollDistBlocks / spec.lineHeightBlocks),
						)
						// offset = clamp(elapsed, 0, scrollSteps)
						scoreboard.players.set(this.tempOffset, this.tempElapsed)
						scoreboard.players.set(this.tempLimit, scrollSteps)
						scoreboard.players.operation(this.tempOffset, '<', this.tempLimit)
						scoreboard.players.set(this.tempLimit, 0)
						scoreboard.players.operation(this.tempOffset, '>', this.tempLimit)
						// offset *= lineHeightInt
						scoreboard.players.set(this.tempLimit, lineHeightInt)
						scoreboard.players.operation(this.tempOffset, '*=', this.tempLimit)
						// targetY = startYInt - offset
						scoreboard.players.set(this.tempTarget, startYInt)
						scoreboard.players.operation(this.tempTarget, '-=', this.tempOffset)
						// Apply Pos[1] (Y) — double storage with 0.0001 scale
						// gives 0.1 mm precision over the full ±8 block range.
						const selectors = Selector('@e', {
							tag: [spec.scrollTag as `${any}${string}`, slideTag(idx)],
						})
						execute.as(selectors).run(() => {
							Data('entity', '@s').select('Pos[1]').set(this.tempTarget, 'double', 0.0001)
						})
					}
				}),
			)
		}

		// `slideLoop` is assigned in the next expression and is defined
		// before `nextSlide` / `mount` / `unmount` need it.
		this.slideLoop = MCFunction('presentation/slides/loop', () => {
			for (let s = 0; s < this.totalSlides; s++) {
				this.currentSlide.set(s)
				this.setSlideFns[s]()
				sleep(`${this.durations[s]}s`)
			}
			// After the last slide's sleep, schedule a fresh loop run.
			schedule.function(this.slideLoop, '1t', 'replace')
		})

		this.nextSlide = MCFunction('presentation/slides/next', () => {
			const loopName = this.slideLoop.name
			schedule.clear(loopName)
			schedule.clear(`${loopName}/schedule`)
			for (let i = 1; i <= this.totalSlides; i++) {
				schedule.clear(`${loopName}/${i === 1 ? '__sleep' : `__sleep${i}`}`)
			}
			this.currentSlide.add(1)
			_.if(this.currentSlide.greaterThanOrEqualTo(this.totalSlides), () => {
				this.currentSlide.set(0)
			})
			// Re-stamp shown-at so the next slide's scroll starts from 0.
			execute.store.result
				.score(this.slideShownAt)
				.run.time.query('gametime')
			for (let s = 0; s < this.totalSlides; s++) {
				this.hideSlide[s]()
			}
			for (let s = 0; s < this.totalSlides; s++) {
				_.if(this.currentSlide.equalTo(s), () => {
					this.showSlide[s]()
				})
			}
		})

		this.mount = MCFunction('presentation/mount', () => {
			// Reset the visible-slide tracker so the first nextSlide
			// after mount advances from a clean state (-1 + 1 = 0).
			this.currentSlide.set(-1)
			for (let s = 0; s < this.totalSlides; s++) {
				summonVisibleElements(
					this.slideVisibles[s],
					this.styles,
					this.sceneW,
					this.sceneH,
					this.origin,
					[slideTag(s)],
					0, // start hidden
					this.codePrecomputed,
					this.imgResources,
					SCENE_TAG,
				)
			}
			// 1t delay so spawn packets process before the first show.
			schedule.function(this.slideLoop, '1t', 'replace')
		})

		this.tick = MCFunction('presentation/tick', () => {
			// Per-slide scroll-tick is gated on `currentSlide`. Runs every
			// game tick; the `_.if` chain only fires the matching slide's
			// scroll MCFunction (others are skipped).
			for (let s = 0; s < this.totalSlides; s++) {
				_.if(this.currentSlide.equalTo(s), () => {
					this.scrollTickFns[s]()
				})
			}
		}, { runOnTick: true })

		this.unmount = MCFunction('presentation/unmount', () => {
			// Cancel every pending loop run — main entry, the
			// __sleep chain, and the schedule wrapper that restarts.
			const loopName = this.slideLoop.name
			schedule.clear(loopName)
			schedule.clear(`${loopName}/schedule`)
			for (let i = 1; i <= this.totalSlides; i++) {
				schedule.clear(`${loopName}/${i === 1 ? '__sleep' : `__sleep${i}`}`)
			}
			execute.run.kill(Selector('@e', { tag: SCENE_TAG }))
		})
	}

	setSlide(index: number): MCFunctionClass<undefined, undefined> {
		if (index < 0 || index >= this.totalSlides) {
			throw new Error(`setSlide: index ${index} out of range (0..${this.totalSlides - 1})`)
		}
		return this.setSlideFns[index]
	}

	rerenderSlide(index: number, tree: VNode): MCFunctionClass<undefined, undefined> {
		if (index < 0 || index >= this.totalSlides) {
			throw new Error(`rerenderSlide: index ${index} out of range (0..${this.totalSlides - 1})`)
		}
		const visible = flatWalk(tree).filter(({ node }) => isVisibleType(node.type))
		return MCFunction(`presentation/slides/rerender/${index}`, () => {
			execute.run.kill(Selector('@e', { tag: slideTag(index) }))
			summonVisibleElements(
				visible,
				this.styles,
				this.sceneW,
				this.sceneH,
				this.origin,
				[slideTag(index)],
				0,
				this.codePrecomputed,
				this.imgResources,
				SCENE_TAG,
			)
		})
	}

	get slideLoopFn(): MCFunctionClass<undefined, undefined> {
		return this.slideLoop
	}
}