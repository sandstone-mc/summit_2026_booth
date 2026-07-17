// :thonkwer: for some reason these don't actually generate anything, but something fucky happens with the rhythm code import
import mcfunctionCode from './snippets/mcfunction_sample' with { type: 'text' }
import recipeCode from './snippets/recipe_sample' with { type: 'text' }
import advancementCode from './snippets/advancement_sample' with { type: 'text' }

import mcfunctionGen from './snippets/mcfunction_sample.mcfunction' with { type: 'text' }
import recipeGen from './snippets/recipe_sample.json'
import advancementGen from './snippets/advancement_sample.json'

export const slides = [
	(<>
		<h2 id="header">Do I need lots of TS / JS experience?</h2>
		{/** This text-grid is not actually greedily taking the rest of the page height and centering the paragraphs, investigate */}
		<div id="text-grid">
			<p>Not really - Basic Sandstone syntax maps 1:1 to commands and JSON</p>
			<p>Additonally, LLM-assisted coding works great as a learning aid</p>
			<p>And if you already know JS you're basically 90% there; TypeScript is just a step beyond that</p>
		</div>
	</>),
	(<>
		<h3 id="header" wrap-breaks={[]}>Do I need lots of TS / JS experience?</h3>
		<div id="code-grid">
			<code lang="typescript" src={mcfunctionCode} />
			<code lang="mcfunction" src={mcfunctionGen} />
		</div>
	</>),
	(<>
		<h3 id="header" wrap-breaks={[]}>Do I need lots of TS / JS experience?</h3>
		<div id="code-grid">
			<code lang="typescript" src={recipeCode} scrolling={true} />
			<code lang="json" src={JSON.stringify(recipeGen, null, 4)} scrolling={true} />
		</div>
	</>),
	(<>
		<h3 id="header" wrap-breaks={[]}>Do I need lots of TS / JS experience?</h3>
		<div id="code-grid">
			<code lang="typescript" src={advancementCode} scrolling={true} />
			<code lang="json" src={JSON.stringify(advancementGen, null, 4)} scrolling={true} />
		</div>
	</>),
]
