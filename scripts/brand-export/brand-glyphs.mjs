/**
 * Glyph / wordmark helpers for the Meu Álbum 2026 brand pack.
 *
 * Real Bebas Neue paths via opentype.js so standalone SVGs (favicon, brand
 * logos served as raw URLs / <img src>) render correctly without depending on
 * the page loading a web font. The previous hand-coded "26" path was an
 * abstract Z/8 shape, not the digits.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../..');
const FONT_PATH = join(
  REPO_ROOT,
  'node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff',
);

let _font = null;
function font() {
  if (_font) return _font;
  const buf = readFileSync(FONT_PATH);
  _font = opentype.parse(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  );
  return _font;
}

/**
 * Render text to an SVG <path> with optional tracking (letter-spacing in em).
 * Returns { d, width, height } in path units where (0,0) is top-left of the
 * tight bounding box, so callers can `translate(tx ty)` without further math.
 */
export function textToPath(text, { fontSize = 100, letterSpacingEm = 0 } = {}) {
  const f = font();
  let cursor = 0;
  const trackPx = letterSpacingEm * fontSize;
  const merged = new opentype.Path();
  for (const ch of [...text]) {
    const glyph = f.charToGlyph(ch);
    const glyphPath = glyph.getPath(cursor, 0, fontSize);
    for (const cmd of glyphPath.commands) merged.commands.push(cmd);
    const advance = (glyph.advanceWidth / f.unitsPerEm) * fontSize;
    cursor += advance + trackPx;
  }
  const bbox = merged.getBoundingBox();
  const tx = -bbox.x1;
  const ty = -bbox.y1;
  const shifted = new opentype.Path();
  for (const cmd of merged.commands) {
    const c = { ...cmd };
    if ('x' in c) c.x += tx;
    if ('y' in c) c.y += ty;
    if ('x1' in c) c.x1 += tx;
    if ('y1' in c) c.y1 += ty;
    if ('x2' in c) c.x2 += tx;
    if ('y2' in c) c.y2 += ty;
    shifted.commands.push(c);
  }
  return {
    d: shifted.toPathData(2),
    width: bbox.x2 - bbox.x1,
    height: bbox.y2 - bbox.y1,
    // Distance from the normalized top of the bbox down to the typographic
    // baseline. For glyphs without descenders (every char we render),
    // baseline === height — but the accent on "Á" makes "ÁLBUM" taller than
    // "MEU" without moving the baseline, and callers need this to align
    // mixed-accent text on a shared baseline.
    baseline: -bbox.y1,
  };
}

/**
 * Like {@link textToPath} but scaled so the bounding-box height matches
 * `targetHeight`. Useful when you want "26 fills 60% of the selo height".
 */
export function textToPathFit(text, targetHeight, { letterSpacingEm = 0 } = {}) {
  const probe = textToPath(text, { fontSize: 100, letterSpacingEm });
  const fontSize = (targetHeight / probe.height) * 100;
  return textToPath(text, { fontSize, letterSpacingEm });
}

/**
 * Linear "foil" gradient — a diagonal iridescent sheen. SVG has no native
 * conic gradient (the handoff's `.foil` uses CSS conic), so we approximate
 * with a 6-stop linear at 135deg. Reads as metallic foil rather than a
 * concentric bullseye like the previous radial attempt.
 */
export const FOIL_STOPS = [
  { offset: '0%', color: '#7eb8d4' },
  { offset: '20%', color: '#d4568a' },
  { offset: '40%', color: '#e8d060' },
  { offset: '60%', color: '#3ec48a' },
  { offset: '80%', color: '#5b8def' },
  { offset: '100%', color: '#7eb8d4' },
];

export function foilLinearDef(id = 'foil') {
  const stops = FOIL_STOPS.map(
    (s) => `    <stop offset="${s.offset}" stop-color="${s.color}"/>`,
  ).join('\n');
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
${stops}
  </linearGradient>`;
}

export function blueMintLinearDef(id = 'grad-blue-mint') {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#5b8def"/>
    <stop offset="100%" stop-color="#3ec48a"/>
  </linearGradient>`;
}

/**
 * Selo (disc + "26") at the given pixel size. Outer ring uses foil gradient,
 * inner disc is ink, "26" centered in real Bebas Neue paths filled with foil.
 */
export function seloSvg({ size = 240, ring = true } = {}) {
  const insetRatio = 10 / 220;
  const inset = size * insetRatio;
  const glyphTargetH = (size - inset * 2) * 0.62;
  const glyph = textToPathFit('26', glyphTargetH);
  const gx = (size - glyph.width) / 2;
  const gy = (size - glyph.height) / 2;

  const ringSvg = ring
    ? `
  <defs>
    <path id="ring" d="M ${size / 2},${size / 2} m -${size / 2 - 10},0 a ${size / 2 - 10},${size / 2 - 10} 0 1,1 ${size - 20},0 a ${size / 2 - 10},${size / 2 - 10} 0 1,1 -${size - 20},0"/>
  </defs>
  <text font-family="ui-monospace, 'JetBrains Mono', monospace" font-size="${size * 0.046}" letter-spacing="${size * 0.033}" fill="#cbd5e1">
    <textPath href="#ring" startOffset="0">MEU·ÁLBUM·26·MEU·ÁLBUM·26·</textPath>
  </text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="26">
  <defs>
    ${foilLinearDef('foil')}
  </defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#foil)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - inset}" fill="#0f172a"/>
  <g transform="translate(${gx.toFixed(2)} ${gy.toFixed(2)})">
    <path d="${glyph.d}" fill="url(#foil)"/>
  </g>${ringSvg}
</svg>`;
}
