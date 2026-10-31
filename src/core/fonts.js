// Every font Marquee draws with. All are open-licensed (OFL / Apache 2.0) and
// ship in /fonts so the server, the static build and the browser studio render
// identical art. `family` + `weight` must match the font's internal names.
export const FONTS = {
  bebas: { family: 'Bebas Neue', weight: 400, file: 'BebasNeue-Regular.ttf' },
  abril: { family: 'Abril Fatface', weight: 400, file: 'AbrilFatface-Regular.ttf' },
  limelight: { family: 'Limelight', weight: 400, file: 'Limelight-Regular.ttf' },
  poiret: { family: 'Poiret One', weight: 400, file: 'PoiretOne-Regular.ttf' },
  marker: { family: 'Permanent Marker', weight: 400, file: 'PermanentMarker-Regular.ttf' },
  vt323: { family: 'VT323', weight: 400, file: 'VT323-Regular.ttf' },
  archivo: { family: 'Archivo Black', weight: 400, file: 'ArchivoBlack-Regular.ttf' },
  creepster: { family: 'Creepster', weight: 400, file: 'Creepster-Regular.ttf' },
  syncopate: { family: 'Syncopate', weight: 700, file: 'Syncopate-Bold.ttf' },
  mono: { family: 'Space Mono', weight: 400, file: 'SpaceMono-Regular.ttf' },
  monoBold: { family: 'Space Mono', weight: 700, file: 'SpaceMono-Bold.ttf' },
  barlow: { family: 'Barlow Condensed', weight: 400, file: 'BarlowCondensed-Regular.ttf' },
  barlowSemi: { family: 'Barlow Condensed', weight: 600, file: 'BarlowCondensed-SemiBold.ttf' },
  monoton: { family: 'Monoton', weight: 400, file: 'Monoton-Regular.ttf' },
};

export const FONT_LICENSES = {
  'Bebas Neue': 'OFL-1.1',
  'Abril Fatface': 'OFL-1.1',
  Limelight: 'OFL-1.1',
  'Poiret One': 'OFL-1.1',
  'Permanent Marker': 'Apache-2.0',
  VT323: 'OFL-1.1',
  'Archivo Black': 'OFL-1.1',
  Creepster: 'OFL-1.1',
  Syncopate: 'Apache-2.0',
  'Space Mono': 'OFL-1.1',
  'Barlow Condensed': 'OFL-1.1',
  Monoton: 'OFL-1.1',
};

// Extra code points measured beyond Latin-1 (typographic punctuation and the
// glyphs the templates use as ornaments).
export const EXTRA_CODEPOINTS = [
  0x2018, 0x2019, 0x201c, 0x201d, 0x2013, 0x2014, 0x2026, 0x2022, 0x2605, 0x2606,
  0x2116, 0x2122, 0x00b7,
];
