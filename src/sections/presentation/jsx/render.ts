import { MCFunction, type MCFunctionClass, summon, kill, abs, Selector, NBT, Label } from 'sandstone'
import { parse as parseLess } from './less'
import type { LessTreeNode, LessRulesetNode, LessSelectorNode, CssDeclarations } from './less'
import { parseLength, pxToTextScale, pxToTextLineHeight } from './length'
import { ContentTag, JSONTextComponent, SymbolEntity } from 'sandstone/arguments';

export type VNode = { type: any; props: any; key: any }
export type RenderOptions = {
	origin: readonly [number, number, number]
	bounds: readonly [number, number] // [width, height] in meters
}
export type Scene = {
	mount: MCFunctionClass<undefined, undefined>
	tick: MCFunctionClass<undefined, undefined>
	unmount: MCFunctionClass<undefined, undefined>
}

const SCENE_TAG = Label('presentation')

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
	collectRules(ast, styles)
	return styles
}

function collectRules(node: LessTreeNode | null | undefined, into: Styles): void {
	if (!node) return
	if (node.type === 'Ruleset') {
		const ruleset: LessRulesetNode = node
		if (Array.isArray(ruleset.selectors)) {
			const selectors = ruleset.selectors.map(formatSelector)
			const declarations: CssDeclarations = {}
			for (const rule of ruleset.rules ?? []) {
				if (rule.type === 'Declaration') {
					// LESS AST: declaration.name is an array of keyword nodes for
					// property declarations, or a bare `@name` string for variable
					// declarations.
					const name = Array.isArray(rule.name) ? rule.name[0]?.value : rule.name
					if (typeof name === 'string') {
						declarations[name] = String(
							rule.value?.value ??
								(typeof rule.value?.toCSS === 'function' ? rule.value.toCSS({}) : null) ??
								rule.value,
						)
					}
				}
			}
			for (const sel of selectors) {
				into.set(sel, { ...(into.get(sel) ?? {}), ...declarations })
			}
		}
		for (const child of ruleset.rules ?? []) {
			collectRules(child, into)
		}
		return
	}
	// Other rule-bearing containers descend into their `.rules` body.
	if (node.type === 'Media' || node.type === 'MixinDefinition' || node.type === 'AtRule') {
		for (const child of node.rules ?? []) collectRules(child, into)
	}
}

function formatSelector(s: LessSelectorNode): string {
	return (s.elements ?? []).map((e) => e.value ?? '&').join('')
}

function resolveStyles(styles: Styles, path: string[]): CssDeclarations {
	const out: CssDeclarations = {}
	for (const sel of styles.keys()) {
		if (path.includes(sel)) Object.assign(out, styles.get(sel)!)
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

// ── Main render ─────────────────────────────────────────────────

export async function render(tree: VNode, options: RenderOptions): Promise<Scene> {
	const elements = flatWalk(tree)

	// Collect LESS source from <style> elements
	const lessSource = elements
		.filter(({ node }) => node.type === 'style')
		.map(({ node }) => {
			if (typeof node.props?.source === 'string') return node.props.source
			return extractText(node.props?.children)
		})
		.filter(Boolean)
		.join('\n')

	const styles = await compileStyles(lessSource)

	// Filter to visible (text) elements only. Containers + style are skipped.
	const visible = elements.filter(({ node }) => isTextType(node.type))

	const mount = MCFunction('presentation/mount', () => {
		const sceneW = options.bounds[0]
		const sceneH = options.bounds[1]

		// Stack top-down: first element sits at top of scene, next below it.
		let accY = sceneH
		for (let i = 0; i < visible.length; i++) {
			const { node, path } = visible[i]
			const declarations = resolveStyles(styles, path)
			const type = String(node.type)
			const content = extractText(node.props?.children)

			// font-size → text scale (blocks). width → line_width (text wrap in pixels).
			const fontSize = parseLength(declarations['font-size'] ?? '', sceneH)
			const width = parseLength(declarations.width ?? '', sceneW)

			const scalePx = fontSize?.px ?? defaultFontPx(type)
			const textScale = pxToTextScale(scalePx) // NBT `transformation.scale`

			// Default cell height matches the rendered text quad: 16px → 1 block,
			// 32px → 2 blocks. Explicit `height` LESS declaration overrides this.
			const heightLen = parseLength(declarations.height ?? '', sceneH)
			const cellH = heightLen?.meters ?? pxToTextLineHeight(scalePx)
			accY -= cellH
			const cell: Cell = { x: 0, y: accY, width: sceneW, height: cellH }

			// Entity anchored at cell bottom; text_display renders the glyphs extending
			// upward from the entity position, so the text quad fills the cell exactly
			// when the entity sits at the cell's bottom edge.
			const z = options.origin[2] + Z_VISUAL_OFFSET
			const x = options.origin[0] + cell.width / 2
			// Offset the entity by cellH blocks down from the cell top (cell.y - cellH is
// the cell's bottom in scene coords, which maps to options.origin[1] + cellH
// world units below the cell top). Text extends cellH blocks from entity.
			const y = options.origin[1] + cell.y - cellH + (cellH - 1)

			const scale = NBT.float(textScale)

			const nbt: SymbolEntity['text_display'] = {
				Tags: [SCENE_TAG],
				text: buildTextJson(content, declarations, type),
				transformation: {
					scale: [scale, scale, scale],
					translation: NBT.float([0, 0, 0]),
					left_rotation: NBT.float([0, 0, 0, 1]),
					right_rotation: NBT.float([0, 0, 0, 1]),
				},
			}

			const bg = declarations.background ? parseColorInt(declarations.background) : undefined
			if (bg !== undefined) nbt.background = NBT.int(bg)
			if (width !== undefined) nbt.line_width = NBT.int(Math.round(width.px))
			else if (declarations['line-width']) nbt.line_width = NBT.int(parseInt(declarations['line-width']))
			if (declarations.shadow === 'true') nbt.shadow = true
			if (declarations['see-through'] === 'true') nbt.see_through = true
			if (declarations.opacity) nbt.text_opacity = NBT.int(Math.round((parseFloat(declarations.opacity) / 100) * 255) - 256)

			summon('text_display', abs(x, y, z), nbt)
		}
	})

	const tick = MCFunction('presentation/tick', () => {
		// TODO: per-tick updates (animations, content refresh)
	}, { runOnTick: true })

	const unmount = MCFunction('presentation/unmount', () => {
		kill(Selector('@e', { tag: SCENE_TAG }))
	})

	return { mount, tick, unmount }
}