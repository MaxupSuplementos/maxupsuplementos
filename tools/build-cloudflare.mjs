import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'dist');

// Solo estos archivos forman parte de la web pública. Así Cloudflare no recibe
// los .gs, pruebas ni utilidades internas que también viven en el repositorio.
const publicFiles = [
  '404.html',
  'admin.html',
  'app.js',
  'caja.html',
  'CajaMaxup.html',
  'estado.html',
  'favicon.png',
  'icon-192.png',
  'icon-512.png',
  'index.html',
  'indumentaria.html',
  'logo-transparent.png',
  'logo.png',
  'manifest.json',
  'mantenimiento.png',
  'mantenimiento.webp',
  'mayorista.html',
  'og-preview.jpg',
  'og-preview.png',
  'presupuesto.html',
  'privacidad.html',
  'products_compact.js',
  'promo.html',
  'salud.html',
  'sitemap.xml',
  'styles.css',
  'sw.js',
  '_headers'
];

const publicDirectories = ['assets', 'cat-icons', 'generated'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of publicFiles) {
  await cp(path.join(root, file), path.join(output, file));
}

for (const directory of publicDirectories) {
  await cp(path.join(root, directory), path.join(output, directory), {
    recursive: true
  });
}

const published = await readdir(output);
console.log(`Cloudflare: ${published.length} entradas públicas preparadas en dist/`);
