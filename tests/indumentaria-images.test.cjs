const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'indumentaria.html'), 'utf8');

const helperSource = html.match(/function originalImgI\(url\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(helperSource, 'debe existir el recuperador de la URL original');

const context = { URL, location: { href: 'https://maxupsuplementos.com.ar/indumentaria.html' } };
vm.createContext(context);
vm.runInContext(`${helperSource}; this.originalImgI = originalImgI;`, context);

assert.equal(
  context.originalImgI('https://images.weserv.nl/?url=i.ibb.co/demo/prenda.jpg&w=400&output=webp&q=82'),
  'https://i.ibb.co/demo/prenda.jpg',
  'si falla el optimizador debe recuperar la foto original de i.ibb.co',
);

assert.match(html, /function recuperarImagenI\(img\)/,
  'debe existir un manejador común de errores de imagen');
assert.match(html, /loading="lazy" onerror="recuperarImagenI\(this\)"/,
  'las tarjetas del catálogo deben activar la carga de respaldo');
assert.match(html, /nuevos-card-img[\s\S]*?onerror="recuperarImagenI\(this\)"/,
  'los nuevos ingresos también deben activar la carga de respaldo');
assert.match(html, /ci-thumb-i[\s\S]*?onerror="recuperarImagenI\(this\)"/,
  'las miniaturas del carrito también deben activar la carga de respaldo');

console.log('Imágenes de indumentaria con respaldo: OK');
