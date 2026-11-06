#!/usr/bin/env python3
"""Rebuild the existing adult poses on the approved kitten's pixel grid and palette."""
from pathlib import Path
from PIL import Image
import numpy as np
from remaster_kitten_pixels import ASSETS, LOGICAL, CELL, PALETTE, quantize

SOURCE = ASSETS / 'momo-adult-64-v3.png'
OUTPUT = ASSETS / 'momo-adult-64-v4.png'

def quantize_adult(tile):
    small = tile.convert('RGBA').resize((LOGICAL, LOGICAL), Image.Resampling.NEAREST)
    out = np.array(quantize(small))
    # Adult source eyes are darker. Use the approved kitten iris pigment while
    # keeping the original pupils, eyelids and eye positions.
    for x0, x1 in ((22, 35), (36, 49)):
        eye = out[23:34, x0:x1]
        iris = np.zeros(eye.shape[:2], dtype=bool)
        for color in PALETTE[13:18]:
            iris |= np.all(eye[:, :, :3] == color, axis=2) & (eye[:, :, 3] == 255)
        eye[iris, :3] = PALETTE[15]
    return Image.fromarray(out, 'RGBA')

def main():
    source = Image.open(SOURCE).convert('RGBA')
    atlas = Image.new('RGBA', (8 * CELL, 8 * CELL))
    for frame in range(64):
        x, y = frame % 8, frame // 8
        bounds = (round(x * source.width / 8), round(y * source.height / 8),
                  round((x + 1) * source.width / 8), round((y + 1) * source.height / 8))
        tile = quantize_adult(source.crop(bounds)).resize((CELL, CELL), Image.Resampling.NEAREST)
        atlas.paste(tile, (x * CELL, y * CELL))
    atlas.save(OUTPUT, optimize=True)
    print('WROTE', OUTPUT)

if __name__ == '__main__':
    main()
