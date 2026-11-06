#!/usr/bin/env python3
"""Build NON-PRODUCTION 19-action previews from the two existing age atlases.
Never overwrites the approved source art. Replace with hand-reviewed sprite sheets later.
"""
from pathlib import Path
from PIL import Image, ImageDraw
from remaster_kitten_pixels import quantize, LOGICAL
from remaster_adult_pixels import quantize_adult
import json, math
ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
DEST = ASSETS / "momo-motions-preview"
SPEC = [
 ("idle",24,12,"loop","idle"), ("walk",16,12,"loop","walk"),
 ("eat",32,12,"one-shot","feed"), ("snack",24,12,"one-shot","feed"),
 ("drink",24,12,"one-shot","feed"), ("tail_wag",16,12,"loop","idle"),
 ("sleep_prep",24,12,"one-shot","rest"), ("sleep",24,8,"loop","rest"),
 ("wake",24,12,"one-shot","rest"), ("happy",16,12,"one-shot","pet"),
 ("sad",16,8,"one-shot","rest"), ("angry",16,12,"one-shot","idle"),
 ("play",32,12,"one-shot","play"), ("groom",32,12,"one-shot","groom"),
 ("curious",16,12,"one-shot","look"), ("petting",24,12,"one-shot","pet"),
 ("yawn",16,12,"one-shot","rest"), ("sick",16,8,"one-shot","rest"),
 ("toilet",24,12,"one-shot","rest"),
]
ROWS = {"idle":0, "feed":1,"groom":2,"play":3,"rest":4,"pet":5,"stretch":6,"look":7}
# This atlas has 8 different hand-authored base poses per action, not 16/24/32 unique poses.
# Repeated holds follow the original timing; metadata distinguishes preview quality.
PATHS = {
 "adult": ASSETS / "momo-adult-64-v4.png",
 "kitten": ASSETS / "momo-kitten-64-v3.png"
}
CELL = 128
COLS = 8
def crop_grid(image, c, r, cols, rows):
    w,h = image.size
    return image.crop((round(c*w/cols),round(r*h/rows),round((c+1)*w/cols),round((r+1)*h/rows)))
def draw_pixel_prop(tile, kind, frame, frames):
    # All props are separate pixel overlays within the 128px cell, never pasted into the cat's face.
    # Keep bowl/litter at a fixed cell position and respect existing props where already present.
    d=ImageDraw.Draw(tile)
    if kind=="toilet":
        d.rectangle((12,112,51,122),fill=(109,73,134,255))
        d.rectangle((15,110,48,116),fill=(178,143,199,255))
        d.rectangle((19,110,44,112),fill=(224,208,232,255))
    elif kind=="drink":
        d.rectangle((14,112,48,122),fill=(80,141,167,255))
        d.rectangle((17,109,45,115),fill=(140,209,231,255))
        if 7 <= frame <= 18:
            d.line((20+(frame%3),110,42-(frame%3),110), fill=(238,248,255,255),width=1)
    elif kind=="snack":
        # Separate small treat at the ground in front of the cat.
        if frame < int(frames*.75):
            d.rectangle((17,115,24,119),fill=(213,143,60,255))
            d.rectangle((20,113,23,114),fill=(244,191,94,255))
    elif kind=="play":
        # Prop uses one fixed plane and moves when the paws are extended.
        x=12+int(max(0,frame-8)*.55)
        d.ellipse((x,107,x+14,121),fill=(237,135,172,255),outline=(143,64,102,255),width=2)
        d.line((x+5,111,x+10,117), fill=(255,207,219,255),width=1)

def frame_pose(action, frame, frames):
    step=frame/(frames-1)
    if action=="sleep_prep": return min(7, int(step*8))
    if action=="sleep": return [5,6,7,6][int(frame/6)%4]
    if action=="wake": return max(0,7-int(step*8))
    if action=="yawn": return [0,1,1,2,2,3,3,4,4,5,6,6,7,7,7,7][frame]
    if action=="sad" or action=="sick": return [3,4,5,6,7,7,6,7][min(7,int(step*8))]
    if action=="toilet": return [0,1,2,3,4,5,6,7][min(7,int(step*8))]
    if action=="angry": return [0,2,3,4,5,4,3,0][int(frame/2)%8]
    if action=="tail_wag": return [0,1,2,3,4,5,6,7][int(frame/2)%8]
    if action=="eat":
        # Distinct entry, chew and exit poses from the original food atlas.
        return ([0]*4+[1]*4+[2]*4+[3,4]*4+[5]*4+[6]*4+[7]*4)[frame]
    if action=="snack":
        return min(7, int(step*8))
    if action=="groom" or action=="play": return min(7,int(step*8))
    return min(7,int(step*8))

def main():
    import argparse
    ap=argparse.ArgumentParser()
    ap.add_argument('--build',action='store_true')
    ap.add_argument('--stage',choices=['all','kitten','adult'],default='all')
    args=ap.parse_args()
    DEST.mkdir(parents=True,exist_ok=True)
    manifest=[]
    if args.stage!='all' and (DEST/'manifest.json').exists():
        manifest=[record for record in json.loads((DEST/'manifest.json').read_text())
                  if record['stage'] != args.stage]
    walk_image=Image.open(ASSETS/"didi-walk-v1.png").convert("RGBA")
    for age, file in PATHS.items():
        if args.stage!='all' and age!=args.stage: continue
        image=Image.open(file).convert("RGBA")
        age_dir=DEST/age
        age_dir.mkdir(exist_ok=True)
        for action,count,fps,playback,row in SPEC:
            sheet=Image.new("RGBA",(COLS*CELL,math.ceil(count/COLS)*CELL))
            for n in range(count):
                if action=="walk":
                    k=int((n%16)/2)
                    local=k if age=="kitten" else 8+k
                    tile=crop_grid(walk_image,local%4,local//4,4,4).resize((CELL,CELL),Image.Resampling.NEAREST)
                else:
                    pose=frame_pose(action,n,count)
                    tile=crop_grid(image,pose,ROWS[row],8,8).resize((CELL,CELL),Image.Resampling.NEAREST)
                    if action in ("drink","snack","toilet"):
                        draw_pixel_prop(tile,action,n,count)
                if age=='kitten':
                    # Fixed pixel palette/grid even for props and walking assets.
                    tile=quantize(tile.resize((LOGICAL,LOGICAL),Image.Resampling.NEAREST)).resize((CELL,CELL),Image.Resampling.NEAREST)
                else:
                    tile=quantize_adult(tile).resize((CELL,CELL),Image.Resampling.NEAREST)
                sheet.alpha_composite(tile,(n%COLS*CELL,n//COLS*CELL))
            file_name=f"{action}.png"
            sheet.save(age_dir/file_name,optimize=True)
            manifest.append(dict(stage=age,action=action,frames=count,fps=fps,playback=playback,
                cell_px=CELL,columns=COLS,rows=math.ceil(count/COLS),
                sheet=f"{age}/{file_name}",quality="preview-recomposed-from-existing-atlas"))
    manifest.sort(key=lambda item:(0 if item['stage']=='kitten' else 1, next(i for i,v in enumerate(SPEC) if v[0]==item['action'])))
    (DEST/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Wrote {len(manifest)} action sheets to {DEST}")
if __name__=="__main__": main()
