// ============================================================
// MAXUP — Caja rápida dentro de Google Sheets y como aplicación web
// Presupuesto, carrito, clientes, descuentos y aplicación de ventas.
// ============================================================

var CAJA_SESSION_TTL = 21600;
var CAJA_PENDIENTE_HEADERS = [
  'ID','Fecha','Cliente código','Cliente','Teléfono','Pago código','Pago',
  'Productos JSON','Subtotal','Desc. monto','Desc. fidelidad','Total','Notas','Estado','Fecha cierre'
];

function _crearSesionCajaInterna_() {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('CAJA_INTERNA_' + _hashSeguro(token), _adminVersionSesion(), CAJA_SESSION_TTL);
  return token;
}

function _validarSesionCaja_(sesion) {
  sesion = String(sesion || '');
  if (!sesion) throw new Error('Sesión de Caja requerida');
  var cache = CacheService.getScriptCache();
  var keyInterna = 'CAJA_INTERNA_' + _hashSeguro(sesion);
  if (cache.get(keyInterna) === _adminVersionSesion()) {
    cache.put(keyInterna, _adminVersionSesion(), CAJA_SESSION_TTL);
    return true;
  }
  return _validarSesionAdmin(sesion);
}

function cajaLoginMaxup(clave) {
  return adminLogin(clave);
}

function cajaLogoutMaxup(sesion) {
  return adminLogout(sesion);
}

function cajaAutomaticaMaxupActiva() {
  return PropertiesService.getUserProperties().getProperty('MAXUP_CAJA_AUTO') !== '0';
}

function alternarCajaAutomaticaMaxup() {
  var props = PropertiesService.getUserProperties();
  var activa = cajaAutomaticaMaxupActiva();
  props.setProperty('MAXUP_CAJA_AUTO', activa ? '0' : '1');
  SpreadsheetApp.getActiveSpreadsheet().toast(
    activa ? 'La Caja ya no se abrirá automáticamente.' : 'La Caja se abrirá automáticamente al entrar.',
    'MAXUP', 6
  );
  if (activa === false) abrirCajaMaxup();
}

function abrirCajaMaxup() {
  var plantilla = HtmlService.createTemplateFromFile('CajaMaxup');
  plantilla.modoWeb = false;
  plantilla.sesionCaja = _crearSesionCajaInterna_();
  var html = plantilla.evaluate()
    .setTitle('MAXUP · Caja rápida')
    .setWidth(980)
    .setHeight(720);
  SpreadsheetApp.getUi().showModelessDialog(html, 'MAXUP · Caja rápida');
}

function _cajaNorm_(valor) {
  return String(valor || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function _cajaFmt_(valor) {
  return '$' + Math.round(Number(valor) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function _cajaDescuentosMonto_() {
  var descuentos = [];
  try {
    if (typeof _configPublicaMaxup === 'function') descuentos = _configPublicaMaxup().descuentosMonto || [];
  } catch (e) {}
  if (!descuentos.length) {
    descuentos = [
      { minimo: 500000, pct: 0.15, label: '15% por compra desde $500.000' },
      { minimo: 300000, pct: 0.08, label: '8% por compra desde $300.000' }
    ];
  }
  return descuentos.map(function(d) {
    return { minimo: Number(d.minimo) || 0, pct: Number(d.pct) || 0, label: String(d.label || '') };
  }).sort(function(a, b) { return b.minimo - a.minimo; });
}

function _cajaFidelidadDesdeRows_(codigo, rows, headers) {
  if (!codigo || !rows || rows.length < 2) return false;
  var fila = null;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(codigo)) { fila = rows[i]; break; }
  }
  if (!fila) return false;
  return _cajaFidelidadFila_(fila, headers);
}

function _cajaReglasFidelidad_(headers) {
  var meses = (typeof _configNumeroMaxup === 'function') ? _configNumeroMaxup('PROMO_MESES', PROMO_MESES) : PROMO_MESES;
  var minimo = (typeof _configNumeroMaxup === 'function') ? _configNumeroMaxup('PROMO_MINIMO', PROMO_MINIMO) : PROMO_MINIMO;
  var columnas = [];
  for (var m = 0; m < meses; m++) {
    var fecha = new Date(new Date().getFullYear(), new Date().getMonth() - m, 1);
    columnas.push({ mes: _getMesHeader(fecha), col: _buscarColumnaMes(headers, fecha) });
  }
  return { cantidad: meses, minimo: minimo, columnas: columnas };
}

function _cajaFidelidadFila_(fila, headers, reglas) {
  reglas = reglas || _cajaReglasFidelidad_(headers);
  for (var m = 0; m < reglas.columnas.length; m++) {
    var col = reglas.columnas[m].col;
    if (col < 0 || (Number(fila[col]) || 0) < reglas.minimo) return false;
  }
  return true;
}

function _cajaMesesCliente_(fila, headers, reglas) {
  var meses = [];
  reglas = reglas || _cajaReglasFidelidad_(headers);
  for (var m = 0; m < reglas.columnas.length; m++) {
    var col = reglas.columnas[m].col;
    var monto = col >= 0 ? (Number(fila[col]) || 0) : 0;
    meses.push({ mes: reglas.columnas[m].mes, monto: monto, cumple: monto >= reglas.minimo });
  }
  return meses;
}

function _cajaClientes_() {
  var hoja = _getSS().getSheetByName('CLIENTES');
  if (!hoja || hoja.getLastRow() < 2) return [];
  var rows = hoja.getDataRange().getValues();
  var headers = rows[0];
  var headersNorm = headers.map(_cajaNorm_);
  var colTel = -1;
  ['telefono','teléfono','celular','whatsapp'].some(function(nombre) {
    var idx = headersNorm.indexOf(_cajaNorm_(nombre));
    if (idx >= 0) { colTel = idx; return true; }
    return false;
  });
  var clientes = [];
  // Calcular las columnas y reglas una sola vez. Antes se recorría toda la
  // hoja CLIENTES otra vez por cada persona, lo que hacía lenta la caja.
  var reglasFidelidad = _cajaReglasFidelidad_(headers);
  for (var i = 1; i < rows.length; i++) {
    var codigo = rows[i][0];
    var nombre = String(rows[i][1] || '').trim();
    if (codigo === '' || !nombre) continue;
    clientes.push({
      codigo: String(codigo),
      nombre: nombre,
      telefono: colTel >= 0 ? String(rows[i][colTel] || '') : '',
      fidelidad: _cajaFidelidadFila_(rows[i], headers, reglasFidelidad),
      meses: _cajaMesesCliente_(rows[i], headers, reglasFidelidad)
    });
  }
  return clientes;
}

function _cajaEsMarca_(nombre) {
  if (typeof _esEncabezadoMarca === 'function') return _esEncabezadoMarca(nombre);
  return /^[A-ZÁÉÍÓÚÑ0-9 .&()+\-/]{2,}$/.test(String(nombre || '').trim());
}

function _cajaCatalogoSuplementos_(ss) {
  var hoja = ss.getSheetByName('SUPLEMENTOS');
  if (!hoja || hoja.getLastRow() < 2) return [];
  var rows = hoja.getDataRange().getValues();
  var cols = (typeof _columnasCatalogoSuplementos === 'function')
    ? _columnasCatalogoSuplementos(rows)
    : { filaHeader: 1, producto: 0, contado: 1, lista: 4, stock: 3, sku: -1 };
  var marca = '';
  var productos = [];
  for (var i = cols.filaHeader + 1; i < rows.length; i++) {
    var nombre = String(rows[i][cols.producto] || '').trim();
    if (!nombre) continue;
    var contado = Number(rows[i][cols.contado]) || 0;
    var lista = cols.lista >= 0 ? (Number(rows[i][cols.lista]) || 0) : 0;
    var stock = Number(rows[i][cols.stock]) || 0;
    // Un producto puede estar escrito en mayusculas. Solo es encabezado de marca
    // cuando ademas no tiene ningun precio cargado.
    if (contado <= 0 && lista <= 0 && _cajaEsMarca_(nombre)) { marca = nombre; continue; }
    if (contado <= 0 && lista <= 0) continue;
    if (lista <= 0) lista = (typeof _calcularPrecioListaTresCuotas === 'function')
      ? Number(_calcularPrecioListaTresCuotas(contado)) || contado : contado;
    productos.push({
      id: 'SUP:' + (i + 1), tipo: 'SUP', fila: i + 1,
      sku: cols.sku >= 0 ? String(rows[i][cols.sku] || '').trim() : '',
      nombre: nombre, detalle: nombre, marca: marca,
      precioContado: contado || lista, precioLista: lista || contado, stock: stock,
      colStock: cols.stock + 1
    });
  }
  return productos;
}

function _cajaExtraerTalle_(nombre) {
  if (typeof extraerTalle === 'function') return extraerTalle(nombre);
  var texto = String(nombre || '').trim();
  var match = texto.match(/\s+(T\/?U|XXXL|XXL|XL|L|M|S)$/i);
  return match ? { base: texto.slice(0, match.index).trim(), talle: match[1].toUpperCase() } : { base: texto, talle: '' };
}

function _cajaCatalogoIndumentaria_(ss) {
  var hoja = ss.getSheetByName('INDUMENTARIA');
  if (!hoja || hoja.getLastRow() < 3) return [];
  var rows = hoja.getDataRange().getValues();
  var marca = '', base = '', talle = '', codigo = '';
  var productos = [];
  for (var i = 2; i < rows.length; i++) {
    var row = rows[i];
    var codFila = String(row[0] || '').trim();
    var nombre = String(row[1] || '').trim();
    var color = String(row[2] || '').trim();
    var contado = Number(row[3]) || 0;
    var lista = Number(row[4]) || 0;
    var stock = Number(row[5]) || 0;
    if (nombre && contado === 0 && lista === 0) {
      var encabezado = _cajaNorm_(nombre);
      if (encabezado === 'hombre' || encabezado === 'hombres' || encabezado === 'mujer' || encabezado === 'mujeres') {
        marca = ''; base = ''; talle = ''; codigo = ''; continue;
      }
      marca = nombre; base = ''; talle = ''; codigo = ''; continue;
    }
    if (codFila) codigo = codFila;
    if (nombre) {
      var parsed = _cajaExtraerTalle_(nombre);
      base = parsed.base;
      talle = parsed.talle;
    }
    if (!base || (contado <= 0 && lista <= 0)) continue;
    if (lista <= 0) lista = (typeof _calcularPrecioListaTresCuotas === 'function')
      ? Number(_calcularPrecioListaTresCuotas(contado)) || contado : contado;
    var partes = [base];
    if (talle) partes.push('Talle ' + talle);
    if (color) partes.push(color);
    productos.push({
      id: 'IND:' + (i + 1), tipo: 'IND', fila: i + 1, sku: codigo,
      nombre: base, detalle: partes.join(' · '), marca: marca,
      precioContado: contado || lista, precioLista: lista || contado,
      stock: stock, colStock: 6, talle: talle, color: color
    });
  }
  return productos;
}

function _cajaCatalogo_() {
  var ss = _getSS();
  return _cajaCatalogoSuplementos_(ss).concat(_cajaCatalogoIndumentaria_(ss));
}

function obtenerDatosCajaMaxup(sesionCaja) {
  _validarSesionCaja_(sesionCaja);
  var fidelidadPct = (typeof _configNumeroMaxup === 'function')
    ? _configNumeroMaxup('PROMO_DESCUENTO', PROMO_DESCUENTO) : PROMO_DESCUENTO;
  var promoMinimo = (typeof _configNumeroMaxup === 'function')
    ? _configNumeroMaxup('PROMO_MINIMO', PROMO_MINIMO) : PROMO_MINIMO;
  var promoMeses = (typeof _configNumeroMaxup === 'function')
    ? _configNumeroMaxup('PROMO_MESES', PROMO_MESES) : PROMO_MESES;
  return {
    ok: true,
    productos: _cajaCatalogo_(),
    clientes: _cajaClientes_(),
    descuentosMonto: _cajaDescuentosMonto_(),
    fidelidadPct: fidelidadPct,
    promoMinimo: promoMinimo,
    promoMeses: promoMeses,
    negocio: { nombre: 'MAXUP Suplementos', telefono: '3876233406', direccion: 'General Güemes, Salta' }
  };
}

function _cajaCalcular_(items, clienteCodigo) {
  var base = items.reduce(function(suma, item) { return suma + item.precio * item.cantidad; }, 0);
  var escala = null;
  var escalas = _cajaDescuentosMonto_();
  for (var i = 0; i < escalas.length; i++) {
    if (base >= escalas[i].minimo) { escala = escalas[i]; break; }
  }
  var despuesMonto = escala ? Math.round(base * (1 - escala.pct)) : base;
  var fidelidad = false;
  if (clienteCodigo) {
    var hoja = _getSS().getSheetByName('CLIENTES');
    if (hoja && hoja.getLastRow() > 1) {
      var rows = hoja.getDataRange().getValues();
      fidelidad = _cajaFidelidadDesdeRows_(clienteCodigo, rows, rows[0]);
    }
  }
  var fidelidadPct = (typeof _configNumeroMaxup === 'function')
    ? _configNumeroMaxup('PROMO_DESCUENTO', PROMO_DESCUENTO) : PROMO_DESCUENTO;
  var total = fidelidad ? Math.round(despuesMonto * (1 - fidelidadPct)) : despuesMonto;
  return {
    subtotal: base,
    descuentoMonto: base - despuesMonto,
    escala: escala,
    fidelidad: fidelidad,
    fidelidadPct: fidelidadPct,
    descuentoFidelidad: despuesMonto - total,
    descuentoTotal: base - total,
    total: total
  };
}

function _cajaBuscarCliente_(codigo) {
  if (!codigo) return null;
  var hoja = _getSS().getSheetByName('CLIENTES');
  if (!hoja || hoja.getLastRow() < 2) return null;
  var rows = hoja.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(codigo)) {
      return { codigo: String(rows[i][0]), nombre: String(rows[i][1] || ''), telefono: String(rows[i][2] || ''), fila: i + 1 };
    }
  }
  return null;
}

function _cajaCrearCliente_(datos) {
  datos = datos || {};
  var nombre = String(datos.nombre || '').trim().slice(0, 120);
  var telefono = String(datos.telefono || '').trim().slice(0, 40);
  if (!nombre) throw new Error('Escribí el nombre del nuevo cliente');
  var hoja = _getSS().getSheetByName('CLIENTES');
  if (!hoja) throw new Error('Hoja CLIENTES no encontrada');
  var rows = hoja.getDataRange().getValues();
  var codigos = rows.slice(1).map(function(row) { return Number(row[0]); })
    .filter(function(codigo) { return isFinite(codigo) && codigo > 0; });
  var codigo = codigos.length ? Math.max.apply(null, codigos) + 1 : 101;
  hoja.appendRow([codigo, nombre, telefono]);
  var fila = hoja.getLastRow();
  hoja.getRange(fila, 1, 1, 3).setBackground(null).setFontColor(null);
  return { codigo: String(codigo), nombre: nombre, telefono: telefono, fila: fila, nuevo: true };
}

function _cajaAplicarFormatoFilasVenta_(hojaVD, filaInicio, cantidad) {
  if (cantidad <= 0) return;
  hojaVD.getRange(filaInicio, 1, cantidad, 9)
    .setBackground('#ffffff').setFontColor('#000000')
    .setFontWeight('normal').setFontStyle('normal').setFontFamily('Arial')
    .setFontSize(10).setVerticalAlignment('middle').setWrap(false)
    .setBorder(false, false, false, false, false, false);
  hojaVD.getRange(filaInicio, 1, cantidad, 1)
    .setNumberFormat('dd/MM/yyyy HH:mm:ss').setHorizontalAlignment('right');
  hojaVD.getRange(filaInicio, 2, cantidad, 2)
    .setNumberFormat('@').setHorizontalAlignment('left');
  hojaVD.getRange(filaInicio, 4, cantidad, 3)
    .setNumberFormat('0').setHorizontalAlignment('right');
  hojaVD.getRange(filaInicio, 7, cantidad, 3)
    .setNumberFormat('@').setHorizontalAlignment('left');
}

// Inserta todas las líneas de una compra juntas y actualiza el total con una
// sola lectura de VentasDiarias. Es especialmente importante en compras de
// varios artículos.
function _cajaInsertarVentaBatch_(hojaVD, filas, fechaStr, totalVenta) {
  if (!filas.length) return;
  var lastRow = hojaVD.getLastRow();
  var rows = lastRow > 0 ? hojaVD.getRange(1, 1, lastRow, 6).getValues() : [];
  var totalLabel = 'TOTAL ' + fechaStr;
  var idxTotal = -1;
  var totalAnterior = 0;
  for (var r = 0; r < rows.length; r++) {
    var primera = rows[r][0];
    if (String(primera).indexOf(totalLabel) === 0) idxTotal = r;
    if (!primera || typeof primera === 'string') continue;
    try {
      var fechaFila = Utilities.formatDate(new Date(primera), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
      if (fechaFila === fechaStr) totalAnterior += Number(rows[r][5]) || 0;
    } catch (eFecha) {}
  }

  var filaInicio;
  var filaTotal;
  if (idxTotal >= 0) {
    filaInicio = idxTotal + 1;
    hojaVD.insertRowsBefore(filaInicio, filas.length);
    filaTotal = filaInicio + filas.length;
  } else {
    filaInicio = Math.max(lastRow + 1, 2);
    filaTotal = filaInicio + filas.length;
  }
  hojaVD.getRange(filaInicio, 1, filas.length, 9).setValues(filas);
  _cajaAplicarFormatoFilasVenta_(hojaVD, filaInicio, filas.length);

  if (idxTotal >= 0) {
    hojaVD.getRange(filaTotal, 6).setValue(totalAnterior + totalVenta);
    _aplicarFormatoFilaTotal(hojaVD, filaTotal);
  } else {
    hojaVD.getRange(filaTotal, 1, 1, 9)
      .setValues([[totalLabel, '', '', '', '', totalAnterior + totalVenta, '', '', '']]);
    _aplicarFormatoFilaTotal(hojaVD, filaTotal);
  }
}

function _cajaDescontarStockDetalladoBatch_(items) {
  var suplementos = items.filter(function(item) { return item.tipo === 'SUP'; });
  if (!suplementos.length || typeof _normNombreSD !== 'function') return;
  var hoja = _getSS().getSheetByName('STOCK_DETALLADO');
  if (!hoja || hoja.getLastRow() < 2) return;
  var datos = hoja.getDataRange().getValues();
  suplementos.forEach(function(item) {
    var nombre = _normNombreSD(item.nombre);
    var marca = _normNombreSD(item.marca);
    if (!nombre || !marca) return;
    var lotes = [];
    for (var i = 1; i < datos.length; i++) {
      if (_normNombreSD(datos[i][0]) !== nombre || _normNombreSD(datos[i][1]) !== marca) continue;
      var stock = Number(datos[i][4]) || 0;
      if (stock > 0) lotes.push({ indice: i, stock: stock, venc: datos[i][2] });
    }
    lotes.sort(function(a, b) { return new Date(a.venc) - new Date(b.venc); });
    var pendiente = item.cantidad;
    for (var l = 0; l < lotes.length && pendiente > 0; l++) {
      var descuento = Math.min(lotes[l].stock, pendiente);
      datos[lotes[l].indice][4] = lotes[l].stock - descuento;
      pendiente -= descuento;
    }
  });
  hoja.getRange(2, 5, datos.length - 1, 1).setValues(datos.slice(1).map(function(row) { return [row[4]]; }));
}

function _cajaRegistrarMovimientosBatch_(movimientos) {
  if (!movimientos.length || typeof _asegurarHojaMovimientosStock !== 'function') return;
  var hoja = _asegurarHojaMovimientosStock();
  hoja.getRange(hoja.getLastRow() + 1, 1, movimientos.length, 10).setValues(movimientos);
}

function actualizarDerivadosCajaMaxup(sesionCaja) {
  _validarSesionCaja_(sesionCaja);
  try { actualizarHojaReposicion(); } catch (eRepo) { Logger.log('Reposición diferida: ' + eRepo.message); }
  return { ok: true };
}

function _cajaHojaPendientes_() {
  var ss = _getSS();
  var hoja = ss.getSheetByName('VENTAS_PENDIENTES');
  if (!hoja) hoja = ss.insertSheet('VENTAS_PENDIENTES');
  if (hoja.getLastRow() === 0 || String(hoja.getRange(1, 1).getValue()) !== CAJA_PENDIENTE_HEADERS[0]) {
    hoja.getRange(1, 1, 1, CAJA_PENDIENTE_HEADERS.length).setValues([CAJA_PENDIENTE_HEADERS]);
    hoja.getRange(1, 1, 1, CAJA_PENDIENTE_HEADERS.length)
      .setBackground('#111827').setFontColor('#ffffff').setFontWeight('bold');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function _cajaPendienteDesdeFila_(row, fila) {
  var lineas = [];
  try { lineas = JSON.parse(String(row[7] || '[]')); } catch (eJson) {}
  return {
    fila: fila, id: String(row[0] || ''), fecha: row[1] instanceof Date ? row[1].toISOString() : String(row[1] || ''),
    clienteCodigo: String(row[2] || ''), cliente: String(row[3] || 'Consumidor final'),
    telefono: String(row[4] || ''), pagoCodigo: String(row[5] || 'contado'), pago: String(row[6] || ''),
    lineas: lineas, subtotal: Number(row[8]) || 0, descuentoMonto: Number(row[9]) || 0,
    descuentoFidelidad: Number(row[10]) || 0, total: Number(row[11]) || 0,
    notas: String(row[12] || ''), estado: String(row[13] || 'PENDIENTE')
  };
}

function _cajaLeerPendientes_(soloAbiertas) {
  var hoja = _cajaHojaPendientes_();
  if (hoja.getLastRow() < 2) return [];
  var rows = hoja.getRange(2, 1, hoja.getLastRow() - 1, CAJA_PENDIENTE_HEADERS.length).getValues();
  var salida = [];
  rows.forEach(function(row, i) {
    var venta = _cajaPendienteDesdeFila_(row, i + 2);
    if (!venta.id || (soloAbiertas && venta.estado !== 'PENDIENTE')) return;
    salida.push(venta);
  });
  return salida;
}

function listarVentasPendientesCajaMaxup(sesionCaja) {
  _validarSesionCaja_(sesionCaja);
  var ventas = _cajaLeerPendientes_(true).sort(function(a, b) { return new Date(b.fecha) - new Date(a.fecha); });
  return {
    ok: true, ventas: ventas,
    cantidad: ventas.length,
    total: ventas.reduce(function(s, venta) { return s + venta.total; }, 0)
  };
}

function _cajaDatosVentaRapida_(datos, catalogo, cliente, pago, pagoLabel) {
  var cantidades = {};
  (Array.isArray(datos.items) ? datos.items : []).forEach(function(item) {
    var id = String(item.id || '');
    cantidades[id] = (cantidades[id] || 0) + Math.max(1, Math.floor(Number(item.cantidad) || 1));
  });
  if (!Object.keys(cantidades).length) throw new Error('Agregá al menos un producto');
  var mapa = {};
  catalogo.forEach(function(p) { mapa[p.id] = p; });
  var items = [];
  Object.keys(cantidades).forEach(function(id) {
    var actual = mapa[id];
    if (!actual) throw new Error('Un producto cambió o ya no existe. Actualizá la caja.');
    actual.cantidad = cantidades[id];
    actual.precio = pago === 'tarjeta' ? actual.precioLista : actual.precioContado;
    if (actual.precio <= 0) throw new Error('Falta el precio de ' + actual.detalle);
    items.push(actual);
  });
  var calculo = _cajaCalcular_(items, cliente ? cliente.codigo : '');
  var restante = calculo.total;
  var lineas = items.map(function(item, indice) {
    var baseLinea = item.precio * item.cantidad;
    var ingreso = indice === items.length - 1 ? restante : Math.round(calculo.total * baseLinea / calculo.subtotal);
    restante -= ingreso;
    return {
      id: item.id, tipo: item.tipo, fila: item.fila, colStock: item.colStock, sku: item.sku || '',
      nombre: item.detalle, nombreStock: item.nombre, marca: item.marca, cantidad: item.cantidad,
      precio: item.precio, subtotal: baseLinea, ingreso: ingreso
    };
  });
  return { items: items, lineas: lineas, calculo: calculo, pago: pagoLabel };
}

function guardarVentaPendienteCajaMaxup(datos, sesionCaja) {
  _validarSesionCaja_(sesionCaja);
  datos = datos || {};
  var idEdicion = String(datos.pendienteId || '').trim();
  var operacion = idEdicion || String(datos.operacion || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
  if (!operacion) throw new Error('Falta el identificador de la venta');
  var pago = String(datos.pago || 'contado');
  if (['contado','transferencia','debito','tarjeta'].indexOf(pago) < 0) throw new Error('Forma de pago no válida');
  var pagoLabel = { contado:'Efectivo', transferencia:'Transferencia', debito:'Tarjeta de débito', tarjeta:'Tarjeta de crédito' }[pago];

  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (eLock) { throw new Error('La caja está ocupada. Reintentá en unos segundos.'); }
  try {
    var hojaPend = _cajaHojaPendientes_();
    var pendientes = _cajaLeerPendientes_(false);
    var anterior = null;
    for (var p = 0; p < pendientes.length; p++) if (pendientes[p].id === operacion) anterior = pendientes[p];
    if (!idEdicion && anterior) {
      return { ok: true, duplicado: true, pendiente: true, operacion: operacion, mensaje: 'La venta rápida ya estaba guardada.' };
    }
    if (idEdicion && (!anterior || anterior.estado !== 'PENDIENTE')) throw new Error('La venta pendiente ya fue cerrada o eliminada');

    var clienteCodigo = String(datos.clienteCodigo || '').trim();
    var cliente = clienteCodigo ? _cajaBuscarCliente_(clienteCodigo) : null;
    if (clienteCodigo && !cliente) throw new Error('El cliente seleccionado ya no existe');
    if (!cliente && datos.nuevoCliente) cliente = _cajaCrearCliente_(datos.nuevoCliente);

    var catalogo = _cajaCatalogo_();
    var preparada = _cajaDatosVentaRapida_(datos, catalogo, cliente, pago, pagoLabel);
    var mapa = {};
    catalogo.forEach(function(prod) { mapa[prod.id] = prod; });
    var viejas = {};
    if (anterior) anterior.lineas.forEach(function(linea) { viejas[linea.id] = Number(linea.cantidad) || 0; });
    var nuevas = {};
    preparada.lineas.forEach(function(linea) { nuevas[linea.id] = Number(linea.cantidad) || 0; });
    var ids = {};
    Object.keys(viejas).forEach(function(id) { ids[id] = true; });
    Object.keys(nuevas).forEach(function(id) { ids[id] = true; });
    var ajustes = [];

    Object.keys(ids).forEach(function(id) {
      var producto = mapa[id];
      if (!producto) throw new Error('Un producto de la venta ya no existe: ' + id);
      var delta = (nuevas[id] || 0) - (viejas[id] || 0);
      if (delta > producto.stock) throw new Error('Stock insuficiente para ' + producto.detalle + '. Disponible adicional: ' + producto.stock);
      ajustes.push({ producto: producto, delta: delta, nuevoStock: producto.stock - delta });
    });
    ajustes.forEach(function(ajuste) {
      var hojaStock = ajuste.producto.tipo === 'IND' ? _getSS().getSheetByName('INDUMENTARIA') : _getSS().getSheetByName('SUPLEMENTOS');
      hojaStock.getRange(ajuste.producto.fila, ajuste.producto.colStock).setValue(ajuste.nuevoStock);
    });

    preparada.lineas.forEach(function(linea) {
      var ajuste = ajustes.filter(function(a) { return a.producto.id === linea.id; })[0];
      var viejo = viejas[linea.id] || 0;
      linea.stockAntes = ajuste ? ajuste.producto.stock + viejo : 0;
      linea.stockDespues = ajuste ? ajuste.nuevoStock : 0;
    });
    var fecha = anterior ? new Date(anterior.fecha) : new Date();
    if (isNaN(fecha.getTime())) fecha = new Date();
    var notas = String(datos.notas || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 200);
    var fila = [[
      operacion, fecha, cliente ? cliente.codigo : '', cliente ? cliente.nombre : 'Consumidor final',
      cliente ? (cliente.telefono || '') : '', pago, pagoLabel, JSON.stringify(preparada.lineas),
      preparada.calculo.subtotal, preparada.calculo.descuentoMonto, preparada.calculo.descuentoFidelidad,
      preparada.calculo.total, notas, 'PENDIENTE', ''
    ]];
    if (anterior) hojaPend.getRange(anterior.fila, 1, 1, CAJA_PENDIENTE_HEADERS.length).setValues(fila);
    else hojaPend.getRange(hojaPend.getLastRow() + 1, 1, 1, CAJA_PENDIENTE_HEADERS.length).setValues(fila);

    return {
      ok: true, pendiente: true, operacion: operacion, fecha: fecha.toISOString(), cliente: cliente,
      pago: pagoLabel, lineas: preparada.lineas, subtotal: preparada.calculo.subtotal,
      descuentoMonto: preparada.calculo.descuentoMonto, descuentoFidelidad: preparada.calculo.descuentoFidelidad,
      descuentoTotal: preparada.calculo.descuentoTotal, fidelidad: preparada.calculo.fidelidad,
      escala: preparada.calculo.escala, total: preparada.calculo.total,
      ajustes: ajustes.map(function(a) { return { id: a.producto.id, delta: a.delta, stock: a.nuevoStock }; }),
      mensaje: anterior ? 'Venta pendiente actualizada' : 'Venta rápida guardada'
    };
  } finally {
    lock.releaseLock();
  }
}

function cancelarVentaPendienteCajaMaxup(id, sesionCaja) {
  _validarSesionCaja_(sesionCaja);
  id = String(id || '').trim();
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (eLock) { throw new Error('La caja está ocupada. Reintentá.'); }
  try {
    var pendientes = _cajaLeerPendientes_(false);
    var venta = null;
    for (var i = 0; i < pendientes.length; i++) if (pendientes[i].id === id) venta = pendientes[i];
    if (!venta || venta.estado !== 'PENDIENTE') throw new Error('La venta pendiente ya no está disponible');
    var catalogo = _cajaCatalogo_(), mapa = {};
    catalogo.forEach(function(p) { mapa[p.id] = p; });
    var ajustes = [];
    venta.lineas.forEach(function(linea) {
      var producto = mapa[linea.id];
      if (!producto) throw new Error('No se pudo devolver el stock de ' + linea.nombre);
      var cantidad = Number(linea.cantidad) || 0;
      var nuevoStock = producto.stock + cantidad;
      var hojaStock = producto.tipo === 'IND' ? _getSS().getSheetByName('INDUMENTARIA') : _getSS().getSheetByName('SUPLEMENTOS');
      hojaStock.getRange(producto.fila, producto.colStock).setValue(nuevoStock);
      ajustes.push({ id: producto.id, delta: -cantidad, stock: nuevoStock });
    });
    var hoja = _cajaHojaPendientes_();
    hoja.getRange(venta.fila, 14, 1, 2).setValues([['CANCELADA', new Date()]]);
    return { ok: true, ajustes: ajustes, mensaje: 'Venta cancelada y stock devuelto' };
  } finally { lock.releaseLock(); }
}

function cerrarJornadaCajaMaxup(sesionCaja) {
  _validarSesionCaja_(sesionCaja);
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (eLock) { throw new Error('La caja está ocupada. Reintentá.'); }
  try {
    var ventas = _cajaLeerPendientes_(true);
    if (!ventas.length) return { ok: true, cantidad: 0, total: 0, mensaje: 'No hay ventas pendientes' };
    var ss = _getSS(), hojaVD = ss.getSheetByName('VentasDiarias');
    if (!hojaVD) throw new Error('No se encontró VentasDiarias');
    var grupos = {}, detallado = [], movimientos = [], clientes = {}, totalGeneral = 0;
    ventas.forEach(function(venta) {
      var fecha = new Date(venta.fecha); if (isNaN(fecha.getTime())) fecha = new Date();
      var fechaStr = Utilities.formatDate(fecha, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
      if (!grupos[fechaStr]) grupos[fechaStr] = { filas: [], total: 0 };
      var nota = 'CAJA ' + venta.id + ' | ' + venta.pago + ' | CIERRE JORNADA' + (venta.notas ? ' | ' + venta.notas : '');
      venta.lineas.forEach(function(linea) {
        grupos[fechaStr].filas.push([
          fecha, linea.nombre, linea.marca, linea.cantidad,
          Number(linea.ingreso || 0) / Math.max(1, Number(linea.cantidad) || 1), linea.ingreso,
          venta.cliente, venta.pago, nota
        ]);
        detallado.push({ tipo: linea.tipo, nombre: linea.nombreStock || linea.nombre, marca: linea.marca, cantidad: linea.cantidad });
        movimientos.push([fecha, 'SALIDA', linea.sku || linea.id, linea.marca, linea.nombre,
          linea.cantidad, linea.stockAntes || '', linea.stockDespues || '', venta.id, 'cierre caja rápida']);
      });
      grupos[fechaStr].total += venta.total;
      totalGeneral += venta.total;
      if (venta.clienteCodigo) clientes[venta.clienteCodigo] = (clientes[venta.clienteCodigo] || 0) + venta.total;
    });
    Object.keys(grupos).forEach(function(fechaStr) {
      _cajaInsertarVentaBatch_(hojaVD, grupos[fechaStr].filas, fechaStr, grupos[fechaStr].total);
    });
    _cajaDescontarStockDetalladoBatch_(detallado);
    _cajaRegistrarMovimientosBatch_(movimientos);
    Object.keys(clientes).forEach(function(codigo) { _actualizarClienteMensual(codigo, clientes[codigo]); });
    var hojaPend = _cajaHojaPendientes_();
    ventas.forEach(function(venta) { hojaPend.getRange(venta.fila, 14, 1, 2).setValues([['CERRADA', new Date()]]); });
    try { actualizarHojaReposicion(); } catch (eRepo) {}
    try { if (typeof _registrarNotificacion === 'function') _registrarNotificacion('💵 CIERRE CAJA', ventas.length + ' ventas — ' + _cajaFmt_(totalGeneral)); } catch (eNotif) {}
    SpreadsheetApp.flush();
    return { ok: true, cantidad: ventas.length, total: totalGeneral, mensaje: 'Jornada cerrada correctamente' };
  } finally { lock.releaseLock(); }
}

function registrarVentaCajaMaxup(datos, sesionCaja) {
  _validarSesionCaja_(sesionCaja);
  datos = datos || {};
  var operacion = String(datos.operacion || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
  if (!operacion) throw new Error('Falta el identificador de la venta');
  var pago = String(datos.pago || 'contado');
  if (['contado','transferencia','debito','tarjeta'].indexOf(pago) < 0) throw new Error('Forma de pago no válida');
  var clienteCodigo = String(datos.clienteCodigo || '').trim();
  var cliente = clienteCodigo ? _cajaBuscarCliente_(clienteCodigo) : null;
  if (clienteCodigo && !cliente) throw new Error('El cliente seleccionado ya no existe');
  var nuevoCliente = !clienteCodigo && datos.nuevoCliente ? {
    nombre: String(datos.nuevoCliente.nombre || '').trim(),
    telefono: String(datos.nuevoCliente.telefono || '').trim()
  } : null;
  if (nuevoCliente && !nuevoCliente.nombre) throw new Error('Falta el nombre del nuevo cliente');
  var pedidos = Array.isArray(datos.items) ? datos.items : [];
  if (!pedidos.length) throw new Error('Agregá al menos un producto');

  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (eLock) { throw new Error('La caja está ocupada. Reintentá en unos segundos.'); }
  try {
    var ss = _getSS();
    var hojaVD = ss.getSheetByName('VentasDiarias');
    var hojaSup = ss.getSheetByName('SUPLEMENTOS');
    var hojaInd = ss.getSheetByName('INDUMENTARIA');
    if (!hojaVD || !hojaSup) throw new Error('Faltan las hojas de ventas o productos');

    // Idempotencia: si el navegador reintenta, no vuelve a descontar.
    if (hojaVD.getLastRow() > 1) {
      var notas = hojaVD.getRange(2, 9, hojaVD.getLastRow() - 1, 1).getDisplayValues();
      for (var n = 0; n < notas.length; n++) {
        if (String(notas[n][0] || '').indexOf(operacion) >= 0) {
          return { ok: true, duplicado: true, operacion: operacion, mensaje: 'La venta ya estaba aplicada.' };
        }
      }
    }

    var catalogo = _cajaCatalogo_();
    var mapa = {};
    catalogo.forEach(function(p) { mapa[p.id] = p; });
    var cantidades = {};
    pedidos.forEach(function(item) {
      var id = String(item.id || '');
      cantidades[id] = (cantidades[id] || 0) + Math.max(1, Math.floor(Number(item.cantidad) || 1));
    });
    var items = [];
    Object.keys(cantidades).forEach(function(id) {
      var actual = mapa[id];
      if (!actual) throw new Error('Un producto cambió o ya no existe. Actualizá la caja.');
      var cantidad = cantidades[id];
      if (cantidad > actual.stock) {
        throw new Error('Stock insuficiente para ' + actual.detalle + '. Disponible: ' + actual.stock);
      }
      var precio = pago === 'tarjeta' ? actual.precioLista : actual.precioContado;
      if (precio <= 0) throw new Error('Falta el precio de ' + actual.detalle);
      actual.cantidad = cantidad;
      actual.precio = precio;
      items.push(actual);
    });

    var calculo = _cajaCalcular_(items, clienteCodigo);
    if (calculo.total <= 0) throw new Error('El total de la venta no es válido');
    // El cliente nuevo se crea recién al confirmar una venta válida. Así no
    // quedan fichas vacías si se abandona un presupuesto.
    if (!cliente && nuevoCliente) {
      cliente = _cajaCrearCliente_(nuevoCliente);
      clienteCodigo = cliente.codigo;
    }
    var pagoLabel = { contado:'Efectivo', transferencia:'Transferencia', debito:'Tarjeta de débito', tarjeta:'Tarjeta de crédito' }[pago];
    var partesDesc = [];
    if (calculo.escala) partesDesc.push(calculo.escala.label || (Math.round(calculo.escala.pct * 100) + '% por monto'));
    if (calculo.fidelidad) partesDesc.push(Math.round(calculo.fidelidadPct * 100) + '% fidelidad');
    var notaBase = 'CAJA ' + operacion + ' | ' + pagoLabel + (partesDesc.length ? ' | ' + partesDesc.join(' + ') : '');
    var notaUsuario = String(datos.notas || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 200);
    if (notaUsuario) notaBase += ' | ' + notaUsuario;

    // Primero se validó todo; recién ahora se aplican los movimientos de stock.
    var movimientosStock = [];
    items.forEach(function(item) {
      var hoja = item.tipo === 'IND' ? hojaInd : hojaSup;
      if (!hoja) throw new Error('Falta la hoja INDUMENTARIA');
      var antes = Number(hoja.getRange(item.fila, item.colStock).getValue()) || 0;
      if (antes < item.cantidad) throw new Error('El stock cambió para ' + item.detalle + '. Actualizá la caja.');
      var despues = antes - item.cantidad;
      hoja.getRange(item.fila, item.colStock).setValue(despues);
      movimientosStock.push([new Date(), 'SALIDA', item.sku || item.id, item.marca, item.detalle,
        item.cantidad, antes, despues, operacion, 'caja rápida']);
    });
    _cajaDescontarStockDetalladoBatch_(items);
    _cajaRegistrarMovimientosBatch_(movimientosStock);

    var hoy = new Date();
    var fechaStr = Utilities.formatDate(hoy, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
    var restante = calculo.total;
    var lineas = [];
    var filasVenta = [];
    items.forEach(function(item, indice) {
      var baseLinea = item.precio * item.cantidad;
      var ingreso = indice === items.length - 1
        ? restante
        : Math.round(calculo.total * baseLinea / calculo.subtotal);
      restante -= ingreso;
      var precioEfectivo = ingreso / item.cantidad;
      filasVenta.push([
        hoy, item.detalle, item.marca, item.cantidad,
        precioEfectivo, ingreso, cliente ? cliente.nombre : 'Consumidor final', pagoLabel, notaBase
      ]);
      lineas.push({
        id: item.id, nombre: item.detalle, marca: item.marca, cantidad: item.cantidad,
        precio: item.precio, subtotal: baseLinea, ingreso: ingreso
      });
    });

    _cajaInsertarVentaBatch_(hojaVD, filasVenta, fechaStr, calculo.total);
    if (cliente) _actualizarClienteMensual(cliente.codigo, calculo.total);
    // REPOSICION es un informe derivado: se actualiza después desde el
    // navegador para que el cliente no tenga que esperar ese recálculo.
    try {
      if (typeof _registrarNotificacion === 'function') {
        _registrarNotificacion('💵 VENTA CAJA', (cliente ? cliente.nombre : 'Consumidor final') + ' — ' + _cajaFmt_(calculo.total));
      }
    } catch (eNotif) {}
    SpreadsheetApp.flush();

    return {
      ok: true, operacion: operacion, fecha: hoy.toISOString(), cliente: cliente,
      pago: pagoLabel, lineas: lineas,
      subtotal: calculo.subtotal, descuentoMonto: calculo.descuentoMonto,
      descuentoFidelidad: calculo.descuentoFidelidad, descuentoTotal: calculo.descuentoTotal,
      fidelidad: calculo.fidelidad, escala: calculo.escala, total: calculo.total,
      mensaje: 'Venta aplicada correctamente'
    };
  } finally {
    lock.releaseLock();
  }
}
