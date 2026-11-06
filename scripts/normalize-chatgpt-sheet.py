#!/usr/bin/env python3
"""Place eight generated poses on an exact, palette-locked 32px cell grid.

The unmodified ChatGPT render remains in public/assets/didi-generated/raw/. This makes a technical
derivative for intake and visual review; it never replaces game art.
"""
import argparse
import importlib.util
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('pixel_polish', ROOT / 'scripts/pixel-polish.py')
pp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pp)
PALETTE = np.array([tuple(bytes.fromhex(c[1:])) for c in pp.COLORS], dtype=np.uint8)
LAB_PALETTE = cv2.cvtColor(PALETTE.reshape(1, -1, 3), cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.int16)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source', type=Path)
    ap.add_argument('destination', type=Path)
    ap.add_argument('--allow-props', action='store_true')
    args = ap.parse_args()
    src = Image.open(args.source).convert('RGBA')
    pixels = np.asarray(src)
    width, height = src.size
    pitch = width / 128
    out = Image.new('RGBA', (1024, 1024))
    for frame in range(8):
        col, row = frame % 4, frame // 4
        x0, x1 = round(col * width / 4), round((col + 1) * width / 4)
        band0 = 0 if row == 0 else round(height * .28)
        band1 = round(height * .28) if row == 0 else round(height * .55)
        mask = pixels[band0:band1, x0:x1, 3] >= 128
        yy, _ = np.where(mask)
        if not len(yy):
            raise ValueError(f'no character in cell {frame + 1}')
        bottom = band0 + int(yy.max())
        # Keep the source column and its alignment; place the feet at row 30.
        top = bottom - 31 * pitch
        cell = src.crop((x0, round(top), x1, round(top + 32 * pitch)))
        small = np.asarray(cell.resize((32, 32), Image.Resampling.NEAREST)).copy()
        opaque = small[:, :, 3] >= 128
        clean = np.zeros((32, 32, 4), dtype=np.uint8)
        if opaque.any():
            lab = cv2.cvtColor(small[:, :, :3], cv2.COLOR_RGB2LAB).astype(np.int16)
            allowed = len(PALETTE) if args.allow_props else 19
            distances = ((lab[opaque, None, :].astype(np.int32) - LAB_PALETTE[None, :allowed, :]) ** 2).sum(axis=2)
            clean[opaque, :3] = PALETTE[distances.argmin(axis=1)]
            clean[opaque, 3] = 255
        tile = Image.fromarray(clean, 'RGBA').resize((256, 256), Image.Resampling.NEAREST)
        out.paste(tile, (col * 256, row * 256))
    args.destination.parent.mkdir(parents=True, exist_ok=True)
    out.save(args.destination, optimize=True)
    print(args.destination)


if __name__ == '__main__':
    main()
