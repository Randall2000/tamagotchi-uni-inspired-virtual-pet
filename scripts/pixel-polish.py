#!/usr/bin/env python3
"""Final pixel-art polish for every character sheet (run after the remaster/build scripts).

Works on the 64px logical grid (each logical pixel is a 2x2 block in the 128px cells):
1. Map every colour onto docs/palette/didi-palette.json (merged near-duplicates first,
   anything else to the nearest palette colour in Lab).
2. Prop colours (water blue, kibble brown) stranded on the cat in clusters of <=3 pixels
   take the nearest colour of the surrounding material.
   Remove speckles: a pixel with no same-coloured 8-neighbour takes the colour that
   surrounds it (>=5 of 8 neighbours) when both belong to the same material family.
   Isolated mid-greys inside fur or white are treated the same way. Eye colours and pure
   white highlights are never changed.
3. Fill one-pixel notches in the silhouette (transparent, >=3 opaque 4-neighbours) with the
   outline colour, except near the feet so the gaps between toes stay.
4. Every boundary pixel of a solid area (opaque, touching transparency, >=3 opaque
   4-neighbours) becomes the outline colour; thin lines such as whiskers keep their colour.
Alpha stays 0/255, transparent RGB stays 0, and each logical pixel is written back as 2x2.
Running it twice changes nothing.

Usage: python3 scripts/pixel-polish.py [--check]
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/assets"
PALETTE_FILE = ROOT / "docs/palette/didi-palette.json"
SHEETS = [ASSETS / "momo-kitten-64-v3.png", ASSETS / "momo-adult-64-v4.png",
          *sorted((ASSETS / "momo-motions-preview").glob("*/*.png"))]
MID_GREYS = {"#554e5b", "#6e6974", "#a19ea5", "#cac9cb"}
FEET_ROWS = 6  # logical rows above the bottom of each cell left untouched by notch filling


def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def to_lab(rgb):
    c = np.asarray(rgb, dtype=float) / 255
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ m.T / np.array([0.95047, 1, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


PAL = json.loads(PALETTE_FILE.read_text(encoding="utf-8"))
CHARACTER = [c for c in PAL["colors"] if c["family"] != "room"]  # room colours are for the background only
COLORS = [c["hex"] for c in CHARACTER]
RGB = np.array([hex_rgb(h) for h in COLORS], dtype=np.uint8)
LAB = to_lab(RGB)
FAMILY = np.array([c["family"] for c in CHARACTER])
OUTLINE = COLORS.index(PAL["rules"]["outline"])
WHITE = COLORS.index("#fbf6f3")
MID = np.array([h in MID_GREYS for h in COLORS])
MERGED = {hex_rgb(k): COLORS.index(v) for k, v in PAL["merged"].items()}


def to_index(logical):
    """Palette index per logical pixel, -1 for transparent."""
    h, w = logical.shape[:2]
    idx = np.full((h, w), -1, dtype=np.int16)
    opaque = logical[..., 3] > 0
    cols, inverse = np.unique(logical[opaque][:, :3], axis=0, return_inverse=True)
    lookup = np.empty(len(cols), dtype=np.int16)
    for k, c in enumerate(map(tuple, cols)):
        exact = np.where((RGB == c).all(1))[0]
        if len(exact):
            lookup[k] = exact[0]
        elif c in MERGED:
            lookup[k] = MERGED[c]
        else:
            lookup[k] = int(np.argmin(((LAB - to_lab(np.array(c))) ** 2).sum(1)))
    idx[opaque] = lookup[inverse.ravel()]
    return idx


def neighbours(idx, offsets):
    padded = np.pad(idx, 1, constant_values=-1)
    h, w = idx.shape
    return np.stack([padded[1 + dy:1 + dy + h, 1 + dx:1 + dx + w] for dy, dx in offsets])


N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
N4 = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def despeckle(idx):
    nb = neighbours(idx, N8)
    out = idx.copy()
    interior = (neighbours(idx, N4) >= 0).all(0)  # the silhouette boundary belongs to outline_edges
    isolated = (idx >= 0) & interior & ~(nb == idx[None]).any(0)
    for y, x in zip(*np.nonzero(isolated)):
        p = idx[y, x]
        if FAMILY[p] == "eye" or p == WHITE:
            continue
        vals = nb[:, y, x]
        vals = vals[vals >= 0]
        if len(vals) < 5:
            continue
        m = np.bincount(vals).argmax()
        if np.count_nonzero(vals == m) < 5 or FAMILY[m] == "eye":
            continue
        same_family = FAMILY[m] == FAMILY[p]
        grey_in_fur = MID[p] and FAMILY[m] in ("dark", "light")
        if same_family or grey_in_fur:
            out[y, x] = m
    return out


def stray_props(idx):
    """Prop colours (water blue, kibble brown) in tiny clusters on the cat take the nearest
    colour of the material around them; real props are large clusters and stay."""
    nb = neighbours(idx, N8)
    out = idx.copy()
    is_prop = FAMILY[np.clip(idx, 0, None)] == "prop"
    prop_nb = (FAMILY[np.clip(nb, 0, None)] == "prop") & (nb >= 0)
    for y, x in zip(*np.nonzero((idx >= 0) & is_prop & (prop_nb.sum(0) <= 2))):
        vals = nb[:, y, x]
        vals = vals[(vals >= 0) & (FAMILY[np.clip(vals, 0, None)] != "prop")]
        if len(vals) < 3:
            continue
        family = FAMILY[np.bincount(vals).argmax()]
        if family == "eye":
            continue
        choices = np.where(FAMILY == family)[0]
        out[y, x] = choices[np.argmin(((LAB[choices] - LAB[idx[y, x]]) ** 2).sum(1))]
    return out


def fill_notches(idx, cell):
    nb = neighbours(idx, N4)
    notch = (idx < 0) & ((nb >= 0).sum(0) >= 3)
    rows = np.arange(idx.shape[0]) % cell
    notch &= (rows < cell - FEET_ROWS)[:, None]
    out = idx.copy()
    out[notch] = OUTLINE
    return out


def outline_edges(idx):
    nb = neighbours(idx, N4)
    opaque_nb = (nb >= 0).sum(0)
    edge = (idx >= 0) & (opaque_nb < 4) & (opaque_nb >= 3)
    edge &= FAMILY[np.clip(idx, 0, None)] != "eye"
    out = idx.copy()
    out[edge] = OUTLINE
    return out


def polish(path):
    im = np.asarray(Image.open(path).convert("RGBA"))
    logical = im[::2, ::2]
    idx = to_index(logical)
    for _ in range(10):  # repeat until nothing changes, so a second run is a no-op
        before = idx
        idx = outline_edges(fill_notches(despeckle(stray_props(idx)), 64))
        if np.array_equal(idx, before):
            break
    out = np.zeros_like(logical)
    opaque = idx >= 0
    out[opaque, :3] = RGB[idx[opaque]]
    out[opaque, 3] = 255
    return np.repeat(np.repeat(out, 2, 0), 2, 1), im


def main():
    check = "--check" in sys.argv
    changed_files = 0
    for path in SHEETS:
        new, old = polish(path)
        changed = int((new != old).any(-1).sum() // 4)
        print(f"{path.relative_to(ASSETS)}: {changed} logical pixels changed")
        if changed:
            changed_files += 1
            if not check:
                Image.fromarray(new, "RGBA").save(path, optimize=True)
    if check and changed_files:
        sys.exit(1)


if __name__ == "__main__":
    main()
