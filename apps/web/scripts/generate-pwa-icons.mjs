import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, '..', 'public');
const src = path.join(publicDir, 'logo.png');
const outDir = path.join(publicDir, 'icons');
const bg = { r: 3, g: 4, b: 7, alpha: 1 };

fs.mkdirSync(outDir, { recursive: true });

async function square(size, dest, maskable = false) {
  const inner = maskable ? Math.round(size * 0.72) : size;
  const img = await sharp(src).resize(inner, inner, { fit: 'contain', background: bg }).png().toBuffer();
  const pad = Math.round((size - inner) / 2);
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: img, left: pad, top: pad }])
    .png()
    .toFile(dest);
}

await square(192, path.join(outDir, 'icon-192.png'));
await square(512, path.join(outDir, 'icon-512.png'));
await square(192, path.join(outDir, 'icon-192-maskable.png'), true);
await square(512, path.join(outDir, 'icon-512-maskable.png'), true);
await square(180, path.join(outDir, 'apple-touch-icon.png'));
console.log('PWA icons written to', outDir);
