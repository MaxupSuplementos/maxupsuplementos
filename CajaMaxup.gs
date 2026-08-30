// ============================================================
// MAXUP — Caja rápida dentro de Google Sheets
// Presupuesto, carrito, clientes, descuentos y aplicación de ventas.
// ============================================================

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
  var html = HtmlService.createHtmlOutputFromFile('CajaMaxup')
    .setTitle('MAXUP · Caja rápida');
  SpreadsheetApp.getUi().showSidebar(html);
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
  var meses = (typeof _configNumeroMaxup === 'function') ? _configNumeroMaxup('PROMO_MESES', PROMO_MESES) : PROMO_MESES;
  var minimo = (typeof _configNumeroMaxup === 'function') ? _configNumeroMaxup('PROMO_MINIMO', PROMO_MINIMO) : PROMO_MINIMO;
  for (var m = 0; m < meses; m++) {
    var fecha = new Date(new Date().getFullYear(), new Date().getMonth() - m, 1);
    var col = _buscarColumnaMes(headers, fecha);
    if (col < 0 || (Number(fila[col]) || 0) < minimo) return false;
  }
  return true;
}

function _cajaMesesCliente_(fila, headers) {
  var meses = [];
  var cantidad = (typeof _configNumeroMaxup === 'function') ? _configNumeroMaxup('PROMO_MESES', PROMO_MESES) : PROMO_MESES;
  var minimo = (typeof _configNumeroMaxup === 'function') ? _configNumeroMaxup('PROMO_MINIMO', PROMO_MINIMO) : PROMO_MINIMO;
  for (var m = 0; m < cantidad; m++) {
    var fecha = new Date(new Date().getFullYear(), new Date().getMonth() - m, 1);
    var col = _buscarColumnaMes(headers, fecha);
    var monto = col >= 0 ? (Number(fila[col]) || 0) : 0;
    meses.push({ mes: _getMesHeader(fecha), monto: monto, cumple: monto >= minimo });
  }
  return meses;
}

function _cajaClientes_() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES');
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
  for (var i = 1; i < rows.length; i++) {
    var codigo = rows[i][0];
    var nombre = String(rows[i][1] || '').trim();
    if (codigo === '' || !nombre) continue;
    clientes.push({
      codigo: String(codigo),
      nombre: nombre,
      telefono: colTel >= 0 ? String(rows[i][colTel] || '') : '',
      fidelidad: _cajaFidelidadDesdeRows_(codigo, rows, headers),
      meses: _cajaMesesCliente_(rows[i], headers)
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return _cajaCatalogoSuplementos_(ss).concat(_cajaCatalogoIndumentaria_(ss));
}

function obtenerDatosCajaMaxup() {
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
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES');
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
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES');
  if (!hoja || hoja.getLastRow() < 2) return null;
  var rows = hoja.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(codigo)) {
      return { codigo: String(rows[i][0]), nombre: String(rows[i][1] || ''), fila: i + 1 };
    }
  }
  return null;
}

function _cajaCrearCliente_(datos) {
  datos = datos || {};
  var nombre = String(datos.nombre || '').trim().slice(0, 120);
  var telefono = String(datos.telefono || '').trim().slice(0, 40);
  if (!nombre) throw new Error('Escribí el nombre del nuevo cliente');
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES');
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

function registrarVentaCajaMaxup(datos) {
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
    var ss = SpreadsheetApp.getActiveSpreadsheet();
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
    items.forEach(function(item) {
      var hoja = item.tipo === 'IND' ? hojaInd : hojaSup;
      if (!hoja) throw new Error('Falta la hoja INDUMENTARIA');
      var antes = Number(hoja.getRange(item.fila, item.colStock).getValue()) || 0;
      if (antes < item.cantidad) throw new Error('El stock cambió para ' + item.detalle + '. Actualizá la caja.');
      var despues = antes - item.cantidad;
      hoja.getRange(item.fila, item.colStock).setValue(despues);
      if (item.tipo === 'SUP' && typeof descontarStockDetallado === 'function') {
        descontarStockDetallado(item.nombre, item.cantidad, item.marca);
      }
      if (typeof _registrarMovimientoStock === 'function') {
        _registrarMovimientoStock('SALIDA', item.sku || item.id, item.marca, item.detalle,
          item.cantidad, antes, despues, operacion, 'caja rápida');
      }
    });

    var hoy = new Date();
    var fechaStr = Utilities.formatDate(hoy, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
    var restante = calculo.total;
    var lineas = [];
    items.forEach(function(item, indice) {
      var baseLinea = item.precio * item.cantidad;
      var ingreso = indice === items.length - 1
        ? restante
        : Math.round(calculo.total * baseLinea / calculo.subtotal);
      restante -= ingreso;
      var precioEfectivo = ingreso / item.cantidad;
      _insertarFilaVenta(hojaVD, [
        hoy, item.detalle, item.marca, item.cantidad,
        precioEfectivo, ingreso, cliente ? cliente.nombre : 'Consumidor final', pagoLabel, notaBase
      ], fechaStr);
      lineas.push({
        id: item.id, nombre: item.detalle, marca: item.marca, cantidad: item.cantidad,
        precio: item.precio, subtotal: baseLinea, ingreso: ingreso
      });
    });

    _actualizarTotalDia(hojaVD, fechaStr);
    if (cliente) _actualizarClienteMensual(cliente.codigo, calculo.total);
    try { actualizarHojaReposicion(); } catch (eRepo) {}
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
