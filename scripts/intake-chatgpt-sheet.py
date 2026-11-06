#!/usr/bin/env python3
"""Check and convert one ChatGPT-generated character sheet (docs/ART_SPEC_CHATGPT.md).

Runs every automated condition (ART-RAW, ART-PX, ART-ID), converts the sheet to the game
format (64px logical sprites, 2x cells of 128px, 8 columns, didi palette, pixel polish) and
writes a report, the converted sheet and a review image to output/art-intake/<stage>/.
Never touches the game's own assets. Exit code 0 only when every automated check passes.

Usage: python3 scripts/intake-chatgpt-sheet.py <png> --stage kitten|adult --action <name> [--frames N]
"""
import argparse
import importlib.util
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output/art-intake"
spec = importlib.util.spec_from_file_location("pixel_polish", ROOT / "scripts/pixel-polish.py")
pp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pp)

SIZE, GRID, CELL, LOGICAL, BLOCK = 1024, 4, 256, 64, 4
FEET_ROW, CENTER_COL = 61, 32
ACTIONS = {name: 8 for name in [
    "idle", "walk", "eat", "drink", "snack", "play", "groom", "petting", "sleep_prep", "sleep",
    "wake", "yawn", "tail_wag", "curious", "happy", "sad", "angry", "sick", "toilet"]}
PROP_ACTIONS = {"eat", "drink", "snack", "play", "toilet"}
LYING_ACTIONS = {"sleep", "sleep_prep", "sick", "toilet", "wake"}
EYES_CLOSED_ACTIONS = {"sleep", "sleep_prep", "sick"}
OUTLINE, PINK_EAR = pp.COLORS.index("#1a0e17"), pp.COLORS.index("#e98796")


def delta_e(a, b):
    return np.sqrt(((a - b) ** 2).sum(-1))


def remove_background(rgba):
    """Opaque mask for the sprites: real transparency, or a flat key colour touching the border."""
    alpha = rgba[..., 3]
    if (alpha == 0).mean() >= 0.2:
        return alpha >= 128, {"mode": "transparent"}
    corners = [rgba[:16, :16], rgba[:16, -16:], rgba[-16:, :16], rgba[-16:, -16:]]
    keys = [np.median(c[..., :3].reshape(-1, 3), 0) for c in corners]
    key_lab = pp.to_lab(np.array(keys[0], dtype=np.uint8))
    corner_spread = max(float(delta_e(pp.to_lab(np.array(k, dtype=np.uint8)), key_lab)) for k in keys)
    near = delta_e(pp.to_lab(rgba[..., :3]), key_lab) < 18
    # A key colour the cat never uses (magenta) is removed everywhere, including the gaps between
    # legs and inside the tail curl. A key the cat does use (white) is only removed where it
    # touches the canvas edge, so white fur survives; enclosed gaps may then remain (warning).
    key_in_palette = float(delta_e(pp.LAB, key_lab).min()) < 30
    if key_in_palette:
        count, labels = cv2.connectedComponents(near.astype(np.uint8), connectivity=4)
        border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
        background = near & np.isin(labels, list(border))
    else:
        background = near
    return ~background, {"mode": "key", "key": "#%02x%02x%02x" % tuple(int(v) for v in keys[0]),
                         "corner_spread": round(corner_spread, 1),
                         "enclosed_key_pixels_left": int((near & ~background).sum()),
                         "warning": "background colour is also a character colour; use magenta or transparency" if key_in_palette else ""}


def best_phase(rgb, mask):
    """Block offset (0-3, 0-3) where the most fully opaque 4x4 blocks are a single colour."""
    best = (0, 0, -1.0)
    for oy in range(BLOCK):
        for ox in range(BLOCK):
            h = (CELL - oy) // BLOCK * BLOCK
            w = (CELL - ox) // BLOCK * BLOCK
            blocks = rgb[oy:oy + h, ox:ox + w].reshape(h // BLOCK, BLOCK, w // BLOCK, BLOCK, 3).astype(int)
            full = mask[oy:oy + h, ox:ox + w].reshape(h // BLOCK, BLOCK, w // BLOCK, BLOCK).all((1, 3))
            if not full.any():
                continue
            spread = (blocks.max((1, 3)) - blocks.min((1, 3))).max(-1)
            score = float((spread[full] <= 12).mean())
            if score > best[2]:
                best = (ox, oy, score)
    return best


def to_logical(rgb, mask, ox, oy):
    """64x64 palette indices: each 4x4 block takes its most common palette colour."""
    lab = pp.to_lab(rgb)
    nearest = ((lab[..., None, :] - pp.LAB[None, None]) ** 2).sum(-1).argmin(-1)
    far = delta_e(lab, pp.LAB[nearest]) > 12
    idx = np.full((LOGICAL, LOGICAL), -1, dtype=np.int16)
    for by in range(LOGICAL):
        for bx in range(LOGICAL):
            y0, x0 = oy + by * BLOCK, ox + bx * BLOCK
            if y0 + BLOCK > CELL or x0 + BLOCK > CELL:
                continue
            m = mask[y0:y0 + BLOCK, x0:x0 + BLOCK]
            if m.mean() < 0.5:
                continue
            idx[by, bx] = np.bincount(nearest[y0:y0 + BLOCK, x0:x0 + BLOCK][m]).argmax()
    return idx, far


def polish(idx):
    for _ in range(10):
        before = idx
        idx = pp.outline_edges(pp.fill_notches(pp.despeckle(pp.stray_props(idx)), LOGICAL))
        if np.array_equal(idx, before):
            break
    return idx


def px_problems(idx):
    """Same rules as tests/pixel-palette.test.js."""
    n4 = pp.neighbours(idx, pp.N4)
    n8 = pp.neighbours(idx, pp.N8)
    opaque4 = (n4 >= 0).sum(0)
    fam = pp.FAMILY[np.clip(idx, 0, None)]
    problems = {"speckle": 0, "notch": 0, "edge": 0, "strayProp": 0}
    rows = np.arange(LOGICAL)[:, None]
    problems["notch"] = int(((idx < 0) & (opaque4 >= 3) & (rows < LOGICAL - pp.FEET_ROWS)).sum())
    problems["edge"] = int(((idx >= 0) & (fam != "eye") & (opaque4 == 3) & (idx != OUTLINE)).sum())
    for y, x in zip(*np.nonzero(idx >= 0)):
        c, vals = idx[y, x], n8[:, y, x]
        vals = vals[vals >= 0]
        if pp.FAMILY[c] == "prop":
            prop_nb = int((pp.FAMILY[vals] == "prop").sum())
            body = int(((pp.FAMILY[vals] != "prop") & (pp.FAMILY[vals] != "eye")).sum())
            if prop_nb <= 2 and body >= 3:
                problems["strayProp"] += 1
        if opaque4[y, x] < 4 or pp.FAMILY[c] == "eye" or c == pp.WHITE or (vals == c).any() or len(vals) < 5:
            continue
        m = np.bincount(vals).argmax()
        if np.count_nonzero(vals == m) >= 5 and pp.FAMILY[m] != "eye" and (
                pp.FAMILY[m] == pp.FAMILY[c] or (pp.MID[c] and pp.FAMILY[m] in ("dark", "light"))):
            problems["speckle"] += 1
    return problems


def shift(idx, dx, dy):
    out = np.full_like(idx, -1)
    ys, xs = np.nonzero(idx >= 0)
    ny, nx = ys + dy, xs + dx
    keep = (ny >= 0) & (ny < LOGICAL) & (nx >= 0) & (nx < LOGICAL)
    out[ny[keep], nx[keep]] = idx[ys[keep], xs[keep]]
    return out, int((~keep).sum())


def check(results, key, ok, detail):
    results[key] = {"pass": bool(ok), "detail": detail}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("png")
    ap.add_argument("--stage", required=True, choices=["kitten", "adult"])
    ap.add_argument("--action", required=True, choices=sorted(ACTIONS))
    ap.add_argument("--frames", type=int)
    args = ap.parse_args()
    frames_needed = args.frames or ACTIONS[args.action]
    r = {}
    raw = np.asarray(Image.open(args.png).convert("RGBA"))
    check(r, "ART-RAW-01", raw.shape[:2] == (SIZE, SIZE), f"{raw.shape[1]}x{raw.shape[0]}")
    if raw.shape[:2] != (SIZE, SIZE):
        return finish(args, r, None, None)

    mask, bg = remove_background(raw)
    bg_ok = bg["mode"] == "transparent" or bg["corner_spread"] < 10
    check(r, "ART-RAW-02", bg_ok, bg)
    rgb = raw[..., :3]

    cells, used = [], []
    for k in range(GRID * GRID):
        cy, cx = divmod(k, GRID)
        sl = (slice(cy * CELL, (cy + 1) * CELL), slice(cx * CELL, (cx + 1) * CELL))
        cells.append((rgb[sl], mask[sl]))
        if mask[sl].sum() >= 200:
            used.append(k)
    check(r, "ART-RAW-03", used == list(range(frames_needed)),
          f"cells with a pose: {[u + 1 for u in used]}, expected 1-{frames_needed}")

    raw_frames = []
    margins_ok, single_ok, grid_scores = True, True, []
    margin_detail, single_detail = [], []
    for k in used:
        crgb, cmask = cells[k]
        count, labels, stats, _ = cv2.connectedComponentsWithStats(cmask.astype(np.uint8), connectivity=8)
        areas = sorted(stats[1:, cv2.CC_STAT_AREA], reverse=True)
        share = (areas[0] + (areas[1] if len(areas) > 1 and args.action in PROP_ACTIONS else 0)) / sum(areas)
        if share < (0.95 if args.action in PROP_ACTIONS else 0.90):
            single_ok = False
            single_detail.append(f"cell {k + 1}: main body {share:.0%}")
        ys, xs = np.nonzero(cmask)
        top, bottom, left, right = ys.min(), CELL - 1 - ys.max(), xs.min(), CELL - 1 - xs.max()
        if top < 16 or bottom < 4 or left < 8 or right < 8:
            margins_ok = False
            margin_detail.append(f"cell {k + 1}: top {top} bottom {bottom} left {left} right {right}")
        ox, oy, score = best_phase(crgb, cmask)
        grid_scores.append(round(score, 2))
        raw_frames.append((crgb, cmask, ox, oy))
    check(r, "ART-RAW-04", single_ok, single_detail or "one main body per cell")
    check(r, "ART-RAW-05", margins_ok, margin_detail or "all poses inside their cells")
    check(r, "ART-RAW-06", bool(grid_scores) and min(grid_scores) >= 0.6, {"block_uniformity": grid_scores})

    logical, far_share = [], []
    for crgb, cmask, ox, oy in raw_frames:
        idx, far = to_logical(crgb, cmask, ox, oy)
        far_share.append(float(far[cmask].mean()) if cmask.any() else 0.0)
        logical.append(polish(idx))
    if not logical:
        return finish(args, r, None, None)

    # One shift for the whole sheet: frame 1's feet on row 61, its feet centred.
    ys, xs = np.nonzero(logical[0] >= 0)
    feet = xs[ys >= ys.max() - 11]
    dx, dy = CENTER_COL - int(round(feet.mean())), FEET_ROW - int(ys.max())
    shifted, lost = zip(*(shift(f, dx, dy) for f in logical))
    logical = [polish(f) for f in shifted]

    check(r, "ART-PX-01", all(set(np.unique(f)) <= set(range(-1, len(pp.COLORS))) for f in logical),
          "24 character colours, alpha 0/255 by construction")
    check(r, "ART-PX-02", max(far_share) <= 0.12, {"pixels_far_from_palette": [round(v, 3) for v in far_share]})
    problems = [px_problems(f) for f in logical]
    total = {k: sum(p[k] for p in problems) for k in problems[0]}
    check(r, "ART-PX-03", not any(total.values()) and sum(lost) == 0, {**total, "pixels_pushed_out_by_alignment": sum(lost)})

    heights, feet_rows, centres, eyes, dark, light, ears = [], [], [], [], [], [], []
    for f in logical:
        ys, xs = np.nonzero(f >= 0)
        heights.append(int(ys.max() - ys.min() + 1))
        feet_rows.append(int(ys.max()))
        body = (f >= 0) & (pp.FAMILY[np.clip(f, 0, None)] != "prop")
        centres.append(float(np.nonzero(body)[1].mean()))
        fam = pp.FAMILY[np.clip(f, 0, None)][body]
        eyes.append(int((fam == "eye").sum()))
        dark.append(float((fam == "dark").mean()))
        light.append(float((fam == "light").mean()))
        ears.append(int((f == PINK_EAR).sum()))
    lying = args.action in LYING_ACTIONS
    med = float(np.median(heights))
    check(r, "ART-ID-01", lying or max(abs(h - med) for h in heights) <= 3,
          {"heights": heights, "median": med, "exempt": lying})
    check(r, "ART-ID-02", lying or max(feet_rows) - min(feet_rows) <= 1, {"feet_rows": feet_rows, "exempt": lying})
    jumps = [round(abs(b - a), 1) for a, b in zip(centres, centres[1:])]
    check(r, "ART-ID-03", args.action == "walk" or not jumps or max(jumps) <= 2,
          {"centre_moves": jumps, "exempt": args.action == "walk"})
    eye_ok = args.action in EYES_CLOSED_ACTIONS or np.mean([e >= 6 for e in eyes]) >= 0.5
    materials_ok = min(dark) >= 0.25 and all(0.05 <= v <= 0.40 for v in light) and eye_ok and max(ears) >= 2
    check(r, "ART-ID-04", materials_ok, {"dark_fur": [round(v, 2) for v in dark], "white": [round(v, 2) for v in light],
                                          "eye_pixels": eyes, "ear_pink_pixels": ears})
    diffs = [float(((a >= 0) | (b >= 0))[a != b].sum() / max(1, ((a >= 0) | (b >= 0)).sum()))
             for a, b in zip(logical, logical[1:])]
    duplicates = [(i + 1, j + 1) for i in range(len(logical)) for j in range(i + 1, len(logical))
                  if np.array_equal(logical[i], logical[j])]
    check(r, "ART-ID-05", (not diffs or min(diffs) >= 0.015) and not duplicates,
          {"changed_between_frames": [round(d, 3) for d in diffs], "identical_pairs": duplicates})
    other = OUT_DIR / ("adult" if args.stage == "kitten" else "kitten") / "idle-report.json"
    if args.action == "idle" and other.exists():
        other_med = json.loads(other.read_text())["checks"]["ART-ID-01"]["detail"]["median"]
        kitten_h, adult_h = (med, other_med) if args.stage == "kitten" else (other_med, med)
        check(r, "ART-ID-06", adult_h - kitten_h >= 4, {"kitten_height": kitten_h, "adult_height": adult_h})
    return finish(args, r, logical, raw_frames)


def finish(args, results, logical, raw_frames):
    out = OUT_DIR / args.stage
    out.mkdir(parents=True, exist_ok=True)
    if logical:
        rows = (len(logical) + 7) // 8
        sheet = np.zeros((rows * LOGICAL, 8 * LOGICAL, 4), np.uint8)
        review = Image.new("RGBA", (len(logical) * 200 + 8, 400), (40, 40, 40, 255))
        for i, f in enumerate(logical):
            rgba = np.zeros((LOGICAL, LOGICAL, 4), np.uint8)
            rgba[f >= 0, :3] = pp.RGB[f[f >= 0]]
            rgba[f >= 0, 3] = 255
            y, x = divmod(i, 8)
            sheet[y * LOGICAL:(y + 1) * LOGICAL, x * LOGICAL:(x + 1) * LOGICAL] = rgba
            crgb, cmask, _, _ = raw_frames[i]
            original = Image.fromarray(np.dstack([crgb, cmask.astype(np.uint8) * 255]), "RGBA").resize((192, 192), Image.NEAREST)
            floor = Image.new("RGBA", (192, 192), (206, 124, 71, 255))
            review.paste(Image.alpha_composite(floor, original), (8 + i * 200, 4))
            converted = Image.fromarray(rgba, "RGBA").resize((192, 192), Image.NEAREST)
            review.paste(Image.alpha_composite(floor, converted), (8 + i * 200, 204))
        Image.fromarray(np.repeat(np.repeat(sheet, 2, 0), 2, 1), "RGBA").save(out / f"{args.action}.png")
        review.save(out / f"{args.action}-review.png")
    failed = [k for k, v in results.items() if not v["pass"]]
    report = {"source": str(Path(args.png).resolve()), "stage": args.stage, "action": args.action,
              "passed": not failed, "failed": failed, "checks": results}
    (out / f"{args.action}-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2, default=str) + "\n")
    for k, v in results.items():
        print(f"{'PASS' if v['pass'] else 'FAIL'}  {k}  {v['detail'] if not v['pass'] else ''}")
    print(("ALL AUTOMATED CHECKS PASS" if not failed else f"{len(failed)} FAILED: {', '.join(failed)}") +
          f"  → {out.relative_to(ROOT)}/{args.action}-report.json")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
