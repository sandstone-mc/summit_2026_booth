// SlideShow — orchestrates the MCFunctions backing a multi-slide scene:
// per-slide show/hide, setSlide, rerenderSlide, the auto-advance loop,
// nextSlide, mount/unmount. Owns the auto-advance slide index tracker.

import {
	MCFunction,
	type MCFunctionClass,
	Selector,
	NBT,
	data,
	execute,
	sleep,
	schedule,
	Objective,
	_,
} from 'sandstone'
import { summonVisibleElements, isVisibleType } from '../layout'
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
	private readonly slideIdx = Objective.create('presentation.slide_idx', 'dummy')
	private readonly currentSlide = this.slideIdx('#current')
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
					for (let s = 0; s < this.totalSlides; s++) {
						if (s !== index) this.hideSlide[s]()
					}
					this.showSlide[index]()
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

		this.tick = MCFunction('presentation/tick', () => {}, { runOnTick: true })

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