import shaderCode from '../../../rhythm/config/internal/shaders/index' with { type: 'text' }

export const slides = [
	(<>
		<h2 id="header">How does Sandstone compare?</h2>
		<div id="text-grid">
			<p>Most pre-compilers have some version of the previously mentioned features, but very few give the same level of developer experience in-editor.</p>
			<p>Thanks to Sandstone working inside of the Typescript language, we can provide auto-complete, inline documentation, and error checking at the moment you write your code, without fussing over spelling, external docs, or a manual compiler.</p>
		</div>
	</>),
	(<>
		<h3 id="header">How does Sandstone compare?</h3>
		<div id="compact-text-grid">
			<p>Additionally, after years of combined effort, the same data schema engine that powers the Spyglass/DHP extension and Misode's generators now also **automatically** maintains Sandstone's Types!</p>
			<p>This means that unlike some other pre-compilers that need lots of manual work to update for every single change made in a Minecraft snapshot, Sandstone can be updated for one anywhere from instantly via CI to within 30 minutes of effort.</p>
			<p>`SpyglassMC/vanilla-mcdoc`, the schema repository that describes all data component, pack JSON, and other data structures in the game, has a growing list of several maintainers that anyone can join!</p>
		</div>
	</>),
	(<>
		<h3 id="header">How does Sandstone compare?</h3>
		<p>Use node modules directly inside your datapack code - not just Sandstone abstactions.</p>
		<code
			id="shader-code"
			src={shaderCode.split('\n').slice(2, -4).join('\n')}
			lang="typescript"
			scrolling={true}
			line-numbers={true}
		/>
		<p>If you're already familiar with JS/TS you operate in the same, familiar ecosystem.</p>
	</>)
]
