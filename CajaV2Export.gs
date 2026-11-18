// ============================================================
// MAXUP — Exportación privada para Caja Rápida V2
// Genera un archivo JSON en el Drive del propietario. No comparte
// la planilla ni concede acceso a otras cuentas.
// ============================================================

var CAJA_V2_URL = 'https://maxup-caja-v2.maxups24.workers.dev/';
var CAJA_V2_IMPORT_SECRET = '';

function _cajaV2TextoSeguro_(valor) {
  return String(valor == null ? '' : valor).trim();
}

function _cajaV2Clave_(valor) {
  return _cajaV2TextoSeguro_(valor)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function _cajaV2NormalizarProductos_() {
  if (typeof _cajaCatalogoVista_ !== 'function') {
    throw new Error('La Caja actual no tiene disponible el catálogo para exportar.');
  }

  var origen = _cajaCatalogoVista_();
  var usados = {};
  var identidades = {};
  var productos = [];

  origen.forEach(function(item, indice) {
    var nombre = _cajaV2TextoSeguro_(item.detalle || item.nombre);
    var marca = _cajaV2TextoSeguro_(item.marca);
    var tipo = _cajaV2TextoSeguro_(item.tipo).toUpperCase();
    var contado = Math.max(0, Math.round(Number(item.precioContado) || 0));
    var lista = Math.max(0, Math.round(Number(item.precioLista) || contado));
    var stock = Math.max(0, Math.floor(Number(item.stock) || 0));
    if (!nombre || (contado <= 0 && lista <= 0)) return;

    var baseSku;
    if (tipo === 'IND') {
      baseSku = 'IND-' + _cajaV2Clave_([
        item.sku || '', marca, item.detalle || item.nombre || ''
      ].join('-'));
    } else {
      baseSku = _cajaV2TextoSeguro_(item.sku) ||
        ('SUP-' + _cajaV2Clave_([marca, item.nombre || nombre].join('-')));
    }
    if (!baseSku) baseSku = 'MAXUP-' + (indice + 1);

    var identidad = tipo + '||' + _cajaV2Clave_([marca, item.nombre || nombre].join('-'));
    if (identidades[identidad]) {
      throw new Error('Producto repetido al actualizar la Caja: ' + marca + ' — ' + nombre + '. Corregí la fila duplicada en SUPLEMENTOS.');
    }
    if (usados[baseSku] && usados[baseSku] !== identidad) {
      throw new Error('El SKU "' + baseSku + '" está asignado a dos productos distintos. Corregilo en SUPLEMENTOS antes de actualizar la Caja.');
    }
    var sku = baseSku;
    identidades[identidad] = true;
    usados[sku] = identidad;

    productos.push({
      id: sku,
      sku: sku,
      nombre: nombre,
      marca: marca,
      categoria: tipo === 'IND' ? 'indumentaria' :
        (typeof inferirCat === 'function' ? inferirCat(item.nombre || nombre) : 'otros'),
      descripcion: tipo === 'IND'
        ? ('Indumentaria deportiva. ' + nombre)
        : _cajaV2TextoSeguro_(item.descripcion),
      imagen_url: _cajaV2TextoSeguro_(item.imagen_url || item.img),
      precio_venta: contado || lista,
      precio_lista: lista || contado,
      stock: stock,
      activo: true,
      tipo: tipo || 'SUP'
    });
  });

  return productos;
}

function _cajaV2NormalizarClientes_() {
  if (typeof _cajaClientes_ !== 'function') {
    throw new Error('La Caja actual no tiene disponible la lista de clientes para exportar.');
  }

  var hoja = _getSS().getSheetByName('CLIENTES');
  var emails = {};
  if (hoja && hoja.getLastRow() > 1) {
    var rows = hoja.getDataRange().getValues();
    var headers = rows[0].map(function(valor) {
      return _cajaV2Clave_(valor).toLowerCase();
    });
    var colEmail = -1;
    ['email', 'correo', 'correo-electronico'].some(function(nombre) {
      var idx = headers.indexOf(nombre);
      if (idx >= 0) { colEmail = idx; return true; }
      return false;
    });
    if (colEmail >= 0) {
      for (var i = 1; i < rows.length; i++) {
        var codigo = _cajaV2TextoSeguro_(rows[i][0]);
        if (codigo) emails[codigo] = _cajaV2TextoSeguro_(rows[i][colEmail]);
      }
    }
  }

  return _cajaClientes_().map(function(cliente) {
    var codigo = _cajaV2TextoSeguro_(cliente.codigo);
    return {
      id: codigo,
      codigo: codigo,
      nombre: _cajaV2TextoSeguro_(cliente.nombre),
      telefono: _cajaV2TextoSeguro_(cliente.telefono),
      email: emails[codigo] || '',
      loyaltyAvailable: cliente.fidelidad === true,
      fidelidad: cliente.fidelidad === true,
      activo: true
    };
  }).filter(function(cliente) {
    return cliente.codigo && cliente.nombre;
  });
}

function _cajaV2NormalizarDescuentos_() {
  if (typeof _datosCupones !== 'function') return [];
  return _datosCupones().map(function(cupon) {
    var inicio = cupon.inicio instanceof Date && !isNaN(cupon.inicio.getTime())
      ? cupon.inicio.toISOString() : '';
    var vencimiento = cupon.vencimiento instanceof Date && !isNaN(cupon.vencimiento.getTime())
      ? cupon.vencimiento.toISOString() : '';
    return {
      code: _cajaV2TextoSeguro_(cupon.codigo).toUpperCase(),
      name: _cajaV2TextoSeguro_(cupon.descripcion || cupon.codigo),
      percentage: Math.round((Number(cupon.pct) || 0) * 10000) / 100,
      active: cupon.activo === true,
      startAt: inicio,
      endAt: vencimiento
    };
  }).filter(function(cupon) {
    return cupon.code && cupon.percentage > 0 && cupon.percentage <= 100;
  });
}

function _crearArchivoCajaV2_() {
  var productos = _cajaV2NormalizarProductos_();
  var clientes = _cajaV2NormalizarClientes_();
  var descuentos = _cajaV2NormalizarDescuentos_();
  var ahora = new Date();
  var zona = Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires';
  var marcaTiempo = Utilities.formatDate(ahora, zona, 'yyyyMMdd_HHmmss');
  var nombre = 'MAXUP_CajaV2_' + marcaTiempo + '.json';
  var contenido = {
    version: 3,
    negocio: 'MAXUP Suplementos',
    exportedAt: ahora.toISOString(),
    productos: productos,
    clientes: clientes,
    descuentos: descuentos
  };
  var blob = Utilities.newBlob(
    JSON.stringify(contenido, null, 2),
    'application/json',
    nombre
  );
  var archivo = DriveApp.createFile(blob);

  return {
    archivo: archivo,
    productos: productos.length,
    clientes: clientes.length,
    descuentos: descuentos.length,
    nombre: nombre
  };
}

// Permite trasladar el catálogo y los clientes a la Caja V2 sin compartir
// la planilla ni crear archivos intermedios. Solo se ejecuta con la cuenta
// propietaria del proyecto de Apps Script.
function obtenerDatosCajaV2ParaMigracion() {
  return {
    version: 3,
    negocio: 'MAXUP Suplementos',
    exportedAt: new Date().toISOString(),
    productos: _cajaV2NormalizarProductos_(),
    clientes: _cajaV2NormalizarClientes_(),
    descuentos: _cajaV2NormalizarDescuentos_()
  };
}

function configurarSincronizacionCajaV2(secreto, url) {
  secreto = _cajaV2TextoSeguro_(secreto);
  url = _cajaV2TextoSeguro_(url || CAJA_V2_URL).replace(/\/+$/, '') + '/';
  if (secreto.length < 32) throw new Error('La clave de sincronización no es válida.');
  var props = PropertiesService.getScriptProperties();
  props.setProperty('CAJA_V2_IMPORT_SECRET', secreto);
  props.setProperty('CAJA_V2_URL', url);
  return { ok: true, url: url };
}

function sincronizarDatosCajaV2() {
  var props = PropertiesService.getScriptProperties();
  var secreto = _cajaV2TextoSeguro_(props.getProperty('CAJA_V2_IMPORT_SECRET') || CAJA_V2_IMPORT_SECRET);
  var url = _cajaV2TextoSeguro_(props.getProperty('CAJA_V2_URL') || CAJA_V2_URL).replace(/\/+$/, '');
  if (secreto.length < 32) throw new Error('Primero configurá la conexión privada de Caja V2.');
  var payload = obtenerDatosCajaV2ParaMigracion();
  var response = UrlFetchApp.fetch(url + '/api/import', {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    headers: { 'X-Maxup-Import-Key': secreto },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  var status = response.getResponseCode();
  var texto = response.getContentText();
  var resultado;
  try { resultado = JSON.parse(texto); } catch (error) { resultado = { ok: false, error: texto }; }
  if (status < 200 || status >= 300 || !resultado.ok) {
    throw new Error('Caja V2 rechazó la sincronización (' + status + '): ' + (resultado.error || texto));
  }
  return resultado;
}

// Recibe las ventas pendientes de la Caja V2 y utiliza el mismo circuito
// validado de la caja anterior. Cada operación conserva su identificador para
// que un reintento nunca vuelva a descontar stock ni duplique VentasDiarias.
function cerrarVentasCajaV2(ventas) {
  ventas = Array.isArray(ventas) ? ventas.slice(0, 200) : [];
  if (!ventas.length) {
    return { ok: true, applied: [], errors: [], cantidad: 0, total: 0 };
  }
  if (typeof registrarVentaCajaMaxup !== 'function' || typeof _crearSesionCajaInterna_ !== 'function') {
    throw new Error('La Caja de Sheets no tiene disponible el registro de ventas.');
  }

  var sesion = _crearSesionCajaInterna_();
  var aplicadas = [];
  var errores = [];
  var total = 0;
  var pagos = { cash: 'contado', transfer: 'transferencia', debit: 'debito', credit: 'tarjeta' };

  ventas.forEach(function(venta) {
    venta = venta || {};
    var id = _cajaV2TextoSeguro_(venta.id);
    try {
      if (!id) throw new Error('La venta no tiene identificador.');
      var cliente = venta.customer || null;
      var clienteExistente = null;
      if (cliente && cliente.code && typeof _cajaBuscarCliente_ === 'function') {
        clienteExistente = _cajaBuscarCliente_(cliente.code);
      }
      if (!clienteExistente && cliente && cliente.phone && typeof _cajaClientes_ === 'function') {
        var telefono = String(cliente.phone || '').replace(/\D/g, '');
        var encontrados = _cajaClientes_().filter(function(item) {
          return telefono && String(item.telefono || '').replace(/\D/g, '') === telefono;
        });
        if (encontrados.length === 1) clienteExistente = encontrados[0];
      }

      var items = (Array.isArray(venta.items) ? venta.items : []).map(function(item) {
        return {
          id: _cajaV2TextoSeguro_(item.productId),
          sku: _cajaV2TextoSeguro_(item.sku),
          nombre: _cajaV2TextoSeguro_(item.name),
          marca: _cajaV2TextoSeguro_(item.brand),
          cantidad: Math.max(1, Math.floor(Number(item.quantity) || 1))
        };
      });
      var datos = {
        operacion: _cajaV2TextoSeguro_(venta.operationId || venta.receiptNumber || id),
        clienteCodigo: clienteExistente ? clienteExistente.codigo : '',
        nuevoCliente: !clienteExistente && cliente ? {
          nombre: _cajaV2TextoSeguro_(cliente.name),
          telefono: _cajaV2TextoSeguro_(cliente.phone)
        } : null,
        pago: pagos[_cajaV2TextoSeguro_(venta.paymentMethod)] || 'contado',
        notas: _cajaV2TextoSeguro_(venta.notes),
        items: items,
        cajaV2Exacto: true,
        subtotalMostrado: Math.round(Number(venta.subtotal) || 0),
        descuentoFidelidadMostrado: Math.round(Number(venta.loyaltyDiscountAmount) || 0),
        descuentoPromocionCodigo: _cajaV2TextoSeguro_(venta.promotionCode),
        descuentoPromocionNombre: _cajaV2TextoSeguro_(venta.promotionLabel),
        descuentoPromocionPct: Number(venta.promotionPercentage) || 0,
        descuentoPromocionMostrado: Math.round(Number(venta.promotionDiscountAmount) || 0),
        totalMostrado: Math.round(Number(venta.total) || 0),
        // Solo llega en una conciliacion confirmada desde Caja V2. Permite
        // registrar el ingreso y el cliente cuando el stock de Sheets ya fue
        // corregido/descontado manualmente, sin llevarlo a negativo.
        stockYaConciliado: venta.stockAlreadyReconciled === true
      };
      var resultado = registrarVentaCajaMaxup(datos, sesion);
      total += Number(resultado.total || venta.total) || 0;
      aplicadas.push({
        id: id,
        customerId: cliente ? _cajaV2TextoSeguro_(cliente.id) : '',
        customerCode: resultado.cliente ? _cajaV2TextoSeguro_(resultado.cliente.codigo) : ''
      });
    } catch (error) {
      errores.push({ id: id, error: error && error.message ? error.message : String(error) });
    }
  });

  if (aplicadas.length && typeof actualizarHojaReposicion === 'function') {
    try { actualizarHojaReposicion(); } catch (errorReposicion) {}
  }
  return {
    ok: errores.length === 0,
    applied: aplicadas,
    errors: errores,
    cantidad: aplicadas.length,
    total: total
  };
}

function exportarDatosCajaV2() {
  var resultado = _crearArchivoCajaV2_();
  var archivo = resultado.archivo;
  var html = HtmlService.createHtmlOutput(
    '<!doctype html><html><head><base target="_blank"><style>' +
    'body{font-family:Arial,sans-serif;background:#071018;color:#eef7ff;padding:24px;margin:0}' +
    'h2{margin:0 0 10px;color:#32d8ff}.dato{color:#9fe9ff}' +
    '.btn{display:block;text-align:center;text-decoration:none;font-weight:700;padding:13px 16px;border-radius:10px;margin-top:14px}' +
    '.principal{background:linear-gradient(90deg,#00c8ff,#ff1493);color:#071018}' +
    '.secundario{border:1px solid #32d8ff;color:#32d8ff}' +
    '.nota{font-size:12px;color:#adc0cf;line-height:1.45;margin-top:18px}' +
    '</style></head><body>' +
    '<h2>Archivo listo para Caja V2</h2>' +
    '<p><span class="dato">' + resultado.productos + '</span> productos, <span class="dato">' + resultado.clientes + '</span> clientes y <span class="dato">' + resultado.descuentos + '</span> descuentos.</p>' +
    '<a class="btn principal" href="' + archivo.getDownloadUrl() + '">1. Descargar archivo</a>' +
    '<a class="btn secundario" href="' + CAJA_V2_URL + '">2. Abrir Caja V2</a>' +
    '<p class="nota">En Caja V2 abrí <b>Importar datos</b> y elegí el archivo descargado. El archivo queda privado en tu Drive y no comparte la planilla con nadie.</p>' +
    '</body></html>'
  ).setWidth(520).setHeight(380);
  SpreadsheetApp.getUi().showModalDialog(html, 'Exportar a Caja V2');
}

