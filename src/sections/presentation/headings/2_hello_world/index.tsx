import sampleTS from './snippets/sample.ts' with { type: 'text' }
import sampleMCF from './snippets/sample.mcfunction' with { type: 'text' }

/**
 * Slide: Hello World!
 * (Intro — notes say "Title: Hello World!" only.)
 */

export const slides = [
	(
		<>
			<h1 id="header">Hello World!</h1>

			<code lang="typescript" src={sampleTS} />

			<code lang="mcfunction" src={sampleMCF} />
		</>
	),
]
