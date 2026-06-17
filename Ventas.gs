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
function _normalizarNombre(n) {
  return String(n || '').trim().toLowerCase()
    .replace(/[.,;:!¡¿?'"()[\]{}]/g, '')  // quitar puntuación
    .replace(/\s+/g, ' ')                  // espacios múltiples → uno
    .replace(/x\s*(\d)/g, 'x$1')           // "x 300" → "x300"
    .replace(/(\d)\s*,\s*(\d)/g, '$1.$2')  // "1,5" → "1.5"
    .replace(/\s*kilos?\b/gi, 'kg')        // "Kilos" → "kg"
    .replace(/\s*gramos?\b/gi, 'g')        // "Gramos" → "g"
    .replace(/\s*litros?\b/gi, 'l')        // "Litros" → "l"
    .trim();
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
      if (row[0] && !row[1]) { marcaActual = String(row[0]).trim(); continue; }

      const cantVender  = Number(row[5]) || 0;
      const stockActual = Number(row[3]) || 0;
      if (cantVender <= 0) continue;

      const nombre      = String(row[0] || '').trim();
      const precioLista = Number(row[1]) || 0;
      if (!nombre || precioLista <= 0) continue;

      if (cantVender > stockActual) {
        SpreadsheetApp.getUi().alert(
          '⚠️ Stock insuficiente en SUPLEMENTOS para "' + nombre + '"\n' +
          'Disponible: ' + stockActual + ' | Querés vender: ' + cantVender
        );
        return;
      }

      const codigoCli     = row[6];
      const clienteNombre = getNombreCliente(codigoCli);
      const ingreso       = precioLista * cantVender;

      filasVenta.push([hoy, nombre, marcaActual, cantVender, precioLista, ingreso,
        clienteNombre || String(codigoCli || ''), '', '']);

      updatesSup.push({ fila: i + 1, col: 4, valor: stockActual - cantVender });
      updatesSup.push({ fila: i + 1, col: 6, valor: '' });
      updatesSup.push({ fila: i + 1, col: 7, valor: '' });

      if (hojaSD && datosSD) _descontarStockDetalladoBatch(hojaSD, datosSD, nombre, cantVender);

      if (codigoCli) {
        const key = String(parseInt(codigoCli));
        totalesPorCliente[key] = (totalesPorCliente[key] || 0) + ingreso;
      }
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
    if (!row[1]) { marcaActual = nombre; continue; }
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
    if (!precio || isNaN(precio)) { marcaActual = nombre; continue; }

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
