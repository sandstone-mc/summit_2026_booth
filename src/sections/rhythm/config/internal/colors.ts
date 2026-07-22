/** Packs a css-style rgb color into the 0xRRGGBB int the game expects. */
export function rgb(r: number, g: number, b: number): number {
	return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)
}

/** Packs a css-style rgba color (alpha 0..1) into the ARGB int text displays expect. */
export function rgba(r: number, g: number, b: number, a: number): number {
	return ((Math.round(a * 255) & 0xff) << 24) | rgb(r, g, b) | 0
}

export function argb(alpha: number, color: number) {
	return ((alpha & 0xff) << 24) | color | 0
}