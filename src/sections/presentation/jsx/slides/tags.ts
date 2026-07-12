// Scene + slide tagging helpers. The Summit server's Label-tag
// optimization makes pure-tag selectors effectively constant-time and
// catches overflow entities a volume selector would miss.

import { Label, type LabelClass } from 'sandstone'

export const SCENE_TAG = Label('presentation')

/** Tag attached to every entity in slide `index`. */
export function slideTag(index: number): LabelClass {
	return Label(`slide_${index}`)
}

/**
 * Marks every `<code>` chunk (and every other text entity) so the slide
 * show can target text entities distinct from scrolling chunks. Chunks
 * carry `code_scroll_*_c*` tags instead and are managed by the
 * scroll-tick MCFunction.
 */
export const KIND_TEXT_TAG = Label('kind.text')