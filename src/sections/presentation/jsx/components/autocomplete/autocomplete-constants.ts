// Autocomplete element constants. Source defaults + IntelliSense
// moment content + per-moment window length.

// Default source for the showcase `<autocomplete>` element when no
// `source` prop is provided. Covers two IntelliSense moments — entity
// IDs (inside the first string literal) and NBT keys (inside the
// object literal) — using real Sandstone syntax.
export const DEFAULT_AUTOCOMPLETE_SOURCE = `summon('armor_stand', '~ ~ ~', {
  CustomName: {
    text: 'Funny guy',
    color: 'yellow',
    bold: true,
  }
})`

// Number of code rows the autocomplete editor always renders.
// Matches `DEFAULT_AUTOCOMPLETE_SOURCE` (5). Callers overriding
// `source` would need to keep this or expose it as a prop.
export const MAX_CODE_LINES = DEFAULT_AUTOCOMPLETE_SOURCE.split('\n').length

// IntelliSense moment content — entity IDs + NBT keys.
export const ENTITY_IDS = ['minecraft:zombie', 'minecraft:skeleton', 'minecraft:creeper', 'minecraft:spider']
export const NBT_KEYS = ['Tags', 'Health', 'CustomName', 'HandItems']

// How long each IntelliSense moment stays visible (in typing stages).
export const POPUP_WINDOW = 6