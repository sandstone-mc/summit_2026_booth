import shaderCode from '../../../rhythm/config/internal/shaders/index' with { type: 'text' }

export const slides = [
	(<>
		<h2 id="header">How does Sandstone compare?</h2>
		<p>todo: describe autocomplete and error checking like Spyglass, out of time for autocomplete demo</p>
		<p>todo: describe that due to mcdoc-ts-generator, minecraft updates are very easy to implement in Sandstone, with most snapshots taking a half an hour of work or less, regardless of how many features are added</p>
	</>),
	(<>
		<h3 id="header">How does Sandstone compare?</h3>
		<p>Use node modules directly inside your datapack code - not just Sandstone abstactions.</p>
		<code
			id="shader-code"
			src={shaderCode}
			lang="typescript"
			scrolling={true}
			line-numbers={true}
		/>
		<p>If you're already familiar with JS/TS you operate in the same, familiar ecosystem.</p>
	</>)
]
