const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

assert.match(app, /_cargarCatalogoRapido_\(\)/,
  'la tienda debe recuperar el último catálogo válido antes de consultar Sheets');
assert.match(app, /PRODUCTS_ESTATICO\.forEach\(function\(p\)\{ PRODUCTS\.push\(p\); \}\)/,
  'la primera visita debe tener una vista inmediata mientras se valida el stock');
assert.match(app, /let visibles = PRODUCTS\.filter/,
  'los filtros deben trabajar sobre los datos aunque todavía no existan tarjetas en pantalla');
assert.match(app, /paginaVisible\.map\(function\(p, i\)\{ return buildCard\(p, i\); \}\)/,
  'solo deben dibujarse los productos de la página visible');
assert.match(app, /Buscando coincidencias en el catálogo actualizado/,
  'un filtro temprano no debe mostrar falsamente que no hay resultados');

const llamadasLiquidaciones = app.match(/cargarLiquidaciones\(\);/g) || [];
assert.equal(llamadasLiquidaciones.length, 2,
  'debe existir una carga automática posterior al catálogo y otra al abrir la sección manualmente');
assert.match(app, /renderAll\(\);[\s\S]{0,500}cargarLiquidaciones\(\);/,
  'las ofertas automáticas deben esperar a que el catálogo principal ya esté visible');

assert.match(index, /<option value="12">VER 12 POR PÁGINA<\/option>/,
  'la primera vista debe limitarse a doce productos');
assert.match(app, /let ITEMS_POR_PAGINA = 12/,
  'la tienda debe dibujar una primera tanda similar a la portada rápida de referencia');
assert.match(app, /cardIndex<4\?'eager':'lazy'/,
  'solo las primeras imágenes visibles deben competir por la red');

const version = '20261116-liquidaciones';
assert.match(index, new RegExp(`app\\.js\\?v=${version}`));
assert.match(sw, new RegExp(`app\\.js\\?v=${version}`));
assert.match(sw, /return cached \|\| actualizacion/,
  'los recursos versionados deben abrir desde cache sin esperar a la red');

console.log('Carga rápida y filtros tempranos: OK');
