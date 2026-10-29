const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const indumentaria = fs.readFileSync(path.join(root, 'indumentaria.html'), 'utf8');
const api = fs.readFileSync(path.join(root, '..', '..', 'tmp', 'apps-script-offer-20261029', 'Api.gs'), 'utf8');

assert.doesNotThrow(() => new Function(api), 'Api.gs debe conservar sintaxis JavaScript válida');

const start = api.indexOf('function _normalizarEncabezadoOfertaWeb_');
const end = api.indexOf('// También se puede ejecutar manualmente', start);
assert.ok(start >= 0 && end > start, 'falta el validador de precio oferta');
const ctx = {};
vm.runInNewContext(api.slice(start, end), ctx);
assert.equal(ctx._precioOfertaWebValido_(25000, 30000), 25000);
assert.equal(ctx._precioOfertaWebValido_(30000, 30000), 0, 'el precio igual no es oferta');
assert.equal(ctx._precioOfertaWebValido_(35000, 30000), 0, 'un importe mayor no se publica como oferta');
assert.equal(ctx._precioOfertaWebValido_('', 30000), 0, 'vacío desactiva la oferta');
const sabores = [
  { nombre: 'Whey Pro - Chocolate', marca: 'NUTRILAB', precio_regular: 32000, precio_venta: 32000, precio_oferta: 28000, en_oferta: true },
  { nombre: 'Whey Pro - Vainilla', marca: 'NUTRILAB', precio_regular: 32000, precio_venta: 32000, precio_oferta: 0, en_oferta: false }
];
ctx._aplicarOfertasPorGrupoWeb_(sabores);
assert.deepEqual(
  sabores.map((p) => [p.precio_venta, p.precio_oferta, p.en_oferta]),
  [[28000, 28000, true], [28000, 28000, true]],
  'una oferta debe mantenerse igual en todos los sabores agrupados'
);

assert.match(api, /setValue\('Precio oferta'\)/, 'la API debe crear la columna automáticamente');
assert.match(api, /precio_regular:\s*precioUnit/, 'indumentaria debe conservar el precio anterior');
assert.match(api, /precio_venta:\s*precio_oferta \|\| precio_unit/, 'suplementos deben cobrar el precio oferta');

assert.match(app, /priceAnterior:\s*en_oferta \? precio_regular : null/);
assert.match(app, /OFERTA CONTADO/);
assert.match(styles, /\.badge-oferta\{background:linear-gradient/);
assert.match(styles, /-webkit-text-fill-color:#ff3b57/);

assert.match(indumentaria, /offer-badge-i/);
assert.match(indumentaria, /mprice-offer/);
assert.match(indumentaria, /OFERTA \$'/);
const scriptsIndumentaria = [...indumentaria.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1]);
const runtimeIndumentaria = scriptsIndumentaria.find((script) => script.includes('var API='));
assert.ok(runtimeIndumentaria, 'falta el script principal de indumentaria');
assert.doesNotThrow(
  () => new Function(runtimeIndumentaria),
  'indumentaria.html debe conservar sintaxis JavaScript válida'
);

console.log('Precios oferta web: OK');
