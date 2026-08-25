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
  const block = source.match(/var HOJA_HISTORIAL_PUBLICACIONES[\s\S]*?(?=function generarContenidoRedes\()/);
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
    ,{ id: 'k', nombre: 'Guantes K', marca: 'M11', categoria: 'accesorio', precio_venta: 1100, stock: 12, imagen_url: 'https://img/k' }
    ,{ id: 'l', nombre: 'Magnesio L', marca: 'M12', categoria: 'mineral', precio_venta: 1200, stock: 4, imagen_url: 'https://img/l' }
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
  const makeHistorySheet = () => ({
    rows: [['Tipo', 'Clave producto', 'Firma publicación', 'Fecha', 'Producto']],
    getLastRow() { return this.rows.length; },
    getRange(row, column, numRows) {
      return {
        getValues: () => this.rows.slice(row - 1, row - 1 + numRows),
        setValues: values => { this.rows.push(...values); return this; },
        setFontWeight: () => this
      };
    },
    hideSheet() {}
  });
  const ss = {
    getSheetByName: name => sheets[name] || null,
    insertSheet: name => { sheets[name] = makeHistorySheet(); return sheets[name]; }
  };
  const result = run(
    Utilities,
    () => ({ productos: products }),
    message => { telegramMessage = message; return true; },
    { log() {} },
    () => ss,
    () => {}
  );

  assert.equal(result.productos.length, 5);
  assert.deepEqual(result.productos.map(p => p.id), ['k', 'i', 'e', 'l', 'j']);
  assert.ok(result.productos.every(p => p.stock > 0 && p.imagen_url && p.categoria !== 'quimicos'));
  assert.ok(!result.productos.some(p => p.id === 'c'), 'No debe promocionar productos vencidos');
  assert.ok(!result.productos.some(p => p.id === 'a'), 'Debe postergar el producto con más ventas');
  assert.ok(!result.productos.some(p => p.id === 'b' || p.id === 'd'), 'No debe repetir urgentes ya publicados antes de instalar la rotación');
  assert.match(result.aviso.enlace, /promo\.html\?modo=diario/);
  assert.match(telegramMessage, /5 ESTADOS LISTOS/);
  assert.match(telegramMessage, /sin ventas en 30 días/);
});

test('un producto próximo a vencer reaparece únicamente cuando cambia el descuento', () => {
  const source = read('Api.gs');
  const block = source.match(/var HOJA_HISTORIAL_PUBLICACIONES[\s\S]*?(?=function generarContenidoRedes\()/);
  assert.ok(block, 'No se encontraron las funciones de rotación diaria');

  const products = [
    { id: 'w', nombre: 'Whey Star', marca: 'Star', categoria: 'proteina', precio_venta: 100, stock: 5, imagen_url: 'https://img/w' },
    { id: 'a', nombre: 'Creatina A', marca: 'M1', categoria: 'creatina', precio_venta: 100, stock: 4, imagen_url: 'https://img/a' },
    { id: 'b', nombre: 'Shaker B', marca: 'M2', categoria: 'accesorio', precio_venta: 100, stock: 3, imagen_url: 'https://img/b' },
    { id: 'c', nombre: 'Barra C', marca: 'M3', categoria: 'barra', precio_venta: 100, stock: 2, imagen_url: 'https://img/c' },
    { id: 'd', nombre: 'Magnesio D', marca: 'M4', categoria: 'mineral', precio_venta: 100, stock: 1, imagen_url: 'https://img/d' },
    { id: 'e', nombre: 'Bidon E', marca: 'M5', categoria: 'accesorio', precio_venta: 100, stock: 1, imagen_url: 'https://img/e' }
  ];
  const historyRows = [
    ['Tipo', 'Clave producto', 'Firma publicación', 'Fecha', 'Producto'],
    ['ESTADO', 'star||whey star', 'URGENCIA-10', new Date('2026-08-01T12:00:00Z'), 'Whey Star']
  ];
  const historySheet = {
    getLastRow: () => historyRows.length,
    getRange(row, column, numRows) {
      return {
        getValues: () => historyRows.slice(row - 1, row - 1 + numRows),
        setValues: values => { historyRows.push(...values); },
        setFontWeight() {}
      };
    },
    hideSheet() {}
  };
  const analisisRows = [
    ['Lote / Producto', 'Marca', 'Stock Lote', 'Vencimiento', 'Días Restantes'],
    ['Whey Star [Vence: 10/09/26]', 'Star', 5, new Date('2026-09-10T12:00:00Z'), 29]
  ];
  const sheets = {
    _HISTORIAL_PUBLICACIONES: historySheet,
    VentasDiarias: { getLastRow: () => 1, getDataRange: () => ({ getValues: () => [] }) },
    ANALISIS_OFERTAS: { getLastRow: () => analisisRows.length, getDataRange: () => ({ getValues: () => analisisRows }) }
  };
  const Utilities = { formatDate: (date, zone, format) => ({ yyyyMMdd: '20260819', 'yyyy-MM-dd': '2026-08-19', 'dd/MM': '19/08' }[format] || '') };
  const run = new Function(
    'Utilities', 'getCatalogo', '_notificarTelegram', 'Logger', '_getSS', 'actualizarAnalisisOfertas',
    block[0] + '\nvar fecha = new Date("2026-08-19T12:00:00Z"); return _enviarEnlaceEstadosDiarios(fecha);'
  );
  let message = '';
  const result = run(
    Utilities,
    () => ({ productos: products }),
    value => { message = value; return true; },
    { log() {} },
    () => ({ getSheetByName: name => sheets[name] || null }),
    () => {}
  );

  assert.equal(result.productos[0].id, 'w', 'Debe volver a elegir el producto al pasar de 10% a 15%');
  assert.match(message, /Whey Star -15%/);
  assert.match(message, /desc=15/);
});

test('las fichas automáticas generan textos específicos y cinco puntos editables', () => {
  const source = read('FichasPublicaciones.gs');
  const block = source.match(/[\s\S]*?(?=function _leerFichasPublicaciones\()/);
  assert.ok(block, 'No se encontraron las reglas de fichas de publicación');
  const run = new Function(block[0] + `
    return {
      whey: _fichaPublicacionBase({ nombre: 'Whey Protein Isolate 2 Lb', marca: 'MAXUP', categoria: 'proteina' }),
      glutamina: _fichaPublicacionBase({ nombre: 'L-Glutamina 300g', marca: 'MAXUP', categoria: 'aminoacido' }),
      bcaa: _fichaPublicacionBase({ nombre: 'BCAA 2:1:1', marca: 'MAXUP', categoria: 'aminoacido' }),
      eaa: _fichaPublicacionBase({ nombre: "EAA's Aminoácidos", marca: 'ENA', categoria: 'aminoacido' }),
      beta: _fichaPublicacionBase({ nombre: 'Beta Alanina 300g', marca: 'MAXUP', categoria: 'aminoacido' }),
      arginina: _fichaPublicacionBase({ nombre: 'L-Arginina 150g', marca: 'MAXUP', categoria: 'aminoacido' }),
      citrato: _fichaPublicacionBase({ nombre: 'Citrato de Magnesio 144G', marca: 'GRANGER', categoria: 'vitamin' }),
      bisglicinato: _fichaPublicacionBase({ nombre: 'Bisglicinato de Magnesio 60Comp', marca: 'LAPPIEL', categoria: 'vitamin' }),
      zma: _fichaPublicacionBase({ nombre: 'Zma X60 Cap', marca: 'GOLD NUTRITION', categoria: 'vitamin' }),
      omega369: _fichaPublicacionBase({ nombre: 'Omega 3 con omega 6 y 9', marca: 'LAPPIEL', categoria: 'vitamin' }),
      biotina: _fichaPublicacionBase({ nombre: 'Biotina con Vitamina C', marca: 'LAPPIEL', categoria: 'vitamin' }),
      pump: _fichaPublicacionBase({ nombre: 'Pump V8 X285G', marca: 'STAR NUTRITION', categoria: 'preworkout' }),
      collagenSport: _fichaPublicacionBase({ nombre: 'Collagen Sport Naranja X 360 Grs', marca: 'STAR NUTRITION', categoria: 'colageno' }),
      gel: _fichaPublicacionBase({ nombre: 'Energy Gel 42g - Limon', marca: 'NUTREMAX', categoria: 'hidratacion' }),
      recovery: _fichaPublicacionBase({ nombre: 'Recovery Drink 540G', marca: 'NUTREMAX', categoria: 'hidratacion' }),
      cla: _fichaPublicacionBase({ nombre: 'Cla 1000 90cap', marca: 'STAR NUTRITION', categoria: 'quemador' }),
      stanozolol: _fichaPublicacionBase({ nombre: 'Stanozoland 10Mg 100Comp', marca: 'LANDERLAN', categoria: 'quimicos' }),
      mamushka: _fichaPublicacionBase({ nombre: 'Botella Mamushka 3 en 1', marca: 'MAXUP', categoria: 'accesorio', descripcion: 'Accesorio práctico' }),
      licuadora: _fichaPublicacionBase({ nombre: 'Mini Licuadora Portátil', marca: 'MAXUP', categoria: 'accesorio', descripcion: 'Accesorio práctico' })
    };
  `);
  const result = run();
  assert.equal(result.whey.beneficios.length, 5);
  assert.equal(result.glutamina.beneficios.length, 5);
  assert.match(result.whey.queEs, /Proteína aislada/);
  assert.match(result.whey.beneficios.join(' '), /reparar el músculo/);
  assert.match(result.glutamina.queEs, /aminoácido/i);
  assert.match(result.glutamina.beneficios.join(' '), /no está demostrado.*prebiótico.*estreñimiento/i);
  assert.match(result.bcaa.queEs, /leucina, isoleucina y valina/i);
  assert.match(result.eaa.queEs, /aminoácidos esenciales/i);
  assert.notEqual(result.bcaa.queEs, result.eaa.queEs);
  assert.match(result.beta.queEs, /carnosina/i);
  assert.match(result.arginina.queEs, /óxido nítrico/i);
  assert.match(result.citrato.queEs, /ácido cítrico|forma soluble/i);
  assert.match(result.citrato.beneficios.join(' '), /relajación y el descanso/i);
  assert.match(result.citrato.beneficios.join(' '), /estreñimiento ocasional/i);
  assert.match(result.citrato.beneficios.join(' '), /calambres.*ingesta baja/i);
  assert.notEqual(result.citrato.queEs, result.bisglicinato.queEs);
  assert.match(result.bisglicinato.queEs, /tolerancia digestiva|forma quelada/i);
  assert.doesNotMatch(result.bisglicinato.beneficios.join(' '), /estreñimiento/i);
  assert.match(result.zma.beneficios.join(' '), /no está demostrado que aumente testosterona/i);
  assert.match(result.omega369.beneficios.join(' '), /no equivale a un omega 3 concentrado/i);
  assert.match(result.biotina.beneficios.join(' '), /evidencia.*limitada|análisis/i);
  assert.match(result.pump.queEs, /cafeína y guaraná.*beta-alanina/i);
  assert.match(result.collagenSport.queEs, /200 mg de cafeína/i);
  assert.match(result.gel.queEs, /no aportan cafeína/i);
  assert.match(result.recovery.queEs, /carbohidratos, whey, electrolitos/i);
  assert.match(result.cla.queEs + ' ' + result.cla.beneficios.join(' '), /efectos promedio pequeños e inconsistentes/i);
  assert.match(result.stanozolol.queEs, /esteroide anabólico/i);
  assert.match(result.stanozolol.beneficios.join(' '), /daño hepático|prohibido/i);
  assert.match(result.mamushka.queEs, /tres recipientes|uno dentro de otro/i);
  assert.match(result.mamushka.beneficios.join(' '), /encastran/i);
  assert.match(result.licuadora.queEs, /motor integrado/i);
  assert.notEqual(result.mamushka.queEs, result.licuadora.queEs);
  assert.doesNotMatch(result.mamushka.queEs, /Accesorio práctico/);
  assert.match(source, /FICHAS_PUBLICACIONES/);
  assert.match(source, /BORRADOR AUTOMATICO/);
  assert.match(source, /actualizadasAutomaticas/);
  assert.match(source, /_normalizarTextoFicha\(ficha\.estado\) === 'revisado'/);
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
  assert.match(html, /Math\.max\(35,Math\.min\(40/);
  assert.match(html, /benefitY\+86,W-190,41/);
  assert.match(html, /const DAILY_EXPLAINERS=/);
  assert.match(html, /5 PUNTOS CLAVE/);
  assert.match(html, /pubDesc:pr\.descripcion_publicacion/);
  assert.match(html, /pubBenefits:Array\.isArray\(pr\.beneficios_publicacion\)/);
  assert.match(html, /PEDILO EN NUESTRA WEB/);
  assert.doesNotMatch(html, /solidText\(ctx,fmt\(Number\(p\.p\)/);
  assert.match(html, /async function genPost/);
});
