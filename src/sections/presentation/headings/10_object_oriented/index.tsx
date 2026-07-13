/**
 * Slides: How can Object Oriented Programming help with my project?
 *
 * Notes (kept for reference, not parsed as content):
 * - Code example was illustrative pseudo-code: a HitboxOptions interface
 *   plus a checkHit(opts) helper that executed an onHit callback against
 *   any entity in the box.
 *
 * Two slides: one framing the benefit, one showing the pattern.
 */

export const slides = [
	(<>
		<h1>How can OOP help with my project?</h1>
		<p>Wrap repeated patterns behind a single call</p>
		<p>Type-safe interfaces make shared code easy to read and review</p>
		<p>Compose small pieces instead of copy-pasting huge execute chains</p>
	</>),
	(<>
		<h1>Pattern: Hitbox + onHit</h1>
		<p>Specify width, height, and a target type once</p>
		<p>Pass an onHit callback for what should happen on contact</p>
		<p>One helper call replaces a long execute...as...if.entity block</p>
	</>),
]
