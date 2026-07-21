import magicCode from './snippets/magic/magic_example' with { type: 'text' }

export const slides = [
	(<>
		<h2 id="header">How can Object Oriented Programming help with my project?</h2>
		<div id="text-grid">
			<p>Wrap repeated patterns behind a single call</p>
			<p>Type-safe interfaces make shared code easy to read and review</p>
			<p>Compose small pieces instead of copy-pasting huge execute chains</p>
		</div>
	</>),
	(<>
		<h3 id="header">How can Object Oriented Programming help with my project?</h3>
		<code id="oop-code" src={magicCode} lang="typescript" line-numbers={true} scrolling={true} />
	</>),
]
