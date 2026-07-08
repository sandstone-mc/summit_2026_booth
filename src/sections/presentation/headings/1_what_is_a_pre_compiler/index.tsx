/**
 * Slide: What is a pre-compiler?
 *
 * Notes (kept for reference, not parsed as content):
 * - Pre-compilers translate easy-to-write code to raw mcfunction files while
 *   adding features (variables, abstractions, organization).
 * - They help avoid the error-prone repetitive work of hand-writing a large
 *   mcfunction project.
 * - They layer features on top of vanilla so the compiled output stays
 *   compatible.
 * - They simplify project management by letting related resources live in
 *   one file.
 */

export const slides = [
	(<><div id="grid">
		<h1>What is a pre-compiler?</h1>
	</div></>),
	(<><div id="grid">
		<p>A tool that translates non-vanilla code into raw mcfunction & JSON files.</p>
		<p>They usually allow you to organize your code exactly how you want to, without having to manually juggle hundreds of files.</p>
		<p>Also, often letting you use variables, abstractions, modern control flow, and more throughout your code without headaches.</p>
		<p>And despite all the additional features, if a pre-compiler is well designed, you end up with an output with the same performance and compatiblity of a manually written pack.</p>
	</div></>)
]
