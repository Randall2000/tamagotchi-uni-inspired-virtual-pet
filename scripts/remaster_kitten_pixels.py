#!/usr/bin/env python3
"""Deterministic pixel remaster of the existing approved kitten's 64 poses.

Does NOT invent/redesign anatomy. No diffusion or anti-aliased resizing.
The immutable original drawings remain untouched. Makes 128px cells using a
64px native logical pixel grid (2x nearest neighbor) and a shared fixed palette.
"""
from pathlib import Path
from PIL import Image
import numpy as np
import cv2

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/assets"
SOURCE = ASSETS / "momo-kitten-64-v2.png"
OUTPUT = ASSETS / "momo-kitten-64-v3.png"
GRID = 8
LOGICAL = 64
CELL = 128

# Fixed kitten palette, based on the approved original tuxedo kitten's
# dark charcoal fur, white chin/chest, green-yellow eyes and pink ears.
PALETTE = np.array([
    [26, 14, 23], [36, 24, 33], [46, 39, 47], [56, 49, 57],
    [70, 63, 73], [85, 78, 91], [110, 105, 116],
    [161, 158, 165], [202, 201, 203], [228, 225, 225],
    [251, 246, 243], [255, 255, 255],
    [26, 25, 28], [110, 126, 36], [155, 179, 50],
    [205, 222, 70], [223, 238, 92], [237, 248, 124],
    [162, 69, 85], [201, 100, 120], [233, 135, 150],
    [247, 174, 182], [247, 120, 142],
    [118, 68, 38], [165, 101, 44], [210, 152, 63],
    [133, 42, 75], [195, 63, 99], [239, 119, 161],
    [252, 170, 197], [75, 140, 166], [153, 208, 227],
], dtype=np.uint8)
# Palette index 0 is deep plum outline, 15–17 are iris and 18–22 pink.
IRIS_INDICES = np.array([13, 14, 15, 16, 17], dtype=np.int16)
OPEN_THRESHOLD = 52
CANONICAL_OPEN_FRAME = 0
GAZE_LEFT = {9, 10, 24, 25, 57, 58}
GAZE_RIGHT = {6, 60, 61}
# Eye sockets are localized; never move/rotate/scale the whole head or cat.
EYE_BOXES = [(22, 23, 35, 34), (36, 23, 49, 34)]

def to_lab(rgb):
    return cv2.cvtColor(np.asarray(rgb, dtype=np.uint8).reshape(-1,1,3), cv2.COLOR_RGB2LAB).reshape(-1,3).astype(np.float32)

PALETTE_LAB = to_lab(PALETTE)

def quantize(tile: Image.Image) -> Image.Image:
    arr = np.asarray(tile.convert('RGBA'), dtype=np.uint8)
    visible = arr[:,:,3] >= 128
    rgb = arr[:,:,:3]
    out = np.zeros((LOGICAL, LOGICAL, 4), dtype=np.uint8)
    if visible.any():
        samples = rgb[visible]
        lab = to_lab(samples)
        distances = ((lab[:, None, :] - PALETTE_LAB[None, :, :])**2).sum(axis=2)
        closest = np.argmin(distances, axis=1)
        # Enforce green-yellow iris materials only from the eye shades. This
        # keeps mixed/blurred near-green shades from contaminating dark fur.
        is_iris = ((samples[:,1].astype(int)>135)
                   & (samples[:,1].astype(int)>=samples[:,0].astype(int)-10)
                   & (samples[:,1].astype(int)>samples[:,2].astype(int)*1.35)
                   & (samples[:,2]<195))
        if is_iris.any():
            sub = distances[is_iris][:, IRIS_INDICES]
            closest[is_iris] = IRIS_INDICES[np.argmin(sub, axis=1)]
        out[visible, :3] = PALETTE[closest]
        out[visible, 3] = 255
    return Image.fromarray(out, 'RGBA')

def iris_count(tile):
    a=np.asarray(tile)
    mask=np.isin(a[:,:,0], PALETTE[IRIS_INDICES,0]) & (a[:,:,3]==255)
    # Use exact palette-color indices in the face region.
    region=a[23:34,22:49,:3].reshape(-1,3)
    return int(sum(np.any(np.all(region==color,axis=1)) for color in PALETTE[IRIS_INDICES]))

def iris_count_source(tile):
    a=np.asarray(tile)
    face=a[23:34,21:51]
    r=face[:,:,0].astype(int);g=face[:,:,1].astype(int);b=face[:,:,2].astype(int)
    return int(((g>135)&(g>=r-10)&(g>b*1.35)&(b<195)&(face[:,:,3]>128)).sum())

def move_pupil(eye, delta):
    """Keep iris socket fixed, shift only the dark pupil pixels in its middle."""
    pixels=np.array(eye,copy=True)
    h,w=pixels.shape[:2]
    # Recolor the dark pupil interior with the local lime tone, not the rim.
    iris_color=np.array([223,238,92,255],dtype=np.uint8)
    pupil=np.zeros((h,w),bool)
    for y in range(3,min(h,10)):
        for x in range(3,min(w-2,10)):
            px=pixels[y,x]
            if (px[3] and max(px[:3])<75 and 3<=x<w-3):
                if (any(np.array_equal(pixels[ny,nx,:3],c) for ny in range(max(0,y-1),min(h,y+2)) for nx in range(max(0,x-1),min(w,x+2)) for c in PALETTE[15:18])):
                    pupil[y,x]=True
    if not pupil.any():
        return pixels
    pixels[pupil]=iris_color
    for y,x in zip(*np.where(pupil)):
        nx=x+delta
        if 2<=nx<w-2:
            pixels[y,nx]=np.array([26,25,28,255],dtype=np.uint8)
    return pixels

def normalize_eyes(tiles):
    original=tiles[CANONICAL_OPEN_FRAME]
    template=np.array(original,copy=True)
    normalized=[]
    open_frames=[]
    for frame,tile in enumerate(tiles):
        a=np.array(tile,copy=True)
        if iris_count_source(tile)>OPEN_THRESHOLD or (frame in GAZE_RIGHT and iris_count_source(tile)>35):
            gaze=-1 if frame in GAZE_LEFT else 1 if frame in GAZE_RIGHT else 0
            for x0,y0,x1,y1 in EYE_BOXES:
                patch=template[y0:y1,x0:x1].copy()
                if gaze: patch=move_pupil(patch,gaze)
                a[y0:y1,x0:x1]=patch
            open_frames.append(frame)
        normalized.append(Image.fromarray(a,'RGBA'))
    return normalized, open_frames

def main():
    source=Image.open(SOURCE).convert('RGBA')
    tiles=[]
    for i in range(64):
        col,row=i%GRID,i//GRID
        bounds=tuple(round(v) for v in (
            col*source.width/GRID,row*source.height/GRID,
            (col+1)*source.width/GRID,(row+1)*source.height/GRID))
        # Crop to an exact cell first (old v2 has 1254/8 nonintegral cells).
        # Never use linear/cubic interpolation on pixel art.
        tile=source.crop(bounds).resize((LOGICAL,LOGICAL),Image.Resampling.NEAREST)
        tiles.append(quantize(tile))
    tiles,open_frames=normalize_eyes(tiles)
    atlas=Image.new('RGBA',(GRID*CELL,GRID*CELL))
    for i,tile in enumerate(tiles):
        atlas.alpha_composite(tile.resize((CELL,CELL),Image.Resampling.NEAREST),
                              (i%GRID*CELL,i//GRID*CELL))
    atlas.save(OUTPUT,optimize=True)
    print("WROTE", OUTPUT,"size",atlas.size,"palette",len(PALETTE),"normalized-open-eyes",open_frames)

if __name__=="__main__":
    main()
