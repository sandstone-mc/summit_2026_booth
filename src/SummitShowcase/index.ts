import './ShowcaseState'
import './Selection'

import { execute, Label, MCFunction, rel, Selector, summon } from "sandstone";

export const ShowcaseMarkerLabel = Label("showcase.marker")

export const ShowcaseMarker = Selector('@e', {
    type: 'minecraft:marker',
    tag: ShowcaseMarkerLabel
});

MCFunction('showcase/summon_marker', () => {
    execute.align('xyz').run(() => {
        summon('marker', rel(0, 0, 0), {
            Tags: [ `arcane_arts.${ShowcaseMarkerLabel.name}` ]
        });
    })
})