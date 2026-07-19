// NonVisualComponent — base class for JSX elements that don't render
// any MC entity but still need to participate in the layout tree
// (e.g. `<div>` as a layout container, `<center>` for alignment,
// `<style>` for LESS collection). `isVisible()` returns false so
// the layout pass skips them — their children are still reached
// by `flatWalk` because that walker doesn't filter on visibility.

import { type LayoutCtx, type SummonCtx, type PrepareCtx, type ComponentLayoutBase, ComponentBase } from './base'

export abstract class NonVisualComponent extends ComponentBase {
	isVisible(): boolean { return false }

	computeLayout(_ctx: LayoutCtx): ComponentLayoutBase {
		throw new Error(`${this.type}: computeLayout should not be called on a non-visual component`)
	}

	summon(_ctx: SummonCtx): void {
		throw new Error(`${this.type}: summon should not be called on a non-visual component`)
	}

	async prepare?(_ctx: PrepareCtx): Promise<void> {
		// Default: no prep.
	}
}
