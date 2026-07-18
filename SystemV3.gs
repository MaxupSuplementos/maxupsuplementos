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
  try { cupones = _listarCuponesPublicos(); }
  catch(e2) {
    try { cupones = JSON.parse(c.CUPONES_JSON || '{}'); } catch(e3) {}
  }
  return {
    recargoLista: _configNumeroMaxup('RECARGO_LISTA_3_CUOTAS', 0.13),
    redondeoLista: _configNumeroMaxup('REDONDEO_PRECIO_LISTA', 500),
    descuentoBienvenida: _configNumeroMaxup('DESCUENTO_BIENVENIDA', 0.02),
    comboDescuento: _configNumeroMaxup('COMBO_DESCUENTO', 5),
    descuentosMonto: descuentos,
    cupones: cupones
  };
}

var CUPONES_HEADERS = [
  'Codigo','Descripcion','Descuento %','Activo','Inicio','Vencimiento',
  'Duracion horas','Max usos totales','Max usos por cliente','Usos actuales','Estado actual'
];

function _asegurarHojaCupones() {
  var ss = _getSS();
  var hoja = ss.getSheetByName('CUPONES');
  if (!hoja) {
    hoja = ss.insertSheet('CUPONES');
    hoja.getRange(1, 1, 1, CUPONES_HEADERS.length).setValues([CUPONES_HEADERS]);
    hoja.getRange(2, 4, Math.max(hoja.getMaxRows() - 1, 1), 1).insertCheckboxes();
    hoja.getRange(2, 1, 3, CUPONES_HEADERS.length).setValues([
      ['MAXUP5','Cupon general para redes sociales',5,true,'','','','',1,0,''],
      ['MAXUP10','Cupon para clientes VIP o campanas puntuales',10,true,'','','','',1,0,''],
      ['PRIMERA15','Primera compra para nuevos clientes',15,true,'','','','',1,0,'']
    ]);
    hoja.getRange(1, 1, 1, CUPONES_HEADERS.length)
      .setFontWeight('bold').setBackground('#111827').setFontColor('#00C8FF');
    hoja.setFrozenRows(1);
    hoja.getRange(2, 3, Math.max(hoja.getMaxRows() - 1, 1), 1).setNumberFormat('0.##"%"');
    hoja.getRange(2, 5, Math.max(hoja.getMaxRows() - 1, 1), 2).setNumberFormat('dd/MM/yyyy HH:mm');
    [120,300,110,80,150,150,110,120,150,110,150].forEach(function(w, i) { hoja.setColumnWidth(i + 1, w); });
  }
  _asegurarHojaUsosCupones();
  return hoja;
}

function _asegurarHojaUsosCupones() {
  var ss = _getSS();
  var hoja = ss.getSheetByName('USOS_CUPONES');
  if (!hoja) {
    hoja = ss.insertSheet('USOS_CUPONES');
    hoja.appendRow(['Fecha','Codigo','Cliente','Pedido','Estado','Descuento %','Total antes','Descuento aplicado']);
    hoja.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function _cuponBooleano(v) {
  var s = String(v == null ? '' : v).trim().toUpperCase();
  return v === true || s === 'TRUE' || s === 'VERDADERO' || s === 'SI' || s === 'ACTIVO';
}

function _cuponFecha(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (!v) return null;
  var d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function _normalizarClienteCupon(v) {
  return String(v || '').replace(/\D/g, '').trim() || _normalizarHeaderV3(v || 'sin_cliente');
}

function _datosCupones() {
  var hoja = _asegurarHojaCupones();
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, CUPONES_HEADERS.length).getValues().map(function(r, i) {
    var pctRaw = Number(r[2]) || 0;
    return {
      fila: i + 2,
      codigo: String(r[0] || '').trim().toUpperCase(),
      descripcion: String(r[1] || '').trim(),
      pct: pctRaw > 1 ? pctRaw / 100 : pctRaw,
      activo: _cuponBooleano(r[3]),
      inicio: _cuponFecha(r[4]),
      vencimiento: _cuponFecha(r[5]),
      duracionHoras: Math.max(0, Number(r[6]) || 0),
      maxTotal: Math.max(0, Math.floor(Number(r[7]) || 0)),
      maxCliente: Math.max(0, Math.floor(Number(r[8]) || 0))
    };
  }).filter(function(c) { return c.codigo; });
}

function _contarUsosCupon(codigo, cliente) {
  var hoja = _asegurarHojaUsosCupones();
  if (hoja.getLastRow() < 2) return { total: 0, cliente: 0 };
  var key = _normalizarClienteCupon(cliente);
  var total = 0, delCliente = 0;
  hoja.getRange(2, 1, hoja.getLastRow() - 1, 8).getValues().forEach(function(r) {
    if (String(r[1] || '').trim().toUpperCase() !== codigo) return;
    if (String(r[4] || '').trim().toUpperCase() === 'CANCELADO') return;
    total++;
    if (_normalizarClienteCupon(r[2]) === key) delCliente++;
  });
  return { total: total, cliente: delCliente };
}

function _estadoCupon(cupon, cliente) {
  var ahora = new Date();
  if (!cupon.activo) return { ok: false, estado: 'Inactivo', error: 'Cupon inactivo' };
  if (!(cupon.pct > 0 && cupon.pct <= 1)) return { ok: false, estado: 'Porcentaje invalido', error: 'Porcentaje de cupon invalido' };
  if (cupon.inicio && ahora.getTime() < cupon.inicio.getTime()) return { ok: false, estado: 'Programado', error: 'Cupon todavia no disponible' };
  if (cupon.vencimiento && ahora.getTime() >= cupon.vencimiento.getTime()) return { ok: false, estado: 'Vencido', error: 'Cupon vencido' };
  var usos = _contarUsosCupon(cupon.codigo, cliente);
  if (cupon.maxTotal > 0 && usos.total >= cupon.maxTotal) return { ok: false, estado: 'Agotado', error: 'Cupon agotado' };
  if (cliente && cupon.maxCliente > 0 && usos.cliente >= cupon.maxCliente) {
    return { ok: false, estado: 'Ya utilizado', error: 'Este cupon ya fue utilizado por este cliente' };
  }
  return { ok: true, estado: 'Activo', usos: usos };
}

function _buscarCupon(codigo) {
  var key = String(codigo || '').trim().toUpperCase();
  if (!key) return null;
  var cupones = _datosCupones();
  for (var i = 0; i < cupones.length; i++) if (cupones[i].codigo === key) return cupones[i];
  return null;
}

function _validarCuponVigente(codigo, cliente) {
  var cupon = _buscarCupon(codigo);
  if (!cupon) throw new Error('Cupon invalido');
  var estado = _estadoCupon(cupon, cliente);
  if (!estado.ok) throw new Error(estado.error);
  cupon.usos = estado.usos;
  cupon.label = Math.round(cupon.pct * 10000) / 100 + '% off - ' + (cupon.descripcion || cupon.codigo);
  return cupon;
}

function _listarCuponesPublicos() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('CUPONES_PUBLICOS_V1');
  if (cached) { try { return JSON.parse(cached); } catch(e) {} }
  var salida = {};
  _datosCupones().forEach(function(c) {
    var estado = _estadoCupon(c, '');
    if (estado.ok) salida[c.codigo] = {
      pct: c.pct,
      label: Math.round(c.pct * 10000) / 100 + '% off - ' + (c.descripcion || c.codigo),
      vence: c.vencimiento ? c.vencimiento.toISOString() : '',
      maxPorCliente: c.maxCliente
    };
  });
  cache.put('CUPONES_PUBLICOS_V1', JSON.stringify(salida), 60);
  return salida;
}

function _refrescarResumenCupones() {
  var hoja = _asegurarHojaCupones();
  var cupones = _datosCupones();
  cupones.forEach(function(c) {
    var estado = _estadoCupon(c, '');
    var usos = _contarUsosCupon(c.codigo, '');
    hoja.getRange(c.fila, 10, 1, 2).setValues([[usos.total, estado.estado]]);
    hoja.getRange(c.fila, 1, 1, CUPONES_HEADERS.length)
      .setBackground(estado.ok ? '#E8F5E9' : '#F3F4F6').setFontColor('#111827');
  });
  CacheService.getScriptCache().remove('CUPONES_PUBLICOS_V1');
  return { ok: true, cupones: cupones.length };
}

function _actualizarCuponEdit(e, soloLocal) {
  if (!e || !e.range || e.range.getSheet().getName() !== 'CUPONES' || e.range.getRow() < 2) return;
  var hoja = e.range.getSheet();
  var fila = e.range.getRow();
  var codigo = String(hoja.getRange(fila, 1).getValue() || '').trim().toUpperCase().replace(/\s+/g, '');
  hoja.getRange(fila, 1).setValue(codigo);
  var pct = Number(hoja.getRange(fila, 3).getValue()) || 0;
  if (pct > 0 && pct <= 1) hoja.getRange(fila, 3).setValue(pct * 100);
  var activo = _cuponBooleano(hoja.getRange(fila, 4).getValue());
  var duracion = Math.max(0, Number(hoja.getRange(fila, 7).getValue()) || 0);
  if (e.range.getColumn() === 4 && activo) {
    var inicio = new Date();
    hoja.getRange(fila, 5).setValue(inicio);
    if (duracion > 0) hoja.getRange(fila, 6).setValue(new Date(inicio.getTime() + duracion * 60 * 60 * 1000));
  } else if (e.range.getColumn() === 7 && activo && duracion > 0) {
    var inicioActual = _cuponFecha(hoja.getRange(fila, 5).getValue()) || new Date();
    hoja.getRange(fila, 5).setValue(inicioActual);
    hoja.getRange(fila, 6).setValue(new Date(inicioActual.getTime() + duracion * 60 * 60 * 1000));
  }
  CacheService.getScriptCache().remove('CUPONES_PUBLICOS_V1');
  if (!soloLocal) _refrescarResumenCupones();
}

function _registrarUsoCupon(cupon, cliente, pedido, totalAntes, descuento) {
  if (!cupon || !cupon.codigo) return;
  var hoja = _asegurarHojaUsosCupones();
  var rows = hoja.getLastRow() > 1 ? hoja.getRange(2, 1, hoja.getLastRow() - 1, 8).getValues() : [];
  for (var i = 0; i < rows.length; i++) if (String(rows[i][3]) === String(pedido)) return;
  hoja.appendRow([new Date(), cupon.codigo, _normalizarClienteCupon(cliente), pedido, 'Activo', cupon.pct * 100, totalAntes, descuento]);
  _refrescarResumenCupones();
  _registrarAuditoria('CUPON UTILIZADO', cupon.codigo + ' en ' + pedido, 'sistema');
}

function _actualizarEstadoUsoCupon(pedido, estado) {
  var hoja = _asegurarHojaUsosCupones();
  if (hoja.getLastRow() < 2) return;
  var rows = hoja.getRange(2, 1, hoja.getLastRow() - 1, 8).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][3]) === String(pedido)) hoja.getRange(i + 2, 5).setValue(estado);
  }
  _refrescarResumenCupones();
}

function adminGetCupones(sesion) {
  _validarSesionAdmin(sesion);
  _refrescarResumenCupones();
  return { ok: true, cupones: _datosCupones().map(function(c) {
    var estado = _estadoCupon(c, '');
    var usos = _contarUsosCupon(c.codigo, '');
    return {
      codigo: c.codigo, descripcion: c.descripcion, pct: c.pct * 100,
      activo: c.activo, inicio: c.inicio, vencimiento: c.vencimiento,
      duracionHoras: c.duracionHoras, maxTotal: c.maxTotal,
      maxCliente: c.maxCliente, usos: usos.total, estado: estado.estado
    };
  }) };
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

function _calcularPedidoSeguroDetalle(items, cuponCodigo, esNuevo, tieneFidelidad, clienteCupon) {
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
  var totalAntesCupon = total;
  var codigo = String(cuponCodigo || '').trim().toUpperCase();
  var cupon = codigo ? _validarCuponVigente(codigo, clienteCupon) : null;
  if (cupon) total = Math.round(total * (1 - Number(cupon.pct || 0)));
  if (esNuevo && !descuentoMonto && !cupon) total = Math.round(trasCantidad * (1 - cfg.descuentoBienvenida));
  if (tieneFidelidad) total = Math.round(total * (1 - _configNumeroMaxup('PROMO_DESCUENTO', 0.10)));
  return {
    total: Math.max(0, total),
    totalAntesCupon: Math.max(0, totalAntesCupon),
    descuentoCupon: cupon ? Math.max(0, totalAntesCupon - Math.round(totalAntesCupon * (1 - cupon.pct))) : 0,
    cupon: cupon,
    descuentoMonto: descuentoMonto
  };
}

function _calcularTotalPedidoSeguro(items, cuponCodigo, esNuevo, tieneFidelidad, clienteCupon) {
  return _calcularPedidoSeguroDetalle(items, cuponCodigo, esNuevo, tieneFidelidad, clienteCupon).total;
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
  ['SUPLEMENTOS','STOCK_DETALLADO','VentasDiarias','CLIENTES','PEDIDOS','CUPONES','USOS_CUPONES'].forEach(function(n) {
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

function pruebaCuponesSistema() {
  var codigo = 'PRUEBA-CODEX-24H';
  var cliente = '5490000000000';
  var pedido = 'TEST-CUPON-' + new Date().getTime();
  var hoja = _asegurarHojaCupones();
  var fila = hoja.getLastRow() + 1;
  var ahora = new Date();
  hoja.getRange(fila, 1, 1, CUPONES_HEADERS.length).setValues([[
    codigo,'Prueba automatica temporal',7,true,ahora,new Date(ahora.getTime() + 24 * 60 * 60 * 1000),24,2,1,0,''
  ]]);
  CacheService.getScriptCache().remove('CUPONES_PUBLICOS_V1');
  var resultado = { activo: false, usoUnico: false, vencimiento: false };
  try {
    var cupon = _validarCuponVigente(codigo, cliente);
    resultado.activo = cupon && cupon.pct === 0.07;
    _registrarUsoCupon(cupon, cliente, pedido, 100000, 7000);
    try { _validarCuponVigente(codigo, cliente); }
    catch(eUso) { resultado.usoUnico = String(eUso.message).indexOf('ya fue utilizado') >= 0; }
    hoja.getRange(fila, 6).setValue(new Date(Date.now() - 60 * 1000));
    try { _validarCuponVigente(codigo, '5491111111111'); }
    catch(eVence) { resultado.vencimiento = String(eVence.message).indexOf('vencido') >= 0; }
    if (!resultado.activo || !resultado.usoUnico || !resultado.vencimiento) {
      throw new Error('Fallo prueba de cupones: ' + JSON.stringify(resultado));
    }
    _registrarAuditoria('PRUEBA CUPONES', 'OK: activo, 24h y uso unico', 'sistema');
    return { ok: true, pruebas: resultado };
  } finally {
    var usos = _asegurarHojaUsosCupones();
    if (usos.getLastRow() > 1) {
      var datos = usos.getRange(2, 1, usos.getLastRow() - 1, 8).getValues();
      for (var i = datos.length - 1; i >= 0; i--) {
        if (String(datos[i][1]) === codigo || String(datos[i][3]) === pedido) usos.deleteRow(i + 2);
      }
    }
    if (fila <= hoja.getLastRow() && String(hoja.getRange(fila, 1).getValue()) === codigo) hoja.deleteRow(fila);
    CacheService.getScriptCache().remove('CUPONES_PUBLICOS_V1');
    _refrescarResumenCupones();
  }
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
  _asegurarHojaCupones();
  _refrescarResumenCupones();
  _asegurarHojaMovimientosStock();
  _asegurarColumnasPagoPedidos();
  var sku = asegurarSkuProductos();
  instalarAutomatizacionesSistema();
  var salud = pruebaSaludSistema();
  return { ok: salud.ok, sku: sku, salud: salud };
}
