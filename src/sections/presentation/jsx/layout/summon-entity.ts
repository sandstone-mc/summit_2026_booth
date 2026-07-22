// Emit `summon text_display / item_display ...` commands for a single
// element or row-flow block. Must run inside an MCFunction callback —
// the commands attach to the active MCFunction.

import { summon, NBT, type LabelClass, NBTInt } from 'sandstone'
import type { SymbolEntity } from 'sandstone/arguments'
import { parseColorInt } from './color'
import { buildTextJson, buildIdentityTransform, applyBackgroundColor } from './nbt'
import { Z_VISUAL_OFFSET } from './constants'
import { KIND_TEXT_TAG } from '../slides/tags'
import type { ElementLayout } from './element'
import type { StyledSegment } from '../render'
import { fmt } from '@shared'

const ROTATION_QUATERNION = NBT.float([0, 0, 0, 1])
const ZERO_TRANSLATION = NBT.float([0, 0, 0])
const FULL_BRIGHTNESS = { sky: NBT.int(15), block: NBT.int(15) } as const

export function summonTextEntity(
	el: Extract<ElementLayout, { kind: 'text' }>,
	entityX: number,
	entityY: number,
	z: number,
	extraTags: (`${any}${string}` | LabelClass)[],
	sceneTag: LabelClass,
	initialOpacity: number | undefined,
): void {
	if (el.chunks && el.chunks.length > 0 && el.scrollTag) {
		const tags: (`${any}${string}` | LabelClass)[] = [sceneTag, ...extraTags]
		tags.push(el.scrollTag as `${any}${string}`)
		const nbt: SymbolEntity['text_display'] = {
			Tags: tags,
			text: buildTextJson(el.chunks[0].content, el.declarations, el.type),
			transformation: buildIdentityTransform(el.textScale),
		}
		applyBackgroundColor(
			el.declarations,
			nbt as unknown as { background?: NBTInt },
		)
		if (el.width !== undefined)
			nbt.line_width = NBT.int(Math.round(el.width.px * el.widthCompensation))
		else if (el.declarations['line-width'])
			nbt.line_width = NBT.int(parseInt(el.declarations['line-width']))
		if (el.declarations.shadow === 'true') nbt.shadow = true
		if (el.declarations['see-through'] === 'true') nbt.see_through = true
		let align: 'center' | 'left' | 'right' | undefined
		if (el.type === 'code') align = 'left'
		const ta = el.declarations['text-align']?.toLowerCase().trim()
		if (ta === 'left' || ta === 'right' || ta === 'center') align = ta
		if (align) nbt.alignment = align
		// Scroll entity starts visible — slide show/hide owns visibility.
		nbt.text_opacity = NBT.int(-1)
		summon(
			'text_display',
			`${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`,
			nbt,
		)
		return
	}

	// Single entity (non-scroll, or scroll with no chunks).
	const tags: (`${any}${string}` | LabelClass)[] = [sceneTag, ...extraTags]
	if (el.scrollTag) tags.push(el.scrollTag as `${any}${string}`)

	// Inline-formatted prose (`<p>` / `<h*>` with `**bold**` etc.):
	// the layout pass already parsed the segments and stored them
	// in source order on `styledContent`. We hand the array
	// straight to MC's `text` field — Minecraft's `line_width`
	// does the actual wrap at runtime, so we never inject `\n`
	// characters here. Falls through to the bordered / plain
	// string path when no formatting was detected.
	let textContent: string | StyledSegment[]
	if (el.styledContent && el.styledContent.length > 0) {
		textContent = el.styledContent
	} else {
		textContent = el.borderedContent ?? el.content
	}

	const nbt: SymbolEntity['text_display'] = {
		Tags: tags,
		text: buildTextJson(textContent, el.declarations, el.type),
		transformation: buildIdentityTransform(el.textScale),
	}

	applyBackgroundColor(el.declarations, nbt as unknown as { background?: NBTInt })
	if (el.width !== undefined) nbt.line_width = NBT.int(Math.round(el.width.px * el.widthCompensation))
	else if (el.declarations['line-width']) nbt.line_width = NBT.int(parseInt(el.declarations['line-width']))
	if (el.declarations.shadow === 'true') nbt.shadow = true
	if (el.declarations['see-through'] === 'true') nbt.see_through = true

	// `<code>` defaults to left-aligned (code editor style); LESS overrides.
	let align: 'center' | 'left' | 'right' | undefined
	if (el.type === 'code') align = 'left'
	const ta = el.declarations['text-align']?.toLowerCase().trim()
	if (ta === 'left' || ta === 'right' || ta === 'center') align = ta
	if (align) nbt.alignment = align

	const opacityStr = el.declarations.opacity
	if (initialOpacity !== undefined) {
		nbt.text_opacity = NBT.int(initialOpacity)
	} else if (opacityStr) {
		// Stored as -256 + bytes — values 0-3 clamp to 255 in MC 1.21.9,
		// so subtract 256 to make those genuinely transparent.
		nbt.text_opacity = NBT.int(Math.round((parseFloat(opacityStr) / 100) * 255) - 256)
	}

	summon('text_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`, nbt)
}

export function summonImageEntity(
	el: Extract<ElementLayout, { kind: 'image' }>,
	entityX: number,
	entityY: number,
	z: number,
	extraTags: (`${any}${string}` | LabelClass)[],
	sceneTag: LabelClass,
	initialOpacity: number | undefined,
): void {
	// `paper` is a no-op shape; `minecraft:item_model` overrides it fully.
	// `item_display: 'fixed'` makes the model 2D regardless of viewer angle.
	// `entityY` is the vertical center of the image cell — the layout
	// computed it (cellY + cellH/2) before calling here.
	const imgNbt: SymbolEntity['item_display'] = {
		Tags: [sceneTag, ...extraTags],
		item: {
			id: 'minecraft:paper',
			count: NBT.int(1),
			components: {
				// SNBT keys with `:` must be pre-quoted to dodge the parser
				// treating the colon as a type-tag.
				/* @ts-ignore — // TODO: Sandstone bug: both the key and the value here are jank */
				'"minecraft:item_model"': `${el.imgItemModel!}`,
			},
		},
		item_display: 'fixed',
		transformation: {
			scale: NBT.float([el.cellW, el.cellH, 1]),
			translation: ZERO_TRANSLATION,
			left_rotation: ROTATION_QUATERNION,
			right_rotation: ROTATION_QUATERNION,
		},
		brightness: FULL_BRIGHTNESS,
	}
	if (initialOpacity === 0) imgNbt.view_range = NBT.float(0.0)
	summon('minecraft:item_display', `${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`, imgNbt)
}

// Emit the layered text_display entities for a `<autocomplete>`
// element: editor (bordered code box), cursor ("|" that blinks), and
// the IntelliSense popup (one text_display per bg-color SEGMENT — so
// consecutive rows that share a background are rendered as a single
// multi-line entity).
// All are tagged with `ac_<role>_<autoId>[/seg_<idx>]` so the
// per-slide tick MCFunction in `slides/show.ts` can target each role
// independently.
//
// Editor sits at the cell's standard Y. Cursor sits at the editor's Y
// with `transformation.translation` = `[stage0.cursorXBlocks, stage0.cursorYBlocks, 0]`
// — the tick MCFunction patches only the translation each stage. Popup
// rows sit at the same Y with `text_opacity = 0` initially (hidden
// until their stage range starts); the tick patches their translation
// each stage so the block of rows tracks the cursor.
export function summonAutocompleteEntities(
	el: Extract<ElementLayout, { kind: 'autocomplete' }>,
	entityX: number,
	entityY: number,
	z: number,
	extraTags: (`${any}${string}` | LabelClass)[],
	sceneTag: LabelClass,
	initialOpacity: number | undefined,
): void {
	const autoId = el.autoId
	const tags = [sceneTag, ...extraTags, KIND_TEXT_TAG] as (`${any}${string}` | LabelClass)[]

	// Stage-0 state — what the entity shows before the tick MCFunction
	// gets a chance to update it.
	const stage0 = el.stages[0]

	// ── Editor entity ────────────────────────────────────────────────────
	const editorTags = [...tags, `ac_editor_${autoId}` as `${any}${string}`]
	const editorNbt: SymbolEntity['text_display'] = {
		Tags: editorTags,
		text: buildTextJson(stage0.editorContent, el.declarations, 'code'),
		transformation: buildIdentityTransform(el.textScale),
	}
	applyBackgroundColor(
		el.declarations,
		editorNbt as unknown as { background?: NBTInt },
	)
	if (el.width !== undefined)
		editorNbt.line_width = NBT.int(Math.round(el.width.px * el.widthCompensation))
	editorNbt.alignment = 'left'
	// Start visible — slide show/hide owns visibility post-mount.
	editorNbt.text_opacity = NBT.int(-1)
	summon(
		'text_display',
		`${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`,
		editorNbt,
	)

	// ── Cursor entity ───────────────────────────────────────────────────
	// Sits at the editor's Y. Per-tick `data modify entity @s transformation.translation`
	// moves the caret. text_opacity is toggled for the blink.
	const cursorTags = [...tags, `ac_cursor_${autoId}` as `${any}${string}`]
	const cursorTranslation = NBT.float([stage0.cursorXBlocks, stage0.cursorYBlocks, 0])
	const cursorNbt: SymbolEntity['text_display'] = {
		Tags: cursorTags,
		text: { text: '|', color: el.cursorColor },
		transformation: {
			translation: cursorTranslation,
			left_rotation: ROTATION_QUATERNION,
			right_rotation: ROTATION_QUATERNION,
			scale: NBT.float([el.textScale, el.textScale, el.textScale]),
		},
		background: NBT.int(0),
		alignment: 'left',
		text_opacity: NBT.int(-1),
	}
	summon(
		'text_display',
		`${fmt(entityX)} ${fmt(entityY)} ${fmt(z)}`,
		cursorNbt,
	)

	// ── Popup row entities ──────────────────────────────────────────────
	// The popup is split into one text_display PER BG-COLOR RUN — each
	// segment is one or more consecutive rows that share the same
	// background color, joined with `\n` segments in the entity's `text`
	// so MC renders them as a single multi-line block. This reduces
	// the entity count (e.g. a `[blue, gray, gray, gray]` popup becomes
	// 2 entities instead of 4). All segments are summoned at the editor's
	// entity X/Y; the tick MCFunction patches each segment's
	// `transformation.translation` each stage using the segment's static
	// `offsetYBlocks` so the segment block follows the cursor.
	// their `transformation.translation` each stage so the block of rows
	// follows the cursor.
	//
	// The stage-0 popup content is empty (the popup is hidden initially),
	// so we use the first stage that contains any popup text as the
	// summon's initial content — this matters less than the tick updates
	// (which overwrite text/translation every tick), but gives the entity
	// a non-empty `text` field at mount time so MC doesn't render a
	// zero-height quad.
	const stage0WithContent =
		el.stages.find((s) => s.popupSegmentContent.some((c) => c.length > 0))
		?? el.stages[0]
	for (let segIdx = 0; segIdx < el.popupSegments.length; segIdx++) {
		const seg = el.popupSegments[segIdx]
		const segTags = [
			...tags,
			`ac_popup_${autoId}_seg_${segIdx}` as `${any}${string}`,
		]
		const segNbt: SymbolEntity['text_display'] = {
			Tags: segTags,
			text: buildTextJson(
				stage0WithContent.popupSegmentContent[segIdx] ?? [],
				el.declarations,
				'autocomplete',
			),
			transformation: buildIdentityTransform(el.textScale),
			alignment: 'left',
			text_opacity: NBT.int(0),
		}
		// Each segment carries its own background color. The tick patches
		// these to 0 when the popup is hidden at a given stage since
		// `text_opacity` doesn't hide backgrounds.
		if (seg.bgInt) {
			segNbt.background = NBT.int(seg.bgInt)
		}
		// Initial `line_width` for the summon — the tick overwrites this
		// every stage with the per-stage width (entity moment uses the
		// entity list's widest row, NBT moment uses the NBT list's).
		// Picking the entity moment's width here as a sane default so the
		// quad isn't degenerate before the first tick lands.
		if (el.popupWidthPxPerStage.length > 0 && el.popupWidthPxPerStage[0] > 0) {
			segNbt.line_width = NBT.int(el.popupWidthPxPerStage[0])
		}
		// Popup segments sit 0.02 blocks IN FRONT of the editor so they
		// always render on top, even if the editor's background quad
		// grows or the entities share an exact z and z-fight at certain
		// view angles.
		summon(
			'text_display',
			`${fmt(entityX)} ${fmt(entityY)} ${fmt(z + 0.04)}`,
			segNbt,
		)
	}
}

// Internal helper — dispatches to text vs image entity summoner.
export function summonElement(
	el: ElementLayout,
	entityX: number,
	entityY: number,
	z: number,
	extraTags: (`${any}${string}` | LabelClass)[],
	sceneTag: LabelClass,
	initialOpacity: number | undefined,
): void {
	if (el.kind === 'text') {
		summonTextEntity(
			el,
			entityX,
			entityY,
			z,
			[...extraTags, KIND_TEXT_TAG],
			sceneTag,
			initialOpacity,
		)
	} else if (el.kind === 'autocomplete') {
		summonAutocompleteEntities(el, entityX, entityY, z, extraTags, sceneTag, initialOpacity)
	} else {
		summonImageEntity(el, entityX, entityY, z, extraTags, sceneTag, initialOpacity)
	}
}

export { Z_VISUAL_OFFSET }

// Re-exports for callers that don't want to pull every layout sub-module.
export { buildTextJson } from './nbt'