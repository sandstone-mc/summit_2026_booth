// AutocompleteComponent — orchestrates the autocomplete's layout,
// summon, and frame-bake. Logic lives in sibling files; this is the
// thin glue registered with the framework.

import {
	type ComponentLayoutBase,
	type LayoutCtx,
	type SummonCtx,
} from '../base'
import { AnimatedComponent, type ComponentFrames } from '../animation-base'
import type { MCFunctionClass } from 'sandstone'
import {
	autocompleteLayoutFor,
	computeAutocompleteLayout,
	type AutocompleteLayout,
} from './autocomplete-layout'
import { autocompleteSummon } from './autocomplete-summon'
import { bakeAutocompleteFrames } from './autocomplete-frames'

export class AutocompleteComponent extends AnimatedComponent {
	readonly type = 'autocomplete'
	isVisible(): boolean { return true }

	computeLayout(ctx: LayoutCtx): ComponentLayoutBase {
		return computeAutocompleteLayout(
			ctx.node.node,
			ctx.node.path,
			ctx.parentStack,
			ctx.declarations,
			ctx.sceneW, ctx.sceneH,
		)
	}

	summon(ctx: SummonCtx): void {
		autocompleteSummon(
			ctx.el as AutocompleteLayout,
			ctx.entityX, ctx.entityY, ctx.z,
			ctx.extraTags, ctx.sceneTag, ctx.initialOpacity,
		)
	}

	// AnimatedComponent.bakeFrames — one MCFunction per typing stage.
	// The hash list lets the slide-level dispatcher prune identical
	// consecutive stages from the `_.switch`.
	bakeFrames(slideIdx: number, componentIdx: number, layout: ComponentLayoutBase): ComponentFrames | null {
		return bakeAutocompleteFrames(slideIdx, componentIdx, layout as AutocompleteLayout)
	}

	buildFrameDispatchTick(
		_layout: ComponentLayoutBase,
		_slideIdx: number,
		_componentIdx: number,
		_frames: ComponentFrames,
	): MCFunctionClass | null {
		// Frame-skip dispatch is built by the slide-level orchestrator
		// (SlideShow) once it has all components' hashes. Component-
		// level overrides return null to opt out of the per-component path.
		return null
	}
}

// Public helper called by SlideShow per slide per element.
export { autocompleteLayoutFor, autocompleteSummon, bakeAutocompleteFrames }