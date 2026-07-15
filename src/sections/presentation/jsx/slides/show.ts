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
	scoreboard,
} from 'sandstone'
import type { NBTObject } from 'sandstone/arguments'
import {
	summonVisibleElements,
	isVisibleType,
	computeSlideScrollSpecs,
	resetScrollIds,
	type ScrollSpec,
} from '../layout'
import { buildTextJson } from '../layout/nbt'
import { flatWalk } from '../tree/walk'
import type { VNode } from '../render'
import type { NodeWithPath } from '../tree/walk'
import type { Styles } from '../style'
import type { ImgResourceMap, CodePrecomputedMap } from '../layout'
import type { RowFlexWidth } from '../prepare/row-flex'
import { SCENE_TAG, slideTag, KIND_TEXT_TAG } from './tags'
import { computeDurationsSeconds, type SlidesTiming } from '../../slides'

export interface SlideShowInput {
	trees: VNode[]
	/**
	 * Optional pre-filtered visible-element lists per slide. When
	 * provided, used in place of `flatWalk(trees[i]).filter(isVisibleType)`
	 * — lets the caller (e.g. the off-screen diagnostic) drop fully
	 * off-screen elements before layout runs. Defaults to deriving from
	 * `trees` if omitted.
	 */
	slideVisibles?: NodeWithPath[][]
	sceneW: number
	sceneH: number
	origin: readonly [number, number, number]
	styles: Styles
	slideTexts: string[]
	timing?: SlidesTiming
	codePrecomputed: CodePrecomputedMap
	imgResources?: ImgResourceMap
	/** Row-flex width overrides (resolved by `prepareRowFlexWidths`). */
	rowFlexWidths?: WeakMap<VNode, RowFlexWidth>
	/** Pre-walked `<explorer>` trees (per-source-line color segments + wraps). */
	explorerPrecomputed?: CodePrecomputedMap
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
	private readonly explorerPrecomputed: CodePrecomputedMap
	private readonly rowFlexWidths: WeakMap<VNode, RowFlexWidth>
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
		this.explorerPrecomputed = input.explorerPrecomputed ?? new WeakMap()
		this.imgResources = input.imgResources ?? new Map()
		this.rowFlexWidths = input.rowFlexWidths ?? new WeakMap()
		this.durations = computeDurationsSeconds(input.slideTexts, input.timing)
		this.slideVisibles =
			input.slideVisibles ??
			input.trees.map((t) =>
				flatWalk(t).filter(({ node }) => isVisibleType(node.type)),
			)
		// Pre-pass: run the placement math to discover each scrolling
		// `<code>`'s start Y + total scroll distance. Runs without emitting
		// any `summon` commands (the same helper powers the actual emit).
		// The collected specs drive scroll-tick generation below. Placements
		// are also returned but unused here — the diagnostic runs separately
		// at JS-build time in `renderSlides` to log off-screen warnings.
		this.scrollSpecsPerSlide = this.slideVisibles.map((visible) =>
			computeSlideScrollSpecs(
				visible,
				this.styles,
				this.sceneW,
				this.sceneH,
				this.origin,
				this.codePrecomputed,
				this.imgResources,
				this.rowFlexWidths,
				this.explorerPrecomputed,
			).scrollSpecs,
		)
		// The pre-pass walked the layout counter; reset so the actual
		// summon pass in `mount` produces the same tag sequence.
		resetScrollIds()

		this.showSlide = []
		this.hideSlide = []
		for (let s = 0; s < this.totalSlides; s++) {
			const tag = slideTag(s)
			// `text_opacity` only applies to text_display — `item_display`
			// (images) has no such field, so we MUST skip non-text here.
			// The `KIND_TEXT_TAG` filter also keeps scrolling `<code>`
			// chunks untouched (chunks carry `code_scroll_*_c*` and no
			// `kind.text`); the scroll-tick owns chunk visibility.
			// `view_range` applies to BOTH text_display and item_display,
			// so this selector must hit every slide entity — that includes
			// images, which carry `slide_<n>` but not `kind.text`.
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

		// Per-slide scroll-tick. Reads gametime, computes elapsed ticks
		// since the slide was shown, then swaps the single text_display
		// entity's `text` field to the bordered content of chunk N (one
		// `data modify entity ... text set value [...]` per chunk, gated
		// on `visibleIdx == N`). Visibility (text_opacity / view_range)
		// is owned by the slide show/hide MCFunctions — the scroll-tick
		// only mutates `text`.
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
						// One chunk becomes visible per `ticksPerChunk` ticks.
						// `ticksPerChunk` defaults to 4 (≈0.2s at 20 tps).
						const ticksPerChunk = 4
						const chunkCount = Math.max(1, spec.chunkCount)
						// Stash `ticksPerChunk` in tempLimit so the divide op
						// below has a Score target (scoreboard ops don't accept
						// integer literals).
						scoreboard.players.set(this.tempLimit, ticksPerChunk)
						// visibleIdx = clamp(elapsed / ticksPerChunk, 0, chunkCount-1).
						// Use `operation =` (not `set`) to copy between scores —
						// `set` only accepts integer literals in 1.21+.
						scoreboard.players.operation(this.tempOffset, '=', this.tempElapsed)
						scoreboard.players.operation(this.tempOffset, '/=', this.tempLimit)
						scoreboard.players.set(this.tempLimit, chunkCount - 1)
						scoreboard.players.operation(this.tempOffset, '<', this.tempLimit)
						scoreboard.players.set(this.tempLimit, 0)
						scoreboard.players.operation(this.tempOffset, '>', this.tempLimit)
						// Now `tempOffset` holds the index of the visible chunk.
						const entitySel = Selector('@e', {
							tag: [spec.scrollTag as `${any}${string}`, slideTag(idx)],
						})
						for (let ci = 0; ci < chunkCount; ci++) {
							const chunkValue = buildTextJson(
								spec.chunks[ci].content,
								spec.declarations,
								spec.type,
							)
							scoreboard.players.set(this.tempLimit, ci)
							scoreboard.players.operation(this.tempLimit, '=', this.tempOffset)
							_.if(this.tempLimit.equals(ci), () => {
								execute.as(entitySel).run.data.modify
									.entity('@s', 'text')
									.set.value(chunkValue as NBTObject)
							})
						}
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
					this.rowFlexWidths,
					this.explorerPrecomputed,
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
		}, { runEveryTick: true })

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
				this.rowFlexWidths,
				this.explorerPrecomputed,
			)
		})
	}

	get slideLoopFn(): MCFunctionClass<undefined, undefined> {
		return this.slideLoop
	}
}