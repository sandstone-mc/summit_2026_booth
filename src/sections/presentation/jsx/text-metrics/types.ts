// MC font JSON model — the shapes we read off `providers: [...]`.

export interface BitmapProvider {
	type: 'bitmap'
	file: string
	chars: string[]
	height?: number
	ascent: number
	rowWidths?: number[]
}

export interface ReferenceProvider {
	type: 'reference'
	id: string
	filter?: { uniform?: boolean }
}

export interface SpaceProvider {
	type: 'space'
	advances: Record<string, number>
}

export type FontProvider = BitmapProvider | ReferenceProvider | SpaceProvider

export interface FontJson {
	providers: FontProvider[]
}