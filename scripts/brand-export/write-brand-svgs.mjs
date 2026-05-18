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
 * Render a sequence of colored words on a single baseline, returning the
 * SVG fragment (already translated to (x,y)) plus the total width consumed.
 * Each word gets its own <path> filled with its color. Words are separated
 * by a horizontal gap measured in em.
 */
function wordmarkInline({ words, size, x, y, gapEm = 0.32, letterSpacingEm = 0.06 }) {
  let cursor = 0;
  const parts = [];
  let maxH = 0;
  for (const { text, fill } of words) {
    const p = textToPath(text, { fontSize: size, letterSpacingEm });
    parts.push(
      `<path d="${p.d}" fill="${fill}" transform="translate(${cursor.toFixed(2)} 0)"/>`,
    );
    cursor += p.width + gapEm * size;
    maxH = Math.max(maxH, p.height);
  }
  const totalW = cursor - gapEm * size;
  return {
    svg: `<g transform="translate(${x} ${y})">${parts.join('')}</g>`,
    width: totalW,
    height: maxH,
  };
}

/**
 * Stacked wordmark: each word on its own line. Returns the inner <g> and
 * overall bounds so the caller can position vertically.
 */
function wordmarkStacked({ words, size, x, y, lineGap = 4, letterSpacingEm = 0.06 }) {
  let cursor = 0;
  const parts = [];
  let maxW = 0;
  for (const { text, fill } of words) {
    const p = textToPath(text, { fontSize: size, letterSpacingEm });
    parts.push(
      `<path d="${p.d}" fill="${fill}" transform="translate(0 ${cursor.toFixed(2)})"/>`,
    );
    cursor += p.height + lineGap;
    maxW = Math.max(maxW, p.width);
  }
  return {
    svg: `<g transform="translate(${x} ${y})">${parts.join('')}</g>`,
    width: maxW,
    height: cursor - lineGap,
  };
}

function logoPrimary() {
  const w = 540;
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
  const wmY = (h - wm.height) / 2;

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
  const wmY = (h - wm.height) / 2;
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
