/**
 * Path-based "26" glyph (Bebas Neue–inspired, no font dependency).
 * viewBox 0 0 62 58 — scale/translate per asset.
 */
export const GLYPH_26_VIEWBOX = '0 0 62 58';

/** Single compound path for digits "26". */
export const GLYPH_26_D = [
  'M4 0h18.5v5.2H9.8L22.8 28.4v5.2H4v-5.2h12.7L4 5.2V0z',
  'M30.2 16.4c0-8.8 6.4-14.2 13.8-14.2s13.8 5.4 13.8 14.2v1.4c0 5-2.8 9.2-7.2 11.4 4.6 2 7.2 6.2 7.2 11.6v1.4c0 8.8-6.4 14.2-13.8 14.2S30.2 49.6 30.2 40.8v-1.4c0-2.6 1.2-4.8 3.2-6.2-2.4-1.6-3.2-4-3.2-6.8V16.4zm7.4 0v10.2c0 3.6 2.8 6.4 6.4 6.4s6.4-2.8 6.4-6.4V16.4c0-3.6-2.8-6.4-6.4-6.4s-6.4 2.8-6.4 6.4zm0 23.4v1.4c0 3.6 2.8 6.4 6.4 6.4s6.4-2.8 6.4-6.4v-1.4c0-3.4-2.4-5.8-5.6-6.6-3.8 1-6.8 3.4-6.8 6.6z',
].join('');

export const FOIL_CONIC_STOPS = [
  { offset: '0%', color: '#7eb8d4' },
  { offset: '20%', color: '#d4568a' },
  { offset: '40%', color: '#e8d060' },
  { offset: '60%', color: '#3ec48a' },
  { offset: '80%', color: '#5b8def' },
  { offset: '100%', color: '#7eb8d4' },
];

export function foilConicDef(id, cx = '50%', cy = '50%') {
  const stops = FOIL_CONIC_STOPS.map(
    (s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`,
  ).join('');
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="70%" gradientUnits="objectBoundingBox">${stops}</radialGradient>`;
}

export function glyph26Svg({
  fill = 'url(#foil)',
  transform = '',
  id = 'foil',
} = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${GLYPH_26_VIEWBOX}" aria-hidden="true">
  <defs>${foilConicDef(id)}</defs>
  <path fill="${fill}" transform="${transform}" d="${GLYPH_26_D}"/>
</svg>`;
}

export function seloSvg({
  size = 240,
  ring = true,
  ringText = 'MEU·ÁLBUM·26·MEU·ÁLBUM·26·',
} = {}) {
  const ringSvg = ring
    ? `<defs>
      <path id="ring" d="M ${size / 2},${size / 2} m -${size / 2 - 10},0 a ${size / 2 - 10},${size / 2 - 10} 0 1,1 ${size - 20},0 a ${size / 2 - 10},${size / 2 - 10} 0 1,1 -${size - 20},0"/>
    </defs>
    <text font-family="JetBrains Mono, monospace" font-size="${size * 0.046}" letter-spacing="${size * 0.033}" fill="#cbd5e1">
      <textPath href="#ring" startOffset="0">${ringText}</textPath>
    </text>`
    : '';

  const inset = size * (10 / 220);
  const glyphScale = (size - inset * 2) / 62;
  const glyphY = (size - 58 * glyphScale) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="26">
  <defs>${foilConicDef('foil')}</defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#foil)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - inset}" fill="#0f172a"/>
  <g transform="translate(${(size - 62 * glyphScale) / 2} ${glyphY}) scale(${glyphScale})">
    <path d="${GLYPH_26_D}" fill="url(#foil)"/>
  </g>
  ${ringSvg}
</svg>`;
}
