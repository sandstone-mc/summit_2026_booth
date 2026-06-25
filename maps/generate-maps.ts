import { writeFileSync } from 'fs'
import * as nbt from 'prismarine-nbt'
import * as zlib from 'zlib'

const W = 21, H = 10, D = 41

type Block = { Name: string; Properties?: Record<string, string> }

function buildStructureNbt(blocks: Block[][][]): Buffer {
  const palette: Block[] = []
  const paletteMap = new Map<string, number>()

  function getPaletteIndex(block: Block): number {
    const key = block.Name + JSON.stringify(block.Properties ?? {})
    if (paletteMap.has(key)) return paletteMap.get(key)!
    const idx = palette.length
    palette.push(block)
    paletteMap.set(key, idx)
    return idx
  }

  const AIR: Block = { Name: 'minecraft:air' }
  getPaletteIndex(AIR)

  const blockList: { pos: [number, number, number]; state: number }[] = []

  for (let y = 0; y < H; y++) {
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const b = blocks[y]?.[z]?.[x] ?? AIR
        blockList.push({ pos: [x, y, z], state: getPaletteIndex(b) })
      }
    }
  }

  const nbtPalette = palette.map(b => {
    const entry: Record<string, any> = {
      Name: { type: 'string', value: b.Name },
    }
    if (b.Properties) {
      const props: Record<string, any> = {}
      for (const [k, v] of Object.entries(b.Properties)) {
        props[k] = { type: 'string', value: v }
      }
      entry.Properties = { type: 'compound', value: props }
    }
    return entry
  })

  const nbtBlocks = blockList.map(b => ({
    pos: { type: 'list' as const, value: { type: 'int' as const, value: [...b.pos] } },
    state: { type: 'int' as const, value: b.state },
  }))

  const root = {
    name: '',
    type: 'compound' as const,
    value: {
      size: { type: 'list' as const, value: { type: 'int' as const, value: [W, H, D] } },
      palette: { type: 'list' as const, value: { type: 'compound' as const, value: nbtPalette } },
      blocks: { type: 'list' as const, value: { type: 'compound' as const, value: nbtBlocks } },
      entities: { type: 'list' as const, value: { type: 'end' as const, value: [] } },
      DataVersion: { type: 'int' as const, value: 4671 },
    },
  }

  const written = nbt.writeUncompressed(root as any)
  return zlib.gzipSync(Buffer.from(written))
}

function fill3d(): Block[][][] {
  return Array.from({ length: H }, () =>
    Array.from({ length: D }, () =>
      Array.from({ length: W }, (): Block => ({ Name: 'minecraft:air' }))
    )
  )
}

function set(grid: Block[][][], x: number, y: number, z: number, block: Block) {
  if (y >= 0 && y < H && z >= 0 && z < D && x >= 0 && x < W) {
    grid[y][z][x] = block
  }
}

function fillRange(grid: Block[][][], x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, block: Block) {
  for (let y = Math.max(0, y1); y <= Math.min(H - 1, y2); y++)
    for (let z = Math.max(0, z1); z <= Math.min(D - 1, z2); z++)
      for (let x = Math.max(0, x1); x <= Math.min(W - 1, x2); x++)
        grid[y][z][x] = block
}

const LANE_X = 8
const LANE_Z = 10
const LANE_WIDTH = 5
const LANE_MARGIN = 1

function clearLane(grid: Block[][][]) {
  fillRange(grid, LANE_X - LANE_MARGIN, 1, 0, LANE_X + LANE_WIDTH - 1 + LANE_MARGIN, H - 1, D - 1, { Name: 'minecraft:air' })
  fillRange(grid, LANE_X, 0, LANE_Z, LANE_X + LANE_WIDTH - 1, 0, LANE_Z, { Name: 'minecraft:gold_block' })
}

function generateNeonCity(): Block[][][] {
  const g = fill3d()
  const FLOOR = { Name: 'minecraft:black_concrete' }
  const GLOW_CYAN = { Name: 'minecraft:cyan_stained_glass' }
  const GLOW_PURPLE = { Name: 'minecraft:purple_stained_glass' }
  const OBSIDIAN = { Name: 'minecraft:obsidian' }
  const SEA_LANTERN = { Name: 'minecraft:sea_lantern' }
  const AMETHYST = { Name: 'minecraft:amethyst_block' }
  const DEEPSLATE = { Name: 'minecraft:polished_deepslate' }

  fillRange(g, 0, 0, 0, W - 1, 0, D - 1, FLOOR)

  const towers = [
    { x: 3, z: 3, w: 3, d: 3, h: 7, mat: OBSIDIAN, accent: GLOW_CYAN },
    { x: 28, z: 2, w: 4, d: 3, h: 9, mat: DEEPSLATE, accent: GLOW_PURPLE },
    { x: 8, z: 15, w: 3, d: 4, h: 6, mat: OBSIDIAN, accent: GLOW_CYAN },
    { x: 25, z: 16, w: 3, d: 3, h: 8, mat: DEEPSLATE, accent: GLOW_PURPLE },
    { x: 15, z: 1, w: 5, d: 3, h: 5, mat: OBSIDIAN, accent: GLOW_CYAN },
    { x: 15, z: 17, w: 4, d: 3, h: 7, mat: DEEPSLATE, accent: GLOW_PURPLE },
  ]

  for (const t of towers) {
    fillRange(g, t.x, 1, t.z, t.x + t.w - 1, t.h, t.z + t.d - 1, t.mat)
    fillRange(g, t.x, t.h, t.z, t.x + t.w - 1, t.h, t.z + t.d - 1, t.accent)
    for (let y = 2; y < t.h; y += 2) {
      set(g, t.x, y, t.z, t.accent)
      set(g, t.x + t.w - 1, y, t.z + t.d - 1, t.accent)
    }
  }

  for (let x = 0; x < W; x += 7) {
    set(g, x, 0, 0, SEA_LANTERN)
    set(g, x, 0, D - 1, SEA_LANTERN)
  }
  for (let z = 0; z < D; z += 7) {
    set(g, 0, 0, z, SEA_LANTERN)
    set(g, W - 1, 0, z, SEA_LANTERN)
  }

  fillRange(g, 0, 1, 0, W - 1, 1, 0, AMETHYST)
  fillRange(g, 0, 1, D - 1, W - 1, 1, D - 1, AMETHYST)

  clearLane(g)
  return g
}

function generateCrystalCave(): Block[][][] {
  const g = fill3d()
  const FLOOR = { Name: 'minecraft:deepslate_tiles' }
  const WALL = { Name: 'minecraft:deepslate_bricks' }
  const CALCITE = { Name: 'minecraft:calcite' }
  const AMETHYST = { Name: 'minecraft:amethyst_block' }
  const BUDDING = { Name: 'minecraft:budding_amethyst' }
  const TUFF = { Name: 'minecraft:tuff' }
  const CANDLE = { Name: 'minecraft:purple_candle', Properties: { candles: '4', lit: 'true', waterlogged: 'false' } }

  fillRange(g, 0, 0, 0, W - 1, 0, D - 1, FLOOR)

  fillRange(g, 0, 1, 0, W - 1, 5, 0, WALL)
  fillRange(g, 0, 1, D - 1, W - 1, 5, D - 1, WALL)
  fillRange(g, 0, 1, 0, 0, 5, D - 1, WALL)
  fillRange(g, W - 1, 1, 0, W - 1, 5, D - 1, WALL)
  fillRange(g, 0, 6, 0, W - 1, 9, D - 1, WALL)

  fillRange(g, 1, 1, 1, W - 2, 5, D - 2, { Name: 'minecraft:air' })
  fillRange(g, 1, 6, 1, W - 2, 8, D - 2, { Name: 'minecraft:air' })

  for (let x = 3; x < W - 3; x += 6) {
    for (let z = 3; z < D - 3; z += 6) {
      fillRange(g, x, 1, z, x + 1, 4, z + 1, CALCITE)
      set(g, x, 5, z, AMETHYST)
      set(g, x + 1, 5, z + 1, BUDDING)
    }
  }

  const stalactites = [[5, 14], [10, 5], [17, 10], [22, 16], [30, 8], [14, 18], [26, 3], [8, 10]]
  for (const [sx, sz] of stalactites) {
    if (sx >= 1 && sx < W - 1 && sz >= 1 && sz < D - 1) {
      for (let y = 8; y >= 6; y--) set(g, sx, y, sz, AMETHYST)
      set(g, sx, 6, sz, BUDDING)
    }
  }

  for (let x = 5; x < W - 3; x += 9) {
    set(g, x, 0, Math.floor(D / 2), { Name: 'minecraft:sea_lantern' })
  }

  const candleSpots = [[3, 3], [12, 8], [20, 15], [28, 5], [7, 17], [32, 12]]
  for (const [cx, cz] of candleSpots) {
    if (cx < W && cz < D) set(g, cx, 1, cz, CANDLE)
  }

  clearLane(g)
  return g
}

function generateVoidArena(): Block[][][] {
  const g = fill3d()
  const FLOOR_A = { Name: 'minecraft:gray_concrete' }
  const FLOOR_B = { Name: 'minecraft:black_concrete' }
  const END_STONE = { Name: 'minecraft:end_stone_bricks' }
  const PURPUR = { Name: 'minecraft:purpur_block' }
  const PILLAR = { Name: 'minecraft:purpur_pillar', Properties: { axis: 'y' } }
  const END_ROD = { Name: 'minecraft:end_rod', Properties: { facing: 'up' } }
  const MAGENTA_GLASS = { Name: 'minecraft:magenta_stained_glass' }

  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
      set(g, x, 0, z, (x + z) % 2 === 0 ? FLOOR_A : FLOOR_B)
    }
  }

  const pillars = [
    [2, 2], [2, D - 3], [W - 3, 2], [W - 3, D - 3],
    [Math.floor(W / 2), 2], [Math.floor(W / 2), D - 3],
  ]
  for (const [px, pz] of pillars) {
    for (let y = 1; y <= 8; y++) set(g, px, y, pz, PILLAR)
    set(g, px, 9, pz, END_ROD)
    set(g, px - 1, 8, pz, MAGENTA_GLASS)
    if (px + 1 < W) set(g, px + 1, 8, pz, MAGENTA_GLASS)
    set(g, px, 8, Math.max(0, pz - 1), MAGENTA_GLASS)
    set(g, px, 8, Math.min(D - 1, pz + 1), MAGENTA_GLASS)
  }

  fillRange(g, 0, 0, 0, W - 1, 0, 0, END_STONE)
  fillRange(g, 0, 0, D - 1, W - 1, 0, D - 1, END_STONE)
  fillRange(g, 0, 0, 0, 0, 0, D - 1, END_STONE)
  fillRange(g, W - 1, 0, 0, W - 1, 0, D - 1, END_STONE)

  fillRange(g, 0, 1, 0, W - 1, 1, 0, PURPUR)
  fillRange(g, 0, 1, D - 1, W - 1, 1, D - 1, PURPUR)

  fillRange(g, Math.floor(W / 2) - 2, 1, Math.floor(D / 2) - 2,
    Math.floor(W / 2) + 2, 1, Math.floor(D / 2) + 2, END_STONE)
  set(g, Math.floor(W / 2), 2, Math.floor(D / 2), END_ROD)

  clearLane(g)
  return g
}

const maps = [
  { name: 'Neon City', file: 'neon_city.nbt', gen: generateNeonCity },
  { name: 'Crystal Cave', file: 'crystal_cave.nbt', gen: generateCrystalCave },
  { name: 'Void Arena', file: 'void_arena.nbt', gen: generateVoidArena },
]

for (const map of maps) {
  const grid = map.gen()
  const buf = buildStructureNbt(grid)
  writeFileSync(`maps/${map.file}`, buf)
  console.log(`Generated ${map.file} (${buf.length} bytes)`)
}

const mapsJson = maps.map(m => ({ file: m.file, name: m.name }))
writeFileSync('maps/maps.json', JSON.stringify(mapsJson, null, 2))
console.log('Updated maps.json')
