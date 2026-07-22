import { MCFunction } from 'sandstone'

import { renderSlides } from './jsx/render'
import styles from './styles.less' with { type: 'text' }

import './menu'

import * as h01 from './headings/1_what_is_a_pre_compiler'
import * as h02 from './headings/2_hello_world'
import * as h03 from './headings/3_advanced_fun_content'
import * as h04 from './headings/4_is_mcfunction_difficult'
import * as h05 from './headings/5_js_ts_experience'
import * as h06 from './headings/6_existing_code'
import * as h07 from './headings/7_abstraction_fatigue'
import * as h08 from './headings/8_very_useful_abstractions'
import * as h09 from './headings/9_benefits_over_options'
import * as h10 from './headings/10_object_oriented'
import * as h11 from './headings/11_learn_and_try'

// Each heading exports `slides: VNode[]`. Flatten them into one ordered
// list — order here is presentation order. Heading 8 + 10 export two
// slides each (intro + deeper dive), so the show runs a little longer
// on those topics without us splitting into separate folders.
const headings = [h01, h02, h03, h04, h05, h06, h07, h08, h09, h10, h11]
const allSlides = headings.flatMap((h) => h.slides)

// Against wall to the north
const PRESENTATION_ORIGIN = [-83, 79, 42] as const
const PRESENTATION_BOUNDS = [18, 11] as const

// Wrap every slide with a shared <style> so the LESS rules apply to h1/p
// wherever they appear in the slide trees.
const scene = await renderSlides(
	allSlides.map((slide) => (
		<>
			{slide}
			<style source={styles} />
		</>
	)),
	{
		origin: PRESENTATION_ORIGIN,
		bounds: PRESENTATION_BOUNDS,
	},
	// Reading-speed timing. Override here if needed.
	{ wpm: 200, bufferSeconds: 3, minSeconds: 6, maxSeconds: 25 },
	MCFunction('sections/presentation/end', () => {}, { onConflict: 'append' })
)

export const { mount, nextSlide, tick, unmount } = scene