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
  DESCUENTOS_MONTO_JSON: '[{"minimo":500000,"pct":0.15,"label":"15% off por compra desde $500.000"},{"minimo":300000,"pct":0.08,"label":"8% off por compra desde $300.000"}]',
  CUPONES_JSON: '{"MAXUP5":{"pct":0.05,"label":"5% off con cupon MAXUP5"},"MAXUP10":{"pct":0.10,"label":"10% off con cupon MAXUP10"},"PRIMERA15":{"pct":0.15,"label":"15% off primera compra"}}',
  ALERTA_VENCIMIENTO_DIAS: '70',
  BACKUP_RETENCION_DIAS: '14',
  CLUB_POPUP_EXCLUIDOS: ''
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
    BACKUP_RETENCION_DIAS: 'Dias que se conservan copias automaticas',
    CLUB_POPUP_EXCLUIDOS: 'Correos o telefonos que no ven la invitacion emergente del Club'
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
  var base = 0;
  items.forEach(function(item) {
    var subtotal = item.precio * item.cantidad;
    if (item.combo) subtotal = Math.round(subtotal * (1 - cfg.comboDescuento / 100));
    base += subtotal;
  });
  var descuentoMonto = null;
  (cfg.descuentosMonto || []).slice().sort(function(a, b) {
    return Number(b.minimo || 0) - Number(a.minimo || 0);
  }).forEach(function(d) {
    if (!descuentoMonto && base >= Number(d.minimo || 0)) descuentoMonto = d;
  });
  var total = descuentoMonto ? Math.round(base * (1 - Number(descuentoMonto.pct || 0))) : base;
  var totalAntesCupon = total;
  var codigo = String(cuponCodigo || '').trim().toUpperCase();
  var cupon = codigo ? _validarCuponVigente(codigo, clienteCupon) : null;
  if (cupon) total = Math.round(total * (1 - Number(cupon.pct || 0)));
  if (esNuevo && !descuentoMonto && !cupon) total = Math.round(base * (1 - cfg.descuentoBienvenida));
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

// ============================================================
// CLUB MAXUP - registros, avisos, chances y sorteos mensuales
// ============================================================

var CLUB_HEADERS = [
  'ID','Fecha registro','Nombre','Telefono','Email','Instagram','Email verificado','Fecha verificacion',
  'Notificaciones','Intereses','Activo','Chances base','Chances extra','Total chances',
  'Token verificacion hash','Vence verificacion','Token baja hash','Consentimiento fecha','Ultimo aviso','Origen'
];
var CLUB_CHANCES_HEADERS = ['Fecha','Club ID','Email','Instagram','Tipo','Chances','Referencia','Nota','Usuario'];
var CLUB_SORTEOS_HEADERS = ['Mes','Fecha','Club ID ganador','Nombre','Email','Telefono','Instagram','Chances ganador','Participantes','Chances totales','Semilla','Premio','Estado'];
var CLUB_STOCK_HEADERS = ['Clave','SKU','Marca','Producto','Categoria','Stock','Precio','Firma','Actualizado'];
var CLUB_CARRITOS_HEADERS = ['Club ID','Email','Carrito JSON','Actualizado'];
var CLUB_SESIONES_HEADERS = ['Token hash','Club ID','Email','Creada','Vence','Activa','Ultimo uso'];

function _clubAsegurarHoja(nombre, headers, oculta) {
  var ss = _getSS();
  var hoja = ss.getSheetByName(nombre);
  if (!hoja) {
    hoja = ss.insertSheet(nombre);
    hoja.getRange(1, 1, 1, headers.length).setValues([headers]);
    hoja.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111827').setFontColor('#00C8FF');
    hoja.setFrozenRows(1);
    hoja.autoResizeColumns(1, headers.length);
    if (oculta) hoja.hideSheet();
  }
  return hoja;
}

function _clubHoja() {
  return _clubAsegurarHoja('CLUB_MAXUP', CLUB_HEADERS, false);
}

function _clubFilaTienePersona(r) {
  if (!r) return false;
  return !!(
    String(r[0] || '').trim() ||
    String(r[2] || '').trim() ||
    _clubTelefono(r[3]) ||
    _clubEmail(r[4])
  );
}

function _clubAplicarCheckboxes(hoja, primeraFila, cantidad) {
  if (!hoja || cantidad < 1) return;
  var regla = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  [7, 9, 11].forEach(function(columna) {
    hoja.getRange(primeraFila, columna, cantidad, 1).setDataValidation(regla);
  });
}

function _clubCompactarFilasVacias(hoja) {
  hoja = hoja || _clubHoja();
  var ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return { hoja:hoja, datos:[], cantidad:0 };

  var rango = hoja.getRange(2, 1, ultimaFila - 1, CLUB_HEADERS.length);
  var originales = rango.getValues();
  var datos = originales.filter(_clubFilaTienePersona);
  var yaCompacta = datos.length === originales.length;
  if (yaCompacta) {
    for (var i = 0; i < datos.length; i++) {
      if (!_clubFilaTienePersona(originales[i])) { yaCompacta = false; break; }
    }
  }

  if (!yaCompacta) {
    rango.clearContent();
    [7, 9, 11].forEach(function(columna) {
      hoja.getRange(2, columna, ultimaFila - 1, 1).clearDataValidations();
    });
    if (datos.length) hoja.getRange(2, 1, datos.length, CLUB_HEADERS.length).setValues(datos);
  }
  _clubAplicarCheckboxes(hoja, 2, datos.length);
  return { hoja:hoja, datos:datos, cantidad:datos.length };
}

function _clubEmail(v) { return String(v || '').trim().toLowerCase(); }
function _clubTelefono(v) { return String(v || '').replace(/\D/g, '').replace(/^0+/, ''); }
function _clubInstagram(v) { return String(v || '').trim().replace(/^@+/, '').toLowerCase(); }
function _clubBool(v) { var s = String(v == null ? '' : v).toLowerCase(); return v === true || s === 'true' || s === 'si' || s === 'sí' || s === '1'; }
function _clubToken() { return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); }
function _clubHash(v) { return _hashSeguro(String(v || '')); }
function _clubEsc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function _clubWebUrl() { return 'https://maxupsuplementos.com.ar/'; }
function _clubTokenBaja(email) {
  var raw = Utilities.base64EncodeWebSafe(_clubEmail(email), Utilities.Charset.UTF_8).replace(/=+$/g, '');
  var firma = _clubHash(raw + '|' + String(_getConfig().LINK_SECRET || 'club-maxup')).slice(0, 32);
  return raw + '.' + firma;
}
function _clubEmailTokenBaja(token) {
  var partes = String(token || '').split('.');
  if (partes.length !== 2) return '';
  var firma = _clubHash(partes[0] + '|' + String(_getConfig().LINK_SECRET || 'club-maxup')).slice(0, 32);
  if (firma !== partes[1]) return '';
  try { return _clubEmail(Utilities.newBlob(Utilities.base64DecodeWebSafe(partes[0])).getDataAsString()); }
  catch(e) { return ''; }
}

function _clubBuscarFila(hoja, email, telefono, id) {
  if (hoja.getLastRow() < 2) return 0;
  var datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, CLUB_HEADERS.length).getValues();
  for (var i = 0; i < datos.length; i++) {
    if (id && String(datos[i][0]) === String(id)) return i + 2;
    if (email && _clubEmail(datos[i][4]) === email) return i + 2;
    if (telefono && _clubTelefono(datos[i][3]) === telefono) return i + 2;
  }
  return 0;
}

function estadoClubMaxup(email, telefono) {
  email = _clubEmail(email);
  telefono = _clubTelefono(telefono);
  var raw = String(_leerConfiguracionMaxup().CLUB_POPUP_EXCLUIDOS || '');
  var excluidos = raw.split(/[\n,;]+/).map(function(x){ return String(x || '').trim(); }).filter(String);
  var excluido = excluidos.some(function(item) {
    var texto = item.toLowerCase();
    if (email && texto.indexOf(email) >= 0) return true;
    var telItem = _clubTelefono(item);
    return !!(telefono && telItem && telefono === telItem);
  });
  return {ok:true,clubActivo:true,registroOpcional:true,controlExclusiones:true,cuentaCliente:true,mostrarPopup:!excluido};
}

function registrarClubMaxup(data) {
  data = data || {};
  if (String(data.empresa || '').trim()) return { ok: true, mensaje: 'Revisá tu correo para confirmar el registro.' };
  var nombre = String(data.nombre || '').trim().replace(/\s+/g, ' ');
  var email = _clubEmail(data.email);
  var telefono = _clubTelefono(data.telefono);
  var instagram = _clubInstagram(data.instagram);
  var intereses = String(data.intereses || 'TODOS').toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ0-9, _-]/g, '').slice(0, 250);
  if (nombre.length < 2) throw new Error('Ingresá tu nombre.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ingresá un email válido.');
  if (telefono.length < 8 || telefono.length > 15) throw new Error('Ingresá un número de celular válido.');
  if (!_clubBool(data.consentimiento)) throw new Error('Necesitamos tu consentimiento para guardar los datos y participar.');
  var cache = CacheService.getScriptCache();
  var rateKey = 'CLUB_REG_' + _clubHash(email + '|' + telefono);
  if (cache.get(rateKey)) throw new Error('Ya recibimos este registro. Esperá unos minutos antes de volver a intentar.');
  cache.put(rateKey, '1', 300);

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var hoja = _clubHoja();
    var compactado = _clubCompactarFilasVacias(hoja);
    var fila = _clubBuscarFila(hoja, email, telefono, '');
    var ahora = new Date();
    var tokenVerificacion = _clubToken();
    var tokenBaja = _clubTokenBaja(email);
    var verificado = false, fechaVerificacion = '', id = 'CLUB-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    var chancesBase = 0, chancesExtra = 0;
    if (fila) {
      var anterior = hoja.getRange(fila, 1, 1, CLUB_HEADERS.length).getValues()[0];
      id = String(anterior[0] || id);
      verificado = anterior[6] === true;
      fechaVerificacion = anterior[7] || '';
      chancesBase = Number(anterior[11]) || (verificado ? 1 : 0);
      chancesExtra = Number(anterior[12]) || 0;
    } else {
      fila = compactado.cantidad + 2;
    }
    var bajaHash = _clubHash(tokenBaja);
    hoja.getRange(fila, 1, 1, CLUB_HEADERS.length).setValues([[
      id, fila <= hoja.getLastRow() && hoja.getRange(fila, 2).getValue() ? hoja.getRange(fila, 2).getValue() : ahora,
      nombre, telefono, email, instagram, verificado, fechaVerificacion, _clubBool(data.notificaciones), intereses || 'TODOS', true,
      chancesBase, chancesExtra, chancesBase + chancesExtra, _clubHash(tokenVerificacion),
      new Date(ahora.getTime() + 48 * 3600000), bajaHash, ahora, '', String(data.origen || 'web').slice(0, 80)
    ]]);
    _clubAplicarCheckboxes(hoja, fila, 1);
    var emailEnviado = verificado;
    if (!verificado) {
      try { _clubEnviarVerificacion(nombre, email, tokenVerificacion, tokenBaja); emailEnviado = true; }
      catch(eMail) { Logger.log('Club email verificación: ' + eMail.message); }
    }
    _registrarAuditoria('CLUB REGISTRO', email + (verificado ? ' actualizado' : ' pendiente de verificación'), 'club');
    return { ok: true, id:id, verificado: verificado, emailEnviado: emailEnviado,
      mensaje: verificado ? 'Tus preferencias fueron actualizadas.' : (emailEnviado ? 'Te enviamos un correo para confirmar tu participación.' : 'El registro quedó guardado, pero el correo no pudo salir ahora. Volvé a registrarte más tarde para recibir un enlace nuevo.') };
  } finally { lock.releaseLock(); }
}

function _clubEnviarVerificacion(nombre, email, tokenVerificacion, tokenBaja) {
  if (MailApp.getRemainingDailyQuota() < 1) throw new Error('El registro se guardó, pero hoy se alcanzó el límite de emails. Volvé a intentarlo mañana.');
  var verificar = _clubWebUrl() + '?club=verificar&token=' + encodeURIComponent(tokenVerificacion);
  var baja = _clubWebUrl() + '?club=baja&token=' + encodeURIComponent(tokenBaja);
  MailApp.sendEmail({
    to: email,
    subject: 'Confirmá tu lugar en Club MAXUP 🎁',
    name: 'MAXUP Suplementos',
    htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#222">' +
      '<h2 style="color:#00a9d6">¡Hola ' + _clubEsc(nombre.split(' ')[0]) + '!</h2>' +
      '<p>Confirmá tu email para participar de los sorteos mensuales y recibir solamente las novedades de stock que elegiste.</p>' +
      '<p style="text-align:center;margin:28px 0"><a href="' + verificar + '" style="background:linear-gradient(135deg,#00C8FF,#FF0099);color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:bold">CONFIRMAR MI REGISTRO</a></p>' +
      '<p style="font-size:12px;color:#777">El enlace vence en 48 horas. Podés dejar de recibir avisos cuando quieras desde <a href="' + baja + '">este enlace</a>.</p></div>'
  });
}

function verificarClubMaxup(token) {
  var hash = _clubHash(token);
  if (!token || !hash) throw new Error('Enlace de verificación incompleto.');
  var hoja = _clubHoja();
  if (hoja.getLastRow() < 2) throw new Error('Registro no encontrado.');
  var datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, CLUB_HEADERS.length).getValues();
  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][14] || '') !== hash) continue;
    if (datos[i][6] === true) {
      hoja.getRange(i + 2, 15, 1, 2).clearContent();
      var sesionExistente = _cuentaCrearSesion(String(datos[i][0] || ''), _clubEmail(datos[i][4]));
      return { ok: true, mensaje: 'Tu email ya estaba confirmado.', sesion:sesionExistente,
        perfil:_cuentaPerfilDesdeFila(datos[i]), carrito:_cuentaObtenerCarrito(String(datos[i][0] || '')) };
    }
    var vence = datos[i][15] instanceof Date ? datos[i][15].getTime() : new Date(datos[i][15]).getTime();
    if (!vence || vence < Date.now()) throw new Error('El enlace venció. Registrate nuevamente para recibir otro.');
    var fila = i + 2;
    hoja.getRange(fila, 7).setValue(true);
    hoja.getRange(fila, 8).setValue(new Date());
    hoja.getRange(fila, 11).setValue(true);
    hoja.getRange(fila, 12).setValue(1);
    hoja.getRange(fila, 14).setValue(1 + (Number(datos[i][12]) || 0));
    hoja.getRange(fila, 15, 1, 2).clearContent();
    _registrarAuditoria('CLUB VERIFICADO', String(datos[i][4] || ''), 'club');
    var sesion = _cuentaCrearSesion(String(datos[i][0] || ''), _clubEmail(datos[i][4]));
    datos[i][6] = true; datos[i][7] = new Date(); datos[i][10] = true; datos[i][11] = 1;
    return { ok: true, mensaje: '¡Bienvenido/a! Tu cuenta MAXUP quedó activada y ya participás del próximo sorteo.',
      sesion:sesion, perfil:_cuentaPerfilDesdeFila(datos[i]), carrito:_cuentaObtenerCarrito(String(datos[i][0] || '')) };
  }
  throw new Error('El enlace no es válido o ya fue utilizado.');
}

function bajaClubMaxup(token) {
  var hash = _clubHash(token);
  var emailToken = _clubEmailTokenBaja(token);
  if (!token || !hash) throw new Error('Enlace de baja incompleto.');
  var hoja = _clubHoja();
  if (hoja.getLastRow() < 2) throw new Error('Registro no encontrado.');
  var datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, CLUB_HEADERS.length).getValues();
  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][16] || '') !== hash && (!emailToken || _clubEmail(datos[i][4]) !== emailToken)) continue;
    hoja.getRange(i + 2, 9).setValue(false);
    hoja.getRange(i + 2, 11).setValue(false);
    _registrarAuditoria('CLUB BAJA', String(datos[i][4] || ''), 'club');
    return { ok: true, mensaje: 'Tu baja fue registrada. Ya no recibirás avisos de Club MAXUP.' };
  }
  throw new Error('El enlace de baja no es válido.');
}

// ── CUENTA CLUB Y CARRITO ENTRE DISPOSITIVOS ────────────────
function _cuentaPerfilDesdeFila(r) {
  return { id:String(r[0]||''), nombre:String(r[2]||''), telefono:String(r[3]||''), email:_clubEmail(r[4]),
    instagram:String(r[5]||''), verificado:r[6]===true, intereses:String(r[9]||''), chances:Number(r[13])||0 };
}

function _cuentaMiembroPorEmail(email) {
  email = _clubEmail(email);
  var hoja = _clubHoja();
  var fila = _clubBuscarFila(hoja, email, '', '');
  if (!fila) return null;
  var datos = hoja.getRange(fila, 1, 1, CLUB_HEADERS.length).getValues()[0];
  if (datos[10] !== true) return null;
  return { hoja:hoja, fila:fila, datos:datos };
}

function _cuentaCrearSesion(clubId, email) {
  if (!clubId || !email) throw new Error('No se pudo crear la sesión de la cuenta.');
  var token = _clubToken();
  var ahora = new Date();
  var vence = new Date(ahora.getTime() + 30 * 24 * 3600000);
  var hoja = _clubAsegurarHoja('CLUB_SESIONES', CLUB_SESIONES_HEADERS, true);
  hoja.appendRow([_clubHash(token), clubId, _clubEmail(email), ahora, vence, true, ahora]);
  return token;
}

function _cuentaValidarSesion(token) {
  token = String(token || '');
  if (token.length < 32) throw new Error('Iniciá sesión nuevamente.');
  var hash = _clubHash(token);
  var hoja = _clubAsegurarHoja('CLUB_SESIONES', CLUB_SESIONES_HEADERS, true);
  if (hoja.getLastRow() < 2) throw new Error('La sesión venció.');
  var datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, CLUB_SESIONES_HEADERS.length).getValues();
  for (var i = datos.length - 1; i >= 0; i--) {
    if (String(datos[i][0] || '') !== hash) continue;
    var vence = datos[i][4] instanceof Date ? datos[i][4].getTime() : new Date(datos[i][4]).getTime();
    if (datos[i][5] !== true || !vence || vence < Date.now()) throw new Error('La sesión venció.');
    var clubId = String(datos[i][1] || '');
    var club = _clubHoja();
    var filaClub = _clubBuscarFila(club, '', '', clubId);
    if (!filaClub) throw new Error('La cuenta ya no está disponible.');
    var miembro = club.getRange(filaClub, 1, 1, CLUB_HEADERS.length).getValues()[0];
    if (miembro[10] !== true) throw new Error('La cuenta está inactiva.');
    hoja.getRange(i + 2, 7).setValue(new Date());
    return { hojaSesion:hoja, filaSesion:i+2, clubId:clubId, email:_clubEmail(datos[i][2]), miembro:miembro };
  }
  throw new Error('La sesión venció.');
}

function _cuentaObtenerCarrito(clubId) {
  var hoja = _clubAsegurarHoja('CLUB_CARRITOS', CLUB_CARRITOS_HEADERS, true);
  if (hoja.getLastRow() < 2) return [];
  var datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, CLUB_CARRITOS_HEADERS.length).getValues();
  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][0] || '') !== String(clubId)) continue;
    try { var carrito = JSON.parse(String(datos[i][2] || '[]')); return Array.isArray(carrito) ? carrito : []; }
    catch(e) { return []; }
  }
  return [];
}

function _cuentaSanitizarCarrito(items) {
  if (!Array.isArray(items)) throw new Error('Carrito inválido.');
  if (items.length > 40) throw new Error('El carrito tiene demasiados productos.');
  function txt(v, n) { return String(v == null ? '' : v).slice(0, n); }
  return items.map(function(i) {
    i = i || {};
    return { key:txt(i.key,180), pid:txt(i.pid,100), sku:txt(i.sku,100), sheetName:txt(i.sheetName,180),
      name:txt(i.name,180), brand:txt(i.brand,100), flavor:txt(i.flavor,120), price:Math.max(0,Number(i.price)||0),
      emoji:txt(i.emoji,12), img:txt(i.img,700), maxStock:Math.max(0,Math.min(9999,Number(i.maxStock)||0)),
      qty:Math.max(1,Math.min(999,Number(i.qty)||1)), combo:i.combo===true };
  });
}

function solicitarCodigoCuenta(data) {
  data = data || {};
  var email = _clubEmail(data.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ingresá un email válido.');
  var miembro = _cuentaMiembroPorEmail(email);
  var respuesta = { ok:true, mensaje:'Si el email está registrado, vas a recibir un código en unos instantes.' };
  if (!miembro) return respuesta;
  var cache = CacheService.getScriptCache();
  var clave = 'CUENTA_CODIGO_' + _clubHash(email);
  if (cache.get(clave + '_ESPERA')) throw new Error('Esperá un minuto antes de pedir otro código.');
  var base = parseInt(_clubHash(Utilities.getUuid() + '|' + Date.now()).slice(0, 12), 16);
  var codigo = ('000000' + String(base % 1000000)).slice(-6);
  var firma = _clubHash(email + '|' + codigo + '|' + String(_getConfig().LINK_SECRET || 'maxup-cuenta'));
  cache.put(clave, JSON.stringify({firma:firma,intentos:0}), 600);
  cache.put(clave + '_ESPERA', '1', 60);
  MailApp.sendEmail({to:email,subject:'Tu código para entrar a MAXUP',name:'MAXUP Suplementos',
    htmlBody:'<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#222"><h2 style="color:#00a9d6">Entrá a tu cuenta MAXUP</h2><p>Tu código de acceso es:</p><p style="font-size:34px;font-weight:bold;letter-spacing:8px;text-align:center">'+codigo+'</p><p>Vence en 10 minutos. Si no lo pediste, ignorá este correo.</p></div>'});
  return respuesta;
}

function ingresarCuentaClub(data) {
  data = data || {};
  var email = _clubEmail(data.email), codigo = String(data.codigo || '').replace(/\D/g, '');
  if (codigo.length !== 6) throw new Error('Ingresá el código de 6 números.');
  var cache = CacheService.getScriptCache();
  var clave = 'CUENTA_CODIGO_' + _clubHash(email);
  var raw = cache.get(clave);
  if (!raw) throw new Error('El código venció. Pedí uno nuevo.');
  var intento; try { intento = JSON.parse(raw); } catch(e) { intento = {}; }
  intento.intentos = Number(intento.intentos || 0) + 1;
  if (intento.intentos > 5) { cache.remove(clave); throw new Error('Demasiados intentos. Pedí un código nuevo.'); }
  var firma = _clubHash(email + '|' + codigo + '|' + String(_getConfig().LINK_SECRET || 'maxup-cuenta'));
  if (firma !== String(intento.firma || '')) { cache.put(clave, JSON.stringify(intento), 600); throw new Error('Código incorrecto.'); }
  var miembro = _cuentaMiembroPorEmail(email);
  if (!miembro) throw new Error('No encontramos una cuenta activa con ese email.');
  cache.remove(clave); cache.remove(clave + '_ESPERA');
  if (miembro.datos[6] !== true) {
    miembro.hoja.getRange(miembro.fila, 7).setValue(true);
    miembro.hoja.getRange(miembro.fila, 8).setValue(new Date());
    miembro.hoja.getRange(miembro.fila, 12).setValue(1);
    miembro.hoja.getRange(miembro.fila, 14).setValue(1 + (Number(miembro.datos[12]) || 0));
    miembro.hoja.getRange(miembro.fila, 15, 1, 2).clearContent();
    miembro.datos[6] = true; miembro.datos[7] = new Date(); miembro.datos[11] = 1; miembro.datos[13] = 1 + (Number(miembro.datos[12]) || 0);
  }
  var sesion = _cuentaCrearSesion(String(miembro.datos[0] || ''), email);
  return {ok:true,sesion:sesion,perfil:_cuentaPerfilDesdeFila(miembro.datos),carrito:_cuentaObtenerCarrito(String(miembro.datos[0] || '')),
    mensaje:'¡Bienvenido/a a MAXUP!'};
}

function estadoCuentaClub(data) {
  var ctx = _cuentaValidarSesion((data || {}).sesion);
  return {ok:true,perfil:_cuentaPerfilDesdeFila(ctx.miembro),carrito:_cuentaObtenerCarrito(ctx.clubId)};
}

function guardarCarritoCuenta(data) {
  var ctx = _cuentaValidarSesion((data || {}).sesion);
  var carrito = _cuentaSanitizarCarrito((data || {}).carrito);
  var json = JSON.stringify(carrito);
  if (json.length > 45000) throw new Error('El carrito supera el tamaño permitido.');
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var hoja = _clubAsegurarHoja('CLUB_CARRITOS', CLUB_CARRITOS_HEADERS, true);
    var fila = 0;
    if (hoja.getLastRow() > 1) {
      var ids = hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) if (String(ids[i][0] || '') === ctx.clubId) { fila = i + 2; break; }
    }
    if (!fila) fila = hoja.getLastRow() + 1;
    hoja.getRange(fila, 1, 1, 4).setValues([[ctx.clubId,ctx.email,json,new Date()]]);
  } finally { lock.releaseLock(); }
  return {ok:true,guardado:true,items:carrito.length};
}

function salirCuentaClub(data) {
  var ctx = _cuentaValidarSesion((data || {}).sesion);
  ctx.hojaSesion.getRange(ctx.filaSesion, 6).setValue(false);
  return {ok:true};
}

function adminGetClub(sesion) {
  _validarSesionAdmin(sesion);
  var hoja = _clubHoja();
  var datos = _clubCompactarFilasVacias(hoja).datos;
  var handlersClub = {};
  ScriptApp.getProjectTriggers().forEach(function(t) { handlersClub[t.getHandlerFunction()] = true; });
  var automatizaciones = {
    avisos: !!handlersClub.procesarNotificacionesClubStock,
    sorteo: !!handlersClub.ejecutarSorteoMensualClubAutomatico
  };
  automatizaciones.completas = automatizaciones.avisos && automatizaciones.sorteo;
  var miembros = datos.map(function(r) {
    return { id:String(r[0]||''), fecha:r[1], nombre:String(r[2]||''), telefono:String(r[3]||''), email:String(r[4]||''), instagram:String(r[5]||''),
      verificado:r[6]===true, notificaciones:r[8]===true, intereses:String(r[9]||''), activo:r[10]===true,
      base:Number(r[11])||0, extra:Number(r[12])||0, chances:Number(r[13])||0, ultimoAviso:r[18]||'' };
  }).sort(function(a,b){ return String(b.fecha).localeCompare(String(a.fecha)); });
  var verificados = miembros.filter(function(m){return m.verificado && m.activo;});
  var sorteosHoja = _clubAsegurarHoja('SORTEOS_CLUB', CLUB_SORTEOS_HEADERS, false);
  var sorteos = sorteosHoja.getLastRow() > 1 ? sorteosHoja.getRange(2,1,sorteosHoja.getLastRow()-1,CLUB_SORTEOS_HEADERS.length).getValues().slice(-12).reverse().map(function(r){
    return {mes:String(r[0]||''),fecha:r[1],id:String(r[2]||''),nombre:String(r[3]||''),email:String(r[4]||''),instagram:String(r[6]||''),chances:Number(r[7])||0,participantes:Number(r[8])||0,total:Number(r[9])||0,premio:String(r[11]||''),estado:String(r[12]||'')};
  }) : [];
  return { ok:true, miembros:miembros, sorteos:sorteos, automatizaciones:automatizaciones, total:miembros.length, verificados:verificados.length,
    conAvisos:miembros.filter(function(m){return m.verificado&&m.activo&&m.notificaciones;}).length,
    chances:verificados.reduce(function(s,m){return s+m.chances;},0) };
}

function adminAgregarChanceClub(sesion, data) {
  _validarSesionAdmin(sesion);
  data = data || {};
  var puntos = Math.max(1, Math.min(10, Math.floor(Number(data.puntos) || 1)));
  var referencia = String(data.referencia || '').trim().slice(0, 180);
  var nota = String(data.nota || '').trim().slice(0, 300);
  var hoja = _clubHoja();
  var fila = _clubBuscarFila(hoja, _clubEmail(data.email), _clubTelefono(data.telefono), String(data.id || ''));
  if (!fila) throw new Error('Miembro no encontrado.');
  var miembro = hoja.getRange(fila, 1, 1, CLUB_HEADERS.length).getValues()[0];
  if (miembro[6] !== true || miembro[10] !== true) throw new Error('El registro todavía no está verificado o está inactivo.');
  var mov = _clubAsegurarHoja('CHANCES_CLUB', CLUB_CHANCES_HEADERS, false);
  if (referencia && mov.getLastRow() > 1) {
    var refs = mov.getRange(2, 7, mov.getLastRow() - 1, 1).getDisplayValues();
    for (var i=0;i<refs.length;i++) if (String(refs[i][0]).trim().toLowerCase() === referencia.toLowerCase()) throw new Error('Esa etiqueta o referencia ya fue acreditada.');
  }
  mov.appendRow([new Date(), miembro[0], miembro[4], miembro[5], String(data.tipo || 'ETIQUETA'), puntos, referencia, nota, 'admin']);
  var extra = (Number(miembro[12]) || 0) + puntos;
  hoja.getRange(fila, 13).setValue(extra);
  hoja.getRange(fila, 14).setValue((Number(miembro[11]) || 0) + extra);
  _registrarAuditoria('CLUB CHANCE', miembro[4] + ' +' + puntos + (referencia ? ' ' + referencia : ''), 'administración');
  return { ok:true, mensaje:'Chance agregada', total:(Number(miembro[11])||0)+extra };
}

function _clubAcreditarChanceInstagram(usuario, referencia, nota) {
  usuario = _clubInstagram(usuario);
  referencia = String(referencia || '').trim();
  if (!usuario || !referencia) return {ok:false,motivo:'Faltan usuario o referencia'};
  var hoja = _clubHoja();
  if (hoja.getLastRow()<2) return {ok:false,motivo:'Sin miembros'};
  var datos=hoja.getRange(2,1,hoja.getLastRow()-1,CLUB_HEADERS.length).getValues(), fila=0, miembro=null;
  for(var i=0;i<datos.length;i++) if(_clubInstagram(datos[i][5])===usuario){fila=i+2;miembro=datos[i];break;}
  if(!fila||!miembro||miembro[6]!==true||miembro[10]!==true) return {ok:false,motivo:'Usuario no registrado o pendiente'};
  var mov=_clubAsegurarHoja('CHANCES_CLUB',CLUB_CHANCES_HEADERS,false);
  if(mov.getLastRow()>1){
    var refs=mov.getRange(2,7,mov.getLastRow()-1,1).getDisplayValues();
    for(var r=0;r<refs.length;r++) if(String(refs[r][0])===referencia) return {ok:true,duplicado:true};
  }
  mov.appendRow([new Date(),miembro[0],miembro[4],usuario,'ETIQUETA_INSTAGRAM_AUTO',1,referencia,String(nota||'Mención recibida por webhook').slice(0,300),'meta']);
  var extra=(Number(miembro[12])||0)+1;
  hoja.getRange(fila,13).setValue(extra);hoja.getRange(fila,14).setValue((Number(miembro[11])||1)+extra);
  _registrarAuditoria('CLUB CHANCE AUTO','@'+usuario+' '+referencia,'instagram');
  return {ok:true,acreditado:true,usuario:usuario};
}

function _procesarWebhookInstagramClub(data) {
  var resultados=[];
  (data.entry||[]).forEach(function(entry){
    (entry.changes||[]).forEach(function(change){
      var campo=String(change.field||'').toLowerCase(), v=change.value||{};
      if(campo!=='mentions'&&campo!=='comments') return;
      var usuario=_clubInstagram((v.from&&v.from.username)||v.username||(v.sender&&v.sender.username)||'');
      var referencia=String(v.id||v.comment_id||v.media_id||v.mention_id||'').trim();
      if(usuario&&referencia) resultados.push(_clubAcreditarChanceInstagram(usuario,'META-'+referencia,String(v.text||v.message||campo)));
    });
  });
  return {ok:true,procesados:resultados.length,resultados:resultados};
}

function _clubMesAnterior() {
  var d = new Date();
  d.setDate(1); d.setMonth(d.getMonth()-1);
  return Utilities.formatDate(d, Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires', 'yyyy-MM');
}

function _clubEjecutarSorteo(mes, premio, automatico) {
  mes = String(mes || _clubMesAnterior()).trim();
  if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error('Mes inválido. Usá AAAA-MM.');
  var sorteos = _clubAsegurarHoja('SORTEOS_CLUB', CLUB_SORTEOS_HEADERS, false);
  if (sorteos.getLastRow() > 1) {
    var prev = sorteos.getRange(2,1,sorteos.getLastRow()-1,1).getDisplayValues();
    for (var p=0;p<prev.length;p++) if (String(prev[p][0]) === mes) throw new Error('El sorteo de ' + mes + ' ya fue realizado.');
  }
  var hoja = _clubHoja();
  var datos = hoja.getLastRow()>1 ? hoja.getRange(2,1,hoja.getLastRow()-1,CLUB_HEADERS.length).getValues() : [];
  var participantes = datos.filter(function(r){ return r[6]===true && r[10]===true && (Number(r[13])||0)>0; });
  if (!participantes.length) throw new Error('No hay participantes verificados.');
  var total = participantes.reduce(function(s,r){return s+(Number(r[13])||0);},0);
  var semilla = Utilities.getUuid().replace(/-/g,'') + Date.now();
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, semilla, Utilities.Charset.UTF_8);
  var numero = (((digest[0]&255)*16777216)+((digest[1]&255)*65536)+((digest[2]&255)*256)+(digest[3]&255)) >>> 0;
  var ticket = numero % total, acumulado = 0, ganador = participantes[0];
  for (var i=0;i<participantes.length;i++) { acumulado += Number(participantes[i][13])||0; if(ticket < acumulado){ ganador=participantes[i]; break; } }
  premio = String(premio || 'Premio mensual Club MAXUP').trim().slice(0,200);
  sorteos.appendRow([mes,new Date(),ganador[0],ganador[2],ganador[4],ganador[3],ganador[5],ganador[13],participantes.length,total,semilla,premio,automatico?'PENDIENTE DE CONTACTO AUTOMÁTICO':'PENDIENTE DE CONTACTO']);
  datos.forEach(function(r, idx){
    if (r[6]===true && r[10]===true) {
      hoja.getRange(idx + 2, 13).setValue(0);
      hoja.getRange(idx + 2, 14).setValue(Number(r[11]) || 1);
    }
  });
  _notificarTelegram('🎁 SORTEO CLUB MAXUP ' + mes + '\nGanador: ' + ganador[2] + '\nEmail: ' + ganador[4] + '\nInstagram: @' + (ganador[5]||'-') + '\nChances: ' + ganador[13] + '/' + total + '\nPremio: ' + premio);
  _registrarAuditoria('CLUB SORTEO', mes + ' ganador ' + ganador[4], automatico?'sistema':'administración');
  return {ok:true,mes:mes,ganador:{id:ganador[0],nombre:ganador[2],email:ganador[4],telefono:ganador[3],instagram:ganador[5],chances:ganador[13]},participantes:participantes.length,totalChances:total,premio:premio};
}

function adminEjecutarSorteoClub(sesion, data) { _validarSesionAdmin(sesion); return _clubEjecutarSorteo(data && data.mes, data && data.premio, false); }

function ejecutarSorteoMensualClubAutomatico() {
  try { return _clubEjecutarSorteo(_clubMesAnterior(), 'Premio mensual Club MAXUP', true); }
  catch(e) { if(String(e.message).indexOf('ya fue realizado')>=0) return {ok:true,omitido:true,motivo:e.message}; throw e; }
}

function _clubStockActual() {
  var catalogo = getCatalogo();
  var productos = (catalogo.productos || []).slice();
  try {
    var indumentaria = getIndumentaria();
    (indumentaria.prendas || []).forEach(function(p){
      productos.push({sku:p.codigo||'',id:p.codigo||'',marca:p.marca||'',nombre:p.nombre||'',categoria:'indumentaria '+String(p.cat||''),stock:p.stock||0,precio_venta:p.precio||0});
    });
  } catch(eInd) { Logger.log('Club indumentaria: ' + eInd.message); }
  return productos.map(function(p){
    var stock = Number(p.stock) || 0;
    if (p.flavors && p.flavors.length) stock = p.flavors.reduce(function(s,f){return s+(Number(f.stock)||0);},0);
    var sku=String(p.sku||p.id||'').trim(), marca=String(p.marca||p.brand||'').trim(), nombre=String(p.nombre||p.name||'').trim();
    var categoria=String(p.categoria||p.category||'').trim(), precio=Number(p.precio_venta||p.price)||0;
    var clave=sku||_normalizarHeaderV3(marca+'|'+nombre);
    return {clave:clave,sku:sku,marca:marca,nombre:nombre,categoria:categoria,stock:stock,precio:precio,firma:[stock,precio,nombre,marca].join('|')};
  }).filter(function(p){return p.clave&&p.nombre;});
}

function _clubCoincideInteres(intereses, cambio) {
  var normal = _normalizarHeaderV3(intereses || 'TODOS');
  if (!normal || normal.indexOf('todos')>=0) return true;
  var texto = _normalizarHeaderV3([cambio.marca,cambio.nombre,cambio.categoria].join(' '));
  return normal.split(/[,;_ ]+/).some(function(x){
    if(x.length<=2) return false;
    return texto.indexOf(x)>=0 || (x.slice(-1)==='s' && texto.indexOf(x.slice(0,-1))>=0);
  });
}

function procesarNotificacionesClubStock() {
  var hoja = _clubAsegurarHoja('_STOCK_CLUB', CLUB_STOCK_HEADERS, true);
  var actuales = _clubStockActual(), anteriores = {};
  if (hoja.getLastRow()>1) hoja.getRange(2,1,hoja.getLastRow()-1,CLUB_STOCK_HEADERS.length).getValues().forEach(function(r){ anteriores[String(r[0])]={stock:Number(r[5])||0,precio:Number(r[6])||0,firma:String(r[7]||'')}; });
  var inicial = Object.keys(anteriores).length===0, cambios=[];
  actuales.forEach(function(p){
    var a=anteriores[p.clave];
    if (!inicial && !a) cambios.push({tipo:'NUEVO',marca:p.marca,nombre:p.nombre,categoria:p.categoria,stock:p.stock,precio:p.precio});
    else if (a && a.stock<=0 && p.stock>0) cambios.push({tipo:'REINGRESO',marca:p.marca,nombre:p.nombre,categoria:p.categoria,stock:p.stock,precio:p.precio});
    else if (a && a.precio>0 && p.precio>0 && a.precio!==p.precio) cambios.push({tipo:'PRECIO',marca:p.marca,nombre:p.nombre,categoria:p.categoria,stock:p.stock,precio:p.precio,precioAnterior:a.precio});
  });
  if (hoja.getLastRow()>1) hoja.getRange(2,1,hoja.getLastRow()-1,CLUB_STOCK_HEADERS.length).clearContent();
  if (actuales.length) hoja.getRange(2,1,actuales.length,CLUB_STOCK_HEADERS.length).setValues(actuales.map(function(p){return [p.clave,p.sku,p.marca,p.nombre,p.categoria,p.stock,p.precio,p.firma,new Date()];}));
  if (inicial || !cambios.length) return {ok:true,inicializado:inicial,cambios:cambios.length,enviados:0};

  var club=_clubHoja(), filas=club.getLastRow()>1?club.getRange(2,1,club.getLastRow()-1,CLUB_HEADERS.length).getValues():[];
  var cuota=MailApp.getRemainingDailyQuota(), enviados=0;
  for(var i=0;i<filas.length && cuota>0;i++){
    var r=filas[i];
    if(r[6]!==true||r[8]!==true||r[10]!==true) continue;
    var relevantes=cambios.filter(function(c){return _clubCoincideInteres(r[9],c);});
    if(!relevantes.length) continue;
    var items=relevantes.slice(0,12).map(function(c){return '<li><strong>'+_clubEsc(c.marca+' '+c.nombre)+'</strong> — '+(c.tipo==='NUEVO'?'nuevo ingreso':c.tipo==='REINGRESO'?'volvió a tener stock':'precio actualizado')+(c.precio?' · $'+Number(c.precio).toLocaleString('es-AR'):'')+'</li>';}).join('');
    var baja=_clubWebUrl()+'?club=baja&token='+encodeURIComponent(_clubTokenBaja(r[4]));
    try {
      MailApp.sendEmail({to:String(r[4]),subject:'Novedades de stock en MAXUP ⚡',name:'MAXUP Suplementos',htmlBody:'<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2 style="color:#00a9d6">Novedades elegidas para vos</h2><ul>'+items+'</ul><p><a href="'+_clubWebUrl()+'" style="display:inline-block;background:#00a9d6;color:#fff;padding:12px 20px;border-radius:7px;text-decoration:none">VER CATÁLOGO</a></p><p style="font-size:12px;color:#777">Podés dejar de recibir avisos cuando quieras desde <a href="'+baja+'">este enlace</a>.</p></div>'});
      club.getRange(i+2,19).setValue(new Date()); enviados++; cuota--;
    } catch(eEnvio) { Logger.log('Club aviso a '+String(r[4])+': '+eEnvio.message); }
  }
  if(enviados) _notificarTelegram('📧 Club MAXUP: '+enviados+' avisos enviados por '+cambios.length+' cambios de catálogo.');
  return {ok:true,cambios:cambios.length,enviados:enviados,cuotaRestante:cuota};
}

function instalarAutomatizacionesClub() {
  var handlers=['procesarNotificacionesClubStock','ejecutarSorteoMensualClubAutomatico'];
  ScriptApp.getProjectTriggers().forEach(function(t){if(handlers.indexOf(t.getHandlerFunction())>=0) ScriptApp.deleteTrigger(t);});
  ScriptApp.newTrigger('procesarNotificacionesClubStock').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('ejecutarSorteoMensualClubAutomatico').timeBased().everyDays(1).atHour(10).create();
  _clubHoja(); _clubAsegurarHoja('CHANCES_CLUB',CLUB_CHANCES_HEADERS,false); _clubAsegurarHoja('SORTEOS_CLUB',CLUB_SORTEOS_HEADERS,false); _clubAsegurarHoja('_STOCK_CLUB',CLUB_STOCK_HEADERS,true);
  var inicial=procesarNotificacionesClubStock();
  _registrarAuditoria('CLUB AUTOMATIZACIONES','Avisos cada hora y sorteo mensual instalados','administración');
  return {ok:true,inicial:inicial};
}

function adminInstalarClub(sesion) { _validarSesionAdmin(sesion); return instalarAutomatizacionesClub(); }
