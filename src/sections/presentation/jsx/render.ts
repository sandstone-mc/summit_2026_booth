// Render entry points — single-tree (`render`) and multi-slide
// (`renderSlides`). The framework:
//   1. Walks the tree, collecting visible VNodes + per-tree LESS.
//   2. Builds `Styles` + pre-loads fonts.
//   3. Runs each Component's `prepare()` (grammar fetch, fs walks,
//      image buffers, …). The framework iterates registered classes
//      once per render pass.
//   4. Drives SlideShow, which bakes per-frame MCFunctions and wires
//      the per-slide tick + summon pass.

import { MCFunction, type MCFunctionClass, Selector, execute, Label, type LabelClass } from 'sandstone'
import { Styles } from './style'
import { DEFAULT_FONT_ID, loadFontMetrics, wrapToLines } from './text-metrics'
import { extractText, flatWalk } from './tree'
import { type SlidesTiming } from '../slides'
import { computeSlideFrameSpecs, summonVisibleElements } from './layout'
import { SlideShow, SCENE_TAG, slideTag } from './slides'
import { diagnosePlacements, filterVisibleByVNode, formatIssues } from './diagnose'
import { ComponentBase, type PrepareCtx, type PrecomputedBag } from './components/base'
import { prepareRowFlexWidths, RowFlexWidth } from './layout/row-flex'
import type { NodeWithPath } from './tree/walk'

// VNode = ComponentBase instance. JSX runtime instantiates the
// component class per JSX use; the class instance carries `type`,
// `props`, `key` plus framework methods.
export type VNode = ComponentBase

export type StyledSegment = {
	text: string
	color?: `#${string}`
	font?: `${string}:${string}`
	bold?: boolean
	italic?: boolean
	background?: `#${string}`
}

export type RenderOptions = {
	origin: readonly [number, number, number]
	bounds: readonly [number, number]
}

export type Scene = {
	mount: MCFunctionClass<undefined, undefined>
	tick: MCFunctionClass<undefined, undefined>
	unmount: MCFunctionClass<undefined, undefined>
}

export type SlideScene = Scene & {
	showSlide: MCFunctionClass<undefined, undefined>[]
	hideSlide: MCFunctionClass<undefined, undefined>[]
	setSlide: (index: number) => MCFunctionClass<undefined, undefined>
	rerenderSlide: (index: number, tree: VNode) => MCFunctionClass<undefined, undefined>
	nextSlide: MCFunctionClass<undefined, undefined>
	slideLoop: MCFunctionClass<undefined, undefined>
	durations: number[]
	totalSlides: number
}

async function compileStyles(lessSource: string): Promise<Styles> {
	return Styles.fromLess(lessSource)
}

function collectLess(trees: VNode[]): string {
	return trees
		.flatMap((t) => flatWalk(t))
		.filter(({ node }) => node.type === 'style')
		.map(({ node }) => {
			if (typeof node.props?.source === 'string') return node.props.source
			return extractText(node.props?.children)
		})
		.filter(Boolean)
		.join('\n')
}

function collectFonts(trees: VNode[], styles: Styles): Set<string> {
	const out = new Set<string>([DEFAULT_FONT_ID])
	for (const tree of trees) {
		for (const { node, path } of flatWalk(tree)) {
			if (!node.isVisible()) continue
			if (node.type === 'code' || node.type === 'explorer' || node.type === 'autocomplete') {
				out.add('sandstone_summit_booth:monospace')
				continue
			}
			const text = extractText(node.props?.children)
			if (text && /`/.test(text)) out.add('sandstone_summit_booth:monospace')
			const decs = styles.forPath(path)
			if (decs.font) out.add(decs.font)
		}
	}
	return out
}

// Run each registered Component class's `prepare()` once per render
// pass. Each component filters `visiblePerSlide` to its own type and
// runs its async prep (grammar fetch, fs walk, image buffer read).
// Returns a Map of component-type → result that the layout pass reads.
async function runPreparePass(
	visiblePerSlide: readonly NodeWithPath[][],
	styles: Styles,
	sceneW: number,
	sceneH: number,
	rowFlexWidths: WeakMap<VNode, RowFlexWidth>,
): Promise<PrecomputedBag> {
	const results: PrecomputedBag = {}
	const seenKeys = new Set<string>()

	const preparing: Promise<void>[] = []

	// Each Component instance carries `type: string | ComponentConstructor`.
	// For intrinsic JSX types (e.g. `<code>`, `<h1>`) `type` is the
	// string `'code'` / `'h1'`. For custom component classes, `type`
	// is the class constructor. We key the precomputed bag on the
	// JSX type string, falling back to the class name for custom
	// components.
	const classKey = (node: any): string => {
		return (typeof node.type === 'string' ? node.type : node.constructor.name).toLowerCase()
	}

	for (const visible of visiblePerSlide) {
		for (const nw of visible) {
			const key = classKey(nw.node) as keyof PrecomputedBag
			if (seenKeys.has(key)) continue
			seenKeys.add(key)
			if (nw.node.prepare === undefined) continue

			// Pre-filter the visible list to nodes of THIS component's
			// type so prepare() doesn't have to re-filter internally.
			const ownType = nw.node.type
			preparing.push((async () => {
				const filtered = visiblePerSlide
					.map((slide) => slide.filter((n) => n.node.type === ownType))
				const ctx: PrepareCtx = {
					visiblePerSlide: filtered,
					styles,
					sceneW,
					sceneH,
					rowFlexWidths,
					result: undefined,
				}
				try {
					await nw.node.prepare!(ctx)
					/** @ts-ignore // TODO: After finishing the refactor see if we can fix this */
					results[key] = ctx.result as typeof results[typeof key]
				} catch (e) {
					console.log(`[sandstone-jsx] ${nw.node.constructor.name}#prepare failed: ${e}`)
				}
			})())
		}
	}
	await Promise.allSettled(preparing)
	return results
}

export async function render(tree: VNode, options: RenderOptions): Promise<Scene> {
	await loadFontMetrics()
	const elements = flatWalk(tree)

	const lessSource = collectLess([tree])
	const styles = await compileStyles(lessSource)
	await Promise.all([...collectFonts([tree], styles)].map(loadFontMetrics))
	const visible = elements.filter(({ node }) => node.isVisible())

	const rowFlexWidths = prepareRowFlexWidths([visible], styles, options.bounds[0])
	const preResults = await runPreparePass([visible], styles, options.bounds[0], options.bounds[1], rowFlexWidths)

	const mount = MCFunction('presentation/mount', () => {
		summonVisibleElements(
			visible, styles,
			options.bounds[0], options.bounds[1],
			options.origin,
			SCENE_TAG, [], undefined,
			rowFlexWidths,
			preResults,
		)
	})

	const tick = MCFunction('presentation/tick', () => {}, { runEveryTick: true })

	const unmount = MCFunction('presentation/unmount', () => {
		execute.run.kill(Selector('@e', { tag: SCENE_TAG }))
	})

	return { mount, tick, unmount }
}

export async function renderSlides(
	trees: VNode[],
	options: RenderOptions,
	timing?: SlidesTiming,
): Promise<SlideScene> {
	if (trees.length === 0) throw new Error('renderSlides: at least one slide required')

	await loadFontMetrics()

	const sceneW = options.bounds[0]
	const sceneH = options.bounds[1]

	const slideTexts = trees.map((t) =>
		flatWalk(t).map(({ node }) => extractText(node.props?.children)).join(' '),
	)
	const styles = await compileStyles(collectLess(trees))
	await Promise.all([...collectFonts(trees, styles)].map(loadFontMetrics))

	const slideVisibles = trees.map((t) =>
		flatWalk(t).filter(({ node }) => node.isVisible()),
	)
	const rowFlexWidths = prepareRowFlexWidths(slideVisibles, styles, sceneW)
	const preResults = await runPreparePass(slideVisibles, styles, sceneW, sceneH, rowFlexWidths)

	const allIssues = [] as ReturnType<typeof diagnosePlacements>['issues']
	const excludedBySlide: Set<VNode>[] = []
	for (let i = 0; i < slideVisibles.length; i++) {
		const { placements } = computeSlideFrameSpecs(
			slideVisibles[i],
			styles,
			sceneW,
			sceneH,
			options.origin,
			slideTag(i),
			rowFlexWidths,
			preResults,
		)
		const result = diagnosePlacements(placements, i, options.origin[0], options.origin[1], sceneW, sceneH)
		allIssues.push(...result.issues)
		excludedBySlide.push(result.excludedVNodes)
		if (process.env.DEBUG_JSX_SLIDES) {
			const summary = placements
				.map((p) => {
					const el: any = p.el
					const txt = (el.content ?? el.imgSrc ?? '').toString().slice(0, 60).replace(/\n/g, ' ')
					return `${el.type}:${el.cellH.toFixed(3)}:"${txt}"`
				})
				.join(' | ')
			console.log(`[slide-debug] slide=${i} ${summary}`)
		}
		if (process.env.DEBUG_JSX_LAYOUT) {
			const sceneBottom = options.origin[1]
			const sceneTop = options.origin[1] + sceneH
			console.log(`[jsx-debug] slide=${i} sceneY=[${sceneBottom}, ${sceneTop}]`)
			for (const p of placements) {
				const el: any = p.el
				const lines = el.wrapBreaksApplied !== undefined
					? (el.wrapBreaksApplied.length === 0 ? 1 : el.wrapBreaksApplied.length + 1)
					: (el.kind === 'text' ? 'wrapLines' : 1)
				const preview = (el.content ?? el.imgSrc ?? '').toString().slice(0, 50)
				console.log(
					`  type=${el.type} y=${p.y.toFixed(3)} cellH=${el.cellH.toFixed(3)} ` +
					`marginTop=${el.marginTop.toFixed(3)} marginBot=${el.marginBottom.toFixed(3)} ` +
					`scalePx=${el.scalePx} lines=${lines} "${preview}"`,
				)
				if (process.env.DEBUG_JSX_WRAP && el.kind === 'text' && /^h[123]$/.test(el.type)) {
					const wrapWidthPx =
						(el.width?.px ?? Number.POSITIVE_INFINITY) * el.widthCompensation
					const bold =
						el.type === 'h1' || el.type === 'h2' || el.declarations?.bold === 'true'
					const wrapped = wrapToLines(el.content, wrapWidthPx, bold, el.fontId)
					console.log(
						`    [wrap] type=${el.type} scalePx=${el.scalePx} line_width=${Math.round(wrapWidthPx)} ` +
						`bold=${bold} -> ${wrapped.length} line(s):`,
					)
					for (const ln of wrapped) console.log(`      | ${ln}`)
				}
			}
		}
	}
	if (allIssues.length > 0) {
		const fullyOff = allIssues.filter((i) => i.kind === 'full')
		const partial = allIssues.filter((i) => i.kind === 'partial')
		if (partial.length > 0) {
			console.warn(
				`\n[sandstone-jsx] [WARN] ${partial.length} element(s) partially off-screen (rendered but clipped):\n${formatIssues(partial)}\n`,
			)
		}
		if (fullyOff.length > 0) {
			console.warn(
				`[sandstone-jsx] [WARN] ${fullyOff.length} element(s) fully off-screen — REMOVED from output (no summon command emitted):\n${formatIssues(fullyOff)}\n`,
			)
		}
	}
	const filteredSlideVisibles = slideVisibles.map((slide, i) =>
		filterVisibleByVNode(slide, excludedBySlide[i]),
	)

	const show = new SlideShow({
		trees,
		slideVisibles: filteredSlideVisibles,
		sceneW,
		sceneH,
		origin: options.origin,
		styles,
		slideTexts,
		timing,
		rowFlexWidths,
		preResults,
	})

	return {
		mount: show.mount,
		tick: show.tick,
		unmount: show.unmount,
		showSlide: show.showSlide,
		hideSlide: show.hideSlide,
		setSlide: (i) => show.setSlide(i),
		rerenderSlide: (i, tree) => show.rerenderSlide(i, tree),
		nextSlide: show.nextSlide,
		slideLoop: show.slideLoopFn,
		durations: show.durations,
		totalSlides: show.totalSlides,
	}
}