#!/usr/bin/env bun
/**
 * Extract world-space positions of every block matching a given id (or ids)
 * from a Sponge `.schem` / MCEdit-style `.schematic` file, and emit them as a
 * TypeScript array literal.
 *
 * Usage:
 *   bun run scripts/extract-blocks.ts <schem> <block-id[,block-id...]> [--out path.ts] [--origin x,y,z] [--name exportName] [--regions name[,name...]] [--booth-def path.json]
 *
 * Examples:
 *   bun run scripts/extract-blocks.ts sandstone_booth.schem minecraft:black_banner
 *   bun run scripts/extract-blocks.ts foo.schem minecraft:stone,minecraft:dirt --out src/sections/main/positions.ts
 *   bun run scripts/extract-blocks.ts foo.schem minecraft:stone --origin 100,64,-200 --name stonePositions
 *   bun run scripts/extract-blocks.ts foo.schem minecraft:stone --regions showcase,castle --out src/sections/main/showcase.ts
 *   bun run scripts/extract-blocks.ts foo.schem minecraft:stone --regions '*' --out src/sections/main/positions.ts
 */

import nbt from 'prismarine-nbt'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// ---------- Args ----------
const argv = process.argv.slice(2)
if (argv.length < 3 || argv.includes('--help') || argv.includes('-h')) {
    console.error('Usage: bun run scripts/extract-blocks.ts <schem> <block-id[,block-id...]> --out path.ts [--origin x,y,z] [--name exportName] [--regions name[,name...]] [--booth-def path.json]')
    process.exit(1)
}

const schemPath = argv[0]
const ids = argv[1].split(',').map(s => s.trim()).filter(Boolean)
let origin: [number, number, number] = [0, 0, 0]
let outPath: string | undefined
let exportName = 'positions'
let append = false
let regionNames: string[] | undefined
let boothDefPath = join(process.cwd(), 'resources/booth_definition.json')

for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out') outPath = argv[++i]
    else if (a === '--origin') {
        const [x, y, z] = argv[++i].split(',').map(Number)
        origin = [x, y, z]
    }
    else if (a === '--name') exportName = argv[++i]
    else if (a === '--append') append = true
    else if (a === '--regions') regionNames = argv[++i].split(',').map(s => s.trim()).filter(Boolean)
    else if (a === '--booth-def') boothDefPath = argv[++i]
}

if (!outPath) {
    console.error('Error: --out path.ts is required')
    process.exit(1)
}

// ---------- Region filter (loads booth_definition.json if --regions is set) ----------
type Cuboid = { xMin: number; xMax: number; yMin: number; yMax: number; zMin: number; zMax: number }
let boothCuboids: Cuboid[] | undefined

if (regionNames) {
    const def = JSON.parse(readFileSync(boothDefPath, 'utf-8'))
    const bbs = def?.bounding_boxes ?? {}
    if (regionNames.length === 1 && (regionNames[0] === '*' || regionNames[0] === 'all')) {
        regionNames = Object.keys(bbs)
        console.error(`[regions] shorthand expanded to all ${regionNames.length} region(s)`)
    }
    for (const name of regionNames) {
        const bb = bbs[name]
        const p = bb?.position
        if (!p) throw new Error(`Region "${name}" not found in ${boothDefPath}`)
        boothCuboids ??= []
        boothCuboids.push({
            xMin: p.x.min, xMax: p.x.max,
            yMin: p.y.min, yMax: p.y.max,
            zMin: p.z.min, zMax: p.z.max,
        })
    }
    console.error(`[regions] ${regionNames.length} region(s) from ${boothDefPath}: ${regionNames.join(', ')}`)
}

function inAnyCuboid(cs: Cuboid[], x: number, y: number, z: number): boolean {
    for (const c of cs) {
        if (x >= c.xMin && x <= c.xMax && y >= c.yMin && y <= c.yMax && z >= c.zMin && z <= c.zMax) return true
    }
    return false
}

// ---------- Full simplify (unwraps primitives too) ----------
type NbtPrimitive = number | bigint | string
type NbtValue = NbtPrimitive | Uint8Array | number[] | bigint[] | NbtValue[] | { [k: string]: NbtValue }

function fullSimplify(data: any): NbtValue {
    function transform(v: any): NbtValue {
        if (!v || typeof v !== 'object') return v
        if (!('type' in v)) {
            // Non-NBT-wrapped object: could be a list-of-compound item stored as a flat record.
            // Heuristic: if every value has a `type` field, treat as a compound.
            const keys = Object.keys(v)
            if (keys.length > 0 && keys.every(k => v[k] && typeof v[k] === 'object' && 'type' in v[k])) {
                return Object.fromEntries(keys.map(k => [k, transform(v[k])]))
            }
            return v
        }
        switch (v.type) {
            case 'compound':
                return Object.fromEntries(Object.entries(v.value).map(([k, x]) => [k, transform(x)]))
            case 'list': {
                // prismarine-nbt may store the list as a compound-shaped wrapper
                // (type='compound', value=Array). Unwrap it before mapping.
                const rawList = (v.value && typeof v.value === 'object' && 'type' in v.value && (v.value as any).type === 'compound')
                    ? (v.value as any).value
                    : v.value
                return (Array.isArray(rawList) ? rawList : Object.values(rawList)).map((x: any) => transform(x))
            }
            case 'byteArray':
                return v.value instanceof Uint8Array ? v.value : Uint8Array.from(v.value as number[])
            case 'intArray':
                return (v.value as number[]).map(Number)
            case 'longArray':
                return (v.value as (bigint | number)[]).map(x => BigInt(x as any))
            default:
                return v.value
        }
    }
    return transform(data)
}

// ---------- Varint (Sponge BlockData encoding) ----------
function readVarints(buf: Uint8Array): number[] {
    const out: number[] = []
    let i = 0
    while (i < buf.length) {
        let v = 0, shift = 0
        while (true) {
            const b = buf[i++]
            v |= (b & 0x7f) << shift
            if ((b & 0x80) === 0) { out.push(v >>> 0); break }
            shift += 7
            if (shift > 35) throw new Error('Varint overflow reading BlockData')
        }
    }
    return out
}

// ---------- Parse ----------
const buf = readFileSync(schemPath)
const parsed = await new Promise<any>((res, rej) =>
    nbt.parse(buf, (err: any, data: any) => err ? rej(err) : res(data))
)
const root = fullSimplify(parsed) as any

// Detect format: Sponge has top-level Palette/BlockData; MCEdit-wrapped variant
// has Palette/Data nested under Schematic.Blocks.
let width: number, height: number, length: number
let palette: { [state: string]: number }
let data: Uint8Array
let offsetNbt: number[] | undefined
let metadata: { [k: string]: any } | undefined

if (root.Palette && root.BlockData) {
    width = root.Width; height = root.Height; length = root.Length
    palette = root.Palette; data = root.BlockData
    offsetNbt = root.Offset
    metadata = root.Metadata
} else if (root.Schematic?.Blocks?.Palette && root.Schematic?.Blocks?.Data) {
    width = root.Schematic.Width
    height = root.Schematic.Height
    length = root.Schematic.Length
    palette = root.Schematic.Blocks.Palette
    data = root.Schematic.Blocks.Data
    offsetNbt = root.Schematic.Offset
    metadata = root.Schematic.Metadata
} else {
    throw new Error(`Unrecognized schematic layout in ${schemPath}`)
}

if (typeof width !== 'number' || typeof height !== 'number' || typeof length !== 'number') {
    throw new Error(`Missing/invalid Width/Height/Length in ${schemPath}`)
}
if (!palette || !(data instanceof Uint8Array)) {
    throw new Error(`Missing Palette or BlockData in ${schemPath}`)
}

const [xOff = 0, yOff = 0, zOff = 0] = offsetNbt ?? []
const weOrigin = metadata?.WorldEdit?.Origin as number[] | undefined
const legacyWe = metadata && (metadata.WEX !== undefined || metadata.WorldEditX !== undefined)
    ? [metadata.WEX ?? metadata.WorldEditX, metadata.WEY ?? metadata.WorldEditY, metadata.WEZ ?? metadata.WorldEditZ]
    : undefined

// Pick the //copy anchor: prefer modern WorldEdit.Origin, fall back to legacy WEX/Y/Z.
// If neither exists, fall back to the paste Offset.
const copyAnchor: [number, number, number] =
    weOrigin ? [weOrigin[0] ?? 0, weOrigin[1] ?? 0, weOrigin[2] ?? 0]
    : legacyWe ? [legacyWe[0] ?? 0, legacyWe[1] ?? 0, legacyWe[2] ?? 0]
    : [xOff, yOff, zOff]

console.error(`[schematic] Offset (paste anchor): (${xOff}, ${yOff}, ${zOff})`)
console.error(`[schematic] //copy anchor (used for position calc): (${copyAnchor[0]}, ${copyAnchor[1]}, ${copyAnchor[2]})`)

// Inverse palette: idx → state string
const invPalette: string[] = []
for (const state in palette) invPalette[palette[state]] = state

function idOf(state: string): string {
    return state.includes('[') ? state.slice(0, state.indexOf('[')) : state
}

type BlockState = { name: string; states: Record<string, string | number | boolean> }

function parseBlockState(state: string): BlockState {
    const name = idOf(state)
    const states: Record<string, string | number | boolean> = {}
    const lb = state.indexOf('[')
    if (lb !== -1) {
        const rb = state.indexOf(']', lb)
        const inner = state.slice(lb + 1, rb)
        for (const pair of inner.split(',')) {
            const eq = pair.indexOf('=')
            if (eq === -1) continue
            const key = pair.slice(0, eq).trim()
            const raw = pair.slice(eq + 1).trim()
            const lower = raw.toLowerCase()
            if (lower === 'true') { states[key] = true; continue }
            if (lower === 'false') { states[key] = false; continue }
            const asNum = Number(raw)
            states[key] = (raw !== '' && !isNaN(asNum)) ? asNum : raw
        }
    }
    return { name, states }
}

function formatBlockState(bs: BlockState): string {
    const esc = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
    const inner = Object.entries(bs.states)
        .map(([k, v]) => `${k}: ${typeof v === 'string' ? esc(v) : v}`)
        .join(', ')
    return `{ name: ${esc(bs.name)}, states: { ${inner} } }`
}

// Match: state id contains any of the user-supplied strings
function matches(state: string): boolean {
    const id = idOf(state)
    for (const want of ids) {
        if (id === want) return true
        if (id.includes(want)) return true
    }
    return false
}

// ---------- Build BlockEntity lookup (keyed by local x|y|z) ----------
type EntityNbt = { Id: string; Pos: number[]; Data: { [k: string]: any } }

const blockEntityList: EntityNbt[] =
    ((root.Schematic?.Blocks?.BlockEntities as EntityNbt[] | undefined)
    ?? (root.BlockEntities as EntityNbt[] | undefined)
    ?? [])

const entityByPos = new Map<string, EntityNbt>()
for (const ent of blockEntityList) {
    const [x, y, z] = ent.Pos ?? []
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
        entityByPos.set(`${x}|${y}|${z}`, ent)
    }
}

// Fields to skip when emitting the entity NBT (already represented elsewhere)
const SKIP_ENTITY_KEYS = new Set(['x', 'y', 'z', 'id'])

function formatEntityNbt(ent: EntityNbt): string {
    const data = ent.Data ?? {}
    const esc = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
    const parts: string[] = []
    for (const [k, v] of Object.entries(data)) {
        if (SKIP_ENTITY_KEYS.has(k)) continue
        if (typeof v === 'string') parts.push(`${k}: ${esc(v)}`)
        else if (typeof v === 'number' || typeof v === 'boolean') parts.push(`${k}: ${v}`)
        else if (typeof v === 'bigint') parts.push(`${k}: ${v}n`)
        else if (Array.isArray(v)) {
            const items = v.map(item => {
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    return `{ ${Object.entries(item).map(([ik, iv]) =>
                        typeof iv === 'string' ? `${ik}: ${esc(iv)}`
                        : typeof iv === 'number' || typeof iv === 'boolean' ? `${ik}: ${iv}`
                        : typeof iv === 'bigint' ? `${ik}: ${iv}n`
                        : Array.isArray(iv) ? `${ik}: [${iv.map(x => typeof x === 'string' ? esc(String(x)) : String(x)).join(', ')}]`
                        : `${ik}: ${JSON.stringify(iv)}`
                    ).join(', ')} }`
                }
                return typeof item === 'string' ? esc(item) : String(item)
            }).join(', ')
            parts.push(`${k}: [${items}]`)
        }
        else if (v && typeof v === 'object') parts.push(`${k}: ${JSON.stringify(v)}`)
        else parts.push(`${k}: ${String(v)}`)
    }
    return `{ ${parts.join(', ')} }`
}

// Walk Data (varint-encoded palette indices), y/z/x order
const indices = readVarints(data)
const total = width * height * length
if (indices.length !== total) {
    throw new Error(`BlockData varint count (${indices.length}) != volume (${total})`)
}

const [ox, oy, oz] = origin
type PaletteEntry = { name: string; states: Record<string, string | number | boolean>; nbt: { [k: string]: any } | null }
type PositionEntry = [number, number, number, number] // [x, y, z, paletteIndex]

const statePalette: PaletteEntry[] = []
const paletteIndex = new Map<string, number>()
const positions: PositionEntry[] = []

function dedupeKey(pe: PaletteEntry): string {
    return JSON.stringify(pe)
}

for (let i = 0; i < total; i++) {
    const idx = indices[i]
    const state = invPalette[idx]
    if (state === undefined) throw new Error(`Palette index ${idx} out of range`)
    if (!matches(state)) continue
    const x = i % width
    const z = ((i / width) | 0) % length
    const y = (i / (width * length)) | 0
    const out_x = x + xOff + ox
    const out_y = y + yOff + oy
    const out_z = z + zOff + oz
    if (boothCuboids && !inAnyCuboid(boothCuboids, x + xOff + copyAnchor[0], y + yOff + copyAnchor[1], z + zOff + copyAnchor[2])) continue
    const ent = entityByPos.get(`${x}|${y}|${z}`)
    const pe: PaletteEntry = {
        name: idOf(state),
        states: parseBlockState(state).states,
        nbt: ent ? (ent.Data ?? null) : null,
    }
    const key = dedupeKey(pe)
    let palIdx = paletteIndex.get(key)
    if (palIdx === undefined) {
        palIdx = statePalette.length
        paletteIndex.set(key, palIdx)
        statePalette.push(pe)
    }
    positions.push([out_x, out_y, out_z, palIdx])
}

// ---------- Emit ----------
const body = positions.map(p => `  [${p[0]}, ${p[1]}, ${p[2]}, ${p[3]}],`).join('\n')
const paletteBody = statePalette.map(pe => {
    const esc = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
    const bsPart = `name: ${esc(pe.name)}, states: { ${Object.entries(pe.states).map(([k, v]) => `${k}: ${typeof v === 'string' ? esc(v) : v}`).join(', ')} }`
    const nbtPart = pe.nbt ? `, nbt: ${formatEntityNbt({ Id: '', Pos: [], Data: pe.nbt })}` : ''
    return `  { ${bsPart}${nbtPart} },`
}).join('\n')
const paletteName = `${exportName}Palette`
const header = `// Auto-generated from ${schemPath} — ${positions.length} block(s) of ${ids.join(', ')}`
const positionsDecl = `const ${exportName} = [\n${body}\n] as const`
const paletteDecl = `const ${paletteName} = [\n${paletteBody}\n] as const`
const out = append
    ? `\n// @extract-blocks:${paletteName}\n${paletteDecl}\n// @extract-blocks:end\n\n// @extract-blocks:${exportName}\n${positionsDecl}\n// @extract-blocks:end\n`
    : `${header}\nexport ${paletteDecl}\nexport ${positionsDecl}\n`

if (outPath) {
    if (append) {
        let existing = readFileSync(outPath, 'utf-8')
        const markerStart = `// @extract-blocks:${exportName}`
        const markerEnd = `// @extract-blocks:end`
        // Replace the FIRST occurrence in place; remove any subsequent duplicates of the same marker.
        const blockRe = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}\\n?`, 'g')
        const allMatches = [...existing.matchAll(blockRe)]
        if (allMatches.length > 0) {
            const firstMatch = allMatches[0]
            const newBlock = out.replace(/^\n+/, '') // strip leading newlines so it slots in cleanly
            existing = existing.slice(0, firstMatch.index!) + newBlock + existing.slice(firstMatch.index! + firstMatch[0].length)
            // Remove remaining duplicates (after the first one we just rewrote)
            const tailRe = new RegExp(`\\n?${markerStart}[\\s\\S]*?${markerEnd}\\n?`, 'g')
            // Apply removal only to the part after our new block
            const head = existing.slice(0, firstMatch.index! + newBlock.length)
            let tail = existing.slice(firstMatch.index! + newBlock.length)
            tail = tail.replace(tailRe, '').replace(/\n{3,}/g, '\n\n')
            existing = head + tail
        } else {
            existing = existing.trimEnd() + '\n' + out
        }
        writeFileSync(outPath, existing)
    } else {
        writeFileSync(outPath, out)
    }
}