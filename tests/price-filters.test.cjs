const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const indumentaria = fs.readFileSync(path.join(root, 'indumentaria.html'), 'utf8');

for (const id of ['precioMin', 'precioMax']) {
  assert.match(index, new RegExp(`id="${id}"`), `falta ${id} en suplementos`);
}
for (const id of ['precioMinI', 'precioMaxI']) {
  assert.match(indumentaria, new RegExp(`id="${id}"`), `falta ${id} en indumentaria`);
}

const indumFilter = indumentaria.slice(indumentaria.indexOf('function getFil(){'), indumentaria.indexOf('function buildFiltros(){'));
const indumContext = {
  PRODS: [
    { nombre: 'Calza A', genero: 'M', cat: 'calza', marca: 'MAXUP', precio: 10000 },
    { nombre: 'Calza B', genero: 'M', cat: 'calza', marca: 'MAXUP', precio: 20000 },
    { nombre: 'Calza C', genero: 'M', cat: 'calza', marca: 'MAXUP', precio: 30000 },
    { nombre: 'Remera D', genero: 'H', cat: 'remera', marca: 'MAXUP', precio: 20000 },
  ],
  generoA: 'M', catA: 'all', marcaA: 'all', busqA: '', precioMinI: 20000, precioMaxI: 30000,
};
vm.runInNewContext(indumFilter, indumContext);
assert.deepEqual(Array.from(indumContext.getFil(), p => p.nombre), ['Calza B', 'Calza C']);
indumContext.catA = 'remera';
assert.equal(indumContext.getFil().length, 0, 'precio y categoría se combinan');

const appFilter = app.slice(app.indexOf('function applyFilters(){'), app.indexOf('function onOrdenFilter(val){'));
const products = [3000, 6000, 8000, 9000].map((price, i) => ({
  id: `p${i}`, name: `Creatina ${i}`, brand: 'Star', cat: 'creatina', cats: ['creatina'],
  price, flavors: [{ name: 'Unidad', stock: 1 }],
}));
const elements = {
  filtroPorPagina: { value: '2' },
  searchInfo: { textContent: '' },
  noResults: { style: {} },
  productsGrid: { innerHTML: '', querySelectorAll() { return []; } },
};
let totalPaginado = -1;
const appContext = {
  document: {
    getElementById(id) { return elements[id] || null; },
  },
  PRODUCTS: products,
  _catalogoSheetsCargado: true, _catalogoSoloCache: false,
  _favoritos: [], activeCat: 'all', activeBrand: 'all', activeSearch: '',
  precioMin: 6000, precioMax: 8000, activeOrden: 'default',
  paginaActual: 1, ITEMS_POR_PAGINA: 2,
  renderPaginacion(total) { totalPaginado = total; },
  renderFiltrosActivos() {}, setTimeout(fn) { fn(); },
  _mostrarEstadoCatalogo_() {}, _categoriasProducto() { return ['creatina']; },
  buildCard(p) { return `<article data-id="${p.id}">${p.name}</article>`; },
  makeCardsClickable() {},
};
vm.runInNewContext(appFilter, appContext);
appContext.applyFilters();
assert.equal(totalPaginado, 2, 'la paginación cuenta solo productos dentro del rango');
assert.match(elements.productsGrid.innerHTML, /Creatina 1/);
assert.match(elements.productsGrid.innerHTML, /Creatina 2/);
assert.doesNotMatch(elements.productsGrid.innerHTML, /Creatina 0/);
appContext.activeBrand = 'otra';
appContext.applyFilters();
assert.equal(totalPaginado, 0, 'precio y marca se combinan');
assert.equal(elements.noResults.style.display, 'block');

console.log('Filtros de precio de suplementos e indumentaria: OK');
