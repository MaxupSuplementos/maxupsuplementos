const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('mayorista.html', 'utf8');
const api = fs.readFileSync('Api.gs', 'utf8');

function between(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `No se encontró el bloque ${start}`);
  return source.slice(from, to);
}

assert.ok(!html.includes('productosayo'), 'Debe usarse una sola lista canónica de productos mayoristas');
for (const cat of ['proteina', 'creatina', 'aminoacido', 'preworkout', 'quemador', 'gainer', 'colageno', 'vitamin', 'hidratacion', 'barra', 'shaker', 'accesorio']) {
  assert.ok(html.includes(`data-cat="${cat}"`), `Falta el filtro mayorista ${cat}`);
}

const frontendCode = [
  between(html, 'function normalizarTextoMayorista', 'function filtrarCat'),
  between(html, 'function renderProductos', 'function agregarAlCarrito')
].join('\n');

const grid = { innerHTML: '' };
const front = {
  productosmayo: [
    { id: 'c1', name: 'Creatina Monohidratada x300g', brand: 'STAR', cat: 'otro', precio: 30000, precio_mayorista: 27000, desc_mayorista: 10, stock: 3 },
    { id: 'p1', name: 'Whey Protein 2lb', brand: 'ENA', cat: 'otro', precio: 60000, precio_mayorista: 54000, desc_mayorista: 10, stock: 2 },
    { id: 's1', name: 'Shaker IDN 600ml', brand: 'IDN', cat: 'otro', precio: 12000, precio_mayorista: 10000, desc_mayorista: 15, stock: 5 },
    { id: 'm1', name: 'Citrato de Magnesio', brand: 'GOLD', cat: 'magnesio', precio: 18000, precio_mayorista: 16000, desc_mayorista: 11, stock: 2 }
  ],
  document: { getElementById() { return grid; } },
  console
};
vm.createContext(front);
vm.runInContext(frontendCode, front);
front.renderProductos('creatina');
assert.match(grid.innerHTML, /Creatina Monohidratada/);
assert.doesNotMatch(grid.innerHTML, /Whey Protein|Shaker IDN|Citrato de Magnesio/);
front.renderProductos('shaker');
assert.match(grid.innerHTML, /Shaker IDN/);
assert.doesNotMatch(grid.innerHTML, /Creatina Monohidratada|Whey Protein/);
front.renderProductos('vitamin');
assert.match(grid.innerHTML, /Citrato de Magnesio/);

const apiCode = [
  between(api, 'function inferirCat', 'function getStats'),
  between(api, 'function obtenerCatalogoMayorista', 'function _nivelMayorista_')
].join('\n');
const rows = [
  ['Producto'],
  [],
  ['STAR NUTRITION', 0],
  ['Creatina Monohidratada x300g', 30000, 0, 3, '', '', '', '', 'creatina.jpg', 'Creatina pura', 10, 15],
  ['Whey Protein 2lb', 60000, 0, 2, '', '', '', '', 'whey.jpg', 'Proteína de suero', 12, 16],
  ['GOLD', 0],
  ['Citrato de Magnesio', 18000, 0, 2, '', '', '', '', 'magnesio.jpg', 'Mineral', 10, 14],
  ['IDN', 0],
  ['Shaker 600ml', 12000, 0, 5, '', '', '', '', 'shaker.jpg', 'Vaso mezclador', 15, 18]
];
const back = {
  COL_DESC_MAYORISTA: 11,
  COL_DESC_MAYO_MAX: 12,
  _getSS() { return { getSheetByName() { return { getDataRange() { return { getValues() { return rows; } }; } }; } }; },
  _columnasCatalogoSuplementos() { return { sku: -1 }; },
  _skuDeterministico(marca, nombre) { return `${marca}-${nombre}`; },
  _calcularPrecioListaTresCuotas(precio) { return precio; }
};
vm.createContext(back);
vm.runInContext(apiCode, back);
const catalogo = back.obtenerCatalogoMayorista();
assert.deepEqual(Array.from(catalogo, p => p.cat), ['creatina', 'proteina', 'vitamin', 'shaker']);
assert.deepEqual(Array.from(catalogo, p => p.brand), ['STAR NUTRITION', 'STAR NUTRITION', 'GOLD', 'IDN']);

console.log('Filtros del catálogo mayorista: OK');
