// Non-visual JSX elements: `<div>`, `<center>`, `<style>`. They
// participate in the tree (so their children are reached) but
// never produce entities. `isVisible()` returns false; the layout
// pass skips them; `flatWalk` recurses into their children because
// it doesn't filter on visibility.

import { NonVisualComponent } from './non-visual-component'

export type DivProps = {
	id?: string
	class?: string
	children?: any
}

export type CenterProps = {
	children?: any
}

export type StyleProps = {
	source?: string
	children?: any
}

export class DivComponent extends NonVisualComponent {
	readonly type = 'div'
	constructor(props: DivProps = {}, key: any = null) {
		super(props, key)
	}
}

export class CenterComponent extends NonVisualComponent {
	readonly type = 'center'
	constructor(props: CenterProps = {}, key: any = null) {
		super(props, key)
	}
}

export class StyleComponent extends NonVisualComponent {
	readonly type = 'style'
	constructor(props: StyleProps = {}, key: any = null) {
		super(props, key)
	}
}
