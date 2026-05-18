import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOIL_CONIC_STOPS, GLYPH_26_D, seloSvg } from './brand-glyphs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const BRAND_DIR = join(ROOT, 'public/brand');

function foilDefs(id = 'foil') {
  const stops = FOIL_CONIC_STOPS.map(
    (s) => `    <stop offset="${s.offset}" stop-color="${s.color}"/>`,
  ).join('\n');
  return `  <defs>
    <radialGradient id="${id}" cx="50%" cy="50%" r="70%" gradientUnits="objectBoundingBox">
${stops}
    </radialGradient>
    <linearGradient id="grad-blue-mint" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5b8def"/>
      <stop offset="100%" stop-color="#3ec48a"/>
    </linearGradient>
  </defs>`;
}

function glyph26Group(scale, x, y, fill = 'url(#foil)') {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="${GLYPH_26_D}" fill="${fill}"/>
  </g>`;
}

function wordmarkStacked({ x = 0, y = 0, size = 86, gap = 4 } = {}) {
  const lh = size * 0.86;
  return `<g transform="translate(${x} ${y})" font-family="'Bebas Neue', sans-serif" letter-spacing="0.04em">
    <text x="0" y="${lh}" font-size="${size}" fill="#5b8def">MEU</text>
    <text x="0" y="${lh * 2 + gap}" font-size="${size}" fill="#ec5b87">ÁLBUM</text>
    <text x="0" y="${lh * 3 + gap * 2 + 12}" font-size="${size}" fill="url(#foil)">2026</text>
  </g>`;
}

function wordmarkInline({ x = 0, y = 0, size = 28 } = {}) {
  return `<g transform="translate(${x} ${y})" font-family="'Bebas Neue', sans-serif" font-size="${size}" letter-spacing="0.08em">
    <text y="${size}" fill="#5b8def">Meu</text>
    <text x="52" y="${size}" fill="#ec5b87">Álbum</text>
    <text x="148" y="${size}" fill="#3ec48a">2026</text>
  </g>`;
}

function logoPrimary() {
  const w = 520;
  const h = 240;
  const seloSize = 220;
  const scale = (seloSize - 20) / 62;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Meu Álbum 2026">
${foilDefs()}
  <rect width="${w}" height="${h}" fill="#0f172a"/>
  <g transform="translate(24 10)">
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2}" fill="url(#foil)"/>
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2 - 10}" fill="#0f172a"/>
    ${glyph26Group(scale, (seloSize - 62 * scale) / 2, (seloSize - 58 * scale) / 2)}
    <defs>
      <path id="ring" d="M ${seloSize / 2},${seloSize / 2} m -98,0 a 98,98 0 1,1 196,0 a 98,98 0 1,1 -196,0"/>
    </defs>
    <text font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="8" fill="#cbd5e1">
      <textPath href="#ring" startOffset="0">MEU·ÁLBUM·26·MEU·ÁLBUM·26·</textPath>
    </text>
  </g>
  <g transform="translate(270 18)">
    <text font-family="'Bebas Neue', sans-serif" font-size="86" letter-spacing="0.04em" fill="#5b8def">MEU</text>
    <text x="0" y="78" font-family="'Bebas Neue', sans-serif" font-size="86" letter-spacing="0.04em" fill="#ec5b87">ÁLBUM</text>
    <line x1="0" y1="92" x2="220" y2="92" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 6" opacity="0.35"/>
    <text x="0" y="178" font-family="'Bebas Neue', sans-serif" font-size="86" letter-spacing="0.04em" fill="url(#foil)">2026</text>
  </g>
</svg>`;
}

function logoStacked() {
  const w = 280;
  const h = 220;
  const seloSize = 140;
  const scale = (seloSize - 12) / 62;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Meu Álbum 2026">
${foilDefs()}
  <rect width="${w}" height="${h}" fill="#0f172a"/>
  <g transform="translate(${(w - seloSize) / 2} 16)">
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2}" fill="url(#foil)"/>
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2 - 6}" fill="#0f172a"/>
    ${glyph26Group(scale, (seloSize - 62 * scale) / 2, (seloSize - 58 * scale) / 2)}
  </g>
  <text x="${w / 2}" y="188" text-anchor="middle" font-family="'Bebas Neue', sans-serif" font-size="30" letter-spacing="0.08em">
    <tspan fill="#5b8def">MEU</tspan><tspan dx="8" fill="#ec5b87">ÁLBUM</tspan><tspan dx="8" fill="#3ec48a">2026</tspan>
  </text>
</svg>`;
}

function logoInline() {
  const w = 320;
  const h = 72;
  const seloSize = 56;
  const scale = (seloSize - 6) / 62;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Meu Álbum 2026">
${foilDefs()}
  <rect width="${w}" height="${h}" fill="#0f172a"/>
  <g transform="translate(8 8)">
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2}" fill="url(#foil)"/>
    <circle cx="${seloSize / 2}" cy="${seloSize / 2}" r="${seloSize / 2 - 3}" fill="#0f172a"/>
    ${glyph26Group(scale, (seloSize - 62 * scale) / 2, (seloSize - 58 * scale) / 2)}
  </g>
  ${wordmarkInline({ x: 76, y: 10, size: 28 })}
</svg>`;
}

function faviconSvg() {
  const scale = 18 / 58;
  const tx = (26 - 62 * scale) / 2 + 3;
  const ty = (26 - 58 * scale) / 2 + 3;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g32" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5b8def"/>
      <stop offset="100%" stop-color="#3ec48a"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="#0F172A"/>
  <rect x="3" y="3" width="26" height="26" rx="5" fill="url(#g32)"/>
  <g transform="translate(${tx} ${ty}) scale(${scale})">
    <path d="${GLYPH_26_D}" fill="#0F172A"/>
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

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const written = writeBrandSvgs();
  console.log('Wrote SVGs:', written.join(', '));
}
