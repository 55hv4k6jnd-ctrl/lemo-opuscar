"""Intertitles → out/srt.json (the cards ARE the subtitles; the .srt lists their text for accessibility)."""
import json, os
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = json.load(open(os.path.join(D, 'timeline.json')))['SEC']
TXT = [('TITLE', 'ROPE & STEAM — a picture of the Yellowstone country'), ('CARD1', '“Slow hands, Josie. A rope can tell when you’re in a hurry.”'),
       ('CARD2', 'BISCUIT!'), ('CARD3', 'Up in the basin, the ground breathes steam — and keeps its own time.'), ('CARD4', 'Slow hands.'), ('END', 'The End')]
cues = [{'t0': round(S[k]['t0'] + .05, 3), 't1': round(S[k]['t1'] - .05, 3), 'text': t} for k, t in TXT]
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
json.dump(cues, open(os.path.join(D, 'out/srt.json'), 'w'), indent=1); print(len(cues), 'cards')
