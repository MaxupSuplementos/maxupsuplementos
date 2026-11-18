const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Max reconoce la consulta general enviada desde la tienda', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  const block = source.match(/function _waNormalizar[\s\S]*?(?=function _waClaveEstado\()/);
  assert.ok(block, 'No se encontraron las funciones de intención general');
  const run = new Function(block[0] + `
    var mensaje = 'Hola MAXUP! Estoy viendo su catálogo y quiero más info sobre sus productos y precios. ¿Pueden asesorarme?';
    return {
      esGeneral: _waEsConsultaGeneralCatalogo(_waNormalizar(mensaje)),
      productoPuntual: _waEsConsultaGeneralCatalogo(_waNormalizar('precio de proteína Star')),
      respuesta: _waRespuestaCatalogoGeneral()
    };
  `);
  const result = run();
  assert.equal(result.esGeneral, true);
  assert.equal(result.productoPuntual, false);
  assert.match(result.respuesta, /Soy \*Max\*/);
  assert.match(result.respuesta, /proteínas/);
  assert.doesNotMatch(result.respuesta, /No encontre stock/i);
});

test('Max deriva a los dos WhatsApp de atención humana', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  const constants = source.match(/var WA_ATENCION_HUMANA_1[\s\S]*?var WA_ATENCION_HUMANA_2[^;]+;/);
  const block = source.match(/function _waDerivarHumano[\s\S]*?(?=function _enviarWhatsAppTexto\()/);
  assert.ok(constants && block, 'No se encontró la derivación humana');
  const run = new Function(`
    function _waGuardarEstado() {}
    function _waAvisarDerivacion_() { return {consulta:'prueba'}; }
    ${constants[0]}
    ${block[0]}
    return _waDerivarHumano('5491112345678', 'prueba');
  `);
  const respuesta = run();
  assert.match(respuesta, /wa\.me\/5491168461457/);
  assert.match(respuesta, /wa\.me\/5493875104606/);
  assert.match(respuesta, /Toca el enlace/);
});

test('Max extrae óxido nítrico de una pregunta completa y encuentra el producto', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  const normalizar = source.match(/function _waNormalizar[\s\S]*?(?=function _waMenu\()/);
  const extraer = source.match(/function _waExtraerConsultaProducto_[\s\S]*?(?=function _waAyudaBusquedaProducto_\()/);
  const ayuda = source.match(/function _waAyudaBusquedaProducto_[\s\S]*?(?=function _waClaveEstado\()/);
  const categoria = source.match(/function _waCategoriaConsulta[\s\S]*?(?=function _waCategoriaProducto\()/);
  const fuzzy = source.match(/function _waDistanciaTexto_[\s\S]*?(?=function _waBuscarProductos\()/);
  const buscar = source.match(/function _waBuscarProductos[\s\S]*?(?=function _waMoneda\()/);
  assert.ok(normalizar && extraer && ayuda && categoria && fuzzy && buscar, 'No se encontraron las funciones de búsqueda inteligente');
  const run = new Function(`
    ${normalizar[0]}
    ${extraer[0]}
    ${ayuda[0]}
    ${categoria[0]}
    function _waTokenGenericoCategoria() { return false; }
    function _waCategoriaProducto(p) { return p.categoria; }
    function _waDetalleProducto(p) { return 'ENCONTRADO: ' + p.nombre; }
    function _waGuardarResultadosProductos() {}
    function _waGuardarProductoSeleccionado_() {}
    function _waDescripcionCategoria_() { return 'INFORMACION DE LA CATEGORIA'; }
    function _waDescripcionCortaProducto_() { return ''; }
    function _waMoneda(n) { return '$' + n; }
    function getCatalogo() {
      return { productos: [{ nombre:'Oxido Nitrico 180 Caps', marca:'XTRENGHT', categoria:'aminoacido', stock:3, precio_venta:18000 }] };
    }
    ${fuzzy[0]}
    ${buscar[0]}
    return {
      clave: _waExtraerConsultaProducto_('Hola Max, ¿me das información sobre óxido nítrico?'),
      categoria: _waCategoriaConsulta(_waNormalizar('óxido nítrico')),
      respuesta: _waBuscarProductos('5490000000000', 'Hola Max, ¿me das información sobre óxido nítrico?', false),
      ayuda: _waBuscarProductos('5490000000000', 'Me das información', false)
    };
  `);
  const result = run();
  assert.equal(result.clave, 'oxido nitrico');
  assert.equal(result.categoria, 'preworkout');
  assert.match(result.respuesta, /ENCONTRADO: Oxido Nitrico 180 Caps/);
  assert.match(result.ayuda, /nombre, la marca|óxido nítrico/);
  assert.doesNotMatch(result.ayuda, /No encontre stock para/i);
});

test('Max entiende quemador de grasa y muestra reseña, precios, cuotas y stock', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  function take(start, end) {
    const match = source.match(new RegExp('function ' + start + '[\\s\\S]*?(?=function ' + end + '\\()'));
    assert.ok(match, 'No se encontró ' + start);
    return match[0];
  }
  const run = new Function(`
    ${take('_waNormalizar', '_waMenu')}
    ${take('_waExtraerConsultaProducto_', '_waAyudaBusquedaProducto_')}
    ${take('_waAyudaBusquedaProducto_', '_waClaveEstado')}
    ${take('_waCategoriaConsulta', '_waCategoriaProducto')}
    ${take('_waTokenGenericoCategoria', '_waDescripcionCategoria_')}
    ${take('_waDescripcionCategoria_', '_waBuscarProductos')}
    ${take('_waBuscarProductos', '_waMoneda')}
    function _waCategoriaProducto(p) { return p.categoria; }
    function _waGuardarResultadosProductos() {}
    function _waGuardarProductoSeleccionado_() {}
    function _waDetalleProducto(p) { return p.nombre; }
    function _waMoneda(n) { return '$' + n; }
    function getCatalogo() { return {productos:[
      {nombre:'Thermo Energy',marca:'STAR',categoria:'quemador',stock:3,precio_venta:20000,precio_lista:24000,descripcion:'Fórmula termogénica para acompañar una etapa de definición.'},
      {nombre:'Lipo Black',marca:'NUTREMAX',categoria:'quemador',stock:2,precio_venta:22000,precio_lista:27000,descripcion:'Combina ingredientes orientados a energía y actividad física.'},
      {nombre:'Whey Protein',marca:'ENA',categoria:'proteina',stock:5,precio_venta:30000,descripcion:'Proteína de suero.'}
    ]}; }
    return _waBuscarProductos('5490000000000','precio del quemador de grasa',false);
  `);
  const respuesta = run();
  assert.match(respuesta, /Sobre los quemadores de grasa/);
  assert.match(respuesta, /Thermo Energy/);
  assert.match(respuesta, /Fórmula termogénica/);
  assert.match(respuesta, /3 cuotas de/);
  assert.match(respuesta, /Stock: 3 unidades/);
  assert.match(respuesta, /asesor/);
  assert.doesNotMatch(respuesta, /Whey Protein/);
});

test('Max reconoce horarios y ubicación sin necesitar Gemini', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  const normalizar = source.match(/function _waNormalizar[\s\S]*?(?=function _waMenu\()/);
  const negocio = source.match(/function _waConfigNegocio_[\s\S]*?(?=function _waRespuestaPromociones_\()/);
  assert.ok(normalizar && negocio, 'No se encontraron las respuestas del local');
  const run = new Function(`
    ${normalizar[0]}
    function _leerConfiguracionMaxup(){ return {
      LOCAL_DIRECCION:'Calixto Gauna 1045, Barrio El Cruce, General Güemes, Salta',
      LOCAL_MAPS_URL:'https://maps.example/maxup',
      LOCAL_HORARIO_DIAS:'Lunes a sábado',
      LOCAL_HORARIO_MANANA:'09:00-13:00',
      LOCAL_HORARIO_TARDE:'18:00-21:30',
      LOCAL_HORARIO_DOMINGO:'Cerrado'
    }; }
    function _getConfig(){ return {GEMINI_MODEL:'gemini-3.5-flash-lite'}; }
    const Utilities={formatDate:(date,zone,format)=> format==='u'?'3':(format==='H'?'10':'30')};
    ${negocio[0]}
    return {
      horario:_waEsConsultaHorarios_(_waNormalizar('¿A qué hora abren hoy?')),
      ubicacion:_waEsConsultaUbicacion_(_waNormalizar('¿Dónde queda el local?')),
      respuesta:_waRespuestaHorarios_(),
      mapa:_waRespuestaUbicacion_()
    };
  `);
  const result = run();
  assert.equal(result.horario, true);
  assert.equal(result.ubicacion, true);
  assert.match(result.respuesta, /Ahora estamos abiertos/);
  assert.match(result.respuesta, /09:00-13:00/);
  assert.match(result.mapa, /maps\.example\/maxup/);
});

test('La búsqueda tolera errores simples en la marca', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  const distancia = source.match(/function _waDistanciaTexto_[\s\S]*?(?=function _waBuscarProductos\()/);
  assert.ok(distancia);
  const run = new Function(`${distancia[0]}; return _waTokenCoincide_('glod','gold nutrition',['gold','nutrition']);`);
  assert.equal(run(), true);
});

