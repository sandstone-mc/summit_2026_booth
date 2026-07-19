// ParagraphComponent — handles `<p>`. Intrinsic style: 16px, not
// bold (matches the original `defaultFontPx` default branch).

import { type LayoutCtx, type ComponentLayoutBase } from '../base'
import { ProseComponent, computeProseLayout, type ProseIntrinsicStyle } from './prose-base'

class ParagraphComponent extends ProseComponent {
	readonly type = 'p'
	readonly intrinsic: ProseIntrinsicStyle = { defaultScalePx: 16, defaultBold: false }
	computeLayout(ctx: LayoutCtx): ComponentLayoutBase {
		return computeProseLayout(
			ctx.node.node,
			ctx.node.path,
			ctx.parentStack,
			ctx.declarations,
			'p',
			this.intrinsic,
			ctx.styles,
			ctx.sceneW, ctx.sceneH,
		)
	}
}

export { ParagraphComponent }