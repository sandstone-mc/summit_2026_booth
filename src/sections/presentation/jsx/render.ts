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
import { DEFAULT_FONT_ID, charWidth, loadFontMetrics, wrapCodeLinesAsArray, wrapLines } from './text-metrics'
import { precomputeHighlights, type Grammar } from './highlight'
import { ContentTag, JSONTextComponent, SymbolEntity } from 'sandstone/arguments';
import { Fragment } from './jsx-runtime'
import { computeDurationsSeconds, type SlidesTiming } from '../slides'
import path from 'node:path'
import sharp from 'sharp'
import { Model, ItemModelDefinition } from 'sandstone'

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

/** Kill every entity tagged with SCENE_TAG. The Summit server's Label-tag
 * optimization makes the selector effectively constant-time, so we don't
 * bother with volume selectors here (and content that overflows below the
 * configured scene bounds is still cleaned up). */
function killSceneEntities(): void {
	execute.run.kill(Selector('@e', { tag: SCENE_TAG }))
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
	if (typeof children === 'function') return codeSourceFromFunction(children)
	if (isVNode(children)) return extractText(children.props?.children)
	if (Array.isArray(children)) return children.map(extractText).join('')
	return ''
}

/**
 * Pull the body of an arrow / regular function back out as a string. Used
 * for `<code>{() => { ... }}</code>` — the user pastes the code as a
 * real function so it stays type-checked, and we toString() it at build
 * time to render. Strips the `() => { … }` wrapper, dedents the body,
 * and trims leading/trailing blank lines so the rendered block starts on
 * the first non-blank character.
 */
function codeSourceFromFunction(fn: Function): string {
	const src = fn.toString()
	const open = src.indexOf('{')
	const close = src.lastIndexOf('}')
	if (open === -1 || close === -1 || close <= open) return src
	let body = src.slice(open + 1, close)
	body = dedentBlock(body)
	body = body.replace(/^\n+/, '').replace(/\n[ \t]*$/, '')
	return body
}

/** Remove the longest common leading whitespace from every non-blank line. */
function dedentBlock(s: string): string {
	const lines = s.split('\n')
	let common: number | null = null
	for (const line of lines) {
		if (!line.trim()) continue
		const m = line.match(/^[ \t]*/)
		const lead = m ? m[0].length : 0
		if (common === null) common = lead
		else common = Math.min(common, lead)
		if (common === 0) break
	}
	if (!common) return s
	return lines.map((l) => l.slice(common!)).join('\n')
}

const SNIPPET_START = '// == snippet start =='
const SNIPPET_END = '// == snippet end =='

/**
 * Resolve a `<code>` element's source text. `src` wins (it points at a
 * file imported with `with { type: 'text' }`, so it's already a string
 * at build time). Otherwise the children can be a string, a function
 * (toString'd + dedented), or already-extracted text.
 *
 * If the resolved source contains `// == snippet start ==` and
 * `// == snippet end ==` markers, only the lines between them (exclusive
 * of the markers) are returned — useful when the imported file has
 * imports / placeholder exports / boilerplate around the actual snippet.
 * The extracted block is dedented against its own leading whitespace.
 */
function extractCodeSource(props: any): string {
	let src: string
	if (typeof props?.src === 'string') {
		src = props.src
	} else {
		const child = props?.children
		if (typeof child === 'string') src = child
		else if (typeof child === 'function') src = codeSourceFromFunction(child)
		else if (Array.isArray(child)) src = child.map(extractCodeSource).join('')
		else return ''
	}

	const startIdx = src.indexOf(SNIPPET_START)
	const endIdx = src.indexOf(SNIPPET_END)
	if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
		const afterStart = src.indexOf('\n', startIdx)
		if (afterStart !== -1) {
			const inner = src.slice(afterStart + 1, endIdx)
			return dedentBlock(inner).replace(/\n+$/, '')
		}
	}
	return src
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

const TEXT_TYPES = new Set(['h1', 'h2', 'p', 'code'])

function isTextType(t: any): boolean {
	return TEXT_TYPES.has(String(t))
}

const IMG_TYPES = new Set(['img'])

function isImgType(t: any): boolean {
	return IMG_TYPES.has(String(t))
}

/** Anything that takes a cell in the slide layout and summons a display entity. */
function isVisibleType(t: any): boolean {
	return isTextType(t) || isImgType(t)
}

// Fallback for <img> with no height / width prop and no LESS height/width:
// 30vh on the scene height. Matches the typical "screenshot" use case.
const DEFAULT_IMG_HEIGHT = '30vh'

/**
 * Resource registration entry for one unique `<img src="…">`. Created at
 * build time by `prepareImgResources` — the renderer references this
 * entry (not the original src) at summon time so the model id and the
 * `minecraft:item_model` component value stay in sync with whatever
 * `Model` / `ItemModelDefinition` ended up generating.
 */
type ImgResource = {
	/** The Minecraft resource location passed in via `src` (with the `.png` suffix). */
	src: string
	/** Width ÷ height of the source texture, read via sharp at build time. */
	aspect: number
	/** Value placed in the `minecraft:item_model` data component on the displayed item. */
	itemModel: string
}

type ImgResourceMap = Map<string, ImgResource>

function defaultFontPx(type: string): number {
	switch (type) {
		case 'h1': return 32
		case 'h2': return 24
		case 'code': return 8
		default: return 16 // p and unknown
	}
}

/**
 * Wrap-aware line count for multi-line code blocks. Each source line is
 * independently word/char-wrapped (long URLs / unbreakable tokens still
 * span multiple visual lines), and blank source lines still count as one
 * visual line each so the rendered height matches what MC's text_display
 * will actually draw.
 */
function wrapCodeLines(text: string, lineWidth: number, bold: boolean, fontId: string): number {
	const lines = text.split('\n')
	let total = 0
	for (const line of lines) {
		total += line.length === 0 ? 1 : wrapLines(line, lineWidth, bold, fontId)
	}
	return Math.max(1, total)
}

/**
 * Decorate a code block's source text with a full thin-text border box:
 * `┌─…─┐` top (with language name embedded before the right corner),
 * `└─…─┘` bottom, `│ … │` on the left/right of every source line. The
 * code is re-wrapped at `lineWidthPx - │ left - │ right` so each
 * bordered line (corners + dashes/bars + content) still fits in MC's
 * wrap width. Border width hugs the longest wrapped code line. Line
 * count goes up by exactly 2 (top + bottom border rows).
 */
/**
 * Decorate a code block's source text with a full thin-text border
 * box (`┌─…─┐` top with language name embedded before the right
 * corner, `└─…─┘` bottom, `│ … │` on the left/right of every source
 * line). Returns an array of styled segments so each piece — corner
 * glyphs, dashes, bars, language tag, and the code itself — can carry
 * its own color in the final text_display NBT. This is the same
 * representation the renderer uses for syntax-highlighted code (one
 * segment per styled run), so adding a highlighter later is a matter
 * of producing more segments for the code portion.
 */

// Default colors for `<code>` borders + language tag. Pick up when the
// caller (i.e. the JSX) didn't pass an explicit color, so an unset
// `<code>` still gets visible border/lang styling instead of collapsing
// into the code color.
const DEFAULT_CODE_BORDER_COLOR = '#6a6a6a' as const
const DEFAULT_CODE_LANG_COLOR = '#4ec9b0' as const

/**
 * Registry of grammars available to `<code>` blocks. Each entry points at
 * the wasm + .scm populated by `scripts/fetch-syntax-parsers.ts`. Add a
 * language by adding a row here AND adding the corresponding fetch entry
 * in that script — both are needed.
 */
const GRAMMARS: Record<string, Grammar> = {
	mcfunction: {
		wasmPath: 'resources/jsx/parser/tree-sitter-mcfunction.wasm',
		queryPath: 'resources/jsx/parser/mcfunction.highlights.scm',
	},
	typescript: {
		wasmPath: 'resources/jsx/parser/tree-sitter-typescript.wasm',
		queryPath: 'resources/jsx/parser/typescript.highlights.scm',
	},
}

/**
 * Pre-computed data the synchronous layout pass consumes per `<code>`
 * element. `codeLines` is the wrapped-out line list (the same array the
 * layout pass would otherwise produce internally); `highlighted` is the
 * tree-sitter tokenization of `codeLines.join('\n')`, so segment slicing
 * against `codeLines[i]` aligns with character offsets in the joined
 * version. `highlighted` is `null` when no grammar is registered for the
 * element's `lang` (or `bun run fetch:parsers` hasn't run yet) — caller
 * keeps the single-color code segment.
 */
export type CodePrecomputed = {
	codeLines: string[]
	highlighted: StyledSegment[] | null
}

type CodePrecomputedMap = WeakMap<VNode, CodePrecomputed>

/**
 * Push `slice` onto `out`, merging with the previous segment when colors
 * match. Keeps the segment list short — adjacent same-color runs (a typical
 * token sequence like `keyword keyword` collapsed into one segment) inflate
 * NBT size for nothing.
 */
function pushSlice(
	out: StyledSegment[],
	slice: string,
	color: `#${string}` | undefined,
): void {
	if (!slice) return
	const last = out[out.length - 1]
	if (last && last.color === color) {
		last.text += slice
		return
	}
	const seg: StyledSegment = { text: slice }
	if (color !== undefined) seg.color = color
	out.push(seg)
}

function wrapCodeWithBorders(
	content: string,
	language: string,
	fontId: string,
	lineWidthPx: number,
	bold: boolean,
	borderColor: `#${string}` | undefined,
	langColor: `#${string}` | undefined,
	codeColor: `#${string}` | undefined,
	precomputed: CodePrecomputed | undefined,
): StyledSegment[] {
	// Use the pre-computed wrap output when available — the wrap depends on
	// `fontId` / `bold` / `innerWidth` derived from the element's LESS
	// declarations, so running it twice (here + in the async pre-compute)
	// would risk drift. When no entry exists (e.g. `lang` missing or grammar
	// not registered), we recompute on the fly for the single-color fallback.
	const codeLines =
		precomputed?.codeLines ?? wrapCodeLinesAsArray(content, Math.max(50, lineWidthPx - 2 * charWidth('│', false, fontId)), bold, fontId)
	const highlighted = precomputed?.highlighted ?? null
	const longestInnerChars = codeLines.reduce((m, l) => Math.max(m, l.length), 0)

	const langPart = language ? `${language}─` : ''
	// Side rows carry one leading + one trailing space of breathing
	// room around the code. Bump the tracked outer width by 2 so the
	// top/bottom dashes + lang tag still align with the wider rows.
	const outerWidth = longestInnerChars + 2
	const dashCount = Math.max(0, outerWidth - langPart.length)

	const out: StyledSegment[] = []

	// Top row: ┌ + dashes + lang tag + ┐. The trailing dash is part of
	// the border (it visually closes the dashed line back to the right
	// corner), not the language tag, so it picks up the border color.
	out.push({ text: `┌${'─'.repeat(dashCount)}`, color: borderColor })
	if (language) {
		out.push({ text: language, color: langColor })
		out.push({ text: '─', color: borderColor })
	}
	out.push({ text: '┐', color: borderColor })

	// Precompute each segment's start position in `codeLines.join('\n')`.
	// Both `codeLines[i]` ranges AND the segment lists live in that joined
	// coordinate space, so each row's content slice lines up with the
	// segments by position. The earlier cursor-walking slice had two bugs:
	// (a) it couldn't handle a segment that straddled a `\n` separator —
	// the joined source has `\n` chars at every codeLines boundary (and at
	// every wrap-continuation), so a token that crossed a separator
	// dumped both halves into one row, breaking the layout; and (b)
	// even with `\n` chars stripped from the slice, the cursor advanced
	// by `take` (which included the separator) so subsequent rows drifted
	// off by one position. Position-based slicing sidesteps both by
	// iterating segments aligned to `[lineStart, lineEnd)`.
	const segs = highlighted && highlighted.length > 0 ? highlighted : null
	const segStarts: number[] | null = segs
		? (() => {
				const starts = new Array<number>(segs.length)
				let acc = 0
				for (let s = 0; s < segs.length; s++) {
					starts[s] = acc
					acc += segs[s].text.length
				}
				return starts
			})()
		: null

	// Middle rows: │ + code + │  (one segment per side, one for code).
	// Each row leads with a `\n` — the first one separates the top
	// border from the first middle row, subsequent ones break between
	// middle rows.
	if (segs && segStarts) {
		let lineStart = 0
		for (let i = 0; i < codeLines.length; i++) {
			const lineLen = codeLines[i].length
			const lineEnd = lineStart + lineLen
			out.push({ text: '\n', color: borderColor })
			out.push({ text: '│ ', color: borderColor })
			// Find first segment whose range overlaps [lineStart, lineEnd).
			let s = 0
			while (s < segs.length && segStarts[s] + segs[s].text.length <= lineStart) s++

			let written = 0
			while (s < segs.length && segStarts[s] < lineEnd) {
				const seg = segs[s]
				const segStart = segStarts[s]
				const segEnd = segStart + seg.text.length
				const fromIdx = Math.max(0, lineStart - segStart)
				const toIdx = Math.min(seg.text.length, lineEnd - segStart)
				if (fromIdx < toIdx) {
					const slice = seg.text.slice(fromIdx, toIdx)
					pushSlice(out, slice, seg.color)
					written += slice.length
				}
				if (segEnd >= lineEnd) break
				s++
			}
			// Highlight segments can end mid-line when the source has trailing
			// whitespace or anything the .scm didn't capture — fall through to
			// `codeColor` for the remainder so the line stays contiguous. The
			// unwalked chars are exactly the tail of `codeLines[i]` from index
			// `written` onward (the leading `written` chars were already pushed
			// from the highlight segments, character-for-character).
			if (written < lineLen) {
				pushSlice(out, codeLines[i].slice(written), codeColor)
				written = lineLen
			}
			if (written < longestInnerChars) {
				pushSlice(out, ' '.repeat(longestInnerChars - written), codeColor)
			}
			out.push({ text: ' │', color: borderColor })
			lineStart = lineEnd + 1 // +1 for the \n separator between wrapped lines
		}
	} else {
		for (let i = 0; i < codeLines.length; i++) {
			out.push({ text: '\n', color: borderColor })
			out.push({ text: '│ ', color: borderColor })
			out.push({ text: codeLines[i].padEnd(longestInnerChars, ' '), color: codeColor })
			out.push({ text: ' │', color: borderColor })
		}
	}

	// Bottom row: └ + dashes + ┘
	out.push({ text: '\n', color: borderColor })
	out.push({ text: `└${'─'.repeat(outerWidth)}┘`, color: borderColor })

	return out
}

/**
 * One styled chunk of text inside a text_display. Multiple segments can
 * be combined to render multi-color content (e.g. syntax-highlighted
 * code) or to give different parts of a bordered block their own color.
 */
export type StyledSegment = {
	text: string
	color?: `#${string}`
	/** When set, overrides the parent declaration's font for this segment only. */
	font?: `${string}:${string}`
}

/**
 * Build the `text` field for a text_display. Accepts either a single
 * string (one color from `declarations.color`) or an array of styled
 * segments (each can carry its own color/font). Segment-level fields
 * fall back to the declaration when absent.
 */
function buildTextJson(
	content: string | StyledSegment[],
	declarations: Record<string, string>,
	type: string,
): SymbolEntity['text_display']['text'] {
	if (Array.isArray(content)) {
		return content.map((seg) => buildSegment(seg, declarations, type)) as SymbolEntity['text_display']['text']
	}
	const out: SymbolEntity['text_display']['text'] = { text: content }
	if (declarations.color) out.color = declarations.color as `#${string}`
	if (declarations.bold === 'true') out.bold = true
	if (declarations.italic === 'true') out.italic = true
	if (declarations.underline === 'true') out.underlined = true
	if (declarations.strikethrough === 'true') out.strikethrough = true
	if (declarations.obfuscated === 'true') out.obfuscated = true
	if (type === 'h1' || type === 'h2') out.bold = true
	if (type === 'code') out.font = 'monocraft:default'
	if (declarations.font) out.font = declarations.font as `${string}:${string}`
	return out
}

function buildSegment(
	seg: StyledSegment,
	declarations: Record<string, string>,
	type: string,
): NonNullable<SymbolEntity['text_display']['text']> {
	const out: NonNullable<SymbolEntity['text_display']['text']> = { text: seg.text }
	const color = seg.color ?? (declarations.color as `#${string}` | undefined)
	if (color) out.color = color
	if (declarations.bold === 'true') out.bold = true
	if (type === 'h1' || type === 'h2') out.bold = true
	const font = seg.font ?? declarations.font
	if (font) out.font = font as `${string}:${string}`
	else if (type === 'code') out.font = 'monocraft:default'
	return out
}

function parseColorInt(hex: string): number | undefined {
	const m = hex.trim().match(/^#?([0-9a-fA-F]{6})$/)
	if (!m) return undefined
	return parseInt(m[1], 16)
}

// TODO: Something is deeply flawed with either how vh is calculated and applied or how its used for margin, eg. set the top margin to 50vh and watch it be half a block off, and try to fix it without breaking 25vh further

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

type ElementLayout = {
	/** `'text'` renders a `text_display`; `'image'` renders an `item_display`. */
	kind: 'text' | 'image'
	node: VNode
	path: string[]
	/**
	 * Resolved LESS declarations of the immediate parent container. Two
	 * siblings of the same parent share this reference — the layout pass
	 * uses reference equality to detect "adjacent siblings" and apply
	 * the parent's `row-gap` between them. Empty object `{}` for root
	 * children (no styled parent).
	 */
	parentStack: CssDeclarations
	declarations: CssDeclarations
	type: string
	content: string
	/** `<code>` only: the bordered render content as styled segments (each part — corner glyphs, dashes, lang tag, code — carries its own color). Falls back to `content` for summon. */
	borderedContent?: StyledSegment[]
	width: ReturnType<typeof parseLength>
	scalePx: number
	textScale: number
	widthCompensation: number
	cellH: number
	cellW: number
	marginTop: number
	marginBottom: number
	// Image-only fields. Undefined for text elements.
	imgSrc?: string
	imgItemModel?: string
	imgAspect?: number
}

/**
 * Emit `summon text_display / item_display ...` commands for every
 * visible element in `visible`. Both text and image elements are
 * supported; their layouts intermix in the same source order so a slide
 * like `<p>...</p><img/><p>...</p>` stacks naturally. Must be called
 * inside an MCFunction callback — the commands attach to whichever
 * MCFunction is currently active.
 *
 * `extraTags` is added on top of `SCENE_TAG`.
 * `initialOpacity` (if set) seeds `text_opacity` (text) or `view_range=0`
 * (image) so the slide can start hidden without a follow-up hide pass.
 */
function summonVisibleElements(
	visible: NodeWithPath[],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	origin: readonly [number, number, number],
	extraTags: (`${any}${string}` | LabelClass)[],
	initialOpacity: number | undefined,
	codePrecomputed: CodePrecomputedMap,
	imgResources: ImgResourceMap,
): void {
	// Memoize the parent's resolved declarations by parent path so
	// siblings share a reference — the layout pass uses reference
	// equality on `parentStack` to detect adjacent siblings and apply
	// the parent's `row-gap` between them.
	const EMPTY_DEC: CssDeclarations = {}
	const parentStackCache = new Map<string, CssDeclarations>()
	const getParentStack = (path: string[]): CssDeclarations => {
		if (path.length === 0) return EMPTY_DEC
		const key = path.slice(0, -1).join(' ')
		let dec = parentStackCache.get(key)
		if (!dec) {
			dec = resolveStyles(styles, path.slice(0, -1))
			parentStackCache.set(key, dec)
		}
		return dec
	}

	// First pass: compute per-element layout. Doing this ahead of
	// placement lets us read stack-level layout properties (`row-gap`,
	// `align-items`) once the total height is known, then position each
	// cell with the right gap and (optionally) center the whole stack in
	// the scene.
	const elements: ElementLayout[] = visible.map(({ node, path }) => {
		const parentStack = getParentStack(path)
		const declarations = resolveStyles(styles, path)
		const type = String(node.type)

		if (isImgType(type)) {
			const src = String(node.props?.src ?? '')
			const resource = imgResources.get(src)
			if (!resource) {
				throw new Error(
					`<img src="${src}"> is missing a registered resource — every src must be prepared via prepareImgResources before render.`,
				)
			}
			// Dimension resolution: explicit `height` prop → LESS `height:`
			// declaration → `DEFAULT_IMG_HEIGHT` fallback. Width defaults
			// to the height × aspect so the image doesn't distort when the
			// user only sets one axis (the most common case for screenshots).
			const heightRaw =
				(typeof node.props?.height === 'string' && node.props.height) ||
				declarations.height ||
				DEFAULT_IMG_HEIGHT
			const widthRaw =
				(typeof node.props?.width === 'string' && node.props.width) || declarations.width || ''
			const heightLen = parseLength(heightRaw, sceneH)
			const explicitWidth = widthRaw ? parseLength(widthRaw, sceneW) : undefined
			const cellH = heightLen?.meters ?? parseLength(DEFAULT_IMG_HEIGHT, sceneH)!.meters
			const cellW = explicitWidth?.meters ?? cellH * resource.aspect
			const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)
			return {
				kind: 'image',
				node,
				path,
				parentStack,
				declarations,
				type,
				content: '',
				width: undefined,
				scalePx: 0,
				textScale: 0,
				widthCompensation: 1,
				cellH,
				cellW,
				marginTop,
				marginBottom,
				imgSrc: src,
				imgItemModel: resource.itemModel,
				imgAspect: resource.aspect,
			}
		}

		// Text element path (unchanged). `<code>` resolves its source
		// separately: `src` prop, function child (toString'd), or a plain
		// string. Other element types just walk their child tree.
		const content = type === 'code' ? extractCodeSource(node.props) : extractText(node.props?.children)

		// font-size → text scale (blocks). width → line_width (text wrap in pixels).
		const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
		const width = parseLength(declarations.width ?? '', sceneW)

		const scalePx = fontSize?.px ?? defaultFontPx(type)
		const textScale = pxToTextScale(scalePx) // NBT `transformation.scale`

		// Resolve the rendering font. Default font unless LESS `font` (or
		// the `<code>` default) names one — anything under
		// `resources/resourcepack/assets/<ns>/font/` works because the
		// pre-scan loaded its widths into text-metrics above.
		const fontId = declarations.font ?? (type === 'code' ? 'monocraft:default' : DEFAULT_FONT_ID)

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

		// For `<code>`, decorate the source with thin text-based borders
		// (a `─` row above and below, `│ ` on the left of every source
		// line). The language name (from `<code lang="…">`) replaces part
		// of the top border on the right. The wrapped line count grows by
		// exactly 2 (top + bottom border rows), so the cell-height math
		// below automatically picks up the extra rows. The result is an
		// array of styled segments so each piece (corner glyphs, dashes,
		// language tag, code) can carry its own color.
		const codeColor = declarations.color as `#${string}` | undefined
		// Border + language tag default to the code's color when the JSX
		// doesn't pick its own, but for `<code>` blocks specifically we
		// drop in a dim gray border and a saturated tag color so the box
		// reads as code at a glance — the user can still override either
		// via `border-color` / `lang-color` LESS properties.
		const borderColor =
			(declarations['border-color'] as `#${string}` | undefined) ??
			(type === 'code' ? DEFAULT_CODE_BORDER_COLOR : codeColor)
		const langColor =
			(declarations['lang-color'] as `#${string}` | undefined) ??
			(type === 'code' ? DEFAULT_CODE_LANG_COLOR : codeColor)
		// Typed explicitly as `StyledSegment[] | undefined` so the
		// `borderedContent` field on ElementLayout stays narrow. A bare
		// `type === 'code' ? wrapCodeWithBorders(...) : content`
		// conditional would leak `string` into the union (the false
		// branch's `content` is a string) and force a widening cast on
		// the assignment.
		const codeBordered: StyledSegment[] | undefined =
			type === 'code'
				? wrapCodeWithBorders(
						content,
						String(node.props?.lang ?? ''),
						fontId,
						wrapWidthPx,
						isBold,
						borderColor,
						langColor,
						codeColor,
						codePrecomputed.get(node),
					)
				: undefined

		// `<code>` preserves the source's `\n` breaks; other elements treat
		// newlines as whitespace via the standard wrap. Both branches use
		// the element's font for char widths so the layout matches what
		// text_display actually draws. Note we measure against the
		// bordered content for `<code>` so the +2 border rows are included
		// in the cell height.
		const renderText = codeBordered ? codeBordered.map((s) => s.text).join('') : content
		const lines =
			type === 'code'
				? wrapCodeLines(renderText, wrapWidthPx, isBold, fontId)
				: wrapLines(content, wrapWidthPx, isBold, fontId)
		const cellH = heightLen?.meters ?? pxToTextLineHeight(scalePx) * lines
		const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)
		return {
			kind: 'text',
			node,
			path,
			parentStack,
			declarations,
			type,
			content,
			borderedContent: codeBordered,
			width,
			scalePx,
			textScale,
			widthCompensation,
			cellH,
			cellW: sceneW,
			marginTop,
			marginBottom,
		}
	})

	// Per-pair gap between adjacent elements. Composed of:
	//   1. CSS `row-gap` from the parent — only when the two elements are
	//      siblings of the same container (reference equality on
	//      `parentStack` — siblings share a memoized reference). This is
	//      what makes `<div id="grid">` with `row-gap: 2vh` space its
	//      child imgs while leaving unrelated siblings in the root
	//      fragment untouched.
	//   2. Text descender — applies unconditionally when the previous
	//      element is text and the next is non-text. text_display renders
	//      its glyphs extending upward from an entity placed at
	//      `cell.y - 1` (one block BELOW the cell's bottom edge, for
	//      visual breathing room above the next element). That "tail"
	//      sits outside the cell, so the next cell — if it's a non-text
	//      element like an `item_display` whose top anchors at the cell's
	//      top edge — would otherwise overlap the text's tail. Add 1
	//      block of vertical gap to clear it. Text→text pairs are fine
	//      because the next text's own descender is the same shape, so
	//      the cells stack flush.
	const TEXT_DESCENDER = 1
	const gapBetween = (i: number): number => {
		if (i <= 0) return 0
		const prev = elements[i - 1]
		const next = elements[i]
		const textDescender = prev.kind === 'text' && next.kind !== 'text' ? TEXT_DESCENDER : 0
		if (prev.parentStack !== next.parentStack) return textDescender
		const raw = next.parentStack['row-gap']
		const rowGap = raw ? parseLength(raw, sceneH)?.meters ?? 0 : 0
		return rowGap + textDescender
	}

	// `align-items: center` (read from the first element's parent) still
	// centers the whole stack vertically. Most slides don't use it; for
	// the cases that do, it balances the visual stack as before.
	const stackDecs = elements[0]?.parentStack ?? {}
	const alignItems = stackDecs['align-items']

	// Group consecutive elements that share a `grid-auto-flow: row` parent
	// into a single row-flow block. Everything else stays a single-element
	// block (which is the original column-stack layout, our default).
	type Block =
		| { kind: 'element'; el: ElementLayout }
		| { kind: 'row'; parentStack: CssDeclarations; children: ElementLayout[] }
	const blocks: Block[] = []
	for (let i = 0; i < elements.length; ) {
		const el = elements[i]
		if (el.parentStack?.['grid-auto-flow'] === 'row') {
			const children: ElementLayout[] = []
			while (i < elements.length && elements[i].parentStack === el.parentStack) {
				children.push(elements[i])
				i++
			}
			blocks.push({ kind: 'row', parentStack: el.parentStack, children })
		} else {
			blocks.push({ kind: 'element', el })
			i++
		}
	}

	const blockCellH = (b: Block): number =>
		b.kind === 'element' ? b.el.cellH : Math.max(...b.children.map((c) => c.cellH))

	// Gap between two adjacent blocks. Combines the parent's row-gap (only
	// when the two blocks live in the same parent — row-flow blocks expose
	// their container's stack as their parentStack) with the unconditional
	// text-descender buffer that keeps a text tail from overlapping the
	// next block's top.
	const blockGap = (prev: Block, next: Block): number => {
		const prevEl = prev.kind === 'element' ? prev.el : prev.children[prev.children.length - 1]
		const nextEl = next.kind === 'element' ? next.el : next.children[0]
		const textDescender = prevEl.kind === 'text' && nextEl.kind !== 'text' ? TEXT_DESCENDER : 0
		const prevStack = prev.kind === 'element' ? prev.el.parentStack : prev.parentStack
		const nextStack = next.kind === 'element' ? next.el.parentStack : next.parentStack
		const rowGap =
			prevStack === nextStack
				? parseLength(nextStack['row-gap'] ?? '', sceneH)?.meters ?? 0
				: 0
		return rowGap + textDescender
	}

	const totalH = blocks.reduce(
		(sum, b, i) =>
			sum +
			blockCellH(b) +
			(i < blocks.length - 1 ? blockGap(b, blocks[i + 1]) : 0),
		0,
	)
	let accY = alignItems === 'center' ? (sceneH + totalH + 1) / 2 : sceneH

	// Per-element summon helper. `cellY` is the local bottom edge of the
	// element's cell; text uses `cellY - 1` (its "descender" anchor) and
	// images use `cellY + cellH/2` (centered quad).
	const summonElement = (
		el: ElementLayout,
		entityX: number,
		cellY: number,
	): void => {
		const z = origin[2] + Z_VISUAL_OFFSET
		// :mojank: — format floats with `.0` so the NBT parser doesn't choke
		// on integers that need to be parsed as floats by the trailing components.
		const fmt = (v: number) => `${v}${Number.isInteger(v) ? '.0' : ''}`

		if (el.kind === 'text') {
			// Entity anchored at cell bottom; text_display renders the glyphs
			// extending upward from the entity position, so the text quad
			// fills the cell exactly when the entity sits at the cell's bottom
			// edge. y lands half a block above the geometric center of the
			// image-style math above.
			const textY = origin[1] + cellY - 1

			const scale = NBT.float(el.textScale)
			const nbt: SymbolEntity['text_display'] = {
				Tags: [SCENE_TAG, ...extraTags],
				text: buildTextJson(el.borderedContent ?? el.content, el.declarations, el.type),
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
			// `<code>` reads naturally with left-aligned text (like a code
			// editor). LESS `text-align` overrides for any element type.
			let align: 'center' | 'left' | 'right' | undefined
			if (el.type === 'code') align = 'left'
			const ta = el.declarations['text-align']?.toLowerCase().trim()
			if (ta === 'left' || ta === 'right' || ta === 'center') align = ta
			if (align) nbt.alignment = align
			if (initialOpacity !== undefined) {
				nbt.text_opacity = NBT.int(initialOpacity)
			} else if (el.declarations.opacity) {
				nbt.text_opacity = NBT.int(Math.round((parseFloat(el.declarations.opacity) / 100) * 255) - 256)
			}

			summon('text_display', `${fmt(entityX)} ${fmt(textY)} ${fmt(z)}`, nbt)
		} else {
			// Image: `minecraft:paper` as a base item because it's a no-op
			// shape that the `minecraft:item_model` component fully
			// overrides. `item_display: 'fixed'` makes the model render as
			// a 2D billboard regardless of viewer angle. Scale.y =
			// cellH (height in blocks); scale.x = cellW so non-square
			// images keep their aspect when only one dimension is given.
			// `view_range: 0` seeds a hidden state when `initialOpacity`
			// asks for one — text uses `text_opacity`, images use
			// `view_range` because item_display has no opacity field.
			const imgCenterY = origin[1] + cellY + el.cellH / 2
			const imgNbt: SymbolEntity['item_display'] = {
				Tags: [SCENE_TAG, ...extraTags],
				item: {
					id: 'minecraft:paper',
					count: NBT.int(1),
					components: {
						// SNBT keys with `:` must be pre-quoted to dodge the
						// parser treating the colon as a type-tag.
						/* @ts-ignore */
						// TODO: Sandstone bug — unquoted `minecraft:item_model` should work after the fix
						'"minecraft:item_model"': el.imgItemModel!,
					},
				},
				item_display: 'fixed',
				transformation: {
					scale: NBT.float([el.cellW, el.cellH, 1]),
					translation: NBT.float([0, 0, 0]),
					left_rotation: NBT.float([0, 0, 0, 1]),
					right_rotation: NBT.float([0, 0, 0, 1]),
				},
				brightness: { sky: NBT.int(15), block: NBT.int(15) },
			}
			if (initialOpacity === 0) {
				imgNbt.view_range = NBT.float(0.0)
			}
			summon('minecraft:item_display', `${fmt(entityX)} ${fmt(imgCenterY)} ${fmt(z)}`, imgNbt)
		}
	}

	// Layout + summon loop. Two block kinds:
	//   - `element`: a single element placed at `accY` (vertical stacking).
	//   - `row`: a `grid-auto-flow: row` container — placed as a single
	//     cell at `accY`, then its children are laid out horizontally
	//     inside the container using `column-gap` from the parent's
	//     declarations. Each child is vertically centered in the container
	//     (matches `align-items: center` semantics on a row-flow grid).
	for (let bi = 0; bi < blocks.length; bi++) {
		const block = blocks[bi]
		if (block.kind === 'element') {
			const el = block.el
			accY -= el.marginTop
			accY -= el.cellH
			const entityX = origin[0] + sceneW / 2
			summonElement(el, entityX, accY)
			if (bi < blocks.length - 1) {
				accY -= blockGap(block, blocks[bi + 1]) + el.marginBottom
			}
		} else {
			// Row-flow container. The container's outer cell uses
			// `max(child cellH)` for height (the tallest child wins) and
			// `sum(child cellW) + (n-1)*columnGap` for width.
			const columnGap = parseLength(block.parentStack['column-gap'] ?? '', sceneW)?.meters ?? 0

			// `height` on the parent: the container reserves the specified
			// portion of the remaining vertical space (the leftover `accY`
			// at this point in the layout) and anchors to the bottom of it,
			// so e.g. `height: 100%` fills the area below the previous
			// siblings and `height: 50%` takes the bottom 50% of that area.
			// The percent sign is a fraction of remaining; `vh`/`vw`/`px`
			// are absolute (resolved against the scene size). Children are
			// vertically centered within the resulting block via
			// `align-items: center`, which is implicit in our row-flow
			// layout (each child already sits at the container's center y).
			const heightProp = block.parentStack.height
			let containerCellH: number
			let bottomAnchored = false
			if (heightProp) {
				const trimmed = heightProp.trim()
				const pctMatch = trimmed.match(/^(-?\d*\.?\d+)\s*%$/i)
				const heightMeters = pctMatch
					? (parseFloat(pctMatch[1]) / 100) * accY
					: (parseLength(heightProp, sceneH)?.meters ?? 0)
				containerCellH = Math.max(blockCellH(block), heightMeters)
				bottomAnchored = true
			} else {
				containerCellH = blockCellH(block)
			}
			const containerCellW =
				block.children.reduce((sum, c) => sum + c.cellW, 0) +
				Math.max(0, block.children.length - 1) * columnGap

			const firstChild = block.children[0]
			const lastChild = block.children[block.children.length - 1]
			accY -= firstChild.marginTop
			if (bottomAnchored) {
				// The container occupies `[0, containerCellH]` in scene-local
				// coordinates — anchored to the bottom of the remaining space.
				// accY is reset to 0 so any sibling placed after this block
				// starts flush against the container's top edge.
				accY = 0
			} else {
				accY -= containerCellH
			}
			const containerCenterY = accY + containerCellH / 2
			const containerCenterX = origin[0] + sceneW / 2

			// When the row fits in the scene, center the whole group so
			// every child lands symmetrically around the scene's x-axis
			// center (natural for, e.g., two side-by-side screenshots).
			// When it overflows — typically because some sibling carries a
			// hardcoded `width: 95vw` — the group center is meaningless
			// and individual entities drift off-screen. Anchor the middle
			// child to the scene center instead, so the geometric focus
			// of the row stays put and the rest overflow symmetrically.
			let accX: number
			if (containerCellW <= sceneW) {
				accX = containerCenterX - containerCellW / 2
			} else {
				const middleIndex = Math.floor(block.children.length / 2)
				accX = containerCenterX - block.children[middleIndex].cellW / 2
				for (let i = middleIndex - 1; i >= 0; i--) {
					accX -= block.children[i].cellW + columnGap
				}
			}

			for (const child of block.children) {
				const subCellY = containerCenterY - child.cellH / 2
				const childCenterX = accX + child.cellW / 2
				summonElement(child, childCenterX, subCellY)
				accX += child.cellW + columnGap
			}

			if (bi < blocks.length - 1) {
				accY -= blockGap(block, blocks[bi + 1]) + lastChild.marginBottom
			}
		}
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

/**
 * Collect every distinct font ID any element could resolve to. We pull
 * the LESS `font` declaration AND the `<code>` default — anything we
 * might render must be loaded into text-metrics before layout starts,
 * since `wrapLines` throws if asked about an unloaded font.
 */
function collectFonts(trees: VNode[], styles: Styles): Set<string> {
	const out = new Set<string>([DEFAULT_FONT_ID])
	for (const tree of trees) {
		for (const { node, path } of flatWalk(tree)) {
			if (!isTextType(node.type)) continue
			const decs = resolveStyles(styles, path)
			if (decs.font) out.add(decs.font)
			else if (node.type === 'code') out.add('monocraft:default')
		}
	}
	return out
}

/**
 * Walk every visible `<code>` element across `trees`, compute the wrap
 * (matching what `wrapCodeWithBorders` does internally), and pre-tokenize
 * the joined wrapped content via tree-sitter. Returns a `WeakMap` keyed
 * by the code element's VNode so the synchronous layout pass can look up
 * the pre-computed `codeLines` + `highlighted` segments without re-running
 * the wrap or re-parsing.
 *
 * Why pre-tokenize the *joined wrapped content* (not the raw source):
 *   `wrapCodeLinesAsArray` strips `\n` separators between wrapped lines,
 *   so character offsets in the wrapped output don't line up with offsets
 *   in the original source. Re-tokenizing the wrapped version means each
 *   segment's `[start..end)` falls cleanly inside a single wrapped line —
 *   the slice in `wrapCodeWithBorders` walks the wrap output linearly and
 *   pulls each segment into the right visual row.
 */
async function prepareCodeHighlights(
	visiblePerSlide: NodeWithPath[][],
	styles: Styles,
	sceneW: number,
	sceneH: number,
): Promise<CodePrecomputedMap> {
	const map: CodePrecomputedMap = new WeakMap()

	// Collect every (node, source) we need to tokenize. Skip elements
	// without a `lang` (no grammar → falls through to single-color anyway).
	type Entry = { node: VNode; source: string; lang: string; codeLines: string[] }
	const entries: Entry[] = []
	for (const visible of visiblePerSlide) {
		for (const { node, path } of visible) {
			if (node.type !== 'code') continue
			const lang = String(node.props?.lang ?? '')
			if (!lang) continue
			const source = extractCodeSource(node.props)
			if (!source) continue
			const declarations = resolveStyles(styles, path)
			const fontId = declarations.font ?? 'monocraft:default'
			const bold = declarations.bold === 'true'
			const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
			const width = parseLength(declarations.width ?? '', sceneW)
			const scalePx = fontSize?.px ?? defaultFontPx('code')
			const textScale = pxToTextScale(scalePx)
			const BASELINE_TEXT_SCALE = pxToTextScale(10)
			const widthCompensation = BASELINE_TEXT_SCALE / textScale
			const wrapWidthPx = (width?.px ?? Number.POSITIVE_INFINITY) * widthCompensation
			const barW = charWidth('│', false, fontId)
			const innerWidth = Math.max(50, wrapWidthPx - 2 * barW)
			const codeLines = wrapCodeLinesAsArray(source, innerWidth, bold, fontId)
			entries.push({ node, source: codeLines.join('\n'), lang, codeLines })
		}
	}

	const lookup = await precomputeHighlights(GRAMMARS, entries.map((e) => ({ source: e.source, lang: e.lang })))

	for (const entry of entries) {
		const highlighted = lookup(entry.source, entry.lang)
		map.set(entry.node, { codeLines: entry.codeLines, highlighted })
	}
	return map
}

/**
 * Walk every tree, find every `<img src="…">`, and:
 *
 *   1. Derive a stable resource name from the src (everything after the
 *      namespace, with the `.png` stripped). Two imgs with identical
 *      src collapse to one registration.
 *   2. Generate an item model at `assets/<ns>/models/item/<name>.json`
 *      that uses `minecraft:item/generated` and points `layer0` at the
 *      user's texture.
 *   3. Generate an item_model_definition at
 *      `assets/<ns>/items/<name>.json` that selects the model above —
 *      this is what `minecraft:item_model` data components reference.
 *   4. Read the texture's pixel aspect ratio via sharp so the summon
 *      pass can size the billboard without distorting the image when
 *      only one dimension is given.
 *
 * Returns a map from the original src → the metadata the renderer needs
 * to summon a correctly-sized `item_display`. Files missing on disk
 * fall back to a 1:1 aspect with a build-time warning rather than
 * failing the whole render.
 */
async function prepareImgResources(trees: VNode[]): Promise<ImgResourceMap> {
	const seen = new Set<string>()
	const out: ImgResourceMap = new Map()

	const projectRoot = process.cwd()

	for (const tree of trees) {
		for (const { node } of flatWalk(tree)) {
			if (!isImgType(node.type)) continue
			const src = String(node.props?.src ?? '')
			if (!src || seen.has(src)) continue
			seen.add(src)

			const colonIdx = src.indexOf(':')
			if (colonIdx <= 0) {
				console.warn(`[img] src "${src}" is not a resource location (expected "<ns>:<path>"); skipping`)
				continue
			}
			const ns = src.slice(0, colonIdx)
			const texturePath = src.slice(colonIdx + 1)
			const textureNoExt = texturePath.replace(/\.png$/i, '')
			// Slug = texture path sans extension. Slashes are kept; Sandstone's
			// resourceToPath turns them into nested asset directories.
			const slug = textureNoExt

			const filePath = path.join(projectRoot, 'resources', 'resourcepack', 'assets', ns, 'textures', texturePath)
			let aspect = 1
			try {
				const meta = await sharp(filePath).metadata()
				if (meta.width && meta.height) aspect = meta.width / meta.height
			} catch (e: any) {
				console.warn(`[img] failed to read texture ${filePath}: ${e?.message ?? e}; defaulting to 1:1 aspect`)
			}

			Model('item', slug, {
				parent: 'minecraft:item/generated',
				textures: { layer0: `${ns}:${textureNoExt}` },
			})
			ItemModelDefinition(slug, {
				model: {
					type: 'minecraft:model',
					model: `${ns}:item/${slug}`,
				},
			})

			out.set(src, {
				src,
				aspect,
				itemModel: `${ns}:${slug}`,
			})
		}
	}
	return out
}

// ── Single-tree render ──────────────────────────────────────────

export async function render(tree: VNode, options: RenderOptions): Promise<Scene> {
	await loadFontMetrics()
	const elements = flatWalk(tree)

	const lessSource = collectLess([tree])
	const styles = await compileStyles(lessSource)
	await Promise.all([...collectFonts([tree], styles)].map(loadFontMetrics))
	const visible = elements.filter(({ node }) => isVisibleType(node.type))

	// Pre-compute tree-sitter highlights for every `<code>` block. The
	// returned `WeakMap` is captured in `mount`'s closure so the synchronous
	// `summonVisibleElements` call never has to await a parse.
	const codePrecomputed = await prepareCodeHighlights([visible], styles, options.bounds[0], options.bounds[1])

	// Register a `Model` + `ItemModelDefinition` for every distinct `<img>`
	// src so the summon pass can reference them via `minecraft:item_model`.
	const imgResources = await prepareImgResources([tree])

	const mount = MCFunction('presentation/mount', () => {
		summonVisibleElements(visible, styles, options.bounds[0], options.bounds[1], options.origin, [], undefined, codePrecomputed, imgResources)
	})

	const tick = MCFunction('presentation/tick', () => {
		// no-op
	}, { runOnTick: true })

	const unmount = MCFunction('presentation/unmount', () => {
		killSceneEntities()
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
	// Pre-load every font any element could resolve to — wrapLines throws
	// for fonts not loaded yet, and the layout pass runs synchronously.
	await Promise.all([...collectFonts(trees, styles)].map(loadFontMetrics))

	// Precompute visible elements so mount + rerender don't pay the
	// flatWalk cost again at the call site.
	const slideVisibles: NodeWithPath[][] = trees.map((t) =>
		flatWalk(t).filter(({ node }) => isVisibleType(node.type)),
	)

	// Pre-compute tree-sitter highlights for every `<code>` block. The
	// returned `WeakMap` is captured in mount/rerender closures so the
	// synchronous `summonVisibleElements` calls never await a parse.
	const codePrecomputed = await prepareCodeHighlights(slideVisibles, styles, sceneW, sceneH)

	// Register a `Model` + `ItemModelDefinition` for every distinct `<img>`
	// src across all slides so every summon can reference them via
	// `minecraft:item_model`. Deduped by src, so identical images across
	// slides share one registration.
	const imgResources = await prepareImgResources(trees)

	// ── Per-slide show / hide ────────────────────────────────────
	// Pure tag selectors — the Summit server's Label-tag optimization makes
	// these effectively constant-time, and tag-only matching picks up any
	// entity that overflows below the configured scene bounds (where a
	// volume selector would have missed it). Each slide can carry text and
	// image entities; text hides via `text_opacity`, images via
	// `view_range` (item_display has no `text_opacity`, and toggling
	// view_range to 0 makes the entity cull itself out of the render).
	const showSlide: MCFunctionClass<undefined, undefined>[] = []
	const hideSlide: MCFunctionClass<undefined, undefined>[] = []
	for (let s = 0; s < totalSlides; s++) {
		const tag = slideTag(s)
		showSlide.push(
			MCFunction(`presentation/slides/show/${s}`, () => {
				execute.as(Selector('@e', { tag })).run.data.modify
					.entity('@s', 'text_opacity')
					.set.value(NBT.int(-1))
				execute.as(Selector('@e', { tag })).run.data.modify
					.entity('@s', 'view_range')
					.set.value(NBT.float(1.0))
			}),
		)
		hideSlide.push(
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
		const visible = flatWalk(tree).filter(({ node }) => isVisibleType(node.type))
		return MCFunction(`presentation/slides/rerender/${index}`, () => {
			execute.run.kill(Selector('@e', { tag: slideTag(index) }))
			summonVisibleElements(
				visible,
				styles,
				sceneW,
				sceneH,
				options.origin,
				[slideTag(index)],
				0,
				codePrecomputed,
				imgResources,
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
				codePrecomputed,
				imgResources,
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
		killSceneEntities()
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
