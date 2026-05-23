#!/bin/sh
set -e

ROOT="/home/marlon/Code/MCFunction/HoodIncorporations/summit_2026_booth"
MC="/home/marlon/.local/share/PrismLauncher/instances/Fabulously Optimized/minecraft"
OUTPUT="$ROOT/.sandstone/output"

rm -rf "$ROOT/.sandstone"
cd "$ROOT" && sand build

rm -rf "$MC/saves/Summit/datapacks/datapack"
rm -rf "$MC/saves/Summit/datapacks/sandstone_summit_booth"
rm -rf "$MC/resourcepacks/sandstone_summit_booth"

cp -r "$OUTPUT/datapack" "$MC/saves/Summit/datapacks/sandstone_summit_booth"
cp -r "$OUTPUT/resourcepack" "$MC/resourcepacks/sandstone_summit_booth"

echo "Deployed datapack   -> saves/Summit/datapacks/sandstone_summit_booth"
echo "Deployed resourcepack -> resourcepacks/sandstone_summit_booth"
