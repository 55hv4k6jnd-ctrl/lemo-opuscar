// Intertitles, keyed by timeline section. level: 0 = a shout (heavy rule, shakes), 1 = narration (double rule, fans),
// 2 = tender (vines and flowers). The cards are the subtitles (CARD_TEXT feeds the .srt and the reading-time check).
const SC = 'Playfair Display SC';
export const CARDS = {
  TITLE: { level: 1, lines: [{ text: 'Rope & Steam', font: SC, weight: 900, size: 124 }, { text: 'a picture of the Yellowstone country', italic: true, size: 42, spacing: 2 }], gap: 1.4 },
  CARD1: { level: 1, lines: [{ text: '“Slow hands, Josie.', italic: true, size: 70 }, { text: 'A rope can tell', italic: true, size: 70 }, { text: 'when you’re in a hurry.”', italic: true, size: 70 }], gap: 1.32 },
  CARD2: { level: 0, shake: .4, lines: [{ text: 'BISCUIT!', font: SC, weight: 900, size: 176 }] },
  CARD3: { level: 1, lines: [{ text: 'Up in the basin,', italic: true, size: 66 }, { text: 'the ground breathes steam —', italic: true, size: 66 }, { text: 'and keeps its own time.', italic: true, size: 66 }], gap: 1.32 },
  CARD4: { level: 2, lines: [{ text: 'Slow hands.', italic: true, size: 96 }] },
  END: { level: 2, lines: [{ text: 'The End', font: SC, weight: 900, size: 116 }] },
};
export const CARD_TEXT = {
  TITLE: 'ROPE & STEAM — a picture of the Yellowstone country',
  CARD1: '“Slow hands, Josie. A rope can tell when you’re in a hurry.”',
  CARD2: 'BISCUIT!',
  CARD3: 'Up in the basin, the ground breathes steam — and keeps its own time.',
  CARD4: 'Slow hands.',
  END: 'The End',
};
