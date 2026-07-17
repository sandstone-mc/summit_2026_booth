import sampleTS from './snippets/sample.ts' with { type: 'text' }
import sampleMCF from './snippets/sample.mcfunction' with { type: 'text' }

export const slides = [
	(<>
		<h1 id="header">Hello World!</h1>

		<code lang="typescript" src={sampleTS} />

		<code lang="mcfunction" src={sampleMCF} />
	</>),
]
