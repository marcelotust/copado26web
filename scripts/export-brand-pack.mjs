#!/usr/bin/env node
/**
 * Export Meu Álbum 2026 brand pack to public/.
 * Run: node scripts/export-brand-pack.mjs
 */
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  existsSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import QRCode from 'qrcode';
import { writeBrandSvgs } from './brand-export/write-brand-svgs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXPORT_DIR = join(__dirname, 'brand-export');
const TPL_DIR = join(EXPORT_DIR, 'templates');
const PUBLIC = join(ROOT, 'public');

const OG_QR_URL = 'https://meualbum2026.app';

const IOS_SPLASHES = [
  { file: 'ios-750x1334.png', w: 750, h: 1334 },
  { file: 'ios-828x1792.png', w: 828, h: 1792 },
  { file: 'ios-1170x2532.png', w: 1170, h: 2532 },
  { file: 'ios-1170x2532-2.png', w: 1170, h: 2532 },
  { file: 'ios-1242x2688.png', w: 1242, h: 2688 },
  { file: 'ios-1284x2778.png', w: 1284, h: 2778 },
  { file: 'ios-1668x2388.png', w: 1668, h: 2388 },
  { file: 'ios-2048x2732.png', w: 2048, h: 2732 },
];

function loadTemplate(name) {
  const cssPath = pathToFileURL(join(EXPORT_DIR, 'brand-tokens.css')).href;
  const baseHead = readFileSync(join(TPL_DIR, 'base-head.html'), 'utf8').replace(
    '../brand-tokens.css',
    cssPath,
  );
  const html = readFileSync(join(TPL_DIR, name), 'utf8');
  return html.replace('<!-- BASE_HEAD -->', baseHead);
}

function writeIco(pngBuffers, outPath) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);

  const entries = [];
  let offset = 6 + pngBuffers.length * 16;
  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += buffer.length;
  }
  writeFileSync(
    outPath,
    Buffer.concat([header, ...entries, ...pngBuffers.map((p) => p.buffer)]),
  );
}

async function renderAppIcon(page, { size, radius, glyph, solid, outPath }) {
  await page.setViewportSize({ width: size, height: size });
  const html = loadTemplate('app-icon.html');
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(
    ({ size, radius, glyph, solid }) => {
      const icon = document.getElementById('icon');
      icon.style.width = `${size}px`;
      icon.style.height = `${size}px`;
      icon.style.borderRadius = `${radius * size}px`;
      icon.style.setProperty('--glyph-size', `${Math.round(size * glyph)}px`);
      if (solid) icon.classList.add('favicon-solid');
    },
    { size, radius, glyph, solid: !!solid },
  );
  await page.locator('#icon').screenshot({ path: outPath });
}

async function renderStage(page, selector, outPath, width, height) {
  await page.locator(selector).waitFor({ state: 'visible' });
  await page.screenshot({
    path: outPath,
    clip: { x: 0, y: 0, width, height },
  });
}

async function renderSplash(page, { w, h, variant, outPath }) {
  await page.setViewportSize({ width: w, height: h });
  const html = loadTemplate('splash.html');
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(
    ({ w, h, variant }) => {
      initSplash(w, h, variant);
    },
    { w, h, variant },
  );
  await renderStage(page, '#stage', outPath, w, h);
}

function optimizePng(path) {
  if (!existsSync(path)) return false;
  const r = spawnSync('oxipng', ['-o', '4', '--strip', 'safe', path], {
    encoding: 'utf8',
  });
  return r.status === 0;
}

function relSize(relPath) {
  const full = join(PUBLIC, relPath);
  return existsSync(full) ? statSync(full).size : -1;
}

async function main() {
  console.log('Writing SVG brand files…');
  const svgPaths = writeBrandSvgs();
  console.log(' ', svgPaths.join(', '));

  mkdirSync(join(PUBLIC, 'splash'), { recursive: true });
  mkdirSync(join(PUBLIC, 'email'), { recursive: true });

  const qrDataUrl = await QRCode.toDataURL(OG_QR_URL, {
    width: 110,
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#f8fafc' },
  });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  const created = [
    'brand/logo-primary.svg',
    'brand/logo-stacked.svg',
    'brand/logo-inline.svg',
    'brand/selo-26.svg',
    'favicon.svg',
  ];

  const iconJobs = [
    { out: 'pwa-512.png', size: 512, radius: 44 / 512, glyph: 148 / 512 },
    { out: 'pwa-192.png', size: 192, radius: 30 / 136, glyph: 96 / 136 },
    { out: 'apple-touch-icon.png', size: 180, radius: 22 / 124, glyph: 84 / 124 },
    { out: 'android-chrome-192.png', size: 192, radius: 18 / 88, glyph: 60 / 88 },
    { out: 'android-chrome-512.png', size: 512, radius: 44 / 512, glyph: 148 / 512 },
    { out: 'favicon-32.png', size: 32, radius: 7 / 32, glyph: 18 / 32, solid: true },
    { out: 'favicon-16.png', size: 16, radius: 3 / 16, glyph: 10 / 16, solid: true },
  ];

  console.log('Rendering app icons…');
  const faviconBuffers = [];
  for (const job of iconJobs) {
    const outPath = join(PUBLIC, job.out);
    await renderAppIcon(page, { ...job, outPath });
    created.push(job.out);
    if (job.out.startsWith('favicon-')) {
      faviconBuffers.push({ size: job.size, buffer: readFileSync(outPath) });
    }
  }

  console.log('Writing favicon.ico…');
  writeIco(
    faviconBuffers.sort((a, b) => a.size - b.size),
    join(PUBLIC, 'favicon.ico'),
  );
  created.push('favicon.ico');

  console.log('Rendering og-image.png…');
  const ogHtml = loadTemplate('og-image.html').replace(
    'window.__BRAND_QR_DATA_URL__',
    JSON.stringify(qrDataUrl),
  );
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(ogHtml, { waitUntil: 'networkidle' });
  await page.waitForSelector('#qr img');
  await renderStage(page, '#stage', join(PUBLIC, 'og-image.png'), 1200, 630);
  created.push('og-image.png');

  console.log('Rendering splash screens…');
  for (const splash of IOS_SPLASHES) {
    const out = `splash/${splash.file}`;
    await renderSplash(page, {
      w: splash.w,
      h: splash.h,
      variant: 'ios',
      outPath: join(PUBLIC, out),
    });
    created.push(out);
  }

  for (const splash of [
    { file: 'android.png', w: 1080, h: 2400, variant: 'android' },
    { file: 'ipad-portrait.png', w: 2048, h: 2732, variant: 'ipad' },
    { file: 'ipad-landscape.png', w: 2732, h: 2048, variant: 'ipad' },
  ]) {
    const out = `splash/${splash.file}`;
    await renderSplash(page, {
      w: splash.w,
      h: splash.h,
      variant: splash.variant,
      outPath: join(PUBLIC, out),
    });
    created.push(out);
  }

  console.log('Rendering email/selo-56.png…');
  await page.setContent(loadTemplate('email-selo.html'), {
    waitUntil: 'networkidle',
  });
  await page.locator('#selo').screenshot({
    path: join(PUBLIC, 'email/selo-56.png'),
  });
  created.push('email/selo-56.png');

  await browser.close();

  console.log('Optimizing PNGs…');
  let optimized = 0;
  for (const rel of created) {
    if (rel.endsWith('.png') && optimizePng(join(PUBLIC, rel))) optimized++;
  }
  console.log(`  oxipng optimized ${optimized} file(s)`);

  const ogKb = Math.round(relSize('og-image.png') / 1024);
  if (relSize('og-image.png') > 300 * 1024) {
    console.warn(`  WARN: og-image.png is ${ogKb}KB (target <300KB)`);
  }

  console.log('\nCreated files:');
  for (const rel of [...new Set(created)].sort()) {
    const bytes = relSize(rel);
    console.log(`  public/${rel.padEnd(34)} ${bytes >= 0 ? `${bytes} bytes` : 'MISSING'}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
