from PIL import Image,ImageDraw,ImageFont
import pathlib
P=pathlib.Path(__file__).parent/'renders'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22)
for group,ids in [('crew',[1,2,3]),('ports-stores',[4,5]),('health',[6]),('passenger-medicine',[7,8]),('nil-vaccines',[9,10])]:
 pairs=[]
 for id in ids:
  indexes=[0,1] if id==6 else [0]
  for idx in indexes:
   images=[]
   for kind in ['original','baseline']:
    im=Image.open(P/f'{kind}-{id}-{idx}.png').convert('RGB');im.thumbnail((750,1050));images.append(im)
   h=max(i.height for i in images)+45;row=Image.new('RGB',(1540,h),'#e9eef4');d=ImageDraw.Draw(row);d.text((10,10),f'{id} / sheet {idx+1}: original',fill='black',font=font);d.text((790,10),'generated baseline',fill='black',font=font)
   row.paste(images[0],(10,45));row.paste(images[1],(790,45));pairs.append(row)
 out=Image.new('RGB',(1540,sum(i.height for i in pairs)+10*(len(pairs)-1)),'#ced9e5');y=0
 for row in pairs:out.paste(row,(0,y));y+=row.height+10
 out.save(P/f'review-{group}.png')
print('review images ready')
