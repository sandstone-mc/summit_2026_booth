import './ShowcaseState'
import './Selection'

import { execute, kill, Label, MCFunction, rel, Selector, summon } from 'sandstone'

const BOOTH_ENTITY_TAG = 'summit.booth_entity.sandstone_summit_booth'

export const ShowcaseMarkerLabel = Label('showcase.marker')

export const ShowcaseMarker = Selector('@e', {
    type: 'minecraft:marker',
    tag: ShowcaseMarkerLabel
})

export const summonMarker = MCFunction('sections/magic/showcase/summon_marker', () => {
    execute.align('xyz').run(() => {
        summon('marker', rel(0, 0, 0), {
            Tags: [`sandstone_summit_booth.${ShowcaseMarkerLabel.name}`, BOOTH_ENTITY_TAG, 'summit.static']
        })
    })
})

export const killMarker = MCFunction('sections/magic/showcase/kill_marker', () => {
    kill(ShowcaseMarker)
})