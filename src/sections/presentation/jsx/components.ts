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
		}
	}
}
