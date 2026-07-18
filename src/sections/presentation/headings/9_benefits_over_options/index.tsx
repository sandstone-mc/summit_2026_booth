import shaderCode from '../../../rhythm/config/internal/shaders/index' with { type: 'text' }

export const slides = [
	(<>
		<h2 id="header">How does Sandstone compare?</h2>
		<p>Full auto-complete & error-checking, even for NBT!</p>
		<autocomplete id="ac-demo" />
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
