// JSX runtime — converts intrinsic element types to their Component
// classes (the class instance IS the VNode). Function/class types
// are instantiated directly. Plain element types (no associated
// component class — `<style>`, `<center>`) fall through to a tagged
// object so the framework can recognize them as passthroughs.

import { H1Component, H2Component, H3Component } from './components/prose/header-components'
import { ParagraphComponent } from './components/prose/paragraph-component'
import { CodeComponent } from './components/code/code-component'
import { ExplorerComponent } from './components/explorer/explorer-component'
import { AutocompleteComponent } from './components/autocomplete/autocomplete-component'
import { ImageComponent } from './components/image/image-component'
import { DivComponent, CenterComponent, StyleComponent } from './components/non-visual-components'
import type { ComponentLayoutBase, LayoutCtx, PrepareCtx, SummonCtx } from './components/base'

type GetConstructorArgs<T> = T extends new (...args: infer U) => any ? U : never
export class Set<T> extends global.Set<T> {
  // oxlint-disable-next-line
  constructor(...args: GetConstructorArgs<typeof global.Set<T>>) {
    super(...args)
  }

  // TODO: Swap for Sandstone's Set once it has the `value is T`
  has(value: unknown): value is T {
    return super.has(value as any)
  }
}

type ComponentConstructor = new (props: any, key: any) => any

// Build the intrinsic-string → Component class table at module load.
// Components don't register themselves; the runtime imports each
// and constructs the lookup once.
const INTRINSIC_COMPONENTS = {
	h1: H1Component,
	h2: H2Component,
	h3: H3Component,
	p: ParagraphComponent,
	code: CodeComponent,
	explorer: ExplorerComponent,
	autocomplete: AutocompleteComponent,
	img: ImageComponent,
	div: DivComponent,
	center: CenterComponent,
	style: StyleComponent,
} as const

declare global {
	namespace JSX {
		// Mirrors ComponentBase
		interface Element {
			type: keyof IntrinsicComponent | ComponentConstructor
			props: any
			key: any
			isVisible: () => boolean
			computeLayout: (_ctx: LayoutCtx) => ComponentLayoutBase
			summon: (_ctx: SummonCtx) => void
			prepare?: (_ctx: PrepareCtx) => Promise<void>
		}
	}
}

const INTRINSIC_COMPONENT_NAMES = new Set(Object.keys(INTRINSIC_COMPONENTS)) as Set<keyof typeof INTRINSIC_COMPONENTS>

type IntrinsicComponent = typeof INTRINSIC_COMPONENTS

// Custom helper to infer instance types safely without triggering constraints
type GetInstance<T> = T extends new (...args: any[]) => infer R ? R : never;

export function jsx<Component extends keyof IntrinsicComponent | ComponentConstructor>(
	componentType: Component,
	// Improved typing: correctly extracts props if a class constructor is passed directly
	props: Component extends keyof IntrinsicComponent 
		? GetConstructorArgs<IntrinsicComponent[Component]>[0] 
		: Component extends ComponentConstructor 
			? GetConstructorArgs<Component>[0] 
			: never,
	key: any
): Component extends keyof IntrinsicComponent
	? GetInstance<IntrinsicComponent[Component]>
	: GetInstance<Component> {
		
	if (typeof componentType === 'string' && INTRINSIC_COMPONENT_NAMES.has(componentType)) {
		const Cls = INTRINSIC_COMPONENTS[componentType] as IntrinsicComponent[Extract<Component, keyof IntrinsicComponent>]
		// Cast to `any` bypasses the unresolved conditional return type limitation
		return new Cls(props, key) as any;
	}

	if (typeof componentType === 'function') {
		return new componentType(props ?? {}, key) as any;
	}

	// Passthrough — `<div>`, `<style>`, `<center>`, etc. Return a
	// plain tag object so the framework's `flatWalk` recurses into
	// children. The `ComponentBase.isVisible()` default returns false
	// for these objects, so they don't show up in the layout pass.
	return { type: componentType, props: props ?? {}, key } as any;
}

export const jsxs = jsx;

// Dev-mode JSX transform calls `jsxDEV` with extra debug args that are ignored.
export function jsxDEV<Component extends keyof IntrinsicComponent | ComponentConstructor>(
	type: Component,
	props: Component extends keyof IntrinsicComponent 
		? GetConstructorArgs<IntrinsicComponent[Component]>[0] 
		: Component extends ComponentConstructor 
			? GetConstructorArgs<Component>[0] 
			: any,
	key: any
) {
	return jsx(type, props, key);
}

// Fragment — instantiable class so the JSX runtime can construct
// it via `new Fragment(props, key)`. The instance acts as a VNode
// passthrough (isVisible false, children inlined by the JSX
// transform's `<>...</>` syntax into `props.children`). The
// framework's `flatWalk` recurses into `props.children`.
export class Fragment {
	readonly type = 'fragment'
	constructor(public readonly props: { children?: any } = {}, public readonly key: any = null) {}
	isVisible(): boolean { return false }
	computeLayout(): never {
		throw new Error('fragment: computeLayout should not be called')
	}
	summon(): never {
		throw new Error('fragment: summon should not be called')
	}
}
