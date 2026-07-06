/**
 * Slide display timing. Each slide shows for `words/wpm + buffer` seconds,
 * clamped between `minSeconds` and `maxSeconds`.
 */
export type SlidesTiming = {
	/** Reading speed in words per minute. */
	wpm?: number
	/** Extra seconds added to every slide on top of reading time. */
	bufferSeconds?: number
	/** Minimum seconds a slide can display for. */
	minSeconds?: number
	/** Maximum seconds a slide can display for. */
	maxSeconds?: number
}

const DEFAULT_TIMING: Required<SlidesTiming> = {
	wpm: 200,
	bufferSeconds: 2,
	minSeconds: 5,
	maxSeconds: 30,
}

/** Word count for arbitrary text. Whitespace-split, empty tokens dropped. */
export function countWords(text: string): number {
	return text.split(/\s+/).filter(Boolean).length
}

/**
 * Display duration in seconds for each slide. `texts[i]` is the full text
 * of slide `i` (any mix of title + body) — its word count determines how
 * long it shows. Clamped between `minSeconds` and `maxSeconds`.
 */
export function computeDurationsSeconds(
	texts: string[],
	timing: SlidesTiming = {},
): number[] {
	const t = { ...DEFAULT_TIMING, ...timing }
	return texts.map((text) => {
		const readingSec = (countWords(text) / t.wpm) * 60
		return Math.min(t.maxSeconds, Math.max(t.minSeconds, readingSec + t.bufferSeconds))
	})
}
