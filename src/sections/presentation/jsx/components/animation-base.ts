// AnimatedComponent — abstract parent for components that emit
// per-frame baked MCFunctions. Inheritors (CodeComponent,
// ExplorerComponent, AutocompleteComponent) override
// `bakeFrames()` to emit one MCFunction per frame state, and
// `buildFrameDispatchTick()` to wire the per-slide per-component
// dispatcher (frame-skip + `_.switch` dispatch).

import type { MCFunctionClass } from 'sandstone'
import { ComponentBase } from './base'

// Opaque handle returned by `bakeFrames`. Carries an array of
// per-frame MCFunction refs, their content hashes (used by the
// slide-level dispatcher to decide which frames warrant a switch
// case), and subclass-specific state.
export type ComponentFrames = {
	frameFns: MCFunctionClass[]
	/** Stable hash of each frame's payload. Two consecutive equal
	 *  hashes mean the visible state didn't change, so the dispatcher
	 *  can skip emitting that case. */
	hashes: string[]
	state: unknown
}

export abstract class AnimatedComponent extends ComponentBase {
	// Two virtual hooks a subclass may override. Both default to
	// no-op so non-animated types can extend without implementing.

	/** Bake per-frame MCFunctions from the supplied layout record.
	 *  Returns null when the layout has no frames. */
	bakeFrames(slideIdx: number, componentIdx: number, layout: any): ComponentFrames | null {
		void layout
		return null
	}

	/** Build the per-slide per-component dispatch MCFunction.
	 *  Returns null when there's nothing to dispatch (e.g., a
	 *  `<code>` with no scroll frames on this slide). */
	buildFrameDispatchTick(layout: any, slideIdx: number, componentIdx: number, frames: ComponentFrames): MCFunctionClass | null {
		void layout
		void slideIdx
		void componentIdx
		void frames
		return null
	}
}