// Posters ship as JPEG (about a third of the PNG size, and every Stremio client
// decodes it). sharp is optional: without it everything falls back to PNG.
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  sharp = null;
}

export const IMAGE_EXT = sharp ? 'jpg' : 'png';
export const IMAGE_TYPE = sharp ? 'image/jpeg' : 'image/png';

export async function encode(png) {
  if (!sharp) return png;
  return sharp(png).jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
}
