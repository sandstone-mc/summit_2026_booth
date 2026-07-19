// Code scroll frame baking — one MCFunction per scroll chunk.
// Each frame emits `data modify entity @e[tag=code_scroll_<n>…] text
// set value [...]` to swap the chunk's bordered content at runtime.
// The slide-level dispatcher invokes these when the scroll index
// changes; chunks whose content hash matches the previous chunk are
// pruned from the switch (their visible state is identical).

import {
	MCFunction,
	execute,
	Selector,
	type MCFunctionClass,
    say,
    Label,
} from 'sandstone'
import type { NBTObject } from 'sandstone/arguments'
import { buildTextJson } from '../summon-helpers'
import type { ComponentFrames } from '../animation-base'
import type { CodeLayout } from './code-layout'

// TODO its bad that componentIdx isnt in use
export function bakeCodeFrames(slideIdx: number, componentIdx: number, layout: CodeLayout): ComponentFrames | null {
	if (!layout.scrolling || !layout.chunks || !layout.scrollTag) return null
	const fns: MCFunctionClass[] = []
	const hashes: string[] = []
	for (let i = 0; i < layout.chunks.length; i++) {
		const chunkIndex = i
		// TODO: bad
		const scrollTag = layout.scrollTag
		const slideTag = Label(`slide_${slideIdx}`)
		const chunkValue = buildTextJson(
			layout.chunks[i].content,
			layout.declarations,
			layout.type,
		)
		const fn = MCFunction(`presentation/slides/code_chunk/${scrollTag}/${chunkIndex}`, () => {
			const entitySel = Selector('@e', {
				tag: [Label(`code_scroll_${i}`), slideTag],
			})
			execute.as(entitySel).run.data.modify
				.entity('@s', 'text')
				.set.value(chunkValue as NBTObject)
		})
		fns.push(fn)
		// Hash the chunk's rendered text payload. Two chunks with
		// identical text bytes are visually indistinguishable, so the
		// dispatcher can safely drop duplicate cases.
		const hash = Bun.hash(JSON.stringify(layout.chunks[i].content))
		hashes.push(hash.toString(16))
	}
	return { frameFns: fns, hashes, state: layout }
}