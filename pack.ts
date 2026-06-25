function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function getDatapackFormat(mcVersion: string): Promise<number | null> {
  const res = await fetch("https://minecraft.wiki/w/Data_pack", {
    headers: { "User-Agent": "datapack-tool/1.0" },
  });
  const html = await res.text();
  const rows = [...html.matchAll(/<tr id="pack-format-column"><th id="pack-format">([\d.]+)<\/th><th id="v"[^>]*>(.*?)<\/th>/gs)];
  for (const [, rawFormat, cell] of rows) {
    const format = parseInt(rawFormat);
    const versions = [...cell.matchAll(/\/w\/Java_Edition_([\d.]+)/g)].map(m => m[1]);
    if (versions.length === 0) continue;
    const first = versions[0];
    const last = versions[versions.length - 1];
    if (compareVersions(mcVersion, first) >= 0 && compareVersions(mcVersion, last) <= 0) {
      return format;
    }
  }
  return null;
}

// Test
console.log(await getDatapackFormat("1.21.4")); // → 61
console.log(await getDatapackFormat("26.2")); // → 101
console.log(await getDatapackFormat("1.21.9")); // → 88