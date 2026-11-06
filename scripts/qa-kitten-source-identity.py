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
