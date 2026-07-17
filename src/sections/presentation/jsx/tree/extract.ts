// Text + code-source extraction from a JSX children subtree.

import type { StyledSegment, VNode } from '../render'
import { SNIPPET_END, SNIPPET_START, isVNode } from './walk'

/** Font id applied to inline `…` spans. */
export const INLINE_CODE_FONT = 'sandstone_summit_booth:monospace'

/** Default text colour for inline `` `code` `` spans. */
export const DEFAULT_INLINE_CODE_COLOR = '#9e9e9e' as const

/** Default background colour stored for inline `` `code` `` spans. */
export const DEFAULT_INLINE_CODE_BG = '#2d2d2d' as const

// Recursively extract a plain string from a children tree: strings,
// numbers, function-toString, nested VNodes (recurse on their children),
// arrays joined together. Voids false / null.
export function extractText(children: any): string {
	if (children == null || children === false) return ''
	if (typeof children === 'string' || typeof children === 'number') return String(children)
	if (typeof children === 'function') return codeSourceFromFunction(children)
	if (isVNode(children)) return extractText(children.props?.children)
	if (Array.isArray(children)) return children.map(extractText).join('')
	return ''
}

// Pull the body of an arrow / regular function back out as a string.
// Strips the `() => { … }` wrapper, dedents the body, trims leading /
// trailing blank lines. Lets users keep code snippets type-checked.
export function codeSourceFromFunction(fn: Function): string {
	const src = fn.toString()
	const open = src.indexOf('{')
	const close = src.lastIndexOf('}')
	if (open === -1 || close === -1 || close <= open) return src
	let body = src.slice(open + 1, close)
	body = dedentBlock(body)
	body = body.replace(/^\n+/, '').replace(/\n[ \t]*$/, '')
	return body
}

// Remove the longest common leading whitespace from every non-blank line.
export function dedentBlock(s: string): string {
	const lines = s.split('\n')
	let common: number | null = null
	for (const line of lines) {
		if (!line.trim()) continue
		const lead = line.match(/^[ \t]*/)?.[0].length ?? 0
		if (common === null) common = lead
		else common = Math.min(common, lead)
		if (common === 0) break
	}
	if (!common) return s
	return lines.map((l) => l.slice(common!)).join('\n')
}

// Resolve a `<code>` element's source. `src` prop (Bun `with { type: 'text' }`)
// wins. Otherwise children can be a string, a function, or an array of
// any of those (joined). Strips `// == snippet start/end ==` markers
// when present, returning only the lines between them.
//
// After extraction, normalizes indentation so the rendered code fits
// the slide:
//   - Each `\t` becomes 2 spaces (sources are a mix of 4-space indent
//     and tab-indent files).
//   - Each line's leading whitespace count is halved. This shrinks
//     heavily-indented snippets so they fit the half-slide cell.
export function extractCodeSource(props: any): string {
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
	let raw: string
	if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
		const afterStart = src.indexOf('\n', startIdx)
		if (afterStart !== -1) {
			raw = dedentBlock(src.slice(afterStart + 1, endIdx)).replace(/\n+$/, '')
		} else {
			raw = src
		}
	} else {
		raw = src
	}
	// Step 1: convert each tab to 2 spaces (not 4) so we don't undo the
	// halving below by inflating tab widths into 4-space counts.
	// Step 2: per line, count leading whitespace (tab = 2, space = 1) and
	// halve it. Replace the leading run with that many spaces.
	return raw
		.replace(/\t/g, '  ')
		.split('\n')
		.map(halfLeadingIndent)
		.join('\n')
}

// Halve the leading whitespace of a single line. Tabs (`\t`) count as
// 2 columns each (matching the conversion in `extractCodeSource`).
function halfLeadingIndent(line: string): string {
	const match = line.match(/^[ \t]*/)
	if (!match) return line
	const lead = match[0]
	let visual = 0
	for (const c of lead) visual += c === '\t' ? 2 : 1
	const halved = Math.floor(visual / 2)
	return ' '.repeat(halved) + line.slice(lead.length)
}

// ── Inline formatting ────────────────────────────────────────────
//
// Parse Markdown-flavoured inline markers out of a JSX prose string:
//   ***foo***  → bold + italic on "foo"
//   **foo**    → bold on "foo"
//   *foo*      → italic on "foo"
//   `foo`      → monospace gray on "foo"
//
// State machine scans left → right, toggling bold / italic / inCode.
// On every state change the accumulated chars are flushed as a fresh
// StyledSegment so the next segment carries the new style. Order
// matters: `***` is checked first, then `**`, then `*`, so `***foo***`
// parses as one atomic bold+italic span. Inside an open code span
// `*` and `**` and `***` are literal characters (no nesting). An
// unclosed marker stays open — `**foo` renders as bold("foo"), no
// error path.
//
// Marker characters are NEVER emitted into the output text — only the
// chars between them.
//
// `codeColor` and `codeBg` are baked into every `` ` `` segment the
// parser produces; the layout pass reads them off LESS declarations
// and passes them through.

export function parseInlineFormatting(
	s: string,
	codeColor: `#${string}` = DEFAULT_INLINE_CODE_COLOR,
	codeBg: `#${string}` = DEFAULT_INLINE_CODE_BG,
): StyledSegment[] {
	if (!s) return []
	const out: StyledSegment[] = []
	let buf = ''
	let bold = false
	let italic = false
	let inCode = false

	const flush = () => {
		if (buf.length === 0) return
		const seg: StyledSegment = { text: buf }
		if (bold) seg.bold = true
		if (italic) seg.italic = true
		if (inCode) {
			seg.font = INLINE_CODE_FONT
			seg.color = codeColor
			seg.background = codeBg
		}
		out.push(seg)
		buf = ''
	}

	let i = 0
	const n = s.length
	while (i < n) {
		const ch = s[i]
		if (!inCode) {
			// `***` toggles both bold AND italic atomically so `***foo***`
			// doesn't parse as bold-then-italic-on-empty. Checked before
			// `**` to claim the leading two stars.
			if (ch === '*' && s[i + 1] === '*' && s[i + 2] === '*') {
				flush()
				bold = !bold
				italic = !italic
				i += 3
				continue
			}
			if (ch === '*' && s[i + 1] === '*') {
				flush()
				bold = !bold
				i += 2
				continue
			}
			if (ch === '*') {
				flush()
				italic = !italic
				i += 1
				continue
			}
			if (ch === '`') {
				flush()
				inCode = true
				i += 1
				continue
			}
		} else if (ch === '`') {
			// Inside a code span: only the closing backtick is special —
			// every other char (including `*`) is literal text.
			flush()
			inCode = false
			i += 1
			continue
		}
		buf += ch
		i += 1
	}
	flush()
	return out
}

// Walk a JSX children subtree and apply `parseInlineFormatting` to
// every string-valued leaf. Numbers and string literals are converted
// via String() before parsing. VNodes recurse on their own children;
// arrays are flattened. False / null contribute nothing.
//
// Used by the layout pass to turn a `<p>`'s mixed prose into a
// StyledSegment stream that the segment-aware wrap can measure
// correctly across font changes.
export function extractTextAsSegments(
	children: any,
	codeColor: `#${string}` = DEFAULT_INLINE_CODE_COLOR,
	codeBg: `#${string}` = DEFAULT_INLINE_CODE_BG,
): StyledSegment[] {
	if (children == null || children === false) return []
	if (typeof children === 'string') return parseInlineFormatting(children, codeColor, codeBg)
	if (typeof children === 'number') return parseInlineFormatting(String(children), codeColor, codeBg)
	if (typeof children === 'function') return parseInlineFormatting(codeSourceFromFunction(children), codeColor, codeBg)
	if (isVNode(children)) return extractTextAsSegments(children.props?.children, codeColor, codeBg)
	if (Array.isArray(children)) {
		const out: StyledSegment[] = []
		for (const c of children) out.push(...extractTextAsSegments(c, codeColor, codeBg))
		return out
	}
	return []
}

// True when a `StyledSegment[]` would be rendered differently than a
// single-string pass — i.e. it has more than one segment, or its single
// segment carries a font / bold / italic / color override. Callers can
// short-circuit the segment path when this returns false and emit the
// existing string-based entity.
export function isFormattedSegments(segs: StyledSegment[]): boolean {
	if (segs.length !== 1) return true
	const s = segs[0]
	return Boolean(s.bold || s.italic || s.font || s.color || s.background)
}