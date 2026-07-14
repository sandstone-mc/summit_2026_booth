// :thonkwer: for some reason these don't actually generate anything, but something fucky happens with the rhythm code import
import mcfunctionCode from './snippets/mcfunction_sample' with { type: 'text' }
import recipeCode from './snippets/recipe_sample' with { type: 'text' }
import advancementCode from './snippets/advancement_sample' with { type: 'text' }

import mcfunctionGen from './snippets/mcfunction_sample.mcfunction' with { type: 'text' }
import recipeGen from './snippets/recipe_sample.json'
import advancementGen from './snippets/advancement_sample.json'

export const slides = [
	// slide[8]
	(<>
		<h3 wrap-breaks={[]}>Do I need lots of TS / JS experience?</h3>
		<p>Not really - Basic Sandstone syntax maps 1:1 to commands and JSON</p>
		<p>Additonally, LLM-assisted coding works great as a learning aid</p>
		<p>And if you already know JS you're basically 90% there; TypeScript is just a step beyond that</p>
	</>),
	// (<>
	// 	<h3>Do I need lots of TS / JS experience?</h3>
	// 	<div id="code-grid">
	// 		<code lang="typescript" src={mcfunctionCode} />
	// 		<code lang="mcfunction" src={mcfunctionGen} />
	// 	</div>
	// </>),
	// (<>
	// 	<h3>Do I need lots of TS / JS experience?</h3>
	// 	<div id="code-grid">
	// 		<code lang="typescript" src={recipeCode} />
	// 		<code lang="json" src={JSON.stringify(recipeGen, null, 4)} />
	// 	</div>
	// </>),
	// (<>
	// 	<h3>Do I need lots of TS / JS experience?</h3>
	// 	<div id="code-grid">
	// 		<code lang="typescript" src={advancementCode} scrolling={true} />
	// 		<code lang="json" src={JSON.stringify(advancementGen, null, 4)} />
	// 	</div>
	// </>),
]
