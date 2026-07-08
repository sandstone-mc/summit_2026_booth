import {
	MCFunction,
	type MCFunctionClass,
	summon,
	kill,
	abs,
	Selector,
	NBT,
	Label,
	LabelClass,
	data,
	execute,
	sleep,
	schedule,
	Objective,
	_,
} from 'sandstone'
import type { ExecuteCommand } from 'sandstone/commands'
import { parse as parseLess } from './less'
import type { LessTreeNode, LessRulesetNode, LessSelectorNode, LessElementNode, CssDeclarations } from './less'
import selectorParser from 'postcss-selector-parser'
import { parseLength, pxToTextScale, pxToTextLineHeight } from './length'
import { loadFontMetrics, wrapLines } from './text-metrics'
import { ContentTag, JSONTextComponent, SymbolEntity } from 'sandstone/arguments';
import { Fragment } from './jsx-runtime'
import { computeDurationsSeconds, type SlidesTiming } from '../slides'

export type VNode = { type: any; props: any; key: any }

export type RenderOptions = {
	origin: readonly [number, number, number]
	bounds: readonly [number, number] // [width, height] in meters
}

/** Lifecycle MCFunctions. tick is always no-op in this framework. */
export type Scene = {
	mount: MCFunctionClass<undefined, undefined>
	tick: MCFunctionClass<undefined, undefined>
	unmount: MCFunctionClass<undefined, undefined>
}

/**
 * Multi-slide scene. Carries per-slide primitives that index.tsx (or any
 * downstream code) can call from its own MCFunctions to drive the show on
 * the fly — show/hide individual slides, jump to a slide, or rerender a
 * slide with a fresh JSX tree.
 */
export type SlideScene = Scene & {
	/** Per-slide show primitives — call to make slide N visible. */
	showSlide: MCFunctionClass<undefined, undefined>[]
	/** Per-slide hide primitives. */
	hideSlide: MCFunctionClass<undefined, undefined>[]
	/** Combined: hide every other slide, show slide N. */
	setSlide: (index: number) => MCFunctionClass<undefined, undefined>
	/** Re-spawn slide N's entities from a new JSX tree (keeps the slide tag). */
	rerenderSlide: (index: number, tree: VNode) => MCFunctionClass<undefined, undefined>
	/**
	 * Cancel the auto-advance loop and step forward one slide from the current.
	 * Tracks the visible slide via the `presentation.slide_idx` objective; the
	 * auto-advance loop sets it on each tick, nextSlide reads + increments + wraps.
	 * Re-mount to restore the auto-advance animation from slide 0.
	 */
	nextSlide: MCFunctionClass<undefined, undefined>
	/** The auto-advance loop. Already kicked off by mount; reschedules itself. */
	slideLoop: MCFunctionClass<undefined, undefined>
	/** Display duration (in seconds) for each slide. */
	durations: number[]
	/** Total number of slides. */
	totalSlides: number
}

const SCENE_TAG = Label('presentation')

/** Tag attached to every entity in slide `index`. */
function slideTag(index: number): LabelClass {
	return Label(`slide_${index}`)
}

/**
 * Selector matching scene entities inside the rendered footprint. Pairs
 * with `execute positioned <origin-(0,0,1)>` — MC's volume becomes
 * `[origin-(0,0,1), origin+(bounds[0], bounds[1]-1, 1)]`, which is the
 * exact box that contains every text_display we summon (text_display
 * hitboxes are zeroed, so we need a 2-block z slab).
 */
function sceneEntitiesInBounds(
	bounds: readonly [number, number],
	tag: string | LabelClass = SCENE_TAG,
) {
	return Selector('@e', {
		tag,
		dx: bounds[0] - 1,
		dy: bounds[1] - 2,
		dz: 1,
	})
}

/** Kill every entity tagged with SCENE_TAG inside the scene footprint. */
function killSceneEntities(
	bounds: readonly [number, number],
	origin: readonly [number, number, number],
): void {
	execute.positioned([origin[0], origin[1], origin[2] - 1]).run.kill(sceneEntitiesInBounds(bounds))
}

// ── JSX tree helpers ─────────────────────────────────────────────

function isVNode(x: any): x is VNode {
	return x != null && typeof x === 'object' && 'type' in x && 'props' in x
}

function flattenChildren(children: any): any[] {
	if (children == null || children === false) return []
	if (Array.isArray(children)) return children.flatMap(flattenChildren)
	return [children]
}

function extractText(children: any): string {
	if (children == null || children === false) return ''
	if (typeof children === 'string' || typeof children === 'number') return String(children)
	if (isVNode(children)) return extractText(children.props?.children)
	if (Array.isArray(children)) return children.map(extractText).join('')
	return ''
}

function nodeSelector(node: VNode): string {
	const tag = String(node.type)
	const id = node.props?.id ? `#${node.props.id}` : ''
	const cls = node.props?.class ? `.${node.props.class}` : ''
	return tag + id + cls
}

type NodeWithPath = { node: VNode; path: string[] }

function flatWalk(root: VNode): NodeWithPath[] {
	const out: NodeWithPath[] = []

	function walkNode(node: VNode, path: string[]) {
		// Unwrap function components + Fragments. Walk the resolved tree.
		let cur: any = node
		while (typeof cur?.type === 'function') {
			const result = cur.type(cur.props ?? {})
			if (Array.isArray(result)) {
				for (const c of result) if (isVNode(c)) walkNode(c, path)
				return
			}
			cur = result
		}

		const sel = nodeSelector(cur)
		const myPath = [...path, sel]
		out.push({ node: cur, path: myPath })

		for (const child of flattenChildren(cur.props?.children)) {
			if (isVNode(child)) walkNode(child, myPath)
		}
	}

	walkNode(root, [])
	return out
}

// ── LESS → styles map ────────────────────────────────────────────

type Styles = Map<string, CssDeclarations>

async function compileStyles(lessSource: string): Promise<Styles> {
	const styles: Styles = new Map()
	if (!lessSource.trim()) return styles
	const ast = await parseLess(lessSource)
	collectRules(ast, styles, [])
	return styles
}

/**
 * Walk a LESS AST and flatten rulesets into a selector → declarations map.
 * `parentSelectors` is the chain of already-expanded selector strings of
 * every ancestor ruleset (innermost last); it's used to expand `&` in any
 * nested ruleset we descend into. At the root level this is `[]` and `&`
 * has no special meaning.
 */
function collectRules(
	node: LessTreeNode | null | undefined,
	into: Styles,
	parentSelectors: string[],
): void {
	if (!node) return
	if (node.type === 'Ruleset') {
		const ruleset: LessRulesetNode = node
		const mySelectors = expandLessSelectors(ruleset.selectors ?? [], parentSelectors)
		if (mySelectors.length > 0) {
			const declarations: CssDeclarations = {}
			for (const rule of ruleset.rules ?? []) {
				if (rule.type === 'Declaration') {
					// LESS AST: declaration.name is an array of keyword nodes for
					// property declarations, or a bare `@name` string for variable
					// declarations. declaration.value can be a primitive (e.g. a
					// string for named keywords) or an Expression node — for hex
					// colors `value` is an Expression array (truthy), so naive
					// String() gives "[object Object]". Prefer toCSS({}) which
					// always returns the canonical CSS form.
					const name = Array.isArray(rule.name) ? rule.name[0]?.value : rule.name
					if (typeof name === 'string') {
						const v = rule.value
						let resolved: unknown
						if (typeof v?.toCSS === 'function') {
							resolved = v.toCSS({})
						} else if (typeof v?.value === 'string' || typeof v?.value === 'number') {
							resolved = v.value
						} else {
							resolved = v
						}
						declarations[name] = String(resolved)
					}
				}
			}
			for (const sel of mySelectors) {
				into.set(sel, { ...(into.get(sel) ?? {}), ...declarations })
			}
		}
		for (const child of ruleset.rules ?? []) {
			collectRules(child, into, mySelectors)
		}
		return
	}
	// Other rule-bearing containers descend into their `.rules` body.
	// Inherit the current parent chain — nested rulesets inside @media
	// still need `&` expansion against the enclosing ruleset selector.
	if (node.type === 'Media' || node.type === 'MixinDefinition' || node.type === 'AtRule') {
		for (const child of node.rules ?? []) collectRules(child, into, parentSelectors)
	}
}

/**
 * Expand every LESS child selector in `selectors` against the chain of
 * already-formatted parent selectors. For each parent compound, a new
 * selector is produced by substituting `&` with that parent. The first
 * `&` element absorbs into the prefix; subsequent ones are appended with
 * whatever combinator precedes them.
 *
 * `h1 { &#header { … } }` → parent `h1` × child `[&, #header]` → `h1#header`.
 * `h1 { & p { … } }` → parent `h1` × child `[&, p]` (combinator ` `) → `h1 p`.
 */
function expandLessSelectors(
	selectors: LessSelectorNode[],
	parentSelectors: string[],
): string[] {
	if (selectors.length === 0) return []
	if (parentSelectors.length === 0) {
		// Top-level: no `&` expansion. `&` (if any) becomes itself; in
		// practice the codebase's top-level rules never use it.
		return selectors.map(formatTopLevelSelector)
	}
	return selectors.flatMap((child) => parentSelectors.map((p) => formatWithParent(child, p)))
}

function formatTopLevelSelector(s: LessSelectorNode): string {
	// `+` binds tighter than `??`, so parenthesize to always combine the
	// combinator (if any) with the element value. LESS's parser always
	// populates `combinator.value` (often `''`); without parens the
	// precedence drop would return the combinator string on its own
	// and discard `el.value` entirely.
	return (s.elements ?? []).map((e) => `${e.combinator?.value ?? ''}${e.value ?? ''}`).join('')
}

function formatWithParent(child: LessSelectorNode, parent: string): string {
	const elements: LessElementNode[] = child.elements ?? []
	let result = ''
	let firstConsumed = false
	for (const el of elements) {
		const comb = el.combinator?.value ?? ''
		const isAmp = el.value === '&' || el.value === null
		if (isAmp && !firstConsumed) {
			// Leading `&` (or null element) absorbs into the prefix as
			// the parent compound — no leading combinator, otherwise
			// `h1 { & p { … } }` would serialize as ` h1 p`.
			result = parent
			firstConsumed = true
		} else {
			result += comb + (isAmp ? parent : el.value ?? '')
		}
	}
	return result
}

// ── Selector matching (postcss-selector-parser) ──────────────────

type ParsedCompound = { tag: string | null; ids: string[]; classes: string[] }
type ParsedSelector = {
	/** Compounds in order; `combinatorBefore` is what separates this compound from the previous one (`' '`, `'>'`, `'+'`, `'~'`, or `''`). */
	compounds: Array<{ compound: ParsedCompound; combinatorBefore: string }>
}

function parseCompound(seg: string): ParsedCompound {
	const ast = selectorParser().astSync(seg)
	const sel = ast.first
	if (!sel) return { tag: null, ids: [], classes: [] }
	let tag: string | null = null
	const ids: string[] = []
	const classes: string[] = []
	for (const n of sel.nodes) {
		if (n.type === 'tag') tag = n.value
		else if (n.type === 'id') ids.push(n.value)
		else if (n.type === 'class') classes.push(n.value)
	}
	return { tag, ids, classes }
}

function parseSelectorFull(sel: string): ParsedSelector {
	const ast = selectorParser().astSync(sel)
	const out: ParsedSelector = { compounds: [] }
	if (!ast.first) return out
	let current: ParsedCompound = { tag: null, ids: [], classes: [] }
	let combinator = ''
	for (const n of (ast.first as any).nodes) {
		if (n.type === 'tag') {
			flushCompound(out, current, combinator)
			current = { tag: n.value, ids: [], classes: [] }
			combinator = ' '
		} else if (n.type === 'id') {
			current.ids.push(n.value)
		} else if (n.type === 'class') {
			current.classes.push(n.value)
		} else if (n.type === 'combinator') {
			flushCompound(out, current, combinator)
			current = { tag: null, ids: [], classes: [] }
			combinator = n.value
		}
		// attribute / pseudo not consumed by the matcher yet.
	}
	flushCompound(out, current, combinator)
	return out
}

function flushCompound(
	out: ParsedSelector,
	c: ParsedCompound,
	combinator: string,
): void {
	if (c.tag === null && c.ids.length === 0 && c.classes.length === 0) return
	out.compounds.push({ compound: c, combinatorBefore: combinator })
}

function compoundMatches(c: ParsedCompound, seg: ParsedCompound): boolean {
	// Strict-equality match: compound tag/ids/classes must equal the
	// segment's exactly. Without strictness, an element-only `h1 { … }`
	// LESS rule would apply to `<h1 id="header">` because `h1` is a
	// subset of `h1#header` (the segment has extra ids the compound
	// doesn't constrain). The pre-existing layout baseline relied on
	// that asymmetry: the nested `&#header` rule is what styles the
	// header element, not the parent `h1` rule. Preserve the baseline
	// for all other slides and let the nested rule supply margin only.
	if (c.tag !== null && c.tag !== '*' && c.tag !== seg.tag) return false
	if (c.ids.length !== seg.ids.length) return false
	for (const id of c.ids) if (!seg.ids.includes(id)) return false
	if (c.classes.length !== seg.classes.length) return false
	for (const cls of c.classes) if (!seg.classes.includes(cls)) return false
	return true
}

function selectorMatchesPath(sel: string, segments: ParsedCompound[]): boolean {
	if (segments.length === 0) return false
	const parsed = parseSelectorFull(sel)
	if (parsed.compounds.length === 0) return false
	// Try every starting position: a selector can match a subtree anchored
	// at any path segment (descendant semantics for the leading compound).
	for (let start = 0; start < segments.length; start++) {
		if (
			compoundMatches(parsed.compounds[0].compound, segments[start]) &&
			matchRest(parsed.compounds, 1, segments, start + 1)
		) {
			return true
		}
	}
	return false
}

function matchRest(
	compounds: ParsedSelector['compounds'],
	idx: number,
	segments: ParsedCompound[],
	segStart: number,
): boolean {
	if (idx >= compounds.length) return true
	const comb = compounds[idx].combinatorBefore
	const c = compounds[idx].compound
	// `>` and `+` are immediate-next; descendant (` ` or ``) accepts any later.
	if (comb === '>' || comb === '+') {
		if (segStart >= segments.length) return false
		if (!compoundMatches(c, segments[segStart])) return false
		return matchRest(compounds, idx + 1, segments, segStart + 1)
	}
	for (let i = segStart; i < segments.length; i++) {
		if (compoundMatches(c, segments[i]) && matchRest(compounds, idx + 1, segments, i + 1)) {
			return true
		}
	}
	return false
}

function resolveStyles(styles: Styles, path: string[]): CssDeclarations {
	const out: CssDeclarations = {}
	const segments = path.map(parseCompound)
	for (const sel of styles.keys()) {
		if (selectorMatchesPath(sel, segments)) Object.assign(out, styles.get(sel)!)
	}
	return out
}

// ── Layout: grid ────────────────────────────────────────────────

type Cell = { x: number; y: number; width: number; height: number }

function gridCells(count: number, bounds: readonly [number, number]): Cell[] {
	if (count === 0) return []
	const cols = Math.ceil(Math.sqrt(count))
	const rows = Math.ceil(count / cols)
	const cellW = bounds[0] / cols
	const cellH = bounds[1] / rows
	const cells: Cell[] = []
	for (let i = 0; i < count; i++) {
		const col = i % cols
		const row = Math.floor(i / cols)
		cells.push({ x: col * cellW, y: row * cellH, width: cellW, height: cellH })
	}
	return cells
}

// text_display's visible face sits ~0.5 blocks in front of the entity's NBT
// z (towards the viewer). Push NBT z back so the visual offset becomes the
// desired 0.015625 (1/64) blocks in front of the wall.
const Z_VISUAL_OFFSET = 0.015625

// ── Text element styling ────────────────────────────────────────

const TEXT_TYPES = new Set(['h1', 'h2', 'p'])

function isTextType(t: any): boolean {
	return TEXT_TYPES.has(String(t))
}

function defaultFontPx(type: string): number {
	switch (type) {
		case 'h1': return 32
		case 'h2': return 24
		default: return 16 // p and unknown
	}
}

function buildTextJson(content: string, declarations: Record<string, string>, type: string): SymbolEntity['text_display']['text'] {
	const out: SymbolEntity['text_display']['text'] = { text: content }
	if (declarations.color) out.color = declarations.color as `#${string}`
	if (declarations.bold === 'true') out.bold = true
	if (declarations.italic === 'true') out.italic = true
	if (declarations.underline === 'true') out.underlined = true
	if (declarations.strikethrough === 'true') out.strikethrough = true
	if (declarations.obfuscated === 'true') out.obfuscated = true
	if (type === 'h1' || type === 'h2') out.bold = true
	return out
}

function parseColorInt(hex: string): number | undefined {
	const m = hex.trim().match(/^#?([0-9a-fA-F]{6})$/)
	if (!m) return undefined
	return parseInt(m[1], 16)
}

/**
 * Resolve the `margin` shorthand into vertical-only meters. Supports 1–4
 * value forms (e.g. `2vh`, `2vh 0`, `2vh 0 1vh`, `2vh 0 1vh 0`). Longhand
 * `margin-top` / `margin-bottom` override the shorthand. Left/right are
 * discarded — the scene center-anchors every cell on x.
 */
function parseMarginBox(
	decs: CssDeclarations,
	sceneH: number,
): { top: number; bottom: number } {
	let top = 0
	let right = 0
	let bottom = 0
	let left = 0
	const shorthand = decs.margin
	if (typeof shorthand === 'string' && shorthand.trim()) {
		const parts = shorthand.trim().split(/\s+/)
		const vals = parts.map((p) => parseLength(p, sceneH)?.meters ?? 0)
		if (vals.length === 1) {
			top = right = bottom = left = vals[0]
		} else if (vals.length === 2) {
			top = bottom = vals[0]
			right = left = vals[1]
		} else if (vals.length === 3) {
			top = vals[0]
			right = left = vals[1]
			bottom = vals[2]
		} else if (vals.length >= 4) {
			top = vals[0]
			right = vals[1]
			bottom = vals[2]
			left = vals[3]
		}
	}
	const tOverride = parseLength(decs['margin-top'] ?? '', sceneH)?.meters
	const bOverride = parseLength(decs['margin-bottom'] ?? '', sceneH)?.meters
	if (tOverride !== undefined) top = tOverride
	if (bOverride !== undefined) bottom = bOverride
	return { top, bottom }
}

// ── Entity summon (shared by mount + rerender) ──────────────────

/**
 * Emit `summon text_display ...` commands for every visible text element
 * in `visible`. Must be called inside an MCFunction callback — the
 * commands attach to whichever MCFunction is currently active.
 *
 * `extraTags` is added on top of `SCENE_TAG`.
 * `initialOpacity` (if set) seeds `text_opacity` so the slide can start
 * hidden without a follow-up hide pass (0 = invisible, -1 = fully opaque).
 */
function summonVisibleElements(
	visible: NodeWithPath[],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	extraTags: (`${any}${string}` | LabelClass)[],
	initialOpacity?: number,
): void {
	// First pass: compute per-element layout (text properties, scale, wrap
	// → lines, cell height). Doing this ahead of placement lets us read
	// stack-level layout properties (`row-gap`, `align-items`) once the
	// total height is known, then position each cell with the right gap
	// and (optionally) center the whole stack in the scene.
	type ElementLayout = {
		node: VNode
		path: string[]
		declarations: CssDeclarations
		type: string
		content: string
		width: ReturnType<typeof parseLength>
		scalePx: number
		textScale: number
		widthCompensation: number
		cellH: number
		marginTop: number
		marginBottom: number
	}
	const elements: ElementLayout[] = visible.map(({ node, path }) => {
		const declarations = resolveStyles(styles, path)
		const type = String(node.type)
		const content = extractText(node.props?.children)

		// font-size → text scale (blocks). width → line_width (text wrap in pixels).
		const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
		const width = parseLength(declarations.width ?? '', sceneW)

		const scalePx = fontSize?.px ?? defaultFontPx(type)
		const textScale = pxToTextScale(scalePx) // NBT `transformation.scale`

		// MC interprets `line_width` in default-font pixels, but the visual
		// width of a rendered line is multiplied by `transformation.scale`.
		// Without compensation, an h1 (scale 6) renders ~2.4× wider per
		// default-font pixel than a p (scale 2.5), so its lines overflow
		// the cell before MC's wrap math triggers. Shrink the wrap budget
		// (used both for pre-computing lines AND for the NBT line_width) by
		// the ratio of this element's scale to the project's `<p>` baseline
		// — so the baseline text wraps at the user-specified width, and any
		// bigger font wraps proportionally sooner.
		const BASELINE_TEXT_SCALE = pxToTextScale(10)
		const widthCompensation = BASELINE_TEXT_SCALE / textScale

		// Default cell height = single-line height for the rendered font
		// size (16 actual px → 1 block, 32 → 2). When the text wraps, we
		// measure the actual visual line count and multiply — otherwise
		// overlapping paragraphs collide. Explicit `height` LESS
		// declaration overrides this entirely.
		const heightLen = parseLength(declarations.height ?? '', sceneH)
		const isBold = type === 'h1' || type === 'h2' || declarations.bold === 'true'
		const wrapWidthPx = (width?.px ?? Number.POSITIVE_INFINITY) * widthCompensation
		const lines = wrapLines(content, wrapWidthPx, isBold)
		const cellH = heightLen?.meters ?? pxToTextLineHeight(scalePx) * lines
		// Vertical margins only — text_display is center-anchored on x so
		// left/right never affect the rendered scene.
		const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)
		return {
			node,
			path,
			declarations,
			type,
			content,
			width,
			scalePx,
			textScale,
			widthCompensation,
			cellH,
			marginTop,
			marginBottom,
		}
	})

	// Stack-level layout. Inherited by every element via resolveStyles
	// (the parent selector `#grid` lands on each child's resolved
	// declarations), so reading the first element is enough for the
	// single-stack case this codebase uses. If a slide ever nests
	// differently-stacked groups, this needs to split per parent.
	const stackDecs = elements[0]?.declarations ?? {}
	const rowGap = parseLength(stackDecs['row-gap'] ?? '', sceneH)?.meters ?? 0
	const alignItems = stackDecs['align-items']
	// Include per-element vertical margins in total height so
	// `align-items: center` balances the visual stack correctly.
	const totalH = elements.reduce(
		(sum, el, i) =>
			sum +
			el.marginTop +
			el.cellH +
			(i < elements.length - 1 ? rowGap + el.marginBottom : 0),
		0,
	)
	let accY =
		alignItems === 'center' ? (sceneH + totalH + 1) / 2 : sceneH

	for (let i = 0; i < elements.length; i++) {
		const el = elements[i]
		// Per-element top margin lands as extra space above the cell.
		accY -= el.marginTop
		accY -= el.cellH
		const cell: Cell = { x: 0, y: accY, width: sceneW, height: el.cellH }

		// Entity anchored at cell bottom; text_display renders the glyphs extending
		// upward from the entity position, so the text quad fills the cell exactly
		// when the entity sits at the cell's bottom edge. x lands on a half-block
		// center: with an even scene width the cell midpoint is an integer (block
		// boundary), so we nudge by 0.5 to keep the billboard centered on a real
		// block. Odd scene widths already land on a half-block and need no offset.
		const z = origin[2] + Z_VISUAL_OFFSET
		const x = origin[0] + cell.width / 2
		const y = origin[1] + cell.y - el.cellH + (el.cellH - 1)

		const scale = NBT.float(el.textScale)

		const nbt: SymbolEntity['text_display'] = {
			Tags: [SCENE_TAG, ...extraTags],
			text: buildTextJson(el.content, el.declarations, el.type),
			transformation: {
				scale: [scale, scale, scale],
				translation: NBT.float([0, 0, 0]),
				left_rotation: NBT.float([0, 0, 0, 1]),
				right_rotation: NBT.float([0, 0, 0, 1]),
			},
		}

		const bg = el.declarations.background ? parseColorInt(el.declarations.background) : undefined
		if (bg !== undefined) nbt.background = NBT.int(bg)
		if (el.width !== undefined) nbt.line_width = NBT.int(Math.round(el.width.px * el.widthCompensation))
		else if (el.declarations['line-width']) nbt.line_width = NBT.int(parseInt(el.declarations['line-width']))
		if (el.declarations.shadow === 'true') nbt.shadow = true
		if (el.declarations['see-through'] === 'true') nbt.see_through = true
		if (initialOpacity !== undefined) {
			nbt.text_opacity = NBT.int(initialOpacity)
		} else if (el.declarations.opacity) {
			nbt.text_opacity = NBT.int(Math.round((parseFloat(el.declarations.opacity) / 100) * 255) - 256)
		}

		summon(
			'text_display',
			// :mojank:
			`${x}${Number.isInteger(x) ? '.0' : ''} ${y}${Number.isInteger(y) ? '.0' : ''} ${z}${Number.isInteger(z) ? '.0' : ''}`,
			nbt,
		)

		// Subtract row-gap + this element's bottom margin before the next
		// cell. The next iteration's `marginTop` lands on top of that, so
		// the gap between cells becomes `rowGap + marginBottom[i] +
		// marginTop[i+1]`. The last cell's bottom margin is intentionally
		// dropped — no trailing space below the slide's last element.
		if (i < elements.length - 1) accY -= rowGap + el.marginBottom
	}
}

/** Collect LESS source out of `<style>` elements across every tree. */
function collectLess(trees: VNode[]): string {
	return trees
		.flatMap((t) => flatWalk(t))
		.filter(({ node }) => node.type === 'style')
		.map(({ node }) => {
			if (typeof node.props?.source === 'string') return node.props.source
			return extractText(node.props?.children)
		})
		.filter(Boolean)
		.join('\n')
}

// ── Single-tree render ──────────────────────────────────────────

export async function render(tree: VNode, options: RenderOptions): Promise<Scene> {
	await loadFontMetrics()
	const elements = flatWalk(tree)

	const lessSource = collectLess([tree])
	const styles = await compileStyles(lessSource)
	const visible = elements.filter(({ node }) => isTextType(node.type))

	const mount = MCFunction('presentation/mount', () => {
		summonVisibleElements(visible, styles, options.bounds[0], options.bounds[1], options.origin, [])
	})

	const tick = MCFunction('presentation/tick', () => {
		// no-op
	}, { runOnTick: true })

	const unmount = MCFunction('presentation/unmount', () => {
		killSceneEntities(options.bounds, options.origin)
	})

	return { mount, tick, unmount }
}

// ── Multi-slide render ──────────────────────────────────────────

/**
 * Multi-slide mode. Each tree in `trees` becomes one slide: all of its
 * text entities are summoned at mount (hidden) and tagged `slide_N`. The
 * returned `SlideScene` exposes per-slide show/hide/setSlide MCFunctions
 * and a `rerenderSlide` factory that re-summons a slide from a fresh
 * JSX tree — so index.tsx (or any downstream caller) can drive the show
 * however it wants. The auto-advance loop runs as a sync MCFunction that
 * uses `sleep()` between transitions — Sandstone splits the function
 * at each sleep into chained child MCFunctions during generation.
 */
export async function renderSlides(
	trees: VNode[],
	options: RenderOptions,
	timing?: SlidesTiming,
): Promise<SlideScene> {
	if (trees.length === 0) throw new Error('renderSlides: at least one slide required')

	await loadFontMetrics()

	const totalSlides = trees.length
	const sceneW = options.bounds[0]
	const sceneH = options.bounds[1]

	// Compute display duration per slide: words/wpm + buffer, clamped.
	// Use a flatWalk + extractText to gather every text node's content
	// into a single string per slide — word count drives the duration.
	const slideTexts = trees.map((t) =>
		flatWalk(t)
			.map(({ node }) => extractText(node.props?.children))
			.join(' '),
	)
	const durations = computeDurationsSeconds(slideTexts, timing)

	const styles = await compileStyles(collectLess(trees))

	// Precompute visible elements so mount + rerender don't pay the
	// flatWalk cost again at the call site.
	const slideVisibles: NodeWithPath[][] = trees.map((t) =>
		flatWalk(t).filter(({ node }) => isTextType(node.type)),
	)

	/**
	 * Return an `execute` command with `.positioned()` already applied, so
	 * the caller can chain further subcommands (`.as(...)`, `.run...`) onto
	 * the same node. Keeps `isSingleExecute = true`, so Sandstone emits a
	 * single inline command rather than splitting into a child MCFunction.
	 */
	function withinSceneVolume(): ExecuteCommand<false> {
		return execute.positioned([options.origin[0], options.origin[1], options.origin[2] - 1])
	}

	// ── Per-slide show / hide ────────────────────────────────────
	const showSlide: MCFunctionClass<undefined, undefined>[] = []
	const hideSlide: MCFunctionClass<undefined, undefined>[] = []
	for (let s = 0; s < totalSlides; s++) {
		const tag = slideTag(s)
		showSlide.push(
			MCFunction(`presentation/slides/show/${s}`, () =>
				withinSceneVolume()
					.as(sceneEntitiesInBounds(options.bounds, tag))
					.run.data.modify.entity('@s', 'text_opacity')
					.set.value(NBT.int(-1)),
			),
		)
		hideSlide.push(
			MCFunction(`presentation/slides/hide/${s}`, () =>
				withinSceneVolume()
					.as(sceneEntitiesInBounds(options.bounds, tag))
					.run.data.modify.entity('@s', 'text_opacity')
					.set.value(NBT.int(0)),
			),
		)
	}

	// setSlide(i): hide every slide, then show i. Built per-index so
	// callers can reference them as static MCFunction references.
	const setSlideFns: MCFunctionClass<undefined, undefined>[] = []
	for (let i = 0; i < totalSlides; i++) {
		const index = i
		setSlideFns.push(
			MCFunction(`presentation/slides/set/${index}`, () => {
				for (let s = 0; s < totalSlides; s++) {
					if (s !== index) hideSlide[s]()
				}
				showSlide[index]()
			}),
		)
	}
	const setSlide = (index: number): MCFunctionClass<undefined, undefined> => {
		if (index < 0 || index >= totalSlides) {
			throw new Error(`setSlide: index ${index} out of range (0..${totalSlides - 1})`)
		}
		return setSlideFns[index]
	}

	// rerenderSlide(i, tree): kill the slide's existing entities, then
	// re-summon from `tree`. The new slide starts hidden — caller is
	// expected to call setSlide(i) (or showSlide(i)) to reveal it.
	const rerenderSlide = (
		index: number,
		tree: VNode,
	): MCFunctionClass<undefined, undefined> => {
		if (index < 0 || index >= totalSlides) {
			throw new Error(`rerenderSlide: index ${index} out of range (0..${totalSlides - 1})`)
		}
		const visible = flatWalk(tree).filter(({ node }) => isTextType(node.type))
		return MCFunction(`presentation/slides/rerender/${index}`, () => {
			withinSceneVolume().run.kill(sceneEntitiesInBounds(options.bounds, slideTag(index)))
			summonVisibleElements(
				visible,
				styles,
				sceneW,
				sceneH,
				options.origin,
				[slideTag(index)],
				0,
			)
		})
	}

	// ── Auto-advance loop ────────────────────────────────────────
	// Sync MCFunction that walks the slides with sleep() between them.
	// Sandstone splits the body at each sleep into chained __sleep child
	// MCFunctions, then reschedules the whole loop from the last segment.
	// No async/await needed — sleep() works in sync contexts too.
	// Tracks the currently-visible slide in `presentation.slide_idx#current`
	// so `nextSlide` knows where to advance from.
	const slideIdx = Objective.create('presentation.slide_idx', 'dummy')
	const currentSlide = slideIdx('#current')

	const slideLoop = MCFunction('presentation/slides/loop', () => {
		for (let s = 0; s < totalSlides; s++) {
			currentSlide.set(s)
			setSlideFns[s]()
			sleep(`${durations[s]}s`)
		}
		// After the last slide's sleep, schedule a fresh loop run.
		schedule.function(slideLoop, '1t', 'replace')
	})

	// nextSlide: cancel the auto-advance loop and step forward one slide
	// from the current index. The cancel block mirrors `unmount`'s schedule
	// teardown so the loop + every pending __sleep segment gets cleared.
	// After unmount+mount the auto-advance animation runs again from 0
	// (mount resets currentSlide to -1, slideLoop then sets it to 0 first).
	const nextSlide = MCFunction('presentation/slides/next', () => {
		const loopName = slideLoop.name
		schedule.clear(loopName)
		schedule.clear(`${loopName}/schedule`)
		for (let i = 1; i <= totalSlides; i++) {
			schedule.clear(`${loopName}/${i === 1 ? '__sleep' : `__sleep${i}`}`)
		}
		currentSlide.add(1)
		_.if(currentSlide.greaterThanOrEqualTo(totalSlides), () => {
			currentSlide.set(0)
		})
		for (let s = 0; s < totalSlides; s++) {
			hideSlide[s]()
		}
		for (let s = 0; s < totalSlides; s++) {
			_.if(currentSlide.equalTo(s), () => {
				showSlide[s]()
			})
		}
	})

	// ── Mount: spawn every slide hidden, then kick the loop ──────
	const mount = MCFunction('presentation/mount', () => {
		// Reset the visible-slide tracker so the first nextSlide call after
		// mount advances from a clean state (-1 + 1 = slide 0).
		currentSlide.set(-1)
		for (let s = 0; s < totalSlides; s++) {
			summonVisibleElements(
				slideVisibles[s],
				styles,
				sceneW,
				sceneH,
				options.origin,
				[slideTag(s)],
				0, // start hidden
			)
		}
		// 1t delay so the spawn packets process before the first show.
		schedule.function(slideLoop, '1t', 'replace')
	})

	// tick + unmount are simple + always present.
	const tick = MCFunction('presentation/tick', () => {}, { runOnTick: true })
	const unmount = MCFunction('presentation/unmount', () => {
		// Cancel every pending run of the auto-advance loop — the main
		// entry, its sleep-segment chain (`__sleep`, `__sleep2`, …), and
		// the `loop/schedule` wrapper that restarts it — otherwise a
		// pending segment will fire after teardown and re-summon entities.
		const loopName = slideLoop.name
		schedule.clear(loopName)
		schedule.clear(`${loopName}/schedule`)
		for (let i = 1; i <= totalSlides; i++) {
			schedule.clear(`${loopName}/${i === 1 ? '__sleep' : `__sleep${i}`}`)
		}
		withinSceneVolume().run.kill(sceneEntitiesInBounds(options.bounds))
	})

	return {
		mount,
		tick,
		unmount,
		showSlide,
		hideSlide,
		setSlide,
		rerenderSlide,
		nextSlide,
		slideLoop,
		durations,
		totalSlides,
	}
}
