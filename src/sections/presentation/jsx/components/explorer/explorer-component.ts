// ExplorerComponent — handles `<explorer>`. Logic delegated to
// sibling files; this is the thin class registered by jsx-runtime.ts.

import { type ComponentLayoutBase, type LayoutCtx, type SummonCtx } from '../base'
import { AnimatedComponent, type ComponentFrames } from '../animation-base'
import { computeExplorerLayout, finalizeExplorerScrollLayout, type ExplorerLayout } from './explorer-layout'
import { explorerSummon } from './explorer-summon'
import { bakeExplorerFrames } from './explorer-frames'
import { prepareExplorerComponents } from './explorer-prepare'
import type { MCFunctionClass } from 'sandstone'
import type { VNode } from '../../render'
import type { Precomputed } from '../code/code-borders'
import { RowFlexWidth } from '../../layout/row-flex';

// Register the `<explorer>` slot in the precomputed bag.
declare module '../base' {
	interface PrecomputedTypeMap {
		explorer: WeakMap<VNode, Precomputed>
	}
}

export class ExplorerComponent extends AnimatedComponent {
	readonly type = 'explorer'
	constructor(props: any = {}, key: any = null) {
		super(props, key)
	}

	isVisible(): boolean { return true }

	computeLayout(ctx: LayoutCtx): ComponentLayoutBase {
		const explorerPre = ctx.precomputedBag?.explorer ?? new WeakMap<VNode, Precomputed>()
		return computeExplorerLayout(
			ctx.node.node,
			ctx.node.path,
			ctx.parentStack,
			ctx.declarations,
			ctx.sceneW, ctx.sceneH,
			explorerPre,
			ctx.rowFlexWidths ?? new WeakMap(),
		)
	}

	override finalizeLayout(layout: ComponentLayoutBase): void {
		finalizeExplorerScrollLayout(layout as ExplorerLayout)
	}

	summon(ctx: SummonCtx): void {
		explorerSummon(
			ctx.el as ExplorerLayout,
			ctx.entityX, ctx.entityY, ctx.z,
			ctx.extraTags, ctx.sceneTag, ctx.initialOpacity,
		)
	}

	bakeFrames(slideIdx: number, componentIdx: number, layout: ExplorerLayout): ComponentFrames | null {
		return bakeExplorerFrames(slideIdx, componentIdx, layout)
	}

	buildFrameDispatchTick(
		_layout: ExplorerLayout,
		_slideIdx: number,
		_componentIdx: number,
		_frames: ComponentFrames,
	): MCFunctionClass | null {
		// Frame-skip dispatch is built by the slide-level orchestrator
		// (SlideShow) once it has all components' hashes — see
		// `buildSlideFrameDispatch` in `slides/show.ts`. Component-level
		// overrides return null to opt out of the per-component path.
		return null
	}

	async prepare(ctx: { visiblePerSlide: any; styles: any; sceneW: number; sceneH: number; rowFlexWidths: WeakMap<VNode, RowFlexWidth>; result: any }): Promise<void> {
		const map = await prepareExplorerComponents(
			ctx.visiblePerSlide,
			ctx.styles,
			ctx.sceneW,
			ctx.sceneH,
			ctx.rowFlexWidths,
		)
		ctx.result = map
	}
}

export type { ExplorerLayout }