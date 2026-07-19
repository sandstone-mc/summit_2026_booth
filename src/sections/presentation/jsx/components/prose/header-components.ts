// Header components — H1Component, H2Component, H3Component. Each
// has its own intrinsic font size + bold setting matching the
// original `defaultFontPx()` switch in `layout/constants.ts`.

import { type LayoutCtx } from '../base'
import { type ComponentLayoutBase } from '../base'
import type { CssDeclarations } from '../../less/types'
import type { NodeWithPath } from '../../tree/walk'
import { ProseComponent, computeProseLayout, type ProseIntrinsicStyle } from './prose-base'

class H1Component extends ProseComponent {
	readonly type = 'h1'
	readonly intrinsic: ProseIntrinsicStyle = { defaultScalePx: 32, defaultBold: true }
	computeLayout(ctx: LayoutCtx): ComponentLayoutBase {
		return computeProseLayout(
			ctx.node.node,
			ctx.node.path,
			ctx.parentStack,
			ctx.declarations,
			'h1',
			this.intrinsic,
			ctx.styles,
			ctx.sceneW, ctx.sceneH,
		)
	}
}

class H2Component extends ProseComponent {
	readonly type = 'h2'
	readonly intrinsic: ProseIntrinsicStyle = { defaultScalePx: 24, defaultBold: true }
	computeLayout(ctx: LayoutCtx): ComponentLayoutBase {
		return computeProseLayout(
			ctx.node.node,
			ctx.node.path,
			ctx.parentStack,
			ctx.declarations,
			'h2',
			this.intrinsic,
			ctx.styles,
			ctx.sceneW, ctx.sceneH,
		)
	}
}

class H3Component extends ProseComponent {
	readonly type = 'h3'
	// Preserved from the original `defaultFontPx` switch — h3 fell
	// through to the default 16px (no entry). Bold off (no entry).
	readonly intrinsic: ProseIntrinsicStyle = { defaultScalePx: 16, defaultBold: false }
	computeLayout(ctx: LayoutCtx): ComponentLayoutBase {
		return computeProseLayout(
			ctx.node.node,
			ctx.node.path,
			ctx.parentStack,
			ctx.declarations,
			'h3',
			this.intrinsic,
			ctx.styles,
			ctx.sceneW, ctx.sceneH,
		)
	}
}

export { H1Component, H2Component, H3Component }