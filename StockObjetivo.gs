// ============================================================
// MAXUP — Stock objetivo, compras, capital y reinversión
// ============================================================

function _stockObjNorm(valor) {
  return String(valor || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[.,;:!¡¿?'"()\[\]{}]/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _stockObjClave(marca, producto) {
  return _stockObjNorm(marca) + '||' + _stockObjNorm(producto);
}

function _stockObjLeerConfiguracion(hoja) {
  var configuracion = {};
  if (!hoja || hoja.getLastRow() < 7 || hoja.getLastColumn() < 6) return configuracion;
  var datos = hoja.getRange(6, 1, hoja.getLastRow() - 5, 6).getValues();
  for (var i = 1; i < datos.length; i++) {
    var producto = String(datos[i][0] || '').trim();
    var marca = String(datos[i][1] || '').trim();
    if (!producto) continue;
    configuracion[_stockObjClave(marca, producto)] = {
      objetivo: Math.max(0, Number(datos[i][3]) || 0),
      costo: Math.max(0, Number(datos[i][5]) || 0)
    };
  }
  return configuracion;
}

function _stockObjPrecargarEjemplos(productos, configuracion) {
  if (Object.keys(configuracion).length > 0) return;

  function elegir(puntaje, objetivo) {
    var candidatos = productos.map(function(p) { return { producto: p, puntos: puntaje(p) }; })
      .filter(function(x) { return x.puntos > 0; })
      .sort(function(a, b) { return b.puntos - a.puntos; });
    if (!candidatos.length) return;
    configuracion[candidatos[0].producto.clave] = { objetivo: objetivo, costo: 0 };
  }

  elegir(function(p) {
    var n = _stockObjNorm(p.nombre), m = _stockObjNorm(p.marca);
    if (m.indexOf('star nutrition') < 0 || n.indexOf('creatina') < 0) return 0;
    var puntos = 10;
    if (n.indexOf('300') >= 0) puntos += 4;
    if (n.indexOf('doypack') >= 0) puntos += 3;
    if (n.indexOf('frutos rojos') >= 0) puntos -= 2;
    return puntos;
  }, 15);

  elegir(function(p) {
    var n = _stockObjNorm(p.nombre), m = _stockObjNorm(p.marca);
    return m.indexOf('star nutrition') >= 0 && n.indexOf('collagen sport') >= 0 ? 10 : 0;
  }, 6);

  elegir(function(p) {
    var n = _stockObjNorm(p.nombre), m = _stockObjNorm(p.marca);
    if (n.indexOf('glutamina') < 0) return 0;
    return 5 + (m.indexOf('star nutrition') >= 0 ? 5 : 0);
  }, 3);
}

function _stockObjLeerReposicion(ss) {
  var resultado = { porClave: {}, ultimaActualizacion: '' };
  var hoja = ss.getSheetByName('REPOSICION');
  if (!hoja || hoja.getLastRow() < 2) return resultado;

  var datos = hoja.getDataRange().getDisplayValues();
  var encabezados = datos[0].map(_stockObjNorm);

  function buscarColumna(opciones) {
    for (var i = 0; i < encabezados.length; i++) {
      for (var j = 0; j < opciones.length; j++) {
        if (encabezados[i].indexOf(opciones[j]) >= 0) return i;
      }
    }
    return -1;
  }

  var colProducto = buscarColumna(['producto']);
  var colMarca = buscarColumna(['marca']);
  var colEstado = buscarColumna(['estado']);
  var colVendidos = buscarColumna(['vendidos 30', 'ventas 30', 'vendido']);
  var colActualizacion = buscarColumna(['ultima actualizacion', 'actualizacion']);
  if (colProducto < 0) return resultado;

  for (var fila = 1; fila < datos.length; fila++) {
    var producto = String(datos[fila][colProducto] || '').trim();
    var marca = colMarca >= 0 ? String(datos[fila][colMarca] || '').trim() : '';
    if (!producto) continue;
    var actualizacion = colActualizacion >= 0 ? String(datos[fila][colActualizacion] || '').trim() : '';
    resultado.porClave[_stockObjClave(marca, producto)] = {
      estado: colEstado >= 0 ? String(datos[fila][colEstado] || '').trim() : '',
      vendidos30: colVendidos >= 0 ? Number(String(datos[fila][colVendidos] || '').replace(',', '.')) || 0 : '',
      actualizacion: actualizacion
    };
    if (actualizacion) resultado.ultimaActualizacion = actualizacion;
  }
  return resultado;
}

function crearControlStockObjetivo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var separadorFormula = /^en(?:_|$)/i.test(String(ss.getSpreadsheetLocale() || '')) ? ',' : ';';
  var suplementos = ss.getSheetByName('SUPLEMENTOS');
  if (!suplementos) throw new Error('No se encontró la hoja SUPLEMENTOS.');

  var hoja = ss.getSheetByName('STOCK_OBJETIVO');
  if (!hoja) hoja = ss.insertSheet('STOCK_OBJETIVO');
  var configuracion = _stockObjLeerConfiguracion(hoja);
  var reposicion = _stockObjLeerReposicion(ss);
  var datos = suplementos.getDataRange().getValues();
  var productos = [];
  var marcaActual = '';

  for (var i = 2; i < datos.length; i++) {
    var nombre = String(datos[i][0] || '').trim();
    var precio = Number(datos[i][1]);
    if (!nombre) continue;
    if (!precio || isNaN(precio)) {
      marcaActual = nombre;
      continue;
    }
    productos.push({
      nombre: nombre,
      marca: marcaActual,
      filaSuplementos: i + 1,
      clave: _stockObjClave(marcaActual, nombre)
    });
  }

  _stockObjPrecargarEjemplos(productos, configuracion);
  productos.sort(function(a, b) {
    var oa = (configuracion[a.clave] || {}).objetivo || 0;
    var ob = (configuracion[b.clave] || {}).objetivo || 0;
    if ((oa > 0) !== (ob > 0)) return oa > 0 ? -1 : 1;
    return String(a.marca + ' ' + a.nombre).localeCompare(String(b.marca + ' ' + b.nombre));
  });

  if (hoja.getFilter()) hoja.getFilter().remove();
  if (hoja.getMaxRows() < productos.length + 6) hoja.insertRowsAfter(hoja.getMaxRows(), productos.length + 6 - hoja.getMaxRows());
  var filasDisponibles = hoja.getMaxRows();
  hoja.getRange(1, 1, filasDisponibles, 15).breakApart();
  hoja.getRange(1, 1, filasDisponibles, 15).clearContent().clearFormat();
  hoja.setConditionalFormatRules([]);

  hoja.getRange('A1:O1').merge().setValue('CONTROL DE STOCK OBJETIVO Y CAPITAL')
    .setBackground('#1a1a2e').setFontColor('#00C8FF').setFontWeight('bold')
    .setFontSize(15).setHorizontalAlignment('center');

  hoja.getRange('A2:K3').setValues([
    ['Reinversión necesaria', '', '', 'Capital invertido conocido', '', '', 'Venta potencial del stock', '', '', 'Ganancia bruta potencial', ''],
    ['Productos a comprar', '', '', 'Unidades a comprar', '', '', 'Productos con objetivo', '', '', 'Costos pendientes', '']
  ]);
  hoja.getRange('B2').setFormula('=SUM(G7:G)');
  hoja.getRange('E2').setFormula('=SUM(I7:I)');
  hoja.getRange('H2').setFormula('=SUM(J7:J)');
  hoja.getRange('K2').setFormula('=SUM(K7:K)');
  hoja.getRange('B3').setFormula('=COUNTIF(E7:E' + separadorFormula + '">0")');
  hoja.getRange('E3').setFormula('=SUM(E7:E)');
  hoja.getRange('H3').setFormula('=COUNTIF(D7:D' + separadorFormula + '">0")');
  hoja.getRange('K3').setFormula('=COUNTIFS(E7:E' + separadorFormula + '">0"' + separadorFormula + 'F7:F' + separadorFormula + '"")');
  ['A2','D2','G2','J2','A3','D3','G3','J3'].forEach(function(a1) {
    hoja.getRange(a1).setFontWeight('bold').setFontColor('#333333');
  });
  hoja.getRangeList(['B2','E2','H2','K2']).setNumberFormat('$#,##0').setFontWeight('bold');
  hoja.getRangeList(['B3','E3','H3','K3']).setNumberFormat('0').setFontWeight('bold');

  hoja.getRange('A5:O5').merge().setValue(
    'Completá solo las columnas amarillas: Stock objetivo y Costo compra unitario. El stock cambia solo con SUPLEMENTOS; las columnas de reposición se renuevan al usar “Actualizar lista y análisis”.' +
    (reposicion.ultimaActualizacion ? ' Último análisis: ' + reposicion.ultimaActualizacion + '.' : '')
  ).setBackground('#FFF4CC').setFontColor('#6B4E00').setFontWeight('bold').setWrap(true);

  var headers = [['Producto','Marca','Stock actual','Stock objetivo','Comprar','Costo compra unitario','Reinversión necesaria','Precio de venta','Capital invertido actual','Venta potencial','Ganancia bruta potencial','Estado objetivo','Estado de reposición','Vendidos 30 días','Actualización reposición']];
  hoja.getRange(6, 1, 1, headers[0].length).setValues(headers)
    .setBackground('#1a1a2e').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
  hoja.getRange('D6').setNote('Cantidad que querés mantener siempre disponible.');
  hoja.getRange('F6').setNote('Costo real pagado al proveedor por unidad. Sin este dato no se puede calcular la ganancia ni la reinversión con precisión.');

  var filas = productos.map(function(p, indice) {
    var fila = indice + 7;
    var cfg = configuracion[p.clave] || { objetivo: 0, costo: 0 };
    var rep = reposicion.porClave[p.clave] || { estado: '', vendidos30: '', actualizacion: '' };
    return [
      p.nombre,
      p.marca,
      "='SUPLEMENTOS'!D" + p.filaSuplementos,
      Math.max(0, Number(cfg.objetivo) || 0),
      '=MAX(0' + separadorFormula + 'D' + fila + '-C' + fila + ')',
      Number(cfg.costo) > 0 ? Number(cfg.costo) : '',
      '=E' + fila + '*F' + fila,
      "='SUPLEMENTOS'!B" + p.filaSuplementos,
      '=C' + fila + '*F' + fila,
      '=C' + fila + '*H' + fila,
      '=IF(F' + fila + '=""' + separadorFormula + '""' + separadorFormula + 'C' + fila + '*(H' + fila + '-F' + fila + '))',
      '=IF(D' + fila + '=0' + separadorFormula + '"⚪ SIN OBJETIVO"' + separadorFormula + 'IF(E' + fila + '>0' + separadorFormula + 'IF(F' + fila + '=""' + separadorFormula + '"🟠 COMPRAR "&E' + fila + '&" · CARGAR COSTO"' + separadorFormula + '"🔴 COMPRAR "&E' + fila + ')' + separadorFormula + '"🟢 OBJETIVO CUBIERTO"))',
      rep.estado,
      rep.vendidos30,
      rep.actualizacion
    ];
  });

  if (filas.length) {
    hoja.getRange(7, 1, filas.length, headers[0].length).setValues(filas);
    hoja.getRange(7, 4, filas.length, 1).setBackground('#FFF8D6');
    hoja.getRange(7, 6, filas.length, 1).setBackground('#FFF8D6');
    hoja.getRange(7, 3, filas.length, 3).setNumberFormat('0');
    hoja.getRange(7, 6, filas.length, 6).setNumberFormat('$#,##0');
    hoja.getRange(7, 14, filas.length, 1).setNumberFormat('0');
    hoja.getRange(6, 1, filas.length + 1, headers[0].length).createFilter();

    var reglaNumero = SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build();
    hoja.getRange(7, 4, filas.length, 1).setDataValidation(reglaNumero);
    hoja.getRange(7, 6, filas.length, 1).setDataValidation(reglaNumero);

    var rango = hoja.getRange(7, 1, filas.length, headers[0].length);
    hoja.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E7>0')
        .setBackground('#FFE8E8').setRanges([rango]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($D7>0,$E7=0)')
        .setBackground('#E9F8EE').setRanges([rango]).build()
    ]);
  }

  hoja.setFrozenRows(6);
  hoja.setTabColor('#00C8FF');
  [280,145,90,100,75,120,125,105,125,110,125,190,150,105,150].forEach(function(ancho, indice) {
    hoja.setColumnWidth(indice + 1, ancho);
  });
  hoja.getRange(1, 1, Math.max(6, filas.length + 6), headers[0].length).setVerticalAlignment('middle');
  SpreadsheetApp.flush();
  ss.toast('Control de stock objetivo listo.', 'MAXUP', 6);
  return { ok: true, productos: filas.length, hoja: 'STOCK_OBJETIVO' };
}

function agregarMenuStockObjetivo() {
  SpreadsheetApp.getUi().createMenu('📦 STOCK OBJETIVO')
    .addItem('Actualizar lista y análisis', 'crearControlStockObjetivo')
    .addItem('Actualizar proveedores, precios y comparativa', 'actualizarPreciosMayoristasMaxup')
    .addItem('Instalar revisión semanal', 'instalarActualizacionSemanalProveedores')
    .addItem('Abrir configuración de proveedores', 'abrirConfiguracionProveedoresMaxup')
    .addItem('Ir al panel INICIO', 'abrirInicioMaxup')
    .addSeparator()
    .addItem('Reordenar y organizar pestañas', 'organizarPlanillaMaxup')
    .addToUi();
}

// ============================================================
// PRECIOS MAYORISTAS — comparación automática con proveedores
// ============================================================

var MAYO_PROVEEDOR_EXCEL_ID = '1Q7jXYhOTAfV5U0oxaiBXc062HAo5QK0N';
var MAYO_PROVEEDOR_EXCEL_GID = '1921344810';
var MAYO_MINIMO_PEDIDO = 400000;
var MAYO_MARGEN_BRUTO_MINIMO = 0.20;
var MAYO_MARKUP_MINORISTA_OBJETIVO = 0.30;
var MAYO_MARGEN_BRUTO_MINORISTA_MINIMO = 0.20;
var MAYO_HOJA_CONFIG = 'PROVEEDORES';
var MAYO_HOJA_SNAPSHOT = '_PRECIOS_PROVEEDORES';
var MAYO_AG_URL = 'https://www.agsuplementos.com/shop/category/suplementos-1';
var MAYO_COLO_API = 'https://suplementoscolomayorista.com.ar/wp-json/wc/store/v1/products';
var MAYO_PREFERENCIA_AG = 0.03;

function _mayoRedondearPrecioMinorista_(valor) {
  var numero = Math.max(0, Number(valor) || 0);
  if (!numero) return 0;
  var paso = numero < 20000 ? 500 : 1000;
  return Math.ceil(numero / paso) * paso;
}

function _mayoDiagnosticoPrecioMinorista_(precioActual, costoPuesto) {
  var actual = Math.max(0, Number(precioActual) || 0);
  var costo = Math.max(0, Number(costoPuesto) || 0);
  if (!costo) return {
    sugerido: '', minimo: '', estado: 'SIN COSTO', color: '#E7E6E6',
    nota: 'Todavía no hay un costo de reposición confiable para calcular este precio.'
  };

  var sugerido = _mayoRedondearPrecioMinorista_(costo * (1 + MAYO_MARKUP_MINORISTA_OBJETIVO));
  var minimo = _mayoRedondearPrecioMinorista_(costo / (1 - MAYO_MARGEN_BRUTO_MINORISTA_MINIMO));
  var estado = '', color = '#FFFFFF';
  if (Math.abs(actual - sugerido) < 1) {
    estado = 'SINCRONIZADO';
  } else if (actual < minimo) {
    estado = 'RIESGO DE REPOSICIÓN'; color = '#F4CCCC';
  } else if (actual < sugerido) {
    estado = 'REVISAR'; color = '#FFF2CC';
  } else {
    estado = 'PRECIO PROTEGIDO'; color = '#D9EAD3';
  }
  var margen = actual > 0 ? (actual - costo) / actual : 0;
  return {
    sugerido: sugerido, minimo: minimo, estado: estado, color: color,
    nota: estado + '\nCosto puesto local: $' + Math.round(costo).toLocaleString('es-AR') +
      '\nPrecio mínimo para conservar 20% de margen bruto: $' + Math.round(minimo).toLocaleString('es-AR') +
      '\nPrecio sugerido: costo + 30%, redondeado: $' + Math.round(sugerido).toLocaleString('es-AR') +
      '\nMargen bruto del precio actual: ' + Math.round(margen * 1000) / 10 + '%'
  };
}

function _mayoEnlaceMercadoLibre_(marca, producto) {
  var consulta = [marca, producto].filter(function(x){ return String(x || '').trim(); }).join(' ');
  return consulta ? 'https://listado.mercadolibre.com.ar/?q=' + encodeURIComponent(consulta) : '';
}

function _mayoFuenteClave_(fuente) {
  var n = _mayoNorm_(fuente);
  if (n.indexOf('ag suplementos') >= 0) return 'AG SUPLEMENTOS';
  if (n.indexOf('colo') >= 0) return 'COLO MAYORISTA';
  if (n.indexOf('one fit') >= 0 || n.indexOf('revendedor') >= 0) return 'ONE FIT';
  return String(fuente || '').trim().toUpperCase();
}

function _mayoAsegurarConfig_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(MAYO_HOJA_CONFIG);
  if (!hoja) hoja = ss.insertSheet(MAYO_HOJA_CONFIG);
  if (!hoja.getRange('A1').getValue()) {
    hoja.getRange('A1:H1').merge().setValue('COMPARADOR DE PROVEEDORES')
      .setBackground('#1a1a2e').setFontColor('#00C8FF').setFontWeight('bold')
      .setFontSize(15).setHorizontalAlignment('center');
    hoja.getRange('A2:H2').merge().setValue('El flete es editable. AG se prioriza cuando queda hasta 3% por encima del proveedor más barato. Abajo se listan los productos que todavía necesitan un proveedor habitual.')
      .setBackground('#FFF4CC').setFontColor('#6B4E00').setFontWeight('bold').setWrap(true);
    hoja.getRange(4, 1, 1, 8).setValues([['Proveedor','Prioridad','Flete estimado %','Lista usada','Fuente','Último intento','Último éxito','Estado']])
      .setBackground('#1a1a2e').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
    hoja.getRange(5, 1, 3, 8).setValues([
      ['AG SUPLEMENTOS',1,0,'Efectivo público',MAYO_AG_URL,'','','Pendiente'],
      ['COLO MAYORISTA',2,0.05,'Precio web público','https://suplementoscolomayorista.com.ar/tienda/','','','Pendiente'],
      ['ONE FIT',3,0.085,'Lista del proveedor','https://docs.google.com/spreadsheets/d/' + MAYO_PROVEEDOR_EXCEL_ID + '/edit','','','Pendiente']
    ]);
    hoja.getRange('C5:C7').setNumberFormat('0.0%').setBackground('#FFF8D6');
    hoja.getRange('B5:B7').setBackground('#FFF8D6');
    hoja.getRange('F5:G7').setNumberFormat('dd/MM/yyyy HH:mm');
    hoja.setFrozenRows(4);
    [170,85,125,150,370,145,145,220].forEach(function(ancho, i){ hoja.setColumnWidth(i + 1, ancho); });
    hoja.setTabColor('#F4B400');
  }
  hoja.getRange('A2').setValue('El flete es editable. AG se prioriza cuando queda hasta 3% por encima del proveedor más barato. Abajo se listan los productos que todavía necesitan un proveedor habitual.');
  var filas = hoja.getRange(5, 1, Math.max(3, hoja.getLastRow() - 4), 8).getValues();
  var config = {};
  filas.forEach(function(r, idx) {
    var fuente = _mayoFuenteClave_(r[0]);
    if (!fuente) return;
    config[fuente] = {
      fila: idx + 5,
      prioridad: Math.max(1, Number(r[1]) || 99),
      fletePct: Math.max(0, Number(r[2]) || 0)
    };
  });
  return { hoja:hoja, fuentes:config };
}

function _mayoLeerProveedoresManuales_(hoja) {
  var salida = {};
  if (!hoja || hoja.getLastRow() < 12) return salida;
  hoja.getRange(12, 1, hoja.getLastRow() - 11, 11).getValues().forEach(function(row) {
    var producto = String(row[0] || '').trim(), marca = String(row[1] || '').trim();
    var proveedor = String(row[8] || '').trim(), costo = _mayoImporte_(row[9]);
    if (!producto || !marca || !proveedor) return;
    salida[_stockObjClave(marca, producto)] = {
      proveedor: proveedor,
      costo: costo,
      url: String(row[10] || '').trim()
    };
  });
  return salida;
}

function _mayoEsAccesorio_(marca) {
  return /^(accesorios|shakers)$/i.test(String(marca || '').trim());
}

function _mayoAplicarProveedorManual_(comparacion, manual, producto) {
  if (_mayoEsAccesorio_(producto.marca)) {
    var ag = comparacion.porFuente && comparacion.porFuente['AG SUPLEMENTOS'];
    if (ag) {
      comparacion.recomendado = ag;
      comparacion.motivo = 'Proveedor habitual fijo para accesorios: AG SUPLEMENTOS';
      return comparacion;
    }
    manual = manual || {};
    var costoAg = Number(manual.costo) || 0;
    comparacion.recomendado = {
      fuente: 'AG SUPLEMENTOS',
      producto: producto.nombre,
      marca: producto.marca,
      costo: costoAg,
      puesto: costoAg,
      prioridad: 1,
      score: 1,
      url: manual.url || MAYO_AG_URL,
      manual: true
    };
    comparacion.motivo = costoAg
      ? 'Proveedor habitual fijo para accesorios: AG SUPLEMENTOS'
      : 'Proveedor habitual fijo para accesorios: AG SUPLEMENTOS; falta completar el costo';
    return comparacion;
  }
  if (comparacion.recomendado || !manual || !manual.proveedor) return comparacion;
  var costo = Number(manual.costo) || 0;
  comparacion.recomendado = {
    fuente: 'MANUAL · ' + manual.proveedor,
    producto: producto.nombre,
    marca: producto.marca,
    costo: costo,
    puesto: costo,
    prioridad: 50,
    score: 1,
    url: manual.url || '',
    manual: true
  };
  comparacion.motivo = costo ? 'Proveedor habitual cargado manualmente' : 'Proveedor habitual cargado; falta completar el costo';
  return comparacion;
}

function _mayoActualizarFaltantes_(config, filasStock, resultados, manuales) {
  var hoja = config.hoja, filas = [], sinProveedor = 0, ahora = new Date();
  filasStock.forEach(function(row) {
    var producto = String(row[0] || '').trim(), marca = String(row[1] || '').trim();
    var comprar = Math.max(0, Number(row[3]) - Number(row[2]));
    if (!producto || !marca || comprar <= 0) return;
    var clave = _stockObjClave(marca, producto), info = resultados[clave];
    var automaticos = info && info.comparacion ? Object.keys(info.comparacion.porFuente || {}) : [];
    if (automaticos.length) return;
    var manual = manuales[clave] || {};
    if (_mayoEsAccesorio_(marca)) manual = {
      proveedor: 'AG SUPLEMENTOS',
      costo: manual.costo || 0,
      url: manual.url || MAYO_AG_URL
    };
    var estado = '🔴 SIN PROVEEDOR';
    if (manual.proveedor) estado = manual.costo ? '🟢 PROVEEDOR MANUAL' : '🟡 FALTA COSTO';
    else sinProveedor++;
    filas.push([
      producto, marca,
      _mayoEsAccesorio_(marca) ? 'ACCESORIO' : 'SUPLEMENTO / ALIMENTO',
      Number(row[2]) || 0, Number(row[3]) || 0, comprar,
      info ? Number(info.venta) || 0 : 0, estado,
      manual.proveedor || '', manual.costo || '', manual.url || '', ahora
    ]);
  });

  var filasLimpiar = Math.max(1, hoja.getMaxRows() - 9);
  if (hoja.getMaxColumns() < 12) hoja.insertColumnsAfter(hoja.getMaxColumns(), 12 - hoja.getMaxColumns());
  hoja.getRange(10, 1, filasLimpiar, 12).breakApart().clearContent().clearFormat();
  hoja.getRange('A10:L10').merge().setValue('PRODUCTOS PARA REVISAR (' + filas.length + ') · SIN PROVEEDOR (' + sinProveedor + ')')
    .setBackground('#8B1E3F').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(13)
    .setHorizontalAlignment('center');
  hoja.getRange(11, 1, 1, 12).setValues([[
    'Producto','Marca','Grupo','Stock actual','Objetivo','Comprar','Precio venta','Estado',
    'Proveedor habitual','Costo unitario','Enlace / contacto','Actualizado'
  ]]).setBackground('#1a1a2e').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
  if (filas.length) {
    if (hoja.getMaxRows() < filas.length + 11) hoja.insertRowsAfter(hoja.getMaxRows(), filas.length + 11 - hoja.getMaxRows());
    hoja.getRange(12, 1, filas.length, 12).setValues(filas).setVerticalAlignment('middle');
    hoja.getRange(12, 7, filas.length, 1).setNumberFormat('$#,##0');
    hoja.getRange(12, 10, filas.length, 1).setNumberFormat('$#,##0').setBackground('#FFF8D6');
    hoja.getRange(12, 9, filas.length, 1).setBackground('#FFF8D6');
    hoja.getRange(12, 11, filas.length, 1).setBackground('#FFF8D6');
    hoja.getRange(12, 12, filas.length, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  }
  [300,145,155,90,90,90,115,165,190,120,270,145].forEach(function(ancho, idx){ hoja.setColumnWidth(idx + 1, ancho); });
  return { revisar:filas.length, sinProveedor:sinProveedor };
}

function abrirConfiguracionProveedoresMaxup() {
  var cfg = _mayoAsegurarConfig_();
  cfg.hoja.activate();
  SpreadsheetApp.getActiveSpreadsheet().toast('Podés ajustar la prioridad y el flete estimado en las celdas amarillas.', 'MAXUP', 7);
}

function _mayoActualizarEstadoFuente_(config, fuente, ok, detalle) {
  var info = config.fuentes[_mayoFuenteClave_(fuente)];
  if (!info) return;
  var ahora = new Date();
  config.hoja.getRange(info.fila, 6).setValue(ahora);
  if (ok) config.hoja.getRange(info.fila, 7).setValue(ahora);
  config.hoja.getRange(info.fila, 8).setValue((ok ? '🟢 ' : '🟠 ') + String(detalle || (ok ? 'Actualizado' : 'Se usó la última copia')));
}

function _mayoNorm_(valor) {
  return String(valor || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/collagen/g, 'colageno').replace(/collageno/g, 'colageno')
    .replace(/creatine/g, 'creatina').replace(/protein/g, 'proteina')
    .replace(/monohidratada/g, 'monohidrato').replace(/micronizada/g, '')
    .replace(/kilogramos?|kgs?/g, 'kg').replace(/gramos?|grs?|gs/g, 'g')
    .replace(/capsulas?|caps?|comprimidos?|comps?|tabletas?|tabs?/g, 'caps')
    .replace(/servicios?|servs?|porciones?/g, 'serv')
    .replace(/\b[x×]\s*/g, '').replace(/(\d)\s+(kg|g|lb|ml|l|caps|serv)\b/g, '$1$2')
    .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function _mayoMarca_(valor) {
  var n = _mayoNorm_(valor);
  var alias = {
    'laboratorio lax':'lax', 'lax':'lax', 'mervick lab':'mervick', 'mervick':'mervick',
    'generation fit':'generation fit', 'gen fit':'generation fit', 'gfit':'generation fit',
    'gold nutrition':'gold nutrition', 'star nutrition':'star nutrition', 'body advance':'body advance',
    'bad monkey':'bad monkey', 'wpn':'wpn', 'nutrilab':'nutrilab',
    'granger nutrition':'granger nutrition', 'granger':'granger nutrition',
    'painlabs nutrition':'painlabs', 'painlabs':'painlabs',
    'akara wellnes':'akara wellness', 'akara wellness':'akara wellness', 'akara':'akara wellness',
    'fortify linea premium':'fortify', 'forest':'forest', 'nutremax':'nutremax',
    'by zen nuevo ingreso':'by zen', 'by zen':'by zen',
    'importados varias marcas':'importados', 'importados':'importados', 'shakers':'shakers',
    'woman':'woman by pampita floppy', 'woman by pampita floppy':'woman by pampita floppy',
    'woman by pampita':'woman by pampita floppy',
    'on optimum nutrition':'optimum nutrition', 'optimum nutrition':'optimum nutrition',
    'optimun nutrition':'optimum nutrition'
  };
  return alias[n] || n;
}

function _mayoImporte_(valor) {
  if (typeof valor === 'number') return valor;
  var limpio = String(valor || '').replace(/[^0-9,.-]/g, '');
  if (!limpio) return 0;
  var coma = limpio.lastIndexOf(','), punto = limpio.lastIndexOf('.');
  if (coma >= 0 && punto >= 0) {
    limpio = coma > punto ? limpio.replace(/\./g, '').replace(',', '.') : limpio.replace(/,/g, '');
  } else if (coma >= 0) {
    limpio = /,\d{1,2}$/.test(limpio) ? limpio.replace(',', '.') : limpio.replace(/,/g, '');
  } else if (punto >= 0 && !/\.\d{1,2}$/.test(limpio)) {
    limpio = limpio.replace(/\./g, '');
  }
  return Number(limpio) || 0;
}

function _mayoProveedorExcel_() {
  var urls = [
    'https://docs.google.com/spreadsheets/d/' + MAYO_PROVEEDOR_EXCEL_ID + '/export?format=csv&gid=' + MAYO_PROVEEDOR_EXCEL_GID,
    'https://docs.google.com/spreadsheets/d/' + MAYO_PROVEEDOR_EXCEL_ID + '/gviz/tq?tqx=out:csv&gid=' + MAYO_PROVEEDOR_EXCEL_GID
  ];
  var contenido = '';
  for (var u = 0; u < urls.length && !contenido; u++) {
    var respuesta = UrlFetchApp.fetch(urls[u], {
      muteHttpExceptions:true, followRedirects:true,
      headers:{ Authorization:'Bearer ' + ScriptApp.getOAuthToken() }
    });
    var texto = respuesta.getResponseCode() === 200 ? respuesta.getContentText('UTF-8') : '';
    if (texto && texto.indexOf('MAYORISTA SUPLEMENTOS') >= 0) contenido = texto;
  }
  if (!contenido) return [];
  var filas = Utilities.parseCsv(contenido);
  var salida = [], marca = '';
  for (var i = 1; i < filas.length; i++) {
    var nombre = String(filas[i][0] || '').trim(), precio = _mayoImporte_(filas[i][1]);
    if (nombre && !precio) marca = nombre;
    if (nombre && precio) salida.push({ nombre:nombre, marca:marca, costo:precio, fuente:'ONE FIT', disponible:true,
      url:'https://docs.google.com/spreadsheets/d/' + MAYO_PROVEEDOR_EXCEL_ID + '/edit' });
    var nombrePromo = String(filas[i][3] || '').trim(), precioPromo = _mayoImporte_(filas[i][4]);
    if (nombrePromo && precioPromo) salida.push({ nombre:nombrePromo, marca:'LABORATORIO LAX', costo:precioPromo, fuente:'ONE FIT · PROMO', disponible:true,
      url:'https://docs.google.com/spreadsheets/d/' + MAYO_PROVEEDOR_EXCEL_ID + '/edit' });
  }
  return salida;
}

function _mayoTextoHtml_(html) {
  return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#8211;|&ndash;/gi, '-').replace(/&#8212;|&mdash;/gi, '-')
    .replace(/\s+/g, ' ').trim();
}

function _mayoDecodificarHtml_(valor) {
  return _mayoTextoHtml_(String(valor || '')
    .replace(/&#(\d+);/g, function(_, n){ return String.fromCharCode(Number(n)); })
    .replace(/&#x([0-9a-f]+);/gi, function(_, n){ return String.fromCharCode(parseInt(n, 16)); }));
}

function _mayoMarcaColo_(nombre) {
  var n = _mayoNorm_(nombre);
  var reglas = [
    ['star nutrition','STAR NUTRITION'], ['gold nutrition','GOLD NUTRITION'], ['woman','WOMAN'],
    ['ena','ENA'], ['nutremax','NUTREMAX'], ['nutrex','NUTREX'], ['optimum','OPTIMUM NUTRITION'],
    ['optimun','OPTIMUM NUTRITION'], ['protein project','PROTEIN PROJECT'], ['granger','GRANGER'],
    ['bsn','BSN'], ['universal','UNIVERSAL'], ['cellucor','CELLUCOR'], ['ultimate','ULTIMATE'],
    ['mervick','MERVICK'], ['everlast','SHAKERS'], ['gat ','GAT'], ['positive','POSITIVE'],
    ['muscle concept','MUSCLE CONCEPT'], ['natuliv','NATULIV'], ['natural nutrition','NATURAL NUTRITION'],
    ['new made','NEW MADE'], ['body advance','BODY ADVANCE'], ['bad monkey','BAD MONKEY'],
    ['generation fit','GENERATION FIT'], ['protein project','PROTEIN PROJECT'], ['wpn','WPN'],
    ['ultimate nutrition','ULTIMATE NUTRITION'], ['universal nutrition','UNIVERSAL NUTRITION'],
    ['animal','UNIVERSAL NUTRITION'], ['bsn','BSN'], ['cellucor','CELLUCOR'], ['holsom','HOLSOM']
  ];
  for (var i = 0; i < reglas.length; i++) if (n.indexOf(reglas[i][0].trim()) >= 0) return reglas[i][1];
  return '';
}

function _mayoProveedorColo_() {
  var salida = [];
  for (var pagina = 1; pagina <= 10; pagina++) {
    var respuesta = UrlFetchApp.fetch(MAYO_COLO_API + '?per_page=100&page=' + pagina, {
      muteHttpExceptions:true, followRedirects:true,
      headers:{ Accept:'application/json', 'User-Agent':'Mozilla/5.0 MAXUP-Comparador/1.0' }
    });
    if (respuesta.getResponseCode() === 400 && pagina > 1) break;
    if (respuesta.getResponseCode() !== 200) throw new Error('Colo respondió ' + respuesta.getResponseCode());
    var items = JSON.parse(respuesta.getContentText('UTF-8') || '[]');
    if (!items.length) break;
    items.forEach(function(item) {
      if (!item || item.is_in_stock === false || !item.prices) return;
      var minor = Math.pow(10, Number(item.prices.currency_minor_unit) || 0);
      var precio = Number(item.prices.price || 0) / minor;
      if (!precio && item.prices.price_range) precio = Number(item.prices.price_range.min_price || 0) / minor;
      var nombre = _mayoDecodificarHtml_(item.name || '');
      if (!nombre || !precio) return;
      salida.push({ nombre:nombre, marca:_mayoMarcaColo_(nombre), costo:precio, fuente:'COLO MAYORISTA',
        disponible:true, url:String(item.permalink || 'https://suplementoscolomayorista.com.ar/tienda/') });
    });
    if (items.length < 100) break;
  }
  return salida;
}

function _mayoCookieSesion_(headers) {
  var bruto = headers['Set-Cookie'] || headers['set-cookie'] || '';
  if (Array.isArray(bruto)) bruto = bruto.join('; ');
  var partes = String(bruto).match(/(?:frontend_lang|session_id)=[^;,]+/g) || [];
  return partes.join('; ');
}

function _mayoParsearAgHtml_(html) {
  var salida = [];
  var bloques = String(html || '').match(/<form[^>]*class="[^"]*oe_product_cart[^"]*"[^>]*>[\s\S]*?<\/form>/gi) || [];
  bloques.forEach(function(bloque) {
    var titulo = bloque.match(/o_wsale_products_item_title[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i);
    var nombre = titulo ? _mayoDecodificarHtml_(titulo[1]) : '';
    var href = bloque.match(/o_wsale_products_item_title[\s\S]*?<a[^>]+href="([^"]+)"/i);
    var rePrecio = /oe_currency_value[^>]*>([^<]+)</gi, m, precios = [];
    while ((m = rePrecio.exec(bloque)) !== null) {
      var importe = _mayoImporte_(m[1]);
      if (importe) precios.push(importe);
    }
    if (!nombre || !precios.length) return;
    salida.push({ nombre:nombre, marca:_mayoMarcaColo_(nombre), costo:Math.min.apply(null, precios),
      fuente:'AG SUPLEMENTOS', disponible:true,
      url:href ? 'https://www.agsuplementos.com' + href[1] : MAYO_AG_URL });
  });
  return salida;
}

function _mayoProveedorAg_() {
  var cambio = UrlFetchApp.fetch('https://www.agsuplementos.com/shop/change_pricelist/8', {
    muteHttpExceptions:true, followRedirects:false,
    headers:{ 'User-Agent':'Mozilla/5.0 MAXUP-Comparador/1.0' }
  });
  var cookie = _mayoCookieSesion_(cambio.getAllHeaders());
  if (!cookie) throw new Error('AG no entregó la sesión de precios en efectivo.');
  var opciones = { muteHttpExceptions:true, followRedirects:true,
    headers:{ Cookie:cookie, 'User-Agent':'Mozilla/5.0 MAXUP-Comparador/1.0' } };
  var primera = UrlFetchApp.fetch(MAYO_AG_URL, opciones);
  if (primera.getResponseCode() !== 200) throw new Error('AG respondió ' + primera.getResponseCode());
  var htmlPrimero = primera.getContentText('UTF-8');
  var paginas = 1, rePag = /\/shop\/category\/suplementos-1\/page\/(\d+)/g, m;
  while ((m = rePag.exec(htmlPrimero)) !== null) paginas = Math.max(paginas, Number(m[1]) || 1);
  var salida = _mayoParsearAgHtml_(htmlPrimero), pedidos = [];
  for (var pagina = 2; pagina <= Math.min(60, paginas); pagina++) {
    pedidos.push({ url:MAYO_AG_URL + '/page/' + pagina, muteHttpExceptions:true, followRedirects:true,
      headers:{ Cookie:cookie, 'User-Agent':'Mozilla/5.0 MAXUP-Comparador/1.0' } });
  }
  if (pedidos.length) {
    UrlFetchApp.fetchAll(pedidos).forEach(function(resp) {
      if (resp.getResponseCode() === 200) salida = salida.concat(_mayoParsearAgHtml_(resp.getContentText('UTF-8')));
    });
  }
  return salida;
}

function _mayoProveedorGuardado_(fuenteBuscada) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var salida = [], objetivo = fuenteBuscada ? _mayoFuenteClave_(fuenteBuscada) : '';
  var hoja = ss.getSheetByName(MAYO_HOJA_SNAPSHOT);
  if (hoja && hoja.getLastRow() >= 2) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 8).getValues().forEach(function(row) {
      var fuente = _mayoFuenteClave_(row[0]), nombre = String(row[2] || '').trim(), costo = _mayoImporte_(row[3]);
      if (!nombre || !costo || (objetivo && fuente !== objetivo)) return;
      salida.push({ fuente:fuente, marca:String(row[1] || '').trim(), nombre:nombre, costo:costo,
        disponible:row[4] !== false, url:String(row[5] || ''), actualizado:row[6] });
    });
  }
  // Compatibilidad con la primera copia de Colo creada antes del comparador semanal.
  if (!salida.length && (!objetivo || objetivo === 'COLO MAYORISTA')) {
    var anterior = ss.getSheetByName('_PROVEEDORES_MAYORISTA');
    if (anterior && anterior.getLastRow() >= 2) {
      anterior.getRange(2, 1, anterior.getLastRow() - 1, 4).getValues().forEach(function(row) {
        var nombre = String(row[1] || '').trim(), costo = _mayoImporte_(row[2]);
        if (nombre && costo) salida.push({ nombre:nombre, marca:String(row[0] || '').trim() || _mayoMarcaColo_(nombre),
          costo:costo, fuente:'COLO MAYORISTA', disponible:true, url:'https://suplementoscolomayorista.com.ar/tienda/' });
      });
      try { if (!anterior.isSheetHidden()) anterior.hideSheet(); } catch (eAnterior) {}
    }
  }
  try { if (hoja && !hoja.isSheetHidden()) hoja.hideSheet(); } catch (eOcultar) {}
  return salida;
}

function _mayoGuardarSnapshot_(nuevosPorFuente) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), hoja = ss.getSheetByName(MAYO_HOJA_SNAPSHOT);
  if (!hoja) hoja = ss.insertSheet(MAYO_HOJA_SNAPSHOT);
  var existentes = _mayoProveedorGuardado_(), reemplazadas = {};
  Object.keys(nuevosPorFuente).forEach(function(f){ if (nuevosPorFuente[f] && nuevosPorFuente[f].length) reemplazadas[_mayoFuenteClave_(f)] = true; });
  var todos = existentes.filter(function(p){ return !reemplazadas[_mayoFuenteClave_(p.fuente)]; });
  Object.keys(nuevosPorFuente).forEach(function(f){ if (nuevosPorFuente[f] && nuevosPorFuente[f].length) todos = todos.concat(nuevosPorFuente[f]); });
  hoja.clearContents();
  hoja.getRange(1, 1, 1, 8).setValues([['Fuente','Marca','Producto','Costo','Disponible','URL','Actualizado','Clave']]);
  if (todos.length) {
    var ahora = new Date();
    hoja.getRange(2, 1, todos.length, 8).setValues(todos.map(function(p){
      return [_mayoFuenteClave_(p.fuente),p.marca||'',p.nombre,Number(p.costo)||0,p.disponible!==false,p.url||'',p.actualizado||ahora,
        _mayoMarca_(p.marca)+'||'+_mayoNorm_(p.nombre)];
    }));
    hoja.getRange(2, 4, todos.length, 1).setNumberFormat('$#,##0.00');
    hoja.getRange(2, 7, todos.length, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  }
  hoja.hideSheet();
}

function _mayoResolverMarca_(proveedor, marcasCatalogo) {
  if (proveedor.marca) return proveedor;
  var nombre = ' ' + _mayoNorm_(proveedor.nombre) + ' ', mejor = '';
  (marcasCatalogo || []).forEach(function(marca) {
    var n = _mayoNorm_(marca);
    if (n && nombre.indexOf(' ' + n + ' ') >= 0 && n.length > _mayoNorm_(mejor).length) mejor = marca;
  });
  proveedor.marca = mejor || _mayoMarcaColo_(proveedor.nombre);
  return proveedor;
}

function _mayoTokens_(valor, soloPalabras) {
  var stop = { x:1,de:1,del:1,la:1,el:1,los:1,las:1,con:1,sin:1,sabor:1,sabores:1,nuevo:1,
    ingreso:1,promo:1,unidad:1,unidades:1,original:1,simple:1,premium:1,linea:1,plus:1,
    star:1,nutrition:1,gold:1,laboratory:1,laboratorio:1,lab:1,labs:1,importado:1,importados:1 };
  var partes = _mayoNorm_(valor).split(' '), salida = {};
  for (var i = 0; i < partes.length; i++) {
    var p = partes[i];
    if (!p || stop[p] || (soloPalabras && (!/^[a-z]+$/.test(p) || p.length < 4))) continue;
    salida[p] = true;
  }
  return salida;
}

function _mayoInterseccion_(a, b) {
  var n = 0; Object.keys(a).forEach(function(k) { if (b[k]) n++; }); return n;
}

function _mayoUnion_(a, b) {
  var u = {}; Object.keys(a).forEach(function(k){u[k]=1;}); Object.keys(b).forEach(function(k){u[k]=1;});
  return Math.max(1, Object.keys(u).length);
}

function _mayoMedidas_(valor) {
  var encontrados = _mayoNorm_(valor).match(/\b\d+(?:\.\d+)?(?:kg|g|lb|ml|l|caps|serv)\b/g);
  return encontrados || [];
}

function _mayoScore_(producto, proveedor) {
  if (_mayoMarca_(producto.marca) !== _mayoMarca_(proveedor.marca)) return -1;
  var a = _mayoTokens_(producto.nombre, false), b = _mayoTokens_(proveedor.nombre, false);
  var ca = _mayoTokens_(producto.nombre, true), cb = _mayoTokens_(proveedor.nombre, true);
  var comunesCore = _mayoInterseccion_(ca, cb);
  if (!comunesCore) return -1;
  var puntaje = (_mayoInterseccion_(a, b) / _mayoUnion_(a, b)) * 0.35
    + (comunesCore / _mayoUnion_(ca, cb)) * 0.45 + 0.28;
  var ma = _mayoMedidas_(producto.nombre), mb = _mayoMedidas_(proveedor.nombre);
  if (ma.length && mb.length) {
    var misma = ma.some(function(x){ return mb.indexOf(x) >= 0; });
    puntaje += misma ? 0.22 : -0.28;
  }
  var na = _mayoNorm_(producto.nombre), nb = _mayoNorm_(proveedor.nombre);
  if (na === nb) puntaje += 0.45;
  if (na.indexOf(nb) >= 0 || nb.indexOf(na) >= 0) puntaje += 0.12;
  return puntaje;
}

function _mayoPrepararProveedores_(marcasCatalogo, config) {
  var todos = [], mapa = {}, nuevos = {};
  var cargadores = [
    { fuente:'AG SUPLEMENTOS', fn:_mayoProveedorAg_ },
    { fuente:'COLO MAYORISTA', fn:_mayoProveedorColo_ },
    { fuente:'ONE FIT', fn:_mayoProveedorExcel_ }
  ];
  cargadores.forEach(function(item) {
    var lista = [], ok = false, error = '';
    try {
      lista = item.fn() || [];
      ok = lista.length > 0;
      if (!ok) error = 'La fuente no devolvió productos';
    } catch (e) { error = e.message || String(e); }
    if (ok) {
      nuevos[item.fuente] = lista;
      todos = todos.concat(lista);
      _mayoActualizarEstadoFuente_(config, item.fuente, true, lista.length + ' productos');
    } else {
      var copia = _mayoProveedorGuardado_(item.fuente);
      todos = todos.concat(copia);
      _mayoActualizarEstadoFuente_(config, item.fuente, false,
        (copia.length ? 'Copia anterior: ' + copia.length + ' productos' : 'Sin datos') + (error ? ' · ' + error : ''));
    }
  });
  _mayoGuardarSnapshot_(nuevos);
  todos.forEach(function(p) {
    p = _mayoResolverMarca_(p, marcasCatalogo);
    if (!p.disponible || !p.costo) return;
    var clave = _mayoFuenteClave_(p.fuente) + '||' + _mayoMarca_(p.marca) + '||' + _mayoNorm_(p.nombre);
    if (!mapa[clave] || p.costo < mapa[clave].costo) mapa[clave] = p;
  });
  return Object.keys(mapa).map(function(k){ return mapa[k]; });
}

function _mayoMejorCoincidencia_(producto, proveedores) {
  var candidatos = proveedores.map(function(p){ return { proveedor:p, score:_mayoScore_(producto, p) }; })
    .filter(function(x){ return x.score >= 0; }).sort(function(a,b){ return b.score-a.score; });
  if (!candidatos.length) return { estado:'SIN COINCIDENCIA', proveedor:null, score:0 };
  var mejor = candidatos[0], segundo = candidatos[1];
  var np = _mayoNorm_(producto.nombre), nm = _mayoNorm_(mejor.proveedor.nombre);
  var empaqueProducto = /\b(caja|display)\b/.test(np);
  var empaqueProveedor = /\b(caja|display|12u|20u)\b/.test(nm);
  var segura = mejor.score >= 0.72 && (!segundo || mejor.score-segundo.score >= 0.06)
    && empaqueProducto === empaqueProveedor;
  return { estado:segura?'AUTOMÁTICO':'REVISAR', proveedor:mejor.proveedor, score:mejor.score };
}

function _mayoCompararProveedores_(producto, proveedores, config) {
  var fuentes = ['AG SUPLEMENTOS','COLO MAYORISTA','ONE FIT'], candidatos = {};
  fuentes.forEach(function(fuente) {
    var lista = proveedores.filter(function(p){ return _mayoFuenteClave_(p.fuente) === fuente; });
    var match = _mayoMejorCoincidencia_(producto, lista);
    var cfg = config.fuentes[fuente] || { prioridad:99, fletePct:0 };
    if (match.proveedor && match.estado === 'AUTOMÁTICO') {
      candidatos[fuente] = {
        fuente:fuente, producto:match.proveedor.nombre, marca:match.proveedor.marca,
        costo:Number(match.proveedor.costo)||0, fletePct:cfg.fletePct,
        puesto:(Number(match.proveedor.costo)||0) * (1 + cfg.fletePct),
        prioridad:cfg.prioridad, score:match.score, url:match.proveedor.url || ''
      };
    }
  });
  var ordenados = Object.keys(candidatos).map(function(k){ return candidatos[k]; }).sort(function(a,b){
    return a.puesto-b.puesto || a.prioridad-b.prioridad;
  });
  if (!ordenados.length) return { porFuente:candidatos, recomendado:null, alternativa:null, motivo:'Sin coincidencia segura' };
  var recomendado = ordenados[0], ag = candidatos['AG SUPLEMENTOS'], motivo = 'Menor costo final estimado';
  if (ag && ag.puesto <= ordenados[0].puesto * (1 + MAYO_PREFERENCIA_AG)) {
    recomendado = ag;
    motivo = ag === ordenados[0] ? 'AG: menor costo final y sin flete' : 'AG priorizado: diferencia menor al 3% y sin flete';
  } else if (ordenados.length === 1) motivo = 'Es el único proveedor con coincidencia segura';
  var alternativa = ordenados.filter(function(x){ return x.fuente !== recomendado.fuente; })[0] || null;
  return { porFuente:candidatos, recomendado:recomendado, alternativa:alternativa, motivo:motivo };
}

function actualizarPreciosMayoristasMaxup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var config = _mayoAsegurarConfig_();
  var proveedoresManuales = _mayoLeerProveedoresManuales_(config.hoja);
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');
  if (!hojaSup) throw new Error('No se encontró SUPLEMENTOS.');
  if (hojaSup.getMaxColumns() < 15) hojaSup.insertColumnsAfter(hojaSup.getMaxColumns(), 15 - hojaSup.getMaxColumns());
  var hojaObj = ss.getSheetByName('STOCK_OBJETIVO');
  if (!hojaObj || hojaObj.getLastRow() < 7) { crearControlStockObjetivo(); hojaObj = ss.getSheetByName('STOCK_OBJETIVO'); }
  var costosCargados = _stockObjLeerConfiguracion(hojaObj);
  if (hojaObj.getMaxColumns() < 39) hojaObj.insertColumnsAfter(hojaObj.getMaxColumns(), 39 - hojaObj.getMaxColumns());

  var datos = hojaSup.getDataRange().getValues(), marca = '', marcasMapa = {};
  for (var mi = 2; mi < datos.length; mi++) {
    var nombreMarca = String(datos[mi][0] || '').trim(), precioMarca = Number(datos[mi][1]) || 0;
    if (nombreMarca && !precioMarca) { marca = nombreMarca; marcasMapa[marca] = true; }
  }
  var proveedores = _mayoPrepararProveedores_(Object.keys(marcasMapa), config);
  if (!proveedores.length) throw new Error('No se encontraron precios de proveedores.');
  marca = '';
  var resultados = {}, aplicados = 0, revisar = 0, sinMargen = 0, preciosSugeridos = 0;
  var colBase = 11, colMax = 12, colPrecioSugerido = 14, colMercadoLibre = 15;
  hojaSup.getRange(2, colBase).setValue('Desc Mayorista Base %').setNote('Calculado para proteger al menos 20% de margen bruto.');
  hojaSup.getRange(2, colMax).setValue('Desc Mayorista Máx %').setNote('Tope seguro para los descuentos por volumen.');
  hojaSup.getRange(2, colPrecioSugerido).setValue('Precio minorista sugerido').setNote(
    'Se calcula con el costo puesto local del proveedor recomendado, más 30%, y se redondea a un precio comercial.\n' +
    'Blanco: coincide con Precio unitario. Rojo: no conserva 20% de margen bruto. Amarillo: cubre el mínimo pero está por debajo del objetivo. Verde: el precio actual supera el objetivo. Gris: falta costo confiable.'
  );
  hojaSup.getRange(2, colMercadoLibre).setValue('Comparar Mercado Libre').setNote(
    'Enlace de búsqueda para revisar manualmente competidores del mismo producto. No modifica el precio sugerido porque una coincidencia incorrecta podría distorsionarlo.'
  );
  if (datos.length > 2) hojaSup.getRange(3, colBase, datos.length - 2, 2).clearContent();
  var salidaMinorista = [], notasMinorista = [], fondosMinorista = [], enlacesMercadoLibre = [];
  for (var pi = 2; pi < datos.length; pi++) {
    salidaMinorista.push(['']);
    notasMinorista.push(['']);
    fondosMinorista.push(['#FFFFFF']);
    enlacesMercadoLibre.push([SpreadsheetApp.newRichTextValue().setText('').build()]);
  }

  for (var i = 2; i < datos.length; i++) {
    var nombre = String(datos[i][0] || '').trim(), venta = Number(datos[i][1]) || 0;
    if (!nombre) continue;
    if (!venta) { marca = nombre; continue; }
    var producto = { nombre:nombre, marca:marca }, clave = _stockObjClave(marca, nombre);
    var comparacion = _mayoCompararProveedores_(producto, proveedores, config);
    comparacion = _mayoAplicarProveedorManual_(comparacion, proveedoresManuales[clave], producto);
    var recomendado = comparacion.recomendado;
    var costo = recomendado ? recomendado.costo : 0, costoPuesto = recomendado ? recomendado.puesto : 0;
    var fuente = recomendado ? recomendado.fuente : '', proveedorNombre = recomendado ? recomendado.producto : '';
    var maximo = 0, base = 0, estado = recomendado ? (recomendado.manual ? 'MANUAL' : 'AUTOMÁTICO') : 'REVISAR';
    if ((estado === 'AUTOMÁTICO' || estado === 'MANUAL') && costoPuesto > 0) {
      maximo = Math.max(0, Math.min(35, Math.floor((1 - (costoPuesto / (1 - MAYO_MARGEN_BRUTO_MINIMO)) / venta) * 100)));
      base = Math.min(15, maximo);
      if (maximo < 5) { base = 0; estado = 'SIN MARGEN'; sinMargen++; }
      else aplicados++;
    } else revisar++;
    resultados[clave] = { producto:nombre, marca:marca, venta:venta, costo:costo, costoPuesto:costoPuesto,
      proveedor:proveedorNombre, proveedorMarca:recomendado ? recomendado.marca : '',
      fuente:fuente, score:recomendado ? recomendado.score : 0, estado:estado, base:base, maximo:maximo,
      comparacion:comparacion };
    var costoManual = costosCargados[clave] ? Number(costosCargados[clave].costo) || 0 : 0;
    var costoParaMinorista = costoPuesto || costoManual;
    var diagnosticoMinorista = _mayoDiagnosticoPrecioMinorista_(venta, costoParaMinorista);
    salidaMinorista[i - 2][0] = diagnosticoMinorista.sugerido;
    notasMinorista[i - 2][0] = diagnosticoMinorista.nota +
      (fuente ? '\nProveedor usado: ' + fuente + (proveedorNombre ? ' — ' + proveedorNombre : '') :
        (costoManual ? '\nCosto usado: costo de compra cargado en STOCK_OBJETIVO.' : ''));
    fondosMinorista[i - 2][0] = diagnosticoMinorista.color;
    var enlaceMl = _mayoEnlaceMercadoLibre_(marca, nombre);
    if (enlaceMl) enlacesMercadoLibre[i - 2][0] = SpreadsheetApp.newRichTextValue()
      .setText('Ver precios similares').setLinkUrl(enlaceMl).build();
    if (diagnosticoMinorista.sugerido) preciosSugeridos++;
    if (estado === 'AUTOMÁTICO' || estado === 'MANUAL') hojaSup.getRange(i + 1, colBase, 1, 2).setValues([[base, maximo]]);
    else if (estado === 'SIN MARGEN') hojaSup.getRange(i + 1, colBase, 1, 2).setValues([[0, 0]]);
  }

  if (salidaMinorista.length) {
    hojaSup.getRange(3, colPrecioSugerido, salidaMinorista.length, 1)
      .setValues(salidaMinorista).setNotes(notasMinorista).setBackgrounds(fondosMinorista).setNumberFormat('$#,##0');
    hojaSup.getRange(3, colMercadoLibre, enlacesMercadoLibre.length, 1).setRichTextValues(enlacesMercadoLibre);
  }
  hojaSup.getRange(2, colPrecioSugerido, 1, 2)
    .setBackground('#0B5394').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
  hojaSup.setColumnWidth(colPrecioSugerido, 185);
  hojaSup.setColumnWidth(colMercadoLibre, 175);

  var headers = [['Proveedor sugerido','Producto del proveedor','Costo proveedor actual','Fuente','Coincidencia',
    'Desc mayorista base %','Desc mayorista máximo %','Precio mayorista base','Margen bruto base','Estado mayorista','Actualizado']];
  hojaObj.getRange(6, 16, 1, headers[0].length).setValues(headers)
    .setBackground('#1a1a2e').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
  var filasObj = hojaObj.getLastRow() >= 7 ? hojaObj.getRange(7, 1, hojaObj.getLastRow()-6, 6).getValues() : [];
  var salida = [], comparativas = [], resumen = {};
  filasObj.forEach(function(r) {
    var info = resultados[_stockObjClave(r[1], r[0])];
    var cantidadComprar = Math.max(0, Number(r[3]) - Number(r[2]));
    if (!info) {
      salida.push(['','','','','',0,0,'','','SIN DATOS',new Date()]);
      comparativas.push(['','','','','','','',cantidadComprar,'','','','Sin datos del producto',new Date()]);
      return;
    }
    var costoExistente = Number(r[5]) || 0;
    var costoUsado = costoExistente || info.costoPuesto || 0;
    var precioMayo = info.base > 0 ? Math.round(info.venta * (1-info.base/100)) : '';
    var margen = precioMayo && costoUsado ? (precioMayo-costoUsado)/precioMayo : '';
    salida.push([info.proveedorMarca,info.proveedor,info.costo||'',info.fuente,Math.round(info.score*100)+'%',
      info.base,info.maximo,precioMayo,margen,info.estado,new Date()]);
    var por = info.comparacion.porFuente || {}, ag = por['AG SUPLEMENTOS'], colo = por['COLO MAYORISTA'], one = por['ONE FIT'];
    var rec = info.comparacion.recomendado, alt = info.comparacion.alternativa;
    var alternativa = alt ? alt.fuente + ' ' + (alt.puesto >= rec.puesto ? '+' : '-') + '$' + Math.round(Math.abs(alt.puesto-rec.puesto)) + '/u' : '';
    comparativas.push([
      ag ? ag.costo : '', ag ? ag.puesto : '', colo ? colo.costo : '', colo ? colo.puesto : '',
      one ? one.costo : '', one ? one.puesto : '', rec ? rec.fuente : '', cantidadComprar,
      rec ? rec.puesto : '', rec ? rec.puesto*cantidadComprar : '', alternativa,
      info.comparacion.motivo || 'Sin coincidencia segura', new Date()
    ]);
    if (rec && cantidadComprar > 0) {
      if (!resumen[rec.fuente]) resumen[rec.fuente] = { productos:0, unidades:0, total:0 };
      resumen[rec.fuente].productos++;
      resumen[rec.fuente].unidades += cantidadComprar;
      resumen[rec.fuente].total += rec.puesto*cantidadComprar;
    }
  });
  if (salida.length) {
    hojaObj.getRange(7, 16, salida.length, salida[0].length).setValues(salida);
    hojaObj.getRange(7, 18, salida.length, 1).setNumberFormat('$#,##0');
    hojaObj.getRange(7, 21, salida.length, 2).setNumberFormat('0');
    hojaObj.getRange(7, 23, salida.length, 1).setNumberFormat('$#,##0');
    hojaObj.getRange(7, 24, salida.length, 1).setNumberFormat('0.0%');
    hojaObj.getRange(7, 26, salida.length, 1).setNumberFormat('dd/MM/yyyy HH:mm');

    var headersComparativa = [['AG precio','AG puesto local','Colo precio','Colo puesto local','One Fit precio','One Fit puesto local',
      'Comprar en','Cantidad','Costo unitario puesto','Total estimado','Segunda opción','Motivo','Actualizado']];
    hojaObj.getRange(6, 27, 1, headersComparativa[0].length).setValues(headersComparativa)
      .setBackground('#0B5394').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
    hojaObj.getRange(7, 27, comparativas.length, comparativas[0].length).setValues(comparativas);
    hojaObj.getRange(7, 27, comparativas.length, 6).setNumberFormat('$#,##0');
    hojaObj.getRange(7, 34, comparativas.length, 1).setNumberFormat('0');
    hojaObj.getRange(7, 35, comparativas.length, 2).setNumberFormat('$#,##0');
    hojaObj.getRange(7, 39, comparativas.length, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  }
  var auditoria = _mayoActualizarFaltantes_(config, filasObj, resultados, proveedoresManuales);
  [150,320,120,150,95,115,125,125,110,135,140].forEach(function(ancho, idx){ hojaObj.setColumnWidth(16+idx, ancho); });
  [115,125,115,125,115,125,145,85,130,130,170,270,145].forEach(function(ancho, idx){ hojaObj.setColumnWidth(27+idx, ancho); });
  hojaObj.getRange(7, 33, Math.max(1, comparativas.length), 1).setBackground('#E8F4FD').setFontWeight('bold');
  SpreadsheetApp.flush();
  ss.toast('Comparativa lista: ' + proveedores.length + ' precios leídos; ' + auditoria.sinProveedor + ' productos todavía necesitan proveedor.', 'MAXUP', 10);
  return { ok:true, proveedores:proveedores.length, aplicados:aplicados, sinMargen:sinMargen, revisar:revisar,
    preciosSugeridos:preciosSugeridos, markupMinorista:MAYO_MARKUP_MINORISTA_OBJETIVO,
    minimo:MAYO_MINIMO_PEDIDO, margenMinimo:MAYO_MARGEN_BRUTO_MINIMO, reposicion:resumen,
    faltantes:auditoria.sinProveedor, revisarProveedores:auditoria.revisar };
}

function _mayoResumenTelegram_(resultado) {
  if (!resultado || !resultado.ok || typeof _notificarTelegram !== 'function') return;
  var fuentes = resultado.reposicion || {}, lineas = ['📦 COMPARATIVA SEMANAL DE REPOSICIÓN'];
  Object.keys(fuentes).sort().forEach(function(fuente) {
    var r = fuentes[fuente];
    lineas.push('\n' + fuente + ': ' + r.productos + ' productos · ' + r.unidades + ' unidades · $' + Math.round(r.total).toLocaleString('es-AR'));
  });
  if (lineas.length === 1) lineas.push('\nNo hay productos por debajo del stock objetivo.');
  lineas.push('\nDetalle completo: hoja STOCK_OBJETIVO, columna “Comprar en”.');
  _notificarTelegram(lineas.join('\n'));
}

function actualizarComparativaProveedoresSemanal() {
  var resultado = actualizarPreciosMayoristasMaxup();
  _mayoResumenTelegram_(resultado);
  return resultado;
}

function instalarActualizacionSemanalProveedores() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'actualizarComparativaProveedoresSemanal') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('actualizarComparativaProveedoresSemanal').timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  _mayoAsegurarConfig_();
  SpreadsheetApp.getActiveSpreadsheet().toast('Revisión semanal instalada: lunes entre las 8 y las 9.', 'MAXUP', 8);
  return { ok:true, dia:'LUNES', hora:8 };
}

function instalarControlStockObjetivo() {
  var resultado = crearControlStockObjetivo();
  var existe = ScriptApp.getProjectTriggers().some(function(trigger) {
    return trigger.getHandlerFunction() === 'agregarMenuStockObjetivo';
  });
  if (!existe) {
    ScriptApp.newTrigger('agregarMenuStockObjetivo')
      .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onOpen().create();
  }
  return resultado;
}
