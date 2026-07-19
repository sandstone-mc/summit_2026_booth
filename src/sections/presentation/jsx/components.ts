// JSX element prop types + the JSX IntrinsicElements declarations.
// Component classes are exported from `components/<type>/<type>-component.ts`.
// The JSX runtime (jsx-runtime.ts) instantiates the right class for each
// intrinsic type string — the class instance IS the VNode.

import { TextureClass } from 'sandstone'

export type CommonProps = {
	class?: string
	id?: string
	children?: any
}

export type DivProps = CommonProps
export type PProps = CommonProps
export type H1Props = CommonProps
export type H2Props = CommonProps
export type H3Props = CommonProps
export type CenterProps = CommonProps
export type StyleProps = { children?: string; source?: string }

export type CodeProps = CommonProps & {
	lang?: string
	src?: string
	'line-numbers'?: boolean
	scrolling?: boolean
	'side-padding'?: [number, number]
	/** Ticks per scroll chunk. Default 4 (≈0.2s @ 20tps). */
	'ticks-per-chunk'?: number
}

export type ExplorerProps = CommonProps & {
	root: string
	width?: string
	'path-start'?: number
	scrolling?: boolean
	'side-padding'?: [number, number]
	'no-dash'?: boolean
	/** Ticks per scroll chunk. Default 4 (≈0.2s @ 20tps). */
	'ticks-per-chunk'?: number
}

export type ImgProps = CommonProps & {
	src: string | TextureClass<any>
	height?: string
	width?: string
}

export type AutocompleteProps = CommonProps & {
	width?: string
	height?: string
	lang?: string
	source?: string
	'line-numbers'?: boolean
	'side-padding'?: [number, number]
	'intellisense-entity-stage'?: number
	'intellisense-nbt-stage'?: number
}

declare global {
	namespace JSX {
		interface IntrinsicElements {
			div: DivProps
			p: PProps
			h1: H1Props
			h2: H2Props
			h3: H3Props
			center: CenterProps
			style: StyleProps
			code: CodeProps
			img: ImgProps
			explorer: ExplorerProps
			autocomplete: AutocompleteProps
		}
	}
}