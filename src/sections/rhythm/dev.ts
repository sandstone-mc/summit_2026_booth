import { _, functionCmd, MCFunction, type MCFunctionClass, tellraw, Variable } from 'sandstone'
import { ticking } from '@shared'

const tickEnabled = Variable(0)

// dev-only driver for worlds without the summit core (which drives #ticking itself)
const tickLoop = MCFunction(
	'sections/rhythm/tick_loop',
	(self: MCFunctionClass) => {
		functionCmd(ticking)
		// self.schedule.function('1t', 'replace')
	},
	{ runEveryTick: true },
)

MCFunction('sections/rhythm/toggle_tick', () => {
	_.if(tickEnabled.equalTo(1), () => {
		tickEnabled.set(0)
		tickLoop.schedule.clear()
		tellraw('@s', { text: 'Rhythm pack ticking: OFF', color: 'red' })
	}).else(() => {
		tickEnabled.set(1)
		tickLoop()
		tellraw('@s', { text: 'Rhythm pack ticking: ON', color: 'green' })
	})
})
