// ComponentBase — abstract parent for every JSX component. The
// class instance IS the VNode: it carries `type`, `props`, `key`
// fields plus the framework methods. Subclasses set the JSX type,
// define layout/summon behavior, and may override the optional
// `prepare` / `bakeFrames` / `buildFrameDispatchTick` hooks.

import type { LabelClass } from 'sandstone'
import type { VNode } from '../render'
import type { Styles } from '../style'
import type { CssDeclarations } from '../less/types'
import type { NodeWithPath } from '../tree/walk'
import { ImgResourceMap } from './image/image-component';
import { RowFlexWidth } from '../layout/row-flex';

// Each component registers its precomputed type via module
// augmentation. The bag below is keyed by these JSX type strings
// and the values are strictly typed per component.
//
// Example (in components/code/code-component.ts):
//   declare module '../base' {
//     interface PrecomputedTypeMap {
//       code: WeakMap<VNode, Precomputed>
//     }
//   }
export interface PrecomputedTypeMap {
	// Each component file augments this interface with its own key.
}

export type PrecomputedBy<T extends keyof PrecomputedTypeMap> = PrecomputedTypeMap[T]

export type PrecomputedBag = {
	[K in keyof PrecomputedTypeMap]?: PrecomputedTypeMap[K]
}

export type ComponentLayoutBase = {
	kind: string
	node: VNode
	path: string[]
	parentStack: CssDeclarations
	declarations: CssDeclarations
	type: string
	cellH: number
	cellW: number
	marginTop: number
	marginBottom: number
	/** Owning component — set by the layout orchestrator after
	 *  `computeLayout` so the post-layout `finalizeLayout` hook and
	 *  per-component summon dispatch back to the right instance. */
	component?: ComponentBase
	/** Per-component precomputed data — populated by the component's
	 *  `prepare()` from the matched bag entry. Components cast to
	 *  their own precomputed type at read time. */
	precomputed?: unknown
}

export type LayoutCtx = {
	styles: Styles
	sceneW: number
	sceneH: number
	/** The visible node this layout pass is computing. Components
	 *  read `ctx.node.node` (the VNode = component instance),
	 *  `ctx.node.path`, and `ctx.declarations` directly. */
	node: NodeWithPath
	/** The element's own LESS declarations (cached on ctx so the
	 *  component doesn't have to re-walk `styles.forPath`). */
	declarations: CssDeclarations
	/** The parent element's LESS declarations — same caching. */
	parentStack: CssDeclarations
	/** Row-flex width overrides (resolved by `prepareRowFlexWidths`). */
	rowFlexWidths?: WeakMap<VNode, RowFlexWidth>
	/** Bag of per-component precomputed data. Each component reads
	 *  its own slot via `precomputedBag.<type>`. Slots are typed via
	 *  module augmentation in `PrecomputedTypeMap`. */
	precomputedBag?: PrecomputedBag
}

export type SummonCtx = {
	el: ComponentLayoutBase
	entityX: number
	entityY: number
	z: number
	extraTags: (`${any}${string}` | LabelClass)[]
	sceneTag: LabelClass
	initialOpacity: number | undefined
}

export type PrepareCtx = {
	visiblePerSlide: readonly NodeWithPath[][]
	styles: Styles
	sceneW: number
	sceneH: number
	/** Row-flex width overrides (`grid-auto-flow: row` children share
	 *  leftover horizontal space equally). Components whose `prepare()`
	 *  needs to know a `<code>` / `<explorer>`'s row-distributed width
	 *  read this. Same WeakMap that `LayoutCtx.rowFlexWidths` carries. */
	rowFlexWidths: WeakMap<VNode, RowFlexWidth>
	/** Component writes its precomputed data here during `prepare()`.
	 *  The framework reads `ctx.result` and stores it in the bag keyed
	 *  by `this.type`. Opaque — each component's `prepare()` knows its
	 *  own shape and reads it back the same way at `computeLayout()` time. */
	result: unknown
}

export type FrameBakeCtx = {
	el: ComponentLayoutBase
	slideIdx: number
	componentIdx: number
	styles: Styles
	sceneW: number
	sceneH: number
}

export abstract class ComponentBase {
	abstract readonly type: string | (new (props: any, key: any) => any)
	public readonly props: any
	public readonly key: any

	constructor(props: any = {}, key: any = null) {
		this.props = props
		this.key = key
	}

	/** Default: invisible (e.g., `<style>`, `<center>`). Override. */
	isVisible(): boolean { return false }

	/** Default throws. Subclasses override. */
	computeLayout(_ctx: LayoutCtx): ComponentLayoutBase {
		throw new Error(`${this.type}: computeLayout not implemented`)
	}

	/** Optional post-layout hook. Called once per element after
	 *  initial layouts are computed but before the placement pass —
	 *  used by scrolling `<code>` / `<explorer>` to bake viewport
	 *  chunks based on the final cellH. Receives the freshly-
	 *  computed layout record; mutates it in place. Default: no-op. */
	finalizeLayout?(_layout: ComponentLayoutBase): void

	/** Default throws. Subclasses override. */
	summon(_ctx: SummonCtx): void {
		throw new Error(`${this.type}: summon not implemented`)
	}

	/** Async pre-compute pass. Default: no-op. Each subclass'
	 *  override writes its typed result into `ctx.result`; the
	 *  framework stores it in the per-type bag for the layout
	 *  pass. */
	async prepare?(_ctx: PrepareCtx): Promise<void>
}