#!/usr/bin/env python3
"""Rebuild the room background as true pixel art on the didi palette.

Source: public/assets/momo-room.png (illustration, kept untouched). The part the game shows
(object-fit cover into the 240x144 scene) is box-sampled to 120x72 logical pixels, so one
room pixel is about two screen pixels, close to the cat's pixel size. Colours are clustered
in Lab (k-means, fixed seed), clusters closer than ΔE 10 merge, clusters within ΔE 10 of a
character colour reuse it, and the remaining room colours are added to
docs/palette/didi-palette.json (family "room"). Isolated speckles take the colour around them.
Output: public/assets/momo-room-px-v1.png (120x72 RGB). Deterministic; rerunning rewrites the
same file and palette.

Usage: python3 scripts/room-pixelate.py
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/momo-room.png"
OUTPUT = ROOT / "public/assets/momo-room-px-v1.png"
PALETTE_FILE = ROOT / "docs/palette/didi-palette.json"
W, H = 120, 72
CLUSTERS = 28
MIN_DE = 10


def lab(rgb):
    a = np.asarray(rgb, dtype=np.uint8).reshape(-1, 1, 3)
    out = cv2.cvtColor(a, cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(float)
    return np.stack([out[:, 0] * 100 / 255, out[:, 1] - 128, out[:, 2] - 128], 1)


def hex_of(c):
    return "#%02x%02x%02x" % tuple(int(v) for v in c)


# Names checked against where each colour appears in the room (docs/PALETTE.md).
ROOM_ROLES = {
    "#ce7c47": "房間：木地板", "#f4ba93": "房間：牆面", "#8b473b": "房間：家具深木",
    "#673535": "房間：家具最深木、描邊", "#a4583c": "房間：踢腳板、櫃子", "#e07269": "房間：被單／窗簾紅格",
    "#fad7a5": "房間：枕頭、淺米黃", "#f49a7f": "房間：被單／窗簾淺格", "#b08168": "房間：木框亮部",
    "#ba5354": "房間：窗簾暗紅", "#8c5e4f": "房間：層架、畫框木色", "#83b2c3": "房間：窗外天空",
    "#979730": "房間：植物亮綠", "#6c6a2f": "房間：植物中綠", "#595433": "房間：植物深綠",
    "#ba6d5f": "房間：碗、毛線暗部", "#56754a": "房間：窗外山丘", "#f5b451": "房間：太陽、金黃",
    "#c9cebd": "房間：雲、桌巾",
}


def describe(c):
    if hex_of(c) in ROOM_ROLES:
        return ROOM_ROLES[hex_of(c)]
    l, a_, b_ = lab(c)[0]
    hue = np.degrees(np.arctan2(b_, a_)) % 360
    tone = "深" if l < 35 else "淺" if l > 75 else ""
    if np.hypot(a_, b_) < 12:
        name = "米白" if l > 80 else "灰"
    elif hue < 40 or hue > 330:
        name = "粉紅"
    elif hue < 75:
        name = "木褐"
    elif hue < 110:
        name = "黃"
    elif hue < 190:
        name = "綠"
    else:
        name = "藍"
    return f"房間：{tone}{name}"


def main():
    src = np.asarray(Image.open(SOURCE).convert("RGB"))
    sh, sw = src.shape[:2]
    visible_h = round(sw * H / W)
    top = (sh - visible_h) // 2
    visible = src[top:top + visible_h]

    small = np.asarray(Image.fromarray(visible).resize((W, H), Image.BOX))
    pixels_lab = lab(small).astype(np.float32)
    cv2.setRNGSeed(7)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
    _, labels, centers = cv2.kmeans(pixels_lab, CLUSTERS, None, crit, 6, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.ravel(), minlength=CLUSTERS).astype(float)
    centers = centers.astype(float)

    # Merge clusters that are closer than ΔE 10 (count-weighted), closest pair first.
    keep = list(range(CLUSTERS))
    while True:
        best = None
        for i in range(len(keep)):
            for j in range(i + 1, len(keep)):
                d = np.linalg.norm(centers[keep[i]] - centers[keep[j]])
                if d < MIN_DE and (best is None or d < best[0]):
                    best = (d, keep[i], keep[j])
        if best is None:
            break
        _, i, j = best
        total = counts[i] + counts[j]
        centers[i] = (centers[i] * counts[i] + centers[j] * counts[j]) / total
        counts[i] = total
        keep.remove(j)

    palette = json.loads(PALETTE_FILE.read_text(encoding="utf-8"))
    character = [c for c in palette["colors"] if c["family"] != "room"]
    char_rgb = np.array([[int(c["hex"][k:k + 2], 16) for k in (1, 3, 5)] for c in character])
    char_lab = lab(char_rgb)

    def to_rgb(lab_row):
        l, a_, b_ = lab_row
        px = np.array([[[l * 255 / 100, a_ + 128, b_ + 128]]], dtype=np.float32).clip(0, 255).astype(np.uint8)
        return cv2.cvtColor(px, cv2.COLOR_LAB2RGB)[0, 0]

    room_rgb, room_lab = [], []
    for k in sorted(keep, key=lambda k: -counts[k]):
        d = np.linalg.norm(char_lab - centers[k], axis=1)
        if d.min() < MIN_DE:
            rgb = char_rgb[d.argmin()]
        else:
            rgb = to_rgb(centers[k])
        l = lab(rgb)[0]
        if any(np.linalg.norm(l - other) < MIN_DE for other in room_lab):
            continue  # snapping made it a duplicate
        room_rgb.append(rgb)
        room_lab.append(l)
    # New room colours must also stay ΔE 10 away from every character colour.
    for i, l in enumerate(room_lab):
        d = np.linalg.norm(char_lab - l, axis=1)
        if 0 < d.min() < MIN_DE:
            room_rgb[i] = char_rgb[d.argmin()]
            room_lab[i] = char_lab[d.argmin()]
    room_rgb = np.array(room_rgb)
    room_lab = np.array(room_lab)

    idx = ((pixels_lab[:, None, :] - room_lab[None]) ** 2).sum(-1).argmin(1).reshape(H, W)

    # Despeckle: a pixel with no same-coloured 8-neighbour takes the colour that surrounds it
    # (>= 5 of 8) when the two are within ΔE 25 (shading noise, not a drawn detail).
    for _ in range(10):
        padded = np.pad(idx, 1, constant_values=-1)
        nb = np.stack([padded[1 + dy:1 + dy + H, 1 + dx:1 + dx + W]
                       for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx])
        changed = False
        out = idx.copy()
        for y, x in zip(*np.nonzero(~(nb == idx[None]).any(0))):
            vals = nb[:, y, x]
            vals = vals[vals >= 0]
            m = np.bincount(vals).argmax()
            if np.count_nonzero(vals == m) >= 5 and np.linalg.norm(room_lab[m] - room_lab[idx[y, x]]) < 25:
                out[y, x] = m
                changed = True
        idx = out
        if not changed:
            break

    used = sorted(set(idx.ravel().tolist()))
    remap = {old: new for new, old in enumerate(used)}
    idx = np.vectorize(remap.get)(idx)
    room_rgb = room_rgb[used]
    rgba = np.dstack([room_rgb[idx].astype(np.uint8), np.full((H, W), 255, np.uint8)])
    Image.fromarray(rgba, "RGBA").save(OUTPUT, optimize=True)

    char_hex = {c["hex"] for c in character}
    usage = np.bincount(idx.ravel(), minlength=len(room_rgb))
    room_entries = [{"hex": hex_of(c), "family": "room", "role": describe(c)}
                    for c, n in sorted(zip(room_rgb, usage), key=lambda t: -t[1]) if hex_of(c) not in char_hex]
    palette["colors"] = character + room_entries
    palette["room"] = {
        "file": "public/assets/momo-room-px-v1.png", "width": W, "height": H,
        "shared_with_characters": sorted(hex_of(c) for c in room_rgb if hex_of(c) in char_hex),
    }
    PALETTE_FILE.write_text(json.dumps(palette, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{OUTPUT.relative_to(ROOT)}: {W}x{H}, {len(room_rgb)} colours "
          f"({len(room_entries)} new room colours, {len(room_rgb) - len(room_entries)} shared with characters)")


if __name__ == "__main__":
    main()
