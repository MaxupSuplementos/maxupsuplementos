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
  hoja.getDataRange().breakApart();
  hoja.clearContents();
  hoja.clearFormats();
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
    .addItem('Actualizar costos y precios mayoristas', 'actualizarPreciosMayoristasMaxup')
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
    if (nombre && precio) salida.push({ nombre:nombre, marca:marca, costo:precio, fuente:'REVENDEDOR 2025' });
    var nombrePromo = String(filas[i][3] || '').trim(), precioPromo = _mayoImporte_(filas[i][4]);
    if (nombrePromo && precioPromo) salida.push({ nombre:nombrePromo, marca:'LABORATORIO LAX', costo:precioPromo, fuente:'REVENDEDOR 2025 · PROMO' });
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

function _mayoMarcaColo_(nombre) {
  var n = _mayoNorm_(nombre);
  var reglas = [
    ['star nutrition','STAR NUTRITION'], ['gold nutrition','GOLD NUTRITION'], ['woman','WOMAN'],
    ['ena','ENA'], ['nutremax','NUTREMAX'], ['nutrex','NUTREX'], ['optimum','OPTIMUM NUTRITION'],
    ['optimun','OPTIMUM NUTRITION'], ['protein project','PROTEIN PROJECT'], ['granger','GRANGER'],
    ['bsn','BSN'], ['universal','UNIVERSAL'], ['cellucor','CELLUCOR'], ['ultimate','ULTIMATE'],
    ['mervick','MERVICK'], ['everlast','SHAKERS'], ['gat ','GAT']
  ];
  for (var i = 0; i < reglas.length; i++) if (n.indexOf(reglas[i][0].trim()) >= 0) return reglas[i][1];
  return '';
}

function _mayoProveedorColo_() {
  var salida = [];
  for (var pagina = 1; pagina <= 4; pagina++) {
    var url = pagina === 1 ? 'https://suplementoscolomayorista.com.ar/tienda/'
      : 'https://suplementoscolomayorista.com.ar/tienda/page/' + pagina + '/';
    var respuesta = UrlFetchApp.fetch(url, { muteHttpExceptions:true, followRedirects:true });
    if (respuesta.getResponseCode() !== 200) continue;
    var html = respuesta.getContentText('UTF-8');
    var bloques = html.match(/<li[^>]*class="[^"]*(?:product|type-product)[^"]*"[^>]*>[\s\S]*?<\/li>/gi) || [];
    for (var b = 0; b < bloques.length; b++) {
      var tituloMatch = bloques[b].match(/woocommerce-loop-product__title[^>]*>([\s\S]*?)<\/h2>/i);
      var nombre = tituloMatch ? _mayoTextoHtml_(tituloMatch[1]) : '';
      var marca = _mayoMarcaColo_(nombre);
      if (!nombre || !marca) continue;
      var texto = _mayoTextoHtml_(bloques[b]), re = /\$\s*([\d.]+(?:,\d+)?)/g, m, precios = [];
      while ((m = re.exec(texto)) !== null) { var importe = _mayoImporte_(m[1]); if (importe) precios.push(importe); }
      if (!precios.length) continue;
      salida.push({ nombre:nombre, marca:marca, costo:Math.min.apply(null, precios), fuente:'COLO MAYORISTA' });
    }
  }
  return salida;
}

function _mayoProveedorGuardado_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('_PROVEEDORES_MAYORISTA');
  if (!hoja || hoja.getLastRow() < 2) return [];
  var filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, 4).getValues(), salida = [];
  filas.forEach(function(row) {
    var nombre = String(row[1] || '').trim(), costo = _mayoImporte_(row[2]);
    if (!nombre || !costo) return;
    salida.push({
      nombre:nombre,
      marca:String(row[0] || '').trim() || _mayoMarcaColo_(nombre),
      costo:costo,
      fuente:String(row[3] || 'LISTA GUARDADA')
    });
  });
  try { if (!hoja.isSheetHidden()) hoja.hideSheet(); } catch (eOcultar) {}
  return salida;
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

function _mayoPrepararProveedores_() {
  var todos = [], mapa = {};
  try { todos = todos.concat(_mayoProveedorExcel_()); } catch (eExcel) {}
  try { todos = todos.concat(_mayoProveedorColo_()); } catch (eColo) {}
  todos = todos.concat(_mayoProveedorGuardado_());
  todos.forEach(function(p) {
    var clave = _mayoMarca_(p.marca) + '||' + _mayoNorm_(p.nombre);
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

function actualizarPreciosMayoristasMaxup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaSup = ss.getSheetByName('SUPLEMENTOS');
  if (!hojaSup) throw new Error('No se encontró SUPLEMENTOS.');
  var hojaObj = ss.getSheetByName('STOCK_OBJETIVO');
  if (!hojaObj || hojaObj.getLastRow() < 7) { crearControlStockObjetivo(); hojaObj = ss.getSheetByName('STOCK_OBJETIVO'); }

  var proveedores = _mayoPrepararProveedores_();
  if (!proveedores.length) throw new Error('No se encontraron precios de proveedores.');
  var datos = hojaSup.getDataRange().getValues(), marca = '', resultados = {}, aplicados = 0, revisar = 0, sinMargen = 0;
  var colBase = 11, colMax = 12;
  hojaSup.getRange(2, colBase).setValue('Desc Mayorista Base %').setNote('Calculado para proteger al menos 20% de margen bruto.');
  hojaSup.getRange(2, colMax).setValue('Desc Mayorista Máx %').setNote('Tope seguro para los descuentos por volumen.');
  if (datos.length > 2) hojaSup.getRange(3, colBase, datos.length - 2, 2).clearContent();

  for (var i = 2; i < datos.length; i++) {
    var nombre = String(datos[i][0] || '').trim(), venta = Number(datos[i][1]) || 0;
    if (!nombre) continue;
    if (!venta) { marca = nombre; continue; }
    var producto = { nombre:nombre, marca:marca }, match = _mayoMejorCoincidencia_(producto, proveedores);
    var clave = _stockObjClave(marca, nombre), costo = 0, fuente = '', proveedorNombre = '';
    if (match.proveedor) { costo = Number(match.proveedor.costo) || 0; fuente = match.proveedor.fuente; proveedorNombre = match.proveedor.nombre; }
    var maximo = 0, base = 0, estado = match.estado;
    if (estado === 'AUTOMÁTICO' && costo > 0) {
      maximo = Math.max(0, Math.min(35, Math.floor((1 - (costo / (1 - MAYO_MARGEN_BRUTO_MINIMO)) / venta) * 100)));
      base = Math.min(15, maximo);
      if (maximo < 5) { base = 0; estado = 'SIN MARGEN'; sinMargen++; }
      else aplicados++;
    } else revisar++;
    resultados[clave] = { producto:nombre, marca:marca, venta:venta, costo:costo,
      proveedor:proveedorNombre, proveedorMarca:match.proveedor ? match.proveedor.marca : '',
      fuente:fuente, score:match.score, estado:estado, base:base, maximo:maximo };
    if (estado === 'AUTOMÁTICO') hojaSup.getRange(i + 1, colBase, 1, 2).setValues([[base, maximo]]);
    else if (estado === 'SIN MARGEN') hojaSup.getRange(i + 1, colBase, 1, 2).setValues([[0, 0]]);
  }

  var headers = [['Proveedor sugerido','Producto del proveedor','Costo proveedor actual','Fuente','Coincidencia',
    'Desc mayorista base %','Desc mayorista máximo %','Precio mayorista base','Margen bruto base','Estado mayorista','Actualizado']];
  hojaObj.getRange(6, 16, 1, headers[0].length).setValues(headers)
    .setBackground('#1a1a2e').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
  var filasObj = hojaObj.getLastRow() >= 7 ? hojaObj.getRange(7, 1, hojaObj.getLastRow()-6, 6).getValues() : [];
  var salida = [], costos = [];
  filasObj.forEach(function(r) {
    var info = resultados[_stockObjClave(r[1], r[0])];
    if (!info) { salida.push(['','','','','',0,0,'','','SIN DATOS',new Date()]); costos.push([r[5] || '']); return; }
    var costoExistente = Number(r[5]) || 0;
    var costoUsado = costoExistente || ((info.estado === 'AUTOMÁTICO' || info.estado === 'SIN MARGEN') ? info.costo : 0);
    costos.push([costoUsado || '']);
    var precioMayo = info.base > 0 ? Math.round(info.venta * (1-info.base/100)) : '';
    var margen = precioMayo && costoUsado ? (precioMayo-costoUsado)/precioMayo : '';
    salida.push([info.proveedorMarca,info.proveedor,info.costo||'',info.fuente,Math.round(info.score*100)+'%',
      info.base,info.maximo,precioMayo,margen,info.estado,new Date()]);
  });
  if (salida.length) {
    hojaObj.getRange(7, 16, salida.length, salida[0].length).setValues(salida);
    hojaObj.getRange(7, 6, costos.length, 1).setValues(costos);
    hojaObj.getRange(7, 18, salida.length, 1).setNumberFormat('$#,##0');
    hojaObj.getRange(7, 21, salida.length, 2).setNumberFormat('0');
    hojaObj.getRange(7, 23, salida.length, 1).setNumberFormat('$#,##0');
    hojaObj.getRange(7, 24, salida.length, 1).setNumberFormat('0.0%');
    hojaObj.getRange(7, 26, salida.length, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  }
  [150,320,120,150,95,115,125,125,110,135,140].forEach(function(ancho, idx){ hojaObj.setColumnWidth(16+idx, ancho); });
  SpreadsheetApp.flush();
  ss.toast('Mayorista: ' + aplicados + ' precios seguros, ' + sinMargen + ' sin margen y ' + revisar + ' para revisar.', 'MAXUP', 10);
  return { ok:true, proveedores:proveedores.length, aplicados:aplicados, sinMargen:sinMargen, revisar:revisar,
    minimo:MAYO_MINIMO_PEDIDO, margenMinimo:MAYO_MARGEN_BRUTO_MINIMO };
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
