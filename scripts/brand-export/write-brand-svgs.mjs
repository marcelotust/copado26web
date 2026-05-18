import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  blueMintLinearDef,
  foilLinearDef,
  seloSvg,
  textToPath,
  textToPathFit,
} from './brand-glyphs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const BRAND_DIR = join(ROOT, 'public/brand');

const INK = '#0f172a';
const BLUE = '#5b8def';
const ROSE = '#ec5b87';
const MINT = '#3ec48a';

function defs() {
  return `<defs>
    ${foilLinearDef('foil')}
    ${blueMintLinearDef('grad-blue-mint')}
  </defs>`;
}

/**
 * Render a sequence of colored words on a single shared baseline. Words with
 * accents (e.g. "ÁLBUM") have a taller bounding box than plain caps, so the
 * naive top-aligned layout sinks accented words below the others. Here every
 * word is shifted down by `(maxBaseline - word.baseline)` so all baselines
 * line up — accents extend up into the slack instead of pushing the word
 * down.
 */
function wordmarkInline({ words, size, x, y, gapEm = 0.32, letterSpacingEm = 0.06 }) {
  const computed = words.map(({ text, fill }) => ({
    fill,
    path: textToPath(text, { fontSize: size, letterSpacingEm }),
  }));
  const maxBaseline = Math.max(...computed.map((c) => c.path.baseline));
  const maxHeight = Math.max(...computed.map((c) => c.path.height));

  let cursor = 0;
  const parts = [];
  for (const { fill, path } of computed) {
    const wy = maxBaseline - path.baseline;
    parts.push(
      `<path d="${path.d}" fill="${fill}" transform="translate(${cursor.toFixed(2)} ${wy.toFixed(2)})"/>`,
    );
    cursor += path.width + gapEm * size;
  }
  const totalW = cursor - gapEm * size;
  return {
    svg: `<g transform="translate(${x} ${y})">${parts.join('')}</g>`,
    width: totalW,
    height: maxHeight,
    baseline: maxBaseline,
  };
}

/**
 * Stacked wordmark: each word on its own line. Lines advance by a uniform
 * `lineHeight = maxAscent + lineGap` (maxAscent = tallest baseline across
 * words), and each word is positioned so its baseline sits on its line's
 * baseline — not so its bounding-box top sits on the previous line's bottom.
 * That keeps the cap-bottoms on a regular grid even when one line carries
 * an accent.
 *
 * The result is normalized so y=0 == top of visible content (cap-top of the
 * first line when it has no accent, or accent-top if it does). `height` is
 * therefore tight to the visible content and `(canvasH - height) / 2`
 * actually centers the wordmark — the previous version reported a height
 * that included ascender slack above the first line, which made centered
 * stacks land too high.
 */
function wordmarkStacked({ words, size, x, y, lineGap = 4, letterSpacingEm = 0.06 }) {
  const computed = words.map(({ text, fill }) => ({
    fill,
    path: textToPath(text, { fontSize: size, letterSpacingEm }),
  }));
  const maxAscent = Math.max(...computed.map((c) => c.path.baseline));
  const lineHeight = maxAscent + lineGap;
  // First line's raw top would be (maxAscent - first.baseline). Shift the
  // whole stack up by that so the visible content starts at y=0.
  const firstLineBaseline = computed[0].path.baseline;

  const parts = [];
  let maxW = 0;
  let lineBaseline = firstLineBaseline;
  for (const { fill, path } of computed) {
    const wy = lineBaseline - path.baseline;
    parts.push(
      `<path d="${path.d}" fill="${fill}" transform="translate(0 ${wy.toFixed(2)})"/>`,
    );
    maxW = Math.max(maxW, path.width);
    lineBaseline += lineHeight;
  }
  // After the loop, lineBaseline sits one past the last baseline. None of
  // our glyphs have descenders, so the visible content bottom = last baseline.
  const lastBaseline = lineBaseline - lineHeight;

  return {
    svg: `<g transform="translate(${x} ${y})">${parts.join('')}</g>`,
    width: maxW,
    height: lastBaseline,
    // First line's baseline (in normalized coords) — primary lockup uses
    // this to align the wordmark with the selo "26" baseline.
    baseline: firstLineBaseline,
  };
}

function logoPrimary() {
  const h = 240;
  const seloSize = 220;
  const seloX = 16;
  const seloY = (h - seloSize) / 2;
  const inset = (seloSize * 10) / 220;
  const glyphH = (seloSize - inset * 2) * 0.62;
  const glyph = textToPathFit('26', glyphH);

  const wordmarkSize = 76;
  const wmX = seloX + seloSize + 32;
  const wm = wordmarkStacked({
    words: [
      { text: 'MEU', fill: BLUE },
      { text: 'ÁLBUM', fill: ROSE },
      { text: '2026', fill: 'url(#foil)' },
    ],
    size: wordmarkSize,
    x: wmX,
    y: 0,
    lineGap: 4,
    letterSpacingEm: 0.04,
  });
  // Center the whole 3-line stack vertically against the selo so the visual
  // weight lines up. wm.height already accounts for accent ascent on "ÁLBUM".
  const wmY = (h - wm.height) / 2;
  // Size the canvas to its actual content (mirror logoInline). Hardcoding
  // width left a ~70px dead zone on the right of every paper-bg render.
  const w = Math.ceil(wmX + wm.width + 16);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Meu Álbum 2026">
  ${defs()}
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <g transform="translate(${seloX} ${seloY})">
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2}" fill="url(#foil)"/>
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2 - inset}" fill="${INK}"/>
    <g transform="translate(${((seloSize - glyph.width) / 2).toFixed(2)} ${((seloSize - glyph.height) / 2).toFixed(2)})">
      <path d="${glyph.d}" fill="url(#foil)"/>
    </g>
  </g>
  <g transform="translate(0 ${wmY})">${wm.svg}</g>
</svg>`;
}

function logoStacked() {
  const w = 320;
  const h = 260;
  const seloSize = 140;
  const seloX = (w - seloSize) / 2;
  const seloY = 18;
  const inset = (seloSize * 6) / 140;
  const glyphH = (seloSize - inset * 2) * 0.62;
  const glyph = textToPathFit('26', glyphH);

  const wordmarkSize = 36;
  const wmY = seloY + seloSize + 32;
  const wm = wordmarkInline({
    words: [
      { text: 'MEU', fill: BLUE },
      { text: 'ÁLBUM', fill: ROSE },
      { text: '2026', fill: MINT },
    ],
    size: wordmarkSize,
    x: 0,
    y: wmY,
    gapEm: 0.32,
    letterSpacingEm: 0.08,
  });
  const wmX = (w - wm.width) / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Meu Álbum 2026">
  ${defs()}
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <g transform="translate(${seloX} ${seloY})">
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2}" fill="url(#foil)"/>
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2 - inset}" fill="${INK}"/>
    <g transform="translate(${((seloSize - glyph.width) / 2).toFixed(2)} ${((seloSize - glyph.height) / 2).toFixed(2)})">
      <path d="${glyph.d}" fill="url(#foil)"/>
    </g>
  </g>
  <g transform="translate(${wmX} 0)">${wm.svg}</g>
</svg>`;
}

function logoInline() {
  const h = 80;
  const seloSize = 64;
  const seloX = 8;
  const seloY = (h - seloSize) / 2;
  const inset = (seloSize * 3) / 56;
  const glyphH = (seloSize - inset * 2) * 0.65;
  const glyph = textToPathFit('26', glyphH);

  const wordmarkSize = 36;
  const wmX = seloX + seloSize + 18;
  const wm = wordmarkInline({
    words: [
      { text: 'Meu', fill: BLUE },
      { text: 'Álbum', fill: ROSE },
      { text: '2026', fill: MINT },
    ],
    size: wordmarkSize,
    x: wmX,
    y: 0,
    gapEm: 0.28,
    letterSpacingEm: 0.06,
  });
  // Align the wordmark baseline with the selo "26" baseline. The wordmark's
  // own internal baseline-alignment already keeps "Meu"/"Álbum"/"2026"
  // sharing a line — here we just place that shared baseline at the same Y
  // as the digits inside the selo.
  const selo26BaselineY =
    seloY + (seloSize - glyph.height) / 2 + glyph.baseline;
  const wmY = selo26BaselineY - wm.baseline;
  const w = Math.ceil(wmX + wm.width + 16);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Meu Álbum 2026">
  ${defs()}
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <g transform="translate(${seloX} ${seloY})">
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2}" fill="url(#foil)"/>
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2 - inset}" fill="${INK}"/>
    <g transform="translate(${((seloSize - glyph.width) / 2).toFixed(2)} ${((seloSize - glyph.height) / 2).toFixed(2)})">
      <path d="${glyph.d}" fill="url(#foil)"/>
    </g>
  </g>
  <g transform="translate(0 ${wmY})">${wm.svg}</g>
</svg>`;
}

function faviconSvg() {
  const glyphH = 18;
  const glyph = textToPathFit('26', glyphH);
  const tx = (26 - glyph.width) / 2 + 3;
  const ty = (32 - glyph.height) / 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g32" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BLUE}"/>
      <stop offset="100%" stop-color="${MINT}"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="${INK}"/>
  <rect x="3" y="3" width="26" height="26" rx="5" fill="url(#g32)"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)})">
    <path d="${glyph.d}" fill="${INK}"/>
  </g>
</svg>`;
}

export function writeBrandSvgs() {
  mkdirSync(BRAND_DIR, { recursive: true });
  const files = {
    'public/brand/logo-primary.svg': logoPrimary(),
    'public/brand/logo-stacked.svg': logoStacked(),
    'public/brand/logo-inline.svg': logoInline(),
    'public/brand/selo-26.svg': seloSvg({ size: 240, ring: false }),
    'public/favicon.svg': faviconSvg(),
  };
  for (const [rel, content] of Object.entries(files)) {
    writeFileSync(join(ROOT, rel), content, 'utf8');
  }
  return Object.keys(files);
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const written = writeBrandSvgs();
  console.log('Wrote SVGs:', written.join(', '));
}
