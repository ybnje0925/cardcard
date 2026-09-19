from PIL import Image, ImageDraw
for size in (192,512):
 im=Image.new('RGB',(size,size),'#7865df');d=ImageDraw.Draw(im);s=size/192
 d.rounded_rectangle([int(x*s) for x in (40,58,152,136)],radius=int(13*s),fill='white')
 d.rectangle([int(x*s) for x in (40,78,152,91)],fill='#c1b6f1')
 d.rounded_rectangle([int(x*s) for x in (55,109,81,117)],radius=int(4*s),fill='#7865df')
 im.save(f'public/icon-{size}.png')
