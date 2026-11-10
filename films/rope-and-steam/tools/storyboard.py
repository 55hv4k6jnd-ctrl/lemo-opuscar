"""Storyboard sheet: key frames from the real render with shot number, framing, timing and the beat under each."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = os.path.join(D, 'fonts')
SHOTS = [
  ('3.3', '1 · OPEN', 'Full shot, locked · 0:00–0:09', 'Cold open: Josie whirls far too fast — her own loop drops over her.'),
  ('22.8', '3 · LESSON', 'Extreme wide, locked · 0:16–0:28', 'Grandpa\'s one lazy throw sails to the snubbing post.'),
  ('41.0', '5 · GATE', 'Full shot, locked · 0:34–0:47', 'She sulks on the gate; it swings open; Biscuit tiptoes out behind her.'),
  ('57.3', '7 · CHASE', 'Tracking, undercranked · 0:49–1:05', 'Across the sage flats; the calf bounds a bush she stumbles through.'),
  ('75.5', '8 · BISON', 'Wide, locked → half iris · 1:05–1:24', 'Smack into a bull. She lifts her hat to it, politely.'),
  ('104.6', '11 · CRACK', 'Full, locked (blue tint) · 1:41–1:47', 'The crust cracks under Biscuit; she whirls fast… then stops.'),
  ('115.9', '14 · THROW', 'Extreme wide, locked · 1:52–2:07', 'After the silence: one slow throw. The loop sails out.'),
  ('123.0', '14 · ERUPTION', 'same take (signature shot)', 'She hauls the calf clear as the geyser goes up behind them.'),
  ('143.4', '15 · HOME', 'Wide, locked (rose tint) · 2:07–2:24', 'She ropes Grandpa\'s post; he tips his hat; hers slides over her eyes.'),
]
W = 600; ims = []
for t, n, fr, line in SHOTS:
    im = Image.open(os.path.join(D, 'storyboard/frames', f's_{t}.jpg')).crop((240, 0, 1680, 1080)).resize((W, 450), Image.LANCZOS)
    ims.append((im, n, fr, line))
cols, cap = 3, 92
sheet = Image.new('RGB', (cols * W + (cols + 1) * 16, 70 + ((len(ims) + cols - 1) // cols) * (450 + cap + 16) + 10), (18, 16, 14))
d = ImageDraw.Draw(sheet)
ft = ImageFont.truetype(os.path.join(F, 'PlayfairDisplaySC-Bold.ttf'), 34)
fb = ImageFont.truetype(os.path.join(F, 'OldStandard-Bold.ttf'), 20)
fi = ImageFont.truetype(os.path.join(F, 'OldStandard-Italic.ttf'), 19)
d.text((16, 14), 'Rope & Steam — storyboard (key shots from the real render)', font=ft, fill=(236, 229, 213))
for i, (im, n, fr, line) in enumerate(ims):
    x = 16 + (i % cols) * (W + 16); y = 70 + (i // cols) * (450 + cap + 16)
    sheet.paste(im, (x, y))
    d.text((x, y + 458), n, font=fb, fill=(230, 190, 90)); d.text((x + 175, y + 458), fr, font=fb, fill=(220, 214, 200))
    d.text((x, y + 486), line, font=fi, fill=(200, 194, 180))
out = os.path.join(D, 'storyboard', 'storyboard.jpg'); sheet.save(out, quality=90); print(out, sheet.size)
