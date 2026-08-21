// ════════════════════════════════════════════════════════════
//  FICHAS EDITABLES PARA PUBLICACIONES DIARIAS
// ════════════════════════════════════════════════════════════

var _HOJA_FICHAS_PUBLICACIONES = 'FICHAS_PUBLICACIONES';
var _HEADERS_FICHAS_PUBLICACIONES = [
  'SKU', 'MARCA', 'PRODUCTO', 'CATEGORIA', 'QUE ES',
  'BENEFICIO 1', 'BENEFICIO 2', 'BENEFICIO 3', 'BENEFICIO 4', 'BENEFICIO 5',
  'ESTADO', 'ACTUALIZADO'
];

function _normalizarTextoFicha(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function _limpiarTextoFicha(value, maximo) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maximo || 180);
}

function _claveFichaPublicacion(marca, nombre, sku) {
  var skuNormalizado = _normalizarTextoFicha(sku);
  if (skuNormalizado) return 'sku:' + skuNormalizado;
  return 'producto:' + _normalizarTextoFicha(marca) + '||' + _normalizarTextoFicha(nombre);
}

function _claveNombreFichaPublicacion(marca, nombre) {
  return 'producto:' + _normalizarTextoFicha(marca) + '||' + _normalizarTextoFicha(nombre);
}

function _fichaPublicacionBase(producto) {
  var nombre = String(producto.nombre || '');
  var categoria = String(producto.categoria || 'otros');
  var texto = _normalizarTextoFicha([nombre, producto.marca, categoria].join(' '));
  var descripcionCatalogo = _limpiarTextoFicha(producto.descripcion, 220);

  function crear(queEs, beneficios) {
    return {
      queEs: descripcionCatalogo || _limpiarTextoFicha(queEs, 220),
      beneficios: beneficios.map(function(item) { return _limpiarTextoFicha(item, 115); }).slice(0, 5)
    };
  }

  if (/glutamin/.test(texto)) {
    return crear(
      'Aminoácido en polvo que forma parte natural de los músculos y participa en el metabolismo de las proteínas.',
      [
        'Ayuda a complementar la ingesta diaria de glutamina.',
        'Participa en el transporte de nitrógeno del organismo.',
        'Es utilizada como combustible por células intestinales e inmunes.',
        'Resulta práctica durante etapas de entrenamiento exigente.',
        'No reemplaza una proteína completa ni una alimentación equilibrada.'
      ]
    );
  }

  if (/creatin/.test(texto)) {
    return crear(
      /monohidrat/.test(texto)
        ? 'Creatina monohidrato en polvo, diseñada para aumentar la disponibilidad de energía rápida en el músculo.'
        : 'Suplemento de creatina en polvo, pensado para esfuerzos breves, intensos y repetidos.',
      [
        'Favorece el rendimiento en series de alta intensidad.',
        'Acompaña objetivos de fuerza y potencia muscular.',
        'Ayuda a repetir esfuerzos explosivos con mejor rendimiento.',
        'Complementa el aumento de masa junto con entrenamiento de fuerza.',
        'Se utiliza diariamente para mantener los depósitos musculares.'
      ]
    );
  }

  if (/gainer|ultra mass|mutant mass|nitro gain|mass fusion|extreme mass|mass builder/.test(texto)) {
    return crear(
      'Fórmula hipercalórica que combina carbohidratos y proteínas para sumar energía y nutrientes en una porción práctica.',
      [
        'Ayuda a aumentar la ingesta diaria de calorías.',
        'Aporta carbohidratos para acompañar el gasto energético.',
        'Incluye proteínas para el mantenimiento muscular.',
        'Facilita alcanzar objetivos de aumento de peso y masa.',
        'Es una alternativa práctica cuando cuesta comer suficiente.'
      ]
    );
  }

  if (/proteina.*colag|protein.*collagen|fit.*colag/.test(texto)) {
    return crear(
      'Fórmula que combina una fuente de proteína con colágeno para complementar la nutrición muscular y estructural.',
      [
        'Ayuda a completar la proteína diaria.',
        'Aporta aminoácidos para mantenimiento y reparación muscular.',
        'Suma péptidos de colágeno a la alimentación.',
        'Puede aportar saciedad dentro de un plan alimentario.',
        'Es práctica como colación o después de entrenar.'
      ]
    );
  }

  if (/whey|wh3y|proteina|protein|caseina|isolate|bio prot/.test(texto)) {
    var tipoProteina = /isolate|aislad/.test(texto)
      ? 'Proteína aislada, una fuente concentrada de aminoácidos esenciales para complementar la alimentación.'
      : (/whey/.test(texto)
        ? 'Proteína de suero de leche con aminoácidos esenciales, en un formato práctico para alcanzar la proteína diaria.'
        : 'Suplemento proteico en polvo para complementar el aporte diario de proteínas y aminoácidos.');
    return crear(tipoProteina, [
      'Ayuda a alcanzar el consumo diario de proteína.',
      'Aporta aminoácidos necesarios para reparar el músculo.',
      'Acompaña el desarrollo de masa junto con entrenamiento de fuerza.',
      'Contribuye al mantenimiento de la masa muscular.',
      'Puede aportar mayor saciedad dentro de un plan alimentario.'
    ]);
  }

  if (/bcaa|\beaa\b|aminoacid|leucina/.test(texto)) {
    return crear(
      /bcaa/.test(texto)
        ? 'Fórmula de aminoácidos de cadena ramificada: leucina, isoleucina y valina.'
        : 'Mezcla de aminoácidos diseñada para complementar el aporte proveniente de las proteínas.',
      [
        'Aporta aminoácidos que forman parte de las proteínas musculares.',
        'La leucina participa en la síntesis de proteína muscular.',
        'Es fácil de incorporar alrededor del entrenamiento.',
        'Puede ser útil cuando la alimentación aporta poca proteína.',
        'No reemplaza una fuente completa de proteína.'
      ]
    );
  }

  if (/carnitin/.test(texto)) {
    return crear(
      'Suplemento de L-carnitina, compuesto que participa en el transporte de ácidos grasos dentro de las células.',
      [
        'Participa en el metabolismo normal de las grasas.',
        'Se integra con facilidad antes o durante una rutina activa.',
        'Complementa planes de entrenamiento y alimentación.',
        'El formato líquido permite una toma práctica.',
        'No reemplaza el déficit calórico necesario para perder grasa.'
      ]
    );
  }

  if (/omega 3|fish oil|aceite de pescado/.test(texto)) {
    return crear(
      'Aceite de pescado que aporta ácidos grasos omega-3, principalmente EPA y DHA.',
      [
        'Ayuda a complementar la ingesta de EPA y DHA.',
        'Contribuye al funcionamiento normal del corazón.',
        'El DHA participa en el funcionamiento normal del cerebro.',
        'Complementa dietas con bajo consumo de pescado graso.',
        'Las cápsulas facilitan una porción diaria controlada.'
      ]
    );
  }

  if (/cafeina/.test(texto)) {
    var dosisCafeina = (nombre.match(/\b\d{2,3}\s*mg\b/i) || [])[0] || '';
    return crear(
      'Suplemento estimulante de cafeína' + (dosisCafeina ? ' con ' + dosisCafeina + ' por presentación indicada' : '') + ', pensado para aumentar el estado de alerta.',
      [
        'Puede aumentar temporalmente la energía y el estado de alerta.',
        'Ayuda a reducir la percepción de esfuerzo y cansancio.',
        'Puede mejorar el rendimiento en actividades de resistencia.',
        'Permite controlar mejor la cantidad que una bebida común.',
        'Debe evitarse cerca del descanso o si existe sensibilidad.'
      ]
    );
  }

  if (/vitamina c|vit c|ascorb/.test(texto)) {
    return crear(
      'Suplemento de vitamina C, nutriente antioxidante que participa en la formación de colágeno.',
      [
        'Contribuye al funcionamiento normal del sistema inmune.',
        'Participa en la formación normal de colágeno.',
        'Ayuda a proteger las células frente al daño oxidativo.',
        'Mejora la absorción del hierro de origen vegetal.',
        'Complementa dietas con baja ingesta de frutas y verduras.'
      ]
    );
  }

  if (/magnesio|zma|zinc/.test(texto)) {
    return crear(
      'Complemento mineral pensado para reforzar la ingesta de micronutrientes esenciales de la alimentación.',
      [
        'El magnesio participa en la función muscular normal.',
        'Contribuye al metabolismo normal de la energía.',
        'Participa en el funcionamiento del sistema nervioso.',
        'Puede complementar dietas con ingesta mineral insuficiente.',
        'Su utilidad depende del mineral y de la cantidad por porción.'
      ]
    );
  }

  if (/ashwagandha/.test(texto)) {
    return crear(
      'Extracto vegetal adaptógeno utilizado para acompañar la respuesta del organismo frente al estrés cotidiano.',
      [
        'Puede acompañar el manejo del estrés cotidiano.',
        'Puede favorecer la calidad del descanso en algunas personas.',
        'Se utiliza como apoyo del bienestar general.',
        'Su efecto depende de la concentración y estandarización.',
        'No reemplaza el tratamiento indicado por un profesional.'
      ]
    );
  }

  if (/colag|collagen|glucosamin|condroitin|flexo/.test(texto)) {
    return crear(
      /hialuron/.test(texto)
        ? 'Fórmula de colágeno con ácido hialurónico para complementar nutrientes de tejidos estructurales.'
        : 'Suplemento de colágeno que aporta aminoácidos presentes en piel, tendones y cartílagos.',
      [
        'Aporta péptidos y aminoácidos propios del colágeno.',
        'Complementa el cuidado nutricional de articulaciones y tendones.',
        'Contribuye al mantenimiento de la estructura de la piel.',
        'Es fácil de incorporar de manera diaria.',
        'Funciona mejor acompañado de alimentación y actividad adecuadas.'
      ]
    );
  }

  if (/pre work|pre entren|prework|pump|tnt|dynamite|oxido nitrico|nitrico|beta alan/.test(texto)) {
    return crear(
      'Fórmula preentrenamiento diseñada para utilizar antes de una sesión exigente; sus efectos dependen de los ingredientes.',
      [
        'Prepara la rutina con un formato práctico antes de entrenar.',
        'Puede favorecer energía y enfoque según su composición.',
        'Puede acompañar fuerza, potencia o resistencia muscular.',
        'Ayuda a sostener sesiones de mayor exigencia.',
        'Conviene revisar cafeína y dosis antes de consumirlo.'
      ]
    );
  }

  if (/hidrat|electro|hydroplus|isotonic|sport drink|energy gel|maltodextri/.test(texto)) {
    return crear(
      'Fórmula para hidratación deportiva que aporta líquidos, electrolitos o carbohidratos durante la actividad.',
      [
        'Ayuda a reponer líquidos perdidos durante el ejercicio.',
        'Puede aportar minerales eliminados a través del sudor.',
        'Los carbohidratos brindan energía durante esfuerzos prolongados.',
        'Resulta útil en entrenamientos largos o con mucho calor.',
        'Es práctica para preparar y consumir durante la actividad.'
      ]
    );
  }

  if (/thermo|fat burn|quemad|lipo|termogen|black cuts/.test(texto)) {
    return crear(
      'Complemento para etapas de definición; puede incluir estimulantes u otros ingredientes según la fórmula.',
      [
        'Se integra dentro de un plan de alimentación y entrenamiento.',
        'Puede aportar energía si la fórmula contiene estimulantes.',
        'No reemplaza el déficit calórico para reducir grasa corporal.',
        'Es importante respetar la porción indicada en la etiqueta.',
        'Conviene revisar su contenido de cafeína y contraindicaciones.'
      ]
    );
  }

  if (/barra|snack|granola|pancake|cupcake|mani king|vitalgy/.test(texto) || categoria === 'barra') {
    return crear(
      'Alimento listo para consumir, pensado como colación práctica para llevar al trabajo, estudio o entrenamiento.',
      [
        'Resuelve una colación sin necesidad de preparación.',
        'Es fácil de transportar y consumir en cualquier lugar.',
        'Puede aportar proteína, carbohidratos o fibra según la fórmula.',
        'Permite elegir una porción individual controlada.',
        'Conviene revisar ingredientes y valores nutricionales.'
      ]
    );
  }

  if (categoria === 'shaker') {
    return crear('Recipiente reutilizable diseñado para mezclar, transportar y consumir suplementos en polvo.', [
      'Ayuda a disolver proteínas y otros suplementos.',
      'Evita tener que usar una licuadora fuera de casa.',
      'Es práctico para llevar al gimnasio o al trabajo.',
      'Permite preparar la bebida justo antes de consumirla.',
      'Se reutiliza y se limpia después de cada uso.'
    ]);
  }

  if (categoria === 'indumentaria') {
    return crear('Prenda deportiva diseñada para brindar comodidad y libertad de movimiento durante la actividad.', [
      'Acompaña el movimiento durante el entrenamiento.',
      'Resulta cómoda para gimnasio y uso cotidiano.',
      'Permite armar un conjunto deportivo práctico.',
      'Está pensada para uso frecuente.',
      'La elección correcta depende del talle y tipo de actividad.'
    ]);
  }

  if (categoria === 'accesorio') {
    return crear('Accesorio deportivo pensado para sumar comodidad, soporte o practicidad a una rutina de entrenamiento.', [
      'Facilita ejercicios o tareas específicas del entrenamiento.',
      'Puede mejorar la comodidad durante el uso.',
      'Es práctico para sumar al bolso del gimnasio.',
      'Está diseñado para utilizarse de manera frecuente.',
      'Su función exacta depende del tipo de accesorio.'
    ]);
  }

  return crear('Producto pensado para complementar una rutina activa; revisá su composición y porción para conocer su función exacta.', [
    'Ofrece un formato práctico para incorporar a la rutina.',
    'Su utilidad depende de sus ingredientes y cantidades.',
    'Puede acompañar objetivos de nutrición o entrenamiento.',
    'Debe utilizarse según las indicaciones de la etiqueta.',
    'No reemplaza una alimentación equilibrada.'
  ]);
}

function _leerFichasPublicaciones(ss) {
  var hoja = ss.getSheetByName(_HOJA_FICHAS_PUBLICACIONES);
  var fichas = {};
  if (!hoja || hoja.getLastRow() < 2) return fichas;
  var filas = hoja.getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    var sku = String(filas[i][0] || '').trim();
    var marca = String(filas[i][1] || '').trim();
    var nombre = String(filas[i][2] || '').trim();
    if (!nombre) continue;
    var ficha = {
      queEs: _limpiarTextoFicha(filas[i][4], 220),
      beneficios: filas[i].slice(5, 10).map(function(v) { return _limpiarTextoFicha(v, 115); }).filter(Boolean),
      estado: String(filas[i][10] || '').trim()
    };
    fichas[_claveFichaPublicacion(marca, nombre, sku)] = ficha;
    fichas[_claveNombreFichaPublicacion(marca, nombre)] = ficha;
  }
  return fichas;
}

function _aplicarFichasPublicaciones(productos, ss) {
  if (!productos || !productos.length) return productos || [];
  var fichas = _leerFichasPublicaciones(ss || _getSS());
  productos.forEach(function(producto) {
    var automatica = _fichaPublicacionBase(producto);
    var ficha = fichas[_claveFichaPublicacion(producto.marca, producto.nombre, producto.sku || producto.id)] ||
      fichas[_claveNombreFichaPublicacion(producto.marca, producto.nombre)];
    producto.descripcion_publicacion = ficha && ficha.queEs ? ficha.queEs : automatica.queEs;
    producto.beneficios_publicacion = ficha && ficha.beneficios.length ? ficha.beneficios.slice(0, 5) : automatica.beneficios;
    producto.ficha_publicacion_estado = ficha ? ficha.estado : 'BORRADOR AUTOMATICO';
  });
  return productos;
}

function sincronizarFichasPublicaciones(productosBase) {
  var ss = _getSS();
  var productos = Array.isArray(productosBase) ? productosBase : null;
  if (!productos) {
    var catalogo = getCatalogo();
    productos = catalogo && catalogo.productos ? catalogo.productos : [];
  }
  var hoja = ss.getSheetByName(_HOJA_FICHAS_PUBLICACIONES);
  var creada = false;
  if (!hoja) {
    hoja = ss.insertSheet(_HOJA_FICHAS_PUBLICACIONES);
    hoja.getRange(1, 1, 1, _HEADERS_FICHAS_PUBLICACIONES.length).setValues([_HEADERS_FICHAS_PUBLICACIONES]);
    creada = true;
  }

  var headers = hoja.getRange(1, 1, 1, _HEADERS_FICHAS_PUBLICACIONES.length).getValues()[0];
  for (var h = 0; h < _HEADERS_FICHAS_PUBLICACIONES.length; h++) {
    if (String(headers[h] || '').trim() !== _HEADERS_FICHAS_PUBLICACIONES[h]) {
      throw new Error('La hoja ' + _HOJA_FICHAS_PUBLICACIONES + ' tiene encabezados distintos. No se modificó para proteger tus datos.');
    }
  }

  var existentes = _leerFichasPublicaciones(ss);
  var nuevas = [];
  var ahora = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm');
  productos.forEach(function(producto) {
    var claveSku = _claveFichaPublicacion(producto.marca, producto.nombre, producto.sku || producto.id);
    var claveNombre = _claveNombreFichaPublicacion(producto.marca, producto.nombre);
    if (existentes[claveSku] || existentes[claveNombre]) return;
    var ficha = _fichaPublicacionBase(producto);
    nuevas.push([
      String(producto.sku || producto.id || ''), String(producto.marca || ''), String(producto.nombre || ''),
      String(producto.categoria || 'otros'), ficha.queEs,
      ficha.beneficios[0] || '', ficha.beneficios[1] || '', ficha.beneficios[2] || '',
      ficha.beneficios[3] || '', ficha.beneficios[4] || '', 'BORRADOR AUTOMATICO', ahora
    ]);
  });

  if (nuevas.length) {
    hoja.getRange(hoja.getLastRow() + 1, 1, nuevas.length, _HEADERS_FICHAS_PUBLICACIONES.length).setValues(nuevas);
  }

  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, _HEADERS_FICHAS_PUBLICACIONES.length)
    .setFontWeight('bold').setBackground('#f1f3f4').setFontColor('#202124');
  if (hoja.getLastRow() > 1) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, _HEADERS_FICHAS_PUBLICACIONES.length)
      .setWrap(true).setVerticalAlignment('top');
    if (!hoja.getFilter()) hoja.getRange(1, 1, hoja.getLastRow(), _HEADERS_FICHAS_PUBLICACIONES.length).createFilter();
    var validacion = SpreadsheetApp.newDataValidation()
      .requireValueInList(['BORRADOR AUTOMATICO', 'REVISADO'], true).setAllowInvalid(false).build();
    hoja.getRange(2, 11, Math.max(1, hoja.getMaxRows() - 1), 1).setDataValidation(validacion);
  }
  [130, 150, 280, 120, 420, 330, 330, 330, 330, 330, 170, 150].forEach(function(ancho, index) {
    hoja.setColumnWidth(index + 1, ancho);
  });

  return { ok: true, hoja: _HOJA_FICHAS_PUBLICACIONES, creada: creada, agregadas: nuevas.length, totalCatalogo: productos.length };
}

function configurarFichasPublicaciones() {
  return sincronizarFichasPublicaciones();
}
