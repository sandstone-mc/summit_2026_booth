import { _, abs, execute, kill, Label, MCFunction, NBT, particle, raw, rel, Selector, summon, title } from "sandstone";
import { SpellLibrary } from "../spellbook/SpellLibrary";
import { ShowcaseMarker } from ".";
import { STATES, GlobalState, SessionPlayer } from "./ShowcaseState";
import { getSelf, saveSelf, io } from "../PlayerDB";

interface Pedestal {
  schoolId: keyof typeof SpellLibrary;
  x: number;
  y: number;
  z: number;
  color: string;
  particleType: string;
  item: string;
}

const PEDESTALS: Pedestal[] = [
  { schoolId: 'fire',      x: 5,    y: 0, z: 22,   color: 'red',          particleType: 'flame',          item: 'minecraft:blaze_rod' },
  { schoolId: 'ice',       x: 7,    y: 0, z: 21,   color: 'aqua',         particleType: 'snowflake',      item: 'minecraft:blue_ice' },
  { schoolId: 'arcane',    x: 9.6,  y: 0, z: 20.5, color: 'light_purple', particleType: 'portal',         item: 'minecraft:amethyst_shard' },
  { schoolId: 'lightning', x: 12.2, y: 0, z: 21,   color: 'yellow',       particleType: 'electric_spark', item: 'minecraft:lightning_rod' },
  { schoolId: 'nature',    x: 14.2, y: 0, z: 22,   color: 'green',        particleType: 'happy_villager', item: 'minecraft:flowering_azalea' },
];

const PedestalLabel = Label('showcase.pedestal');
const AllPedestals = Selector('@e', { tag: PedestalLabel });

// Per-school click handlers — called by name via raw so not lazy
for (const ped of PEDESTALS) {
  const school = SpellLibrary[ped.schoolId];

  MCFunction(`showcase/selection/select/${ped.schoolId}`, () => {
    // @s here is the interaction entity that was clicked
    raw('data remove entity @s interact');

    execute.as(SessionPlayer).run(() => {
      getSelf();
      io.select('current_school').set(ped.schoolId);
      saveSelf();
    });

    title(SessionPlayer).title([{ text: school.name, color: ped.color, bold: true } as any]);
    title(SessionPlayer).subtitle([{ text: 'School selected!', color: 'gray', italic: true } as any]);

    kill(AllPedestals);
    GlobalState.set(STATES.FIGHTING);
  });
}

// Called from ShowcaseState.startSelection via raw
MCFunction('showcase/selection/spawn_pedestals', () => {
  execute.as(ShowcaseMarker).at('@s').run(() => {
    for (const ped of PEDESTALS) {
      const school = SpellLibrary[ped.schoolId];
      const commonTag = `arcane_arts.${PedestalLabel.name}`;
      const schoolTag = `arcane_arts.showcase.pedestal.${ped.schoolId}`;

      // Floating item at pedestal center
      summon('item_display', rel(ped.x, ped.y + 1.5, ped.z), {
        Tags: [commonTag, schoolTag],
        item: { id: ped.item, count: NBT.int(1) },
        item_display: 'fixed',
        transformation: {
          translation: [NBT.float(0), NBT.float(0), NBT.float(0)],
          left_rotation: [NBT.float(0), NBT.float(0), NBT.float(0), NBT.float(1)],
          scale: [NBT.float(1.5), NBT.float(1.5), NBT.float(1.5)],
          right_rotation: [NBT.float(0), NBT.float(0), NBT.float(0), NBT.float(1)],
        },
        brightness: { sky: NBT.int(15), block: NBT.int(15) },
      });

      // School name label above item
      summon('text_display', rel(ped.x, ped.y + 2.8, ped.z), {
        Tags: [commonTag, schoolTag],
        text: JSON.stringify({ text: school.name, color: ped.color, bold: true }),
        alignment: 'center',
        billboard: 'vertical',
        brightness: { sky: NBT.int(15), block: NBT.int(15) },
        transformation: {
          translation: [NBT.float(0), NBT.float(0), NBT.float(0)],
          left_rotation: [NBT.float(0), NBT.float(0), NBT.float(0), NBT.float(1)],
          scale: [NBT.float(1.2), NBT.float(1.2), NBT.float(1.2)],
          right_rotation: [NBT.float(0), NBT.float(0), NBT.float(0), NBT.float(1)],
        },
      });

      // Clickable hitbox — covers standing player height
      summon('interaction', rel(ped.x, ped.y, ped.z), {
        Tags: [commonTag, schoolTag],
        width: NBT.float(1.0),
        height: NBT.float(2.5),
        response: false,
      });
    }
  });
});

// Runs every tick; only active during SELECTION state
MCFunction('showcase/selection/tick', () => {
  _.if(GlobalState.equalTo(STATES.SELECTION), () => {
    // Ambient particles at each pedestal
    execute.as(ShowcaseMarker).at('@s').run(() => {
      for (const ped of PEDESTALS) {
        particle(ped.particleType as any, rel(ped.x, ped.y + 1.5, ped.z), abs(0.3, 0.5, 0.3), 0.01, 3);
      }
    });

    // Right-click detection per school
    for (const ped of PEDESTALS) {
      raw(`execute as @e[type=minecraft:interaction,tag=arcane_arts.showcase.pedestal.${ped.schoolId},limit=1] if data entity @s {interact:{}} run function arcane_arts:showcase/selection/select/${ped.schoolId}`);
    }

    // Proximity actionbar hints — show school name + prompt when within 2.5 blocks
    for (const ped of PEDESTALS) {
      const school = SpellLibrary[ped.schoolId];
      const actionbarJson = JSON.stringify([
        { text: `* ${school.name} *  `, color: ped.color, bold: true },
        { text: 'Right-click to select', color: 'gray', italic: true },
      ]);
      raw(`execute as @a[tag=arcane_arts.showcase.player,limit=1] at @s if entity @e[type=minecraft:interaction,tag=arcane_arts.showcase.pedestal.${ped.schoolId},distance=..2.5] run title @s actionbar ${actionbarJson}`);
    }
  });
}, { runEveryTick: true });
