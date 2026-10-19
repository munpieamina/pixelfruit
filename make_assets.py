from PIL import Image, ImageDraw
from pathlib import Path
import random, math
ROOT=Path(__file__).parent/'assets/images'
(ROOT/'fruits').mkdir(parents=True,exist_ok=True)
# wooden background tile
im=Image.new('RGB',(192,192),(35,20,18)); d=ImageDraw.Draw(im)
random.seed(7)
for y in range(0,192,24):
    shade=random.randint(-4,8); d.rectangle((0,y,191,y+23),fill=(39+shade,23+shade,18+shade)); d.line((0,y,191,y),fill=(16,10,10),width=2); d.line((0,y+22,191,y+22),fill=(65+shade,39+shade,27+shade),width=1)
    x= random.randint(8,40)
    while x<192:
        d.line((x,y+3,x+random.randint(12,38),y+3),fill=(49+shade,29+shade,21+shade),width=1); x+=random.randint(48,92)
for _ in range(15):
    x=random.randrange(192); y=random.randrange(192); d.ellipse((x,y,x+3,y+3),fill=(19,12,11))
im.save(ROOT/'background'/'wood.png')
# sprite palette/base forms at 48x48, transparent; stylized chunky pixel art
specs={
'apple':((220,48,55),(139,28,38),(255,111,88),'apple'),
'peach':((247,145,91),(196,73,66),(255,202,116),'peach'),
'banana':((250,215,74),(181,132,35),(255,244,153),'banana'),
'kiwi':((129,174,66),(65,112,45),(206,229,119),'kiwi'),
'orange':((244,139,34),(181,75,21),(255,194,69),'orange'),
'mango':((238,109,40),(169,49,37),(255,198,63),'mango'),
'coconut':((123,79,48),(67,43,33),(205,157,103),'coconut'),
'watermelon':((58,170,76),(24,103,58),(255,102,115),'watermelon')}
for name,(main,dark,light,kind) in specs.items():
    for half in ('whole','left','right'):
        im=Image.new('RGBA',(48,48),(0,0,0,0)); d=ImageDraw.Draw(im)
        if half=='whole':
            # pixel silhouette built from stepped rows
            rows=[(16,31),(10,37),(7,40),(5,42),(5,42),(6,41),(8,39),(11,36),(15,32)]
            for i,(x1,x2) in enumerate(rows): d.rectangle((x1,10+i*3,x2,12+i*3),fill=main)
            d.rectangle((21,5,25,12),fill=(102,65,34)); d.rectangle((25,5,32,8),fill=(77,163,74)); d.rectangle((25,5,29,6),fill=(131,216,102))
            d.rectangle((12,17,15,23),fill=light); d.rectangle((10,24,12,27),fill=light)
            if name=='watermelon':
                d.rectangle((9,17,37,19),fill=(29,120,58));
                for x in [16,24,32]: d.rectangle((x,27,x+1,29),fill=(34,39,35))
            if name=='coconut':
                for x,y in [(17,17),(25,15),(29,21)]: d.rectangle((x,y,x+2,y+2),fill=(42,31,26))
            if name=='banana':
                d.rectangle((13,16,17,31),fill=light); d.rectangle((17,31,31,35),fill=light); d.rectangle((29,27,34,33),fill=dark)
        else:
            # two matching cut halves: outer rind and bright flesh, cut face toward center
            if name=='banana':
                d.polygon([(9,13),(14,8),(34,12),(38,19),(33,33),(22,39),(12,31)],fill=main)
                d.polygon([(14,15),(18,12),(31,15),(34,20),(30,30),(22,34),(15,28)],fill=light)
                d.line((15,18,20,15,29,17),fill=(255,245,170),width=2)
            else:
                d.ellipse((5,8,42,43),fill=dark); d.ellipse((8,9,39,40),fill=main); d.ellipse((11,12,36,37),fill=light if name not in ('apple','watermelon','coconut') else main)
                if name in ('kiwi','orange'):
                    d.ellipse((17,18,30,31),fill=(242,229,174) if name=='kiwi' else (255,221,132))
                    for a in range(8):
                        ang=a*math.pi/4; x=int(23+7*math.cos(ang)); y=int(24+7*math.sin(ang)); d.rectangle((x,y,x+1,y+1),fill=(45,42,32) if name=='kiwi' else (255,245,190))
                elif name=='watermelon':
                    d.ellipse((10,12,37,38),fill=(255,114,124))
                    for x,y in [(18,19),(28,23),(22,30)]: d.rectangle((x,y,x+2,y+3),fill=(40,44,36))
                elif name=='coconut':
                    d.ellipse((11,12,36,37),fill=(247,239,207)); d.ellipse((18,19,29,30),fill=(222,214,180))
                elif name=='apple': d.rectangle((16,14,19,22),fill=light)
                else: d.rectangle((14,15,17,22),fill=(255,238,175))
            # cut-face straight edge overlay so halves read as sliced
            if half=='left': d.rectangle((25,9,44,42),fill=(0,0,0,0))
            else: d.rectangle((3,9,22,42),fill=(0,0,0,0))
            # repaint with clipping mask to preserve one side of the slice
            full=im.copy(); mask=Image.new('L',(48,48),0); md=ImageDraw.Draw(mask)
            if half=='left': md.rectangle((0,0,23,47),fill=255)
            else: md.rectangle((24,0,47,47),fill=255)
            im=Image.new('RGBA',(48,48),(0,0,0,0)); im.paste(full,(0,0),mask)
            d=ImageDraw.Draw(im)
            if half=='left': d.line((23,12,23,37),fill=(255,235,181),width=2)
            else: d.line((24,12,24,37),fill=(255,235,181),width=2)
        im.save(ROOT/'fruits'/f'{name}_{half}.png')
# bomb
im=Image.new('RGBA',(48,48),(0,0,0,0));d=ImageDraw.Draw(im)
d.rectangle((23,4,29,10),fill=(158,91,39));d.rectangle((27,2,34,5),fill=(255,199,71));d.ellipse((6,10,41,44),fill=(30,31,43));d.ellipse((9,12,38,41),fill=(52,55,68));d.rectangle((13,17,17,21),fill=(118,124,139));d.rectangle((19,14,23,16),fill=(118,124,139));d.rectangle((25,28,31,33),fill=(21,22,31));d.rectangle((14,30,18,34),fill=(21,22,31));im.save(ROOT/'bombs'/'bomb.png')
# bonus
im=Image.new('RGBA',(48,48),(0,0,0,0));d=ImageDraw.Draw(im);d.rectangle((7,7,40,40),fill=(37,25,61));d.rectangle((10,10,37,37),fill=(119,66,209));d.rectangle((13,13,34,34),fill=(247,219,88));d.rectangle((17,17,30,30),fill=(63,39,89));d.rectangle((19,19,28,22),fill=(255,242,167));d.rectangle((20,24,27,27),fill=(255,242,167));d.rectangle((22,29,25,31),fill=(255,242,167));im.save(ROOT/'bonuses'/'double.png')
# effects sprite sparkle
im=Image.new('RGBA',(16,16),(0,0,0,0));d=ImageDraw.Draw(im);d.rectangle((6,1,9,14),fill=(255,241,145));d.rectangle((1,6,14,9),fill=(255,241,145));d.rectangle((5,5,10,10),fill=(255,255,228));im.save(ROOT/'effects'/'spark.png')
