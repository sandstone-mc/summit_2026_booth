import { TextureClass } from 'sandstone'
import { jsx } from './jsx-runtime'
import type { VNode } from './render'

export type CommonProps = {
	class?: string
	id?: string
	children?: any
}

export type DivProps = CommonProps
export type PProps = CommonProps
export type H1Props = CommonProps
export type H2Props = CommonProps
export type CenterProps = CommonProps
export type StyleProps = { children?: string; source?: string }

/**
 * Source of the code block's text. `src` is preferred — pair it with
 * Bun's `import x from './file' with { type: 'text' }` to inline the
 * file at build time. Otherwise `children` is accepted as either a
 * string (raw source) or a function (rendered via `Function.toString()`,
 * so you can keep the snippet type-checked inside the slide file).
 *
 * Optional rendering flags:
 *   `lineNumbers` — prepend a right-aligned line-number gutter inside
 *      the bordered box; widths the gutter automatically from the line
 *      count. Default: false.
 *   `scrolling` — when the wrapped content is taller than the cell,
 *      auto-scroll the text upward through the slide over the slide's
 *      duration. Default: false.
 */
export type CodeProps = CommonProps & {
	lang?: string
	src?: string
	'line-numbers'?: boolean
	scrolling?: boolean
}

/**
 * File-tree view of a directory on disk. Reads the directory at build
 * time from `root` (relative to the project root) and renders one row
 * per file / folder inside a bordered monospace box — same border,
 * padding, wrap and scroll pipeline as `<code>`.
 *
 *   `width`       — CSS-style width (e.g. `"20vw"`, `"fit-content"`). Picks
 *      up the same LESS-driven value as `<code>` and `<img>`; falls back
 *      to shrink-to-fit when omitted.
 *   `path-start` — number of leading path components to omit from the
 *      rendered labels. Lets you trim the well-known prefix (e.g. set
 *      to 3 with `root=".sandstone/output/datapack/..."` so the user
 *      sees `data/...` instead of `.sandstone/output/datapack/data/...`).
 *      Folders show their trailing `/`; files do not. Empty-marker files
 *      (`.exists`, `.gitkeep`) are skipped.
 *   `scrolling` — when the rendered tree is taller than the cell,
 *      auto-scroll the rows upward through the slide over its duration.
 */
export type ExplorerProps = CommonProps & {
	root: string
	width?: string
	'path-start'?: number
	scrolling?: boolean
}

/**
 * Image element. `src` is either a Minecraft resource location pointing
 * at a PNG (e.g. `"sandstone_summit_booth:ui/presentation/foo.png"`)
 * or a `TextureClass` from Sandstone — for the latter, the texture's
 * buffer is read directly at build time and the resource location is
 * taken from `TextureClass.toString()`. The renderer auto-creates a
 * flat item model + item_model_definition that references that
 * texture, then displays it on screen via an `item_display` entity.
 * CSS-style `height` / `width` props (e.g. `"30vh"`, `"2vw"`) take
 * precedence over LESS `height` / `width` declarations when set.
 */
export type ImgProps = CommonProps & {
	src: string | TextureClass<any>
	height?: string
	width?: string
}

// Component functions. Identity wrappers around jsx() — exist for explicit
// import + type inference. JSX form <div> compiles to the same jsx('div', ...).
export const div = (props: DivProps): VNode => jsx('div', props, null)
export const p = (props: PProps): VNode => jsx('p', props, null)
export const h1 = (props: H1Props): VNode => jsx('h1', props, null)
export const h2 = (props: H2Props): VNode => jsx('h2', props, null)
export const center = (props: CenterProps): VNode => jsx('center', props, null)
export const style = (props: StyleProps): VNode => {
	const source = props.source ?? (typeof props.children === 'string' ? props.children : '')
	return jsx('style', { source }, null)
}
export const code = (props: CodeProps): VNode => jsx('code', props, null)
export const img = (props: ImgProps): VNode => jsx('img', props, null)
export const explorer = (props: ExplorerProps): VNode => jsx('explorer', props, null)

// Augment JSX intrinsics so <div>, <h1> etc. are type-checked in TSX files
// that import this module (or anything that transitively imports it).
declare global {
	namespace JSX {
		interface IntrinsicElements {
			div: DivProps
			p: PProps
			h1: H1Props
			h2: H2Props
			center: CenterProps
			style: StyleProps
			code: CodeProps
			img: ImgProps
			explorer: ExplorerProps
		}
	}
}
