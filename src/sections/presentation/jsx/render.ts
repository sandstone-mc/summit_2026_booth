import { MCFunction, type MCFunctionClass, Selector, execute } from 'sandstone'
import { Styles } from './style'
import { DEFAULT_FONT_ID, loadFontMetrics } from './text-metrics'
import { extractText, flatWalk } from './tree'
import { type SlidesTiming } from '../slides'
import { computeSlideScrollSpecs, summonVisibleElements, isTextType, isVisibleType } from './layout'
import { resetScrollIds } from './layout/element'
import { prepareCodeHighlights, prepareImgResources } from './prepare'
import { SlideShow, SCENE_TAG } from './slides'
import { diagnosePlacements, formatIssues } from './diagnose'

export type VNode = { type: any; props: any; key: any }

/** One styled chunk of text inside a text_display. */
export type StyledSegment = {
	text: string
	color?: `#${string}`
	/** Per-segment font override (otherwise inherits from declarations). */
	font?: `${string}:${string}`
}

export type RenderOptions = {
	origin: readonly [number, number, number]
	bounds: readonly [number, number] // [width, height] in meters
}

/** Lifecycle MCFunctions. tick is always no-op in this framework. */
export type Scene = {
	mount: MCFunctionClass<undefined, undefined>
	tick: MCFunctionClass<undefined, undefined>
	unmount: MCFunctionClass<undefined, undefined>
}

/**
 * Multi-slide scene. Carries per-slide primitives that index.tsx (or any
 * downstream code) can call from its own MCFunctions to drive the show on
 * the fly — show/hide individual slides, jump to a slide, or rerender a
 * slide with a fresh JSX tree.
 */
export type SlideScene = Scene & {
	/** Per-slide show primitives — call to make slide N visible. */
	showSlide: MCFunctionClass<undefined, undefined>[]
	/** Per-slide hide primitives. */
	hideSlide: MCFunctionClass<undefined, undefined>[]
	/** Combined: hide every other slide, show slide N. */
	setSlide: (index: number) => MCFunctionClass<undefined, undefined>
	/** Re-spawn slide N's entities from a new JSX tree (keeps the slide tag). */
	rerenderSlide: (index: number, tree: VNode) => MCFunctionClass<undefined, undefined>
	/**
	 * Cancel the auto-advance loop and step forward one slide from the current.
	 * Tracks the visible slide via the `presentation.slide_idx` objective; the
	 * auto-advance loop sets it on each tick, nextSlide reads + increments + wraps.
	 * Re-mount to restore the auto-advance animation from slide 0.
	 */
	nextSlide: MCFunctionClass<undefined, undefined>
	/** The auto-advance loop. Already kicked off by mount; reschedules itself. */
	slideLoop: MCFunctionClass<undefined, undefined>
	/** Display duration (in seconds) for each slide. */
	durations: number[]
	/** Total number of slides. */
	totalSlides: number
}


// ── LESS → styles map ────────────────────────────────────────────

async function compileStyles(lessSource: string): Promise<Styles> {
	return Styles.fromLess(lessSource)
}

// ── Collect passes ───────────────────────────────────────────────

/** Collect LESS source out of `<style>` elements across every tree. */
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

/**
 * Collect every distinct font ID any element could resolve to. We pull
 * the LESS `font` declaration AND the `<code>` default — anything we
 * might render must be loaded into text-metrics before layout starts,
 * since `wrapLines` throws if asked about an unloaded font.
 */
function collectFonts(trees: VNode[], styles: Styles): Set<string> {
	const out = new Set<string>([DEFAULT_FONT_ID])
	for (const tree of trees) {
		for (const { node, path } of flatWalk(tree)) {
			if (!isTextType(node.type)) continue
			const decs = styles.forPath(path)
			if (decs.font) out.add(decs.font)
			else if (node.type === 'code') out.add('monocraft:default')
		}
	}
	return out
}

// ── Single-tree render ──────────────────────────────────────────

export async function render(tree: VNode, options: RenderOptions): Promise<Scene> {
	await loadFontMetrics()
	const elements = flatWalk(tree)

	const lessSource = collectLess([tree])
	const styles = await compileStyles(lessSource)
	await Promise.all([...collectFonts([tree], styles)].map(loadFontMetrics))
	const visible = elements.filter(({ node }) => isVisibleType(node.type))

	// Pre-compute tree-sitter highlights for every `<code>` block. The
	// returned `WeakMap` is captured in `mount`'s closure so the synchronous
	// `summonVisibleElements` call never has to await a parse.
	const codePrecomputed = await prepareCodeHighlights([visible], styles, options.bounds[0], options.bounds[1])

	// Register a `Model` + `ItemModelDefinition` for every distinct `<img>`
	// src so the summon pass can reference them via `minecraft:item_model`.
	const imgResources = await prepareImgResources([tree])

	const mount = MCFunction('presentation/mount', () => {
		summonVisibleElements(visible, styles, options.bounds[0], options.bounds[1], options.origin, [], undefined, codePrecomputed, imgResources, SCENE_TAG)
	})

	const tick = MCFunction('presentation/tick', () => {
		// no-op
	}, { runEveryTick: true })

	const unmount = MCFunction('presentation/unmount', () => {
		execute.run.kill(Selector('@e', { tag: SCENE_TAG }))
	})

	return { mount, tick, unmount }
}

// ── Multi-slide render ──────────────────────────────────────────

/**
 * Multi-slide mode. Each tree in `trees` becomes one slide; entities
 * are summoned at mount (hidden) and tagged `slide_N`. Returns a
 * `SlideScene` with per-slide show/hide/setSlide MCFunctions, a
 * `rerenderSlide` factory, an auto-advance loop, and `nextSlide`.
 * The loop uses sync `sleep()` — Sandstone splits the body at each
 * sleep into chained __sleep child MCFunctions.
 */
export async function renderSlides(
	trees: VNode[],
	options: RenderOptions,
	timing?: SlidesTiming,
): Promise<SlideScene> {
	if (trees.length === 0) throw new Error('renderSlides: at least one slide required')

	await loadFontMetrics()

	const sceneW = options.bounds[0]
	const sceneH = options.bounds[1]

	// Display duration per slide: words/wpm + buffer, clamped.
	const slideTexts = trees.map((t) =>
		flatWalk(t).map(({ node }) => extractText(node.props?.children)).join(' '),
	)
	const styles = await compileStyles(collectLess(trees))
	// Pre-load every font any element could resolve to — wrapLines throws
	// for fonts not loaded yet, and the layout pass is synchronous.
	await Promise.all([...collectFonts(trees, styles)].map(loadFontMetrics))

	// Pre-compute tree-sitter highlights for every `<code>` block; the
	// returned `WeakMap` is captured in mount/rerender closures so the
	// synchronous layout calls never await a parse.
	const slideVisibles = trees.map((t) =>
		flatWalk(t).filter(({ node }) => isVisibleType(node.type)),
	)
	const codePrecomputed = await prepareCodeHighlights(slideVisibles, styles, sceneW, sceneH)
	const imgResources = await prepareImgResources(trees)

	// Off-screen diagnostic — run the placement math per slide once more
	// (no entity emission) to discover elements whose rendered text would
	// extend partially or fully outside the slide. Prints warnings via
	// `console.warn`. Fully off-screen elements are also dropped from
	// `slideVisibles` so SlideShow never summons them. `resetScrollIds()`
	// afterward keeps the scroll-tag sequence stable for SlideShow's own
	// pre-pass + mount emit.
	const allIssues = [] as ReturnType<typeof diagnosePlacements>['issues']
	const excludedBySlide: Set<string>[] = []
	for (let i = 0; i < slideVisibles.length; i++) {
		const { placements } = computeSlideScrollSpecs(
			slideVisibles[i],
			styles,
			sceneW,
			sceneH,
			options.origin,
			codePrecomputed,
			imgResources,
		)
		const result = diagnosePlacements(placements, i, options.origin[1], sceneH)
		allIssues.push(...result.issues)
		excludedBySlide.push(result.excludedNodePaths)
	}
	resetScrollIds()
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
		slide.filter((v) => !excludedBySlide[i].has(JSON.stringify(v.path))),
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
		codePrecomputed,
		imgResources,
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

