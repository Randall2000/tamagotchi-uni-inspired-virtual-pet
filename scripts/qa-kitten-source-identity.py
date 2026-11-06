#!/usr/bin/env python3
"""Independent acceptance: remaster cannot silently deform the existing kitten."""
from pathlib import Path
from PIL import Image
import numpy as np
import cv2

ASSETS=Path(__file__).resolve().parents[1]/'public/assets'
old=Image.open(ASSETS/'momo-kitten-64-v2.png').convert('RGBA')
new=Image.open(ASSETS/'momo-kitten-64-v3.png').convert('RGBA')
assert new.size==(1024,1024)
iou=[]
colors=[]
for f in range(64):
    col,row=f%8,f//8
    box=(round(col*old.width/8),round(row*old.height/8),
         round((col+1)*old.width/8),round((row+1)*old.height/8))
    a=np.array(old.crop(box).resize((64,64),Image.Resampling.NEAREST))
    b=np.array(new.crop((col*128,row*128,(col+1)*128,(row+1)*128))
               .resize((64,64),Image.Resampling.NEAREST))
    ma=a[:,:,3]>=128
    mb=b[:,:,3]>=128
    iou.append(float((ma&mb).sum()/(ma|mb).sum()))
    region=ma.copy()
    # Allow the deliberately registered left/right iris socket areas.
    region[23:34,22:35]=False
    region[23:34,36:49]=False
    al=cv2.cvtColor(a[:,:,:3],cv2.COLOR_RGB2LAB).astype(float)
    bl=cv2.cvtColor(b[:,:,:3],cv2.COLOR_RGB2LAB).astype(float)
    colors.extend(np.linalg.norm(al-bl,axis=2)[region].tolist())
mean=float(np.mean(colors))
p95=float(np.percentile(colors,95))
assert min(iou)>=0.98, ('silhouette mismatch',min(iou))
assert mean<=12 and p95<=25, ('palette drift',mean,p95)
print('KITTEN_SOURCE_IDENTITY_PASS',
      'frames=64','min_IoU='+str(round(min(iou),3)),
      'avg_Lab8='+str(round(mean,2)),'P95_Lab8='+str(round(p95,2)))

# Pixel-color acceptance tied to the original uploaded kitten, not merely the
# remastered atlas: hue, brightness, material isolation, and all action sheets.
from collections import Counter
original_master=Image.open(ASSETS/'momo-kitten.png').convert('RGBA')
reference=np.array(original_master.resize((64,64),Image.Resampling.NEAREST))
final_atlas=Image.open(ASSETS/'momo-kitten-64-v3.png').convert('RGBA')
open_frames=[
    0,1,5,6,7,8,9,10,14,15,16,17,22,23,24,25,26,27,28,29,30,31,
    40,41,42,45,46,47,48,49,50,54,55,56,57,58,59,60,61,63
]
eye_boxes=[(22,23,35,34),(36,23,49,34)]
forbidden={
    (118,68,38), (165,101,44), (210,152,63),
    (75,140,166), (153,208,227),
    (133,42,75), (195,63,99), (239,119,161),
}
def iris_pixels(tile):
    face=tile[23:34,22:49].astype(np.int16)
    r,g,b,a=face.transpose(2,0,1)
    iris=(g>135)&(g>=r-10)&(g>b*1.35)&(b<195)&(a>=128)
    return face[:,:,:3][iris]

reference_iris=iris_pixels(reference)
reference_median=np.median(reference_iris,axis=0)
assert len(reference_iris)>20, 'Original reference does not have valid visible irises'
stage_medians=[]
for frame in open_frames:
    col,row=frame%8,frame//8
    tile=np.array(final_atlas.crop((col*128,row*128,(col+1)*128,(row+1)*128))
                               .resize((64,64),Image.Resampling.NEAREST))
    pixels=iris_pixels(tile)
    assert len(pixels)>=50, ('eye lost iris on open pose',frame,len(pixels))
    median=np.median(pixels,axis=0)
    assert np.max(np.abs(median-reference_median))<=2, (
        'iris changed color vs fixed original kitten',frame,reference_median,median)
    stage_medians.append(tuple(median.astype(int)))
bad_colors=0
inspected_frames=0
for sheet in [final_atlas,*sorted((ASSETS/'momo-motions-preview/kitten').glob('*.png'))]:
    image=np.asarray(sheet.convert('RGBA') if isinstance(sheet,Image.Image)
                     else Image.open(sheet).convert('RGBA'))
    for cy in range(image.shape[0]//128):
        for cx in range(image.shape[1]//128):
            tile=image[cy*128:(cy+1)*128,cx*128:(cx+1)*128]
            inspected_frames+=1
            for x0,y0,x1,y1 in eye_boxes:
                area=tile[y0*2:y1*2,x0*2:x1*2,:3].reshape(-1,3)
                counts=Counter(map(tuple,area.tolist()))
                for bad in forbidden:
                    bad_colors+=counts[bad]
assert bad_colors==0, ('unexpected brown/cyan/purple in eye sockets',bad_colors)
print('KITTEN_EYE_COLOR_ACCEPTANCE_PASS',
      'reference_median='+str(reference_median.astype(int).tolist()),
      'remaster_medians='+str(sorted(set(stage_medians))),
      'open_frames='+str(len(open_frames)),
      'inspected_frames='+str(inspected_frames),
      'forbidden_color_pixels='+str(bad_colors))
