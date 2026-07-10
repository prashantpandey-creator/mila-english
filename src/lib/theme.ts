// Shared palette — every page and component draws from this single source.
// Design language: private atelier — deep noir ground, glass surfaces,
// champagne gold, warm ivory type. Keys are SEMANTIC (dark = primary text,
// white = card surface) so the 40+ existing call sites restyle without edits.
export const C = {
  pageBg: 'transparent',                // body paints noir+glows; pages stay clear so the Atmosphere footage shows through
  rose: '#e8556d',                      // rich rose — secondary accent, mic energy
  roseL: 'rgba(232,85,109,0.16)',
  sage: '#8fce84',                      // success on dark
  sageL: 'rgba(143,206,132,0.16)',
  gold: '#d4af37',                      // champagne — the money color
  goldL: 'rgba(212,175,55,0.16)',
  purple: '#a78bfa',
  warm: '#a89f8d',                      // secondary text — warm stone
  dark: '#f2ede3',                      // PRIMARY TEXT (ivory on noir)
  white: 'rgba(255,255,255,0.05)',      // legacy alias — glass surface
  card: 'rgba(255,255,255,0.05)',       // glass card fill
  line: 'rgba(255,255,255,0.12)',       // hairline borders on glass
  navBg: 'rgba(11,14,20,0.72)',         // dark glass bars
};
