import flowUsage from './snippets/flow_usage' with { type: 'text' }
import asyncContext from './snippets/async_context' with { type: 'text' }
import asyncContextLog from './snippets/async_context.log' with { type: 'text' }

// TODO: Come up with a good Flow example

export const slides = [
	(<>
		<h2 id="header">What can Sandstone's features do for me?</h2>
		<code src={flowUsage} lang="typescript" line-numbers={true} />
	</>),
	(<>
		<h3 id="header">What can Sandstone's features do for me?</h3>
		<p>Normally, a scheduled function loses its executor and position.</p>
		<p>`asyncContext: true` tags the entity, stores the timer, and resumes `as`/`at` it left off</p>
		<div id="code-grid">
			<code src={asyncContext} lang="typescript" line-numbers={false} scrolling={true} extra-row={true} />
			<code id="server-log" src={asyncContextLog} scrolling={true} extra-row={true} />
		</div>
		<p shift-up={0.325}>Supports tracking multiple entities at once!</p>
	</>),
]
