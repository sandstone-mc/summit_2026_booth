// Explorer scroll frame baking — same shape as `code/code-frames.ts`.
// Each scroll chunk becomes one MCFunction that swaps the bordered
// content for the explorer block at runtime. The slide-level
// dispatcher hashes consecutive chunks and prunes identical ones.

import {
	MCFunction,
	execute,
	Selector,
	type MCFunctionClass,
    Label,
} from 'sandstone'
import type { NBTObject } from 'sandstone/arguments'
import { buildTextJson } from '../summon-helpers'
import type { ComponentFrames } from '../animation-base'
import type { ExplorerLayout } from './explorer-layout'

export function bakeExplorerFrames(slideIdx: number, componentIdx: number, layout: ExplorerLayout): ComponentFrames | null {
	if (!layout.scrolling || !layout.chunks || !layout.scrollTag) return null
	const fns: MCFunctionClass[] = []
	const hashes: string[] = []
	for (let i = 0; i < layout.chunks.length; i++) {
		const chunkIndex = i
		const scrollTag = layout.scrollTag
		const slideTag = Label(`presentation.anim_slide_${slideIdx}_${componentIdx}`)
		const chunkValue = buildTextJson(
			layout.chunks[i].content,
			layout.declarations,
			layout.type,
		)
		const fn = MCFunction(`presentation/slides/code_chunk/${scrollTag}/${chunkIndex}`, () => {
			const entitySel = Selector('@e', {
				tag: [scrollTag, slideTag],
			})
			execute.as(entitySel).run.data.modify
				.entity('@s', 'text')
				.set.value(chunkValue as NBTObject)
		})
		fns.push(fn)
		const hash = Bun.hash(JSON.stringify(layout.chunks[i].content))
		hashes.push(hash.toString(16))
	}
	return { frameFns: fns, hashes, state: layout }
}
