// Parse the CSS `margin` shorthand into vertical-only meters.
// Supports 1–4 value forms. Longhand `margin-top` / `margin-bottom`
// override the shorthand. Left/right are discarded (scene center-anchors
// every cell on x).

import { parseLength } from '../length'
import type { CssDeclarations } from '../less/types'

export type MarginBox = { top: number; bottom: number }

export function parseMarginBox(decs: CssDeclarations, sceneH: number): MarginBox {
	let top = 0
	let right = 0
	let bottom = 0
	let left = 0
	const shorthand = decs.margin
	if (typeof shorthand === 'string' && shorthand.trim()) {
		const vals = shorthand.trim().split(/\s+/).map((p) => parseLength(p, sceneH)?.meters ?? 0)
		if (vals.length === 1) top = right = bottom = left = vals[0]
		else if (vals.length === 2) { top = bottom = vals[0]; right = left = vals[1] }
		else if (vals.length === 3) { top = vals[0]; right = left = vals[1]; bottom = vals[2] }
		else if (vals.length >= 4) { top = vals[0]; right = vals[1]; bottom = vals[2]; left = vals[3] }
	}
	const tOverride = parseLength(decs['margin-top'] ?? '', sceneH)?.meters
	const bOverride = parseLength(decs['margin-bottom'] ?? '', sceneH)?.meters
	if (tOverride !== undefined) top = tOverride
	if (bOverride !== undefined) bottom = bOverride
	return { top, bottom }
}