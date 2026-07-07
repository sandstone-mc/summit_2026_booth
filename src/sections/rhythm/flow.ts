import { _, type Score } from 'sandstone'

// if/else chain over score values; unlike _.switch this compiles without macros, so it stays cheap in per-beat paths
export function scoreSwitch(score: Score, cases: [value: number, run: () => void][]) {
	if (cases.length === 0) return
	const [[firstValue, firstRun], ...rest] = cases
	let chain = _.if(score.equalTo(firstValue), firstRun)
	for (const [value, run] of rest) {
		chain = chain.elseIf(score.equalTo(value), run)
	}
}
