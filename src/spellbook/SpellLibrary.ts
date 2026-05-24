import { Data, data, MCFunction, NBT } from "sandstone";

export interface Spell {
    id: string;
    uid: number;
    mana_cost: number;
    name: string;
    description: string;
}

export type SchoolID = "fire" | "ice" | "arcane";

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
    }
}

export const SpellIDS = Data('storage', 'magic:ids');

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