"""Storyboard sheet: key frames from the real render with shot number, framing, timing and the beat under each."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(D, 'fonts')
SHOTS = [
  ('3', '1 · OPEN', 'in motion → pull back · 0:00–0:12', 'The first brushstroke is his broom; the cave gate appears around him.'),
  ('40', '3 · DEMONS', 'handscroll pan · 0:30–0:50', 'A hundred demons, a hundred names inscribed. At the end, him: no name.'),
  ('55', '4 · THE KING', 'low angle, push-in · 0:50–1:02', '"You! Broom thing! Sweep faster!"'),
  ('97', '6 · THE POND', 'locked, night · 1:26–1:46', 'He sweeps the moon off the pond. It always comes back.'),
  ('135', '8 · FLEE', 'lateral tracking, shake · 2:04–2:25', 'The great rain. The King is the first to run.'),
  ('186', '10 · THE CHILD', 'medium, under the pine · 2:40–3:21', '"Are you… a monster?" — "I… sweep."'),
  ('223.8', '13 · THE SWEEP', 'flying white, after silence · 3:43', 'One stroke across the whole frame clears the path down the mountain.'),
  ('280', '15 · THE NAME', 'two-shot, push-in · 4:19–4:52', '"I\'ll call you Sweep."'),
  ('317', '17 · THE SEAL', 'pull back · 5:06–5:22', 'He signs his name with the broom; the vermilion seal lands.'),
]
W = 600; ims = []
for t, n, fr, line in SHOTS:
    im = Image.open(os.path.join(D, 'storyboard/frames', f's_{t}.jpg')).resize((W, 338), Image.LANCZOS)
    ims.append((im, n, fr, line))
cols, cap = 3, 92
sheet = Image.new('RGB', (cols * W + (cols + 1) * 16, 70 + ((len(ims) + cols - 1) // cols) * (338 + cap + 16) + 10), (18, 16, 14))
d = ImageDraw.Draw(sheet)
ft = ImageFont.truetype(os.path.join(F, 'CormorantSC-SemiBold.ttf'), 34)
fb = ImageFont.truetype(os.path.join(F, 'CormorantSC-Medium.ttf'), 20)
fi = ImageFont.truetype(os.path.join(F, 'CormorantGaramond-Italic[wght].ttf'), 19)
d.text((16, 14), 'Sweep — storyboard (key shots from the real render)', font=ft, fill=(236, 229, 213))
for i, (im, n, fr, line) in enumerate(ims):
    x = 16 + (i % cols) * (W + 16); y = 70 + (i // cols) * (338 + cap + 16)
    sheet.paste(im, (x, y))
    d.text((x, y + 346), n, font=fb, fill=(230, 190, 90)); d.text((x + 175, y + 346), fr, font=fb, fill=(220, 214, 200))
    d.text((x, y + 374), line, font=fi, fill=(200, 194, 180))
out = os.path.join(D, 'storyboard', 'storyboard.jpg'); sheet.save(out, quality=90); print(out, sheet.size)
