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
  const objetivo = source.match(/function _waConsultaPorObjetivo_[\s\S]*?(?=function _waCategoriaConsulta\()/);
  const categoria = source.match(/function _waCategoriaConsulta[\s\S]*?(?=function _waCategoriaProducto\()/);
  const fuzzy = source.match(/function _waDistanciaTexto_[\s\S]*?(?=function _waBuscarProductos\()/);
  const buscar = source.match(/function _waBuscarProductos[\s\S]*?(?=function _waMoneda\()/);
  assert.ok(normalizar && extraer && ayuda && objetivo && categoria && fuzzy && buscar, 'No se encontraron las funciones de búsqueda inteligente');
  const run = new Function(`
    ${normalizar[0]}
    ${extraer[0]}
    ${ayuda[0]}
    ${objetivo[0]}
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
    ${take('_waConsultaPorObjetivo_', '_waCategoriaConsulta')}
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
      {nombre:'Whey Protein',marca:'ENA',categoria:'proteina',stock:5,precio_venta:30000,descripcion:'Proteína de suero.'},
      {nombre:'Mass Gainer',marca:'ENA',categoria:'gainer',stock:3,precio_venta:48000,descripcion:'Aporte de calorías para acompañar una etapa de volumen.'},
      {nombre:'Creatina 300g',marca:'GOLD',categoria:'creatina',stock:3,precio_venta:29000,descripcion:'Acompaña fuerza y potencia.'},
      {nombre:'Pre Work Focus',marca:'STAR',categoria:'preworkout',stock:3,precio_venta:31000,descripcion:'Acompaña energía y enfoque antes de entrenar.'},
      {nombre:'Protein Bar',marca:'NUTRILAB',categoria:'barra',stock:8,precio_venta:4000,descripcion:'Barrita práctica que aporta energía entre comidas.'},
      {nombre:'Collagen Sport',marca:'STAR',categoria:'colageno',stock:3,precio_venta:25000,descripcion:'Acompaña articulaciones y tejidos conectivos.'},
      {nombre:'Omega 3 Fish Oil 60 Caps',marca:'STAR',categoria:'magnesio',stock:4,precio_venta:34000,descripcion:'Aceite de pescado con EPA y DHA.'},
      {nombre:'ZMA 90 Caps',marca:'STAR',categoria:'magnesio',stock:2,precio_venta:22000,descripcion:'Zinc, magnesio y vitamina B6.'}
    ]}; }
    return {
      quemador:_waBuscarProductos('5490000000000','precio del quemador de grasa',false),
      objetivo:_waBuscarProductos('5490000000000','hola tenes algo para bajar de peso',false),
      subir:_waBuscarProductos('5490000000000','hola tenes algo para subir de peso',false),
      fuerza:_waBuscarProductos('5490000000000','quiero algo para ganar fuerza',false),
      energia:_waBuscarProductos('5490000000000','hola necesito algo que me de energia que tenes',false),
      dudaCreatina:_waBuscarProductos('5490000000000','lei que la creatina me ayudaria puede ser',false),
      articulaciones:_waBuscarProductos('5490000000000','busco algo para cuidar mis articulaciones',false),
      omega:_waBuscarProductos('5490000000000','omega 3',false)
    };
  `);
  const resultado = run();
  const respuesta = resultado.quemador;
  assert.match(respuesta, /Sobre los quemadores de grasa/);
  assert.match(respuesta, /Thermo Energy/);
  assert.match(respuesta, /Fórmula termogénica/);
  assert.match(respuesta, /3 cuotas de/);
  assert.match(respuesta, /Stock: 3 unidades/);
  assert.match(respuesta, /asesor/);
  assert.doesNotMatch(respuesta, /Whey Protein/);
  assert.match(resultado.objetivo, /Sobre los quemadores de grasa/);
  assert.match(resultado.objetivo, /Thermo Energy/);
  assert.doesNotMatch(resultado.objetivo, /necesito un dato más/i);
  assert.match(resultado.subir, /Mass Gainer/);
  assert.match(resultado.subir, /ganadores de peso/);
  assert.match(resultado.fuerza, /Creatina 300g/);
  assert.match(resultado.energia, /Pre Work Focus/);
  assert.doesNotMatch(resultado.energia, /Protein Bar/);
  assert.match(resultado.dudaCreatina, /Creatina 300g/);
  assert.doesNotMatch(resultado.dudaCreatina, /NUTRILAB/);
  assert.match(resultado.articulaciones, /Collagen Sport/);
  assert.match(resultado.omega, /Sobre el Omega 3/);
  assert.match(resultado.omega, /Omega 3 Fish Oil/);
  assert.doesNotMatch(resultado.omega, /ZMA 90 Caps/);
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

test('La configuración de Gemini acepta formatos nuevos y limpia el portapapeles', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  const limpiar = source.match(/function _waLimpiarApiKeyGemini_[\s\S]*?(?=function configurarGeminiMax\()/);
  assert.ok(limpiar, 'No se encontró la limpieza de la clave de Gemini');
  const run = new Function(`${limpiar[0]}; return [
    _waLimpiarApiKeyGemini_('  GEMINI_API_KEY="nueva_clave_google_1234567890"  '),
    _waLimpiarApiKeyGemini_('nueva\u200B_clave_google_1234567890')
  ];`);
  assert.deepEqual(run(), ['nueva_clave_google_1234567890', 'nueva_clave_google_1234567890']);
});

test('Max saluda según la hora y se presenta como asistente de MAXUP', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  const block = source.match(/function _waSaludoMomento_[\s\S]*?(?=function _waEsConsultaGeneralCatalogo\()/);
  assert.ok(block);
  const run = new Function(`
    const Utilities={formatDate:()=> '15'};
    ${block[0]}
    return _waMenu();
  `);
  const respuesta=run();
  assert.match(respuesta,/Buenas tardes/);
  assert.match(respuesta,/asistente de \*MAXUP\*/);
});

test('Max muestra como máximo seis suplementos y describe consultas específicas', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  assert.match(source,/vi<coincidencias\.length && vi<6/);
  assert.match(source,/Sobre el Omega 3/);
  assert.match(source,/Sobre la ashwagandha/);
  assert.match(source,/Sobre el ZMA/);
  assert.match(source,/Sobre el resveratrol/);
  assert.match(source,/¿Querés más información sobre alguno en particular/);
});

test('Max ofrece asesor cuando una marca reconocida no tiene stock', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  const helpers = source.match(/function _waMarcaSolicitada_[\s\S]*?(?=function _waBuscarProductos\()/);
  assert.ok(helpers);
  const run = new Function(`
    function _waNormalizar(v){return String(v||'').toLowerCase();}
    function _waCategoriaProducto(p){return p.categoria;}
    function _waTokenCoincide_(a,b){return a===b;}
    ${helpers[0]}
    const productos=[{marca:'GOLD NUTRITION',categoria:'creatina',stock:0}];
    const marca=_waMarcaSolicitada_('creatina gold',productos,'creatina');
    return _waRespuestaSinStock_('creatina gold','creatina',marca);
  `);
  const respuesta=run();
  assert.match(respuesta,/GOLD NUTRITION/);
  assert.match(respuesta,/no contamos/i);
  assert.match(respuesta,/asesor/);
});

