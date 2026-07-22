import { Texture } from 'sandstone'

import { screenshot } from '../../utils/index.ts'

import rhythmCode from '../../../rhythm/game/calibration.ts' with { type: 'text' }
import magicCode from '../../../magic/Spells/Lightning/Thunderbolt.ts' with { type: 'text' }

const rhythmGlamshot = Texture('item', 'presentation/rhythm', screenshot('assets/presentation/rhythm_glamshot', 4))

const magicGlamshot = Texture('item', 'presentation/magic', screenshot('assets/presentation/magic_glamshot', 4))

// INFO: explorer path-start=3 means to omit the `.sandstone/output/datapack/` part of the path

export const slides = [
	(<>
		<h2 id="header">Can people make advanced, fun content with Sandstone?</h2>

		<p>Short answer: Yes!</p>
		<p>Longer answer: After the presentation go down to our bottom floor and check out their games!</p>

		<div id="img-grid">
			<img src={rhythmGlamshot} height="30vh" />
			<img src={magicGlamshot} height="30vh" />
		</div>
	</>),
	(<>
		<h3 id="header">Ori's Rhythm Game Example</h3>

		{/* Displays code and explorer horizontally side-by-side with the code taking up as much space as possible on-screen */}
		<div id="code-grid">
			<code lang="typescript" src={rhythmCode.split('\n').slice(17, -4).join('\n')} line-numbers={true} scrolling={true} />

			{/* Display file/folder outline for output of above code */}
			<explorer
				width="35vw"
				path-start={3}
				root=".sandstone/output/datapack/data/sandstone_summit_booth/function/sections/rhythm/calibration"
				scrolling={true}
				no-dash={true}
			/>
		</div>
	</>),
	(<>
		<h3 id="header">LilSpartan's Arcane Magic Example</h3>

		{/* Displays code and explorer horizontally side-by-side with the code taking up as much space as possible */}
		<div id="code-grid">
			<code lang="typescript" src={magicCode.split('\n').slice(1, -4).join('\n')} line-numbers={true} scrolling={true} />

			{/* Display file/folder outline for output of above code */}
			<explorer
				width="35vw"
				path-start={3}
				root=".sandstone/output/datapack/data/sandstone_summit_booth/function/sections/magic/spells/lightning/thunderbolt"
				scrolling={true}
				no-dash={true}
			/>
		</div>
	</>),
]
