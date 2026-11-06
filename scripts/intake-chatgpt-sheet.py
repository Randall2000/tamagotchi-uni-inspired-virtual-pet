#!/usr/bin/env python3
"""Check and convert one ChatGPT-generated character sheet (docs/ART_SPEC_CHATGPT.md).

ChatGPT draws each pose as roughly 32x32 pixel art on its own canvas size (about 1250px), with
art pixels of a fractional size (~9-10px). Each cell is sampled on a 32x32 grid (cell size / 32),
shifted to the offset where the blocks are most uniform, maps them onto the didi palette, applies the
pixel polish, aligns the sheet once (frame 1's feet), runs every automated condition (ART-RAW,
ART-PX, ART-ID) and writes the result in the game's format (each logical pixel a 4x4 block,
128px cells, 8 columns) plus a review image and a JSON report to output/art-intake/<stage>/.
It never touches the game's assets. Exit code 0 only when every automated check passes.

Usage: python3 scripts/intake-chatgpt-sheet.py <png> --stage kitten|adult --action <name|identity> [--frames N]
  --action identity  a character sheet (8 poses + 8 expressions): no size/feet/centre/liveliness checks
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

GRID = 4                    # 4x4 cells per sheet
LOGICAL = 32                # art pixels per sprite side
OUT_SCALE = 4               # 32 logical -> 128px cells in the game format
FEET_ROW, CENTER_COL = 30, 16
pp.FEET_ROWS = 3            # toe gaps: notch filling stops 3 rows above the bottom
MAX_HEIGHT = {"kitten": 24, "adult": 28}
ACTIONS = {name: 8 for name in [
    "idle", "walk", "eat", "drink", "snack", "play", "groom", "petting", "sleep_prep", "sleep",
    "wake", "yawn", "tail_wag", "curious", "happy", "sad", "angry", "sick", "toilet"]}
ACTIONS["identity"] = 16    # 8 poses + 8 expressions
PROP_ACTIONS = {"eat", "drink", "snack", "play", "toilet"}
LYING_ACTIONS = {"sleep", "sleep_prep", "sick", "toilet", "wake", "identity"}
EYES_CLOSED_ACTIONS = {"sleep", "sleep_prep", "sick"}
# Calm actions need one frame with silhouette IoU <= 0.92; big actions two frames <= 0.85.
# Thresholds are provisional until the first approved ChatGPT sheets are measured.
CALM_ACTIONS = {"idle", "tail_wag", "sleep", "walk", "curious", "sad", "sick", "yawn"}


def liveliness(logical, action):
    """ART-MOVE: changes must not stay on the face, the silhouette must change, and the head,
    body and legs must all move during the action."""
    heights = []
    for f in logical:
        fy = np.nonzero(f >= 0)[0]
        heights.append((fy.min(), fy.max()) if len(fy) else (0, 0))
    top = min(t for t, _ in heights)
    bottom = max(b for _, b in heights)
    span = max(1, bottom - top + 1)
    face_only, extents, union = 0, [], np.zeros_like(logical[0], dtype=bool)
    for a, b in zip(logical, logical[1:]):
        changed = (a != b) & ((a >= 0) | (b >= 0))
        union |= changed
        cy = np.nonzero(changed)[0]
        extent = (cy.max() - cy.min() + 1) / span if len(cy) else 0.0
        extents.append(round(float(extent), 2))
        face_only += extent < 0.30
    first = logical[0] >= 0
    ious = []
    for f in logical[1:]:
        m = f >= 0
        ious.append(round(float((first & m).sum() / max(1, (first | m).sum())), 2))
    thirds = [int(union[top + k * span // 3: top + (k + 1) * span // 3].sum()) for k in range(3)]
    calm = action in CALM_ACTIONS
    need_iou, need_count = (0.92, 1) if calm else (0.85, 2)
    return {
        "ART-MOVE-01": (face_only <= 2, {"face_only_transitions": int(face_only), "change_height_share": extents}),
        "ART-MOVE-02": (sum(i <= need_iou for i in ious) >= need_count,
                        {"silhouette_iou_vs_frame1": ious, "need": f"{need_count} frame(s) <= {need_iou}"}),
        "ART-MOVE-03": (sum(t >= 4 for t in thirds) >= (2 if action == "sleep" else 3),
                        {"changed_pixels_head_body_legs": thirds}),
    }
OUTLINE, PINK_EAR = pp.COLORS.index("#1a0e17"), pp.COLORS.index("#e98796")


def delta_e(a, b):
    return np.sqrt(((a - b) ** 2).sum(-1))


def remove_background(rgba):
    """Opaque mask for the sprites: real transparency, or a flat key colour."""
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


def edge_positions(rgb, mask, axis):
    """Coordinates of colour boundaries inside the sprites along one axis."""
    a = rgb.astype(int)
    d = np.abs(np.diff(a, axis=axis)).max(-1) > 24
    both = (mask[:, 1:] & mask[:, :-1]) if axis == 1 else (mask[1:] & mask[:-1])
    ys, xs = np.nonzero(d & both)
    return (xs if axis == 1 else ys) + 1.0


def coherence(pos, pitch):
    s = np.exp(2j * np.pi * pos / pitch).sum()
    return abs(s) / max(1, len(pos)), np.angle(s)


def detect_pitch(rgb, mask):
    """Art pixel size: the largest pitch whose boundaries line up (sub-multiples also line up)."""
    xs, ys = edge_positions(rgb, mask, 1), edge_positions(rgb, mask, 0)
    pitches = np.arange(5.0, 16.0, 0.02)
    scores = np.array([(coherence(xs, p)[0] + coherence(ys, p)[0]) / 2 for p in pitches])
    good = pitches[scores >= 0.9 * scores.max()]
    pitch = float(good.max())
    return pitch, float(scores[np.argmin(abs(pitches - pitch))])


def sample_cell(rgb, mask, nearest):
    """32x32 logical grid for one cell (pitch = cell size / 32), shifted to the offset where the
    sampled blocks are most uniform. Returns the grid, the block uniformity and the offset."""
    py, px = rgb.shape[0] / LOGICAL, rgb.shape[1] / LOGICAL
    r = max(1, int(round(min(px, py) * 0.25)))
    a = rgb.astype(int)

    def sample(ox, oy, keep):
        idx = np.full((LOGICAL, LOGICAL), -1, dtype=np.int16)
        uniform = []
        for j in range(LOGICAL):
            cy = int(oy + (j + 0.5) * py)
            for i in range(LOGICAL):
                cx = int(ox + (i + 0.5) * px)
                if cy >= rgb.shape[0] or cx >= rgb.shape[1]:
                    continue
                win = (slice(max(0, cy - r), cy + r + 1), slice(max(0, cx - r), cx + r + 1))
                m = mask[win]
                if m.mean() < 0.5:
                    continue
                block = a[win][m]
                uniform.append(int((block.max(0) - block.min(0)).max() <= 24))
                if keep:
                    idx[j, i] = np.bincount(nearest[win][m]).argmax()
        return idx, float(np.mean(uniform)) if uniform else 0.0

    best = max(((ox, oy) for oy in np.arange(-py / 2, py / 2, 1.0) for ox in np.arange(-px / 2, px / 2, 1.0)),
               key=lambda o: sample(o[0], o[1], False)[1])
    idx, u = sample(best[0], best[1], True)
    return idx, u


def polish(idx):
    for _ in range(10):
        before = idx
        idx = pp.outline_edges(pp.fill_notches(pp.despeckle(pp.stray_props(idx)), LOGICAL))
        if np.array_equal(idx, before):
            break
    return idx


def px_problems(idx):
    """Same rules as tests/pixel-palette.test.js, on the 32px grid."""
    n4 = pp.neighbours(idx, pp.N4)
    n8 = pp.neighbours(idx, pp.N8)
    opaque4 = (n4 >= 0).sum(0)
    fam = pp.FAMILY[np.clip(idx, 0, None)]
    rows = np.arange(idx.shape[0])[:, None]
    problems = {"speckle": 0, "strayProp": 0,
                "notch": int(((idx < 0) & (opaque4 >= 3) & (rows < LOGICAL - pp.FEET_ROWS)).sum()),
                "edge": int(((idx >= 0) & (fam != "eye") & (opaque4 == 3) & (idx != OUTLINE)).sum())}
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


def window(idx, oy, ox):
    """LOGICAL x LOGICAL view of a cell grid starting at (oy, ox); returns it and the pixels left out."""
    out = np.full((LOGICAL, LOGICAL), -1, dtype=np.int16)
    ys, xs = np.nonzero(idx >= 0)
    ny, nx = ys - oy, xs - ox
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
    ap.add_argument("--out", help="output folder (default output/art-intake); use a separate one for experiments")
    args = ap.parse_args()
    global OUT_DIR
    if args.out:
        OUT_DIR = Path(args.out).resolve()
    frames_needed = args.frames or ACTIONS[args.action]
    r = {}
    raw = np.asarray(Image.open(args.png).convert("RGBA"))
    h, w = raw.shape[:2]
    canvas_ok = 1000 <= min(h, w) and max(h, w) <= 2048 and abs(h / w - 1) <= 0.02
    check(r, "ART-RAW-01", canvas_ok, f"{w}x{h} (square within 2%, 1000-2048px)")
    if not canvas_ok:
        return finish(args, r, None, None)

    mask, bg = remove_background(raw)
    check(r, "ART-RAW-02", bg["mode"] == "transparent" or bg["corner_spread"] < 10, bg)
    rgb = raw[..., :3]
    lab = pp.to_lab(rgb)
    nearest = ((lab[..., None, :] - pp.LAB[None, None]) ** 2).sum(-1).argmin(-1)
    far = delta_e(lab, pp.LAB[nearest]) > 12

    ys = np.linspace(0, h, GRID + 1).round().astype(int)
    xs = np.linspace(0, w, GRID + 1).round().astype(int)
    cells = [(slice(ys[k // GRID], ys[k // GRID + 1]), slice(xs[k % GRID], xs[k % GRID + 1])) for k in range(GRID * GRID)]
    used = [k for k, c in enumerate(cells) if mask[c].sum() >= 400]
    check(r, "ART-RAW-03", used == list(range(frames_needed)),
          f"cells with a pose: {[u + 1 for u in used]}, expected 1-{frames_needed}")
    if not used:
        return finish(args, r, None, None)

    pitch, pitch_score = detect_pitch(rgb, mask)
    cell_pitch = (xs[1] - xs[0]) / LOGICAL  # the 32x32 grid the spec asks for
    single_ok, single_detail, margin_ok, margin_detail = True, [], True, []
    grids, uniform, raw_cells = [], [], []
    for k in used:
        c = cells[k]
        cmask = mask[c]
        count, labels, stats, _ = cv2.connectedComponentsWithStats(cmask.astype(np.uint8), connectivity=8)
        areas = sorted(stats[1:, cv2.CC_STAT_AREA], reverse=True)
        share = (areas[0] + (areas[1] if len(areas) > 1 and args.action in PROP_ACTIONS else 0)) / sum(areas)
        if share < (0.95 if args.action in PROP_ACTIONS else 0.90):
            single_ok = False
            single_detail.append(f"cell {k + 1}: main body {share:.0%}")
        py, px = np.nonzero(cmask)
        top, bottom = py.min() / cell_pitch, (cmask.shape[0] - 1 - py.max()) / cell_pitch
        left, right = px.min() / cell_pitch, (cmask.shape[1] - 1 - px.max()) / cell_pitch
        if top < 3 or bottom < 1 or left < 1 or right < 1:
            margin_ok = False
            margin_detail.append(f"cell {k + 1}: art-pixel margins top {top:.1f} bottom {bottom:.1f} left {left:.1f} right {right:.1f}")
        grid, u = sample_cell(rgb[c], cmask, nearest[c])
        grids.append(grid)
        uniform.append(round(u, 2))
        raw_cells.append((rgb[c], cmask))
    check(r, "ART-RAW-04", single_ok, single_detail or "one main body per cell")
    check(r, "ART-RAW-05", margin_ok, margin_detail or "all poses inside their cells with margins")
    # The drawing must sit on the 32x32 grid: most sampled blocks a single colour.
    check(r, "ART-RAW-06", min(uniform) >= 0.75,
          {"grid_px": round(cell_pitch, 2), "block_uniformity": uniform,
           "measured_art_pixel_px": round(pitch, 2), "grid_coherence": round(pitch_score, 2)})

    # One window for the whole sheet: frame 1's feet on row 30, centred on column 16.
    gy, gx = np.nonzero(grids[0] >= 0)
    feet = gx[gy >= gy.max() - 5]
    oy, ox = int(gy.max()) - FEET_ROW, int(round(feet.mean())) - CENTER_COL
    placed = [window(g, oy, ox) for g in grids]
    logical = [polish(g) for g, _ in placed]
    lost = [n for _, n in placed]

    check(r, "ART-PX-01", True, "24 character colours, alpha 0/255 by construction")
    far_share = [round(float(far[c][mask[c]].mean()), 3) for c in (cells[k] for k in used)]
    check(r, "ART-PX-02", max(far_share) <= 0.12, {"pixels_far_from_palette": far_share})
    problems = [px_problems(f) for f in logical]
    total = {k: sum(p[k] for p in problems) for k in problems[0]}
    check(r, "ART-PX-03", not any(total.values()) and sum(lost) == 0,
          {**total, "pixels_outside_32x32_window": lost})

    heights, feet_rows, centres, eyes, dark, light, ears = [], [], [], [], [], [], []
    for f in logical:
        fy, fx = np.nonzero(f >= 0)
        heights.append(int(fy.max() - fy.min() + 1) if len(fy) else 0)
        feet_rows.append(int(fy.max()) if len(fy) else -1)
        body = (f >= 0) & (pp.FAMILY[np.clip(f, 0, None)] != "prop")
        centres.append(float(np.nonzero(body)[1].mean()) if body.any() else 0.0)
        fam = pp.FAMILY[np.clip(f, 0, None)][body]
        eyes.append(int((fam == "eye").sum()))
        dark.append(float((fam == "dark").mean()) if len(fam) else 0.0)
        light.append(float((fam == "light").mean()) if len(fam) else 0.0)
        ears.append(int((f == PINK_EAR).sum()))
    # Size, feet and position stay steady only in calm actions; lively actions are expected to
    # crouch, leap and travel (their liveliness is checked by ART-MOVE, their size by ART-ID-07).
    lively = args.action not in CALM_ACTIONS
    lying = args.action in LYING_ACTIONS or lively
    med = float(np.median(heights))
    check(r, "ART-ID-01", lying or max(abs(x - med) for x in heights) <= 2,
          {"heights": heights, "median": med, "exempt": lying})
    check(r, "ART-ID-02", lying or max(feet_rows) - min(feet_rows) <= 1, {"feet_rows": feet_rows, "exempt": lying})
    jumps = [round(abs(b - a), 1) for a, b in zip(centres, centres[1:])]
    exempt3 = args.action in ("walk", "identity") or lively
    check(r, "ART-ID-03", exempt3 or not jumps or max(jumps) <= 1, {"centre_moves": jumps, "exempt": exempt3})
    eye_ok = args.action in EYES_CLOSED_ACTIONS or np.mean([e >= 2 for e in eyes]) >= 0.5
    face_white = [v for v, e in zip(light, eyes) if e >= 2] or light
    materials_ok = (min(dark) >= 0.25 and all(0.05 <= v <= 0.40 for v in face_white) and max(light) <= 0.40
                    and eye_ok and max(ears) >= 1)
    check(r, "ART-ID-04", materials_ok, {"dark_fur": [round(v, 2) for v in dark], "white": [round(v, 2) for v in light],
                                          "eye_pixels": eyes, "ear_pink_pixels": ears})
    diffs = [float(((a >= 0) | (b >= 0))[a != b].sum() / max(1, ((a >= 0) | (b >= 0)).sum()))
             for a, b in zip(logical, logical[1:])]
    duplicates = [(i + 1, j + 1) for i in range(len(logical)) for j in range(i + 1, len(logical))
                  if np.array_equal(logical[i], logical[j])]
    check(r, "ART-ID-05", (not diffs or min(diffs) >= 0.015) and not duplicates,
          {"changed_between_frames": [round(d, 3) for d in diffs], "identical_pairs": duplicates})
    check(r, "ART-ID-07", max(heights) <= MAX_HEIGHT[args.stage],
          {"max_height": max(heights), "limit": MAX_HEIGHT[args.stage]})
    if args.action != "identity":
        for key, (ok, detail) in liveliness(logical, args.action).items():
            check(r, key, ok, detail)
    if args.action in ("idle", "identity"):
        other = OUT_DIR / ("adult" if args.stage == "kitten" else "kitten") / f"{args.action}-report.json"
        if other.exists():
            other_checks = json.loads(other.read_text())["checks"]
            if "ART-ID-07" in other_checks:
                other_h = other_checks["ART-ID-07"]["detail"]["max_height"]
                kitten_h, adult_h = (max(heights), other_h) if args.stage == "kitten" else (other_h, max(heights))
                check(r, "ART-ID-06", adult_h - kitten_h >= 3, {"kitten_max_height": kitten_h, "adult_max_height": adult_h})
    return finish(args, r, logical, raw_cells)


def finish(args, results, logical, raw_cells):
    out = OUT_DIR / args.stage
    out.mkdir(parents=True, exist_ok=True)
    if logical:
        rows = (len(logical) + 7) // 8
        sheet = np.zeros((rows * LOGICAL, 8 * LOGICAL, 4), np.uint8)
        review = Image.new("RGBA", (len(logical) * 200 + 8, 400), (40, 40, 40, 255))
        floor = Image.new("RGBA", (192, 192), (206, 124, 71, 255))
        for i, f in enumerate(logical):
            rgba = np.zeros((LOGICAL, LOGICAL, 4), np.uint8)
            rgba[f >= 0, :3] = pp.RGB[f[f >= 0]]
            rgba[f >= 0, 3] = 255
            y, x = divmod(i, 8)
            sheet[y * LOGICAL:(y + 1) * LOGICAL, x * LOGICAL:(x + 1) * LOGICAL] = rgba
            crgb, cmask = raw_cells[i]
            original = Image.fromarray(np.dstack([crgb, cmask.astype(np.uint8) * 255]), "RGBA").resize((192, 192), Image.NEAREST)
            review.paste(Image.alpha_composite(floor, original), (8 + i * 200, 4))
            converted = Image.fromarray(rgba, "RGBA").resize((192, 192), Image.NEAREST)
            review.paste(Image.alpha_composite(floor, converted), (8 + i * 200, 204))
        big = np.repeat(np.repeat(sheet, OUT_SCALE, 0), OUT_SCALE, 1)
        Image.fromarray(big, "RGBA").save(out / f"{args.action}.png")
        review.save(out / f"{args.action}-review.png")
    failed = [k for k, v in results.items() if not v["pass"]]
    report = {"source": str(Path(args.png).resolve()), "stage": args.stage, "action": args.action,
              "passed": not failed, "failed": failed, "checks": results}
    (out / f"{args.action}-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2, default=str) + "\n")
    for k, v in results.items():
        print(f"{'PASS' if v['pass'] else 'FAIL'}  {k}  {v['detail'] if not v['pass'] else ''}")
    shown = out.relative_to(ROOT) if out.is_relative_to(ROOT) else out
    print(("ALL AUTOMATED CHECKS PASS" if not failed else f"{len(failed)} FAILED: {', '.join(failed)}") +
          f"  → {shown}/{args.action}-report.json")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
