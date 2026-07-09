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

	// Top row: ┌ + dashes + lang tag + ┐
	// Top row: ┌ + dashes + lang tag + ┐. The trailing dash is part of
	// the border (it visually closes the dashed line back to the right
	// corner), not the language tag, so it picks up the border color.
	out.push({ text: `┌${'─'.repeat(dashCount)}`, color: borderColor })
	if (language) {
		out.push({ text: language, color: langColor })
		out.push({ text: '─', color: borderColor })
	}
	out.push({ text: '┐', color: borderColor })

	// Middle rows: │ + code + │  (one segment per side, one for code).
	// Each row leads with a `\n` — the first one separates the top
	// border from the first middle row, subsequent ones break between
	// middle rows.
	if (highlighted && highlighted.length > 0) {
		// Slice the highlighted segment list against each wrapped line.
		// `highlighted` corresponds to `codeLines.join('\n')`, so line `i`
		// covers [lineStart..lineEnd) where `lineStart` accounts for the
		// `\n` separators between adjacent wrapped lines:
		//   lineStart_i = Σ(codeLines[0..i-1].length) + i   (+1 per \n)
		// A single token may span two wrapped lines (long identifiers,
		// long URLs, unbreakable runs) — the slice produces two same-color
		// segments, one per line, so color survives the wrap boundary.
		let cursor = 0
		let segIdx = 0
		let segPos = 0
		for (let i = 0; i < codeLines.length; i++) {
			const lineStart = cursor
			const lineEnd = cursor + codeLines[i].length
			out.push({ text: '\n', color: borderColor })
			out.push({ text: '│ ', color: borderColor })
			let written = 0
			while (cursor < lineEnd && segIdx < highlighted.length) {
				const seg = highlighted[segIdx]
				const remaining = seg.text.length - segPos
				const need = lineEnd - cursor
				const take = Math.min(remaining, need)
				pushSlice(out, seg.text.slice(segPos, segPos + take), seg.color)
				written += take
				cursor += take
				segPos += take
				if (segPos >= seg.text.length) {
					segIdx++
					segPos = 0
				}
			}
			// Highlight segments can end mid-line when the source has trailing
			// whitespace or anything the .scm didn't capture — fall through to
			// `codeColor` for the remainder so the line stays contiguous.
			if (cursor < lineEnd) {
				const leftover = codeLines[i].slice(cursor - lineStart)
				pushSlice(out, leftover, codeColor)
				written += leftover.length
				cursor = lineEnd
			}
			if (written < longestInnerChars) {
				pushSlice(out, ' '.repeat(longestInnerChars - written), codeColor)
			}
			out.push({ text: ' │', color: borderColor })
			cursor = lineEnd + 1 // +1 for the \n separator between wrapped lines
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
	node: VNode
	path: string[]
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
	marginTop: number
	marginBottom: number
}

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
	initialOpacity: number | undefined,
	codePrecomputed: CodePrecomputedMap,
): void {
	// First pass: compute per-element layout (text properties, scale, wrap
	// → lines, cell height). Doing this ahead of placement lets us read
	// stack-level layout properties (`row-gap`, `align-items`) once the
	// total height is known, then position each cell with the right gap
	// and (optionally) center the whole stack in the scene.
	const elements: ElementLayout[] = visible.map(({ node, path }) => {
		const declarations = resolveStyles(styles, path)
		const type = String(node.type)
		// `<code>` resolves its source separately: `src` prop, function
		// child (toString'd), or a plain string. Other element types just
		// walk their child tree.
		const content =
			type === 'code'
				? extractCodeSource(node.props)
				: extractText(node.props?.children)

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
		// Vertical margins only — text_display is center-anchored on x so
		// left/right never affect the rendered scene.
		const { top: marginTop, bottom: marginBottom } = parseMarginBox(declarations, sceneH)
		return {
			node,
			path,
			declarations,
			type,
			content,
			borderedContent: codeBordered,
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

// ── Single-tree render ──────────────────────────────────────────

export async function render(tree: VNode, options: RenderOptions): Promise<Scene> {
	await loadFontMetrics()
	const elements = flatWalk(tree)

	const lessSource = collectLess([tree])
	const styles = await compileStyles(lessSource)
	await Promise.all([...collectFonts([tree], styles)].map(loadFontMetrics))
	const visible = elements.filter(({ node }) => isTextType(node.type))

	// Pre-compute tree-sitter highlights for every `<code>` block. The
	// returned `WeakMap` is captured in `mount`'s closure so the synchronous
	// `summonVisibleElements` call never has to await a parse.
	const codePrecomputed = await prepareCodeHighlights([visible], styles, options.bounds[0], options.bounds[1])

	const mount = MCFunction('presentation/mount', () => {
		summonVisibleElements(visible, styles, options.bounds[0], options.bounds[1], options.origin, [], undefined, codePrecomputed)
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
		flatWalk(t).filter(({ node }) => isTextType(node.type)),
	)

	// Pre-compute tree-sitter highlights for every `<code>` block. The
	// returned `WeakMap` is captured in mount/rerender closures so the
	// synchronous `summonVisibleElements` calls never await a parse.
	const codePrecomputed = await prepareCodeHighlights(slideVisibles, styles, sceneW, sceneH)

	// ── Per-slide show / hide ────────────────────────────────────
	// Pure tag selectors — the Summit server's Label-tag optimization makes
	// these effectively constant-time, and tag-only matching picks up any
	// entity that overflows below the configured scene bounds (where a
	// volume selector would have missed it).
	const showSlide: MCFunctionClass<undefined, undefined>[] = []
	const hideSlide: MCFunctionClass<undefined, undefined>[] = []
	for (let s = 0; s < totalSlides; s++) {
		const tag = slideTag(s)
		showSlide.push(
			MCFunction(`presentation/slides/show/${s}`, () =>
				execute.as(Selector('@e', { tag })).run.data.modify
					.entity('@s', 'text_opacity')
					.set.value(NBT.int(-1)),
			),
		)
		hideSlide.push(
			MCFunction(`presentation/slides/hide/${s}`, () =>
				execute.as(Selector('@e', { tag })).run.data.modify
					.entity('@s', 'text_opacity')
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
