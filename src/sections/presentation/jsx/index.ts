// Public surface for the JSX presentation renderer.
//
// Top-level entry: `render(tree, options)` for a single JSX tree or
// `renderSlides(trees, options, timing?)` for a multi-slide scene.
// The rest of this index re-exports the props types + JSX components
// so consumers can `import { h1, code, img } from '@/jsx'` and TSX
// infers everything via the augmented JSX.IntrinsicElements.

export { render, renderSlides } from './render'
export type { VNode, StyledSegment, RenderOptions, Scene, SlideScene } from './render'

export { div, p, h1, h2, center, style, code, img, explorer } from './components'
export type {
	CommonProps,
	DivProps,
	PProps,
	H1Props,
	H2Props,
	CenterProps,
	StyleProps,
	CodeProps,
	ImgProps,
	ExplorerProps,
} from './components'

export { Fragment, jsx, jsxs, jsxDEV } from './jsx-runtime'