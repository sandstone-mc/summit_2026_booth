// Public surface for the JSX presentation renderer.
//
// Top-level entry: `render(tree, options)` for a single JSX tree or
// `renderSlides(trees, options, timing?)` for a multi-slide scene.
// JSX intrinsic elements are typed via `JSX.IntrinsicElements` in
// `components.ts`. The component classes are re-exported for callers
// who want to instantiate manually (rare).

export { render, renderSlides } from './render'
export type { VNode, StyledSegment, RenderOptions, Scene, SlideScene } from './render'

export type {
	CommonProps,
	DivProps,
	PProps,
	H1Props,
	H2Props,
	H3Props,
	CenterProps,
	StyleProps,
	CodeProps,
	ImgProps,
	ExplorerProps,
	AutocompleteProps,
} from './components'

export { Fragment, jsx, jsxs, jsxDEV } from './jsx-runtime'