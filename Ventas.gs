// ============================================================
//  MAXUP SUPLEMENTOS — Sistema de Ventas y Clientes
//  Versión limpia con:
//  - Meses como "Abr 2026", "Mar 2026", etc.
//  - Nueva columna automática cada mes nuevo
//  - Clientes sin fondo oscuro (color por defecto)
//  - Múltiples clientes por venta
//  - Promo 3 meses >= $40.000 → 10% descuento mes 4
//  - Descuento STOCK_DETALLADO por FIFO (vencimiento más próximo)
// ============================================================

// ── CONSTANTES ──────────────────────────────────────────────
const PROMO_MINIMO    = 40000;
const PROMO_MESES     = 3;
const PROMO_DESCUENTO = 0.10;

const NOMBRES_MESES = [
  'Ene','Feb','Mar','Abr','May','Jun',
  'Jul','Ago','Sep','Oct','Nov','Dic'
];

// ── MENÚ ────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🛒 MAXUP')
    .addItem('Registrar Venta (formulario)', 'abrirFormularioVenta')
    .addItem('Nuevo Cliente', 'abrirFormularioCliente')
    .addItem('Resumen del Día', 'mostrarResumenDia')
    .addItem('Ver clientes con descuento', 'verClientesConDescuento')
    .addItem('🔄 Recuperar compras clientes desde VentasDiarias', 'recuperarComprasClientes')
    .addItem('📅 Ordenar columnas de meses en CLIENTES', 'ordenarColumnasClientes')
    .addItem('🔍 Chequear nombres SUPLEMENTOS vs STOCK_DETALLADO', 'chequearNombresStock')
    .addItem('🔧 Unificar nombres (copia de SUPLEMENTOS a STOCK_DETALLADO)', 'unificarNombresStock')
    .addItem('🔄 Actualizar stock principal desde lotes', 'actualizarStockPrincipalManual')
    .addItem('🔎 Conciliar stock (qué falta cargar en STOCK_DETALLADO)', 'conciliarStock')
    .addItem('✅ Aplicar stock real (desde CONCILIACION_STOCK)', 'aplicarStockReal')
    .addItem('🆕 Crear en SUPLEMENTOS los productos nuevos de STOCK_DETALLADO', 'crearProductosFaltantes')
    .addItem('🔁 Reiniciar Nuevos Ingresos (carrusel)', 'reiniciarNuevosIngresos')
    .addItem('🔤 Detectar nombres repetidos entre marcas', 'detectarNombresDuplicados')
    .addToUi();
}

// ── HELPER: header del mes actual ───────────────────────────
function _getMesHeader(fecha) {
  const d = fecha || new Date();
  return NOMBRES_MESES[d.getMonth()] + ' ' + d.getFullYear();
}

// ── HELPER: insertar fila ANTES del TOTAL del día ────────────
function _insertarFilaVenta(hojaVD, fila, fechaStr) {
  var rows = hojaVD.getDataRange().getValues();
  var totalLabel = 'TOTAL ' + fechaStr;
  var idxTotal = -1;
  for (var r = 0; r < rows.length; r++) {
    if (String(rows[r][0]).startsWith(totalLabel)) { idxTotal = r; break; }
  }

  if (idxTotal !== -1) {
    // Insertar una fila nueva JUSTO ANTES del TOTAL
    var filaTotal = idxTotal + 1; // fila en Sheets (1-based)
    hojaVD.insertRowBefore(filaTotal);
    // Escribir la venta en la fila recién insertada
    var rangoVenta = hojaVD.getRange(filaTotal, 1, 1, 9);
    rangoVenta.setValues([fila]);
    rangoVenta.setBackground('#ffffff')
      .setFontColor('#000000')
      .setFontWeight('normal')
      .setFontStyle('normal')
      .setFontSize(10)
      .setBorder(false, false, false, false, false, false);
  } else {
    // No existe TOTAL aún — simplemente agregar al final
    hojaVD.appendRow(fila);
    var filaNueva = hojaVD.getLastRow();
    hojaVD.getRange(filaNueva, 1, 1, 9)
      .setBackground('#ffffff')
      .setFontColor('#000000')
      .setFontWeight('normal')
      .setFontStyle('normal')
      .setFontSize(10);
  }
}

// ── Descontar stock de STOCK_DETALLADO por FIFO ─────
// Versión individual (usada por procesarVenta del formulario)
function _descontarStockDetallado(nombreProducto, cantidad) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = ss.getSheetByName('STOCK_DETALLADO');
    if (!hoja) return;
    var datos = hoja.getDataRange().getValues();
    _descontarStockDetalladoBatch(hoja, datos, nombreProducto, cantidad);
  } catch(e) {
    Logger.log('Error _descontarStockDetallado: ' + e.message);
  }
}

// Helper: normalizar nombre para comparación flexible
// IMPORTANTE: debe coincidir con _normNombreSD de Api.gs (saca tildes y guiones),
// porque la web descuenta STOCK_DETALLADO con esa función. Si difieren, una venta
// por el Sheets no descuenta el lote y la web sigue mostrando stock de más.
function _normalizarNombre(n) {
  return String(n || '').trim().toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n')  // sacar tildes/ñ
    .replace(/[.,;:!¡¿?'"()[\]{}]/g, '')  // quitar puntuación
    .replace(/[-_]+/g, ' ')                // guiones/_ → espacio
    .replace(/\s+/g, ' ')                  // espacios múltiples → uno
    .replace(/x\s*(\d)/g, 'x$1')           // "x 300" → "x300"
    .replace(/(\d)\s*,\s*(\d)/g, '$1.$2')  // "1,5" → "1.5"
    .replace(/\s*(kilos?|kgs)\b/gi, 'kg')   // "Kilos"/"Kgs" → "kg"
    .replace(/\s*(gramos?|grs?)\b/gi, 'g')  // "Gramos"/"Gr"/"Grs" → "g"
    .replace(/\s*(litros?|lts?)\b/gi, 'l')  // "Litros"/"Lt"/"Lts" → "l"
    .replace(/\s*(libras?|lbs?)\b/gi, 'lb') // "Libras"/"Lb"/"Lbs" → "lb"
    .trim();
}

// Detecta un encabezado de MARCA: la celda escrita TODA EN MAYÚSCULA.
// Los productos siempre llevan alguna minúscula, así que nunca se confunden
// (incluso un producto nuevo con precio 0). Debe tener al menos una letra.
function _esEncabezadoMarca(valor) {
  var s = String(valor || '').trim();
  if (!s) return false;
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(s)) return false; // sin letras (solo números) no es marca
  return s === s.toUpperCase();
}

// Versión batch: recibe hoja y datos ya leídos, evita re-leer
function _descontarStockDetalladoBatch(hoja, datos, nombreProducto, cantidad) {
  var nombreBuscar = _normalizarNombre(nombreProducto);
  if (!nombreBuscar || cantidad <= 0) return;

  var lotes = [];
  for (var i = 1; i < datos.length; i++) {
    var nombreFila = _normalizarNombre(datos[i][0]);
    if (nombreFila !== nombreBuscar) continue;
    var stockActual = Number(datos[i][4]) || 0;
    if (stockActual <= 0) continue;
    lotes.push({ fila: i + 1, idx: i, stock: stockActual, venc: datos[i][2] });
  }

  lotes.sort(function(a, b) {
    var da = a.venc instanceof Date ? a.venc : new Date(a.venc);
    var db = b.venc instanceof Date ? b.venc : new Date(b.venc);
    return da - db;
  });

  var restante = cantidad;
  for (var j = 0; j < lotes.length && restante > 0; j++) {
    var lote = lotes[j];
    var descontar = Math.min(restante, lote.stock);
    var nuevoStock = lote.stock - descontar;
    hoja.getRange(lote.fila, 5).setValue(nuevoStock);
    datos[lote.idx][4] = nuevoStock;
    restante -= descontar;
  }
}

// Separa una celda tipo "1;2" / "1 2" / "25;256" en una lista, para poder
// vender el MISMO producto a VARIOS clientes en una sola fila.
// Acepta como separador: punto y coma, coma, barra, pipe, + o espacios.
// RECOMENDADO usar punto y coma (";") porque la planilla nunca lo confunde
// con un número decimal. (Ojo: "1,2" sin espacio la planilla lo toma como
// el decimal 1,2; por eso conviene ";" o un espacio.)
function _parseListaVenta(val) {
  if (val === null || val === undefined) return [];
  var s = String(val).trim();
  if (s === '') return [];
  return s.split(/[\s,;/|+]+/).filter(function(x){ return x !== ''; });
}

// ══════════════════════════════════════════════════════════
// CHEQUEAR NOMBRES: SUPLEMENTOS vs STOCK_DETALLADO
// Recorre ambas hojas y reporta qué productos NO coinciden, para
// detectar el stock fantasma (venta que no descuenta el lote).
// Escribe el resultado en una hoja "CHEQUEO_NOMBRES".
//   ❌ SIN LOTE     → el producto no existe en STOCK_DETALLADO ni
//                     normalizado → una venta NO descuenta nada de ahí.
//   ⚠️ TEXTO DISTINTO → coinciden normalizados (ya descuenta bien con el
//                     fix) pero el texto exacto difiere por tilde/guion/
//                     mayúscula → conviene unificarlos para evitar líos.
// ══════════════════════════════════════════════════════════
function chequearNombresStock() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');
  var hojaSD  = ss.getSheetByName('STOCK_DETALLADO');

  if (!hojaSup || !hojaSD) {
    SpreadsheetApp.getUi().alert('❌ No se encontró SUPLEMENTOS o STOCK_DETALLADO.');
    return;
  }

  var datosSup = hojaSup.getDataRange().getValues();
  var datosSD  = hojaSD.getDataRange().getValues();

  // Mapa de STOCK_DETALLADO: nombre normalizado → { nombres crudos vistos, stock total }
  var mapaSD = {};
  for (var i = 1; i < datosSD.length; i++) {
    var crudoSD = String(datosSD[i][0] || '').trim();
    if (!crudoSD) continue;
    var normSD = _normalizarNombre(crudoSD);
    if (!mapaSD[normSD]) mapaSD[normSD] = { nombres: {}, stock: 0 };
    mapaSD[normSD].nombres[crudoSD] = true;
    mapaSD[normSD].stock += Number(datosSD[i][4]) || 0;
  }

  // Recorrer SUPLEMENTOS (solo productos reales: con precio en col B)
  var sinLote = [];      // ❌ no existe en STOCK_DETALLADO
  var textoDistinto = []; // ⚠️ matchea normalizado pero texto difiere

  for (var j = 0; j < datosSup.length; j++) {
    var crudoSup = String(datosSup[j][0] || '').trim();
    var precio   = Number(datosSup[j][1]) || 0;
    if (!crudoSup || precio <= 0) continue; // saltar marcas y vacíos

    var normSup = _normalizarNombre(crudoSup);
    var entrada = mapaSD[normSup];

    if (!entrada) {
      sinLote.push(crudoSup);
      continue;
    }

    // Existe el match normalizado. ¿El texto crudo es idéntico?
    var nombresSD = Object.keys(entrada.nombres);
    var hayIdentico = nombresSD.indexOf(crudoSup) >= 0;
    if (!hayIdentico) {
      textoDistinto.push({
        sup: crudoSup,
        sd: nombresSD.join('  |  '),
        stock: entrada.stock
      });
    }
  }

  // ── Escribir resultado en hoja CHEQUEO_NOMBRES ──
  var hojaR = ss.getSheetByName('CHEQUEO_NOMBRES');
  if (!hojaR) hojaR = ss.insertSheet('CHEQUEO_NOMBRES');
  hojaR.clear();

  var filas = [];
  filas.push(['TIPO', 'Nombre en SUPLEMENTOS', 'Nombre(s) en STOCK_DETALLADO', 'Stock en STOCK_DETALLADO', 'Qué hacer']);

  textoDistinto.forEach(function(t) {
    filas.push(['⚠️ TEXTO DISTINTO', t.sup, t.sd, t.stock,
      'Unificar: escribir el MISMO texto en ambas hojas (misma tilde/guion/mayúscula)']);
  });
  sinLote.forEach(function(n) {
    filas.push(['❌ SIN LOTE', n, '(no existe)', '-',
      'No tiene lote en STOCK_DETALLADO: una venta no descuenta de ahí. Crear el lote o revisar el nombre.']);
  });

  if (filas.length === 1) {
    filas.push(['✅ TODO OK', 'Todos los productos coinciden entre ambas hojas', '', '', '']);
  }

  hojaR.getRange(1, 1, filas.length, 5).setValues(filas);
  hojaR.getRange(1, 1, 1, 5)
    .setBackground('#1a1a2e').setFontColor('#00C8FF').setFontWeight('bold');
  hojaR.setColumnWidth(1, 140);
  hojaR.setColumnWidth(2, 280);
  hojaR.setColumnWidth(3, 320);
  hojaR.setColumnWidth(4, 90);
  hojaR.setColumnWidth(5, 380);
  hojaR.setFrozenRows(1);

  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    '🔍 CHEQUEO DE NOMBRES COMPLETADO\n\n' +
    '⚠️ Texto distinto (matchean pero conviene unificar): ' + textoDistinto.length + '\n' +
    '❌ Sin lote en STOCK_DETALLADO: ' + sinLote.length + '\n\n' +
    'Mirá la hoja "CHEQUEO_NOMBRES" para ver el detalle de cada uno.'
  );
}

// ══════════════════════════════════════════════════════════
// UNIFICAR NOMBRES: copia el nombre EXACTO de SUPLEMENTOS sobre
// las filas que le corresponden en STOCK_DETALLADO (las que ya
// coinciden ignorando tildes/guiones). Deja ambas hojas idénticas.
// SUPLEMENTOS manda porque es el catálogo que ve el cliente y el
// que el código usa para separar el sabor con " - ".
// NO toca el stock (col E), solo el texto del nombre (col A).
// ══════════════════════════════════════════════════════════
function unificarNombresStock() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');
  var hojaSD  = ss.getSheetByName('STOCK_DETALLADO');

  if (!hojaSup || !hojaSD) {
    ui.alert('❌ No se encontró SUPLEMENTOS o STOCK_DETALLADO.');
    return;
  }

  var resp = ui.alert('🔧 Unificar nombres',
    'Voy a copiar el nombre EXACTO de cada producto de SUPLEMENTOS sobre ' +
    'las filas que le corresponden en STOCK_DETALLADO (las que ya coinciden ' +
    'ignorando tildes y guiones).\n\n' +
    'NO toca el stock, solo el texto del nombre. ¿Seguimos?',
    ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  var datosSup = hojaSup.getDataRange().getValues();
  var datosSD  = hojaSD.getDataRange().getValues();

  // Mapa: nombre normalizado → { nombre canónico exacto, ambiguo }
  // ambiguo = dos productos DISTINTOS de SUPLEMENTOS normalizan igual → no tocar.
  var canon = {};
  for (var j = 0; j < datosSup.length; j++) {
    var crudoSup = String(datosSup[j][0] || '').trim();
    var precio   = Number(datosSup[j][1]) || 0;
    if (!crudoSup || precio <= 0) continue; // saltar marcas y vacíos
    var norm = _normalizarNombre(crudoSup);
    if (!canon[norm]) {
      canon[norm] = { nombre: crudoSup, ambiguo: false };
    } else if (canon[norm].nombre !== crudoSup) {
      canon[norm].ambiguo = true;
    }
  }

  var cambios = 0, ambiguos = 0, sinMatch = 0;
  var ejemplos = [];
  for (var i = 1; i < datosSD.length; i++) {
    var crudoSD = String(datosSD[i][0] || '').trim();
    if (!crudoSD) continue;
    var n = _normalizarNombre(crudoSD);
    var c = canon[n];
    if (!c) { sinMatch++; continue; }
    if (c.ambiguo) { ambiguos++; continue; }
    if (c.nombre !== crudoSD) {
      hojaSD.getRange(i + 1, 1).setValue(c.nombre);
      if (ejemplos.length < 10) ejemplos.push('• "' + crudoSD + '"  →  "' + c.nombre + '"');
      cambios++;
    }
  }

  SpreadsheetApp.flush();

  ui.alert(
    '✅ UNIFICACIÓN COMPLETADA\n\n' +
    '🔧 Nombres corregidos en STOCK_DETALLADO: ' + cambios + '\n' +
    (ambiguos ? '⚠️ Saltados por ambigüedad (2 productos casi iguales): ' + ambiguos + '\n' : '') +
    (sinMatch ? '❓ Filas de STOCK_DETALLADO sin producto en SUPLEMENTOS: ' + sinMatch + '\n' : '') +
    (ejemplos.length ? '\nEjemplos de lo corregido:\n' + ejemplos.join('\n') : '') +
    '\n\nVolvé a correr el chequeo para confirmar que quedaron en 0.'
  );
}

// ══════════════════════════════════════════════════════════
// SINCRONIZAR STOCK PRINCIPAL (col D de SUPLEMENTOS) DESDE LOTES
// Llena la columna D de SUPLEMENTOS sumando los lotes de cada
// producto en STOCK_DETALLADO. Así cargás el stock UNA sola vez
// (en STOCK_DETALLADO, con su vencimiento) y la hoja principal se
// mantiene con 1 fila por producto, sin repetir vencimientos.
//   • Productos CON lote → col D = suma de sus lotes (automático).
//   • Productos SIN lote (accesorios, shakers, etc.) → NO se tocan,
//     su stock se sigue cargando a mano en col D.
// Devuelve cuántos productos actualizó. NO muestra cartel (se llama
// sola después de cada venta). Para el cartel, usar la versión Manual.
// ══════════════════════════════════════════════════════════
function actualizarStockPrincipal() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaSup = ss.getSheetByName('SUPLEMENTOS');
    var hojaSD  = ss.getSheetByName('STOCK_DETALLADO');
    if (!hojaSup || !hojaSD) return 0;

    // Sumar stock por nombre normalizado en STOCK_DETALLADO
    var datosSD = hojaSD.getDataRange().getValues();
    var sumas = {}; // norm -> total
    for (var i = 1; i < datosSD.length; i++) {
      var nom = String(datosSD[i][0] || '').trim();
      if (!nom) continue;
      var norm = _normalizarNombre(nom);
      if (!(norm in sumas)) sumas[norm] = 0;
      sumas[norm] += Number(datosSD[i][4]) || 0;
    }

    // Volcar la suma en la col D de los productos que tienen lote
    var datosSup = hojaSup.getDataRange().getValues();
    var cambios = 0;
    for (var j = 0; j < datosSup.length; j++) {
      var nombre = String(datosSup[j][0] || '').trim();
      var precio = Number(datosSup[j][1]) || 0;
      if (!nombre || precio <= 0) continue;   // saltar marcas/secciones
      var n = _normalizarNombre(nombre);
      if (!(n in sumas)) continue;            // sin lote → no tocar (accesorios)
      var nuevo  = sumas[n];
      var actual = Number(datosSup[j][3]) || 0;
      if (actual !== nuevo) {
        hojaSup.getRange(j + 1, 4).setValue(nuevo);
        cambios++;
      }
    }
    return cambios;
  } catch(e) {
    Logger.log('Error actualizarStockPrincipal: ' + e.message);
    return 0;
  }
}

// Versión con cartel, para el botón del menú (cargás mercadería nueva
// en STOCK_DETALLADO y apretás esto para reflejarla en la hoja principal).
function actualizarStockPrincipalManual() {
  var cambios = actualizarStockPrincipal();
  SpreadsheetApp.getUi().alert(
    '🔄 STOCK PRINCIPAL ACTUALIZADO\n\n' +
    'Productos actualizados en la columna D de SUPLEMENTOS: ' + cambios + '\n' +
    '(sumando sus lotes de STOCK_DETALLADO).\n\n' +
    'Los productos sin lote (accesorios, shakers, etc.) no se tocan: ' +
    'su stock se sigue cargando a mano en la columna D.'
  );
}

// ══════════════════════════════════════════════════════════
// CONCILIAR STOCK: SUPLEMENTOS ↔ STOCK_DETALLADO
// Compara, producto por producto, el stock de la col D de SUPLEMENTOS
// contra la suma de sus lotes en STOCK_DETALLADO, y reporta qué hay
// que cargar para que las dos hojas estén completas. Escribe la hoja
// "CONCILIACION_STOCK".
//   ⚠️ NO COINCIDE → está en las dos pero los números difieren.
//   ❌ FALTA LOTE  → tiene stock en SUPLEMENTOS pero ningún lote en
//                    STOCK_DETALLADO (buscar en el local y cargarlo
//                    con su vencimiento). Los accesorios que no se
//                    vencen también aparecen acá: esos se ignoran.
// ══════════════════════════════════════════════════════════
function conciliarStock() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');
  var hojaSD  = ss.getSheetByName('STOCK_DETALLADO');
  if (!hojaSup || !hojaSD) {
    ui.alert('❌ No se encontró SUPLEMENTOS o STOCK_DETALLADO.');
    return;
  }

  // Sumar lotes por nombre normalizado (col E = Stock Actual)
  var datosSD = hojaSD.getDataRange().getValues();
  var sumas = {};
  var infoSD = {}; // norm -> { nombre, marca } para detectar lo que falta en SUPLEMENTOS
  for (var i = 1; i < datosSD.length; i++) {
    var nomSD = String(datosSD[i][0] || '').trim();
    if (!nomSD) continue;
    var nrm = _normalizarNombre(nomSD);
    if (!(nrm in sumas)) { sumas[nrm] = 0; infoSD[nrm] = { nombre: nomSD, marca: String(datosSD[i][1] || '').trim() }; }
    sumas[nrm] += Number(datosSD[i][4]) || 0;
  }

  // Recorrer SUPLEMENTOS, llevando la marca de cada sección
  var datosSup = hojaSup.getDataRange().getValues();
  var marcaActual = '';
  var faltan = [], noCoinc = [], okCount = 0;
  var supNorms = {}; // nombres normalizados que SÍ existen en SUPLEMENTOS

  for (var j = 0; j < datosSup.length; j++) {
    var nombre = String(datosSup[j][0] || '').trim();
    if (_esEncabezadoMarca(nombre)) { marcaActual = nombre; continue; }
    if (!nombre) continue;
    var n = _normalizarNombre(nombre);
    supNorms[n] = true;                          // existe en SUPLEMENTOS (con o sin precio)
    var precio = Number(datosSup[j][1]) || 0;
    if (precio <= 0) continue;                   // sin precio aún → no comparo stock
    var stockD = Number(datosSup[j][3]) || 0;
    if (!(n in sumas)) {
      if (stockD > 0) faltan.push({ nombre: nombre, marca: marcaActual, d: stockD });
    } else if (sumas[n] !== stockD) {
      noCoinc.push({ nombre: nombre, marca: marcaActual, d: stockD, lotes: sumas[n] });
    } else {
      okCount++;
    }
  }

  // Productos que están SOLO en STOCK_DETALLADO → faltan crear en SUPLEMENTOS
  var faltanEnSup = [];
  for (var key in sumas) {
    if (sumas[key] <= 0) continue;
    if (!supNorms[key]) faltanEnSup.push({ nombre: infoSD[key].nombre, marca: infoSD[key].marca, lotes: sumas[key] });
  }
  faltanEnSup.sort(function(a, b){ return (a.marca + a.nombre).localeCompare(b.marca + b.nombre); });

  // Los más desajustados primero (mayor diferencia)
  noCoinc.sort(function(a, b){ return Math.abs(b.lotes - b.d) - Math.abs(a.lotes - a.d); });
  faltan.sort(function(a, b){ return (a.marca + a.nombre).localeCompare(b.marca + b.nombre); });

  // Armar el reporte
  // Columna C = "Stock REAL": la completa el usuario (queda al lado del Producto).
  var filas = [['ESTADO', 'Producto', 'Stock REAL (poné el físico)', 'Marca', 'Stock en SUPLEMENTOS', 'Stock en lotes', 'Diferencia (lotes − princ.)', 'Qué hacer']];
  faltanEnSup.forEach(function(x){
    filas.push(['❗ FALTA EN SUPLEMENTOS', x.nombre, '', x.marca, 0, x.lotes, x.lotes,
      'Está en STOCK_DETALLADO pero NO en SUPLEMENTOS. Creá la fila del producto en SUPLEMENTOS ' +
      '(con su precio; si la marca es nueva, agregá también su encabezado de marca) y volvé a sincronizar.']);
  });
  noCoinc.forEach(function(x){
    var dif = x.lotes - x.d;
    var accion;
    if (dif < 0) {
      accion = 'En SUPLEMENTOS hay ' + (-dif) + ' MÁS que en los lotes. Si esas ' + (-dif) +
        ' existen de verdad, cargá un lote por esa diferencia con su vencimiento. Si no existen, los lotes ya están bien.';
    } else {
      accion = 'En los lotes hay ' + dif + ' MÁS que en SUPLEMENTOS (puede ser del problema viejo: ventas que ' +
        'bajaron SUPLEMENTOS pero no el lote). Contá el físico y ajustá el "Stock Actual" del lote.';
    }
    filas.push(['⚠️ NO COINCIDE', x.nombre, '', x.marca, x.d, x.lotes, dif, accion]);
  });
  faltan.forEach(function(x){
    filas.push(['❌ FALTA LOTE', x.nombre, '', x.marca, x.d, 0, -x.d,
      'Buscá las ' + x.d + ' unidades en el local y cargá el lote en STOCK_DETALLADO con su vencimiento. ' +
      'Si es un accesorio que NO se vence, ignoralo.']);
  });
  if (filas.length === 1) {
    filas.push(['✅ TODO OK', 'Todo el stock con lote coincide entre las dos hojas', '', '', '', '', '', '']);
  }

  var hojaR = ss.getSheetByName('CONCILIACION_STOCK');
  if (!hojaR) hojaR = ss.insertSheet('CONCILIACION_STOCK');
  hojaR.clear();
  hojaR.getRange(1, 1, filas.length, 8).setValues(filas);
  hojaR.getRange(1, 1, 1, 8).setBackground('#1a1a2e').setFontColor('#00C8FF').setFontWeight('bold');
  // Resaltar la columna C (Stock REAL) en verde: encabezado + celdas a completar
  hojaR.getRange(1, 3).setBackground('#0d3b0d').setFontColor('#7CFC7C').setFontWeight('bold');
  if (filas.length > 1) hojaR.getRange(2, 3, filas.length - 1, 1).setBackground('#EAFBEA');
  hojaR.setColumnWidth(1, 140);
  hojaR.setColumnWidth(2, 300);
  hojaR.setColumnWidth(3, 170);
  hojaR.setColumnWidth(4, 150);
  hojaR.setColumnWidth(5, 160);
  hojaR.setColumnWidth(6, 110);
  hojaR.setColumnWidth(7, 160);
  hojaR.setColumnWidth(8, 430);
  hojaR.setFrozenRows(1);
  SpreadsheetApp.flush();

  ui.alert(
    '🔎 CONCILIACIÓN DE STOCK\n\n' +
    '❗ Falta crear en SUPLEMENTOS (están solo en STOCK_DETALLADO): ' + faltanEnSup.length + '\n' +
    '⚠️ No coinciden (lotes ≠ SUPLEMENTOS): ' + noCoinc.length + '\n' +
    '❌ Falta lote (tienen stock pero no están en STOCK_DETALLADO): ' + faltan.length + '\n' +
    '✅ Coinciden perfecto: ' + okCount + '\n\n' +
    'Mirá la hoja "CONCILIACION_STOCK" para el detalle de cada uno.\n\n' +
    'Ojo: los accesorios que no se vencen (bolsos, llaveros, etc.) aparecen ' +
    'en "❌ Falta lote" — eso es normal, ignoralos.'
  );
}

// ══════════════════════════════════════════════════════════
// APLICAR STOCK REAL: corrige el stock desde la columna "Stock REAL"
// que el usuario completa en la hoja CONCILIACION_STOCK.
//   • real < suma de lotes → baja los lotes (el que vence ANTES primero).
//   • real > suma de lotes → avisa cuánto falta cargar como lote nuevo
//     (no lo inventa: necesita el vencimiento que solo sabe el usuario).
//   • sin lote (accesorio) → ajusta la col D de SUPLEMENTOS directo.
// Al final sincroniza la col D con los lotes ya corregidos.
// ══════════════════════════════════════════════════════════
function aplicarStockReal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var hojaR   = ss.getSheetByName('CONCILIACION_STOCK');
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');
  var hojaSD  = ss.getSheetByName('STOCK_DETALLADO');
  if (!hojaR)   { ui.alert('❌ Primero corré "🔎 Conciliar stock" para generar la hoja CONCILIACION_STOCK.'); return; }
  if (!hojaSup || !hojaSD) { ui.alert('❌ No se encontró SUPLEMENTOS o STOCK_DETALLADO.'); return; }

  // Leer los objetivos: producto (col 2) + stock real escrito (col 8)
  var datosR = hojaR.getDataRange().getValues();
  // Ubicar las columnas por su ENCABEZADO (robusto: no importa en qué posición estén)
  var header = (datosR[0] || []).map(function(h){ return String(h || '').toLowerCase(); });
  var colProd = -1, colReal = -1;
  for (var c = 0; c < header.length; c++) {
    if (colProd < 0 && header[c].indexOf('producto') >= 0)   colProd = c;
    if (colReal < 0 && header[c].indexOf('stock real') >= 0)  colReal = c;
  }
  if (colProd < 0 || colReal < 0) {
    ui.alert('❌ No encuentro las columnas "Producto" y "Stock REAL" en CONCILIACION_STOCK.\n\n' +
      'Corré primero "🔎 Conciliar stock" para regenerar la hoja con la columna verde.');
    return;
  }

  var objetivos = [];
  for (var r = 1; r < datosR.length; r++) {
    var prod = String(datosR[r][colProd] || '').trim();
    var celda = datosR[r][colReal];
    if (!prod || celda === '' || celda === null || celda === undefined) continue;
    var real = Number(celda);
    if (isNaN(real) || real < 0) continue;
    objetivos.push({ nombre: prod, real: real });
  }

  if (objetivos.length === 0) {
    ui.alert('No escribiste ningún "Stock REAL".\n\n' +
      'Poné el número físico en la columna verde "Stock REAL" (al lado del Producto) ' +
      'y volvé a apretar el botón.');
    return;
  }

  var resp = ui.alert('✅ Aplicar stock real',
    'Voy a corregir ' + objetivos.length + ' producto(s) con el "Stock REAL" que pusiste.\n\n' +
    '• Si el real es MENOR que los lotes → bajo los lotes (empezando por el que vence antes).\n' +
    '• Si el real es MAYOR → te aviso cuánto falta cargar como lote nuevo (con su vencimiento).\n' +
    '• Actualizo la columna D de SUPLEMENTOS.\n\n¿Seguimos?',
    ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  var datosSD  = hojaSD.getDataRange().getValues();
  var datosSup = hojaSup.getDataRange().getValues();
  var ajustados = 0, sinLote = 0, sinCambio = 0, faltaCargar = [], noEncontrado = [];

  objetivos.forEach(function(o) {
    var norm = _normalizarNombre(o.nombre);

    // Lotes del producto
    var lotes = [];
    for (var i = 1; i < datosSD.length; i++) {
      if (_normalizarNombre(datosSD[i][0]) !== norm) continue;
      lotes.push({ fila: i + 1, venc: datosSD[i][2], stock: Number(datosSD[i][4]) || 0 });
    }
    // Fila del producto en SUPLEMENTOS
    var supFila = -1;
    for (var j = 0; j < datosSup.length; j++) {
      if (_esEncabezadoMarca(datosSup[j][0])) continue;
      if (_normalizarNombre(datosSup[j][0]) === norm) { supFila = j + 1; break; }
    }

    if (lotes.length === 0) {
      // Sin lote (accesorio o perecedero sin cargar) → ajusto la col D directo
      if (supFila > 0) { hojaSup.getRange(supFila, 4).setValue(o.real); sinLote++; }
      else noEncontrado.push(o.nombre);
      return;
    }

    var totalLote = lotes.reduce(function(s, l){ return s + l.stock; }, 0);
    if (o.real === totalLote) { sinCambio++; return; }
    if (o.real > totalLote) { faltaCargar.push({ nombre: o.nombre, faltan: o.real - totalLote }); return; }

    // real < totalLote → bajar lotes (vence antes primero)
    lotes.sort(function(a, b) {
      var da = a.venc instanceof Date ? a.venc : new Date(a.venc);
      var db = b.venc instanceof Date ? b.venc : new Date(b.venc);
      return da - db;
    });
    var quitar = totalLote - o.real;
    for (var k = 0; k < lotes.length && quitar > 0; k++) {
      var baja = Math.min(quitar, lotes[k].stock);
      hojaSD.getRange(lotes[k].fila, 5).setValue(lotes[k].stock - baja);
      quitar -= baja;
    }
    ajustados++;
  });

  SpreadsheetApp.flush();
  actualizarStockPrincipal(); // sincroniza la col D con los lotes ya corregidos

  var msg = '✅ STOCK REAL APLICADO\n\n' +
    '🔧 Productos con lotes ajustados: ' + ajustados + '\n' +
    (sinLote   ? '📦 Sin lote, ajusté la col D directo: ' + sinLote + '\n' : '') +
    (sinCambio ? '✔️ Ya coincidían (sin cambios): ' + sinCambio + '\n' : '');
  if (faltaCargar.length) {
    msg += '\n⚠️ Faltan cargar como LOTE NUEVO (con su vencimiento):\n';
    faltaCargar.slice(0, 15).forEach(function(f){ msg += '  • ' + f.nombre + ': +' + f.faltan + '\n'; });
    if (faltaCargar.length > 15) msg += '  ... y ' + (faltaCargar.length - 15) + ' más\n';
  }
  if (noEncontrado.length) {
    msg += '\n❓ No encontré (ni en SUPLEMENTOS ni en lotes): ' + noEncontrado.slice(0, 10).join(', ');
  }
  msg += '\n\nCorré "🔎 Conciliar stock" de nuevo para confirmar que quedó todo en ✅.';
  ui.alert(msg);
}

// ══════════════════════════════════════════════════════════
// CREAR EN SUPLEMENTOS LOS PRODUCTOS NUEVOS DE STOCK_DETALLADO
// Para los productos que cargaste en STOCK_DETALLADO y todavía no
// existen en SUPLEMENTOS: los crea bajo su marca (o crea la marca
// nueva con su formato: fondo #1a1a2e, letra #00C8FF, MAYÚSCULAS),
// con el stock cargado y el PRECIO en 0 resaltado en rojo para que
// solo completes el precio. NO borra ni cambia nada existente.
// ══════════════════════════════════════════════════════════
function crearProductosFaltantes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');
  var hojaSD  = ss.getSheetByName('STOCK_DETALLADO');
  if (!hojaSup || !hojaSD) { ui.alert('❌ No se encontró SUPLEMENTOS o STOCK_DETALLADO.'); return; }

  // 1) Productos de STOCK_DETALLADO: suma de stock + nombre + marca
  var datosSD = hojaSD.getDataRange().getValues();
  var sumas = {}, infoSD = {};
  for (var i = 1; i < datosSD.length; i++) {
    var nomSD = String(datosSD[i][0] || '').trim();
    if (!nomSD) continue;
    var nrm = _normalizarNombre(nomSD);
    if (!(nrm in sumas)) { sumas[nrm] = 0; infoSD[nrm] = { nombre: nomSD, marca: String(datosSD[i][1] || '').trim() }; }
    sumas[nrm] += Number(datosSD[i][4]) || 0;
  }

  // 2) Recorrer SUPLEMENTOS: productos existentes + estructura de marcas
  var datosSup = hojaSup.getDataRange().getValues();
  var supNorms = {};
  var marcas = {};       // marcaNorm -> { headerRow, lastContentRow, raw }
  var listaMarcas = [];
  var curMarca = null;

  var ultimaFilaConNombre = 0; // última fila REAL con producto/marca en col A
  for (var j = 0; j < datosSup.length; j++) {
    var nm = String(datosSup[j][0] || '').trim();
    var fila = j + 1;
    if (_esEncabezadoMarca(nm)) {                     // encabezado de marca
      var mk = _normalizarNombre(nm);
      marcas[mk] = { headerRow: fila, lastContentRow: fila, raw: nm };
      listaMarcas.push(mk);
      curMarca = mk;
      ultimaFilaConNombre = fila;
      continue;
    }
    if (!nm) continue;
    supNorms[_normalizarNombre(nm)] = true;            // producto ya existe (con o sin precio)
    if (curMarca && marcas[curMarca]) marcas[curMarca].lastContentRow = fila;
    ultimaFilaConNombre = fila;
  }

  // Buscar la marca destino: match exacto o por primera palabra ("Star" → "STAR NUTRITION")
  function primeraPal(s){ return (_normalizarNombre(s).split(' ')[0]) || ''; }
  function buscarMarca(marcaStock){
    var mn = _normalizarNombre(marcaStock);
    if (!mn) return null;
    if (marcas[mn]) return mn;
    var pw = primeraPal(marcaStock);
    if (pw.length >= 3) {
      for (var x = 0; x < listaMarcas.length; x++) {
        if (primeraPal(marcas[listaMarcas[x]].raw) === pw) return listaMarcas[x];
      }
    }
    return null;
  }

  // 3) Agrupar faltantes por destino
  var enExistente = {}, enNueva = {}, sinMarca = [], totalNuevos = 0;
  for (var key in sumas) {
    if (sumas[key] <= 0 || supNorms[key]) continue;
    var nombreP = infoSD[key].nombre, marcaP = infoSD[key].marca, st = sumas[key];
    if (!marcaP) { sinMarca.push(nombreP); continue; }
    var destino = buscarMarca(marcaP);
    if (destino) {
      if (!enExistente[destino]) enExistente[destino] = [];
      enExistente[destino].push({ nombre: nombreP, stock: st });
    } else {
      var mu = marcaP.toUpperCase();
      if (!enNueva[mu]) enNueva[mu] = [];
      enNueva[mu].push({ nombre: nombreP, stock: st });
    }
    totalNuevos++;
  }

  if (totalNuevos === 0) {
    ui.alert('✅ No hay productos nuevos para crear.\n\nTodo lo de STOCK_DETALLADO ya existe en SUPLEMENTOS.' +
      (sinMarca.length ? '\n\n⚠️ ' + sinMarca.length + ' producto(s) sin marca en STOCK_DETALLADO: cargales la marca.' : ''));
    return;
  }

  var resp = ui.alert('🆕 Crear productos nuevos',
    'Voy a crear ' + totalNuevos + ' producto(s) en SUPLEMENTOS que están en STOCK_DETALLADO y todavía no existen.\n\n' +
    '• Los pongo bajo su marca (o creo la marca nueva si hace falta).\n' +
    '• Les cargo el stock y dejo el PRECIO en 0 resaltado en rojo para que lo completes vos.\n' +
    '• No borro ni cambio nada de lo que ya tenés.\n\n' +
    'Conviene tener una copia de la planilla por las dudas. ¿Seguimos?',
    ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  var creados = 0, resumen = [];

  // 4) Insertar en marcas EXISTENTES (de abajo hacia arriba para no correr las filas de arriba)
  var destinos = Object.keys(enExistente).map(function(mk){ return { mk: mk, anchor: marcas[mk].lastContentRow }; });
  destinos.sort(function(a, b){ return b.anchor - a.anchor; });
  var insertadosArriba = 0; // cuántas filas se insertaron (corren hacia abajo la última fila)
  destinos.forEach(function(d){
    var prods = enExistente[d.mk];
    var anchor = marcas[d.mk].lastContentRow;
    hojaSup.insertRowsAfter(anchor, prods.length);
    for (var p = 0; p < prods.length; p++) {
      _escribirProductoNuevo(hojaSup, anchor + 1 + p, prods[p].nombre, prods[p].stock);
      creados++;
    }
    insertadosArriba += prods.length;
    resumen.push('• ' + prods.length + ' en "' + marcas[d.mk].raw + '"');
  });

  // 5) Crear marcas NUEVAS justo DEBAJO de la última fila con productos
  // (no al final absoluto de la hoja: si hay celdas sueltas más abajo,
  // la marca quedaría lejos y perdida de vista).
  var filaInsercion = ultimaFilaConNombre + insertadosArriba;
  Object.keys(enNueva).forEach(function(mu){
    var prods = enNueva[mu];
    hojaSup.insertRowsAfter(filaInsercion, prods.length + 1); // 1 para el encabezado
    var rh = filaInsercion + 1;
    hojaSup.getRange(rh, 1).setValue(mu);                          // encabezado (col B queda vacía)
    hojaSup.getRange(rh, 1, 1, 10).setBackground('#1a1a2e');
    hojaSup.getRange(rh, 1).setFontColor('#00C8FF').setFontWeight('bold');
    for (var p = 0; p < prods.length; p++) {
      _escribirProductoNuevo(hojaSup, rh + 1 + p, prods[p].nombre, prods[p].stock);
      creados++;
    }
    filaInsercion = rh + prods.length; // la próxima marca nueva va debajo de esta
    resumen.push('• ' + prods.length + ' en NUEVA marca "' + mu + '"');
  });

  SpreadsheetApp.flush();

  ui.alert('✅ PRODUCTOS CREADOS\n\n' +
    'Se crearon ' + creados + ' producto(s) en SUPLEMENTOS:\n' +
    resumen.join('\n') + '\n\n' +
    '👉 Andá a SUPLEMENTOS y completá el PRECIO (la celda roja) de cada uno. El stock ya quedó cargado.' +
    (sinMarca.length ? '\n\n⚠️ ' + sinMarca.length + ' producto(s) sin marca en STOCK_DETALLADO, NO se crearon: ' + sinMarca.slice(0, 5).join(', ') : ''));
}

// Escribe una fila de producto nuevo: A=nombre, B=precio 0 (resaltado en rojo
// para completar), C=precio lista vacío, D=stock. Formato normal (fondo blanco).
function _escribirProductoNuevo(hoja, fila, nombre, stock) {
  hoja.getRange(fila, 1, 1, 4).setValues([[nombre, 0, '', stock]]);
  hoja.getRange(fila, 1, 1, 10).setBackground('#ffffff').setFontColor('#000000').setFontWeight('normal').setFontStyle('normal');
  hoja.getRange(fila, 2).setBackground('#FFCDD2');     // precio en rojo claro = falta completar
}

// ══════════════════════════════════════════════════════════
// REINICIAR "NUEVOS INGRESOS": borra la memoria del carrusel para que
// arranque de cero con el stock ACTUAL. Correr UNA vez DESPUÉS de terminar
// de corregir los stocks (los cambios masivos de stock se toman como
// "reposición" y ensucian el carrusel). Después solo lo que agregues o
// repongas de verdad aparece como nuevo.
// ══════════════════════════════════════════════════════════
function reiniciarNuevosIngresos() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.alert('🆕 Reiniciar "Nuevos Ingresos"',
    'Borra la memoria del carrusel de novedades para que arranque de cero con el stock actual.\n\n' +
    'Conviene usarlo DESPUÉS de terminar de corregir los stocks. A partir de ahí, solo los ' +
    'productos que agregues o repongas de verdad van a aparecer como nuevos.\n\n¿Seguimos?',
    ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ['_NUEVOS_SUP', '_NUEVOS_IND'].forEach(function(n){
    var h = ss.getSheetByName(n);
    if (h) ss.deleteSheet(h);           // se recrea solo (baseline) en la próxima carga
  });
  try {
    var props = PropertiesService.getScriptProperties();
    ['nv_data_SUP', 'nv_ts_SUP', 'nv_data_IND', 'nv_ts_IND'].forEach(function(k){ props.deleteProperty(k); });
  } catch(e) {}

  ui.alert('✅ Listo. El carrusel de "Nuevos Ingresos" se reconstruye con el stock actual.\n\n' +
    'Puede tardar 1-2 minutos en verse en la web (refrescá con Ctrl+F5).\n\n' +
    'Al arrancar de cero, los primeros que aparecen son los que están más abajo en la ' +
    'hoja SUPLEMENTOS (los últimos que cargaste).');
}

// ══════════════════════════════════════════════════════════
// REGISTRAR STOCK ENTRANTE — para el BOTÓN de la hoja STOCK_DETALLADO.
// Después de cargar los lotes nuevos (filas con producto/marca/vencimiento/
// stock), apretás el botón y hace todo de una:
//   1. Crea en SUPLEMENTOS los productos que no existan (precio 0 en rojo).
//   2. Sincroniza la columna D de SUPLEMENTOS con la suma de los lotes.
//   3. Actualiza la hoja de reposición.
// ══════════════════════════════════════════════════════════
function registrarStockEntrante() {
  // 1) Crear productos nuevos si los hay (la función avisa y pide confirmación)
  crearProductosFaltantes();

  // 2) Sincronizar el stock principal
  var cambios = actualizarStockPrincipal();

  // 3) Refrescar reposición
  try { actualizarHojaReposicion(); } catch(e) {}

  SpreadsheetApp.getUi().alert(
    '📦 STOCK ENTRANTE REGISTRADO\n\n' +
    '🔄 Productos con stock actualizado en SUPLEMENTOS: ' + cambios + '\n\n' +
    'Si se crearon productos nuevos, acordate de ponerles el PRECIO ' +
    '(celda roja en SUPLEMENTOS).'
  );
}

// ══════════════════════════════════════════════════════════
// DETECTAR NOMBRES REPETIDOS ENTRE MARCAS
// El sistema de lotes identifica los productos por su NOMBRE. Si dos marcas
// distintas tienen un producto con el MISMO nombre (ej. "Pancakes Proteicos -
// Vainilla" de MOLÉ y de GRANGER), el sistema los mezcla: suma sus lotes juntos
// y duplica el stock. Esta función los detecta para ponerles un nombre distinto
// en cada marca. Escribe la hoja NOMBRES_DUPLICADOS.
// ══════════════════════════════════════════════════════════
function detectarNombresDuplicados() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');
  if (!hojaSup) { ui.alert('❌ No se encontró SUPLEMENTOS.'); return; }

  var datos = hojaSup.getDataRange().getValues();
  var marcaActual = '';
  var porNombre = {};
  for (var i = 0; i < datos.length; i++) {
    var nombre = String(datos[i][0] || '').trim();
    if (_esEncabezadoMarca(nombre)) { marcaActual = nombre; continue; }
    if (!nombre) continue;
    var n = _normalizarNombre(nombre);
    if (!porNombre[n]) porNombre[n] = { nombre: nombre, marcas: [] };
    if (porNombre[n].marcas.indexOf(marcaActual) < 0) porNombre[n].marcas.push(marcaActual);
  }

  var dups = [];
  for (var k in porNombre) if (porNombre[k].marcas.length > 1) dups.push(porNombre[k]);
  dups.sort(function(a, b){ return a.nombre.localeCompare(b.nombre); });

  var filas = [['Producto (nombre repetido)', 'Marcas donde aparece', 'Qué hacer']];
  dups.forEach(function(d){
    filas.push([d.nombre, d.marcas.join('   |   '),
      'Este nombre está en varias marcas y el sistema mezcla su stock. Ponele un nombre ' +
      'distinto en cada marca (en SUPLEMENTOS y en STOCK_DETALLADO), ej. agregando la marca al nombre.']);
  });
  if (filas.length === 1) filas.push(['✅ No hay nombres repetidos entre marcas', '', '']);

  var hojaR = ss.getSheetByName('NOMBRES_DUPLICADOS');
  if (!hojaR) hojaR = ss.insertSheet('NOMBRES_DUPLICADOS');
  hojaR.clear();
  hojaR.getRange(1, 1, filas.length, 3).setValues(filas);
  hojaR.getRange(1, 1, 1, 3).setBackground('#1a1a2e').setFontColor('#00C8FF').setFontWeight('bold');
  hojaR.setColumnWidth(1, 340);
  hojaR.setColumnWidth(2, 300);
  hojaR.setColumnWidth(3, 470);
  hojaR.setFrozenRows(1);
  SpreadsheetApp.flush();

  ui.alert('🔤 NOMBRES REPETIDOS ENTRE MARCAS\n\n' +
    'Encontré ' + dups.length + ' nombre(s) que se repiten en más de una marca.\n\n' +
    'Mirá la hoja "NOMBRES_DUPLICADOS". A esos hay que ponerles un nombre distinto ' +
    'en cada marca (en las dos hojas) para que el sistema no mezcle su stock.');
}

// ── ACTUALIZAR MONTO MENSUAL DEL CLIENTE ────────────────────
// Columna D = mes más reciente. Meses nuevos se insertan en D empujando los demás a la derecha.
function _actualizarClienteMensual(codigoCli, monto) {
  if (!codigoCli || monto <= 0) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaCli = ss.getSheetByName('CLIENTES');
  if (!hojaCli) return;

  const headerMes = _getMesHeader();
  const ultCol = hojaCli.getLastColumn();
  const ultFila = hojaCli.getLastRow();
  if (ultCol === 0 || ultFila === 0) return;

  const headers = hojaCli.getRange(1, 1, 1, ultCol).getValues()[0];
  let colMes = _buscarColumnaMes(headers, new Date()) + 1; // 1-based

  if (colMes === 0) {
    // Mes nuevo: insertar columna en posición D (col 4), empuja todo a la derecha
    hojaCli.insertColumnAfter(3); // inserta después de C (Teléfono)
    colMes = 4;
    hojaCli.getRange(1, colMes).setNumberFormat("@");
    hojaCli.getRange(1, colMes).setValue(headerMes);
    hojaCli.getRange(1, colMes).setBackground('#1a1a2e').setFontColor('#00C8FF').setFontWeight('bold');
    Logger.log('  → Columna INSERTADA en D con header "' + headerMes + '"');
  }

  const clientes = hojaCli.getRange(1, 1, ultFila, 1).getValues();
  for (let i = 1; i < clientes.length; i++) {
    if (String(clientes[i][0]) === String(parseInt(codigoCli))) {
      const fila = i + 1;
      const gastoAnterior = Number(hojaCli.getRange(fila, colMes).getValue()) || 0;
      hojaCli.getRange(fila, colMes).setValue(gastoAnterior + monto);
      break;
    }
  }
}

// ── VERIFICAR DESCUENTO (3 meses consecutivos >= $40.000) ───
function _tieneDescuento(clienteCodigo) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('CLIENTES');
  if (!hoja) return false;

  const rows = hoja.getDataRange().getValues();
  const clienteFila = rows.find(r => String(r[0]) === String(clienteCodigo));
  if (!clienteFila) return false;

  const headers = rows[0];
  const ahora   = new Date();
  let streak    = 0;

  for (let m = 0; m < PROMO_MESES; m++) {
    const fecha  = new Date(ahora.getFullYear(), ahora.getMonth() - m, 1);
    const colIdx = _buscarColumnaMes(headers, fecha);

    if (colIdx === -1) break;
    const monto = Number(clienteFila[colIdx]) || 0;
    if (monto >= PROMO_MINIMO) {
      streak++;
    } else {
      break;
    }
  }

  return streak >= PROMO_MESES;
}

// Busca la columna del mes en CLIENTES, soportando ambos formatos:
// "Abr 2026" (creado por el código) y Date/2026-04-01 (creado por Setup)
function _buscarColumnaMes(headers, fecha) {
  var textoMes = NOMBRES_MESES[fecha.getMonth()] + ' ' + fecha.getFullYear();
  var anio = fecha.getFullYear();
  var mes = fecha.getMonth();

  for (var h = 0; h < headers.length; h++) {
    var val = headers[h];
    if (String(val).trim() === textoMes) return h;
    if (val instanceof Date) {
      if (val.getFullYear() === anio && val.getMonth() === mes) return h;
    }
    var strVal = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(strVal)) {
      var parts = strVal.split('-');
      if (parseInt(parts[0]) === anio && parseInt(parts[1]) - 1 === mes) return h;
    }
  }
  return -1;
}

// ── ACTUALIZAR TOTAL DEL DÍA en VentasDiarias ───────────────
// ✅ CORREGIDO: totalDia ya incluye la venta recién insertada,
//    no sumar ingreso de nuevo.
function _actualizarTotalDia(hojaVD, fechaStr) {
  const rows       = hojaVD.getDataRange().getValues();
  const totalLabel = 'TOTAL ' + fechaStr;
  const idx        = rows.findIndex(r => String(r[0]).startsWith(totalLabel));

  // Sumar todas las ventas del día directamente (sin fórmulas)
  var totalDia = 0;
  for (var i = 0; i < rows.length; i++) {
    var celda = rows[i][0];
    if (!celda || typeof celda === 'string') continue;
    try {
      var f = Utilities.formatDate(new Date(celda), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
      if (f === fechaStr) {
        totalDia += Number(rows[i][5]) || 0;
      }
    } catch(e) {}
  }

  if (idx !== -1) {
    // ✅ Solo poner el total real — ya incluye todo
    hojaVD.getRange(idx + 1, 6).setValue(totalDia);
  } else {
    // Primera venta del día: crear fila TOTAL
    var filaTotal = [totalLabel, '', '', '', '', totalDia, '', '', ''];
    hojaVD.appendRow(filaTotal);
    var lastRow = hojaVD.getLastRow();
    hojaVD.getRange(lastRow, 1, 1, 9)
      .setBackground('#1a1a00')
      .setFontColor('#FFD700')
      .setFontWeight('bold');
  }
}

// ── REGISTRAR VENTAS DESDE CELDAS (botón del Sheets) ────────
function registrarVentasDesdeCeldas() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const hojaSup = ss.getSheetByName('SUPLEMENTOS');
  const hojaInd = ss.getSheetByName('INDUMENTARIA');
  const hojaVD  = ss.getSheetByName('VentasDiarias');
  const hojaCli = ss.getSheetByName('CLIENTES');

  if (!hojaVD || !hojaCli) {
    SpreadsheetApp.getUi().alert('❌ No se encontraron las hojas VentasDiarias o CLIENTES.');
    return;
  }

  const hoy      = new Date();
  const fechaStr = Utilities.formatDate(hoy, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
  const datosClientes = hojaCli.getDataRange().getValues();

  function getNombreCliente(codigo) {
    if (!codigo) return '';
    const fila = datosClientes.find(r => String(r[0]) === String(parseInt(codigo)));
    return fila ? String(fila[1]) : String(codigo);
  }

  // Leer STOCK_DETALLADO una sola vez
  const hojaSD = ss.getSheetByName('STOCK_DETALLADO');
  const datosSD = hojaSD ? hojaSD.getDataRange().getValues() : null;

  const filasVenta = [];
  const totalesPorCliente = {};
  const updatesSup = [];  // {fila, col, valor}
  const updatesInd = [];

  // ── SUPLEMENTOS ──
  if (hojaSup) {
    const datos = hojaSup.getDataRange().getValues();
    let marcaActual = '';

    for (let i = 0; i < datos.length; i++) {
      const row = datos[i];
      // Encabezado de marca = celda escrita TODA EN MAYÚSCULA (así las cargás vos).
      // Los productos siempre tienen alguna minúscula, así nunca se confunden.
      if (_esEncabezadoMarca(row[0])) { marcaActual = String(row[0]).trim(); continue; }

      const nombre      = String(row[0] || '').trim();
      const precioLista = Number(row[1]) || 0;
      const stockActual = Number(row[3]) || 0;
      if (!nombre || precioLista <= 0) continue;

      // Soporta vender el MISMO producto a VARIOS clientes en una sola fila:
      //   Cantidad (col F): "1;2"   Cliente (col G): "25;256"
      //   → el cliente 25 compra 1 y el cliente 256 compra 2.
      const cantList  = _parseListaVenta(row[5]).map(function(x){ return Number(x) || 0; });
      const cliList   = _parseListaVenta(row[6]);
      const totalCant = cantList.reduce(function(s, n){ return s + n; }, 0);
      if (totalCant <= 0) continue;

      if (totalCant > stockActual) {
        SpreadsheetApp.getUi().alert(
          '⚠️ Stock insuficiente en SUPLEMENTOS para "' + nombre + '"\n' +
          'Disponible: ' + stockActual + ' | Querés vender (total): ' + totalCant
        );
        return;
      }

      // Armar los pares (cantidad → cliente)
      var pares = [];
      if (cliList.length <= 1) {
        // Un solo cliente (o ninguno): una venta con la suma de las cantidades
        pares.push({ cant: totalCant, cli: cliList[0] || '' });
      } else {
        // Varios clientes: tiene que haber la MISMA cantidad de números que de clientes
        if (cantList.length !== cliList.length) {
          SpreadsheetApp.getUi().alert(
            '⚠️ En "' + nombre + '" no coinciden cantidades y clientes.\n\n' +
            'Cantidad (col F): ' + cantList.join(' ; ') + '  (' + cantList.length + ' números)\n' +
            'Cliente (col G): ' + cliList.join(' ; ') + '  (' + cliList.length + ' clientes)\n\n' +
            'Poné la misma cantidad de números que de clientes. Ej: "1;2" y "25;256".'
          );
          return;
        }
        for (var k = 0; k < cliList.length; k++) {
          pares.push({ cant: cantList[k], cli: cliList[k] });
        }
      }

      // Una fila de venta por cada (cliente, cantidad)
      for (var p = 0; p < pares.length; p++) {
        var cant = pares[p].cant;
        if (cant <= 0) continue;
        var codigoCli     = pares[p].cli;
        var clienteNombre = getNombreCliente(codigoCli);
        var ingreso       = precioLista * cant;

        filasVenta.push([hoy, nombre, marcaActual, cant, precioLista, ingreso,
          clienteNombre || String(codigoCli || ''), '', '']);

        if (codigoCli) {
          var key = String(parseInt(codigoCli));
          totalesPorCliente[key] = (totalesPorCliente[key] || 0) + ingreso;
        }
      }

      // El stock se descuenta UNA sola vez por el total de la fila
      updatesSup.push({ fila: i + 1, col: 4, valor: stockActual - totalCant });
      updatesSup.push({ fila: i + 1, col: 6, valor: '' });
      updatesSup.push({ fila: i + 1, col: 7, valor: '' });

      if (hojaSD && datosSD) _descontarStockDetalladoBatch(hojaSD, datosSD, nombre, totalCant);
    }
  }

  // ── INDUMENTARIA ──
  if (hojaInd) {
    const datosInd = hojaInd.getDataRange().getValues();
    let marcaInd = '';
    let nombreProductoInd = ''; // arrastrar nombre para variantes de color

    for (let i = 1; i < datosInd.length; i++) {
      const row     = datosInd[i];
      let   nombre  = String(row[1] || '').trim();
      const color   = String(row[2] || '').trim();
      const precio  = Number(row[3]) || 0;

      if (nombre && !color && precio === 0 && !(Number(row[4]) > 0)) {
        marcaInd = nombre;
        nombreProductoInd = ''; // reset al cambiar de marca
        continue;
      }

      // Si tiene nombre, recordarlo para las variantes de abajo
      if (nombre) {
        nombreProductoInd = nombre;
      } else if (color && precio > 0) {
        // Variante sin nombre: usar el nombre del producto de arriba
        nombre = nombreProductoInd;
      }

      const cantVender  = Number(row[7]) || 0;
      const stockActual = Number(row[5]) || 0;
      if (cantVender <= 0 || !nombre || precio <= 0) continue;

      if (cantVender > stockActual) {
        const label = nombre + (color ? ' - ' + color : '');
        SpreadsheetApp.getUi().alert(
          '⚠️ Stock insuficiente en INDUMENTARIA para "' + label + '"\n' +
          'Disponible: ' + stockActual + ' | Querés vender: ' + cantVender
        );
        return;
      }

      const codigoCli      = row[8];
      const nombreCompleto = nombre + (color ? ' - ' + color : '');
      const clienteNombre  = getNombreCliente(codigoCli);
      const ingreso        = precio * cantVender;

      filasVenta.push([hoy, nombreCompleto, marcaInd, cantVender, precio, ingreso,
        clienteNombre || String(codigoCli || ''), '', '']);

      updatesInd.push({ fila: i + 1, col: 6, valor: stockActual - cantVender });
      updatesInd.push({ fila: i + 1, col: 8, valor: '' });
      updatesInd.push({ fila: i + 1, col: 9, valor: '' });

      if (codigoCli) {
        const key = String(parseInt(codigoCli));
        totalesPorCliente[key] = (totalesPorCliente[key] || 0) + ingreso;
      }
    }
  }

  if (filasVenta.length === 0) {
    SpreadsheetApp.getUi().alert(
      '⚠️ No hay cantidades para registrar.\n\n' +
      'SUPLEMENTOS: poné cantidad en col F (Venta) y código cliente en col G.\n' +
      'INDUMENTARIA: poné cantidad en col H (Venta) y código cliente en col I.'
    );
    return;
  }

  // ── ESCRIBIR TODO EN LOTE ──

  // 1) Agregar ventas a VentasDiarias (ANTES del TOTAL del día)
  for (let v = 0; v < filasVenta.length; v++) {
    _insertarFilaVenta(hojaVD, filasVenta[v], fechaStr);
  }

  // 2) Actualizar SUPLEMENTOS en lote
  if (hojaSup && updatesSup.length) {
    for (const u of updatesSup) hojaSup.getRange(u.fila, u.col).setValue(u.valor);
  }

  // 3) Actualizar INDUMENTARIA en lote
  if (hojaInd && updatesInd.length) {
    for (const u of updatesInd) hojaInd.getRange(u.fila, u.col).setValue(u.valor);
  }

  SpreadsheetApp.flush();

  // 4) Total del día
  try {
    _actualizarTotalDia(hojaVD, fechaStr);
  } catch(errTotal) {
    Logger.log('⚠️ Error en _actualizarTotalDia: ' + errTotal.message);
  }

  // 5) Actualizar compras de clientes
  Logger.log('📊 totalesPorCliente: ' + JSON.stringify(totalesPorCliente));
  for (const [codigo, monto] of Object.entries(totalesPorCliente)) {
    try {
      Logger.log('👤 Actualizando cliente código=' + codigo + ' monto=' + monto);
      _actualizarClienteMensual(codigo, monto);
      Logger.log('✅ Cliente ' + codigo + ' actualizado OK');
    } catch(errCli) {
      Logger.log('❌ Error actualizando cliente ' + codigo + ': ' + errCli.message);
    }
  }

  // 6) Total real para el alert
  const todasFilas = hojaVD.getDataRange().getValues();
  let totalReal = 0;
  for (const r of todasFilas) {
    if (!r[0] || typeof r[0] === 'string') continue;
    try {
      const f = Utilities.formatDate(new Date(r[0]), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
      if (f === fechaStr) totalReal += Number(r[5]) || 0;
    } catch(e) {}
  }

  const resumen = Object.entries(totalesPorCliente)
    .map(([cod, monto]) => '  • ' + getNombreCliente(cod) + ': $' + monto.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'))
    .join('\n') || '  • Sin cliente asignado';

  // Reflejar en la col D de SUPLEMENTOS el stock que quedó en los lotes
  actualizarStockPrincipal();
  actualizarHojaReposicion();

  SpreadsheetApp.getUi().alert(
    '✅ Venta registrada correctamente\n\n' +
    'Productos: ' + filasVenta.length + '\n' +
    'Total del día: $' + totalReal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '\n\n' +
    'Por cliente:\n' + resumen
  );
}

// ── FORMULARIO DE VENTA (menú) ───────────────────────────────
function abrirFormularioVenta() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const hojaSup = ss.getSheetByName('SUPLEMENTOS');
  if (!hojaSup) {
    SpreadsheetApp.getUi().alert('❌ No se encontró la hoja SUPLEMENTOS.');
    return;
  }

  const datos    = hojaSup.getDataRange().getValues();
  const productos = [];
  let marcaActual = '';

  for (const row of datos) {
    if (!row[0]) continue;
    const nombre = String(row[0]).trim();
    if (_esEncabezadoMarca(nombre)) { marcaActual = nombre; continue; }
    const precio = Number(row[1]);
    const stock  = Number(row[3]) || 0;
    if (precio > 0) {
      productos.push({
        id:     nombre.toLowerCase().replace(/\s+/g, '_').substring(0, 40),
        nombre: nombre,
        marca:  marcaActual,
        precio: precio,
        stock:  stock
      });
    }
  }

  const opciones = productos.map(p =>
    '<option value="' + p.id + '" data-precio="' + p.precio + '" data-marca="' + p.marca + '" data-stock="' + p.stock + '">' +
    p.nombre + ' (' + p.marca + ') — $' + p.precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' | Stock: ' + p.stock +
    '</option>'
  ).join('');

  const html = HtmlService.createHtmlOutput(`
    <style>
      body{font-family:Arial,sans-serif;padding:16px;font-size:13px}
      label{font-weight:bold;display:block;margin-top:10px}
      select,input{width:100%;padding:6px;margin-top:4px;box-sizing:border-box}
      .item{border:1px solid #ddd;padding:10px;margin-top:8px;border-radius:4px;background:#f9f9f9}
      .btn{margin-top:12px;padding:8px 16px;cursor:pointer}
      .btn-add{background:#4CAF50;color:white;border:none;border-radius:4px}
      .btn-reg{background:#2196F3;color:white;border:none;border-radius:4px;width:100%;padding:10px}
      .btn-del{background:#f44336;color:white;border:none;border-radius:4px;padding:4px 8px;float:right}
    </style>
    <h3 style="margin-top:0">Registrar Venta</h3>
    <label>Código del cliente:</label>
    <input type="number" id="clienteCodigo" placeholder="Ej: 101">
    <label>Notas (opcional):</label>
    <input type="text" id="notas" placeholder="Ej: Pago en efectivo">
    <div id="items"></div>
    <button class="btn btn-add" onclick="agregarItem()">+ Agregar producto</button>
    <br><br>
    <button class="btn btn-reg" onclick="registrar()">✅ CONFIRMAR VENTA</button>
    <script>
      let count = 0;
      function agregarItem() {
        count++;
        const div = document.getElementById('items');
        const id  = 'item' + count;
        div.innerHTML += '<div class="item" id="' + id + '">' +
          '<button class="btn-del" onclick="document.getElementById(\\'' + id + '\\').remove()">✕</button>' +
          '<label>Producto:</label>' +
          '<select id="prod' + count + '"><option value="">— Seleccionar —</option>${opciones}</select>' +
          '<label>Cantidad:</label>' +
          '<input type="number" id="cant' + count + '" value="1" min="1">' +
          '</div>';
      }
      agregarItem();
      function registrar() {
        const codigo = document.getElementById('clienteCodigo').value;
        const notas  = document.getElementById('notas').value;
        const items  = [];
        for (let i = 1; i <= count; i++) {
          const sel  = document.getElementById('prod' + i);
          const cant = document.getElementById('cant' + i);
          if (!sel || !sel.value) continue;
          const opt = sel.options[sel.selectedIndex];
          items.push({
            id:     sel.value,
            nombre: opt.text.split(' (')[0],
            marca:  opt.dataset.marca,
            precio: Number(opt.dataset.precio),
            stock:  Number(opt.dataset.stock),
            cantidad: Number(cant.value)
          });
        }
        if (items.length === 0) { alert('Agregá al menos un producto'); return; }
        google.script.run
          .withSuccessHandler(msg => { alert(msg); google.script.host.close(); })
          .withFailureHandler(err => alert('Error: ' + err.message))
          .procesarVenta({ clienteCodigo: codigo, notas: notas, items: items });
      }
    </script>
  `)
  .setTitle('Registrar Venta')
  .setWidth(480)
  .setHeight(520);

  SpreadsheetApp.getUi().showModalDialog(html, 'Registrar Venta');
}

// ── PROCESAR VENTA DESDE FORMULARIO ─────────────────────────
function procesarVenta(datos) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const hojaSup = ss.getSheetByName('SUPLEMENTOS');
  const hojaVD  = ss.getSheetByName('VentasDiarias');
  const hojaCli = ss.getSheetByName('CLIENTES');

  if (!hojaSup || !hojaVD) throw new Error('Hojas no encontradas');

  const hoy      = new Date();
  const fechaStr = Utilities.formatDate(hoy, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');

  let clienteNombre = '';
  if (datos.clienteCodigo && hojaCli) {
    const cRows = hojaCli.getDataRange().getValues();
    const cFila = cRows.find(r => String(r[0]) === String(parseInt(datos.clienteCodigo)));
    clienteNombre = cFila ? String(cFila[1]) : String(datos.clienteCodigo);
  }

  const descuento = datos.clienteCodigo ? _tieneDescuento(datos.clienteCodigo) : false;
  const factor    = descuento ? (1 - PROMO_DESCUENTO) : 1;

  let totalVenta = 0;
  var supRows = hojaSup.getDataRange().getValues();

  for (const item of datos.items) {
    const prodIdx = supRows.findIndex(r =>
      String(r[0]).trim().toLowerCase() === String(item.nombre).trim().toLowerCase()
    );

    const stockActual = prodIdx >= 0 ? (Number(supRows[prodIdx][3]) || 0) : item.stock;
    if (item.cantidad > stockActual) {
      throw new Error('Stock insuficiente para "' + item.nombre + '" (disponible: ' + stockActual + ')');
    }

    const precioFinal = Math.round(item.precio * factor);
    const ingreso     = precioFinal * item.cantidad;
    totalVenta       += ingreso;

    _insertarFilaVenta(hojaVD, [
      hoy,
      item.nombre || '',
      item.marca  || '',
      Number(item.cantidad) || 1,
      precioFinal,
      ingreso,
      clienteNombre || '',
      '',
      datos.notas || (descuento ? '🎁 Descuento 10%' : '')
    ], fechaStr);

    // Descontar de SUPLEMENTOS
    if (prodIdx >= 0) {
      hojaSup.getRange(prodIdx + 1, 4).setValue(stockActual - item.cantidad);
    }

    // ★ Descontar de STOCK_DETALLADO por FIFO
    _descontarStockDetallado(item.nombre, item.cantidad);
  }

  // ✅ CORREGIDO: recalcula el total real sin duplicar
  _actualizarTotalDia(hojaVD, fechaStr);

  if (datos.clienteCodigo) {
    _actualizarClienteMensual(datos.clienteCodigo, totalVenta);
  }

  // Reflejar en la col D de SUPLEMENTOS el stock que quedó en los lotes
  actualizarStockPrincipal();
  // Actualizar hoja de reposición
  actualizarHojaReposicion();

  return '✅ Venta registrada\n' +
    'Cliente: ' + (clienteNombre || 'Sin cliente') + '\n' +
    'Total: $' + totalVenta.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') +
    (descuento ? '\n🎁 Descuento 10% aplicado!' : '');
}

// ── NUEVO CLIENTE ────────────────────────────────────────────
function abrirFormularioCliente() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body{font-family:Arial,sans-serif;padding:16px;font-size:13px}
      label{font-weight:bold;display:block;margin-top:10px}
      input{width:100%;padding:6px;margin-top:4px;box-sizing:border-box}
      .btn{margin-top:14px;padding:10px;width:100%;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px}
    </style>
    <h3 style="margin-top:0">Nuevo Cliente</h3>
    <label>Nombre completo:</label>
    <input type="text" id="nombre" placeholder="Ej: Juan Pérez">
    <label>Teléfono (opcional):</label>
    <input type="text" id="telefono" placeholder="Ej: 3886123456">
    <button class="btn" onclick="guardar()">💾 GUARDAR CLIENTE</button>
    <script>
      function guardar() {
        const nombre = document.getElementById('nombre').value.trim();
        const tel    = document.getElementById('telefono').value.trim();
        if (!nombre) { alert('Escribí el nombre del cliente'); return; }
        google.script.run
          .withSuccessHandler(msg => { alert(msg); google.script.host.close(); })
          .withFailureHandler(err => alert('Error: ' + err.message))
          .agregarCliente({ nombre: nombre, telefono: tel });
      }
    </script>
  `)
  .setTitle('Nuevo Cliente')
  .setWidth(380)
  .setHeight(280);

  SpreadsheetApp.getUi().showModalDialog(html, 'Nuevo Cliente');
}

// ── AGREGAR CLIENTE ──────────────────────────────────────────
function agregarCliente(datos) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('CLIENTES');
  if (!hoja) throw new Error('Hoja CLIENTES no encontrada');

  const rows    = hoja.getDataRange().getValues();
  const codigos = rows.slice(1).map(r => Number(r[0])).filter(c => !isNaN(c) && c > 0);
  const nuevoCodigo = codigos.length > 0 ? Math.max(...codigos) + 1 : 101;

  const fila = [nuevoCodigo, datos.nombre || '', datos.telefono || ''];
  hoja.appendRow(fila);

  const lastRow = hoja.getLastRow();
  hoja.getRange(lastRow, 1, 1, fila.length)
    .setBackground(null)
    .setFontColor(null);

  return '✅ Cliente agregado\nCódigo: ' + nuevoCodigo + '\nNombre: ' + datos.nombre;
}

// ── RESUMEN DEL DÍA ──────────────────────────────────────────
function mostrarResumenDia() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const hojaVD = ss.getSheetByName('VentasDiarias');
  if (!hojaVD) {
    SpreadsheetApp.getUi().alert('❌ No se encontró la hoja VentasDiarias.');
    return;
  }

  const hoy      = new Date();
  const fechaHoy = Utilities.formatDate(hoy, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
  const rows     = hojaVD.getDataRange().getValues();

  const hoyRows = rows.filter(r => {
    if (!r[0] || typeof r[0] === 'string') return false;
    try {
      const fecha = Utilities.formatDate(new Date(r[0]), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
      return fecha === fechaHoy;
    } catch(e) { return false; }
  });

  if (hoyRows.length === 0) {
    SpreadsheetApp.getUi().alert('📊 Sin ventas registradas hoy (' + fechaHoy + ')');
    return;
  }

  const total    = hoyRows.reduce((s, r) => s + (Number(r[5]) || 0), 0);
  const detalles = hoyRows.map(r =>
    '  • ' + r[1] + ' x' + r[3] + ' = $' + (Number(r[5]) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') +
    (r[6] ? ' (' + r[6] + ')' : '')
  ).join('\n');

  SpreadsheetApp.getUi().alert(
    '📊 Resumen ' + fechaHoy + '\n\n' +
    detalles + '\n\n' +
    '──────────────────\n' +
    'TOTAL: $' + total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

// ── VER CLIENTES CON DESCUENTO ───────────────────────────────
function verClientesConDescuento() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('CLIENTES');
  if (!hoja) {
    SpreadsheetApp.getUi().alert('❌ No se encontró la hoja CLIENTES.');
    return;
  }

  const rows = hoja.getDataRange().getValues();
  const calificados = [];

  for (let i = 1; i < rows.length; i++) {
    const codigo = rows[i][0];
    const nombre = rows[i][1];
    if (!codigo || !nombre) continue;
    if (_tieneDescuento(codigo)) {
      calificados.push('  🎁 ' + nombre + ' (Código: ' + codigo + ')');
    }
  }

  if (calificados.length === 0) {
    SpreadsheetApp.getUi().alert(
      '📋 Clientes con descuento activo\n\n' +
      'Ningún cliente califica aún.\n\n' +
      'Condición: 3 meses consecutivos con compras >= $' + PROMO_MINIMO.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    );
  } else {
    SpreadsheetApp.getUi().alert(
      '🎁 Clientes con 10% de descuento activo:\n\n' +
      calificados.join('\n') + '\n\n' +
      'El descuento se aplica automáticamente al registrar su próxima venta.'
    );
  }
}

// ── ACTUALIZAR HOJA REPOSICION ───────────────────────────────
function _formatoPrecio(num) {
  var n = Math.round(Number(num) || 0);
  var str = String(n);
  var resultado = '';
  var count = 0;
  for (var i = str.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) resultado = '.' + resultado;
    resultado = str[i] + resultado;
    count++;
  }
  return resultado;
}

function actualizarHojaReposicion() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const hojaSup = ss.getSheetByName('SUPLEMENTOS');
  if (!hojaSup) return;

  let hojaRep = ss.getSheetByName('REPOSICION');
  if (!hojaRep) {
    hojaRep = ss.insertSheet('REPOSICION');
  }

  const STOCK_MINIMO = 3;
  const datos = hojaSup.getDataRange().getValues();
  const hoy   = new Date();
  const fechaStr = Utilities.formatDate(hoy, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm');

  const productos = [];
  let marcaActual = '';

  for (let i = 2; i < datos.length; i++) {
    const row    = datos[i];
    const nombre = String(row[0] || '').trim();
    const precio = Number(row[1]);
    const stock  = Number(row[3]) || 0;

    if (!nombre) continue;
    // Encabezado de marca = celda escrita TODA EN MAYÚSCULA
    if (_esEncabezadoMarca(nombre)) { marcaActual = nombre; continue; }

    if (stock <= STOCK_MINIMO) {
      productos.push([
        nombre,
        marcaActual,
        stock,
        stock === 0 ? '🔴 SIN STOCK' : stock === 1 ? '🟠 CRÍTICO' : '🟡 BAJO',
        precio,
        fechaStr
      ]);
    }
  }

  hojaRep.clearContents();
  hojaRep.clearFormats();

  const headerRange = hojaRep.getRange(1, 1, 1, 6);
  headerRange.setValues([['Producto', 'Marca', 'Stock actual', 'Estado', 'Precio', 'Última actualización']]);
  headerRange.setBackground('#1a1a2e').setFontColor('#00C8FF').setFontWeight('bold');

  if (productos.length > 0) {
    productos.sort(function(a, b) { return a[2] - b[2]; });
    const dataRange = hojaRep.getRange(2, 1, productos.length, 6);
    dataRange.setValues(productos);

    for (let i = 0; i < productos.length; i++) {
      const stock = productos[i][2];
      const color = stock === 0 ? '#3a0000' : stock === 1 ? '#2a1500' : '#1a1a00';
      const fontColor = stock === 0 ? '#FF4444' : stock === 1 ? '#FF9900' : '#FFD700';
      hojaRep.getRange(i + 2, 1, 1, 6).setBackground(color).setFontColor(fontColor);
    }

    hojaRep.setColumnWidth(1, 280);
    hojaRep.setColumnWidth(2, 150);
    hojaRep.setColumnWidth(3, 90);
    hojaRep.setColumnWidth(4, 100);
    hojaRep.setColumnWidth(5, 100);
    hojaRep.setColumnWidth(6, 160);
  } else {
    hojaRep.getRange(2, 1).setValue('✅ Todos los productos tienen stock suficiente');
    hojaRep.getRange(2, 1).setFontColor('#00CC44');
  }

  hojaRep.getRange(1, 7).setValue('Actualizado: ' + fechaStr);
  hojaRep.getRange(1, 7).setFontColor('#888888').setFontStyle('italic');
}

// ══════════════════════════════════════════════════════════
// ORDENAR COLUMNAS DE MESES EN CLIENTES
// Renombra headers de fecha (2026-01-01) a formato "Ene 2026",
// y reordena: mes más reciente en col D, los demás a la derecha.
// ══════════════════════════════════════════════════════════
function ordenarColumnasClientes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('CLIENTES');
  if (!hoja) { SpreadsheetApp.getUi().alert('❌ Hoja CLIENTES no encontrada'); return; }

  var ultCol = hoja.getLastColumn();
  var ultFila = hoja.getLastRow();
  if (ultCol <= 3 || ultFila < 2) { SpreadsheetApp.getUi().alert('⚠️ No hay columnas de meses para ordenar'); return; }

  // Leer toda la data
  var allData = hoja.getRange(1, 1, ultFila, ultCol).getValues();
  var headers = allData[0];

  // Separar columnas fijas (A=Código, B=Nombre, C=Teléfono) de columnas de meses (D en adelante)
  var colsFijas = 3; // A, B, C
  var mesesData = []; // {colIdx, fecha, header}

  for (var h = colsFijas; h < headers.length; h++) {
    var val = headers[h];
    var fecha = null;
    var headerTexto = '';

    // Intentar parsear como fecha
    if (val instanceof Date && !isNaN(val.getTime())) {
      fecha = val;
      headerTexto = NOMBRES_MESES[val.getMonth()] + ' ' + val.getFullYear();
    } else {
      var str = String(val).trim();
      // Formato "2026-01-01"
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        var parts = str.split('-');
        fecha = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        headerTexto = NOMBRES_MESES[fecha.getMonth()] + ' ' + fecha.getFullYear();
      }
      // Formato "Ene 2026" (ya está bien)
      else {
        for (var m = 0; m < NOMBRES_MESES.length; m++) {
          var regex = new RegExp('^' + NOMBRES_MESES[m] + '\\s+(\\d{4})$', 'i');
          var match = str.match(regex);
          if (match) {
            fecha = new Date(parseInt(match[1]), m, 1);
            headerTexto = str;
            break;
          }
        }
      }
      // Columna "Bienvenida" u otra no-mes: saltar
      if (!fecha) {
        // Mantener al final
        fecha = new Date(1900, 0, 1);
        headerTexto = str;
      }
    }

    // Extraer datos de todas las filas para esta columna
    var columnData = [];
    for (var r = 0; r < ultFila; r++) {
      columnData.push(allData[r][h]);
    }
    mesesData.push({ colIdx: h, fecha: fecha, header: headerTexto, data: columnData });
  }

  // Ordenar: más reciente primero (fecha descendente), "Bienvenida" y otros al final
  mesesData.sort(function(a, b) {
    return b.fecha.getTime() - a.fecha.getTime();
  });

  // Escribir de vuelta
  for (var i = 0; i < mesesData.length; i++) {
    var col = colsFijas + i + 1; // 1-based, empieza en D (col 4)
    var mesInfo = mesesData[i];

    // Header renombrado
    hoja.getRange(1, col).setNumberFormat("@");
    hoja.getRange(1, col).setValue(mesInfo.header);

    // Datos de cada fila
    for (var r = 1; r < mesInfo.data.length; r++) {
      hoja.getRange(r + 1, col).setValue(mesInfo.data[r]);
    }
  }

  // Formatear header
  if (mesesData.length > 0) {
    hoja.getRange(1, colsFijas + 1, 1, mesesData.length)
      .setBackground('#1a1a2e').setFontColor('#00C8FF').setFontWeight('bold');
  }

  // Eliminar columnas sobrantes si hay
  var totalColsNecesarias = colsFijas + mesesData.length;
  if (hoja.getLastColumn() > totalColsNecesarias) {
    var sobran = hoja.getLastColumn() - totalColsNecesarias;
    for (var s = 0; s < sobran; s++) {
      hoja.deleteColumn(totalColsNecesarias + 1);
    }
  }

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert(
    '✅ COLUMNAS ORDENADAS\n\n'
    + '📅 ' + mesesData.length + ' columnas de meses reordenadas\n'
    + '📌 Mes más reciente: ' + (mesesData.length > 0 ? mesesData[0].header : '-') + ' (columna D)\n'
    + '📌 Mes más antiguo: ' + (mesesData.length > 0 ? mesesData[mesesData.length - 1].header : '-') + ' (última columna)\n\n'
    + 'Headers renombrados a formato "Mes Año"'
  );
}

// ══════════════════════════════════════════════════════════
// RECUPERAR COMPRAS DE CLIENTES DESDE VENTASDIARIAS
// Lee todas las ventas, busca el nombre del cliente en CLIENTES,
// y acumula los montos por mes en la hoja CLIENTES.
// ══════════════════════════════════════════════════════════
function recuperarComprasClientes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaVD = ss.getSheetByName('VentasDiarias');
  var hojaCli = ss.getSheetByName('CLIENTES');

  if (!hojaVD || !hojaCli) {
    SpreadsheetApp.getUi().alert('❌ No se encontraron las hojas VentasDiarias o CLIENTES.');
    return;
  }

  var ventas = hojaVD.getDataRange().getValues();
  var clientesData = hojaCli.getDataRange().getValues();
  var headers = clientesData[0];
  var ultCol = hojaCli.getLastColumn();

  // Helper: normalizar nombre para comparación flexible
  function normNombre(n) {
    return String(n || '').trim().toLowerCase()
      .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
      .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o')
      .replace(/[úùü]/g,'u').replace(/ñ/g,'n')
      .replace(/[.,;:!¿?'"()]/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  // Construir mapa de clientes: nombre normalizado → {fila, codigo}
  var mapaClientes = {};
  var listaClientes = []; // para búsqueda parcial
  for (var c = 1; c < clientesData.length; c++) {
    var codigo = String(clientesData[c][0] || '').trim();
    var nombre = normNombre(clientesData[c][1]);
    if (nombre) {
      mapaClientes[nombre] = { fila: c + 1, codigo: codigo };
      listaClientes.push({ nombre: nombre, fila: c + 1, codigo: codigo });
    }
  }

  // Buscar cliente con múltiples estrategias
  function buscarCliente(nombreVenta) {
    var key = normNombre(nombreVenta);
    if (!key) return null;

    // 1) Coincidencia exacta
    if (mapaClientes[key]) return mapaClientes[key];

    // 2) Uno contiene al otro
    for (var k in mapaClientes) {
      if (k.indexOf(key) >= 0 || key.indexOf(k) >= 0) return mapaClientes[k];
    }

    // 3) Buscar por apellido + primer nombre (al menos 2 palabras coincidan)
    var palabrasVenta = key.split(' ');
    if (palabrasVenta.length >= 2) {
      var mejorMatch = null;
      var mejorScore = 0;
      for (var j = 0; j < listaClientes.length; j++) {
        var palabrasCli = listaClientes[j].nombre.split(' ');
        var coincidencias = 0;
        for (var p = 0; p < palabrasVenta.length; p++) {
          if (palabrasVenta[p].length < 2) continue;
          for (var q = 0; q < palabrasCli.length; q++) {
            if (palabrasVenta[p] === palabrasCli[q]) { coincidencias++; break; }
          }
        }
        if (coincidencias >= 2 && coincidencias > mejorScore) {
          mejorScore = coincidencias;
          mejorMatch = listaClientes[j];
        }
      }
      if (mejorMatch) return mejorMatch;
    }

    return null;
  }

  // Recorrer ventas y acumular por cliente + mes
  // VentasDiarias: col A=fecha, col F=ingreso(idx 5), col G=nombre cliente(idx 6)
  var acumulado = {}; // clave: "fila_cliente|año-mes" → monto

  var ventasLeidas = 0;
  var ventasSinCliente = 0;
  var clientesNoEncontrados = {};

  for (var v = 0; v < ventas.length; v++) {
    var fila = ventas[v];
    var fecha = fila[0];

    // Saltar filas sin fecha válida (headers, TOTALes, vacías)
    if (!fecha || typeof fecha === 'string') continue;

    var fechaObj;
    try {
      fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) continue;
    } catch(e) { continue; }

    var ingreso = Number(fila[5]) || 0;
    var nombreCliente = String(fila[6] || '').trim();

    if (!nombreCliente || ingreso <= 0) {
      ventasSinCliente++;
      continue;
    }

    // Buscar cliente con matching flexible
    var cliente = buscarCliente(nombreCliente);

    if (!cliente) {
      clientesNoEncontrados[nombreCliente] = (clientesNoEncontrados[nombreCliente] || 0) + 1;
      continue;
    }

    var anio = fechaObj.getFullYear();
    var mes = fechaObj.getMonth();
    var claveAccum = cliente.fila + '|' + anio + '-' + mes;

    if (!acumulado[claveAccum]) {
      acumulado[claveAccum] = { fila: cliente.fila, anio: anio, mes: mes, monto: 0 };
    }
    acumulado[claveAccum].monto += ingreso;
    ventasLeidas++;
  }

  // Ahora escribir los montos acumulados en CLIENTES
  // Primero refrescar headers por si se agregaron columnas
  var headersActuales = hojaCli.getRange(1, 1, 1, hojaCli.getLastColumn()).getValues()[0];
  var columnasCreadas = 0;
  var clientesActualizados = {};

  for (var clave in acumulado) {
    var dato = acumulado[clave];
    var fechaMes = new Date(dato.anio, dato.mes, 1);
    var headerMes = NOMBRES_MESES[dato.mes] + ' ' + dato.anio;

    // Buscar columna del mes
    var colIdx = _buscarColumnaMes(headersActuales, fechaMes);

    if (colIdx === -1) {
      // Crear columna nueva
      var nuevaCol = headersActuales.length + 1;
      hojaCli.getRange(1, nuevaCol).setNumberFormat("@");
      hojaCli.getRange(1, nuevaCol).setValue(headerMes);
      headersActuales.push(headerMes);
      colIdx = headersActuales.length - 1;
      columnasCreadas++;
    }

    var colSheet = colIdx + 1; // 1-based
    var montoAnterior = Number(hojaCli.getRange(dato.fila, colSheet).getValue()) || 0;
    hojaCli.getRange(dato.fila, colSheet).setValue(dato.monto);
    // Nota: REEMPLAZA el monto (no suma) porque estamos recalculando todo desde cero

    clientesActualizados[dato.fila] = true;
  }

  SpreadsheetApp.flush();

  // Resumen
  var noEncontradosTexto = '';
  var noEncontradosKeys = Object.keys(clientesNoEncontrados);
  if (noEncontradosKeys.length > 0) {
    noEncontradosTexto = '\n\n⚠️ Clientes en ventas NO encontrados en CLIENTES:\n';
    noEncontradosKeys.slice(0, 15).forEach(function(n) {
      noEncontradosTexto += '  • ' + n + ' (' + clientesNoEncontrados[n] + ' ventas)\n';
    });
    if (noEncontradosKeys.length > 15) {
      noEncontradosTexto += '  ... y ' + (noEncontradosKeys.length - 15) + ' más\n';
    }
  }

  SpreadsheetApp.getUi().alert(
    '✅ RECUPERACIÓN COMPLETADA\n\n'
    + '📊 Ventas procesadas: ' + ventasLeidas + '\n'
    + '👤 Clientes actualizados: ' + Object.keys(clientesActualizados).length + '\n'
    + '📅 Columnas de mes creadas: ' + columnasCreadas + '\n'
    + '⏭️ Ventas sin cliente: ' + ventasSinCliente
    + noEncontradosTexto
  );
}
