const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const ventas = read('Ventas.gs');
const system = read('SystemV3.gs');
const routes = read('CajaMaxupRoutes.gs');
const server = read('CajaMaxupServer.gs');
const exportV2 = read('CajaV2Export.gs');

for (const [name, source] of [
  ['Ventas.gs', ventas],
  ['SystemV3.gs', system],
  ['CajaMaxupRoutes.gs', routes],
  ['CajaMaxupServer.gs', server],
  ['CajaV2Export.gs', exportV2]
]) {
  assert.doesNotThrow(() => new Function(source), `${name} debe tener sintaxis JavaScript valida`);
}

const start = ventas.indexOf('function _normalizarNombre');
const end = ventas.indexOf('function _descontarStockDetalladoBatch');
assert(start >= 0 && end > start, 'Deben existir los helpers de identidad de stock');
const identitySource = ventas.slice(start, end);

function columnas() {
  return { filaHeader: 1, producto: 0, contado: 1, lista: 4, stock: 3, sku: 5 };
}
function esFilaMarca(row, cols) {
  const nombre = String(row[cols.producto] || '').trim();
  return Boolean(nombre) &&
    (row[cols.contado] === '' || row[cols.contado] == null) &&
    (row[cols.lista] === '' || row[cols.lista] == null);
}

const helpers = new Function('_columnasCatalogoSuplementos', '_esFilaMarcaSuplementos_',
  `${identitySource}; return {
    normalizar: _normalizarNombre,
    clave: _claveProductoStock,
    indexar: _indexarCatalogoStock_,
    validar: _validarIdentidadesStock_
  };`
)(columnas, esFilaMarca);

const suplementos = [
  ['', '', '', '', '', ''],
  ['Producto', 'Precio unitario', '', 'Cantidad en stock', 'Precio de lista', 'SKU'],
  ['GOLD NUTRITION', '', '', '', '', ''],
  ['Creatina Monohidratada 300g Pote', 30000, '', 2, 34000, 'SUP-GOLD-POTE'],
  ['Creatina Monohidratada 300g Doypack', 29000, '', 3, 33000, 'SUP-GOLD-DOY'],
  ['STAR NUTRITION', '', '', '', '', ''],
  ['Creatina Monohidratada 300g Doypack', 31000, '', 4, 35000, 'SUP-STAR-DOY']
];

assert.notStrictEqual(
  helpers.clave('GOLD NUTRITION', 'Creatina Monohidratada 300g Pote'),
  helpers.clave('GOLD NUTRITION', 'Creatina Monohidratada 300g Doypack'),
  'Pote y doypack deben ser identidades distintas'
);
assert.notStrictEqual(
  helpers.clave('GOLD NUTRITION', 'Creatina Monohidratada 300g Doypack'),
  helpers.clave('STAR NUTRITION', 'Creatina Monohidratada 300g Doypack'),
  'El mismo nombre en marcas distintas debe tener stock separado'
);

const indice = helpers.indexar(suplementos);
assert.strictEqual(indice.errores.length, 0, 'El catálogo válido no debe producir ambigüedad');
assert.strictEqual(indice.porClave[helpers.clave('GOLD NUTRITION', 'Creatina Monohidratada 300g Pote')].fila, 4);
assert.strictEqual(indice.porClave[helpers.clave('GOLD NUTRITION', 'Creatina Monohidratada 300g Doypack')].fila, 5);
assert.strictEqual(indice.porClave[helpers.clave('STAR NUTRITION', 'Creatina Monohidratada 300g Doypack')].fila, 7);

function fakeSpreadsheet(stockRows, supRows = suplementos) {
  const sheets = {
    SUPLEMENTOS: { getDataRange: () => ({ getValues: () => supRows }) },
    STOCK_DETALLADO: { getDataRange: () => ({ getValues: () => stockRows }) }
  };
  return { getSheetByName: name => sheets[name] || null };
}

const exacto = helpers.validar(fakeSpreadsheet([
  ['Producto', 'Marca', 'Vencimiento', 'Stock Inicial', 'Stock Actual'],
  ['Creatina Monohidratada 300g Doypack', 'GOLD NUTRITION', '', 3, 3]
]));
assert.strictEqual(exacto.ok, true, 'La presentación exacta debe registrarse sin tocar el pote');

const ambiguo = helpers.validar(fakeSpreadsheet([
  ['Producto', 'Marca', 'Vencimiento', 'Stock Inicial', 'Stock Actual'],
  ['Creatina Monohidratada 300g', 'GOLD NUTRITION', '', 2, 2]
]));
assert.strictEqual(ambiguo.ok, false, 'Un nombre genérico debe bloquearse si existen pote y doypack');
assert(ambiguo.errores.some(e => /presentación exacta/.test(e)), 'El aviso debe pedir la presentación exacta');

const duplicados = suplementos.concat([
  ['Creatina Monohidratada 300g Doypack', 30000, '', 1, 34000, 'OTRO-SKU']
]);
const duplicado = helpers.validar(fakeSpreadsheet([
  ['Producto', 'Marca', 'Vencimiento', 'Stock Inicial', 'Stock Actual']
], duplicados));
assert.strictEqual(duplicado.ok, false, 'Dos filas del mismo producto dentro de una marca deben bloquearse');

for (const source of [routes, server]) {
  assert(source.includes('function _cajaValidarCatalogoSuplementos_'), 'La Caja debe auditar identidades antes de vender');
  assert(source.includes('coincideReferencia'), 'La Caja debe contrastar SKU con marca y nombre exactos');
  assert(source.includes('La Caja no puede mezclar productos ambiguos'), 'La Caja debe fallar de forma segura');
}
assert(exportV2.includes('está asignado a dos productos distintos'), 'La exportación V2 no debe inventar sufijos para SKU repetidos');
assert(system.includes('SKU completados/reparados'), 'El sistema debe reparar SKU compartidos entre productos distintos');

console.log('OK stock-identity.test.cjs');
