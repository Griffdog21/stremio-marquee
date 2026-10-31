// The theme catalogue. A theme is a palette + an art template + a mood: the
// curated collection and genre row that ship with it. Palettes and templates
// can be mixed freely in the Studio.
export const THEMES = [
  {
    id: 'neon',
    name: 'Midnight Neon',
    emoji: '🌆',
    tagline: 'Synthwave suns, laser grids and hot-pink glow.',
    template: 'neon',
    font: 'Bebas Neue',
    palette: {
      bg: '#0b0618', surface: '#1b0f33', primary: '#ff2bd6', secondary: '#22e1ff',
      accent: '#ffd319', text: '#fdf4ff', muted: '#a58ad8',
    },
    collection: { id: 'neon-nights', name: 'Neon Nights' },
    mood: { type: 'movie', genre: 'Sci-Fi', name: 'Sci-Fi After Dark' },
  },
  {
    id: 'noir',
    name: 'Film Noir',
    emoji: '🎞️',
    tagline: 'Venetian-blind shadows, cigarette smoke and one red accent.',
    template: 'noir',
    font: 'Abril Fatface',
    palette: {
      bg: '#0a0a0b', surface: '#18181b', primary: '#e8e4dc', secondary: '#8f8b85',
      accent: '#d7263d', text: '#f2efe9', muted: '#8a8680',
    },
    collection: { id: 'shadows-and-smoke', name: 'Shadows & Smoke' },
    mood: { type: 'movie', genre: 'Crime', name: 'Crime Scene' },
  },
  {
    id: 'deco',
    name: 'Gilded Age',
    emoji: '✨',
    tagline: 'Art-deco sunbursts, stepped frames and liquid gold.',
    template: 'deco',
    font: 'Limelight',
    palette: {
      bg: '#0d0c0a', surface: '#1d1a13', primary: '#d4af37', secondary: '#f3e5ab',
      accent: '#2e8b7a', text: '#f7efd8', muted: '#a8956a',
    },
    collection: { id: 'gilded-screen', name: 'The Gilded Screen' },
    mood: { type: 'movie', genre: 'Romance', name: 'Grand Romances' },
  },
  {
    id: 'vhs',
    name: 'Rewind VHS',
    emoji: '📼',
    tagline: 'Rainbow-stripe tape labels, tracking glitches, Sharpie titles.',
    template: 'vhs',
    font: 'Permanent Marker',
    palette: {
      bg: '#111014', surface: '#1f1d24', primary: '#ff3d3d', secondary: '#2b8cff',
      accent: '#ffd21a', text: '#f4eedb', muted: '#9a95a0',
    },
    collection: { id: 'be-kind-rewind', name: 'Be Kind, Rewind' },
    mood: { type: 'movie', genre: 'Action', name: 'Action Rentals' },
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    emoji: '🔴',
    tagline: 'Primary colours, pure geometry, lowercase type.',
    template: 'bauhaus',
    font: 'Archivo Black',
    palette: {
      bg: '#efe8dc', surface: '#e3dac9', primary: '#e63a2e', secondary: '#1f4e9c',
      accent: '#f2b21b', text: '#141414', muted: '#6b665d',
    },
    collection: { id: 'form-and-function', name: 'Form & Function' },
    mood: { type: 'movie', genre: 'Drama', name: 'Modern Drama' },
  },
  {
    id: 'terminal',
    name: 'Phosphor',
    emoji: '💾',
    tagline: 'Green-screen CRT, scanlines and a blinking cursor.',
    template: 'terminal',
    font: 'VT323',
    palette: {
      bg: '#030803', surface: '#0a170c', primary: '#39ff6a', secondary: '#1fae4a',
      accent: '#c6ff3d', text: '#d8ffe2', muted: '#4f8a5c',
    },
    collection: { id: 'ghosts-in-the-machine', name: 'Ghosts in the Machine' },
    mood: { type: 'movie', genre: 'Thriller', name: 'System Thrillers' },
  },
  {
    id: 'haunt',
    name: 'Hallowed',
    emoji: '🎃',
    tagline: 'Harvest moons, bats and graveyard hills. Halloween all year.',
    template: 'haunt',
    font: 'Creepster',
    palette: {
      bg: '#120618', surface: '#2a0f3d', primary: '#ff7518', secondary: '#8c3fd9',
      accent: '#ffd27a', text: '#fff1dc', muted: '#b39ac9',
    },
    collection: { id: 'midnight-monsters', name: 'Midnight Monsters' },
    mood: { type: 'movie', genre: 'Horror', name: 'Fright Night' },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    emoji: '🌌',
    tagline: 'Northern lights rippling over midnight peaks.',
    template: 'aurora',
    font: 'Syncopate',
    palette: {
      bg: '#040a17', surface: '#0c1a33', primary: '#3ef0c4', secondary: '#8a5cff',
      accent: '#ff6ec7', text: '#eefcff', muted: '#7fa3b8',
    },
    collection: { id: 'otherworldly', name: 'Otherworldly' },
    mood: { type: 'movie', genre: 'Adventure', name: 'Far Horizons' },
  },
  {
    id: 'sakura',
    name: 'Sakura',
    emoji: '🌸',
    tagline: 'Cherry blossoms, washi paper and a red ink seal.',
    template: 'sakura',
    font: 'Marcellus',
    palette: {
      bg: '#fbf1f3', surface: '#f5dbe2', primary: '#e8638f', secondary: '#3b2a33',
      accent: '#c8283a', text: '#2b1d23', muted: '#8c6f7a',
    },
    collection: { id: 'spring-in-japan', name: 'Spring in Japan' },
    mood: { type: 'movie', genre: 'Animation', name: 'Hand-Drawn Worlds' },
  },
  {
    id: 'western',
    name: 'High Noon',
    emoji: '🤠',
    tagline: 'Wanted posters, sun-bleached paper and desert dusk.',
    template: 'wanted',
    font: 'Rye',
    palette: {
      bg: '#1a120b', surface: '#2e2015', primary: '#d9a05b', secondary: '#8c4a2f',
      accent: '#e8c37a', text: '#f3e6cf', muted: '#a68b6d',
    },
    collection: { id: 'dust-and-spurs', name: 'Dust & Spurs' },
    mood: { type: 'movie', genre: 'Western', name: 'Saddle Up' },
  },
  {
    id: 'comic',
    name: 'Comic Pop',
    emoji: '💥',
    tagline: 'Halftone dots, speech bubbles and a big KAPOW.',
    template: 'pop',
    font: 'Bangers',
    palette: {
      bg: '#0d1b3e', surface: '#16285a', primary: '#ffd400', secondary: '#ff2e4c',
      accent: '#00b8ff', text: '#ffffff', muted: '#9fb1e0',
    },
    collection: { id: 'panels-to-pictures', name: 'Panels to Pictures' },
    mood: { type: 'movie', genre: 'Action', name: 'Pow! Action' },
  },
  {
    id: 'arcade',
    name: 'Pixel Arcade',
    emoji: '🕹️',
    tagline: 'Pixel invaders, high scores and insert-coin glow.',
    template: 'arcade',
    font: 'Press Start 2P',
    palette: {
      bg: '#0a0a16', surface: '#151530', primary: '#ff3df2', secondary: '#3df2ff',
      accent: '#fff23d', text: '#ffffff', muted: '#8a8ab8',
    },
    collection: { id: 'game-over', name: 'Game Over' },
    mood: { type: 'movie', genre: 'Family', name: 'Player Two' },
  },
  {
    id: 'vapor',
    name: 'Vaporwave',
    emoji: '🌴',
    tagline: 'Pastel sunsets, palm-tree dreams and 90s haze.',
    template: 'neon',
    font: 'Monoton',
    palette: {
      bg: '#1a0b2e', surface: '#2d1b4e', primary: '#ff71ce', secondary: '#01cdfe',
      accent: '#fffb96', text: '#f5eaff', muted: '#b39ddb',
    },
    collection: { id: 'sunset-strip', name: 'Sunset Strip' },
    mood: { type: 'movie', genre: 'Romance', name: 'Slow-Dance Romance' },
  },
  {
    id: 'snowfall',
    name: 'Snowfall',
    emoji: '❄️',
    tagline: 'Starlit snow, frosted peaks and warm window light.',
    template: 'aurora',
    font: 'Poiret One',
    palette: {
      bg: '#0b1424', surface: '#152640', primary: '#bfe3ff', secondary: '#7fb2e5',
      accent: '#ffd58a', text: '#f2f8ff', muted: '#8aa3bf',
    },
    collection: { id: 'winter-nights', name: 'Winter Nights' },
    mood: { type: 'movie', genre: 'Family', name: 'Cozy Nights In' },
  },
  {
    id: 'velvet',
    name: 'Velvet Premiere',
    emoji: '🎭',
    tagline: 'Crimson curtains, gilt frames and a golden-age premiere.',
    template: 'deco',
    font: 'Limelight',
    palette: {
      bg: '#14070a', surface: '#2a0d14', primary: '#c9a227', secondary: '#f1dfb0',
      accent: '#9b1b30', text: '#f7ead2', muted: '#a8846a',
    },
    collection: { id: 'golden-age-epics', name: 'Golden Age Epics' },
    mood: { type: 'movie', genre: 'History', name: 'Epic History' },
  },
  {
    id: 'pastel',
    name: 'Sugar Pastel',
    emoji: '🍬',
    tagline: 'Sugar-sweet pastels and playful shapes.',
    template: 'bauhaus',
    font: 'Archivo Black',
    palette: {
      bg: '#fdf6ee', surface: '#f6e4da', primary: '#ff8fb1', secondary: '#7ec8c4',
      accent: '#ffd166', text: '#3a2e39', muted: '#8b7d86',
    },
    collection: { id: 'sugar-rush', name: 'Sugar Rush' },
    mood: { type: 'movie', genre: 'Comedy', name: 'Feel-Good Comedy' },
  },
  {
    id: 'wasteland',
    name: 'Wasteland',
    emoji: '🔥',
    tagline: 'A burning sun over a scorched desert grid.',
    template: 'neon',
    font: 'Bebas Neue',
    palette: {
      bg: '#170c06', surface: '#2d1608', primary: '#ff6a1a', secondary: '#ffb347',
      accent: '#ffe08a', text: '#fff1e0', muted: '#b0846a',
    },
    collection: { id: 'after-the-end', name: 'After the End' },
    mood: { type: 'movie', genre: 'Sci-Fi', name: 'End of the World' },
  },
  {
    id: 'gothic',
    name: 'Gothic',
    emoji: '🥀',
    tagline: 'Candle-lit crimson and cathedral shadows.',
    template: 'noir',
    font: 'UnifrakturMaguntia',
    palette: {
      bg: '#0c0608', surface: '#1c0b10', primary: '#e8dada', secondary: '#8f7f84',
      accent: '#a3001b', text: '#f2e9e9', muted: '#8a7479',
    },
    collection: { id: 'creatures-of-the-night', name: 'Creatures of the Night' },
    mood: { type: 'movie', genre: 'Fantasy', name: 'Dark Fantasy' },
  },
  {
    id: 'bluenote',
    name: 'Blue Note',
    emoji: '🎷',
    tagline: 'Smoky midnight blues and a brass spotlight.',
    template: 'noir',
    font: 'Abril Fatface',
    palette: {
      bg: '#060b18', surface: '#0f1a33', primary: '#c9d8ff', secondary: '#7f8db3',
      accent: '#e0a84b', text: '#eef2ff', muted: '#7d88a8',
    },
    collection: { id: 'after-hours', name: 'After Hours' },
    mood: { type: 'movie', genre: 'Biography', name: 'True Stories' },
  },
  {
    id: 'storybook',
    name: 'Storybook',
    emoji: '🍄',
    tagline: 'Fireflies, enchanted woods and storybook light.',
    template: 'aurora',
    font: 'Marcellus',
    palette: {
      bg: '#0b1410', surface: '#14281f', primary: '#8fe3a2', secondary: '#c8a2ff',
      accent: '#ffd27a', text: '#f4f1e6', muted: '#9bb3a0',
    },
    collection: { id: 'once-upon-a-time', name: 'Once Upon a Time' },
    mood: { type: 'movie', genre: 'Fantasy', name: 'Enchanted' },
  },
  {
    id: 'mono',
    name: 'Monochrome',
    emoji: '🎬',
    tagline: 'Pure black and white. Nothing else.',
    template: 'bauhaus',
    font: 'Archivo Black',
    palette: {
      bg: '#0e0e0e', surface: '#1c1c1c', primary: '#f2f2f2', secondary: '#9a9a9a',
      accent: '#5c5c5c', text: '#f2f2f2', muted: '#8a8a8a',
    },
    collection: { id: 'black-and-white', name: 'Black & White' },
    mood: { type: 'movie', genre: 'Mystery', name: 'Whodunits' },
  },
  {
    id: 'tropical',
    name: 'Tropical',
    emoji: '🌺',
    tagline: 'Coral, turquoise and pineapple-yellow stripes.',
    template: 'vhs',
    font: 'Permanent Marker',
    palette: {
      bg: '#0b2027', surface: '#123642', primary: '#ff6f59', secondary: '#1fc8a9',
      accent: '#ffd23f', text: '#fff6e5', muted: '#8fb8b5',
    },
    collection: { id: 'island-time', name: 'Island Time' },
    mood: { type: 'movie', genre: 'Adventure', name: 'Island Hopping' },
  },
  {
    id: 'dragon',
    name: 'Dragon Temple',
    emoji: '🐉',
    tagline: 'Plum blossoms, lacquer red and temple gold.',
    template: 'sakura',
    font: 'Bebas Neue',
    palette: {
      bg: '#170707', surface: '#2b0c0c', primary: '#ff5a4a', secondary: '#e8b23a',
      accent: '#c41e1e', text: '#fbeedd', muted: '#b28a7a',
    },
    collection: { id: 'way-of-the-fist', name: 'Way of the Fist' },
    mood: { type: 'movie', genre: 'Action', name: 'Fight Night' },
  },
  {
    id: 'academia',
    name: 'Dark Academia',
    emoji: '📚',
    tagline: 'Old libraries, oxblood leather and brass lamps.',
    template: 'deco',
    font: 'Marcellus',
    palette: {
      bg: '#16110c', surface: '#2a2017', primary: '#c8a46a', secondary: '#efe2c4',
      accent: '#6b1e2b', text: '#f2e8d3', muted: '#a38f72',
    },
    collection: { id: 'dark-academia', name: 'Dark Academia' },
    mood: { type: 'movie', genre: 'Drama', name: 'Prestige Drama' },
  },
  {
    id: 'deepsea',
    name: 'Deep Sea',
    emoji: '🌊',
    tagline: 'Bioluminescent glow in the midnight zone.',
    template: 'aurora',
    font: 'Syncopate',
    palette: {
      bg: '#020b16', surface: '#06213a', primary: '#2ef2e0', secondary: '#1d6fff',
      accent: '#c45cff', text: '#e6fbff', muted: '#6f9bb3',
    },
    collection: { id: 'into-the-deep', name: 'Into the Deep' },
    mood: { type: 'movie', genre: 'Thriller', name: 'Below Deck' },
  },
];

// Groups for browsing 25 themes on the website.
export const GROUPS = [
  { id: 'seasonal', name: 'Seasonal', themes: ['haunt', 'snowfall', 'sakura'] },
  { id: 'retro', name: 'Retro', themes: ['neon', 'vhs', 'terminal', 'arcade', 'vapor', 'velvet', 'deco'] },
  { id: 'moody', name: 'Dark & moody', themes: ['noir', 'gothic', 'bluenote', 'mono', 'deepsea', 'aurora'] },
  { id: 'bright', name: 'Bright & playful', themes: ['bauhaus', 'pastel', 'comic', 'tropical'] },
  { id: 'genre', name: 'Genre nights', themes: ['western', 'dragon', 'wasteland', 'storybook', 'academia'] },
];
for (const t of THEMES) t.group = GROUPS.find((g) => g.themes.includes(t.id))?.id || 'retro';

// Art styles, which several themes can share. `font` is the face the style
// draws titles in (used when a Studio setup borrows another theme's art).
export const TEMPLATES = {
  neon: { name: 'Synthwave', font: 'Bebas Neue' },
  noir: { name: 'Film noir', font: 'Abril Fatface' },
  deco: { name: 'Art deco', font: 'Limelight' },
  vhs: { name: 'VHS sleeve', font: 'Permanent Marker' },
  bauhaus: { name: 'Bauhaus', font: 'Archivo Black' },
  terminal: { name: 'CRT terminal', font: 'VT323' },
  haunt: { name: 'Haunted night', font: 'Creepster' },
  aurora: { name: 'Northern lights', font: 'Syncopate' },
  sakura: { name: 'Blossom branch', font: 'Marcellus' },
  wanted: { name: 'Wanted poster', font: 'Rye' },
  pop: { name: 'Comic pop', font: 'Bangers' },
  arcade: { name: 'Pixel arcade', font: 'Press Start 2P' },
};

export const THEME_IDS = THEMES.map((t) => t.id);
export const TEMPLATE_IDS = Object.keys(TEMPLATES);
export const PALETTE_KEYS = ['bg', 'surface', 'primary', 'secondary', 'accent', 'text', 'muted'];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

/** A theme drawn in this art style (for default colours). */
export function themeForTemplate(template) {
  return THEMES.find((t) => t.template === template) || THEMES[0];
}

/** The display face for a theme, or for the art style a setup borrowed. */
export function displayFont(themeId, template) {
  return template && TEMPLATES[template] ? TEMPLATES[template].font : getTheme(themeId).font;
}
