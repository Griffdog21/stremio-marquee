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
];

export const THEME_IDS = THEMES.map((t) => t.id);
export const TEMPLATE_IDS = THEMES.map((t) => t.template);
export const PALETTE_KEYS = ['bg', 'surface', 'primary', 'secondary', 'accent', 'text', 'muted'];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
