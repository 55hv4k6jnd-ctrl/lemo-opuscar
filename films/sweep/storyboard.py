"""Storyboard sheet: key frames from the real render with shot number, framing, timing and the beat under each."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(D, 'fonts')
SHOTS = [
  ('8.6', '1 · OPEN', 'power-on > crane down · 0:00–0:12', 'Golden morning; the crane comes down to the gate. Chrome title on a brass hit.'),
  ('40', '3 · DEMONS', 'side tracking · 0:30–0:50', 'A line-up with name cards. His card, at the end, is empty.'),
  ('55', '4 · THE KING', 'low angle, push · 0:50–1:02', '"You! Broom thing! Sweep faster!"'),
  ('97', '6 · THE POND', 'locked, night model · 1:26–1:46', 'He sweeps the moon off the pond. It always comes back.'),
  ('135', '8 · FLEE', 'side tracking, storm model · 2:04–2:25', 'The great rain. The King is the first to run.'),
  ('186', '10 · THE CHILD', 'medium, push · 2:40–3:21', '"Are you… a monster?" — "I… sweep."'),
  ('219', '12 · RESOLVE', 'extreme close-up · 3:36–3:43', 'His eyes narrow in the rain. One beat of true silence.'),
  ('223.2', '13 · THE SWEEP', 'speed lines > impact', 'The instant before the stroke.'),
  ('226', '13 · THE PATH', 'backlit light', 'A band of gold light tears the storm open, down the mountain.'),
  ('248', '14 · DAWN', 'slow pan, dawn model · 3:56–4:19', 'Down the cleared path to the village and its lanterns.'),
  ('283', '15 · THE NAME', 'held close-up · 4:19–4:52', '"Sweep." It was given to me. And it was mine.'),
  ('300', '16 · THE GATE, AGAIN', 'repainted at dawn · 4:52–5:06', '"You! Broom thing!" — "Sweep, sir. My name is Sweep."'),
]
W = 600; ims = []
for t, n, fr, line in SHOTS:
    im = Image.open(os.path.join(D, 'storyboard/frames', f's_{t}.jpg')).resize((W, 338), Image.LANCZOS)
    ims.append((im, n, fr, line))
cols, cap = 3, 92
sheet = Image.new('RGB', (cols * W + (cols + 1) * 16, 70 + ((len(ims) + cols - 1) // cols) * (338 + cap + 16) + 10), (18, 16, 14))
d = ImageDraw.Draw(sheet)
ft = ImageFont.truetype(os.path.join(F, 'Kanit-BlackItalic.ttf'), 34)
fb = ImageFont.truetype(os.path.join(F, 'BarlowSemiCondensed-SemiBold.ttf'), 20)
fi = ImageFont.truetype(os.path.join(F, 'BarlowSemiCondensed-SemiBold.ttf'), 19)
d.text((16, 14), 'SWEEP — storyboard v2 · 80s Cel Anime (real render)', font=ft, fill=(236, 229, 213))
for i, (im, n, fr, line) in enumerate(ims):
    x = 16 + (i % cols) * (W + 16); y = 70 + (i // cols) * (338 + cap + 16)
    sheet.paste(im, (x, y))
    d.text((x, y + 346), n, font=fb, fill=(230, 190, 90)); d.text((x + 175, y + 346), fr, font=fb, fill=(220, 214, 200))
    d.text((x, y + 374), line, font=fi, fill=(200, 194, 180))
out = os.path.join(D, 'storyboard', 'storyboard.jpg'); sheet.save(out, quality=90); print(out, sheet.size)
