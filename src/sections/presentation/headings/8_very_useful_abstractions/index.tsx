/**
 * Slides: What can Sandstone's features do for me?
 *
 * Notes (kept for reference, not parsed as content):
 * - Code example showing Objective + Advancement + flow control making a
 *   clean cooldown system. Self-references in the example were pseudo-code
 *   for display, not Sandstone-executable.
 * - TODO marker: "[insert good asyncContext example here]".
 *
 * Two slides: one intro, one diving into asyncContext — the feature that
 * keeps entity + position context across sleep().
 */

export const slides = [
	(<>
		<h1>What can Sandstone's features do for me?</h1>
		<p>Objectives + Advancements combine for clean cooldown systems</p>
		<p>Loop, branch, and schedule — flow control reads like normal code</p>
		<p>Macros fill in $(variables) at runtime, not at compile time</p>
	</>),
	(<>
		<h1 wrap-breaks={[1, 3, 5]}>asyncContext keeps your context across sleep</h1>
		<p>Normally a scheduled function loses @s and position</p>
		<p>asyncContext: true tags the entity, stores the timer, and resumes as/where it left off</p>
		<p>Each sleep gets its own label so multiple entities can wait independently</p>
	</>),
]
