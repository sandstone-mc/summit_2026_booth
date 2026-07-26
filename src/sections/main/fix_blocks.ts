import { _, execute, fill, Label, MCFunction, raw, rel, setblock } from 'sandstone'

// @extract-blocks:positionsPalette
const positionsPalette = [
  { name: 'minecraft:black_wall_banner', states: { facing: 'east' }, nbt: { components: {}, patterns: [{ color: 'yellow', pattern: 'minecraft:flower' }, { color: 'yellow', pattern: 'minecraft:circle' }, { color: 'orange', pattern: 'minecraft:creeper' }, { color: 'yellow', pattern: 'minecraft:creeper' }, { color: 'orange', pattern: 'minecraft:half_horizontal_bottom' }, { color: 'yellow', pattern: 'minecraft:half_horizontal_bottom' }] } },
  { name: 'minecraft:black_wall_banner', states: { facing: 'west' }, nbt: { components: {}, patterns: [{ color: 'yellow', pattern: 'minecraft:flower' }, { color: 'yellow', pattern: 'minecraft:circle' }, { color: 'orange', pattern: 'minecraft:creeper' }, { color: 'yellow', pattern: 'minecraft:creeper' }, { color: 'orange', pattern: 'minecraft:half_horizontal_bottom' }, { color: 'yellow', pattern: 'minecraft:half_horizontal_bottom' }] } },
  { name: 'minecraft:black_wall_banner', states: { facing: 'south' }, nbt: { components: {}, patterns: [{ color: 'yellow', pattern: 'minecraft:flower' }, { color: 'yellow', pattern: 'minecraft:circle' }, { color: 'orange', pattern: 'minecraft:creeper' }, { color: 'yellow', pattern: 'minecraft:creeper' }, { color: 'orange', pattern: 'minecraft:half_horizontal_bottom' }, { color: 'yellow', pattern: 'minecraft:half_horizontal_bottom' }] } },
] as const
// @extract-blocks:end

// @extract-blocks:positions
const positions = [
  [19, -18, -45, 0],
  [21, -18, -45, 1],
  [48, -16, -31, 2],
  [51, -16, -31, 2],
  [12, -15, -35, 1],
  [24, -15, -23, 2],
  [27, -6, -39, 2],
  [32, -6, -39, 2],
  [45, -5, -37, 1],
  [45, -5, -34, 1],
  [45, 4, -37, 1],
  [45, 4, -34, 1],
  [9, 4, -28, 1],
  [17, 5, -23, 0],
  [49, 5, -23, 1],
  [21, 12, -28, 1],
  [22, 12, -20, 1],
  [41, 13, -28, 2],
  [44, 13, -25, 1],
  [32, 13, -13, 2],
  [38, 13, -12, 2],
] as const
// @extract-blocks:end

const fix_blocks = MCFunction('sections/main/fix_blocks/inner', () => {
  // TODO: Sandstone bug, missing `air` and fill flags
  raw('fill ~28 ~-6 ~-39 ~31 ~-7 ~-39 air strict')

  for (const [x, y, z, state] of positions) {
    const block = positionsPalette[state]
    // TODO: Sandstone bug, NBT fields need to allow readonly type data
    /* @ts-ignore */
    setblock(rel(x, y, z), block.name, block.states, block.nbt, 'strict')
  }
})

MCFunction('sections/main/fix_blocks', () => {
  _.if(_.entity(Label('main.fix_blocks.relative')('@s').selector), () => {
    fix_blocks()
  }).else(() => {
    execute.positioned([-104, 83, 81]).run(() => fix_blocks())
  })
})
