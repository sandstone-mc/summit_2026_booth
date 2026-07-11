// Parse `#RRGGBB` / `RRGGBB` strings into the integer form MC wants
// for `text_display.background`.

export function parseColorInt(hex: string): number | undefined {
	const m = hex.trim().match(/^#?([0-9a-fA-F]{6})$/)
	if (!m) return undefined
	return parseInt(m[1], 16)
}