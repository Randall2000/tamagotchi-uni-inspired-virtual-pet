# Momo 19-action motion integration (2026-11-06)

## Current build

- Local source: `public/assets/momo-motions-preview/`
- 19 actions for each age; 38 independent RGBA sprite sheets, 128×128 pixel cells, 8 columns.
- `manifest.json` lists action names, dimensions, frame counts, FPS, preview status.
- `motion-pack.js` maps 19 actions to stage-specific files. `app.js` plays these sheets through the existing 3-button A/B/C interface.
- No original `momo-cat-pixel.png`, `momo-kitten.png`, `momo-adult-64-v3.png` or `momo-kitten-64-v2.png` sources have been overwritten.
- `growing` stage uses kitten artwork until adult is reached; stage swap is immediate, no morphing or growth tween.

## How game actions map

Main quick bar stays one-level and non-touch: `feed → eat`, `clean → groom`, `play → play`, `pet → petting`.
Main menu: `rest → sleep_prep → sleep looping`, `snack`, `drink`, `toilet`, `groom`, `stretch` (legacy atlas), `window → curious`.
C/B while sleeping plays `wake`.
Idle moments use `tail_wag`, `groom`, `curious`, and existing `stretch`; roaming uses `walk`.
Low happiness, hunger, hygiene, and energy can trigger `sad`, `angry`, `sick`, and `yawn`; high happiness can trigger `happy`.

## Quality and limitations — NOT production-ready

These 38 PNGs were recomposed programmatically from the two EXISTING 64-frame game atlases because the earlier generated 38-animation ZIP was not present in the connected Mac's project or Downloads folder. **They are not byte-for-byte copies of the prior ZIP and are not 832 unique hand-pixelled frames.**

The exact 16/24/32 timeline slots and 8/12 FPS are present, but individual drawn poses are re-used. Complex motions, especially walking, curled sleeping, feeding mouth-to-bowl contact, grooming, litter, and emotion shapes need character-locked manual frame review. Eyes may inherit discrepancies from the existing game atlas. Do not claim identity/palette perfection without a pixel diff against the two originals.

The game deliberately serves this build from `momo-motions-preview` so a certified pack can replace the previews without deleting the original art.

## Regeneration and tests

```bash
python3 scripts/build-momo-action-preview.py
npm test
PORT=4199 node server.mjs
python3 scripts/qa-momo-motions.py
```

The 52 automated tests cover all file sizes, 19 action IDs, two age folders, alias mappings, navigation, save and growth logic, and legacy atlas checks. Headless Chrome QA checks kitten feeding, water, adult sheet, sleep and wake. Evidence: `output/playwright/momo-eat-live.png`, `output/playwright/momo-adult-live.png`.

## Replacement contract

To upgrade to manually approved artwork, place `<action>.png` in each of `adult/` and `kitten/`, maintaining the 128×128 cell size, eight columns, frame counts, transparent PNG backgrounds, ground anchors and action names from manifest. Do not overwrite the original 64-frame art. The runtime mapping can remain unchanged. Only mark completed after direct comparison with the original adult and kitten identities and visual acceptance of every action.
