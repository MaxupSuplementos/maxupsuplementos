// ============================================================
// MAXUP — Organización visual y panel principal de Google Sheets
// ============================================================

function _orgMaxupUrlHoja_(ss, hoja) {
  return ss.getUrl() + '#gid=' + hoja.getSheetId();
}

function _orgMaxupTarjeta_(ss, hojaInicio, a1, nombreHoja, titulo, detalle, color) {
  var destino = ss.getSheetByName(nombreHoja);
  if (!destino) return;
  var rango = hojaInicio.getRange(a1);
  rango.merge();
  var richText = SpreadsheetApp.newRichTextValue()
    .setText(titulo + '\n' + detalle)
    .setLinkUrl(_orgMaxupUrlHoja_(ss, destino))
    .build();
  rango.setRichTextValue(richText)
    .setBackground(color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle')
    .setWrap(true);
}

function _orgMaxupResumen_(hoja, etiquetaA1, valorA1, etiqueta, formula, color) {
  hoja.getRange(etiquetaA1).merge().setValue(etiqueta)
    .setBackground(color).setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  hoja.getRange(valorA1).merge().setFormula(formula)
    .setBackground('#F5F7FA').setFontColor('#10233B').setFontWeight('bold')
    .setFontSize(18).setHorizontalAlignment('center').setVerticalAlignment('middle');
}

function crearPanelInicioMaxup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('INICIO');
  if (!hoja) hoja = ss.insertSheet('INICIO', 0);
  hoja.showSheet();
  if (hoja.getFilter()) hoja.getFilter().remove();
  hoja.getDataRange().breakApart();
  hoja.clearContents();
  hoja.clearFormats();
  hoja.setConditionalFormatRules([]);
  hoja.setHiddenGridlines(true);
  hoja.setTabColor('#10233B');

  hoja.getRange('A1:L2').merge().setValue('MAXUP  |  PANEL PRINCIPAL')
    .setBackground('#10233B').setFontColor('#00C8FF').setFontWeight('bold')
    .setFontSize(20).setHorizontalAlignment('center').setVerticalAlignment('middle');
  hoja.getRange('A3:L3').merge().setValue('Elegí una sección. Las hojas técnicas siguen funcionando, pero están ocultas para que la planilla sea más clara.')
    .setBackground('#EAF8FC').setFontColor('#29465B').setFontSize(10)
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);

  _orgMaxupTarjeta_(ss, hoja, 'A5:D7', 'SUPLEMENTOS', '📦 PRODUCTOS Y STOCK', 'Precios, stock y suplementos', '#007EA7');
  _orgMaxupTarjeta_(ss, hoja, 'E5:H7', 'STOCK_OBJETIVO', '🎯 STOCK OBJETIVO', 'Compras, capital y reinversión', '#E67E22');
  _orgMaxupTarjeta_(ss, hoja, 'I5:L7', 'INDUMENTARIA', '👕 INDUMENTARIA', 'Prendas, talles, precios y stock', '#8E44AD');

  _orgMaxupTarjeta_(ss, hoja, 'A9:D11', 'VentasDiarias', '💰 VENTAS', 'Registro y análisis de ventas', '#1E8449');
  _orgMaxupTarjeta_(ss, hoja, 'E9:H11', 'CLIENTES', '👥 CLIENTES', 'Datos e historial de clientes', '#2874A6');
  _orgMaxupTarjeta_(ss, hoja, 'I9:L11', 'PEDIDOS', '🧾 PEDIDOS', 'Estado de pedidos y entregas', '#566573');

  _orgMaxupTarjeta_(ss, hoja, 'A13:D15', 'DEUDORES', '📋 DEUDORES', 'Saldos y cuentas pendientes', '#B03A2E');
  _orgMaxupTarjeta_(ss, hoja, 'E13:H15', 'ANALISIS_OFERTAS', '📣 OFERTAS', 'Promociones y productos sugeridos', '#D35400');
  _orgMaxupTarjeta_(ss, hoja, 'I13:L15', 'CLUB_MAXUP', '⭐ CLUB MAXUP', 'Socios, beneficios y cupones', '#7D3C98');

  _orgMaxupResumen_(hoja, 'A17:C17', 'A18:C19', 'PRODUCTOS A COMPRAR', "='STOCK_OBJETIVO'!B3", '#E67E22');
  _orgMaxupResumen_(hoja, 'D17:F17', 'D18:F19', 'UNIDADES A COMPRAR', "='STOCK_OBJETIVO'!E3", '#D35400');
  _orgMaxupResumen_(hoja, 'G17:I17', 'G18:I19', 'REINVERSIÓN NECESARIA', "='STOCK_OBJETIVO'!B2", '#007EA7');
  _orgMaxupResumen_(hoja, 'J17:L17', 'J18:L19', 'VENTA POTENCIAL', "='STOCK_OBJETIVO'!H2", '#1E8449');
  hoja.getRange('G18:I19').setNumberFormat('$#,##0');
  hoja.getRange('J18:L19').setNumberFormat('$#,##0');

  hoja.getRange('A21:L21').merge().setValue('CÓMO MANTENER LA LISTA DE PRODUCTOS')
    .setBackground('#10233B').setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center');
  hoja.getRange('A22:L24').merge().setValue(
    'Cuando agregues un suplemento nuevo, usá el menú “📦 STOCK OBJETIVO” → “Actualizar lista y análisis”. ' +
    'El producto aparecerá automáticamente sin perder los objetivos ni costos que ya cargaste. El stock y los cálculos se actualizan solos.'
  ).setBackground('#FFF4CC').setFontColor('#6B4E00').setWrap(true)
    .setHorizontalAlignment('left').setVerticalAlignment('middle');

  for (var col = 1; col <= 12; col++) hoja.setColumnWidth(col, 86);
  hoja.setRowHeights(1, 24, 24);
  hoja.setRowHeights(5, 3, 30);
  hoja.setRowHeights(9, 3, 30);
  hoja.setRowHeights(13, 3, 30);
  hoja.setRowHeights(17, 3, 28);
  hoja.setRowHeights(22, 3, 27);
  hoja.setFrozenRows(3);
  hoja.activate();
  hoja.setActiveSelection('A1');
  return hoja;
}

function organizarPlanillaMaxup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inicio = crearPanelInicioMaxup();
  var orden = [
    'INICIO', 'SUPLEMENTOS', 'STOCK_OBJETIVO', 'INDUMENTARIA',
    'VentasDiarias', 'CLIENTES', 'PEDIDOS', 'DEUDORES', 'NOTIFICACIONES',
    'STOCK_DETALLADO', 'ANALISIS_OFERTAS', 'CLUB_MAXUP', 'CUPONES',
    'ASISTENTE_RESPUESTAS', 'FICHAS_PUBLICACIONES',
    'REPOSICION', 'CHANCES_CLUB', 'SORTEOS_CLUB', 'AUDITORIA',
    'USOS_CUPONES', 'CONFIGURACION', 'MOVIMIENTOS_STOCK', 'WA_DIAGNOSTICO',
    'MAYORISTAS', 'PEDIDOS_MAYORISTA'
  ];
  var colores = {
    INICIO: '#10233B', SUPLEMENTOS: '#00A8CC', STOCK_OBJETIVO: '#E67E22',
    INDUMENTARIA: '#8E44AD', VentasDiarias: '#1E8449', CLIENTES: '#2874A6',
    PEDIDOS: '#566573', DEUDORES: '#B03A2E', NOTIFICACIONES: '#F39C12',
    STOCK_DETALLADO: '#17A589', ANALISIS_OFERTAS: '#D35400', CLUB_MAXUP: '#7D3C98',
    CUPONES: '#AF7AC5', ASISTENTE_RESPUESTAS: '#3498DB', FICHAS_PUBLICACIONES: '#E91E63'
  };
  var ocultas = {
    REPOSICION: true, CHANCES_CLUB: true, SORTEOS_CLUB: true, AUDITORIA: true,
    USOS_CUPONES: true, CONFIGURACION: true, MOVIMIENTOS_STOCK: true,
    WA_DIAGNOSTICO: true, MAYORISTAS: true, PEDIDOS_MAYORISTA: true
  };

  orden.forEach(function(nombre, indice) {
    var hoja = ss.getSheetByName(nombre);
    if (!hoja) return;
    hoja.activate();
    ss.moveActiveSheet(indice + 1);
    hoja.setTabColor(colores[nombre] || '#AAB2BD');
    if (ocultas[nombre]) hoja.hideSheet();
    else hoja.showSheet();
  });

  inicio.showSheet();
  inicio.activate();
  inicio.setActiveSelection('A1');
  SpreadsheetApp.flush();
  ss.toast('La planilla quedó organizada. No se borró ninguna hoja.', 'MAXUP', 8);
  return { ok: true, visibles: ss.getSheets().filter(function(h) { return !h.isSheetHidden(); }).length };
}

function abrirInicioMaxup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('INICIO') || crearPanelInicioMaxup();
  hoja.showSheet();
  hoja.activate();
  hoja.setActiveSelection('A1');
}
