import './ShowcaseState'
import './Selection'

import { execute, Label, MCFunction, rel, Selector, summon, Tag } from "sandstone";

const BOOTH_ENTITY_TAG = 'summit.booth_entity.sandstone_summit_booth';

export const ShowcaseMarkerLabel = Label("showcase.marker")

export const ShowcaseMarker = Selector('@e', {
    type: 'minecraft:marker',
    tag: ShowcaseMarkerLabel
});

const summonMarker = MCFunction('showcase/summon_marker', () => {
    execute.align('xyz').run(() => {
        summon('marker', rel(0, 0, 0), {
            Tags: [`arcane_arts.${ShowcaseMarkerLabel.name}`, BOOTH_ENTITY_TAG, 'summit.static']
        });
    });
})