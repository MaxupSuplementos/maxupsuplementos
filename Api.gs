// ============================================================
//  MAXUP — API.gs (v2 — corregido)
//  Reemplazar el contenido de Api.gs con este código
//  Luego: Implementar → Administrar implementaciones →
//         ✏️ Editar → Nueva versión → Implementar
// ============================================================

// ── CONFIGURACIÓN CENTRALIZADA ──────────────────────────────
// Ejecutar configurarCredenciales() UNA VEZ desde el editor de Apps Script.
// Después de ejecutarla, podés borrar los valores por defecto de _getConfig().
var _CONFIG = null;
function _getConfig() {
  if (_CONFIG) return _CONFIG;
  try {
    var props = PropertiesService.getScriptProperties();
    _CONFIG = {
      SS_ID:            props.getProperty('SS_ID')            || '17rFBpuvjam54M3NGE8Pmtc9YwBBRhVYI8bgGpckiAXo',
      TELEGRAM_TOKEN:   props.getProperty('TELEGRAM_TOKEN')   || '',
      TELEGRAM_CHAT_ID: props.getProperty('TELEGRAM_CHAT_ID') || '',
      ADMIN_CLAVE:      props.getProperty('ADMIN_CLAVE')      || '',
      API_URL_SELF:     props.getProperty('API_URL_SELF')      || ''
    };
  } catch(e) {
    _CONFIG = {
      SS_ID:            '17rFBpuvjam54M3NGE8Pmtc9YwBBRhVYI8bgGpckiAXo',
      TELEGRAM_TOKEN:   '',
      TELEGRAM_CHAT_ID: '',
      ADMIN_CLAVE:      '',
      API_URL_SELF:     ''
    };
  }
  return _CONFIG;
}

function configurarCredenciales() {
  PropertiesService.getScriptProperties().setProperties({
    'SS_ID':            '17rFBpuvjam54M3NGE8Pmtc9YwBBRhVYI8bgGpckiAXo',
    'TELEGRAM_TOKEN':   '8994380053:AAEVOeWGL6CkFWJxoOVGc876yntzCzdNf_4',
    'TELEGRAM_CHAT_ID': '6865398054',
    'ADMIN_CLAVE':      'darioruben',
    'API_URL_SELF':     'https://script.google.com/macros/s/AKfycbwUujcSoSyBWLLla-LOdovJmTDan-DP3O9Gp0k_MSupTHGEPB55TCZqllvGmEK6vlk/exec'
  });
  Logger.log('✅ Credenciales guardadas en Script Properties. Ahora borrá los valores por defecto de _getConfig().');
}

// ── CACHE DE SPREADSHEET ────────────────────────────────────
var _ss = null;
function _getSS() {
  if (!_ss) _ss = SpreadsheetApp.openById(_getConfig().SS_ID);
  return _ss;
}

// ── CONSTANTES ──────────────────────────────────────────────
var PROMO_MINIMO_API    = 40000;
var PROMO_MESES_API     = 3;
var PROMO_DESCUENTO_API = 0.10;
var NOMBRES_MESES_API   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
var HOJA_MAYORISTAS     = 'MAYORISTAS';
var HOJA_PEDIDOS_MAYO   = 'PEDIDOS_MAYORISTA';
var COL_DESC_MAYORISTA  = 11;

// ── GET ─────────────────────────────────────────────────────
function doGet(e) {
  var accion = (e && e.parameter && e.parameter.accion) ? e.parameter.accion : 'catalogo';

  if (accion === 'login_mayorista')    return loginMayorista(e.parameter);
  if (accion === 'catalogo_mayorista') return catalogoMayorista(e.parameter);
  if (accion === 'admin_mayoristas')   return adminMayoristas(e.parameter);
  if (accion === 'aprobar_mayorista')  return aprobarMayorista(e.parameter);
  if (accion === 'rechazar_mayorista') return rechazarMayorista(e.parameter);

  var resultado;
  try {
    switch(accion) {
      case 'catalogo':         resultado = getCatalogo();  break;
      case 'stats':            resultado = getStats();     break;
      case 'estado':           resultado = getEstadoPedido(e.parameter.pedido); break;
      case 'admin_pedidos':    resultado = adminGetPedidos(e.parameter.clave); break;
      case 'admin_resumen':    resultado = adminGetResumen(e.parameter.clave); break;
      case 'admin_stock':      resultado = adminGetStockBajo(e.parameter.clave, e.parameter.limite); break;
      case 'admin_descuentos': resultado = adminGetClientesDescuento(e.parameter.clave); break;
      case 'admin_estado':     resultado = adminCambiarEstado(e.parameter.clave, e.parameter.pedido, e.parameter.estado); break;
      case 'admin_vencer':     resultado = adminGetPorVencer(e.parameter.clave, e.parameter.dias); break;
      case 'admin_dashboard':     resultado = adminGetDashboard(e.parameter.clave); break;
      case 'admin_mantenimiento': resultado = adminMantenimiento(e.parameter.clave, e.parameter.activo, e.parameter.mensaje); break;
      case 'mantenimiento':    resultado = getMantenimiento(); break;
      case 'ofertas':          resultado = getOfertas(); break;
      case 'indumentaria':     resultado = getIndumentaria(); break;
      case 'resenas':          resultado = getResenas(); break;
      case 'es_nuevo':         resultado = esClienteNuevo(e.parameter.telefono); break;
      case 'historial_cliente': resultado = getHistorialCliente(e.parameter.telefono); break;
      case 'puntos_cliente':    resultado = getPuntosCliente(e.parameter.telefono); break;
      default:                 resultado = getCatalogo();
    }
  } catch(err) {
    resultado = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── POST ────────────────────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.accion === 'registro_mayorista') return registroMayorista(data);
    if (data.accion === 'pedido_mayorista')   return pedidoMayorista(data);
    if (data.accion === 'nueva_resena')       return ContentService.createTextOutput(JSON.stringify(guardarResena(data))).setMimeType(ContentService.MimeType.JSON);

    var resultado = registrarPedidoWeb(data);
    try { actualizarHojaReposicion(); } catch(eRepo) {}
    return ContentService
      .createTextOutput(JSON.stringify(resultado))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GENERAR CÓDIGO DE PEDIDO SECUENCIAL ─────────────────────
function _generarCodigoPedido() {
  var hojaPed = _getSS().getSheetByName('PEDIDOS');
  if (!hojaPed || hojaPed.getLastRow() < 2) return 'MXP-1001';
  var codigos = hojaPed.getRange(2, 1, hojaPed.getLastRow() - 1, 1).getValues();
  var maxNum = 1000;
  for (var i = 0; i < codigos.length; i++) {
    var match = String(codigos[i][0]).match(/MXP-(\d+)/);
    if (match) {
      var num = parseInt(match[1]);
      if (num > maxNum) maxNum = num;
    }
  }
  return 'MXP-' + (maxNum + 1);
}

// ── REGISTRAR PEDIDO WEB ────────────────────────────────────
function registrarPedidoWeb(data) {
  var ss       = _getSS();
  var hojaCli  = ss.getSheetByName('CLIENTES');
  var hojaVD   = ss.getSheetByName('VentasDiarias');

  if (!hojaCli || !hojaVD) throw new Error('Hojas CLIENTES o VentasDiarias no encontradas');

  var nombre   = String(data.nombre   || '').trim();
  var telefono = String(data.telefono || '').trim();
  var email    = String(data.email    || '').trim();
  var items    = data.items || [];
  var total    = Number(data.total)   || 0;
  var entrega  = String(data.entrega  || 'retiro').trim();
  var pago     = String(data.pago     || 'transferencia').trim();
  var direccion= String(data.direccion|| '').trim();

  if (!nombre || !telefono) throw new Error('Nombre y teléfono son requeridos');

  var codigoPedido = _generarCodigoPedido();

  // ── Buscar o crear cliente ──────────────────────────────
  var rowsCli    = hojaCli.getDataRange().getValues();
  var headersCli = rowsCli[0];
  var codigoCliente = null;

  for (var i = 1; i < rowsCli.length; i++) {
    var telExistente = String(rowsCli[i][2] || '').replace(/\D/g,'');
    var telNuevo     = telefono.replace(/\D/g,'');
    var nombreExist  = String(rowsCli[i][1] || '').toLowerCase().trim();
    if (telExistente && telExistente === telNuevo) {
      codigoCliente = rowsCli[i][0];
      break;
    }
    if (nombreExist === nombre.toLowerCase()) {
      codigoCliente = rowsCli[i][0];
      break;
    }
  }

  if (!codigoCliente) {
    var codigos   = rowsCli.slice(1).map(function(r){ return Number(r[0]); }).filter(function(c){ return !isNaN(c) && c > 0; });
    codigoCliente = codigos.length > 0 ? Math.max.apply(null, codigos) + 1 : 101;
    hojaCli.appendRow([codigoCliente, nombre, telefono]);
  }

  // ── Verificar descuentos ────────────────────────────────
  var tieneDesc = _tieneDescuentoApi(codigoCliente, rowsCli, headersCli);
  var esNuevo = false;
  if (!tieneDesc) {
    var nombreLower = nombre.toLowerCase();
    if (hojaVD.getLastRow() > 1) {
      var rowsVD2 = hojaVD.getDataRange().getValues();
      var tieneCompras = rowsVD2.some(function(r) {
        return String(r[6] || '').toLowerCase() === nombreLower;
      });
      esNuevo = !tieneCompras;
    } else {
      esNuevo = true;
    }
  }
  var descBienvenida = esNuevo ? 0.02 : 0;
  var factor   = tieneDesc ? (1 - PROMO_DESCUENTO_API) : (1 - descBienvenida);
  var tipoDesc = tieneDesc ? '10% fidelidad' : (esNuevo ? '2% bienvenida' : '');

  // ── Registrar en VentasDiarias ──────────────────────────
  var hoy      = new Date();
  var fechaStr = Utilities.formatDate(hoy, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
  var totalReal = 0;
  var notaBase  = 'WEB' + (tieneDesc ? ' 🎁-10%' : (esNuevo ? ' 🎉-2% bienvenida' : ''))
                + (entrega === 'envio' ? ' | Envío: ' + direccion : ' | Retiro') + ' | ' + pago;

  if (items.length > 0) {
    for (var idx = 0; idx < items.length; idx++) {
      var item = items[idx];
      var precioFinal = Math.round(Number(item.precio || 0) * factor);
      var cantidad    = Number(item.cantidad || 1);
      var ingreso     = precioFinal * cantidad;
      totalReal      += ingreso;
      hojaVD.appendRow([
        hoy,
        String(item.nombre || ''),
        String(item.marca  || ''),
        cantidad,
        precioFinal,
        ingreso,
        nombre,
        email,
        notaBase
      ]);
    }
  } else {
    totalReal = Math.round(total * factor);
    hojaVD.appendRow([
      hoy, 'Pedido web', '', 1, totalReal, totalReal,
      nombre, email, notaBase
    ]);
  }

  // ── Actualizar total del día ────────────────────────────
  _actualizarTotalDiaApi(hojaVD, fechaStr);

  // ── Actualizar monto mensual del cliente ────────────────
  _actualizarClienteMensualApi(codigoCliente, totalReal);

  // ── Registrar en hoja PEDIDOS ───────────────────────────
  try {
    var hojaPed = ss.getSheetByName('PEDIDOS');
    if (!hojaPed) {
      hojaPed = ss.insertSheet('PEDIDOS');
      hojaPed.appendRow(['Código','Fecha','Cliente','Teléfono','Productos','Total','Entrega','Dirección','Pago','Estado']);
      hojaPed.getRange(1,1,1,10).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#00C8FF');
    }
    var itemsResumen = items.length > 0
      ? items.map(function(i){ return (i.marca ? '[' + i.marca + '] ' : '') + i.nombre + ' x' + i.cantidad; }).join(' | ')
      : 'Pedido web';
    var itemsJSON = items.length > 0 ? JSON.stringify(items) : '[]';
    hojaPed.appendRow([
      codigoPedido, hoy, nombre, telefono, itemsResumen,
      '$' + _formatoPrecio(totalReal),
      entrega === 'envio' ? 'Envío' : 'Retiro en local',
      direccion || '-', pago, 'Recibido', itemsJSON
    ]);
  } catch(ePed) {}

  // ── Notificar por Telegram ──────────────────────────────
  try {
    var itemsTexto = items.length > 0
      ? items.map(function(i) { return '  • ' + (i.marca ? '[' + i.marca + '] ' : '') + i.nombre + ' x' + i.cantidad; }).join('\n')
      : 'Pedido web';
    var msg = '🛒 NUEVO PEDIDO WEB — MAXUP\n\n'
      + '🔑 Código: ' + codigoPedido + '\n'
      + '👤 ' + nombre + '\n'
      + '📱 ' + telefono + '\n'
      + (email ? '📧 ' + email + '\n' : '')
      + '\n📦 Productos:\n' + itemsTexto + '\n\n'
      + '💰 Total: $' + _formatoPrecio(totalReal)
      + (tieneDesc ? ' 🎁 10% fidelidad' : (esNuevo ? ' 🎉 2% bienvenida' : '')) + '\n'
      + '🚚 ' + (entrega === 'envio' ? 'Envío a: ' + direccion : 'Retiro en local') + '\n'
      + '💳 Pago: ' + pago + '\n\n'
      + '✅ Registrado en Sheets\n'
      + '📋 Ver pedido: https://maxupsuplementos.com.ar/estado.html?pedido=' + codigoPedido;
    _notificarTelegram(msg);
  } catch(e) {}

  // ── Notificar por Email ──────────────────────────────────
  try {
    var asunto = '🛒 Nuevo Pedido ' + codigoPedido + ' — ' + nombre;
    var cuerpoEmail = '<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#fff;padding:24px;border-radius:12px">'
      + '<h2 style="color:#00C8FF;margin:0 0 16px">NUEVO PEDIDO WEB</h2>'
      + '<p style="color:#FF0099;font-size:20px;margin:4px 0">Código: <strong>' + codigoPedido + '</strong></p>'
      + '<hr style="border-color:#222">'
      + '<p>👤 <strong>' + nombre + '</strong></p>'
      + '<p>📱 ' + telefono + '</p>'
      + (email ? '<p>📧 ' + email + '</p>' : '')
      + '<h3 style="color:#00C8FF;margin:16px 0 8px">Productos:</h3>'
      + '<ul>' + items.map(function(i){ return '<li>' + i.nombre + ' x' + i.cantidad + '</li>'; }).join('') + '</ul>'
      + '<p style="font-size:22px;color:#FF0099"><strong>Total: $' + _formatoPrecio(totalReal) + '</strong></p>'
      + '<p>🚚 ' + (entrega === 'envio' ? 'Envío a: ' + direccion : 'Retiro en local') + '</p>'
      + '<p>💳 Pago: ' + pago + '</p>'
      + '</div>';
    MailApp.sendEmail({
      to: 'maxups24@gmail.com',
      subject: asunto,
      htmlBody: cuerpoEmail
    });
  } catch(eEmail) {}

  // ── Registrar en hoja NOTIFICACIONES ────────────────────
  try {
    var itemsNotif = items.length > 0
      ? items.map(function(i){ return i.nombre + ' x' + i.cantidad; }).join(', ')
      : 'Pedido web';
    _registrarNotificacion('🛒 PEDIDO', nombre + ' — $' + _formatoPrecio(totalReal) + ' — ' + itemsNotif);
  } catch(eNotif) {}

  // ── Mercado Pago: generar link de pago si el cliente eligió MP ──
  var initPoint = null;
  if (String(pago).toLowerCase() === 'mercadopago' && totalReal > 0) {
    try {
      var _mp = crearPreferenciaMP({ total: totalReal, codigo: codigoPedido, email: email, items: items });
      if (_mp && _mp.ok) initPoint = _mp.init_point;
    } catch(eMp) {}
  }

  return {
    ok: true,
    codigo: codigoPedido,
    esNuevo: esNuevo,
    descuento: tipoDesc,
    init_point: initPoint,
    mensaje: 'Cliente ' + nombre + ' registrado. Total: $' + _formatoPrecio(totalReal) + (tipoDesc ? ' (' + tipoDesc + ')' : '')
  };
}

// ════════════════════════════════════════════════════════════
//  MERCADO PAGO — Checkout Pro (crear link de pago)
//  El Access Token se lee de las Propiedades del Script (seguro,
//  nunca en el código ni en GitHub). Configurar la propiedad
//  MP_ACCESS_TOKEN en: Configuración del proyecto → Propiedades del script.
// ════════════════════════════════════════════════════════════
function crearPreferenciaMP(data) {
  try {
    var token = PropertiesService.getScriptProperties().getProperty('MP_ACCESS_TOKEN');
    if (!token) return { ok: false, error: 'sin_token' };

    var total = Math.round(Number(data.total) || 0);
    if (total <= 0) return { ok: false, error: 'total_invalido' };

    var nItems = (data.items || []).length;
    var titulo = 'Pedido MAXUP ' + (data.codigo || '') +
      (nItems ? (' (' + nItems + ' producto' + (nItems !== 1 ? 's' : '') + ')') : '');

    var base = 'https://maxupsuplementos.github.io/maxupsuplementos/';
    var urlEstado = base + 'estado.html?pedido=' + encodeURIComponent(data.codigo || '');

    var pref = {
      items: [{ title: titulo.slice(0, 250), quantity: 1, unit_price: total, currency_id: 'ARS' }],
      external_reference: String(data.codigo || ''),
      back_urls: { success: urlEstado, pending: urlEstado, failure: base },
      auto_return: 'approved',
      statement_descriptor: 'MAXUP'
    };
    if (data.email) pref.payer = { email: String(data.email) };

    var resp = UrlFetchApp.fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      payload: JSON.stringify(pref),
      muteHttpExceptions: true
    });
    var code = resp.getResponseCode();
    var body = JSON.parse(resp.getContentText() || '{}');
    if (code >= 200 && code < 300 && body.init_point) {
      return { ok: true, init_point: body.init_point, id: body.id };
    }
    return { ok: false, error: (body.message || ('http_' + code)) };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

// ── HELPERS ─────────────────────────────────────────────────
function _tieneDescuentoApi(codigo, rowsCli, headersCli) {
  var clienteFila = null;
  for (var i = 0; i < rowsCli.length; i++) {
    if (String(rowsCli[i][0]) === String(codigo)) { clienteFila = rowsCli[i]; break; }
  }
  if (!clienteFila) return false;

  var ahora  = new Date();
  var streak = 0;

  for (var m = 0; m < PROMO_MESES_API; m++) {
    var fecha  = new Date(ahora.getFullYear(), ahora.getMonth() - m, 1);
    var colIdx = _buscarColumnaMes(headersCli, fecha);
    if (colIdx === -1) break;
    var monto = Number(clienteFila[colIdx]) || 0;
    if (monto >= PROMO_MINIMO_API) { streak++; } else { break; }
  }

  return streak >= PROMO_MESES_API;
}

// Busca la columna del mes en CLIENTES, soportando ambos formatos:
// "Abr 2026" (creado por el código) y Date/2026-04-01 (creado por Setup)
function _buscarColumnaMes(headers, fecha) {
  var textoMes = NOMBRES_MESES_API[fecha.getMonth()] + ' ' + fecha.getFullYear();
  var anio = fecha.getFullYear();
  var mes = fecha.getMonth();

  for (var h = 0; h < headers.length; h++) {
    var val = headers[h];
    // Formato texto: "Abr 2026"
    if (String(val).trim() === textoMes) return h;
    // Formato Date object de Google Sheets
    if (val instanceof Date) {
      if (val.getFullYear() === anio && val.getMonth() === mes) return h;
    }
    // Formato string ISO: "2026-04-01"
    var strVal = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(strVal)) {
      var parts = strVal.split('-');
      if (parseInt(parts[0]) === anio && parseInt(parts[1]) - 1 === mes) return h;
    }
  }
  return -1;
}

function _actualizarClienteMensualApi(codigo, monto) {
  var ss      = _getSS();
  var hojaCli = ss.getSheetByName('CLIENTES');
  if (!hojaCli) return;

  var ahora     = new Date();
  var headerMes = NOMBRES_MESES_API[ahora.getMonth()] + ' ' + ahora.getFullYear();
  var ultCol    = hojaCli.getLastColumn();
  var ultFila   = hojaCli.getLastRow();
  var headers   = hojaCli.getRange(1, 1, 1, ultCol).getValues()[0];
  var colMes    = _buscarColumnaMes(headers, ahora) + 1;

  if (colMes === 0) {
    colMes = ultCol + 1;
    hojaCli.getRange(1, colMes).setValue(headerMes);
  }

  var clientes = hojaCli.getRange(1, 1, ultFila, 1).getValues();
  for (var i = 1; i < clientes.length; i++) {
    if (String(clientes[i][0]) === String(codigo)) {
      var anterior = Number(hojaCli.getRange(i + 1, colMes).getValue()) || 0;
      hojaCli.getRange(i + 1, colMes).setValue(anterior + monto);
      break;
    }
  }
}

// CORREGIDO: no recibe ingreso, totalDia ya incluye la venta recién insertada
function _actualizarTotalDiaApi(hojaVD, fechaStr) {
  var rows       = hojaVD.getDataRange().getValues();
  var totalLabel = 'TOTAL ' + fechaStr;

  // 1. Buscar y ELIMINAR la fila TOTAL existente (si está en el medio)
  for (var i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i][0]).startsWith(totalLabel)) {
      hojaVD.deleteRow(i + 1);
      break;
    }
  }

  // 2. Re-leer datos y sumar todo lo del día
  rows = hojaVD.getDataRange().getValues();
  var totalDia = 0;
  for (var j = 0; j < rows.length; j++) {
    var celda = rows[j][0];
    if (!celda || typeof celda === 'string') continue;
    try {
      var f = Utilities.formatDate(new Date(celda), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
      if (f === fechaStr) {
        totalDia += Number(rows[j][5]) || 0;
      }
    } catch(e) {}
  }

  // 3. Agregar TOTAL siempre al final
  var filaTotal = [totalLabel, '', '', '', '', totalDia, '', '', ''];
  hojaVD.appendRow(filaTotal);
  var lastRow = hojaVD.getLastRow();
  hojaVD.getRange(lastRow, 1, 1, 9)
    .setBackground('#1a1a00').setFontColor('#FFD700').setFontWeight('bold');
}

// ── CATÁLOGO ────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════
//  NUEVOS INGRESOS (server-side) — igual para TODOS los visitantes
//  Compara el stock actual contra una "foto" guardada en una hoja
//  oculta (_NUEVOS_<clave>). Marca productos nuevos o con stock
//  aumentado con la fecha de hoy y devuelve los más recientes primero.
//  Cada catálogo es independiente (SUP = suplementos, IND = indumentaria).
//  A prueba de errores: si algo falla, devuelve [] (el front usa su fallback).
// ════════════════════════════════════════════════════════════
function _calcularNuevosIngresos(clave, items) {
  // items: [{ key, stock, marca, nombre }] en orden de planilla
  try {
    var props = PropertiesService.getScriptProperties();
    var DATA_PROP = 'nv_data_' + clave;
    var TS_PROP   = 'nv_ts_'   + clave;
    var THROTTLE  = 60 * 1000; // recalcular como máximo 1 vez por minuto
    var now = Date.now();

    // Si calculamos hace menos de 1 min, devolver lo cacheado (rápido)
    var lastTs = Number(props.getProperty(TS_PROP) || 0);
    if (now - lastTs < THROTTLE) {
      var cached = props.getProperty(DATA_PROP);
      if (cached) { try { return JSON.parse(cached); } catch(e){} }
    }

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(4000)) {
      var c2 = props.getProperty(DATA_PROP);
      try { return c2 ? JSON.parse(c2) : []; } catch(e){ return []; }
    }

    try {
      var ss = _getSS();
      var hojaNombre = '_NUEVOS_' + clave;
      var hoja = ss.getSheetByName(hojaNombre);
      var baseline = false;
      var prev = {}; // key -> {stock, ts}

      if (!hoja) {
        hoja = ss.insertSheet(hojaNombre);
        try { hoja.hideSheet(); } catch(e){}
        baseline = true;
      } else {
        var vals = hoja.getDataRange().getValues();
        for (var r = 1; r < vals.length; r++) {
          var k = String(vals[r][0] || '');
          if (!k) continue;
          prev[k] = { stock: Number(vals[r][1]) || 0, ts: Number(vals[r][2]) || 0 };
        }
        if (Object.keys(prev).length === 0) baseline = true;
      }

      var filas = [['key','stock','ts','marca','nombre','codigo']];
      items.forEach(function(it, i) {
        var ts;
        if (baseline) {
          // Primera vez: sembrar con el orden de planilla (los últimos = más nuevos).
          // Entero pequeño; los cambios reales usarán Date.now() (mucho mayor) y ganan.
          ts = i + 1;
        } else {
          var p = prev[it.key];
          if (!p) {
            ts = (it.stock > 0) ? now : 0;          // producto nuevo
          } else if (it.stock > p.stock) {
            ts = now;                                // reposición (sumaste stock)
          } else {
            ts = p.ts || (it.stock > 0 ? (i + 1) : 0);
          }
        }
        filas.push([it.key, it.stock, ts, it.marca || '', it.nombre || '', it.codigo || '']);
      });

      // Guardar la foto nueva
      hoja.clearContents();
      hoja.getRange(1, 1, filas.length, 6).setValues(filas);

      // Ordenar por recencia (ts desc), sólo con stock, top 30
      var ordenados = items.map(function(it, i) {
        return { it: it, ts: Number(filas[i + 1][2]) || 0 };
      }).filter(function(x) { return x.it.stock > 0; })
        .sort(function(a, b) { return b.ts - a.ts; })
        .slice(0, 80)  // antes 30: con 80 entran ingresos de ambos generos (mujer + hombre SOUR) sin taparse
        .map(function(x) { return { marca: x.it.marca || '', nombre: x.it.nombre || '', codigo: x.it.codigo || '' }; });

      props.setProperty(DATA_PROP, JSON.stringify(ordenados));
      props.setProperty(TS_PROP, String(now));
      return ordenados;
    } finally {
      lock.releaseLock();
    }
  } catch (e) {
    return [];
  }
}

// ════════════════════════════════════════════════════════════
//  RESEÑAS (valoraciones) — globales, iguales para todos
//  Se guardan en la hoja RESENAS. Clave estable = MARCA||NOMBRE.
// ════════════════════════════════════════════════════════════
function getResenas() {
  try {
    var hoja = _getSS().getSheetByName('RESENAS');
    if (!hoja || hoja.getLastRow() < 2) return { ok: true, resenas: {} };
    var datos = hoja.getDataRange().getValues();
    var map = {};
    for (var i = 1; i < datos.length; i++) {
      var key = String(datos[i][1] || '').trim();
      var rating = Number(datos[i][3]) || 0;
      if (!key || rating < 1) continue;
      if (!map[key]) map[key] = [];
      map[key].push({
        rating: rating,
        text: String(datos[i][4] || ''),
        fecha: String(datos[i][0] || ''),
        nombre: String(datos[i][5] || '')
      });
    }
    return { ok: true, resenas: map };
  } catch(e) {
    return { ok: false, error: e.message, resenas: {} };
  }
}

function guardarResena(data) {
  try {
    var rating = Number(data.rating) || 0;
    var key = String(data.key || '').trim();
    if (!key || rating < 1 || rating > 5) return { ok: false, error: 'datos_invalidos' };
    var ss = _getSS();
    var hoja = ss.getSheetByName('RESENAS');
    if (!hoja) {
      hoja = ss.insertSheet('RESENAS');
      hoja.appendRow(['Fecha', 'Clave', 'Producto', 'Rating', 'Comentario', 'Cliente']);
    }
    var fecha = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
    hoja.appendRow([
      fecha, key, String(data.producto || ''), rating,
      String(data.texto || '').slice(0, 300), String(data.nombre || '')
    ]);
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

function getCatalogo() {
  var ss   = _getSS();
  var hoja = ss.getSheetByName('CATALOGO');
  if (hoja && hoja.getLastRow() > 1) return getCatalogoDesdeHojaCatalogo(hoja);
  hoja = ss.getSheetByName('SUPLEMENTOS');
  if (hoja) return getCatalogoDesdeSuplemetos(hoja);
  return { productos: [], total: 0, error: 'No se encontró hoja CATALOGO ni SUPLEMENTOS' };
}

function getCatalogoDesdeHojaCatalogo(hoja) {
  var datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) return { productos: [], total: 0 };
  var acentos = {á:'a',é:'e',í:'i',ó:'o',ú:'u'};
  var headers = datos[0].map(function(h) {
    return String(h).toLowerCase().trim()
      .replace(/\s+/g,'_').replace(/[()%áéíóú]/g, function(c) { return acentos[c] || c; });
  });
  var productos = [];
  datos.slice(1).forEach(function(row, i) {
    var p = {};
    headers.forEach(function(h, j) { p[h] = row[j]; });
    var nombre = String(p.nombre || '').trim();
    var precio = Number(p.precio_venta || p.precio_lista || 0);
    if (!nombre || precio <= 0) return;
    if (p.activo === false || p.activo === 'FALSE') return;
    // Soportar múltiples imágenes separadas por salto de línea o ;
    var imagenRaw = String(p.imagen_url || '').trim();
    var imagenes = imagenRaw.split(/[\r\n;]+/).map(function(u){ return u.trim(); }).filter(Boolean);
    productos.push({
      id: p.id || (i + 1), nombre: nombre, marca: String(p.marca || '').trim(),
      categoria: String(p.categoria || 'otros').trim(),
      precio_venta: precio, precio_lista: Number(p.precio_lista || precio),
      stock: Number(p.stock || 0), imagen_url: imagenes[0] || '', imagenes: imagenes,
      descripcion: String(p.descripcion || '').trim(),
    });
  });
  var _itemsSup = productos.map(function(p){ return { key:(p.marca||'')+'||'+p.nombre, stock:Number(p.stock)||0, marca:p.marca||'', nombre:p.nombre }; });
  return { productos: productos, total: productos.length, fuente: 'CATALOGO', timestamp: new Date().toISOString(), nuevos_ingresos: _calcularNuevosIngresos('SUP', _itemsSup) };
}

function getCatalogoDesdeSuplemetos(hoja) {
  var datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) return { productos: [], total: 0 };

  var productos = [];
  var marcaActual = '';
  var id = 1;

  datos.forEach(function(row) {
    var col0 = String(row[0] || '').trim();
    var col1 = row[1], col2 = row[2], col3 = row[3];
    if (!col0) return;
    if (col0 && (col1 === null || col1 === '') && col0 !== 'Producto') { marcaActual = col0; return; }
    if (col0 === 'Producto') return;
    var precio_unit  = Number(col1) || 0;
    var precio_lista = Number(col2) || 0;
    var stock        = Number(col3) || 0;
    if (precio_unit <= 0 && precio_lista <= 0) return;
    var imagenRaw   = String(row[8] || '').trim();
    var descripcion = String(row[9] || '').trim();
    // Soportar múltiples imágenes separadas por salto de línea o ;
    var imagenes = imagenRaw.split(/[\r\n;]+/).map(function(u){ return u.trim(); }).filter(Boolean);
    // Si la fila cae bajo la sección SHAKERS o LICUADORAS de la planilla,
    // forzar "shaker" (cubre "Star Simple", "Gold Doble", etc. que por nombre no se detectan)
    var _marcaUp = marcaActual.toUpperCase();
    var _cat = (_marcaUp === 'SHAKERS' || _marcaUp === 'LICUADORAS') ? 'shaker' : inferirCat(col0);
    productos.push({
      id: id++, nombre: col0, marca: marcaActual, categoria: _cat,
      precio_venta: precio_unit, precio_lista: precio_lista || precio_unit,
      stock: stock, imagen_url: imagenes[0] || '', imagenes: imagenes,
      descripcion: descripcion,
    });
  });

  var _itemsSup = productos.map(function(p){ return { key:(p.marca||'')+'||'+p.nombre, stock:Number(p.stock)||0, marca:p.marca||'', nombre:p.nombre }; });
  return { productos: productos, total: productos.length, fuente: 'SUPLEMENTOS', timestamp: new Date().toISOString(), nuevos_ingresos: _calcularNuevosIngresos('SUP', _itemsSup) };
}

function inferirCat(nombre) {
  var n = nombre.toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
    .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o')
    .replace(/[úùü]/g,'u').replace(/ñ/g,'n');
  if (/whey.{0,5}bar|low.{0,5}carb.{0,10}bar|protein.{0,5}bar/.test(n)) return 'barra';
  if (/gelatina.{0,15}colag|colag.{0,15}gelatina/.test(n)) return 'barra';
  // Shakers, vasos, botellas, bidones y licuadoras/batidoras mini → categoría "shaker"
  if (/shaker|licuadora|\bvaso\b|botella|bidon|mini.{0,8}batidora|batidora.{0,8}pila|everlast|mamushka|maxup.{0,4}simple/.test(n)) return 'shaker';
  if (/guante|cinturon|lumbar|rueda.{0,15}abdom|mancuerna|straps|callera|rodillera|munequera|hand.{0,8}grip|ejercitador|bolso|scoop|llavero|vincha|tope.{0,8}barra|latex|banda.{0,30}elastic|tobillera|pelota|pilates|faja|neoprene|venda|boxeo|\bcono\b|soga|colchoneta/.test(n)) return 'accesorio';
  // QUIMICOS (hormonales / anabolicos)
  if (/testo|testosterona|stanozol|\bstano\b|winstrol|primobolan|cipionato|enantato|propionato|sustanon|trembolona|trenbolona|boldenona|nandrolona|deca.{0,3}durabolin|dianabol|metandro|oxandrolona|anavar|oximetolona|anadrol|masteron|clembuterol|clenbuterol|somatropina|\bhgh\b|oxandro/.test(n)) return 'quimicos';
  if (/creatin/.test(n)) return 'creatina';
  if (/gainer|ultra.{0,5}mass|mutant.{0,5}mass|nitro.{0,5}gain|mass.{0,5}fusion|extreme.{0,5}mass|mass.{0,5}builder/.test(n)) return 'gainer';
  if (/whey|wh3y|proteina|protein|\bprote\b|caseina|isolate|pea.{0,5}prot|bio.{0,5}prot/.test(n)) return 'proteina';
  if (/bcaa|glutamin|aminoacid|taurina|arginina|leucina|eaa|hmb|carnitin/.test(n)) return 'aminoacido';
  if (/pre.{0,5}work|pre.{0,5}entren|pump|tnt|dynamite|beta.{0,5}alan|oxido.{0,4}nitric|nitrico|\bn\.o\b/.test(n)) return 'preworkout';
  if ((/colag|collagen|flexo|glucosamin|condroitin/.test(n)) && !/gelatina/.test(n)) return 'colageno';
  if (/thermo|fat.{0,5}burn|cla |quemad|lipo|termogen|black.{0,4}cuts/.test(n)) return 'quemador';
  if (/omega|vitam|magnesio|zinc|calcio|resveratrol|ashwagandha|astaxantina|zma|cafeina|nad |multivit|citrato|bisglicinato/.test(n)) return 'vitamin';
  if (/hidrat|iso.{0,5}sport|electro|recovery.{0,5}drink|sport.{0,5}drink|just.{0,5}carb|hydromax|hydroplus|energy.{0,5}gel|maltodextri|isotonic/.test(n)) return 'hidratacion';
  if (/beauty.{0,5}bar|iron.{0,5}bar|barra.{0,10}proteic|barra.{0,10}cereal|cereal.{0,5}bar|grows.{0,5}bar|brava.{0,5}bar|snack|granola|pancake|cupcake|omelette.{0,10}proteic|quelopaleo|bros.{0,5}bar|gelatina|mani.{0,5}king|vitalgy/.test(n)) return 'barra';
  if (/short|remera|camiseta|calza|top |buzo|campera|catsuit/.test(n)) return 'indumentaria';
  return 'otros';
}

function getStats() {
  var cat   = getCatalogo();
  var prods = cat.productos || [];
  return {
    total_productos:    prods.length,
    productos_en_stock: prods.filter(function(p){ return p.stock > 0; }).length,
    sin_stock:          prods.filter(function(p){ return p.stock === 0; }).length,
    timestamp:          new Date().toISOString()
  };
}

// ── NOTIFICACIÓN TELEGRAM (única función) ───────────────────
function _notificarTelegram(mensaje) {
  var cfg = _getConfig();
  if (!cfg.TELEGRAM_TOKEN || !cfg.TELEGRAM_CHAT_ID) return;
  var url = 'https://api.telegram.org/bot' + cfg.TELEGRAM_TOKEN + '/sendMessage';
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: cfg.TELEGRAM_CHAT_ID, text: mensaje })
    });
  } catch(e) {
    Logger.log('Error Telegram: ' + e.message);
  }
}

// ── REGISTRAR NOTIFICACIÓN EN SHEETS ────────────────────────
function _registrarNotificacion(tipo, detalle) {
  try {
    var ss = _getSS();
    var hoja = ss.getSheetByName('NOTIFICACIONES');
    if (!hoja) {
      hoja = ss.insertSheet('NOTIFICACIONES');
      hoja.appendRow(['⏰ FECHA', '📌 TIPO', '📝 DETALLE', '✅ VISTO']);
      hoja.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#00C8FF');
      hoja.setColumnWidth(1, 160);
      hoja.setColumnWidth(2, 130);
      hoja.setColumnWidth(3, 500);
      hoja.setColumnWidth(4, 80);
    }
    var fecha = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm');
    var newRow = hoja.getLastRow() + 1;
    hoja.appendRow([fecha, tipo, detalle, '']);
    // Color de fondo según tipo
    var color = tipo.indexOf('PEDIDO') !== -1 ? '#0d2818' : '#2d1800';
    hoja.getRange(newRow, 1, 1, 4).setBackground(color).setFontColor('#ffffff');
    // Mover al tope para que lo más nuevo se vea primero
    if (newRow > 2) {
      hoja.moveRows(hoja.getRange(newRow, 1), 2);
    }
  } catch(e) {
    Logger.log('Error notificación: ' + e.message);
  }
}

// ── CONSULTAR ESTADO DE PEDIDO ──────────────────────────────
function getEstadoPedido(codigo) {
  if (!codigo) return { ok: false, error: 'Código no proporcionado' };

  var hojaPed = _getSS().getSheetByName('PEDIDOS');
  if (!hojaPed) return { ok: false, error: 'No hay pedidos registrados' };

  var rows = hojaPed.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toUpperCase() === String(codigo).trim().toUpperCase()) {
      return {
        ok: true,
        codigo:    rows[i][0],
        fecha:     Utilities.formatDate(new Date(rows[i][1]), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm'),
        cliente:   rows[i][2],
        productos: rows[i][4],
        total:     rows[i][5],
        entrega:   rows[i][6],
        direccion: rows[i][7],
        pago:      rows[i][8],
        estado:    rows[i][9]
      };
    }
  }
  return { ok: false, error: 'Pedido no encontrado. Verificá el código.' };
}

// ════════════════════════════════════════════════════════════
//  ENDPOINTS DE ADMINISTRACIÓN
// ════════════════════════════════════════════════════════════

function _validarClave(clave) {
  if (clave !== _getConfig().ADMIN_CLAVE) throw new Error('Acceso no autorizado');
}

function adminGetPedidos(clave) {
  _validarClave(clave);
  var hoja = _getSS().getSheetByName('PEDIDOS');
  if (!hoja || hoja.getLastRow() < 2) return { ok: true, pedidos: [] };

  var rows = hoja.getDataRange().getValues();
  var pedidos = [];
  for (var i = rows.length - 1; i >= 1; i--) {
    if (!rows[i][0]) continue;
    var fecha = '';
    try { fecha = Utilities.formatDate(new Date(rows[i][1]), 'America/Argentina/Buenos_Aires', 'dd/MM HH:mm'); } catch(e) {}
    pedidos.push({
      codigo:    String(rows[i][0]),
      fecha:     fecha,
      cliente:   String(rows[i][2]),
      telefono:  String(rows[i][3]),
      productos: String(rows[i][4]),
      total:     String(rows[i][5]),
      entrega:   String(rows[i][6]),
      pago:      String(rows[i][8]),
      estado:    String(rows[i][9]),
      fila:      i + 1
    });
    if (pedidos.length >= 50) break;
  }
  return { ok: true, pedidos: pedidos };
}

function adminCambiarEstado(clave, codigo, nuevoEstado) {
  _validarClave(clave);
  var estadosValidos = ['Recibido','En preparación','Listo para retirar','Enviado','Entregado','Retirado','Cancelado'];
  if (estadosValidos.indexOf(nuevoEstado) < 0) throw new Error('Estado inválido. Válidos: ' + estadosValidos.join(', '));

  var hoja = _getSS().getSheetByName('PEDIDOS');
  if (!hoja) throw new Error('Hoja PEDIDOS no encontrada');

  var rows = hoja.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(codigo).trim()) {
      var estadoAnterior = String(rows[i][9] || '');
      hoja.getRange(i + 1, 10).setValue(nuevoEstado);

      // Descontar stock SOLO al marcar como Entregado o Retirado
      var estadosFinales = ['Entregado', 'Retirado'];
      if (estadosFinales.indexOf(nuevoEstado) >= 0 && estadosFinales.indexOf(estadoAnterior) < 0) {
        try {
          var itemsJSON = String(rows[i][10] || '[]');
          var items = JSON.parse(itemsJSON);
          _descontarStockPedido(items);
        } catch(eStock) {
          Logger.log('Error descontando stock para ' + codigo + ': ' + eStock.message);
        }
      }

      try {
        var cliente = String(rows[i][2]);
        var emoji = nuevoEstado === 'Entregado' || nuevoEstado === 'Retirado' ? '✅' : '✏️';
        _notificarTelegram(emoji + ' ' + codigo + ' → ' + nuevoEstado + ' (' + cliente + ')'
          + (estadosFinales.indexOf(nuevoEstado) >= 0 ? '\n📦 Stock descontado automáticamente' : ''));
      } catch(e) {}
      return { ok: true, mensaje: 'Estado actualizado a ' + nuevoEstado };
    }
  }
  throw new Error('Pedido no encontrado: ' + codigo);
}

// Busca la fila de un producto: primero por nombre EXACTO (normalizado),
// y SOLO si no hay coincidencia exacta, por similitud (>=0.6) como respaldo.
// Asi una venta de "Creatina X 300 - Doypack" no descuenta de otra variante.
function _matchFilaProducto(data, colNombre, nombreItem, startRow) {
  var exacto = _normNombreSD(nombreItem);
  if (exacto) {
    for (var r = startRow; r < data.length; r++) {
      var nf = data[r][colNombre];
      if (nf && _normNombreSD(nf) === exacto) return r;
    }
  }
  // Respaldo: similitud por palabras (>=0.6) solo si no hubo match exacto
  var nb = String(nombreItem || '').toLowerCase().trim();
  var palabras = nb.split(/\s+/).filter(function(p){ return p.length > 2; });
  if (!palabras.length) return -1;
  var mejorFila = -1, mejorScore = 0;
  for (var r2 = startRow; r2 < data.length; r2++) {
    var nf2 = String(data[r2][colNombre] || '').toLowerCase().trim();
    if (!nf2) continue;
    var hits = 0;
    palabras.forEach(function(p){ if (nf2.indexOf(p) >= 0) hits++; });
    var pct = hits / palabras.length;
    if (pct > mejorScore && pct >= 0.6) { mejorScore = pct; mejorFila = r2; }
  }
  return mejorFila;
}

// Descuenta stock cuando el pedido se marca como finalizado
function _descontarStockPedido(items) {
  if (!items || items.length === 0) return;
  var ss = _getSS();

  // ── Intentar descontar de CATALOGO (hoja principal si existe) ──
  var hojaCat = ss.getSheetByName('CATALOGO');
  if (hojaCat && hojaCat.getLastRow() > 1) {
    var catData = hojaCat.getDataRange().getValues();
    var headers = catData[0].map(function(h) {
      return String(h).toLowerCase().trim()
        .replace(/\s+/g,'_').replace(/[()%áéíóú]/g, function(c) {
          return {á:'a',é:'e',í:'i',ó:'o',ú:'u'}[c] || c;
        });
    });
    var colNombre = headers.indexOf('nombre');
    var colStock  = headers.indexOf('stock');
    if (colNombre >= 0 && colStock >= 0) {
      items.forEach(function(item) {
        var cantItem = Number(item.cantidad) || 1;
        var mejorFila = _matchFilaProducto(catData, colNombre, item.nombre, 1);
        if (mejorFila >= 0) {
          var stockActual = Number(catData[mejorFila][colStock]) || 0;
          hojaCat.getRange(mejorFila + 1, colStock + 1).setValue(Math.max(0, stockActual - cantItem));
          descontarStockDetallado(String(item.nombre || ''), cantItem);
        }
      });
      try { actualizarHojaReposicion(); } catch(e) {}
      return;
    }
  }

  // ── Fallback: descontar de SUPLEMENTOS ──
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');
  if (!hojaSup) return;
  var supData = hojaSup.getDataRange().getValues();
  items.forEach(function(item) {
    var cantItem = Number(item.cantidad) || 1;
    var mejorFila = _matchFilaProducto(supData, 0, item.nombre, 2);
    if (mejorFila >= 0) {
      var stockActual = Number(supData[mejorFila][3]) || 0;
      hojaSup.getRange(mejorFila + 1, 4).setValue(Math.max(0, stockActual - cantItem));
      descontarStockDetallado(String(item.nombre || ''), cantItem);
    }
  });
  try { actualizarHojaReposicion(); } catch(e) {}
}

function _getMsgEstado(estado) {
  var msgs = {
    'Recibido': 'Tu pedido fue recibido correctamente.',
    'En preparación': 'Estamos preparando tu pedido. En breve estará listo.',
    'Listo para retirar': '¡Tu pedido está listo! Podés pasar a retirarlo.',
    'Enviado': '¡Tu pedido está en camino! Pronto lo recibís.',
    'Entregado': '¡Pedido entregado! Gracias por tu compra.',
    'Retirado': '¡Pedido retirado! Gracias por tu compra.',
    'Cancelado': 'Tu pedido fue cancelado. Contactanos para más info.'
  };
  return msgs[estado] || '';
}

function adminGetResumen(clave) {
  _validarClave(clave);
  var ss = _getSS();
  var hojaVD = ss.getSheetByName('VentasDiarias');
  if (!hojaVD) return { ok: true, hoy: 0, ayer: 0, ventasHoy: 0, ventasAyer: 0, items: [] };

  var hoy = new Date();
  var ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
  var hoyStr  = Utilities.formatDate(hoy,  'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
  var ayerStr = Utilities.formatDate(ayer, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');

  var rows = hojaVD.getDataRange().getValues();
  var totalHoy = 0, totalAyer = 0, ventasHoy = 0, ventasAyer = 0;
  var itemsHoy = [];

  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0] || typeof rows[i][0] === 'string') continue;
    var fechaFila = '';
    try { fechaFila = Utilities.formatDate(new Date(rows[i][0]), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy'); } catch(e) { continue; }

    var monto = Number(rows[i][5]) || 0;
    if (fechaFila === hoyStr) {
      totalHoy += monto; ventasHoy++;
      itemsHoy.push({ producto: String(rows[i][1]), cantidad: rows[i][3], monto: monto, cliente: String(rows[i][6] || '') });
    }
    if (fechaFila === ayerStr) { totalAyer += monto; ventasAyer++; }
  }

  var hojaPed = ss.getSheetByName('PEDIDOS');
  var pedidosHoy = 0;
  if (hojaPed && hojaPed.getLastRow() > 1) {
    var rowsPed = hojaPed.getDataRange().getValues();
    for (var j = 1; j < rowsPed.length; j++) {
      if (!rowsPed[j][1]) continue;
      try {
        var fPed = Utilities.formatDate(new Date(rowsPed[j][1]), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
        if (fPed === hoyStr) pedidosHoy++;
      } catch(e) {}
    }
  }

  // Stock bajo para alertas en resumen
  var stockBajo = [];
  try {
    var hojaSup = ss.getSheetByName('SUPLEMENTOS');
    if (hojaSup) {
      var rowsSup = hojaSup.getDataRange().getValues();
      var marcaAct = '';
      for (var s = 2; s < rowsSup.length; s++) {
        var nom = String(rowsSup[s][0] || '').trim();
        var pre = Number(rowsSup[s][1]);
        var stk = Number(rowsSup[s][3]);
        if (!nom) continue;
        if (!pre || isNaN(pre)) { marcaAct = nom; continue; }
        if (stk <= 2) stockBajo.push({ nombre: nom, marca: marcaAct, stock: stk });
      }
      stockBajo.sort(function(a,b){ return a.stock - b.stock; });
      if (stockBajo.length > 8) stockBajo.length = 8; // máx 8 en resumen
    }
  } catch(e) {}

  return {
    ok: true, hoy: totalHoy, ayer: totalAyer,
    ventasHoy: ventasHoy, ventasAyer: ventasAyer,
    pedidosWeb: pedidosHoy, items: itemsHoy.slice(0, 20), fecha: hoyStr,
    stockBajo: stockBajo
  };
}

function adminGetStockBajo(clave, limite) {
  _validarClave(clave);
  var limiteNum = Number(limite) || 3;
  var hoja = _getSS().getSheetByName('SUPLEMENTOS');
  if (!hoja) return { ok: true, productos: [] };

  var rows = hoja.getDataRange().getValues();
  var productos = [];
  var marcaActual = '';

  for (var i = 2; i < rows.length; i++) {
    var nombre = String(rows[i][0] || '').trim();
    var precio = Number(rows[i][1]);
    var stock  = Number(rows[i][3]);
    if (!nombre) continue;
    if (!precio || isNaN(precio)) { marcaActual = nombre; continue; }
    if (stock <= limiteNum) {
      productos.push({ nombre: nombre, marca: marcaActual, stock: stock, precio: precio });
    }
  }

  productos.sort(function(a, b) { return a.stock - b.stock; });
  return { ok: true, productos: productos, limite: limiteNum };
}

function adminGetClientesDescuento(clave) {
  _validarClave(clave);
  var hoja = _getSS().getSheetByName('CLIENTES');
  if (!hoja) return { ok: true, clientes: [] };

  var rows = hoja.getDataRange().getValues();
  var headers = rows[0];
  var clientes = [];

  for (var i = 1; i < rows.length; i++) {
    var codigo = rows[i][0];
    var nombre = rows[i][1];
    if (!codigo || !nombre) continue;
    if (_tieneDescuentoApi(codigo, rows, headers)) {
      var ahora = new Date();
      var total3m = 0;
      for (var m = 0; m < 3; m++) {
        var fecha = new Date(ahora.getFullYear(), ahora.getMonth() - m, 1);
        var colIdx = _buscarColumnaMes(headers, fecha);
        if (colIdx >= 0) total3m += Number(rows[i][colIdx]) || 0;
      }
      clientes.push({ codigo: codigo, nombre: String(nombre), telefono: String(rows[i][2] || ''), total3m: total3m });
    }
  }
  return { ok: true, clientes: clientes };
}

// ════════════════════════════════════════════════════════════
//  OFERTAS / VENCIMIENTOS
// ════════════════════════════════════════════════════════════

function _leerOfertasHoja(diasLimite) {
  // Lee el stock EN VIVO desde STOCK_DETALLADO (que se actualiza en cada venta),
  // no de la "foto" diaria de ANALISIS_OFERTAS. Asi no aparecen vencidos fantasma
  // de productos que ya se vendieron durante el dia.
  var ss = _getSS();
  var hojaSD = ss.getSheetByName('STOCK_DETALLADO');
  if (!hojaSD || hojaSD.getLastRow() < 2) return [];

  // Precios actuales desde SUPLEMENTOS (por nombre normalizado)
  var precios = {};
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');
  if (hojaSup) {
    var rs = hojaSup.getDataRange().getValues();
    for (var s = 2; s < rs.length; s++) {
      var nom = String(rs[s][0] || '').trim();
      var pr  = Number(rs[s][1]) || 0;
      if (nom && pr > 0) precios[_normNombreSD(nom)] = pr;
    }
  }

  var rows = hojaSD.getDataRange().getValues();
  var productos = [];
  var hoy = new Date(); hoy.setHours(0,0,0,0);

  for (var i = 1; i < rows.length; i++) {
    var nombre = String(rows[i][0] || '').trim();
    var marca  = String(rows[i][1] || '').trim();
    var vence  = rows[i][2];
    var stock  = Number(rows[i][4]) || 0; // col E = Stock Actual (EN VIVO)

    if (!nombre || !vence) continue;
    if (stock <= 0) continue; // Ignorar lotes sin stock

    var fechaVence = new Date(vence); fechaVence.setHours(0,0,0,0);
    if (isNaN(fechaVence.getTime())) continue;
    var diasReales = Math.round((fechaVence - hoy) / (1000*60*60*24));

    if (diasReales <= diasLimite) {
      // Umbrales: 40d=critico, 50d=advertencia, 70d=atencion
      var urgencia;
      if (diasReales < 0)        urgencia = 'vencido';
      else if (diasReales <= 40) urgencia = 'critico';
      else if (diasReales <= 50) urgencia = 'advertencia';
      else                       urgencia = 'atencion';

      productos.push({
        nombre: nombre, marca: marca, stock: stock,
        diasRestantes: diasReales,
        fechaVence: Utilities.formatDate(fechaVence, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy'),
        ventas30d: 0, precio: precios[_normNombreSD(nombre)] || 0, urgencia: urgencia
      });
    }
  }
  productos.sort(function(a,b){ return a.diasRestantes - b.diasRestantes; });
  return productos;
}

function getOfertas() {
  var productos = _leerOfertasHoja(50);
  return { ok: true, productos: productos, total: productos.length };
}

function adminGetPorVencer(clave, dias) {
  _validarClave(clave);
  var diasLimite = Number(dias) || 50;
  var productos = _leerOfertasHoja(diasLimite);
  return { ok: true, productos: productos };
}

// ── REGENERAR ANALISIS_OFERTAS desde STOCK_DETALLADO + VentasDiarias ─
function actualizarAnalisisOfertas() {
  var ss = _getSS();
  var hojaSD = ss.getSheetByName('STOCK_DETALLADO');
  if (!hojaSD || hojaSD.getLastRow() < 2) return;

  var hojaVD = ss.getSheetByName('VentasDiarias');
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');

  var hoy = new Date(); hoy.setHours(0,0,0,0);
  var hace30 = new Date(hoy); hace30.setDate(hace30.getDate() - 30);

  // 1. Contar ventas por producto en los últimos 30 días
  var ventas30d = {};
  if (hojaVD && hojaVD.getLastRow() > 1) {
    var rowsVD = hojaVD.getDataRange().getValues();
    for (var v = 1; v < rowsVD.length; v++) {
      var fechaVenta = rowsVD[v][0];
      if (!fechaVenta || typeof fechaVenta === 'string') continue;
      try {
        var fv = new Date(fechaVenta);
        if (fv >= hace30 && fv <= hoy) {
          var prodNombre = String(rowsVD[v][1] || '').toLowerCase().trim();
          var cant = Number(rowsVD[v][3]) || 0;
          if (prodNombre) {
            ventas30d[prodNombre] = (ventas30d[prodNombre] || 0) + cant;
          }
        }
      } catch(e) {}
    }
  }

  // 2. Obtener precios actuales de SUPLEMENTOS
  var precios = {};
  if (hojaSup) {
    var rowsSup = hojaSup.getDataRange().getValues();
    for (var s = 2; s < rowsSup.length; s++) {
      var nombreSup = String(rowsSup[s][0] || '').trim();
      var precioSup = Number(rowsSup[s][1]) || 0;
      if (nombreSup && precioSup > 0) {
        precios[nombreSup.toLowerCase()] = precioSup;
      }
    }
  }

  // 3. Leer STOCK_DETALLADO y generar filas para ANALISIS_OFERTAS
  var datosSD = hojaSD.getDataRange().getValues();
  var filas = [];

  for (var i = 1; i < datosSD.length; i++) {
    var nombre = String(datosSD[i][0] || '').trim();
    var marca = String(datosSD[i][1] || '').trim();
    var vencimiento = datosSD[i][2];
    var stockActual = Number(datosSD[i][4]) || 0;

    if (!nombre || !vencimiento) continue;

    var fechaVence = new Date(vencimiento); fechaVence.setHours(0,0,0,0);
    var diasRestantes = Math.round((fechaVence - hoy) / (1000 * 60 * 60 * 24));

    var nombreLower = nombre.toLowerCase();
    var ventasProd = ventas30d[nombreLower] || 0;

    // Buscar precio — intentar match exacto, luego parcial
    var precio = precios[nombreLower] || 0;
    if (!precio) {
      var palabras = nombreLower.split(/\s+/).filter(function(w) { return w.length > 3; });
      for (var key in precios) {
        var hits = 0;
        palabras.forEach(function(p) { if (key.indexOf(p) >= 0) hits++; });
        if (palabras.length > 0 && hits / palabras.length >= 0.7) {
          precio = precios[key];
          break;
        }
      }
    }

    // Puntaje de urgencia: menor = más urgente
    // Combina días restantes, stock y ventas
    var puntaje = diasRestantes * 10 + stockActual * 5 - ventasProd * 20;
    if (diasRestantes < 0) puntaje -= 1000;

    var loteNombre = nombre + ' [Vence: ' + Utilities.formatDate(fechaVence, 'America/Argentina/Buenos_Aires', 'dd/MM/yy') + ']';

    var precioOferta = diasRestantes <= 30 && precio > 0 ? Math.round(precio * 0.95) : 0;
    var ahorro = precioOferta > 0 ? precio - precioOferta : 0;

    filas.push([
      loteNombre, marca, stockActual, fechaVence, diasRestantes,
      ventasProd, precio, puntaje, precioOferta, ahorro
    ]);
  }

  // 4. Ordenar por puntaje (más urgente primero)
  filas.sort(function(a, b) { return a[7] - b[7]; });

  // 5. Escribir en ANALISIS_OFERTAS
  var hojaAO = ss.getSheetByName('ANALISIS_OFERTAS');
  if (!hojaAO) hojaAO = ss.insertSheet('ANALISIS_OFERTAS');

  hojaAO.clearContents();
  hojaAO.clearFormats();

  var headers = [['Lote / Producto', 'Marca', 'Stock Lote', 'Vencimiento', 'Días Restantes',
                  'Ventas Prod (30d)', 'Precio Actual', 'Puntaje Urgencia', 'PRECIO OFERTA (5% OFF)', 'AHORRO']];
  hojaAO.getRange(1, 1, 1, 10).setValues(headers);
  hojaAO.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#00C8FF');

  if (filas.length > 0) {
    hojaAO.getRange(2, 1, filas.length, 10).setValues(filas);

    // Colorear por urgencia (40d critico, 50d advertencia, 70d atencion)
    for (var f = 0; f < filas.length; f++) {
      var dias = filas[f][4];
      var stockFila = filas[f][2];
      var bgColor, ftColor;
      if (stockFila <= 0)  { bgColor = '#1a1a1a'; ftColor = '#555555'; } // Sin stock: gris
      else if (dias < 0)   { bgColor = '#3a0000'; ftColor = '#FF4444'; } // Vencido
      else if (dias <= 40) { bgColor = '#3a0000'; ftColor = '#FF6666'; } // Critico
      else if (dias <= 50) { bgColor = '#2a1500'; ftColor = '#FF9900'; } // Advertencia
      else if (dias <= 70) { bgColor = '#0a1a2a'; ftColor = '#00C8FF'; } // Atencion
      else                 { bgColor = null; ftColor = null; }
      if (bgColor) {
        hojaAO.getRange(f + 2, 1, 1, 10).setBackground(bgColor).setFontColor(ftColor);
      }
    }

    hojaAO.setColumnWidth(1, 350);
    hojaAO.setColumnWidth(2, 130);
    hojaAO.getRange(2, 4, filas.length, 1).setNumberFormat('dd/MM/yyyy');
  }

  var fechaActualiz = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm');
  hojaAO.getRange(1, 11).setValue('Actualizado: ' + fechaActualiz);
  hojaAO.getRange(1, 11).setFontColor('#888888').setFontStyle('italic');

  Logger.log('ANALISIS_OFERTAS actualizado: ' + filas.length + ' lotes');
}

// ── TRIGGER DIARIO: actualizar análisis + alerta Telegram ───
function triggerDiarioMaxup() {
  actualizarAnalisisOfertas();
  actualizarHojaReposicion();
  alertaVencimientosDiaria();
  recordatoriosRecompra();
  alertaOfertasClientes();
  bienvenidaClientesNuevos();
  generarContenidoRedes();
}

// Ejecutar UNA VEZ para instalar el trigger diario (8 AM Argentina)
function instalarTriggerDiario() {
  // Eliminar triggers anteriores de esta función
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'triggerDiarioMaxup') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  // Crear nuevo trigger diario a las 8 AM hora Argentina
  ScriptApp.newTrigger('triggerDiarioMaxup')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .inTimezone('America/Argentina/Buenos_Aires')
    .create();
  Logger.log('✅ Trigger diario instalado: triggerDiarioMaxup a las 8:00 AM Argentina');
}

function alertaVencimientosDiaria() {
  // 1. Auto-limpieza: eliminar filas con stock 0 de STOCK_DETALLADO
  var eliminados = _limpiarStockDetallado();

  // 2. Leer productos que vencen en ≤70 días (solo con stock > 0)
  var productos = _leerOfertasHoja(70);

  var vencidos    = productos.filter(function(p){ return p.urgencia === 'vencido'; });
  var criticos    = productos.filter(function(p){ return p.urgencia === 'critico'; });
  var advertencia = productos.filter(function(p){ return p.urgencia === 'advertencia'; });
  var atencion    = productos.filter(function(p){ return p.urgencia === 'atencion'; });

  // Si no hay nada que reportar, no molestar
  if (productos.length === 0 && eliminados === 0) return;

  var msg = '🗓️ MAXUP — Vencimientos\n';
  msg += Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy') + '\n';

  if (eliminados > 0) {
    msg += '\n🧹 Se limpiaron ' + eliminados + ' productos sin stock\n';
  }

  var PROMO_URL = 'https://maxupsuplementos.github.io/maxupsuplementos/promo.html';

  if (vencidos.length > 0) {
    msg += '\n🔴 VENCIDOS con stock (' + vencidos.length + '):\n';
    msg += '⚠️ SACALOS DE LA VENTA\n';
    vencidos.forEach(function(p){
      msg += '  • ' + p.nombre + ' (' + p.marca + ')\n    Venció: ' + p.fechaVence + ' | Stock: ' + p.stock + '\n';
    });
  }

  if (criticos.length > 0) {
    msg += '\n🚨 VENDÉ YA — ≤40 días (' + criticos.length + '):\n';
    criticos.forEach(function(p){
      var desc = p.diasRestantes <= 20 ? 20 : p.diasRestantes <= 30 ? 15 : 10;
      var promoLink = PROMO_URL + '?q=' + encodeURIComponent(p.nombre) + '&desc=' + desc;
      msg += '  • ' + p.nombre + ' (' + p.marca + ')\n    Vence: ' + p.fechaVence + ' (' + p.diasRestantes + 'd) | Stock: ' + p.stock + '\n';
      msg += '    📸 Crear promo -' + desc + '%: ' + promoLink + '\n';
    });
  }

  if (advertencia.length > 0) {
    msg += '\n⚠️ ATENCIÓN — ≤50 días (' + advertencia.length + '):\n';
    advertencia.forEach(function(p){
      var promoLink = PROMO_URL + '?q=' + encodeURIComponent(p.nombre) + '&desc=10';
      msg += '  • ' + p.nombre + ' (' + p.marca + ') — ' + p.fechaVence + ' (' + p.diasRestantes + 'd)\n';
      msg += '    📸 Crear promo: ' + promoLink + '\n';
    });
  }

  if (atencion.length > 0) {
    msg += '\n🔵 PRÓXIMOS — ≤70 días (' + atencion.length + '):\n';
    atencion.forEach(function(p){
      msg += '  • ' + p.nombre + ' (' + p.marca + ') — ' + p.fechaVence + ' (' + p.diasRestantes + 'd)\n';
    });
  }

  if (productos.length === 0) {
    msg += '\n✅ No hay productos por vencer en los próximos 70 días';
  }

  _notificarTelegram(msg);
}

// ── Auto-limpieza: eliminar filas con stock 0 o vencidos sin stock ──
function _limpiarStockDetallado() {
  var hoja = _getSS().getSheetByName('STOCK_DETALLADO');
  if (!hoja || hoja.getLastRow() < 2) return 0;

  var datos = hoja.getDataRange().getValues();
  var filasEliminar = [];
  var hoy = new Date(); hoy.setHours(0,0,0,0);

  for (var i = datos.length - 1; i >= 1; i--) {
    var stock = Number(datos[i][4]) || 0;
    var vence = datos[i][2];
    var fechaVence = vence ? new Date(vence) : null;
    var diasRest = fechaVence ? Math.round((fechaVence - hoy) / (1000*60*60*24)) : 9999;

    // Eliminar si: stock = 0, o vencido hace más de 7 días con stock 0
    if (stock <= 0) {
      filasEliminar.push(i + 1);
    }
  }

  // Eliminar de abajo hacia arriba para no afectar los índices
  for (var j = 0; j < filasEliminar.length; j++) {
    hoja.deleteRow(filasEliminar[j]);
  }

  if (filasEliminar.length > 0) {
    Logger.log('🧹 Limpieza STOCK_DETALLADO: ' + filasEliminar.length + ' filas eliminadas (stock 0)');
  }
  return filasEliminar.length;
}

// ── VERIFICAR SI ES CLIENTE NUEVO ───────────────────────────
function esClienteNuevo(telefono) {
  if (!telefono) return { ok: true, esNuevo: false };

  var tel = String(telefono).replace(/\D/g, '');
  var ss = _getSS();

  var hojaCli = ss.getSheetByName('CLIENTES');
  if (hojaCli && hojaCli.getLastRow() > 1) {
    var rows = hojaCli.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var telExistente = String(rows[i][2] || '').replace(/\D/g, '');
      if (telExistente && telExistente === tel) {
        var hojaVD = ss.getSheetByName('VentasDiarias');
        if (!hojaVD) return { ok: true, esNuevo: false };
        var nombre = String(rows[i][1] || '').toLowerCase();
        var rowsVD = hojaVD.getDataRange().getValues();
        var tieneCompras = rowsVD.some(function(r) {
          return String(r[6] || '').toLowerCase() === nombre;
        });
        return { ok: true, esNuevo: !tieneCompras };
      }
    }
  }

  return { ok: true, esNuevo: true };
}

// ════════════════════════════════════════════════════════════
//  SISTEMA MAYORISTA
// ════════════════════════════════════════════════════════════

function registroMayorista(body) {
  try {
    var ss   = _getSS();
    var hoja = ss.getSheetByName(HOJA_MAYORISTAS);
    if (!hoja) hoja = ss.insertSheet(HOJA_MAYORISTAS);

    var datos = hoja.getDataRange().getValues();
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0].toString().toLowerCase() === body.email.toLowerCase()) {
        return jsonResp({ ok: false, error: 'Ese email ya está registrado. Intentá iniciar sesión.' });
      }
    }

    var passHash = hashPassword(body.password);

    hoja.appendRow([
      body.email, body.nombre, body.negocio, body.telefono,
      body.ciudad || '', body.rubro || '', passHash,
      'pendiente', new Date().toLocaleDateString('es-AR')
    ]);

    var cfg = _getConfig();
    var msg = '🏭 *NUEVA SOLICITUD MAYORISTA*\n\n'
      + '👤 Nombre: ' + body.nombre + '\n'
      + '🏪 Negocio: ' + body.negocio + '\n'
      + '📱 Tel: ' + body.telefono + '\n'
      + '📍 Ciudad: ' + (body.ciudad || '-') + '\n'
      + '📧 Email: ' + body.email + '\n'
      + '💼 Rubro: ' + (body.rubro || '-') + '\n\n'
      + 'Para aprobar:\n'
      + cfg.API_URL_SELF + '?accion=aprobar_mayorista&email=' + encodeURIComponent(body.email) + '&clave=' + cfg.ADMIN_CLAVE + '\n\n'
      + 'Para rechazar:\n'
      + cfg.API_URL_SELF + '?accion=rechazar_mayorista&email=' + encodeURIComponent(body.email) + '&clave=' + cfg.ADMIN_CLAVE;

    _notificarTelegram(msg);

    // Email de notificación
    try {
      MailApp.sendEmail({
        to: 'maxups24@gmail.com',
        subject: '🏭 Nueva solicitud mayorista — ' + body.nombre,
        htmlBody: '<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#fff;padding:24px;border-radius:12px">'
          + '<h2 style="color:#FFB800;margin:0 0 16px">🏭 NUEVA SOLICITUD MAYORISTA</h2>'
          + '<p>👤 <strong>' + body.nombre + '</strong></p>'
          + '<p>🏪 Negocio: ' + body.negocio + '</p>'
          + '<p>📱 Tel: ' + body.telefono + '</p>'
          + '<p>📍 Ciudad: ' + (body.ciudad || '-') + '</p>'
          + '<p>📧 Email: ' + body.email + '</p>'
          + '<p>💼 Rubro: ' + (body.rubro || '-') + '</p>'
          + '</div>'
      });
    } catch(eEmail) {}

    // Registrar en hoja NOTIFICACIONES
    _registrarNotificacion('🏭 MAYORISTA', body.nombre + ' — ' + body.negocio + ' — ' + body.telefono);

    return jsonResp({ ok: true });
  } catch(e) {
    return jsonResp({ ok: false, error: 'Error interno: ' + e.message });
  }
}

function loginMayorista(params) {
  try {
    var email = (params.email || '').toLowerCase().trim();
    var pass  = params.password || '';

    var hoja = _getSS().getSheetByName(HOJA_MAYORISTAS);
    if (!hoja) return jsonResp({ ok: false, error: 'Sistema en configuración.' });

    var datos = hoja.getDataRange().getValues();
    for (var i = 1; i < datos.length; i++) {
      var row = datos[i];
      if (row[0].toString().toLowerCase() === email) {
        if (!verificarPassword(pass, row[6].toString())) {
          return jsonResp({ ok: false, error: 'Contraseña incorrecta.' });
        }
        var estado = row[7].toString().toLowerCase();

        if (estado === 'pendiente') return jsonResp({ ok: true, estado: 'pendiente' });
        if (estado === 'rechazado') return jsonResp({ ok: false, error: 'Tu solicitud fue rechazada. Contactanos por WhatsApp.' });
        if (estado === 'aprobado') {
          return jsonResp({
            ok: true, estado: 'aprobado',
            usuario: { nombre: row[1], negocio: row[2], telefono: row[3], email: email },
            productos: obtenerCatalogoMayorista()
          });
        }
      }
    }
    return jsonResp({ ok: false, error: 'Email no registrado.' });
  } catch(e) {
    return jsonResp({ ok: false, error: 'Error: ' + e.message });
  }
}

function catalogoMayorista(params) {
  try {
    var email = (params.email || '').toLowerCase();
    var hoja  = _getSS().getSheetByName(HOJA_MAYORISTAS);
    if (!hoja) return jsonResp({ ok: false });

    var datos = hoja.getDataRange().getValues();
    var esAprobado = false;
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0].toString().toLowerCase() === email && datos[i][7] === 'aprobado') {
        esAprobado = true;
        break;
      }
    }
    if (!esAprobado) return jsonResp({ ok: false, error: 'No autorizado.' });

    return jsonResp({ ok: true, productos: obtenerCatalogoMayorista() });
  } catch(e) {
    return jsonResp({ ok: false, error: e.message });
  }
}

function obtenerCatalogoMayorista() {
  var hoja = _getSS().getSheetByName('SUPLEMENTOS');
  if (!hoja) return [];

  var datos  = hoja.getDataRange().getValues();
  var prods  = [];
  var catAct = '';

  for (var i = 2; i < datos.length; i++) {
    var row = datos[i];
    var nombre = row[0] ? row[0].toString().trim() : '';
    if (!nombre) continue;

    var precio = parseFloat(row[1]) || 0;
    if (precio === 0) {
      catAct = nombre;
      continue;
    }

    var descMayo   = parseFloat(row[COL_DESC_MAYORISTA - 1]) || 15;
    var precioMayo = Math.round(precio * (1 - descMayo / 100));
    var stock      = parseFloat(row[3]) || 0;
    var img        = row[8] ? row[8].toString() : '';
    var desc       = row[9] ? row[9].toString() : '';

    prods.push({
      id: nombre.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30) + '_' + i,
      name: nombre, brand: catAct,
      cat: categoriaNormalizada(catAct),
      precio: precio,
      precio_lista: Math.round(precio * 1.06),
      precio_mayorista: precioMayo,
      desc_mayorista: descMayo,
      stock: stock, img: img, desc: desc
    });
  }
  return prods;
}

function pedidoMayorista(body) {
  try {
    var ss   = _getSS();
    var hoja = ss.getSheetByName(HOJA_PEDIDOS_MAYO);
    if (!hoja) hoja = ss.insertSheet(HOJA_PEDIDOS_MAYO);

    var itemsStr = body.items.map(function(i) {
      return i.qty + 'x ' + i.nombre + ' ($' + i.precio_mayo + ' c/u)';
    }).join(' | ');

    hoja.appendRow([
      body.codigo, new Date().toLocaleDateString('es-AR'),
      body.cliente.email, body.cliente.nombre, body.cliente.negocio || '',
      body.cliente.telefono, itemsStr,
      body.total_lista, body.total_mayorista, body.ahorro,
      body.direccion, body.pago, body.notas || '', 'Recibido'
    ]);

    var msg = '🏭 *PEDIDO MAYORISTA*\n'
      + 'Código: ' + body.codigo + '\n'
      + '👤 ' + body.cliente.nombre + ' — ' + (body.cliente.negocio||'') + '\n'
      + '📱 ' + body.cliente.telefono + '\n'
      + '💰 Total: $' + _formatoPrecio(body.total_mayorista) + '\n'
      + '💚 Ahorro: $' + _formatoPrecio(body.ahorro) + '\n'
      + '📦 Entrega: ' + body.direccion + '\n'
      + '💳 Pago: ' + body.pago;
    _notificarTelegram(msg);

    if (body.items && body.items.length) {
      descontarStockMayorista(body.items);
      body.items.forEach(function(item) {
        descontarStockDetallado(item.nombre, item.qty || 1);
      });
    }

    return jsonResp({ ok: true, codigo: body.codigo });
  } catch(e) {
    return jsonResp({ ok: false, error: e.message });
  }
}

function descontarStockMayorista(items) {
  try {
    var hoja  = _getSS().getSheetByName('SUPLEMENTOS');
    var datos = hoja.getDataRange().getValues();
    items.forEach(function(item) {
      for (var i = 2; i < datos.length; i++) {
        if (datos[i][0].toString().trim() === item.nombre) {
          var stockActual = parseFloat(datos[i][3]) || 0;
          hoja.getRange(i + 1, 4).setValue(Math.max(0, stockActual - item.qty));
          break;
        }
      }
    });
  } catch(e) {
    Logger.log('Error descontando stock mayorista: ' + e);
  }
}

// ════════════════════════════════════════════════════════════
//  STOCK_DETALLADO — FIFO por fecha de vencimiento
// ════════════════════════════════════════════════════════════

function descontarStockDetallado(nombreProducto, cantidadVendida) {
  try {
    var hoja = _getSS().getSheetByName('STOCK_DETALLADO');
    if (!hoja) return;
    var datos = hoja.getDataRange().getValues();

    var buscar = _normNombreSD(nombreProducto);
    if (!buscar || cantidadVendida <= 0) return;

    // Solo lotes con el nombre EXACTO (ya normalizado) — nada de "parecidos".
    // Así una venta de "Creatina X 300 Grs - Doypack" no descuenta de
    // "...Doypack - Frutos Rojos" ni de "...Pote" (que comparten palabras).
    var lotes = [];
    for (var i = 1; i < datos.length; i++) {
      if (_normNombreSD(datos[i][0]) !== buscar) continue;
      var stock = parseFloat(datos[i][4]) || 0;
      if (stock <= 0) continue;
      lotes.push({ fila: i + 1, stock: stock, venc: datos[i][2] });
    }
    if (lotes.length === 0) return;

    // FIFO: descontar primero del lote que vence antes.
    lotes.sort(function(a, b) {
      var da = a.venc instanceof Date ? a.venc : new Date(a.venc);
      var db = b.venc instanceof Date ? b.venc : new Date(b.venc);
      return da - db;
    });

    var pendiente = cantidadVendida;
    for (var j = 0; j < lotes.length && pendiente > 0; j++) {
      var descontar = Math.min(lotes[j].stock, pendiente);
      hoja.getRange(lotes[j].fila, 5).setValue(lotes[j].stock - descontar);
      pendiente -= descontar;
    }
  } catch(e) {
    Logger.log('Error en descontarStockDetallado: ' + e.message);
  }
}

// Normaliza nombres para comparar de forma EXACTA pero tolerante:
// ignora acentos, mayúsculas, puntuación, espacios de más y "x 300" vs "x300".
function _normNombreSD(n) {
  return String(n || '').trim().toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n')
    .replace(/[.,;:!¡¿?'"()\[\]{}]/g,'')
    .replace(/[-_]+/g,' ')
    .replace(/\s+/g,' ')
    .replace(/x\s*(\d)/g,'x$1')
    .replace(/(\d)\s*,\s*(\d)/g,'$1.$2')
    .trim();
}

// ════════════════════════════════════════════════════════════
//  MAYORISTA — APROBACIÓN / RECHAZO / ADMIN
// ════════════════════════════════════════════════════════════

function aprobarMayorista(params) {
  _validarClave(params.clave);
  try {
    var email = decodeURIComponent(params.email || '');
    var hoja  = _getSS().getSheetByName(HOJA_MAYORISTAS);
    var datos = hoja.getDataRange().getValues();
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0].toString().toLowerCase() === email.toLowerCase()) {
        hoja.getRange(i + 1, 8).setValue('aprobado');
        _notificarTelegram('✅ Mayorista APROBADO: ' + datos[i][1] + ' (' + datos[i][2] + ')\n📱 ' + datos[i][3]);
        return ContentService.createTextOutput('✅ Mayorista ' + datos[i][1] + ' APROBADO. Ya puede ingresar.').setMimeType(ContentService.MimeType.TEXT);
      }
    }
    return ContentService.createTextOutput('Email no encontrado: ' + email).setMimeType(ContentService.MimeType.TEXT);
  } catch(e) {
    return ContentService.createTextOutput('Error: ' + e.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

function rechazarMayorista(params) {
  _validarClave(params.clave);
  try {
    var email = decodeURIComponent(params.email || '');
    var hoja  = _getSS().getSheetByName(HOJA_MAYORISTAS);
    var datos = hoja.getDataRange().getValues();
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0].toString().toLowerCase() === email.toLowerCase()) {
        hoja.getRange(i + 1, 8).setValue('rechazado');
        return ContentService.createTextOutput('❌ Mayorista ' + datos[i][1] + ' RECHAZADO.').setMimeType(ContentService.MimeType.TEXT);
      }
    }
    return ContentService.createTextOutput('Email no encontrado.').setMimeType(ContentService.MimeType.TEXT);
  } catch(e) {
    return ContentService.createTextOutput('Error: ' + e.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

function adminMayoristas(params) {
  _validarClave(params.clave);
  try {
    var hoja = _getSS().getSheetByName(HOJA_MAYORISTAS);
    if (!hoja) return jsonResp({ ok: true, mayoristas: [] });
    var datos = hoja.getDataRange().getValues();
    var lista = [];
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0]) {
        lista.push({
          email: datos[i][0], nombre: datos[i][1], negocio: datos[i][2],
          telefono: datos[i][3], ciudad: datos[i][4], rubro: datos[i][5],
          estado: datos[i][7], fecha: datos[i][8]
        });
      }
    }
    return jsonResp({ ok: true, mayoristas: lista });
  } catch(e) {
    return jsonResp({ ok: false, error: e.message });
  }
}

// ════════════════════════════════════════════════════════════
//  INDUMENTARIA
// ════════════════════════════════════════════════════════════

function extraerTalle(nombre) {
  var n = nombre.trim();
  var re = /(?:[\s,]+(?:-\s*)?|[\s]*-\s*)(T[\/]?U|[2-4]XL[\/-][2-4]XL|XXX+L[\/-]XXX+L|XXL[\/-]XXX+L|XL[\/-]XXX+L|XL[\/-]XXL|L[\/-]XL|L[\/-]XXL|M[\/-]L|M[\/-]XL|S[\/-]M|S[\/-]L|[2-4]XL|XXX+L|XXL|XL|GG|G|L|M|S)\s*$/i;
  var m = n.match(re);
  if (m) {
    var base = n.slice(0, m.index).replace(/[\s,.\-]+$/, '').trim();
    return { base: base, talle: m[1].toUpperCase() };
  }
  return { base: n, talle: '' };
}

function getIndumentaria() {
  try {
    var hoja = _getSS().getSheetByName('INDUMENTARIA');
    if (!hoja) return { ok: false, error: 'Hoja INDUMENTARIA no encontrada', prendas: [] };

    var datos = hoja.getDataRange().getValues();
    var mapa  = {};
    var orden = [];
    var marcaActual = '';
    var lastBase  = '';
    var lastTalle = '';
    var MEN_BRANDS = ['SOUR'];
    var lastCodigo = '';

    for (var i = 2; i < datos.length; i++) {
      var row        = datos[i];
      var codigo     = row[0] ? row[0].toString().trim() : '';
      var nombre     = row[1] ? row[1].toString().trim() : '';
      var color      = row[2] ? row[2].toString().trim() : '';
      var precioUnit = parseFloat(row[3]) || 0;
      var precioList = parseFloat(row[4]) || 0;
      var stock      = parseInt(row[5]) || 0;
      var imgRaw     = row[9] ? row[9].toString().trim() : '';

      if (!nombre && !color && precioUnit === 0) continue;

      if (nombre && precioUnit === 0 && precioList === 0) {
        marcaActual = nombre;
        lastBase = '';
        lastTalle = '';
        lastCodigo = '';
        continue;
      }

      // Trackear código actual (el código aplica a las filas siguientes hasta que aparezca otro)
      if (codigo) lastCodigo = codigo;

      // Soportar múltiples imágenes separadas por salto de línea o ;
      var imgUrls = imgRaw.split(/[\r\n;]+/).map(function(u){ return u.trim(); }).filter(Boolean);
      var imgUrlsProcessed = imgUrls.map(function(url) {
        if (url.indexOf('weserv.nl') !== -1) return url;
        var clean = url.replace('https://','').replace('http://','');
        return 'https://images.weserv.nl/?url=' + clean + '&w=400&output=webp&q=82';
      });
      var imgUrl = imgUrlsProcessed[0] || '';

      if (nombre) {
        var parsed = extraerTalle(nombre);
        lastBase  = parsed.base;
        lastTalle = parsed.talle;
      }

      if (!lastBase) continue;

      // Agrupar por marca + código + nombre base
      // Si tiene código distinto → producto separado aunque tenga el mismo nombre
      var clave = marcaActual + '||' + (lastCodigo || '') + '||' + lastBase;

      if (!mapa[clave]) {
        var genero = MEN_BRANDS.indexOf(marcaActual) >= 0 ? 'H' : 'M';
        mapa[clave] = {
          codigo: codigo, nombre: lastBase, precio: precioUnit,
          precio_lista: precioList || Math.round(precioUnit * 1.06),
          stock: 0, cat: detectarCatIndum(lastBase),
          marca: marcaActual, genero: genero, img: imgUrl, imagenes: [], variantes: []
        };
        orden.push(clave);
      }

      if (lastCodigo && !mapa[clave].codigo) mapa[clave].codigo = lastCodigo;
      if (imgUrl && !mapa[clave].img)    mapa[clave].img    = imgUrl;
      // Acumular imágenes múltiples sin duplicar
      imgUrlsProcessed.forEach(function(u) {
        if (mapa[clave].imagenes.indexOf(u) === -1) mapa[clave].imagenes.push(u);
      });

      mapa[clave].variantes.push({ talle: lastTalle || 'T/U', color: color, stock: stock });
      mapa[clave].stock += stock;
    }

    var prendas = orden.map(function(k) { return mapa[k]; });

    var _itemsInd = prendas.map(function(p){ return { key:(p.marca||'')+'||'+(p.codigo||'')+'||'+p.nombre, stock:Number(p.stock)||0, marca:p.marca||'', nombre:p.nombre, codigo:p.codigo||'' }; });
    return { ok: true, prendas: prendas, total: prendas.length, nuevos_ingresos: _calcularNuevosIngresos('IND', _itemsInd) };
  } catch(e) {
    return { ok: false, error: e.message, prendas: [] };
  }
}

function detectarCatIndum(nombre) {
  var n = nombre.toLowerCase();
  if (n.indexOf('catsuit') >= 0) return 'Catsuit';
  if (n.indexOf('conjunto') >= 0) return 'Conjunto';
  if (n.indexOf('biker') >= 0 || n.indexOf('short') >= 0 || n.indexOf('cancan') >= 0) return 'Calza Corta';
  if (n.indexOf('calza corta') >= 0) return 'Calza Corta';
  if (n.indexOf('calza') >= 0) return 'Calza Larga';
  if (n.indexOf('remera') >= 0 || n.indexOf('remerón') >= 0 || n.indexOf('remeron') >= 0) return 'Remera';
  if (n.indexOf('musculosa') >= 0 || n.indexOf('crop top') >= 0 || n.indexOf('top') >= 0) return 'Top';
  if (n.indexOf('media') >= 0) return 'Medias';
  return 'Otros';
}

// ════════════════════════════════════════════════════════════
//  HOJA REPOSICIÓN
// ════════════════════════════════════════════════════════════

function actualizarHojaReposicion() {
  var ss      = _getSS();
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');
  if (!hojaSup) return;

  var hojaRep = ss.getSheetByName('REPOSICION');
  if (!hojaRep) hojaRep = ss.insertSheet('REPOSICION');

  var STOCK_MINIMO = 3;
  var datos = hojaSup.getDataRange().getValues();
  var hoy   = new Date();
  var fechaStr = Utilities.formatDate(hoy, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm');

  var productos = [];
  var marcaActual = '';

  for (var i = 2; i < datos.length; i++) {
    var row    = datos[i];
    var nombre = String(row[0] || '').trim();
    var precio = Number(row[1]);
    var stock  = Number(row[3]) || 0;

    if (!nombre) continue;
    if (!precio || isNaN(precio)) { marcaActual = nombre; continue; }

    if (stock <= STOCK_MINIMO) {
      productos.push([
        nombre, marcaActual, stock,
        stock === 0 ? '🔴 SIN STOCK' : stock === 1 ? '🟠 CRÍTICO' : '🟡 BAJO',
        precio, fechaStr
      ]);
    }
  }

  hojaRep.clearContents();
  hojaRep.clearFormats();

  var headerRange = hojaRep.getRange(1, 1, 1, 6);
  headerRange.setValues([['Producto', 'Marca', 'Stock actual', 'Estado', 'Precio', 'Última actualización']]);
  headerRange.setBackground('#1a1a2e').setFontColor('#00C8FF').setFontWeight('bold');

  if (productos.length > 0) {
    productos.sort(function(a, b) { return a[2] - b[2]; });
    hojaRep.getRange(2, 1, productos.length, 6).setValues(productos);

    for (var p = 0; p < productos.length; p++) {
      var st = productos[p][2];
      var color = st === 0 ? '#3a0000' : st === 1 ? '#2a1500' : '#1a1a00';
      var fontColor = st === 0 ? '#FF4444' : st === 1 ? '#FF9900' : '#FFD700';
      hojaRep.getRange(p + 2, 1, 1, 6).setBackground(color).setFontColor(fontColor);
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

// ════════════════════════════════════════════════════════════
//  HELPERS GENERALES
// ════════════════════════════════════════════════════════════

function hashPassword(pass) {
  var salt = 'maxup_salt_2024';
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pass + salt);
  var hex = '';
  for (var i = 0; i < digest.length; i++) {
    hex += ('0' + (digest[i] & 0xFF).toString(16)).slice(-2);
  }
  return 'sha256:' + hex;
}

function verificarPassword(pass, hash) {
  // SHA-256 (nuevo)
  if (hash.indexOf('sha256:') === 0) return hashPassword(pass) === hash;
  // XOR legacy — compatibilidad con hashes existentes
  if (hash.indexOf('h:') === 0) {
    var legacyHash = '';
    for (var i = 0; i < pass.length; i++) {
      legacyHash += (pass.charCodeAt(i) ^ 42).toString(16);
    }
    return 'h:' + legacyHash === hash;
  }
  // Plaintext fallback
  return pass === hash;
}

function categoriaNormalizada(cat) {
  var mapa = {
    'PROTEINAS': 'proteina', 'PROTEÍNA': 'proteina',
    'CREATINAS': 'creatina', 'CREATINA': 'creatina',
    'AMINOACIDOS': 'aminoacido', 'AMINOÁCIDOS': 'aminoacido',
    'PRE-ENTRENO': 'preworkout', 'PRE ENTRENO': 'preworkout', 'PREWORKOUT': 'preworkout',
    'QUEMADORES': 'quemador', 'TERMOGENICOS': 'quemador',
    'GAINERS': 'gainer', 'VOLUMINIZADORES': 'gainer',
    'COLAGENO': 'colageno', 'COLÁGENO': 'colageno',
    'VITAMINAS': 'vitamin', 'VITAMINAS Y MINERALES': 'vitamin',
    'HIDRATACION': 'hidratacion', 'HIDRATACIÓN': 'hidratacion',
    'BARRAS': 'barra', 'SNACKS': 'barra',
    'ACCESORIOS': 'accesorio'
  };
  return mapa[cat.toUpperCase()] || 'otro';
}

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

function jsonResp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════════════════════
//  AUTOMATIZACIÓN: RECORDATORIOS DE RECOMPRA
// ════════════════════════════════════════════════════════════

var DURACIONES_PRODUCTO = {
  'creatina': 30, 'whey': 25, 'proteina': 25, 'isolate': 25, 'blend': 25,
  'bcaa': 30, 'glutamina': 30, 'aminoacido': 30, 'pre entreno': 30,
  'pre-entreno': 30, 'colageno': 30, 'omega': 45, 'vitamina': 45,
  'magnesio': 45, 'multivitaminico': 60, 'quemador': 30, 'carnitina': 30,
  'gainer': 20, 'mass': 20, 'hidratacion': 20, 'electrolit': 20
};

function _estimarDuracion(nombreProducto) {
  var n = String(nombreProducto).toLowerCase();
  for (var key in DURACIONES_PRODUCTO) {
    if (n.indexOf(key) >= 0) return DURACIONES_PRODUCTO[key];
  }
  return 0;
}

function recordatoriosRecompra() {
  var ss = _getSS();
  var hojaVD  = ss.getSheetByName('VentasDiarias');
  var hojaCli = ss.getSheetByName('CLIENTES');
  if (!hojaVD || !hojaCli) return;

  var ventas   = hojaVD.getDataRange().getValues();
  var clientes = hojaCli.getDataRange().getValues();
  var hoy = new Date();
  var zona = 'America/Argentina/Buenos_Aires';

  var clienteMap = {};
  for (var c = 1; c < clientes.length; c++) {
    var cod = String(clientes[c][0] || '').trim();
    if (!cod) continue;
    clienteMap[cod] = {
      nombre: String(clientes[c][1] || ''),
      telefono: String(clientes[c][2] || '').replace(/\D/g, ''),
      email: String(clientes[c][3] || '').trim()
    };
  }
  var clienteNombreMap = {};
  for (var k in clienteMap) clienteNombreMap[clienteMap[k].nombre.toLowerCase()] = k;

  var recordatorios = [];

  for (var i = 1; i < ventas.length; i++) {
    var row = ventas[i];
    if (!row[0] || typeof row[0] === 'string') continue;
    var fechaVenta;
    try { fechaVenta = new Date(row[0]); } catch(e) { continue; }
    if (isNaN(fechaVenta.getTime())) continue;

    var producto = String(row[1] || '').trim();
    var clienteNombre = String(row[6] || '').trim();
    if (!producto || !clienteNombre) continue;

    var duracion = _estimarDuracion(producto);
    if (duracion === 0) continue;

    var diasDesdeCompra = Math.floor((hoy - fechaVenta) / 86400000);
    var margen = Math.floor(duracion * 0.85);
    if (diasDesdeCompra < margen || diasDesdeCompra > duracion + 5) continue;

    var codCli = clienteNombreMap[clienteNombre.toLowerCase()] || '';
    var info = codCli ? clienteMap[codCli] : null;
    if (!info || !info.telefono) continue;

    var yaExiste = recordatorios.some(function(r) {
      return r.telefono === info.telefono && r.producto === producto;
    });
    if (yaExiste) continue;

    recordatorios.push({
      nombre: info.nombre || clienteNombre,
      telefono: info.telefono,
      email: info.email,
      producto: producto,
      dias: diasDesdeCompra,
      duracion: duracion
    });
  }

  if (recordatorios.length === 0) return;

  var msgTelegram = '🔄 RECORDATORIOS DE RECOMPRA\n' +
    Utilities.formatDate(hoy, zona, 'dd/MM/yyyy') + '\n\n' +
    recordatorios.length + ' cliente(s) para contactar:\n\n';

  for (var r = 0; r < recordatorios.length; r++) {
    var rec = recordatorios[r];
    var msgWA = 'Hola ' + rec.nombre.split(' ')[0] + '! Soy de MAXUP 💪\n\n' +
      'Hace ' + rec.dias + ' días compraste ' + rec.producto + ' y calculamos que se te debe estar terminando.\n\n' +
      '¿Querés que te reserve uno? Te lo tenemos listo 🚀';
    var linkWA = 'https://wa.me/54' + rec.telefono + '?text=' + encodeURIComponent(msgWA);

    msgTelegram += '👤 ' + rec.nombre + '\n';
    msgTelegram += '📦 ' + rec.producto + ' (hace ' + rec.dias + ' días)\n';
    msgTelegram += '📱 Click para enviar: ' + linkWA + '\n\n';

    if (rec.email) {
      try {
        MailApp.sendEmail({
          to: rec.email,
          subject: '¿Se te terminó ' + rec.producto + '? — MAXUP',
          htmlBody: '<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">' +
            '<h2 style="color:#00C8FF">¡Hola ' + rec.nombre.split(' ')[0] + '! 💪</h2>' +
            '<p>Hace <strong>' + rec.dias + ' días</strong> compraste <strong>' + rec.producto + '</strong> y calculamos que se te debe estar terminando.</p>' +
            '<p>¿Querés que te reservemos uno? Escribinos y te lo tenemos listo:</p>' +
            '<a href="' + linkWA + '" style="display:inline-block;background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">📲 Escribinos por WhatsApp</a>' +
            '<p style="color:#888;font-size:12px;margin-top:24px">MAXUP Suplementos — maxupsuplementos.com.ar</p>' +
            '</div>'
        });
      } catch(e) { Logger.log('Error email recompra: ' + e.message); }
    }
  }

  _notificarTelegram(msgTelegram);
}

// ════════════════════════════════════════════════════════════
//  AUTOMATIZACIÓN: ALERTAS DE OFERTAS A CLIENTES
// ════════════════════════════════════════════════════════════

function alertaOfertasClientes() {
  var ss = _getSS();
  var ofertas = _leerOfertasHoja(20);
  if (!ofertas || !ofertas.length) return;

  var ofertasUrgentes = ofertas.filter(function(p) {
    return p.urgencia === 'critico' || p.urgencia === 'urgente';
  });
  if (ofertasUrgentes.length === 0) return;

  var hojaVD  = ss.getSheetByName('VentasDiarias');
  var hojaCli = ss.getSheetByName('CLIENTES');
  if (!hojaVD || !hojaCli) return;

  var ventas   = hojaVD.getDataRange().getValues();
  var clientes = hojaCli.getDataRange().getValues();

  var clienteMap = {};
  for (var c = 1; c < clientes.length; c++) {
    var cod = String(clientes[c][0] || '').trim();
    if (!cod) continue;
    clienteMap[String(clientes[c][1] || '').toLowerCase()] = {
      nombre: String(clientes[c][1] || ''),
      telefono: String(clientes[c][2] || '').replace(/\D/g, ''),
      email: String(clientes[c][3] || '').trim()
    };
  }

  var clientesNotificar = {};
  for (var o = 0; o < ofertasUrgentes.length; o++) {
    var oferta = ofertasUrgentes[o];
    var nomOferta = String(oferta.producto || oferta.nombre || '').toLowerCase();

    for (var v = 1; v < ventas.length; v++) {
      var nomVenta = String(ventas[v][1] || '').toLowerCase();
      var cliNombre = String(ventas[v][6] || '').toLowerCase().trim();
      if (!cliNombre || nomVenta.indexOf(nomOferta) < 0) continue;
      var info = clienteMap[cliNombre];
      if (!info || !info.telefono) continue;

      if (!clientesNotificar[info.telefono]) {
        clientesNotificar[info.telefono] = { nombre: info.nombre, telefono: info.telefono, email: info.email, productos: [] };
      }
      var yaAgregado = clientesNotificar[info.telefono].productos.some(function(p) { return p.nombre === oferta.producto; });
      if (!yaAgregado) {
        clientesNotificar[info.telefono].productos.push({
          nombre: oferta.producto || oferta.nombre,
          precioOferta: oferta.precioOferta,
          ahorro: oferta.ahorro,
          diasRestantes: oferta.diasRestantes
        });
      }
    }
  }

  var lista = Object.keys(clientesNotificar).map(function(k) { return clientesNotificar[k]; });
  if (lista.length === 0) return;

  var hoy = new Date();
  var zona = 'America/Argentina/Buenos_Aires';
  var msgTelegram = '🔥 OFERTAS — Clientes para contactar\n' +
    Utilities.formatDate(hoy, zona, 'dd/MM/yyyy') + '\n\n';

  for (var i = 0; i < lista.length; i++) {
    var cli = lista[i];
    var prodsTexto = cli.productos.map(function(p) {
      return p.nombre + ' a $' + _formatoPrecio(p.precioOferta) + ' (-' + p.ahorro + '%)';
    }).join('\n');

    var msgWA = 'Hola ' + cli.nombre.split(' ')[0] + '! 🔥\n\n' +
      'Tenemos ofertas especiales en productos que compraste:\n\n' +
      prodsTexto + '\n\n' +
      '¡Stock limitado! ¿Te reservo alguno?';
    var linkWA = 'https://wa.me/54' + cli.telefono + '?text=' + encodeURIComponent(msgWA);

    msgTelegram += '👤 ' + cli.nombre + '\n';
    msgTelegram += '📦 ' + cli.productos.map(function(p) { return p.nombre; }).join(', ') + '\n';
    msgTelegram += '📱 ' + linkWA + '\n\n';

    if (cli.email) {
      try {
        var htmlProds = cli.productos.map(function(p) {
          return '<li><strong>' + p.nombre + '</strong> — $' + _formatoPrecio(p.precioOferta) + ' <span style="color:#00FF88">(-' + p.ahorro + '%)</span></li>';
        }).join('');
        MailApp.sendEmail({
          to: cli.email,
          subject: '🔥 Ofertas especiales para vos — MAXUP',
          htmlBody: '<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">' +
            '<h2 style="color:#FF0099">¡' + cli.nombre.split(' ')[0] + ', tenemos ofertas para vos!</h2>' +
            '<ul style="line-height:2">' + htmlProds + '</ul>' +
            '<p>Stock limitado, no te las pierdas:</p>' +
            '<a href="' + linkWA + '" style="display:inline-block;background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">📲 Reservar por WhatsApp</a>' +
            '<p style="color:#888;font-size:12px;margin-top:24px">MAXUP Suplementos — maxupsuplementos.com.ar</p>' +
            '</div>'
        });
      } catch(e) { Logger.log('Error email oferta: ' + e.message); }
    }
  }

  _notificarTelegram(msgTelegram);
}

// ════════════════════════════════════════════════════════════
//  AUTOMATIZACIÓN: BIENVENIDA CLIENTE NUEVO
// ════════════════════════════════════════════════════════════

function bienvenidaClientesNuevos() {
  var ss = _getSS();
  var hojaCli = ss.getSheetByName('CLIENTES');
  if (!hojaCli) return;

  var datos = hojaCli.getDataRange().getValues();
  var headers = datos[0];
  var hoy = new Date();
  var zona = 'America/Argentina/Buenos_Aires';
  var mesActual = _buscarColumnaMes(headers, hoy);

  var colBienvenida = -1;
  for (var h = 0; h < headers.length; h++) {
    if (String(headers[h]).toLowerCase() === 'bienvenida') { colBienvenida = h; break; }
  }
  if (colBienvenida < 0) {
    hojaCli.getRange(1, headers.length + 1).setValue('Bienvenida');
    colBienvenida = headers.length;
  }

  var nuevos = [];
  for (var i = 1; i < datos.length; i++) {
    var cod    = String(datos[i][0] || '').trim();
    var nombre = String(datos[i][1] || '').trim();
    var tel    = String(datos[i][2] || '').replace(/\D/g, '');
    var email  = String(datos[i][3] || '').trim();
    var yaEnviado = String(datos[i][colBienvenida] || '').trim();

    if (!cod || !nombre || !tel || yaEnviado) continue;

    var tieneCompra = false;
    if (mesActual >= 0 && Number(datos[i][mesActual]) > 0) tieneCompra = true;
    if (!tieneCompra) {
      var mesAnt = _buscarColumnaMes(headers, new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
      if (mesAnt >= 0 && Number(datos[i][mesAnt]) > 0) tieneCompra = true;
    }
    if (!tieneCompra) continue;

    nuevos.push({ fila: i + 1, nombre: nombre, telefono: tel, email: email });
  }

  if (nuevos.length === 0) return;

  var config = _getConfig();
  var urlWeb = 'https://maxupsuplementos.com.ar';
  var msgTelegram = '👋 CLIENTES NUEVOS — Bienvenida\n' +
    Utilities.formatDate(hoy, zona, 'dd/MM/yyyy') + '\n\n';

  for (var n = 0; n < nuevos.length; n++) {
    var cli = nuevos[n];
    var msgWA = 'Hola ' + cli.nombre.split(' ')[0] + '! 👋\n\n' +
      'Gracias por confiar en MAXUP para tu nutrición deportiva 💪\n\n' +
      'Tenés un 5% de descuento en tu primera compra como bienvenida 🎁\n\n' +
      'Cualquier duda sobre productos, dosis o combinaciones, escribinos sin compromiso.\n\n' +
      '🌐 Catálogo: ' + urlWeb;
    var linkWA = 'https://wa.me/54' + cli.telefono + '?text=' + encodeURIComponent(msgWA);

    msgTelegram += '👤 ' + cli.nombre + '\n';
    msgTelegram += '📱 ' + linkWA + '\n\n';

    if (cli.email) {
      try {
        MailApp.sendEmail({
          to: cli.email,
          subject: '¡Bienvenido/a a MAXUP! 💪 Tu 5% de descuento',
          htmlBody: '<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">' +
            '<h2 style="color:#00C8FF">¡Bienvenido/a ' + cli.nombre.split(' ')[0] + '! 💪</h2>' +
            '<p>Gracias por confiar en MAXUP para tu nutrición deportiva.</p>' +
            '<p style="background:linear-gradient(135deg,#00C8FF,#FF0099);color:white;padding:16px;border-radius:10px;text-align:center;font-size:18px;font-weight:bold">🎁 5% de descuento en tu próxima compra</p>' +
            '<p>Cualquier duda sobre productos, dosis o combinaciones, escribinos:</p>' +
            '<a href="' + linkWA + '" style="display:inline-block;background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">📲 Escribinos por WhatsApp</a>' +
            '<p><a href="' + urlWeb + '" style="color:#00C8FF">🌐 Ver catálogo completo</a></p>' +
            '<p style="color:#888;font-size:12px;margin-top:24px">MAXUP Suplementos — maxupsuplementos.com.ar</p>' +
            '</div>'
        });
      } catch(e) { Logger.log('Error email bienvenida: ' + e.message); }
    }

    hojaCli.getRange(cli.fila, colBienvenida + 1).setValue(Utilities.formatDate(hoy, zona, 'dd/MM/yyyy'));
  }

  _notificarTelegram(msgTelegram);
}

// ════════════════════════════════════════════════════════════
//  AUTOMATIZACIÓN: CONTENIDO DIARIO PARA REDES SOCIALES
// ════════════════════════════════════════════════════════════

function generarContenidoRedes() {
  var ss = _getSS();
  var hoy = new Date();
  var zona = 'America/Argentina/Buenos_Aires';
  var diaSemana = hoy.getDay();
  var urlWeb = 'https://maxupsuplementos.com.ar';

  var HASHTAGS_BASE = '#suplementos #fitness #gym #nutricion #salta #argentina #maxup #salud #entrenamiento #proteina';

  var posts = [];

  // ── TIPO 1: OFERTAS POR VENCIMIENTO (Lunes y Jueves)
  if (diaSemana === 1 || diaSemana === 4) {
    var ofertas = _leerOfertasHoja(10);
    var ofertasBuenas = ofertas.filter(function(p) {
      return (p.urgencia === 'critico' || p.urgencia === 'urgente') && p.precioOferta > 0;
    });
    if (ofertasBuenas.length > 0) {
      var top = ofertasBuenas.slice(0, 3);
      var textoIG = '🔥 OFERTAS DE LA SEMANA 🔥\n\n';
      var textoFB = '🔥 ¡OFERTAS IMPERDIBLES en MAXUP! 🔥\n\n';
      var textoTT = '🔥 Ofertas que no vas a encontrar en otro lado 👇\n\n';

      for (var i = 0; i < top.length; i++) {
        var o = top[i];
        var linea = '✅ ' + (o.producto || o.nombre) + '\n' +
          '   💰 $' + _formatoPrecio(o.precioOferta) + ' (antes $' + _formatoPrecio(o.precio) + ')\n' +
          '   📉 ' + o.ahorro + '% OFF\n\n';
        textoIG += linea;
        textoFB += linea;
        textoTT += '• ' + (o.producto || o.nombre) + ' → $' + _formatoPrecio(o.precioOferta) + ' (-' + o.ahorro + '%)\n';
      }

      textoIG += '⚡ Stock limitado\n📲 Pedí por WhatsApp o entrá al catálogo\n🔗 Link en bio\n\n' + HASHTAGS_BASE + ' #ofertas #descuentos #promo';
      textoFB += '⚡ Stock limitado — ¡No te quedes sin el tuyo!\n\n📲 Escribinos por WhatsApp\n🌐 ' + urlWeb;
      textoTT += '\n📲 Link en bio para ver todo\n\n' + HASHTAGS_BASE + ' #ofertas #fyp #viral';

      posts.push({ tipo: '🏷️ OFERTAS', instagram: textoIG, facebook: textoFB, tiktok: textoTT, imagenes: top.map(function(o) { return o.producto || o.nombre; }) });
    }
  }

  // ── TIPO 2: PRODUCTO DESTACADO (Martes y Viernes)
  if (diaSemana === 2 || diaSemana === 5) {
    var hojaVD = ss.getSheetByName('VentasDiarias');
    if (hojaVD) {
      var ventas = hojaVD.getDataRange().getValues();
      var conteo = {};
      var hace30 = new Date(hoy.getTime() - 30 * 86400000);
      for (var v = 1; v < ventas.length; v++) {
        if (!ventas[v][0] || typeof ventas[v][0] === 'string') continue;
        try {
          var fv = new Date(ventas[v][0]);
          if (fv >= hace30) {
            var prod = String(ventas[v][1] || '').trim();
            var cant = Number(ventas[v][3]) || 1;
            if (prod) conteo[prod] = (conteo[prod] || 0) + cant;
          }
        } catch(e) {}
      }
      var ranking = Object.keys(conteo).map(function(k) { return { nombre: k, cant: conteo[k] }; });
      ranking.sort(function(a, b) { return b.cant - a.cant; });

      if (ranking.length > 0) {
        var hojaSup = ss.getSheetByName('SUPLEMENTOS');
        var best = ranking[0];
        var precioInfo = '';
        if (hojaSup) {
          var supData = hojaSup.getDataRange().getValues();
          for (var s = 0; s < supData.length; s++) {
            if (String(supData[s][0]).toLowerCase() === best.nombre.toLowerCase()) {
              precioInfo = '$' + _formatoPrecio(supData[s][1]);
              break;
            }
          }
        }

        var textoIG = '🏆 PRODUCTO MÁS VENDIDO DEL MES 🏆\n\n' +
          '💪 ' + best.nombre + '\n' +
          (precioInfo ? '💰 ' + precioInfo + '\n' : '') +
          '📊 +' + best.cant + ' unidades vendidas este mes\n\n' +
          '¿Por qué es el favorito? Porque funciona. 💯\n\n' +
          '📲 Consultanos por WhatsApp\n🔗 Link en bio\n\n' +
          HASHTAGS_BASE + ' #masvendido #top #recomendado';

        var textoFB = '🏆 EL MÁS VENDIDO DEL MES\n\n' +
          '💪 ' + best.nombre + '\n' +
          (precioInfo ? '💰 ' + precioInfo + '\n' : '') +
          '📊 +' + best.cant + ' unidades vendidas\n\n' +
          'El favorito de nuestros clientes. ¿Ya lo probaste?\n\n' +
          '📲 Pedí el tuyo\n🌐 ' + urlWeb;

        var textoTT = '🏆 El suplemento MÁS VENDIDO del mes 👇\n\n' +
          '💪 ' + best.nombre + '\n' +
          '📊 +' + best.cant + ' vendidos\n' +
          (precioInfo ? '💰 ' + precioInfo + '\n' : '') +
          '\n¿Vos ya lo probaste? 🤔\n\n' +
          HASHTAGS_BASE + ' #masvendido #fyp #viral';

        posts.push({ tipo: '🏆 MÁS VENDIDO', instagram: textoIG, facebook: textoFB, tiktok: textoTT, imagenes: [best.nombre] });
      }
    }
  }

  // ── TIPO 3: TIPS Y EDUCACIÓN (Miércoles)
  if (diaSemana === 3) {
    var tips = [
      { titulo: 'Creatina', texto: '¿Sabías que la creatina es el suplemento con MÁS evidencia científica? 🧬\n\n✅ Mejora fuerza y potencia\n✅ Acelera recuperación\n✅ 3-5g por día es suficiente\n✅ No necesita fase de carga\n✅ Segura a largo plazo\n\n¡Y en MAXUP tenemos las mejores marcas!' },
      { titulo: 'Proteína', texto: '¿Cuánta proteína necesitás por día? 🤔\n\n📊 Sedentario: 0.8g/kg\n🏃 Activo: 1.2-1.6g/kg\n💪 Entrena fuerza: 1.6-2.2g/kg\n🏋️ Competidor: 2.2-2.8g/kg\n\nEjemplo: Si pesás 75kg y entrenás → 120-165g de proteína/día\n\n¡Te ayudamos a elegir la mejor opción!' },
      { titulo: 'Pre-entreno', texto: '⚡ ¿Cuándo tomar tu pre-entreno?\n\n⏰ 20-30 min antes de entrenar\n🚫 No después de las 17hs (puede afectar el sueño)\n💧 Con agua fría para mejor absorción\n📏 Empezá con media dosis si es tu primera vez\n⚠️ No mezclar con café el mismo día\n\n¡Consultanos cuál es el mejor para vos!' },
      { titulo: 'BCAA', texto: '🧬 BCAA: ¿Cuándo sirven realmente?\n\n✅ Entrenás en ayunas → SÍ, protegen músculo\n✅ No llegás a tu cuota de proteína → SÍ, complementan\n❌ Ya tomás whey suficiente → No necesitás extra\n\n💡 Tip: 5-10g antes o durante el entreno\n\n¡En MAXUP te asesoramos sin compromiso!' },
      { titulo: 'Colágeno', texto: '🦴 Colágeno: No es solo para la piel\n\n✅ Protege articulaciones\n✅ Fortalece tendones y ligamentos\n✅ Mejora recuperación post-entreno\n✅ Ideal si entrenás fuerte o tenés +30 años\n\n💡 Tip: Combinalo con Vitamina C para máxima absorción\n\n¡Consultanos!' },
      { titulo: 'Hidratación', texto: '💧 ¿Sabías que un 2% de deshidratación baja tu rendimiento un 20%?\n\n✅ Bebé 500ml 2hs antes de entrenar\n✅ 200ml cada 15-20 min durante\n✅ Reponé electrolitos si sudás mucho\n✅ No esperes a tener sed\n\n¡Tenemos bebidas isotónicas listas para tu entreno!' }
    ];

    var semana = Math.floor(hoy.getDate() / 7);
    var tip = tips[semana % tips.length];

    var textoIG = '💡 TIP MAXUP 💡\n\n' + tip.texto + '\n\n📲 Escribinos por WhatsApp\n🔗 Link en bio\n\n' + HASHTAGS_BASE + ' #tips #consejo #nutricióndeportiva';
    var textoFB = '💡 TIP DEL DÍA\n\n' + tip.texto + '\n\n📲 ¿Dudas? Escribinos\n🌐 ' + urlWeb;
    var textoTT = '💡 ' + tip.titulo + ' — Lo que nadie te dice 👇\n\n' + tip.texto + '\n\n' + HASHTAGS_BASE + ' #tips #fyp #aprendeentiktok';

    posts.push({ tipo: '💡 TIP: ' + tip.titulo, instagram: textoIG, facebook: textoFB, tiktok: textoTT, imagenes: [] });
  }

  // ── TIPO 4: INDUMENTARIA (Sábado)
  if (diaSemana === 6) {
    var hojaInd = ss.getSheetByName('INDUMENTARIA');
    if (hojaInd) {
      var datosInd = hojaInd.getDataRange().getValues();
      var prendas = [];
      var marcaInd = '';
      for (var j = 2; j < datosInd.length; j++) {
        var nombreInd = String(datosInd[j][1] || '').trim();
        var precioInd = Number(datosInd[j][3]) || 0;
        var stockInd = Number(datosInd[j][5]) || 0;
        if (nombreInd && !datosInd[j][2] && precioInd === 0) { marcaInd = nombreInd; continue; }
        if (nombreInd && precioInd > 0 && stockInd > 0) {
          prendas.push({ nombre: nombreInd, marca: marcaInd, precio: precioInd, stock: stockInd });
        }
      }
      if (prendas.length > 0) {
        prendas.sort(function() { return Math.random() - 0.5; });
        var seleccion = prendas.slice(0, 4);

        var textoIG = '👗 INDUMENTARIA DEPORTIVA 👗\n\n';
        var textoFB = '👗 ¡Nueva colección de indumentaria deportiva!\n\n';
        for (var p = 0; p < seleccion.length; p++) {
          var pr = seleccion[p];
          var lineaInd = '• ' + pr.nombre + (pr.marca ? ' (' + pr.marca + ')' : '') + ' — $' + _formatoPrecio(pr.precio) + '\n';
          textoIG += lineaInd;
          textoFB += lineaInd;
        }
        textoIG += '\n💳 Efectivo y tarjeta\n📲 Consultá talles y colores por WhatsApp\n🔗 Link en bio\n\n' + HASHTAGS_BASE + ' #indumentaria #ropaDeportiva #gym #outfit';
        textoFB += '\n💳 Efectivo y tarjeta\n📲 Consultá disponibilidad\n🌐 ' + urlWeb + '/indumentaria.html';

        var textoTT = '👗 Ropa deportiva que necesitás 👇\n\n' +
          seleccion.map(function(pr) { return '• ' + pr.nombre + ' $' + _formatoPrecio(pr.precio); }).join('\n') +
          '\n\n📲 Link en bio\n\n' + HASHTAGS_BASE + ' #ropaDeportiva #fyp #outfit';

        posts.push({ tipo: '👗 INDUMENTARIA', instagram: textoIG, facebook: textoFB, tiktok: textoTT, imagenes: seleccion.map(function(pr) { return pr.nombre; }) });
      }
    }
  }

  // ── TIPO 5: STATS DEL MES (Domingo)
  if (diaSemana === 0) {
    var hojaVD2 = ss.getSheetByName('VentasDiarias');
    if (hojaVD2) {
      var ventasMes = hojaVD2.getDataRange().getValues();
      var totalMes = 0;
      var clientesMes = {};
      var mesActual = hoy.getMonth();
      for (var vm = 1; vm < ventasMes.length; vm++) {
        if (!ventasMes[vm][0] || typeof ventasMes[vm][0] === 'string') continue;
        try {
          var fvm = new Date(ventasMes[vm][0]);
          if (fvm.getMonth() === mesActual) {
            totalMes += Number(ventasMes[vm][3]) || 0;
            var cliNom = String(ventasMes[vm][6] || '').trim();
            if (cliNom) clientesMes[cliNom] = true;
          }
        } catch(e) {}
      }

      var textoIG = '📊 MAXUP EN NÚMEROS 📊\n\n' +
        '💪 +' + totalMes + ' productos entregados este mes\n' +
        '👥 ' + Object.keys(clientesMes).length + ' clientes confían en nosotros\n' +
        '⭐ 100% productos originales\n' +
        '🚀 Envíos a todo Salta\n\n' +
        '¡Gracias por elegirnos! 🙌\n\n' +
        '📲 Unite vos también\n🔗 Link en bio\n\n' + HASHTAGS_BASE + ' #comunidad #resultados';

      var textoFB = '📊 ¡Gracias por elegirnos!\n\n' +
        '💪 +' + totalMes + ' productos entregados este mes\n' +
        '👥 ' + Object.keys(clientesMes).length + ' clientes satisfechos\n\n' +
        '⭐ 100% productos originales y al mejor precio\n\n' +
        '🌐 ' + urlWeb;

      var textoTT = '📊 Lo que logramos este mes 👇\n\n' +
        '💪 +' + totalMes + ' productos entregados\n' +
        '👥 ' + Object.keys(clientesMes).length + ' clientes\n' +
        '⭐ 100% originales\n\n' +
        '¿Todavía no nos probaste? 🤔\n\n' + HASHTAGS_BASE + ' #fyp #viral #emprendimiento';

      posts.push({ tipo: '📊 STATS DEL MES', instagram: textoIG, facebook: textoFB, tiktok: textoTT, imagenes: [] });
    }
  }

  if (posts.length === 0) return;

  var msgTelegram = '📱 CONTENIDO PARA REDES — ' +
    Utilities.formatDate(hoy, zona, 'EEEE dd/MM') + '\n';
  msgTelegram += '━━━━━━━━━━━━━━━━━━━━\n\n';

  for (var idx = 0; idx < posts.length; idx++) {
    var post = posts[idx];
    msgTelegram += '📌 ' + post.tipo + '\n';
    msgTelegram += '━━━━━━━━━━━━━━━━━━━━\n\n';

    msgTelegram += '📸 INSTAGRAM:\n';
    msgTelegram += '─────────────\n';
    msgTelegram += post.instagram + '\n\n';

    msgTelegram += '📘 FACEBOOK:\n';
    msgTelegram += '─────────────\n';
    msgTelegram += post.facebook + '\n\n';

    msgTelegram += '🎵 TIKTOK:\n';
    msgTelegram += '─────────────\n';
    msgTelegram += post.tiktok + '\n\n';

    if (post.imagenes && post.imagenes.length > 0) {
      msgTelegram += '🖼️ Productos para la foto/video: ' + post.imagenes.join(', ') + '\n\n';
    }

    msgTelegram += '━━━━━━━━━━━━━━━━━━━━\n\n';
  }

  msgTelegram += '💡 Tip: Copiá el texto, agregá tu foto/video y publicá.\n';
  msgTelegram += '📷 Usá fotos reales de los productos para mejor engagement.';

  _notificarTelegram(msgTelegram);
}

// ============================================================
//  TRIGGER onEdit — Cambiar estado desde la hoja PEDIDOS
//  Cuando editás la columna J (Estado) en la hoja PEDIDOS,
//  se descuenta stock automáticamente si ponés Entregado/Retirado
// ============================================================
function onEdit(e) {
  try {
    var hoja = e.source.getActiveSheet();
    if (hoja.getName() !== 'PEDIDOS') return;

    var rango = e.range;
    var col = rango.getColumn();
    var fila = rango.getRow();
    if (col !== 10 || fila < 2) return;

    var nuevoEstado = String(e.value || '').trim();
    var estadoAnterior = String(e.oldValue || '').trim();
    var estadosFinales = ['Entregado', 'Retirado'];

    if (estadosFinales.indexOf(nuevoEstado) >= 0 && estadosFinales.indexOf(estadoAnterior) < 0) {
      var rowData = hoja.getRange(fila, 1, 1, 11).getValues()[0];
      var codigo = String(rowData[0]);
      var cliente = String(rowData[2]);
      var itemsJSON = String(rowData[10] || '[]');
      try {
        var items = JSON.parse(itemsJSON);
        _descontarStockPedido(items);
        _notificarTelegram('✅ ' + codigo + ' → ' + nuevoEstado + ' (' + cliente + ')\n📦 Stock descontado automáticamente');
      } catch(eJSON) {
        _notificarTelegram('⚠️ ' + codigo + ' → ' + nuevoEstado + ' (' + cliente + ')\n❌ No se pudo descontar stock');
      }
    }

    var colores = {
      'Recibido': '#FFF3CD',
      'En preparación': '#CCE5FF',
      'Listo para retirar': '#D4EDDA',
      'Enviado': '#D1ECF1',
      'Entregado': '#C3E6CB',
      'Retirado': '#C3E6CB',
      'Cancelado': '#F5C6CB'
    };
    if (colores[nuevoEstado]) {
      rango.setBackground(colores[nuevoEstado]).setFontColor('#000');
    }
  } catch(err) {
    Logger.log('onEdit error: ' + err.message);
  }
}

// ============================================================
//  SETUP: Crear desplegable de estados en hoja PEDIDOS
//  Ejecutar UNA VEZ para configurar
// ============================================================
function setupPedidos() {
  var ss = _getSS();
  var hoja = ss.getSheetByName('PEDIDOS');
  if (!hoja) { Logger.log('Hoja PEDIDOS no encontrada'); return; }

  var headers = hoja.getRange(1, 1, 1, 11).getValues()[0];
  if (!headers[10] || headers[10] !== 'Items JSON') {
    hoja.getRange(1, 11).setValue('Items JSON').setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#00C8FF');
  }
  hoja.hideColumns(11);

  var ultimaFila = Math.max(hoja.getLastRow(), 100);
  var regla = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Recibido','En preparación','Listo para retirar','Enviado','Entregado','Retirado','Cancelado'], true)
    .setAllowInvalid(false)
    .build();
  hoja.getRange(2, 10, ultimaFila - 1, 1).setDataValidation(regla);
  hoja.setColumnWidth(10, 150);

  Logger.log('✅ PEDIDOS configurado con desplegable de estados');
}

// ── DASHBOARD ─────────────────────────────────────────────────
function adminGetDashboard(clave) {
  _validarClave(clave);
  var ss = _getSS();
  var hojaVD = ss.getSheetByName('VentasDiarias');
  if (!hojaVD) return { ok: true, semana: 0, mes: 0, pedidosMes: 0, ticketProm: 0, topProductos: [], topMarcas: [], ultimos7: [] };

  var hoy = new Date();
  var tz = 'America/Argentina/Buenos_Aires';
  var rows = hojaVD.getDataRange().getValues();

  // Calcular fechas de referencia
  var hace7 = new Date(hoy); hace7.setDate(hace7.getDate() - 7);
  var primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  var totalSemana = 0, totalMes = 0, ventasMes = 0;
  var prodMap = {}, marcaMap = {};
  var dias = {}; // dd/MM → total

  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0] || typeof rows[i][0] === 'string') continue;
    var fecha;
    try { fecha = new Date(rows[i][0]); } catch(e) { continue; }
    var monto = Number(rows[i][5]) || 0;
    var nombre = String(rows[i][1] || '');
    var marca = String(rows[i][2] || '');
    var cantidad = Number(rows[i][3]) || 1;

    // Este mes
    if (fecha >= primerDiaMes) {
      totalMes += monto;
      ventasMes++;
      // Top productos
      if (nombre) {
        if (!prodMap[nombre]) prodMap[nombre] = { nombre: nombre, marca: marca, cantidad: 0, total: 0 };
        prodMap[nombre].cantidad += cantidad;
        prodMap[nombre].total += monto;
      }
      // Top marcas
      if (marca) {
        if (!marcaMap[marca]) marcaMap[marca] = { marca: marca, total: 0 };
        marcaMap[marca].total += monto;
      }
    }

    // Esta semana
    if (fecha >= hace7) {
      totalSemana += monto;
    }

    // Últimos 7 días (para gráfico)
    if (fecha >= hace7) {
      var diaKey = Utilities.formatDate(fecha, tz, 'dd/MM');
      if (!dias[diaKey]) dias[diaKey] = 0;
      dias[diaKey] += monto;
    }
  }

  // Armar array de últimos 7 días
  var ultimos7 = [];
  for (var d = 6; d >= 0; d--) {
    var dia = new Date(hoy); dia.setDate(dia.getDate() - d);
    var key = Utilities.formatDate(dia, tz, 'dd/MM');
    var diaNombre = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][dia.getDay()];
    ultimos7.push({ dia: diaNombre + ' ' + key, total: dias[key] || 0 });
  }

  // Top productos (ordenar por total, top 10)
  var topProductos = Object.values(prodMap);
  topProductos.sort(function(a,b){ return b.total - a.total; });
  if (topProductos.length > 10) topProductos.length = 10;

  // Top marcas (ordenar por total, top 5)
  var topMarcas = Object.values(marcaMap);
  topMarcas.sort(function(a,b){ return b.total - a.total; });
  if (topMarcas.length > 5) topMarcas.length = 5;

  // Pedidos web del mes
  var pedidosMes = 0;
  var hojaPed = ss.getSheetByName('PEDIDOS');
  if (hojaPed && hojaPed.getLastRow() > 1) {
    var rowsPed = hojaPed.getDataRange().getValues();
    for (var j = 1; j < rowsPed.length; j++) {
      if (!rowsPed[j][1]) continue;
      try {
        var fPed = new Date(rowsPed[j][1]);
        if (fPed >= primerDiaMes) pedidosMes++;
      } catch(e) {}
    }
  }

  return {
    ok: true,
    semana: totalSemana,
    mes: totalMes,
    pedidosMes: pedidosMes,
    ticketProm: ventasMes > 0 ? Math.round(totalMes / ventasMes) : 0,
    topProductos: topProductos,
    topMarcas: topMarcas,
    ultimos7: ultimos7
  };
}

// ── MANTENIMIENTO ─────────────────────────────────────────────
function getMantenimiento() {
  var props = PropertiesService.getScriptProperties();
  var activo = props.getProperty('MANT_ACTIVO') === 'true';
  var mensaje = props.getProperty('MANT_MENSAJE') || '';
  return { ok: true, activo: activo, mensaje: mensaje };
}

function adminMantenimiento(claveIn, activoIn, mensajeIn) {
  var config = _getConfig();
  if (claveIn !== config.ADMIN_CLAVE) return { ok: false, error: 'Clave incorrecta' };
  var props = PropertiesService.getScriptProperties();
  if (typeof activoIn !== 'undefined' && activoIn !== null) {
    var activo = (activoIn === 'true' || activoIn === '1');
    props.setProperty('MANT_ACTIVO', activo ? 'true' : 'false');
    if (mensajeIn) props.setProperty('MANT_MENSAJE', mensajeIn);
    if (!activo) props.setProperty('MANT_MENSAJE', '');
    return { ok: true, activo: activo, mensaje: activo ? (mensajeIn || props.getProperty('MANT_MENSAJE') || '') : '' };
  }
  // Solo consultar estado
  return getMantenimiento();
}

// ── HISTORIAL DE PEDIDOS POR CLIENTE ────────────────────────
function getHistorialCliente(telefono) {
  if (!telefono || telefono.length < 8) return { ok: false, error: 'Teléfono inválido' };
  try {
    var ss = _getSS();
    var sheet = ss.getSheetByName('Pedidos');
    if (!sheet) return { ok: false, error: 'Hoja no encontrada' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var colTel = -1, colCodigo = -1, colEstado = -1, colFecha = -1, colTotal = -1;
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i]).toLowerCase().trim();
      if (h === 'telefono' || h === 'whatsapp' || h === 'celular') colTel = i;
      if (h === 'codigo' || h === 'código' || h === 'pedido') colCodigo = i;
      if (h === 'estado') colEstado = i;
      if (h === 'fecha') colFecha = i;
      if (h === 'total') colTotal = i;
    }
    if (colTel < 0) return { ok: false, error: 'No se encontró columna teléfono' };

    var telLimpio = telefono.replace(/[^0-9]/g, '');
    var pedidos = [];
    var totalGastado = 0;

    for (var r = 1; r < data.length; r++) {
      var rowTel = String(data[r][colTel] || '').replace(/[^0-9]/g, '');
      if (rowTel.length >= 8 && (rowTel.indexOf(telLimpio) >= 0 || telLimpio.indexOf(rowTel) >= 0)) {
        var total = colTotal >= 0 ? Number(data[r][colTotal]) || 0 : 0;
        totalGastado += total;
        pedidos.push({
          codigo: colCodigo >= 0 ? String(data[r][colCodigo]) : 'N/A',
          estado: colEstado >= 0 ? String(data[r][colEstado]) : 'desconocido',
          fecha:  colFecha >= 0 ? Utilities.formatDate(new Date(data[r][colFecha]), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy') : '',
          total:  total
        });
      }
    }

    // Calcular puntos: $1.000 = 1 punto
    var puntos = Math.floor(totalGastado / 1000);

    return {
      ok: true,
      pedidos: pedidos.reverse().slice(0, 20),
      puntos: puntos,
      totalGastado: totalGastado
    };
  } catch(err) {
    return { ok: false, error: err.message };
  }
}

// ── PUNTOS DEL CLIENTE ──────────────────────────────────────
function getPuntosCliente(telefono) {
  if (!telefono || telefono.length < 8) return { ok: false, puntos: 0 };
  try {
    var result = getHistorialCliente(telefono);
    return { ok: true, puntos: result.puntos || 0, totalGastado: result.totalGastado || 0 };
  } catch(err) {
    return { ok: false, puntos: 0 };
  }
}
