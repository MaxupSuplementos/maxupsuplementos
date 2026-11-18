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
    // La Caja sólo necesita las escalas; cargar la configuración pública
    // también lee y valida todos los cupones, aunque aquí no se usan.
    if (typeof _leerConfiguracionMaxup === 'function') {
      descuentos = JSON.parse(_leerConfiguracionMaxup().DESCUENTOS_MONTO_JSON || '[]');
    }
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

function _cajaFidelidadDesdeRows_(codigo, rows, headers, excluirOperacion) {
  if (!codigo || !rows || rows.length < 2) return false;
  var fila = null;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(codigo)) { fila = rows[i]; break; }
  }
  if (!fila) return false;
  return _fidelidadDisponible_(fila, headers, null, excluirOperacion);
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

function _cajaFidelidadFila_(fila, headers, reglas, usos) {
  reglas = reglas || _cajaReglasFidelidad_(headers);
  for (var m = 0; m < reglas.columnas.length; m++) {
    var col = reglas.columnas[m].col;
    if (col < 0 || (Number(fila[col]) || 0) < reglas.minimo) return false;
  }
  return _fidelidadDisponible_(fila, headers, usos);
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
  var usosFidelidad = _fidelidadUsosRecientes_();
  for (var i = 1; i < rows.length; i++) {
    var codigo = rows[i][0];
    var nombre = String(rows[i][1] || '').trim();
    if (codigo === '' || !nombre) continue;
    clientes.push({
      codigo: String(codigo),
      nombre: nombre,
      telefono: colTel >= 0 ? String(rows[i][colTel] || '') : '',
      fidelidad: _cajaFidelidadFila_(rows[i], headers, reglasFidelidad, usosFidelidad),
      meses: _cajaMesesCliente_(rows[i], headers, reglasFidelidad)
    });
  }
  return clientes;
}

function _cajaEsMarca_(nombre) {
  if (typeof _esEncabezadoMarca === 'function') return _esEncabezadoMarca(nombre);
  return /^[A-ZÁÉÍÓÚÑ0-9 .&()+\-/]{2,}$/.test(String(nombre || '').trim());
}

function _cajaValidarCatalogoSuplementos_(productos) {
  var porClave = {}, porSku = {}, porId = {}, errores = [];
  (productos || []).forEach(function(producto) {
    if (!producto || producto.tipo !== 'SUP') return;
    var clave = _cajaClaveStockDetallado_(producto.marca, producto.nombre);
    var sku = _cajaNorm_(producto.sku || '');
    var id = String(producto.id || '');
    if (porClave[clave]) {
      errores.push('producto repetido: ' + producto.marca + ' — ' + producto.nombre +
        ' (filas ' + porClave[clave].fila + ' y ' + producto.fila + ')');
    } else porClave[clave] = producto;
    if (sku && porSku[sku] && porSku[sku].id !== id) {
      errores.push('SKU repetido "' + producto.sku + '" en ' + porSku[sku].nombre + ' y ' + producto.nombre);
    } else if (sku) porSku[sku] = producto;
    if (id && porId[id]) {
      errores.push('identificador repetido en ' + porId[id].nombre + ' y ' + producto.nombre);
    } else if (id) porId[id] = producto;
  });
  if (errores.length) {
    throw new Error('La Caja no puede mezclar productos ambiguos. Corregí SUPLEMENTOS: ' + errores.slice(0, 5).join(' | '));
  }
  return { porClave: porClave, porSku: porSku, porId: porId };
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
    var sku = cols.sku >= 0 ? String(rows[i][cols.sku] || '').trim() : '';
    if (!sku && typeof _skuDeterministico === 'function') sku = _skuDeterministico(marca, nombre, 'SUP');
    productos.push({
      // El identificador ya no depende del número de fila. Así ordenar la hoja
      // no puede convertir una venta en otro producto distinto.
      id: 'SUPSKU:' + sku, tipo: 'SUP', fila: i + 1,
      sku: sku,
      nombre: nombre, detalle: nombre, marca: marca,
      precioContado: contado || lista, precioLista: lista || contado, stock: stock,
      colStock: cols.stock + 1
    });
  }
  _cajaValidarCatalogoSuplementos_(productos);
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

function _cajaResolverProducto_(catalogo, referencia) {
  referencia = referencia || {};
  var nombreRef = _cajaNorm_(referencia.nombreStock || referencia.nombre || referencia.detalle || '');
  var marcaRef = _cajaNorm_(referencia.marca || '');
  function coincideReferencia(producto) {
    if (!nombreRef || !marcaRef) return true;
    var nombreProducto = _cajaNorm_(producto.nombre || '');
    var detalleProducto = _cajaNorm_(producto.detalle || '');
    return (nombreProducto === nombreRef || detalleProducto === nombreRef) && _cajaNorm_(producto.marca || '') === marcaRef;
  }
  var id = String(referencia.id || '');
  var porId = id ? catalogo.filter(function(p) { return String(p.id || '') === id; }) : [];
  if (porId.length > 1) {
    var idExacto = porId.filter(coincideReferencia);
    if (idExacto.length === 1) return idExacto[0];
    throw new Error('Hay más de un producto con el identificador ' + id + '. Actualizá los SKU en SUPLEMENTOS.');
  }
  if (porId.length === 1 && coincideReferencia(porId[0])) return porId[0];
  var sku = _cajaNorm_(referencia.sku || '');
  if (sku) {
    var porSku = catalogo.filter(function(p) { return _cajaNorm_(p.sku || '') === sku; });
    if (porSku.length > 1) {
      var skuExacto = porSku.filter(coincideReferencia);
      if (skuExacto.length === 1) return skuExacto[0];
      throw new Error('El SKU ' + referencia.sku + ' pertenece a más de un producto. Corregilo en SUPLEMENTOS.');
    }
    if (porSku.length === 1 && coincideReferencia(porSku[0])) return porSku[0];
  }
  var nombre = nombreRef;
  var marca = marcaRef;
  if (nombre && marca) {
    var porNombreMarca = catalogo.filter(function(p) {
      var nombreCatalogo = _cajaNorm_(p.nombre || '');
      var detalleCatalogo = _cajaNorm_(p.detalle || '');
      return (nombreCatalogo === nombre || detalleCatalogo === nombre) && _cajaNorm_(p.marca) === marca;
    });
    if (porNombreMarca.length > 1) throw new Error('Hay más de un producto llamado "' + (referencia.nombreStock || referencia.nombre || referencia.detalle) + '" dentro de ' + referencia.marca + '.');
    if (porNombreMarca.length === 1) return porNombreMarca[0];
  }
  return null;
}

function _cajaCatalogoVista_() {
  var ss = _getSS();
  var productos = _cajaCatalogoSuplementos_(ss).concat(_cajaCatalogoIndumentaria_(ss));
  var hoja = ss.getSheetByName('STOCK_DETALLADO');
  if (!hoja || hoja.getLastRow() < 2) return productos;
  var totales = {};
  hoja.getRange(2, 1, hoja.getLastRow() - 1, 5).getValues().forEach(function(row) {
    var nombre = String(row[0] || '').trim();
    var marca = String(row[1] || '').trim();
    if (!nombre || !marca) return;
    var clave = _cajaClaveStockDetallado_(marca, nombre);
    totales[clave] = (totales[clave] || 0) + Math.max(0, Number(row[4]) || 0);
  });
  productos.forEach(function(producto) {
    if (producto.tipo !== 'SUP') return;
    var clave = _cajaClaveStockDetallado_(producto.marca, producto.nombre);
    if (Object.prototype.hasOwnProperty.call(totales, clave)) producto.stock = totales[clave];
  });
  return productos;
}

function obtenerCatalogoCajaMaxup(sesionCaja) {
  _validarSesionCaja_(sesionCaja);
  var fidelidadPct = (typeof _configNumeroMaxup === 'function')
    ? _configNumeroMaxup('PROMO_DESCUENTO', PROMO_DESCUENTO) : PROMO_DESCUENTO;
  var promoMinimo = (typeof _configNumeroMaxup === 'function')
    ? _configNumeroMaxup('PROMO_MINIMO', PROMO_MINIMO) : PROMO_MINIMO;
  var promoMeses = (typeof _configNumeroMaxup === 'function')
    ? _configNumeroMaxup('PROMO_MESES', PROMO_MESES) : PROMO_MESES;
  return {
    ok: true,
    productos: _cajaCatalogoVista_(),
    descuentosMonto: _cajaDescuentosMonto_(),
    fidelidadPct: fidelidadPct,
    promoMinimo: promoMinimo,
    promoMeses: promoMeses,
    negocio: { nombre: 'MAXUP Suplementos', telefono: '3876233406', direccion: 'General Güemes, Salta' }
  };
}

function obtenerClientesCajaMaxup(sesionCaja) {
  _validarSesionCaja_(sesionCaja);
  return { ok: true, clientes: _cajaClientes_() };
}

function obtenerDatosCajaMaxup(sesionCaja) {
  var datos = obtenerCatalogoCajaMaxup(sesionCaja);
  datos.clientes = _cajaClientes_();
  return datos;
}

function _cajaCalcular_(items, clienteCodigo, excluirOperacion) {
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
      fidelidad = _cajaFidelidadDesdeRows_(clienteCodigo, rows, rows[0], excluirOperacion);
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

function _cajaClaveStockDetallado_(marca, nombre) {
  var normalizar = typeof _normNombreSD === 'function' ? _normNombreSD : _cajaNorm_;
  return normalizar(marca) + '||' + normalizar(nombre);
}

function _cajaFechaLote_(valor) {
  if (!valor) return 8640000000000000;
  var fecha = valor instanceof Date ? valor : new Date(valor);
  return isNaN(fecha.getTime()) ? 8640000000000000 : fecha.getTime();
}

// STOCK_DETALLADO deja de descontarse "a ciegas". Después de cada reserva,
// cancelación o venta se lleva al mismo stock que la fila principal. Esto hace
// que un reintento sea idempotente y evita que un producto sin lote se omita
// silenciosamente: en ese caso se crea un registro sin vencimiento.
function _cajaSincronizarStockDetalladoBatch_(items) {
  var suplementos = (items || []).filter(function(item) { return item && item.tipo === 'SUP'; });
  if (!suplementos.length) return { actualizados: 0, creados: 0, reparados: [] };

  var ss = _getSS();
  var hoja = ss.getSheetByName('STOCK_DETALLADO');
  if (!hoja) {
    hoja = ss.insertSheet('STOCK_DETALLADO');
    hoja.getRange(1, 1, 1, 5).setValues([['Producto','Marca','Vencimiento','Stock Inicial','Stock Actual']]);
  }
  var catalogo = _cajaCatalogoSuplementos_(ss);
  var principales = {};
  catalogo.forEach(function(producto) {
    var clavePrincipal = _cajaClaveStockDetallado_(producto.marca, producto.nombre);
    if (principales[clavePrincipal] && principales[clavePrincipal].id !== producto.id) {
      throw new Error('Producto ambiguo en SUPLEMENTOS: ' + producto.marca + ' — ' + producto.nombre);
    }
    principales[clavePrincipal] = producto;
  });

  var objetivos = {};
  suplementos.forEach(function(item) {
    var nombre = String(item.nombreStock || item.nombre || item.detalle || '').trim();
    var marca = String(item.marca || '').trim();
    var clave = _cajaClaveStockDetallado_(marca, nombre);
    if (!nombre || !marca || clave === '||') return;
    var principal = principales[clave];
    var valor = Number(item.stockDespues);
    if (!isFinite(valor) && principal) valor = Number(principal.stock);
    if (!isFinite(valor)) return;
    if (objetivos[clave]) {
      var skuAnterior = _cajaNorm_(objetivos[clave].sku || '');
      var skuNuevo = _cajaNorm_(item.sku || '');
      if (skuAnterior && skuNuevo && skuAnterior !== skuNuevo) {
        throw new Error('La venta contiene dos productos distintos que intentan modificar ' + marca + ' — ' + nombre + '.');
      }
    }
    objetivos[clave] = { nombre: nombre, marca: marca, sku: item.sku || (principal ? principal.sku : ''), stock: Math.max(0, Math.floor(valor)) };
  });
  if (!Object.keys(objetivos).length) return { actualizados: 0, creados: 0, reparados: [] };

  var datos = hoja.getLastRow() > 0 ? hoja.getDataRange().getValues() : [];
  if (!datos.length) datos = [['Producto','Marca','Vencimiento','Stock Inicial','Stock Actual']];
  var actualizados = 0, nuevos = [], reparados = [];

  Object.keys(objetivos).forEach(function(clave) {
    var objetivo = objetivos[clave];
    var lotes = [];
    for (var i = 1; i < datos.length; i++) {
      if (_cajaClaveStockDetallado_(datos[i][1], datos[i][0]) !== clave) continue;
      lotes.push({ indice: i, stock: Math.max(0, Number(datos[i][4]) || 0), venc: datos[i][2] });
    }
    if (!lotes.length) {
      nuevos.push([objetivo.nombre, objetivo.marca, '', objetivo.stock, objetivo.stock]);
      reparados.push(objetivo.marca + ' — ' + objetivo.nombre + ' (se creó control sin vencimiento)');
      return;
    }

    var total = lotes.reduce(function(suma, lote) { return suma + lote.stock; }, 0);
    var diferencia = objetivo.stock - total;
    if (!diferencia) return;
    lotes.sort(function(a, b) { return _cajaFechaLote_(a.venc) - _cajaFechaLote_(b.venc) || a.indice - b.indice; });
    if (diferencia < 0) {
      var quitar = -diferencia;
      for (var l = 0; l < lotes.length && quitar > 0; l++) {
        var baja = Math.min(lotes[l].stock, quitar);
        datos[lotes[l].indice][4] = lotes[l].stock - baja;
        quitar -= baja;
      }
    } else {
      // Una cancelación repone primero el mismo lote FIFO que se había consumido.
      datos[lotes[0].indice][4] = lotes[0].stock + diferencia;
    }
    actualizados++;
    reparados.push(objetivo.marca + ' — ' + objetivo.nombre + ': ' + total + ' → ' + objetivo.stock);
  });

  if (datos.length > 1 && actualizados) {
    hoja.getRange(2, 5, datos.length - 1, 1).setValues(datos.slice(1).map(function(row) { return [row[4]]; }));
  }
  if (nuevos.length) hoja.getRange(hoja.getLastRow() + 1, 1, nuevos.length, 5).setValues(nuevos);
  if (reparados.length && typeof _registrarAuditoria === 'function') {
    _registrarAuditoria('STOCK SINCRONIZADO', reparados.slice(0, 30).join(' | '), 'Caja rápida');
  }
  return { actualizados: actualizados, creados: nuevos.length, reparados: reparados };
}

// Nombre anterior conservado por compatibilidad con llamadas históricas.
function _cajaDescontarStockDetalladoBatch_(items) {
  return _cajaSincronizarStockDetalladoBatch_(items);
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

function _cajaDatosVentaRapida_(datos, catalogo, cliente, pago, pagoLabel, excluirOperacion) {
  var cantidades = {};
  (Array.isArray(datos.items) ? datos.items : []).forEach(function(item) {
    var producto = _cajaResolverProducto_(catalogo, item);
    if (!producto) throw new Error('Un producto cambió de lugar o ya no existe. Actualizá la caja y volvé a elegirlo.');
    cantidades[producto.id] = (cantidades[producto.id] || 0) + Math.max(1, Math.floor(Number(item.cantidad) || 1));
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
  var calculo = _cajaCalcular_(items, cliente ? cliente.codigo : '', excluirOperacion);
  if (datos.cajaV2Exacto === true) {
    var subtotalExacto = Math.max(0, Math.round(Number(datos.subtotalMostrado) || 0));
    var descuentoFidelidadExacto = Math.max(0, Math.round(Number(datos.descuentoFidelidadMostrado) || 0));
    var descuentoPromocionExacto = Math.max(0, Math.round(Number(datos.descuentoPromocionMostrado) || 0));
    var totalExacto = Math.max(0, Math.round(Number(datos.totalMostrado) || 0));
    var descuentoTotalExacto = descuentoFidelidadExacto + descuentoPromocionExacto;
    if (subtotalExacto <= 0 || descuentoTotalExacto > subtotalExacto || totalExacto !== subtotalExacto - descuentoTotalExacto) {
      throw new Error('El subtotal o los descuentos de Caja V2 no coinciden. Actualizá la caja y reintentá.');
    }
    calculo = {
      subtotal: subtotalExacto,
      descuentoMonto: 0,
      escala: null,
      fidelidad: descuentoFidelidadExacto > 0,
      fidelidadPct: subtotalExacto ? descuentoFidelidadExacto / subtotalExacto : 0,
      descuentoFidelidad: descuentoFidelidadExacto,
      descuentoPromocion: descuentoPromocionExacto,
      promocionCodigo: String(datos.descuentoPromocionCodigo || '').trim(),
      promocionNombre: String(datos.descuentoPromocionNombre || '').trim(),
      promocionPct: Math.max(0, Number(datos.descuentoPromocionPct) || 0),
      descuentoTotal: descuentoTotalExacto,
      total: totalExacto
    };
  }
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

    _cajaReconciliarPrincipalAntesDeVender_();
    var catalogo = _cajaCatalogo_();
    var preparada = _cajaDatosVentaRapida_(datos, catalogo, cliente, pago, pagoLabel, idEdicion ? operacion : '');
    if (datos.totalMostrado != null && Number(datos.totalMostrado) !== preparada.calculo.total) {
      throw new Error('El total cambió (el 10% pudo haberse usado en otra compra). Actualizá la caja y confirmá el importe nuevo.');
    }
    var mapa = {};
    catalogo.forEach(function(prod) { mapa[prod.id] = prod; });
    var viejas = {};
    if (anterior) anterior.lineas.forEach(function(linea) {
      var productoAnterior = _cajaResolverProducto_(catalogo, linea);
      if (!productoAnterior) throw new Error('No se pudo identificar ' + linea.nombre + '. Actualizá la caja.');
      viejas[productoAnterior.id] = (viejas[productoAnterior.id] || 0) + (Number(linea.cantidad) || 0);
    });
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

    var controlStock = _cajaSincronizarStockDetalladoBatch_(ajustes.map(function(ajuste) {
      return {
        tipo: ajuste.producto.tipo, nombre: ajuste.producto.nombre, marca: ajuste.producto.marca,
        stockDespues: ajuste.nuevoStock
      };
    }));
    _cajaRegistrarMovimientosBatch_(ajustes.filter(function(ajuste) { return ajuste.delta !== 0; }).map(function(ajuste) {
      return [new Date(), ajuste.delta > 0 ? 'SALIDA' : 'ENTRADA', ajuste.producto.sku || ajuste.producto.id,
        ajuste.producto.marca, ajuste.producto.detalle, Math.abs(ajuste.delta), ajuste.producto.stock,
        ajuste.nuevoStock, operacion, ajuste.delta > 0 ? 'caja rápida pendiente' : 'edición caja rápida pendiente'];
    }));

    preparada.lineas.forEach(function(linea) {
      var ajuste = ajustes.filter(function(a) { return a.producto.id === linea.id; })[0];
      var viejo = viejas[linea.id] || 0;
      linea.stockAntes = ajuste ? ajuste.producto.stock : 0;
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
      controlStock: controlStock,
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
      var producto = _cajaResolverProducto_(catalogo, linea);
      if (!producto) throw new Error('No se pudo devolver el stock de ' + linea.nombre);
      var cantidad = Number(linea.cantidad) || 0;
      var nuevoStock = producto.stock + cantidad;
      var hojaStock = producto.tipo === 'IND' ? _getSS().getSheetByName('INDUMENTARIA') : _getSS().getSheetByName('SUPLEMENTOS');
      hojaStock.getRange(producto.fila, producto.colStock).setValue(nuevoStock);
      producto.stockDespues = nuevoStock;
      ajustes.push({ id: producto.id, delta: -cantidad, stock: nuevoStock });
    });
    _cajaSincronizarStockDetalladoBatch_(venta.lineas.map(function(linea) {
      var producto = _cajaResolverProducto_(catalogo, linea);
      return producto ? {
        tipo: producto.tipo, nombre: producto.nombre, marca: producto.marca,
        stockDespues: producto.stockDespues
      } : null;
    }).filter(Boolean));
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
    var grupos = {}, clientes = {}, totalGeneral = 0;
    ventas.forEach(function(venta) {
      var fecha = new Date(venta.fecha); if (isNaN(fecha.getTime())) fecha = new Date();
      var fechaStr = Utilities.formatDate(fecha, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
      if (!grupos[fechaStr]) grupos[fechaStr] = { filas: [], total: 0 };
      var nota = 'CAJA ' + venta.id + ' | ' + venta.pago + ' | CIERRE JORNADA'
        + (venta.descuentoFidelidad > 0 ? ' | 10% fidelidad F10:' + venta.clienteCodigo : '')
        + (venta.notas ? ' | ' + venta.notas : '');
      venta.lineas.forEach(function(linea) {
        grupos[fechaStr].filas.push([
          fecha, linea.nombre, linea.marca, linea.cantidad,
          Number(linea.ingreso || 0) / Math.max(1, Number(linea.cantidad) || 1), linea.ingreso,
          venta.cliente, venta.pago, nota
        ]);
      });
      grupos[fechaStr].total += venta.total;
      totalGeneral += venta.total;
      if (venta.clienteCodigo) clientes[venta.clienteCodigo] = (clientes[venta.clienteCodigo] || 0) + venta.total;
    });
    Object.keys(grupos).forEach(function(fechaStr) {
      _cajaInsertarVentaBatch_(hojaVD, grupos[fechaStr].filas, fechaStr, grupos[fechaStr].total);
    });
    // El stock ya quedó reservado y auditado al guardar cada venta pendiente.
    // Cerrar la jornada registra ingresos y clientes, pero no vuelve a tocar
    // existencias: así una corrección manual nunca se pisa durante el cierre.
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
  var stockYaConciliado = datos.stockYaConciliado === true;
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
    _cajaReconciliarPrincipalAntesDeVender_();
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
    var pagoLabel = { contado:'Efectivo', transferencia:'Transferencia', debito:'Tarjeta de débito', tarjeta:'Tarjeta de crédito' }[pago];
    var preparada = _cajaDatosVentaRapida_(datos, catalogo, cliente, pago, pagoLabel);
    if (datos.totalMostrado != null && Number(datos.totalMostrado) !== preparada.calculo.total) {
      throw new Error('El total cambió (el 10% pudo haberse usado en otra compra). Actualizá la caja y confirmá el importe nuevo.');
    }
    var items = preparada.items;
    if (!stockYaConciliado) {
      items.forEach(function(actual) {
        if (actual.cantidad > actual.stock) throw new Error('Stock insuficiente para ' + actual.detalle + '. Disponible: ' + actual.stock);
      });
    }
    var calculo = preparada.calculo;
    if (calculo.total <= 0) throw new Error('El total de la venta no es válido');
    // El cliente nuevo se crea recién al confirmar una venta válida. Así no
    // quedan fichas vacías si se abandona un presupuesto.
    if (!cliente && nuevoCliente) {
      cliente = _cajaCrearCliente_(nuevoCliente);
      clienteCodigo = cliente.codigo;
    }
    var partesDesc = [];
    if (calculo.escala) partesDesc.push(calculo.escala.label || (Math.round(calculo.escala.pct * 100) + '% por monto'));
    if (calculo.fidelidad) partesDesc.push(Math.round(calculo.fidelidadPct * 100) + '% fidelidad F10:' + (cliente ? cliente.codigo : ''));
    if (calculo.descuentoPromocion > 0) partesDesc.push((calculo.promocionNombre || calculo.promocionCodigo || 'Promoción') + (calculo.promocionPct ? ' ' + calculo.promocionPct + '%' : ''));
    var notaBase = 'CAJA ' + operacion + ' | ' + pagoLabel + (partesDesc.length ? ' | ' + partesDesc.join(' + ') : '');
    if (stockYaConciliado) notaBase += ' | STOCK YA CONCILIADO';
    var notaUsuario = String(datos.notas || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 200);
    if (notaUsuario) notaBase += ' | ' + notaUsuario;

    // Primero se validó todo; recién ahora se aplican los movimientos de stock.
    var movimientosStock = [];
    items.forEach(function(item) {
      var hoja = item.tipo === 'IND' ? hojaInd : hojaSup;
      if (!hoja) throw new Error('Falta la hoja INDUMENTARIA');
      var antes = Number(hoja.getRange(item.fila, item.colStock).getValue()) || 0;
      if (!stockYaConciliado && antes < item.cantidad) throw new Error('El stock cambió para ' + item.detalle + '. Actualizá la caja.');
      var despues = stockYaConciliado ? antes : antes - item.cantidad;
      if (!stockYaConciliado) hoja.getRange(item.fila, item.colStock).setValue(despues);
      item.stockAntes = antes;
      item.stockDespues = despues;
      if (!stockYaConciliado) {
        movimientosStock.push([new Date(), 'SALIDA', item.sku || item.id, item.marca, item.detalle,
          item.cantidad, antes, despues, operacion, 'caja rápida']);
      }
    });
    var controlStock = stockYaConciliado
      ? { ok: true, omitido: true, mensaje: 'Stock ya conciliado; no se descontó nuevamente.' }
      : _cajaSincronizarStockDetalladoBatch_(items);
    if (movimientosStock.length) _cajaRegistrarMovimientosBatch_(movimientosStock);

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
      descuentoPromocion: calculo.descuentoPromocion || 0,
      promocionCodigo: calculo.promocionCodigo || '', promocionNombre: calculo.promocionNombre || '',
      fidelidad: calculo.fidelidad, escala: calculo.escala, total: calculo.total,
      controlStock: controlStock,
      mensaje: 'Venta aplicada correctamente'
    };
  } finally {
    lock.releaseLock();
  }
}

