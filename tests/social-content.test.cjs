const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');

function read(name) {
  return fs.readFileSync(path.join(root, name), 'utf8');
}

test('el generador diario selecciona cinco productos publicables y variados', () => {
  const source = read('Api.gs');
  const block = source.match(/function _seleccionarProductosEstadosDiarios[\s\S]*?(?=function generarContenidoRedes\()/);
  assert.ok(block, 'No se encontraron las funciones de estados diarios');

  const products = [
    { id: 'a', nombre: 'Creatina A', marca: 'M1', categoria: 'creatina', precio_venta: 100, stock: 2, imagen_url: 'https://img/a' },
    { id: 'b', nombre: 'Whey B', marca: 'M2', categoria: 'proteina', precio_venta: 200, stock: 3, imagen_url: 'https://img/b' },
    { id: 'c', nombre: 'Pre C', marca: 'M3', categoria: 'preworkout', precio_venta: 300, stock: 4, imagen_url: 'https://img/c' },
    { id: 'd', nombre: 'Colageno D', marca: 'M4', categoria: 'colageno', precio_venta: 400, stock: 5, imagen_url: 'https://img/d' },
    { id: 'e', nombre: 'Shaker E', marca: 'M5', categoria: 'shaker', precio_venta: 500, stock: 6, imagen_url: 'https://img/e' },
    { id: 'f', nombre: 'No publicar', marca: 'M6', categoria: 'quimicos', precio_venta: 600, stock: 7, imagen_url: 'https://img/f' },
    { id: 'g', nombre: 'Sin foto', marca: 'M7', categoria: 'otros', precio_venta: 700, stock: 8, imagen_url: '' },
    { id: 'h', nombre: 'Sin stock', marca: 'M8', categoria: 'otros', precio_venta: 800, stock: 0, imagen_url: 'https://img/h' }
    ,{ id: 'i', nombre: 'Bidon I', marca: 'M9', categoria: 'accesorio', precio_venta: 900, stock: 10, imagen_url: 'https://img/i' }
    ,{ id: 'j', nombre: 'Barra J', marca: 'M10', categoria: 'barra', precio_venta: 1000, stock: 2, imagen_url: 'https://img/j' }
  ];
  const ventasRows = [
    ['Fecha', 'Producto', 'Marca', 'Cantidad'],
    [new Date('2026-08-10T12:00:00Z'), 'Creatina A', 'M1', 8],
    [new Date('2026-08-12T12:00:00Z'), 'Whey B', 'M2', 1]
  ];
  const analisisRows = [
    ['Lote / Producto', 'Marca', 'Stock Lote', 'Vencimiento', 'Días Restantes', 'Ventas Prod (30d)', 'Precio Actual', 'Puntaje Urgencia'],
    ['Colageno D [Vence: 03/09/26]', 'M4', 5, new Date('2026-09-03T12:00:00Z'), 15, 0, 400, 125],
    ['Whey B [Vence: 28/09/26]', 'M2', 3, new Date('2026-09-28T12:00:00Z'), 40, 1, 200, 405],
    ['Pre C [Vence: 17/08/26]', 'M3', 4, new Date('2026-08-17T12:00:00Z'), -2, 0, 300, -1040]
  ];
  let telegramMessage = '';
  const Utilities = {
    formatDate(date, zone, format) {
      return { yyyyMMdd: '20260819', 'yyyy-MM-dd': '2026-08-19', 'dd/MM': '19/08' }[format] || '';
    }
  };
  const run = new Function(
    'Utilities', 'getCatalogo', '_notificarTelegram', 'Logger', '_getSS', 'actualizarAnalisisOfertas',
    block[0] + '\nvar fecha = new Date("2026-08-19T12:00:00Z"); return { productos: _seleccionarProductosEstadosDiarios(5, fecha), aviso: _enviarEnlaceEstadosDiarios(fecha) };'
  );
  const sheets = {
    VentasDiarias: {
      getLastRow: () => ventasRows.length,
      getDataRange: () => ({ getValues: () => ventasRows })
    },
    ANALISIS_OFERTAS: {
      getLastRow: () => analisisRows.length,
      getDataRange: () => ({ getValues: () => analisisRows })
    }
  };
  const result = run(
    Utilities,
    () => ({ productos: products }),
    message => { telegramMessage = message; return true; },
    { log() {} },
    () => ({ getSheetByName: name => sheets[name] || null }),
    () => {}
  );

  assert.equal(result.productos.length, 5);
  assert.deepEqual(result.productos.map(p => p.id), ['d', 'b', 'i', 'e', 'j']);
  assert.ok(result.productos.every(p => p.stock > 0 && p.imagen_url && p.categoria !== 'quimicos'));
  assert.ok(!result.productos.some(p => p.id === 'c'), 'No debe promocionar productos vencidos');
  assert.ok(!result.productos.some(p => p.id === 'a'), 'Debe postergar el producto con más ventas');
  assert.match(result.aviso.enlace, /promo\.html\?modo=diario/);
  assert.match(telegramMessage, /5 ESTADOS LISTOS/);
  assert.match(telegramMessage, /vence en 15 días/);
  assert.match(telegramMessage, /sin ventas en 30 días/);
});

test('las fichas automáticas generan textos específicos y cinco puntos editables', () => {
  const source = read('FichasPublicaciones.gs');
  const block = source.match(/[\s\S]*?(?=function _leerFichasPublicaciones\()/);
  assert.ok(block, 'No se encontraron las reglas de fichas de publicación');
  const run = new Function(block[0] + `
    return {
      whey: _fichaPublicacionBase({ nombre: 'Whey Protein Isolate 2 Lb', marca: 'MAXUP', categoria: 'proteina' }),
      glutamina: _fichaPublicacionBase({ nombre: 'L-Glutamina 300g', marca: 'MAXUP', categoria: 'aminoacido' })
    };
  `);
  const result = run();
  assert.equal(result.whey.beneficios.length, 5);
  assert.equal(result.glutamina.beneficios.length, 5);
  assert.match(result.whey.queEs, /Proteína aislada/);
  assert.match(result.whey.beneficios.join(' '), /reparar el músculo/);
  assert.match(result.glutamina.queEs, /Aminoácido/);
  assert.doesNotMatch(result.glutamina.beneficios.join(' '), /prebiótico|estreñ/i);
  assert.match(source, /FICHAS_PUBLICACIONES/);
  assert.match(source, /BORRADOR AUTOMATICO/);
});

test('Promo Express conserva el modo oferta y agrega el modo diario de cinco placas', () => {
  const html = read('promo.html');
  const script = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(script, 'No se encontro el script de Promo Express');
  assert.doesNotThrow(() => new Function(script[1]));
  assert.match(html, /dailyMode=params\.get\('modo'\)==='diario'/);
  assert.match(html, /canvas\.width=W;canvas\.height=H/);
  assert.match(html, /const W=1080,H=1920/);
  assert.match(html, /Guardar foto/);
  assert.match(html, /Compartir/);
  assert.match(html, /creatina:\[/);
  assert.match(html, /function drawDailyBenefitList/);
  assert.match(html, /dailyBenefits\(p\)\.slice\(0,5\)/);
  assert.match(html, /const DAILY_EXPLAINERS=/);
  assert.match(html, /5 PUNTOS CLAVE/);
  assert.match(html, /pubDesc:pr\.descripcion_publicacion/);
  assert.match(html, /pubBenefits:Array\.isArray\(pr\.beneficios_publicacion\)/);
  assert.match(html, /PEDILO EN NUESTRA WEB/);
  assert.doesNotMatch(html, /solidText\(ctx,fmt\(Number\(p\.p\)/);
  assert.match(html, /async function genPost/);
});
