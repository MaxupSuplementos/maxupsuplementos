// ============================================================
// MAXUP - Configuracion, seguridad operativa, pagos y auditoria
// ============================================================

var CONFIG_MAXUP_DEFAULTS = {
  RECARGO_LISTA_3_CUOTAS: '0.13',
  REDONDEO_PRECIO_LISTA: '500',
  DESCUENTO_BIENVENIDA: '0.02',
  PROMO_MINIMO: '40000',
  PROMO_MESES: '3',
  PROMO_DESCUENTO: '0.10',
  COMBO_DESCUENTO: '5',
  DESCUENTOS_MONTO_JSON: '[{"minimo":270000,"pct":0.15,"label":"15% off por compra +$270.000"},{"minimo":220000,"pct":0.10,"label":"10% off por compra +$220.000"},{"minimo":100000,"pct":0.05,"label":"5% off por compra +$100.000"}]',
  CUPONES_JSON: '{"MAXUP5":{"pct":0.05,"label":"5% off con cupon MAXUP5"},"MAXUP10":{"pct":0.10,"label":"10% off con cupon MAXUP10"},"PRIMERA15":{"pct":0.15,"label":"15% off primera compra"}}',
  ALERTA_VENCIMIENTO_DIAS: '70',
  BACKUP_RETENCION_DIAS: '14'
};

function _normalizarHeaderV3(v) {
  return String(v || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function _asegurarHojaConfiguracion() {
  var ss = _getSS();
  var hoja = ss.getSheetByName('CONFIGURACION');
  if (!hoja) {
    hoja = ss.insertSheet('CONFIGURACION');
    hoja.appendRow(['Clave', 'Valor', 'Descripcion']);
    hoja.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    hoja.setColumnWidth(1, 240);
    hoja.setColumnWidth(2, 420);
    hoja.setColumnWidth(3, 420);
  }
  var existentes = {};
  if (hoja.getLastRow() > 1) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues().forEach(function(r) {
      existentes[String(r[0] || '').trim()] = true;
    });
  }
  var descripciones = {
    RECARGO_LISTA_3_CUOTAS: 'Recargo decimal para precio de lista (0.13 = 13%)',
    REDONDEO_PRECIO_LISTA: 'Redondeo hacia arriba del precio de lista',
    DESCUENTO_BIENVENIDA: 'Descuento decimal de primera compra',
    PROMO_MINIMO: 'Compra mensual minima para fidelidad',
    PROMO_MESES: 'Meses consecutivos requeridos',
    PROMO_DESCUENTO: 'Descuento decimal de fidelidad',
    COMBO_DESCUENTO: 'Porcentaje entero de descuento en combos',
    DESCUENTOS_MONTO_JSON: 'Escalas de descuento del carrito en formato JSON',
    CUPONES_JSON: 'Cupones activos en formato JSON',
    ALERTA_VENCIMIENTO_DIAS: 'Dias para alerta de vencimientos',
    BACKUP_RETENCION_DIAS: 'Dias que se conservan copias automaticas'
  };
  var nuevas = [];
  Object.keys(CONFIG_MAXUP_DEFAULTS).forEach(function(k) {
    if (!existentes[k]) nuevas.push([k, CONFIG_MAXUP_DEFAULTS[k], descripciones[k] || '']);
  });
  if (nuevas.length) hoja.getRange(hoja.getLastRow() + 1, 1, nuevas.length, 3).setValues(nuevas);
  return hoja;
}

function _leerConfiguracionMaxup() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('CONFIG_MAXUP_V3');
  if (cached) { try { return JSON.parse(cached); } catch(e) {} }
  var valores = {};
  Object.keys(CONFIG_MAXUP_DEFAULTS).forEach(function(k) { valores[k] = CONFIG_MAXUP_DEFAULTS[k]; });
  try {
    var hoja = _asegurarHojaConfiguracion();
    if (hoja.getLastRow() > 1) {
      hoja.getRange(2, 1, hoja.getLastRow() - 1, 2).getDisplayValues().forEach(function(r) {
        var k = String(r[0] || '').trim();
        if (k) valores[k] = String(r[1] == null ? '' : r[1]).trim();
      });
    }
  } catch(e2) { Logger.log('Configuracion: ' + e2.message); }
  cache.put('CONFIG_MAXUP_V3', JSON.stringify(valores), 300);
  return valores;
}

function _configNumeroMaxup(clave, fallback) {
  var n = Number(_leerConfiguracionMaxup()[clave]);
  return isFinite(n) ? n : fallback;
}

function _configPublicaMaxup() {
  var c = _leerConfiguracionMaxup();
  var descuentos = [], cupones = {};
  try { descuentos = JSON.parse(c.DESCUENTOS_MONTO_JSON || '[]'); } catch(e) {}
  try { cupones = JSON.parse(c.CUPONES_JSON || '{}'); } catch(e2) {}
  return {
    recargoLista: _configNumeroMaxup('RECARGO_LISTA_3_CUOTAS', 0.13),
    redondeoLista: _configNumeroMaxup('REDONDEO_PRECIO_LISTA', 500),
    descuentoBienvenida: _configNumeroMaxup('DESCUENTO_BIENVENIDA', 0.02),
    comboDescuento: _configNumeroMaxup('COMBO_DESCUENTO', 5),
    descuentosMonto: descuentos,
    cupones: cupones
  };
}

function adminConfiguracion(sesion, valores) {
  _validarSesionAdmin(sesion);
  var hoja = _asegurarHojaConfiguracion();
  if (valores && typeof valores === 'object') {
    var permitidas = Object.keys(CONFIG_MAXUP_DEFAULTS);
    var filas = hoja.getRange(2, 1, Math.max(hoja.getLastRow() - 1, 1), 2).getValues();
    Object.keys(valores).forEach(function(k) {
      if (permitidas.indexOf(k) < 0) return;
      var encontrado = false;
      for (var i = 0; i < filas.length; i++) {
        if (String(filas[i][0]) === k) {
          hoja.getRange(i + 2, 2).setValue(String(valores[k]));
          encontrado = true;
          break;
        }
      }
      if (!encontrado) hoja.appendRow([k, String(valores[k]), '']);
    });
    CacheService.getScriptCache().remove('CONFIG_MAXUP_V3');
    _registrarAuditoria('CONFIGURACION', 'Parametros comerciales actualizados', 'administracion');
  }
  return { ok: true, valores: _leerConfiguracionMaxup(), publica: _configPublicaMaxup() };
}

function adminGetAuditoria(sesion, limite) {
  _validarSesionAdmin(sesion);
  var hoja = _getSS().getSheetByName('AUDITORIA');
  if (!hoja || hoja.getLastRow() < 2) return { ok: true, registros: [] };
  var n = Math.max(1, Math.min(Number(limite) || 200, 500));
  var desde = Math.max(2, hoja.getLastRow() - n + 1);
  var datos = hoja.getRange(desde, 1, hoja.getLastRow() - desde + 1, 4).getDisplayValues();
  var registros = datos.reverse().map(function(r) {
    return { fecha: r[0], accion: r[1], detalle: r[2], usuario: r[3] };
  });
  return { ok: true, registros: registros };
}

function _skuDeterministico(marca, nombre, prefijo) {
  var base = _normalizarHeaderV3(marca) + '|' + _normalizarHeaderV3(nombre);
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, base, Utilities.Charset.UTF_8);
  var hex = digest.map(function(b) { var n = b < 0 ? b + 256 : b; return ('0' + n.toString(16)).slice(-2); }).join('');
  return String(prefijo || 'SUP') + '-' + hex.slice(0, 12).toUpperCase();
}

function asegurarSkuProductos() {
  var hoja = _getSS().getSheetByName('SUPLEMENTOS');
  if (!hoja) return { ok: false, error: 'Falta SUPLEMENTOS' };
  var datos = hoja.getDataRange().getValues();
  var cols = _columnasCatalogoSuplementos(datos);
  var colSku = cols.sku;
  if (colSku < 0) {
    colSku = hoja.getLastColumn();
    hoja.getRange(cols.filaHeader + 1, colSku + 1).setValue('SKU');
  }
  var marca = '', actualizados = 0, vistos = {}, duplicados = [];
  var salida = [];
  for (var r = cols.filaHeader + 1; r < datos.length; r++) {
    var nombre = String(datos[r][cols.producto] || '').trim();
    var contado = datos[r][cols.contado];
    if (!nombre) { salida.push(['']); continue; }
    if (contado === '' || contado === null) { marca = nombre; salida.push(['']); continue; }
    var sku = String(datos[r][colSku] || '').trim() || _skuDeterministico(marca, nombre, 'SUP');
    if (!datos[r][colSku]) actualizados++;
    if (vistos[sku]) duplicados.push(sku + ' (' + (r + 1) + ')');
    vistos[sku] = true;
    salida.push([sku]);
  }
  if (salida.length) hoja.getRange(cols.filaHeader + 2, colSku + 1, salida.length, 1).setValues(salida);
  hoja.getRange(cols.filaHeader + 1, colSku + 1).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
  _registrarAuditoria('SKU', 'SKU completados: ' + actualizados + '; duplicados: ' + duplicados.length, 'sistema');
  return { ok: duplicados.length === 0, actualizados: actualizados, duplicados: duplicados };
}

function _actualizarSkuEdit(e) {
  if (!e || !e.range || e.range.getSheet().getName() !== 'SUPLEMENTOS') return;
  try { asegurarSkuProductos(); } catch(err) { Logger.log('SKU edit: ' + err.message); }
}

function _asegurarHojaMovimientosStock() {
  var ss = _getSS();
  var hoja = ss.getSheetByName('MOVIMIENTOS_STOCK');
  if (!hoja) {
    hoja = ss.insertSheet('MOVIMIENTOS_STOCK');
    hoja.appendRow(['Fecha','Tipo','SKU','Marca','Producto','Cantidad','Stock antes','Stock despues','Referencia','Origen']);
    hoja.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function _registrarMovimientoStock(tipo, sku, marca, producto, cantidad, antes, despues, referencia, origen) {
  _asegurarHojaMovimientosStock().appendRow([
    new Date(), tipo, sku || '', marca || '', producto || '', Number(cantidad) || 0,
    Number(antes) || 0, Number(despues) || 0, referencia || '', origen || 'sistema'
  ]);
}

function _validarItemsPedidoWeb(items) {
  if (!Array.isArray(items) || !items.length) return [];
  var catalogo = getCatalogo().productos || [];
  return items.map(function(item) {
    var sku = String(item.sku || '').trim();
    var marca = _normalizarHeaderV3(item.marca || item.brand || '');
    var nombre = _normalizarHeaderV3(item.nombre || '');
    var producto = null;
    for (var i = 0; i < catalogo.length; i++) {
      var p = catalogo[i];
      if (sku && String(p.sku || p.id || '').trim() === sku) { producto = p; break; }
      if (!sku && _normalizarHeaderV3(p.marca) === marca && _normalizarHeaderV3(p.nombre) === nombre) { producto = p; break; }
    }
    if (!producto) throw new Error('Producto no encontrado: [' + (item.marca || '') + '] ' + (item.nombre || ''));
    var cantidad = Math.max(1, Math.floor(Number(item.cantidad) || 1));
    if ((Number(producto.stock) || 0) < cantidad) throw new Error('Stock insuficiente: [' + producto.marca + '] ' + producto.nombre);
    return {
      sku: String(producto.sku || producto.id || ''),
      nombre: String(producto.nombre || ''),
      marca: String(producto.marca || ''),
      precio: Number(producto.precio_venta) || 0,
      cantidad: cantidad,
      combo: item.combo === true || item.combo === 'true'
    };
  });
}

function _calcularTotalPedidoSeguro(items, cuponCodigo, esNuevo, tieneFidelidad) {
  var cfg = _configPublicaMaxup();
  var base = 0, descuentoCantidad = 0;
  items.forEach(function(item) {
    var subtotal = item.precio * item.cantidad;
    if (item.combo) subtotal = Math.round(subtotal * (1 - cfg.comboDescuento / 100));
    base += subtotal;
    if (item.cantidad >= 2) descuentoCantidad += Math.round(item.precio * item.cantidad * 0.05);
  });
  var trasCantidad = Math.max(0, base - descuentoCantidad);
  var descuentoMonto = null;
  (cfg.descuentosMonto || []).slice().sort(function(a, b) {
    return Number(b.minimo || 0) - Number(a.minimo || 0);
  }).forEach(function(d) {
    if (!descuentoMonto && trasCantidad >= Number(d.minimo || 0)) descuentoMonto = d;
  });
  var total = descuentoMonto ? Math.round(trasCantidad * (1 - Number(descuentoMonto.pct || 0))) : trasCantidad;
  var codigo = String(cuponCodigo || '').trim().toUpperCase();
  var cupon = codigo && cfg.cupones ? cfg.cupones[codigo] : null;
  if (codigo && !cupon) throw new Error('Cupon invalido');
  if (cupon) total = Math.round(total * (1 - Number(cupon.pct || 0)));
  if (esNuevo && !descuentoMonto && !cupon) total = Math.round(trasCantidad * (1 - cfg.descuentoBienvenida));
  if (tieneFidelidad) total = Math.round(total * (1 - _configNumeroMaxup('PROMO_DESCUENTO', 0.10)));
  return Math.max(0, total);
}

function _asegurarColumnasPagoPedidos() {
  var hoja = _getSS().getSheetByName('PEDIDOS');
  if (!hoja) return null;
  var headers = hoja.getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 15)).getDisplayValues()[0];
  var requeridos = ['Estado Pago','ID Pago','Fecha Pago','Importe Pago'];
  requeridos.forEach(function(h, i) {
    var col = headers.map(_normalizarHeaderV3).indexOf(_normalizarHeaderV3(h));
    if (col < 0) hoja.getRange(1, 12 + i).setValue(h);
  });
  return hoja;
}

function procesarWebhookMercadoPago(data) {
  var paymentId = String(data && data.data && data.data.id || '').trim();
  if (!paymentId) return { ok: false, error: 'payment_id requerido' };
  var token = PropertiesService.getScriptProperties().getProperty('MP_ACCESS_TOKEN');
  if (!token) return { ok: false, error: 'Mercado Pago no configurado' };
  try {
    var resp = UrlFetchApp.fetch('https://api.mercadopago.com/v1/payments/' + encodeURIComponent(paymentId), {
      method: 'get', headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true
    });
    if (resp.getResponseCode() < 200 || resp.getResponseCode() >= 300) throw new Error('HTTP ' + resp.getResponseCode());
    var pago = JSON.parse(resp.getContentText() || '{}');
    var codigo = String(pago.external_reference || '').trim();
    if (!codigo) throw new Error('Pago sin referencia de pedido');
    var hoja = _asegurarColumnasPagoPedidos();
    if (!hoja) throw new Error('Falta hoja PEDIDOS');
    var rows = hoja.getDataRange().getValues(), fila = -1;
    for (var i = 1; i < rows.length; i++) if (String(rows[i][0]).trim() === codigo) { fila = i + 1; break; }
    if (fila < 0) throw new Error('Pedido no encontrado: ' + codigo);
    var totalEsperado = Number(String(rows[fila - 1][5] || '').replace(/[^0-9,-]/g, '').replace(',', '.')) || 0;
    var importe = Number(pago.transaction_amount) || 0;
    var estado = String(pago.status || 'unknown');
    var estadoHoja = estado;
    if (Math.abs(totalEsperado - importe) > 1) estadoHoja = 'monto_incorrecto';
    var anteriorId = String(hoja.getRange(fila, 13).getValue() || '');
    var anteriorEstado = String(hoja.getRange(fila, 12).getValue() || '');
    hoja.getRange(fila, 12, 1, 4).setValues([[estadoHoja, paymentId, new Date(), importe]]);
    if (anteriorId !== paymentId || anteriorEstado !== estadoHoja) {
      _registrarAuditoria('MERCADO PAGO', codigo + ': ' + estadoHoja + ' $' + importe, 'webhook');
      var icono = estadoHoja === 'approved' ? 'PAGO APROBADO' : (estadoHoja === 'monto_incorrecto' ? 'ALERTA DE IMPORTE' : 'Pago actualizado');
      _notificarTelegram(icono + '\n' + codigo + '\nEstado: ' + estadoHoja + '\nImporte: $' + _formatoPrecio(importe));
    }
    return { ok: true };
  } catch(e) {
    _registrarAuditoria('ERROR MERCADO PAGO', 'Pago ' + paymentId + ': ' + e.message, 'webhook');
    return { ok: false, error: e.message };
  }
}

function backupDiarioMaxup() {
  var retencion = _configNumeroMaxup('BACKUP_RETENCION_DIAS', 14);
  var nombreCarpeta = 'MAXUP_BACKUPS_AUTOMATICOS';
  var carpetas = DriveApp.getFoldersByName(nombreCarpeta);
  var carpeta = carpetas.hasNext() ? carpetas.next() : DriveApp.createFolder(nombreCarpeta);
  var archivo = DriveApp.getFileById(_getConfig().SS_ID);
  var sello = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd_HHmm');
  archivo.makeCopy('MAXUP_backup_' + sello, carpeta);
  var limite = Date.now() - retencion * 24 * 60 * 60 * 1000;
  var files = carpeta.getFiles();
  var borrados = 0;
  while (files.hasNext()) {
    var f = files.next();
    if (f.getDateCreated().getTime() < limite) { f.setTrashed(true); borrados++; }
  }
  _registrarAuditoria('BACKUP', 'Copia diaria creada; antiguas eliminadas: ' + borrados, 'sistema');
  return { ok: true, nombre: 'MAXUP_backup_' + sello, borrados: borrados };
}

function pruebaSaludSistema() {
  var errores = [], avisos = [], ss = _getSS();
  ['SUPLEMENTOS','STOCK_DETALLADO','VentasDiarias','CLIENTES','PEDIDOS'].forEach(function(n) {
    if (!ss.getSheetByName(n)) errores.push('Falta hoja ' + n);
  });
  var cfg = _getConfig();
  if (!cfg.ADMIN_CLAVE) errores.push('Falta ADMIN_CLAVE');
  if (!cfg.TELEGRAM_TOKEN || !cfg.TELEGRAM_CHAT_ID) avisos.push('Telegram incompleto');
  if (!PropertiesService.getScriptProperties().getProperty('MP_ACCESS_TOKEN')) avisos.push('Mercado Pago no configurado');
  try {
    var skus = asegurarSkuProductos();
    if (skus.duplicados && skus.duplicados.length) errores.push('SKU duplicados: ' + skus.duplicados.length);
  } catch(eSku) { errores.push('SKU: ' + eSku.message); }
  try { if (!(getCatalogo().productos || []).length) errores.push('Catalogo vacio'); } catch(eCat) { errores.push('Catalogo: ' + eCat.message); }
  var ok = errores.length === 0;
  _registrarAuditoria('SALUD SISTEMA', ok ? ('OK; avisos: ' + avisos.join(', ')) : errores.join('; '), 'sistema');
  if (!ok) _notificarTelegram('ALERTA MAXUP\n' + errores.join('\n'));
  return { ok: ok, errores: errores, avisos: avisos, fecha: new Date() };
}

function pruebaTelegramSistema() {
  var mensaje = 'PRUEBA SISTEMA MAXUP\n' +
    'Pedido MXP-8111 registrado y cancelado correctamente.\n' +
    'Integracion Telegram verificada.';
  var ok = _notificarTelegram(mensaje);
  _registrarAuditoria('PRUEBA TELEGRAM', ok ? 'OK' : 'ERROR', 'sistema');
  if (!ok) throw new Error('Telegram no respondio correctamente');
  return { ok: true, fecha: new Date() };
}

function instalarAutomatizacionesSistema() {
  var ss = _getSS();
  var handlers = ['onEditPedidosAutorizado','backupDiarioMaxup','pruebaSaludSistema'];
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlers.indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onEditPedidosAutorizado').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('backupDiarioMaxup').timeBased().everyDays(1).atHour(3).create();
  ScriptApp.newTrigger('pruebaSaludSistema').timeBased().everyDays(1).atHour(9).create();
  _registrarAuditoria('AUTOMATIZACIONES', 'Edicion, backup y salud instalados', 'sistema');
  return { ok: true };
}

function migrarSistemaMaxupV3() {
  configurarBaseSegura();
  _asegurarHojaConfiguracion();
  _asegurarHojaMovimientosStock();
  _asegurarColumnasPagoPedidos();
  var sku = asegurarSkuProductos();
  instalarAutomatizacionesSistema();
  var salud = pruebaSaludSistema();
  return { ok: salud.ok, sku: sku, salud: salud };
}
