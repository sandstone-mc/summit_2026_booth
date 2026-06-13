import { Data, data, MCFunction, NBT } from "sandstone";

export interface Spell {
    id: string;
    uid: number;
    mana_cost: number;
    name: string;
    description: string;
}

export type SchoolID = "fire" | "ice" | "arcane" | "lightning" | "nature";

export interface SpellSchool {
    id: SchoolID;
    uid: number;
    name: string;
    description: string;
    spells: { [key in string]: Spell };
}

type SpellLibraryType = {
    [key in SchoolID]: SpellSchool;
};

export const SpellLibrary: SpellLibraryType = {
    "fire": {
        id: "fire",
        uid: 0,
        name: "Fire",
        description: "",
        spells: {
            "firebolt": {
                id: "firebolt",
                uid: 0,
                mana_cost: 10,
                name: "Firebolt",
                description: ""
            },
            "heatwave": {
                id: "heatwave",
                uid: 1,
                mana_cost: 70,
                name: "Heatwave",
                description: ""
            },
            "launch": {
                id: "launch",
                uid: 2,
                mana_cost: 25,
                name: "Launch",
                description: ""
            }
        }
    },
    "ice": {
        id: "ice",
        uid: 1,
        name: "Ice",
        description: "",
        spells: {
            "frostbolt": {
                id: "frostbolt",
                uid: 0,
                mana_cost: 10,
                name: "Frostbolt",
                description: ""
            },
            "blizzard": {
                id: "blizzard",
                uid: 1,
                mana_cost: 50,
                name: "Blizzard",
                description: ""
            }
        }
    },
    "arcane": {
        id: "arcane",
        uid: 2,
        name: "Arcane",
        description: "",
        spells: {
            "magic_missile": {
                id: "magic_missile",
                uid: 0,
                mana_cost: 15,
                name: "Magic Missile",
                description: ""
            },
            "shockwave": {
                id: "shockwave",
                uid: 1,
                mana_cost: 50,
                name: "Shockwave",
                description: ""
            },
            "blink": {
                id: "blink",
                uid: 2,
                mana_cost: 20,
                name: "Blink",
                description: ""
            }
        }
    },
    "lightning": {
        id: "lightning",
        uid: 3,
        name: "Lightning",
        description: "",
        spells: {
            "thunderbolt": {
                id: "thunderbolt",
                uid: 0,
                mana_cost: 15,
                name: "Thunderbolt",
                description: ""
            },
            "ball_lightning": {
                id: "ball_lightning",
                uid: 1,
                mana_cost: 50,
                name: "Ball Lightning",
                description: ""
            },
            "static_field": {
                id: "static_field",
                uid: 2,
                mana_cost: 30,
                name: "Static Field",
                description: ""
            }
        }
    },
    "nature": {
        id: "nature",
        uid: 4,
        name: "Nature",
        description: "",
        spells: {
            "thorn_volley": {
                id: "thorn_volley",
                uid: 0,
                mana_cost: 25,
                name: "Thorn Volley",
                description: ""
            },
            "vine_whip": {
                id: "vine_whip",
                uid: 1,
                mana_cost: 30,
                name: "Vine Whip",
                description: ""
            },
            "entangle": {
                id: "entangle",
                uid: 2,
                mana_cost: 60,
                name: "Entangle",
                description: ""
            }
        }
    }
}

export const SpellIDS = Data('storage', 'arcane_arts:ids');

MCFunction('spellbook/load_spells', () => {
    const schools = SpellIDS.select('schools');

    for (const [ key, value ] of Object.entries(SpellLibrary)) {
        const currentSchool = schools.select(`${value.uid}`);
        currentSchool.select('name').set(key);

        for (const [ spellKey, spellValue ] of Object.entries(value.spells)) {
            currentSchool.select(`spells.${spellValue.uid}`).set(spellKey);
        }
    }
}, {
    runOnLoad: true
});