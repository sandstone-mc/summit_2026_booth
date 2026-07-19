// CodeComponent — handles `<code>`. Logic delegated to sibling
// files; this is the thin class registered by jsx-runtime.ts.

import { type ComponentLayoutBase, type LayoutCtx, type SummonCtx } from '../base'
import { AnimatedComponent, type ComponentFrames } from '../animation-base'
import { computeCodeLayout, finalizeScrollCodeLayout, type CodeLayout } from './code-layout'
import { codeSummon } from './code-summon'
import { bakeCodeFrames } from './code-frames'
import { prepareCodeComponents } from './code-prepare'
import type { MCFunctionClass } from 'sandstone'
import type { VNode } from '../../render'
import type { Precomputed } from './code-borders'
import { RowFlexWidth } from '../../layout/row-flex';

// Register the `<code>` slot in the precomputed bag.
declare module '../base' {
	interface PrecomputedTypeMap {
		code: WeakMap<VNode, Precomputed>
	}
}

export class CodeComponent extends AnimatedComponent {
	readonly type = 'code'
	constructor(props: any = {}, key: any = null) {
		super(props, key)
	}

	isVisible(): boolean { return true }

	computeLayout(ctx: LayoutCtx): ComponentLayoutBase {
		const codePre = ctx.precomputedBag?.code ?? new WeakMap<VNode, Precomputed>()
		return computeCodeLayout(
			ctx.node.node,
			ctx.node.path,
			ctx.parentStack,
			ctx.declarations,
			ctx.sceneW, ctx.sceneH,
			codePre,
			ctx.rowFlexWidths ?? new WeakMap(),
		)
	}

	// Bake viewport chunks for `<code scrolling>` blocks once the
	// layout engine has set the final cellH. Mutates the layout in
	// place — fills in `chunks` / `viewportCodeRows` /
	// `scrollDistBlocks`.
	override finalizeLayout(layout: ComponentLayoutBase): void {
		finalizeScrollCodeLayout(layout as CodeLayout)
	}

	summon(ctx: SummonCtx): void {
		codeSummon(
			ctx.el as CodeLayout,
			ctx.entityX, ctx.entityY, ctx.z,
			ctx.extraTags, ctx.sceneTag, ctx.initialOpacity,
		)
	}

	bakeFrames(slideIdx: number, componentIdx: number, layout: CodeLayout): ComponentFrames | null {
		return bakeCodeFrames(slideIdx, componentIdx, layout)
	}

	buildFrameDispatchTick(
		_layout: CodeLayout,
		_slideIdx: number,
		_componentIdx: number,
		_frames: ComponentFrames,
	): MCFunctionClass | null {
		// Frame-skip dispatch is built by the slide-level orchestrator
		// (SlideShow) once it has all components' hashes — see
		// `buildSlideFrameDispatch`. Component-level overrides return
		// null to opt out of the per-component dispatch path.
		return null
	}

	// Async pre-compute: fetch grammars + tokenize every visible
	// `<code>` block. Result is the WeakMap consumed by computeLayout.
	async prepare(ctx: { visiblePerSlide: any; styles: any; sceneW: number; sceneH: number; rowFlexWidths: WeakMap<VNode, RowFlexWidth>; result: any }): Promise<void> {
		const map: WeakMap<VNode, Precomputed> = await prepareCodeComponents(
			ctx.visiblePerSlide,
			ctx.styles,
			ctx.sceneW,
			ctx.sceneH,
			ctx.rowFlexWidths,
		)
		ctx.result = map
	}
}

export type { CodeLayout, Precomputed }