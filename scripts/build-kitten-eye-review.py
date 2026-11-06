#!/usr/bin/env python3
"""Reproducible original / discolored v0.10.2 / color-corrected eye close-ups."""
from io import BytesIO
from pathlib import Path
from subprocess import check_output
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public' / 'assets'
PREVIOUS = '0442226:public/assets/momo-kitten-64-v3.png'
old=Image.open(BytesIO(check_output(['git','show',PREVIOUS],cwd=ROOT))).convert('RGBA')
new=Image.open(ASSETS/'momo-kitten-64-v3.png').convert('RGBA')
source=Image.open(ASSETS/'momo-kitten-64-v2.png').convert('RGBA')
original=Image.open(ASSETS/'momo-kitten.png').convert('RGBA')
W,H=1380,1130
page=Image.new('RGB',(W,H),(243,238,230))
draw=ImageDraw.Draw(page)
try:
    font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',23)
    small=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',17)
except OSError:
    font=ImageFont.load_default()
    small=font
headers=['Approved source / original poses', 'v0.10.2 | discolored eyes','v0.10.3 | restored lime iris']
for c,header in enumerate(headers):
    draw.text((18+c*455,18),header,fill=(38,34,38),font=font)
for row,frame in enumerate([0,6,9,60]):
    draw.text((18,56+row*264),'Frame '+str(frame),fill=(65,56,51),font=small)
    x,y=frame%8,frame//8
    pose=source.crop((round(x*source.width/8),round(y*source.height/8),
                      round((x+1)*source.width/8),round((y+1)*source.height/8)))
    oldpose=old.crop((x*128,y*128,(x+1)*128,(y+1)*128))
    newpose=new.crop((x*128,y*128,(x+1)*128,(y+1)*128))
    for col,im in enumerate([original if frame==0 else pose,oldpose,newpose]):
        logical=im.resize((64,64),Image.Resampling.NEAREST)
        face=logical.crop((15,18,54,40)).resize((390,220),Image.Resampling.NEAREST)
        bg=Image.new('RGBA',face.size,(221,216,209,255))
        bg.alpha_composite(face)
        xx=18+col*455
        yy=82+row*264
        page.paste(bg.convert('RGB'),(xx,yy))
        draw.rectangle((xx-1,yy-1,xx+391,yy+221),outline=(133,116,103),width=2)
        label=('Original master' if frame==0 else 'Original v2 pose') if col==0 else (
            'Before | brown iris artifacts' if col==1 else 'After | source-locked lime iris')
        draw.text((xx,yy+225),label,fill=(68,60,54),font=small)
out=ASSETS/'qa'/'momo-kitten-eye-acceptance-v0103.png'
out.parent.mkdir(exist_ok=True,parents=True)
page.save(out,optimize=True)
print('Generated',out,page.size)
