import { Objective } from "sandstone";
import { SchoolID } from "../spellbook/SpellLibrary";

const SelectedSchool = Objective.create('showcase.school', 'dummy');

interface Pedestal {
    schoolId: SchoolID;
    x: number;
    y: number;
    z: number;
    color: string;
    particle: string;
}

const PEDESTALS: Pedestal[] = [
  { schoolId: 'fire',      x: 0, y: 0, z: 0, color: 'red',          particle: 'flame' },
  { schoolId: 'ice',       x: 0, y: 0, z: 0, color: 'aqua',         particle: 'snowflake' },
  { schoolId: 'arcane',    x: 0, y: 0, z: 0, color: 'light_purple',  particle: 'portal' },
];