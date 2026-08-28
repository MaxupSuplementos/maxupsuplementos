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

function crearControlStockObjetivo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var separadorFormula = /^en(?:_|$)/i.test(String(ss.getSpreadsheetLocale() || '')) ? ',' : ';';
  var suplementos = ss.getSheetByName('SUPLEMENTOS');
  if (!suplementos) throw new Error('No se encontró la hoja SUPLEMENTOS.');

  var hoja = ss.getSheetByName('STOCK_OBJETIVO');
  if (!hoja) hoja = ss.insertSheet('STOCK_OBJETIVO');
  var configuracion = _stockObjLeerConfiguracion(hoja);
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
  hoja.getDataRange().breakApart();
  hoja.clearContents();
  hoja.clearFormats();
  hoja.setConditionalFormatRules([]);

  hoja.getRange('A1:L1').merge().setValue('CONTROL DE STOCK OBJETIVO Y CAPITAL')
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

  hoja.getRange('A5:L5').merge().setValue(
    'Completá solo las columnas amarillas: Stock objetivo y Costo compra unitario. El resto cambia solo cuando cambia el stock de SUPLEMENTOS.'
  ).setBackground('#FFF4CC').setFontColor('#6B4E00').setFontWeight('bold').setWrap(true);

  var headers = [['Producto','Marca','Stock actual','Stock objetivo','Comprar','Costo compra unitario','Reinversión necesaria','Precio de venta','Capital invertido actual','Venta potencial','Ganancia bruta potencial','Estado']];
  hoja.getRange(6, 1, 1, headers[0].length).setValues(headers)
    .setBackground('#1a1a2e').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
  hoja.getRange('D6').setNote('Cantidad que querés mantener siempre disponible.');
  hoja.getRange('F6').setNote('Costo real pagado al proveedor por unidad. Sin este dato no se puede calcular la ganancia ni la reinversión con precisión.');

  var filas = productos.map(function(p, indice) {
    var fila = indice + 7;
    var cfg = configuracion[p.clave] || { objetivo: 0, costo: 0 };
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
      '=IF(D' + fila + '=0' + separadorFormula + '"⚪ SIN OBJETIVO"' + separadorFormula + 'IF(E' + fila + '>0' + separadorFormula + 'IF(F' + fila + '=""' + separadorFormula + '"🟠 COMPRAR "&E' + fila + '&" · CARGAR COSTO"' + separadorFormula + '"🔴 COMPRAR "&E' + fila + ')' + separadorFormula + '"🟢 OBJETIVO CUBIERTO"))'
    ];
  });

  if (filas.length) {
    hoja.getRange(7, 1, filas.length, headers[0].length).setValues(filas);
    hoja.getRange(7, 4, filas.length, 1).setBackground('#FFF8D6');
    hoja.getRange(7, 6, filas.length, 1).setBackground('#FFF8D6');
    hoja.getRange(7, 3, filas.length, 3).setNumberFormat('0');
    hoja.getRange(7, 6, filas.length, 6).setNumberFormat('$#,##0');
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
  [280,145,90,100,75,120,125,105,125,110,125,190].forEach(function(ancho, indice) {
    hoja.setColumnWidth(indice + 1, ancho);
  });
  hoja.getRange(1, 1, Math.max(6, filas.length + 6), headers[0].length).setVerticalAlignment('middle');
  SpreadsheetApp.flush();
  ss.toast('Control de stock objetivo listo.', 'MAXUP', 6);
  return { ok: true, productos: filas.length, hoja: 'STOCK_OBJETIVO' };
}

function agregarMenuStockObjetivo() {
  SpreadsheetApp.getUi().createMenu('📦 STOCK OBJETIVO')
    .addItem('Actualizar lista de productos', 'crearControlStockObjetivo')
    .addToUi();
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
