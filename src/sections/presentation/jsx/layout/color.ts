// Parse `#RRGGBB` / `RRGGBB` strings into the integer form MC wants
// for `text_display.background`.
//
// MC's `background` field is ARGB (`ALPHA << 24 | R << 16 | G << 8 | B`).
// A bare `#RRGGBB` int has alpha byte 0, which MC renders as fully
// transparent. OR `0xFF000000` so callers always get an opaque color
// unless they explicitly opt into transparency.

export function parseColorInt(hex: string): number | undefined {
	const m = hex.trim().match(/^#?([0-9a-fA-F]{6})$/)
	if (!m) return undefined
	return 0xff000000 | parseInt(m[1], 16)
}