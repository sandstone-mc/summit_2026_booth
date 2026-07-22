// SlideShow — orchestrates the MCFunctions backing a multi-slide scene:
// per-slide show/hide, setSlide, rerenderSlide, the auto-advance loop,
// nextSlide, mount/unmount. Owns the auto-advance slide index tracker.

import {
	MCFunction,
	type MCFunctionClass,
	Selector,
	NBT,
	execute,
	returnCmd,
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
	computeSlideTickSpecs,
	resetScrollIds,
	resetAutocompleteIds,
	type ScrollSpec,
	type AutocompleteSpec,
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
import type { StaticCase } from 'sandstone/flow'

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
	/**
	 * Optional hook fired AFTER the last slide's full display duration,
	 * in place of the default cycle-back reschedule. Use this when the
	 * consumer wants to drive the post-presentation state themselves
	 * (e.g. unmount + transition to the next scene). When set, the loop
	 * does NOT reschedule itself — the presentation stays on its last
	 * slide until the consumer takes over. `currentSlide` is left at
	 * `totalSlides - 1` so downstream code can read it.
	 */
	onPresentationEnd?: MCFunctionClass<undefined, undefined>
}

export class SlideShow {
	readonly totalSlides: number
	readonly durations: number[]
	readonly slideVisibles: NodeWithPath[][]
	readonly showSlide: MCFunctionClass<undefined, undefined>[]
	readonly hideSlide: MCFunctionClass<undefined, undefined>[]
	private readonly setSlideFns: MCFunctionClass<undefined, undefined>[]
	private readonly scrollTickFns: MCFunctionClass<undefined, undefined>[]
	private readonly autocompleteTickFns: MCFunctionClass<undefined, undefined>[]
	private readonly scrollSpecsPerSlide: ScrollSpec[][]
	private readonly autocompleteSpecsPerSlide: AutocompleteSpec[][]
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
	private readonly onPresentationEnd: MCFunctionClass<undefined, undefined> | undefined
	private readonly slideLoop: MCFunctionClass<undefined, undefined>
	readonly nextSlide: MCFunctionClass<undefined, undefined>
	readonly mount: MCFunctionClass<undefined, undefined>
	readonly tick: MCFunctionClass<undefined, undefined>
	readonly unmount: MCFunctionClass<undefined, undefined>
	readonly resetCurrentSlideAnimations: MCFunctionClass<undefined, undefined>

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
		this.onPresentationEnd = input.onPresentationEnd
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
		const tickSpecResults = this.slideVisibles.map((visible) =>
			computeSlideTickSpecs(
				visible,
				this.styles,
				this.sceneW,
				this.sceneH,
				this.origin,
				this.codePrecomputed,
				this.imgResources,
				this.rowFlexWidths,
				this.explorerPrecomputed,
			),
		)
		this.scrollSpecsPerSlide = tickSpecResults.map((r) => r.scrollSpecs)
		this.autocompleteSpecsPerSlide = tickSpecResults.map((r) => r.autocompleteSpecs)
		// The pre-pass walked the layout counter; reset so the actual
		// summon pass in `mount` produces the same tag sequence.
		resetScrollIds()
		resetAutocompleteIds()

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
					// Entering the final slide fires the end hook the
					// moment it appears — no extra `next` press required.
					if (index === this.totalSlides - 1 && this.onPresentationEnd) {
						this.onPresentationEnd()
					}
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

		// Per-slide autocomplete tick. Drives the layered text_displays
		// per `<autocomplete>` element on the slide:
		//   * editor (ac_editor_<autoId>): swaps `text` per typing stage
		//   * cursor (ac_cursor_<autoId>): patches `transformation.translation`
		//     per stage + toggles `text_opacity` every `cursorBlink` ticks
		//   * popup segments (ac_popup_<autoId>_seg_<s>): one text_display
		//     per bg-color RUN — consecutive rows sharing a background are
		//     a single multi-line entity. Each stage swaps each segment's
		//     `text` + `text_opacity` + `background`, and patches the
		//     segment's `transformation.translation` so it follows the
		//     cursor (with a per-segment STATIC Y offset from the popup
		//     anchor).
		// All entities are tagged with the slide's `slide_<n>` tag (via
		// `summonVisibleElements`/`extraTags`), so the show/hide
		// MCFunctions own their visibility. This tick only mutates their
		// animation state.
		this.autocompleteTickFns = []
		for (let s = 0; s < this.totalSlides; s++) {
			const idx = s
			const specs = this.autocompleteSpecsPerSlide[idx]
			if (specs.length === 0) {
				this.autocompleteTickFns.push(
					MCFunction(`presentation/slides/autocomplete/${idx}`, () => {}),
				)
				continue
			}
			this.autocompleteTickFns.push(
				MCFunction(`presentation/slides/autocomplete/${idx}`, () => {
					// Read elapsed time once per tick.
					execute.store.result
						.score(this.tempCurrentTime)
						.run.time.query('gametime')
					scoreboard.players.operation(this.tempElapsed, '=', this.tempCurrentTime)
					scoreboard.players.operation(this.tempElapsed, '-=', this.slideShownAt)
					// Cursor blink period — toggle every `2 * cursorBlink` ticks.
					// Use `tempModulo` derived from `tempElapsed`. We reuse
					// `tempOffset` to hold (elapsed mod 2*blink); the actual
					// `tempOffset` for stage indexing is restored per spec.
					for (const spec of specs) {
						const ticksPerStage = 5 // ≈0.25s per typed character (50% slower than 3)
						const stageCount = spec.stageCount
						const stageLimit = Math.max(0, stageCount - 1)
						// stage = clamp(elapsed / ticksPerStage, 0, stageLimit)
						scoreboard.players.set(this.tempLimit, ticksPerStage)
						scoreboard.players.operation(this.tempOffset, '=', this.tempElapsed)
						scoreboard.players.operation(this.tempOffset, '/=', this.tempLimit)
						scoreboard.players.set(this.tempLimit, stageLimit)
						scoreboard.players.operation(this.tempOffset, '<', this.tempLimit)
						scoreboard.players.set(this.tempLimit, 0)
						scoreboard.players.operation(this.tempOffset, '>', this.tempLimit)
						// `DEBUG_AUTOCOMPLETE_FREEZE=1` pins the animation at
						// the NBT-key popup (the `Tags` moment) so the
						// popup can be inspected at its appearance instead
						// of vanishing. Uses the spec's `nbtStageStart`
						// directly — it identifies exactly the frame
						// where the `Tags` popup begins, not a generic
						// "second non-zero entry" in `popupVisiblePerStage`
						// (which would be wrong if any future stage
						// between the two moments also has `popupVisible`
						// set). Stage index is computed at compile time
						// (fixed per spec); the runtime op only clamps
						// upward.
						const freezeAtStage = process.env.DEBUG_AUTOCOMPLETE_FREEZE
							? spec.nbtStageStart
							: -1
						if (freezeAtStage > 0) {
							scoreboard.players.set(this.tempLimit, freezeAtStage)
							// MC's `<` scoreboard op is `target = min(target, source)` —
							// clamps `tempOffset` DOWN to `freezeAtStage` so the
							// animation pins at that stage instead of advancing past.
							scoreboard.players.operation(this.tempOffset, '<', this.tempLimit)
						}

						const editorSel = Selector('@e', {
							tag: [`ac_editor_${spec.autoId}` as `${any}${string}`, slideTag(idx)],
						})
						const cursorSel = Selector('@e', {
							tag: [`ac_cursor_${spec.autoId}` as `${any}${string}`, slideTag(idx)],
						})
						// The popup is split into consecutive BG-COLOR RUNS —
						// one text_display per segment (`ac_popup_<autoId>_seg_<s>`).
						// Each segment is one or more consecutive rows that
						// share a background, joined with `\n`. The summon
						// pass creates one entity per `popupSegments` entry,
						// so the segment count is static.
						const popupSegmentCount = spec.popupSegments.length
						const popupSegmentSels: ReturnType<typeof Selector>[] = []
						for (let sIdx = 0; sIdx < popupSegmentCount; sIdx++) {
							popupSegmentSels.push(
								Selector('@e', {
									tag: [
										`ac_popup_${spec.autoId}_seg_${sIdx}` as `${any}${string}`,
										slideTag(idx),
									],
								}),
							)
						}

						// Editor: swap `text` per stage.
						for (let si = 0; si < stageCount; si++) {
							const editorJson = buildTextJson(
								spec.editorContent[si],
								spec.editorDeclarations,
								'code',
							)
							scoreboard.players.set(this.tempLimit, si)
							scoreboard.players.operation(this.tempLimit, '=', this.tempOffset)
							_.if(this.tempLimit.equals(si), () => {
								execute.as(editorSel).run.data.modify
									.entity('@s', 'text')
									.set.value(editorJson as NBTObject)
							})
						}

						// Cursor + Popup segments: patch `transformation.translation`
						// per stage. MC stores `transformation` as a list of 10
						// floats (`[tx,ty,tz, qx,qy,qz,qw, sx,sy,sz]`) — to
						// move just the translation we target the
						// `translation` LIST sub-record, leaving scale +
						// rotations intact.
						//
						// Popup sits just BELOW and to the RIGHT of the cursor —
						// intellisense dropdown style.
						//
						// MC's text_display quad is CENTERED on the entity
						// origin regardless of `alignment`. `alignment='left'`
						// only left-justifies text within the centered quad,
						// so the visible TEXT LEFT edge is at
						// `popupEntityX - popupQuadHalfWidthBlocks`. To put it
						// at the cursor's right edge: popup X = cursor X +
						// cursorWidth + popupQuadHalfWidth.
						//
						// For the per-segment layout: each segment has a STATIC
						// `offsetYBlocks` (computed at layout time) that
						// positions its multi-line quad so its first row
						// lines up at the right vertical spot within the
						// popup. The tick just adds that offset to the
						// per-stage popup anchor Y (editor/cursor codepath
						// uses a local coord system where increasing
						// translation Y is visually downward).
						for (let si = 0; si < stageCount; si++) {
							const cx = spec.cursorXPerStage[si]
							const cy = spec.cursorYPerStage[si]
							const cursorTr = NBT.float([cx, cy, 0])
							// Only build the popup segment translations if
							// this stage actually shows the popup. Skipping
							// the calls keeps the segment translations
							// parked at wherever they were last set —
							// typically the summon-time [0,0,0] — while the
							// popup is hidden, rather than re-anchoring next
							// to the cursor.
							const popupVisibleAtStage = spec.popupVisiblePerStage[si] !== 10
							// Half-width PER STAGE — entity-ID moment and
							// NBT-key moment have different longest
							// entries (`minecraft:skeleton` vs
							// `CustomName`), so their quad widths differ.
							// Using a global half-width was shifting the
							// NBT popup ~1 block to the right of where the
							// cursor-anchor formula placed the entity.
							const popupQuadHalfWidthBlocksAtStage =
								spec.popupWidthPxPerStage[si] / 64
							// Cursor text is centered on its entity origin
							// (per MC text_display behavior). For popup
							// text LEFT (= quad's left edge, since
							// alignment='left' stacks from the left of
							// the centered quad) to land 1.2 blocks past
							// the cursor's visual right edge:
							// popup entity X = cursorX + charWidthBlocks/2
							//   + 1.2 + popupQuadHalfWidthBlocks
							//
							// The NBT moment's popup lands 0.5 blocks too
							// far right relative to the cursor (the entity
							// popup renders at the right spot without the
							// shift; the NBT popup needs the -0.5 to align
							// with its narrower `line_width`).
							const inNbtRangeForPopup =
								si >= spec.nbtStageStart && si < spec.nbtStageStart + 6
							const popupAnchorX =
								cx + spec.cursorWidthBlocks / 2 + popupQuadHalfWidthBlocksAtStage + 1.2 -
								(inNbtRangeForPopup ? 0.5 : 0)
							// Popup's Y offset is `(sourceLineCount + 1)`
							// line-heights below the cursor anchor — one
							// line beyond the bottom of the snippet's
							// text rows so the popup clears the editor's
							// bottom border before appearing.
							const popupAnchorY = cy + spec.cursorHeightBlocks + (spec.popupLineHeightBlocks * .5)
							scoreboard.players.set(this.tempLimit, si)
							scoreboard.players.operation(this.tempLimit, '=', this.tempOffset)
							_.if(this.tempLimit.equals(si), () => {
								execute.as(cursorSel).run.data.modify
									.entity('@s', 'transformation.translation')
									.set.value(cursorTr as NBTObject)
								if (popupVisibleAtStage) {
									for (let sIdx = 0; sIdx < popupSegmentCount; sIdx++) {
										const segTr = NBT.float([
											popupAnchorX,
											popupAnchorY + spec.popupSegments[sIdx].offsetYBlocks,
											0,
										])
										execute.as(popupSegmentSels[sIdx]).run.data.modify
											.entity('@s', 'transformation.translation')
											.set.value(segTr as NBTObject)
									}
								}
							})
						}

						// Popup segments: swap `text`, `text_opacity`, and
						// `background` per stage. When the stage falls
						// outside the IntelliSense moment ranges,
						// popupVisiblePerStage[si] is 0 → every segment
						// entity is hidden (text via opacity, background
						// via the explicit 0 patch since `text_opacity`
						// doesn't hide backgrounds).
						for (let si = 0; si < stageCount; si++) {
							const visible = spec.popupVisiblePerStage[si]
							const stageSegments = spec.popupSegmentContent[si]
							scoreboard.players.set(this.tempLimit, si)
							scoreboard.players.operation(this.tempLimit, '=', this.tempOffset)
							_.if(this.tempLimit.equals(si), () => {
								for (let sIdx = 0; sIdx < popupSegmentCount; sIdx++) {
									const segSel = popupSegmentSels[sIdx]
									const segContent = stageSegments[sIdx]
									// Skip the `data modify entity @s text`
									// emit when this segment has no content
									// at this stage (popup hidden — content
									// is the empty array). The segment is
									// already invisible via text_opacity +
									// background = 0 below, and we don't
									// want to churn the text field every
									// tick with an empty string.
									if (segContent.length > 0) {
										const segJson = buildTextJson(
											segContent,
											spec.popupDeclarations,
											'autocomplete',
										)
										execute.as(segSel).run.data.modify
											.entity('@s', 'text')
											.set.value(segJson as NBTObject)
									}
									execute.as(segSel).run.data.modify
										.entity('@s', 'text_opacity')
										.set.value(NBT.int(visible))
									// Write `line_width` per stage so the entity
									// moment's quad (20 chars wide) and the
									// NBT moment's quad (12 chars wide) each
									// match their content. Skip the write when
									// the popup is hidden at this stage
									// (popupWidthPxPerStage[si] is 0 — and the
									// previous value stays put).
									if (spec.popupWidthPxPerStage[si] > 0) {
										execute.as(segSel).run.data.modify
											.entity('@s', 'line_width')
											.set.value(
												NBT.int(spec.popupWidthPxPerStage[si]) as NBTObject,
											)
									}
									// Each segment's background toggles between
									// its configured color (when visible) and 0
									// (when hidden). Segment 0 uses the
									// highlight color; segment 1+ uses the dim
									// color.
									const bgNbt = visible !== 0
										? NBT.int(spec.popupSegments[sIdx].bgInt)
										: NBT.int(0)
									execute.as(segSel).run.data.modify
										.entity('@s', 'background')
										.set.value(bgNbt as NBTObject)
								}
							})
						}
					}

					// Cursor blink — toggle text_opacity every `cursorBlink`
					// ticks, independent of stage. We compute
					// `(elapsed mod 2*cursorBlink) < cursorBlink` and toggle
					// the cursor's text_opacity based on the result. Use
					// the FIRST spec's cursorBlink — all cursors on a slide
					// blink in sync (today's slides only ever have one).
					const cursorBlink = Math.max(1, specs[0].cursorBlink)
					const blinkPeriod = cursorBlink * 2
					const tempMod = Objective.create('presentation.autocomplete_mod', 'dummy')('#m')
					// tempMod = (elapsed % blinkPeriod). Reuse tempLimit as
					// the divisor; clear it first so the modulo has a clean
					// Score target.
					scoreboard.players.operation(tempMod, '=', this.tempElapsed)
					scoreboard.players.set(this.tempLimit, blinkPeriod)
					scoreboard.players.operation(tempMod, '%=', this.tempLimit)
					// Now compare against cursorBlink (the half-period).
					scoreboard.players.set(this.tempLimit, cursorBlink)
					_.if(tempMod.lessThan(this.tempLimit), () => {
						for (const spec of specs) {
							const cursorSel = Selector('@e', {
								tag: [`ac_cursor_${spec.autoId}` as `${any}${string}`, slideTag(idx)],
							})
							execute.as(cursorSel).run.data.modify
								.entity('@s', 'text_opacity')
								.set.value(NBT.int(-1))
						}
					})
					_.if(tempMod.greaterThanOrEqualTo(this.tempLimit), () => {
						for (const spec of specs) {
							const cursorSel = Selector('@e', {
								tag: [`ac_cursor_${spec.autoId}` as `${any}${string}`, slideTag(idx)],
							})
							execute.as(cursorSel).run.data.modify
								.entity('@s', 'text_opacity')
								.set.value(NBT.int(0))
						}
					})
				}),
			)
		}

		// `slideLoop` is assigned in the next expression and is defined
		// before `nextSlide` / `mount` / `unmount` need it.
		this.slideLoop = MCFunction('presentation/slides/loop', () => {
			// Last slide has no timer — display it, then park. The end
			// hook fires inside `setSlideFns[last]`, so the loop doesn't
			// need to fire it again. No reschedule — the consumer drives
			// the post-presentation state.
			for (let s = 0; s < this.totalSlides; s++) {
				this.currentSlide.set(s)
				this.setSlideFns[s]()
				if (s < this.totalSlides - 1) {
					sleep(`${this.durations[s]}s`)
				}
			}
		})

		this.nextSlide = MCFunction('presentation/slides/next', () => {
			const loopName = this.slideLoop.name
			schedule.clear(loopName)
			schedule.clear(`${loopName}/schedule`)
			for (let i = 1; i <= this.totalSlides; i++) {
				schedule.clear(`${loopName}/${i === 1 ? '__sleep' : `__sleep${i}`}`)
			}
			// On the final slide: abort. No wrap-to-0 — nextSlide past
			// the last slide is a no-op. The end hook already fired
			// inside `setSlideFns[last]` when we entered this slide.
			_.if(this.currentSlide.equalTo(this.totalSlides - 1), () => {
				returnCmd()
			})
			this.currentSlide.add(1)
			// Re-stamp shown-at so the next slide's scroll starts from 0.
			execute.store.result
				.score(this.slideShownAt)
				.run.time.query('gametime')
			for (let s = 0; s < this.totalSlides; s++) {
				this.hideSlide[s]()
			}
			const cases: StaticCase<number>[] = []

			for (let s = 0; s < this.totalSlides; s++) {
				// Dispatch through `setSlideFns` (not `showSlide` directly)
				// so the end-hook side effect in `setSlideFns[last]` runs
				// when transitioning into the final slide.
				cases.push(['case', s, () => this.setSlideFns[s]()])
			}

			_.switch(this.currentSlide, cases)
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
			// Per-slide tick is gated on `currentSlide`. Runs every
			// game tick; the `_.if` chain only fires the matching slide's
			// tick MCFunctions (others are skipped). Scroll and autocomplete
			// ticks are independent — a slide with no `<autocomplete>`
			// simply has an empty `autocompleteTickFns[s]` MCFunction.
			for (let s = 0; s < this.totalSlides; s++) {
				_.if(this.currentSlide.equalTo(s), () => {
					this.scrollTickFns[s]()
					this.autocompleteTickFns[s]()
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

		// Rewinds the CURRENT slide's animations to their starting state
		// (stage 0) by re-stamping `slideShownAt` to the current
		// gametime. Both `scrollTickFns[s]` and `autocompleteTickFns[s]`
		// derive elapsed time from `slideShownAt`, so resetting it
		// forces the next tick to re-apply stage 0 content to entities
		// (editor text, cursor position, popup visibility, scroll
		// chunk). Slides with no animations are unaffected — the stamp
		// is harmless when no tick consumes it.
		this.resetCurrentSlideAnimations = MCFunction(
			'presentation/slides/reset_current',
			() => {
				execute.store.result
					.score(this.slideShownAt)
					.run.time.query('gametime')
			},
		)
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