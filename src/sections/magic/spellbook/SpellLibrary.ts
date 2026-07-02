import { Data, data, MCFunction, NBT } from 'sandstone'

export interface Spell {
    id: string
    uid: number
    mana_cost: number
    name: string
    description: string
}

export type SchoolID = 'fire' | 'ice' | 'arcane' | 'lightning' | 'nature'

export interface SpellSchool {
    id: SchoolID
    uid: number
    name: string
    description: string
    spells: { [key in string]: Spell }
}

type SpellLibraryType = {
    [key in SchoolID]: SpellSchool
}

export const SpellLibrary: SpellLibraryType = {
    'fire': {
        id: 'fire',
        uid: 0,
        name: 'Fire',
        description: 'Scorching magic that burns and blasts',
        spells: {
            'firebolt': {
                id: 'firebolt',
                uid: 0,
                mana_cost: 10,
                name: 'Firebolt',
                description: 'A blazing bolt that deals 2 damage and ignites the target'
            },
            'heatwave': {
                id: 'heatwave',
                uid: 1,
                mana_cost: 70,
                name: 'Heatwave',
                description: 'Erupts a ring of fire bolts in every direction around you'
            },
            'launch': {
                id: 'launch',
                uid: 2,
                mana_cost: 25,
                name: 'Launch',
                description: 'Blasts you forward in your facing direction'
            }
        }
    },
    'ice': {
        id: 'ice',
        uid: 1,
        name: 'Ice',
        description: 'Chilling magic that slows and freezes',
        spells: {
            'frostbolt': {
                id: 'frostbolt',
                uid: 0,
                mana_cost: 10,
                name: 'Frostbolt',
                description: 'An icy bolt that deals 1 damage and freezes the target'
            },
            'blizzard': {
                id: 'blizzard',
                uid: 1,
                mana_cost: 50,
                name: 'Blizzard',
                description: 'Summons a snowstorm that blinds and damages nearby enemies for 10s'
            },
            'frost_nova': {
                id: 'frost_nova',
                uid: 2,
                mana_cost: 25,
                name: 'Frost Nova',
                description: 'Releases a burst of ice dealing 3 damage and freezing targets in front of you'
            }
        }
    },
    'arcane': {
        id: 'arcane',
        uid: 2,
        name: 'Arcane',
        description: 'Arcane forces that home in on targets and break up crowds',
        spells: {
            'magic_missile': {
                id: 'magic_missile',
                uid: 0,
                mana_cost: 15,
                name: 'Magic Missile',
                description: 'A homing bolt that tracks the enemy you\'re looking at when casting'
            },
            'shockwave': {
                id: 'shockwave',
                uid: 1,
                mana_cost: 50,
                name: 'Shockwave',
                description: 'Expanding rings that push and damage nearby enemies'
            },
            'blink': {
                id: 'blink',
                uid: 2,
                mana_cost: 20,
                name: 'Blink',
                description: 'Instantly teleports you up to 7 blocks in your facing direction'
            }
        }
    },
    'lightning': {
        id: 'lightning',
        uid: 3,
        name: 'Lightning',
        description: 'Electric power that stuns and overcharges enemies',
        spells: {
            'thunderbolt': {
                id: 'thunderbolt',
                uid: 0,
                mana_cost: 15,
                name: 'Thunderbolt',
                description: 'Calls a lightning strike at your crosshair, stunning and charging the target'
            },
            'ball_lightning': {
                id: 'ball_lightning',
                uid: 1,
                mana_cost: 50,
                name: 'Ball Lightning',
                description: 'A slow orb that zaps nearby enemies every second, then explodes on impact'
            },
            'static_field': {
                id: 'static_field',
                uid: 2,
                mana_cost: 30,
                name: 'Static Field',
                description: 'Surrounds you with an electric aura that shocks nearby enemies for 10s'
            }
        }
    },
    'nature': {
        id: 'nature',
        uid: 4,
        name: 'Nature',
        description: 'Wild growth that ensnares, pulls, and pierces',
        spells: {
            'thorn_volley': {
                id: 'thorn_volley',
                uid: 0,
                mana_cost: 25,
                name: 'Thorn Volley',
                description: 'Fires 5 thorns in a spread cone, each dealing 2 damage and entangling'
            },
            'vine_whip': {
                id: 'vine_whip',
                uid: 1,
                mana_cost: 10,
                name: 'Vine Whip',
                description: 'Launches a vine that pushes struck enemies away from you'
            },
            'entangle': {
                id: 'entangle',
                uid: 2,
                mana_cost: 60,
                name: 'Entangle',
                description: 'Roots enemies in an area, slowing movement and dealing damage over time'
            }
        }
    }
}

export const SpellIDS = Data('storage', 'sandstone_summit_booth:ids')

MCFunction('sections/magic/spellbook/load_spells', () => {
    const schools = SpellIDS.select('schools')

    for (const [ key, value ] of Object.entries(SpellLibrary)) {
        const currentSchool = schools.select(`${value.uid}`)
        currentSchool.select('name').set(key)

        for (const [ spellKey, spellValue ] of Object.entries(value.spells)) {
            currentSchool.select(`spells.${spellValue.uid}`).set(spellKey)
        }
    }
}, {
    runOnLoad: true
})