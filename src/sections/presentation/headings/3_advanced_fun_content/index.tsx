// import rhythmCode from '../../../rhythm/game/calibration.ts' with { type: 'text' }
// import magicCode from '../../../magic/Spells/Lightning/Thunderbolt.ts' with { type: 'text' }

// TODO: fix
const rhythmCode = 'placeholder'.repeat(100)
const magicCode = 'placeholder'.repeat(100)

// INFO: explorer path-start=3 means to omit the `.sandstone/output/datapack/` part of the path

export const slides = [
	// slide[3]
	(<>
		<h2 id="header">Can people make advanced, fun content with Sandstone?</h2>

		<p>Short answer: Yes!</p>
		<p>Longer answer: After the presentation go down to our bottom floor and check out their games!</p>

		<div id="img-grid">
			<p>t</p>
			<img src="sandstone_summit_booth:item/ui/presentation/3_advanced_fun_content/arcane.png" height="30vh" />
			<img src="sandstone_summit_booth:item/ui/presentation/3_advanced_fun_content/arcane.png" height="30vh" />
			<p>t</p>
		</div>
	</>),
	// slide[4]
	(<>
		<h3 id="header">Ori's Rhythm Game Example</h3>

		{/* Displays code and explorer horizontally side-by-side with the code taking up as much space as possible on-screen */}
		<div id="code-grid">
			<code lang="typescript" src={rhythmCode} line-numbers={true} scrolling={true} />

			{/* Display file/folder outline for output of above code */}
			{/* <explorer
				width="20vw"
				path-start={3}
				root=".sandstone/output/datapack/data/sandstone_summit_booth/function/sections/rhythm/calibration"
				scrolling={true}
			/> */}
		</div>
	</>),
	// slide[5]
	(<>
		<h3 id="header">LilSpartan's Arcane Magic Example</h3>

		{/* Displays code and explorer horizontally side-by-side with the code taking up as much space as possible */}
		<div id="code-grid">
			<code lang="typescript" src={magicCode} line-numbers={true} scrolling={true} />

			{/* Display file/folder outline for output of above code */}
			{/* <explorer
				width="20vw"
				path-start={3}
				root=".sandstone/output/datapack/data/sandstone_summit_booth/function/sections/magic/spells/lightning/thunderbolt"
				scrolling={true}
			/> */}
		</div>
	</>),
	// slide[6]
	(<>
		<div id="img-grid">
			<p>asd</p>
			<p>asd</p>
			<p>asd</p>
		</div>
	</>)
]
