// SlideShow — orchestrates the MCFunctions backing a multi-slide
// scene: per-slide show/hide, setSlide, rerenderSlide, the
// auto-advance loop, nextSlide, mount/unmount. Owns the auto-
// advance slide index tracker.

import {
	MCFunction,
	type MCFunctionClass,
	type Score,
	Selector,
	NBT,
	execute,
	sleep,
	schedule,
	Objective,
	_,
	scoreboard,
    LabelClass,
    say,
} from 'sandstone'
import type { NBTObject } from 'sandstone/arguments'
import type { VNode } from '../render'
import type { NodeWithPath } from '../tree/walk'
import type { Styles } from '../style'
import { computeSlideFrameSpecs, summonVisibleElements, type Placement } from '../layout'
import { prepareRowFlexWidths, type RowFlexWidth } from '../layout/row-flex'
import { type PrecomputedBag } from '../components/base'
import { SCENE_TAG, slideTag, KIND_TEXT_TAG } from './tags'
import { computeDurationsSeconds, type SlidesTiming } from '../../slides'
import type { StaticCase } from 'sandstone/flow'

export interface SlideShowInput {
	trees: VNode[]
	slideVisibles?: NodeWithPath[][]
	sceneW: number
	sceneH: number
	origin: readonly [number, number, number]
	styles: Styles
	slideTexts: string[]
	timing?: SlidesTiming
	/** Per-type pre-computed data from the components' `prepare()`
	 *  pass — tree-sitter highlights, image resources, etc. The
	 *  layout pass reads the per-type entries. */
	preResults?: PrecomputedBag
	rowFlexWidths?: WeakMap<VNode, RowFlexWidth>
}

export class SlideShow {
	readonly totalSlides: number
	readonly durations: number[]
	readonly slideVisibles: NodeWithPath[][]
	readonly showSlide: MCFunctionClass<undefined, undefined>[]
	readonly hideSlide: MCFunctionClass<undefined, undefined>[]
	private readonly setSlideFns: MCFunctionClass<undefined, undefined>[]
	private readonly frameDispatchFns: (MCFunctionClass<undefined, undefined> | null)[]
	private readonly slideIdx = Objective.create('presentation.slide_idx', 'dummy')
	private readonly currentSlide = this.slideIdx('#current')
	private readonly slideShownAt = Objective.create('presentation.slide_shown_at', 'dummy')('#shown_at')
	// Per-animated-component scratch objectives, created once per slide
	// in the constructor. We hold them as instance fields so the
	// scoreboard declarations stay live for the lifetime of the
	// SlideShow rather than being created per-tick (which would warn
	// about duplicate objective registration).
	private readonly animObjectives: Array<{
		tempElapsed: Score
		tempLimit: Score
		tempFrame: Score
		lastFrame: Score
	}> = []
	private readonly styles: Styles
	private readonly sceneW: number
	private readonly sceneH: number
	private readonly origin: readonly [number, number, number]
	private readonly rowFlexWidths: WeakMap<VNode, RowFlexWidth>
	private readonly preResults: PrecomputedBag
	private readonly slideLoop: MCFunctionClass<undefined, undefined>
	readonly nextSlide: MCFunctionClass<undefined, undefined>
	readonly mount: MCFunctionClass<undefined, undefined>
	readonly tick: MCFunctionClass<undefined, undefined>
	readonly unmount: MCFunctionClass<undefined, undefined>
	readonly resetCurrentSlideFrames: MCFunctionClass<undefined, undefined>

	constructor(input: SlideShowInput) {
		this.totalSlides = input.trees.length
		this.styles = input.styles
		this.sceneW = input.sceneW
		this.sceneH = input.sceneH
		this.origin = input.origin
		this.rowFlexWidths = input.rowFlexWidths ?? new WeakMap()
		this.preResults = input.preResults ?? {}
		this.frameDispatchFns = new Array(this.totalSlides).fill(null)
		this.durations = computeDurationsSeconds(input.slideTexts, input.timing)
		this.slideVisibles =
			input.slideVisibles ??
			input.trees.map(() => [])

		const tickSpecResults = this.slideVisibles.map((visible) =>
			computeSlideFrameSpecs(
				visible,
				this.styles,
				this.sceneW,
				this.sceneH,
				this.origin,
				slideTag(0),
				this.rowFlexWidths,
				this.preResults,
			),
		)

		// Bake per-frame MCFunctions for every animated component on
		// every slide. The slide-level dispatcher (one per slide with
		// at least one animated element) uses a single `_.switch` over
		// the visible frame index; identical-hash consecutive frames
		// are pruned from the switch.
		for (let s = 0; s < this.totalSlides; s++) {
			const animated: { el: any; frames: any; ticksPerChunk: number }[] = []
			for (const [i, placement] of Object.entries(tickSpecResults[s].placements)) {
				const el: any = placement.el
				if (!el?.component) continue
				if (typeof el.component.bakeFrames !== 'function') continue
				const frames = el.component.bakeFrames(s, Number(i), el)
				if (!frames || !frames.frameFns || frames.frameFns.length === 0) continue
				const ticksPerChunk = (el.ticksPerChunk as number | undefined) ?? 4
				animated.push({ el, frames, ticksPerChunk })
			}
			if (animated.length === 0) {
				this.frameDispatchFns[s] = null
				continue
			}
			// Pre-create per-component scratch objectives so the
			// scoreboard declarations live at the top of the output
			// rather than inside per-tick MCFunction bodies.
			const slideObjectives: typeof this.animObjectives = []
			for (let i = 0; i < animated.length; i++) {
				const obj = Objective.create(`anim_${s}_${i}`, 'dummy')
				slideObjectives.push({
					tempElapsed: obj('#elapsed'),
					tempLimit: obj('#limit'),
					tempFrame: obj('#frame'),
					lastFrame: obj('#last'),
				})
			}
			this.animObjectives.push(...slideObjectives)

			const dispatch = MCFunction(`presentation/slides/anim/${s}`, () => {
				// For each animated component, derive its current frame
				// index from elapsed = gametime - slideShownAt divided by
				// its ticksPerChunk, clamped to [0, frameCount-1]. Skip
				// dispatch when the index hasn't changed since last tick.
				for (let i = 0; i < animated.length; i++) {
					const a = animated[i]
					const frameCount = a.frames.frameFns.length
					if (frameCount === 0) continue
					const { tempElapsed, tempLimit, tempFrame, lastFrame } = slideObjectives[i]!

					_.if(tempFrame['<'](frameCount - 1), () => {
						tempFrame['+='](1)
					}).else(() => {
						tempFrame['='](0)
					})

					const cases: StaticCase<number>[] = []
					for (let fi = 0; fi < frameCount; fi++) {
						const prev = fi > 0 ? a.frames.hashes[fi - 1] : null
						if (prev !== null && prev === a.frames.hashes[fi]) continue
						cases.push(['case', fi, () => a.frames.frameFns[fi]()])
					}
					_.switch(tempFrame, cases)
				}
			})
			this.frameDispatchFns[s] = dispatch
		}

		this.showSlide = []
		this.hideSlide = []
		for (let s = 0; s < this.totalSlides; s++) {
			const tag = slideTag(s)
			this.showSlide.push(
				MCFunction(`presentation/slides/show/${s}`, () => {
					execute.as(Selector('@e', { tag: [tag, KIND_TEXT_TAG] })).run.data.modify
						.entity('@s', 'text_opacity')
						.set.value(NBT.int(-1))
					execute.as(Selector('@e', { tag })).run.data.modify
						.entity('@s', 'view_range')
						.set.value(NBT.float(1.0))
				}),
			)
			this.hideSlide.push(
				MCFunction(`presentation/slides/hide/${s}`, () => {
					execute.as(Selector('@e', { tag: [tag, KIND_TEXT_TAG] })).run.data.modify
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
					execute.store.result.score(this.slideShownAt).run.time.query('gametime')
					for (let s = 0; s < this.totalSlides; s++) {
						if (s !== index) this.hideSlide[s]()
					}
					this.showSlide[index]()
				}),
			)
		}

		this.slideLoop = MCFunction('presentation/slides/loop', () => {
			for (let s = 0; s < this.totalSlides; s++) {
				this.currentSlide.set(s)
				this.setSlideFns[s]()
				sleep(`${this.durations[s]}s`)
			}
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
			execute.store.result.score(this.slideShownAt).run.time.query('gametime')
			for (let s = 0; s < this.totalSlides; s++) {
				this.hideSlide[s]()
			}
			const cases: StaticCase<number>[] = []
			for (let s = 0; s < this.totalSlides; s++) {
				cases.push(['case', s, () => this.showSlide[s]()])
			}
			_.switch(this.currentSlide, cases)
		})

		this.mount = MCFunction('presentation/mount', () => {
			this.currentSlide.set(-1)
			for (let s = 0; s < this.totalSlides; s++) {
				const tag = slideTag(s)
				MCFunction(`presentation/slides/summon/${s}`, () => {
					summonSlideElements(
						this.slideVisibles[s],
						this.styles,
						this.sceneW, this.sceneH,
						this.origin,
						SCENE_TAG,
						[tag],
						0,
						this.rowFlexWidths,
						this.preResults,
					)
				})()
			}
			schedule.function(this.slideLoop, '1t', 'replace')
		})

		this.tick = MCFunction('presentation/tick', () => {
			for (let s = 0; s < this.totalSlides; s++) {
				_.if(this.currentSlide.equalTo(s), () => {
					if (this.frameDispatchFns[s]) this.frameDispatchFns[s]!()
				})
			}
		}, { runEveryTick: true })

		this.unmount = MCFunction('presentation/unmount', () => {
			const loopName = this.slideLoop.name
			schedule.clear(loopName)
			schedule.clear(`${loopName}/schedule`)
			for (let i = 1; i <= this.totalSlides; i++) {
				schedule.clear(`${loopName}/${i === 1 ? '__sleep' : `__sleep${i}`}`)
			}
			execute.run.kill(Selector('@e', { tag: SCENE_TAG }))
		})

		this.resetCurrentSlideFrames = MCFunction(
			'presentation/slides/reset_current',
			() => {
				execute.store.result.score(this.slideShownAt).run.time.query('gametime')
			},
		)
	}

	setSlide(index: number): MCFunctionClass<undefined, undefined> {
		if (index < 0 || index >= this.totalSlides) {
			throw new Error(`setSlide: index ${index} out of range (0..${this.totalSlides - 1})`)
		}
		return this.setSlideFns[index]
	}

	rerenderSlide(index: number, _tree: VNode): MCFunctionClass<undefined, undefined> {
		if (index < 0 || index >= this.totalSlides) {
			throw new Error(`rerenderSlide: index ${index} out of range (0..${this.totalSlides - 1})`)
		}
		return MCFunction(`presentation/slides/rerender/${index}`, () => {
			execute.run.kill(Selector('@e', { tag: slideTag(index) }))
		})
	}

	get slideLoopFn(): MCFunctionClass<undefined, undefined> {
		return this.slideLoop
	}
}

function summonSlideElements(
	visible: NodeWithPath[],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	sceneTag: LabelClass,
	entityTags: LabelClass[],
	initialOpacity: number | undefined,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth>,
	preResults: PrecomputedBag,
): void {
	summonVisibleElements(
		visible,
		styles,
		sceneW,
		sceneH,
		origin,
		sceneTag,
		entityTags,
		initialOpacity,
		rowFlexWidths,
		preResults,
	)
}