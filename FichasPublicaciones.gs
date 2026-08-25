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
      // La regla específica describe para qué sirve el producto. La descripción
      // del catálogo se conserva solo como respaldo cuando no existe una regla.
      queEs: _limpiarTextoFicha(queEs || descripcionCatalogo, 220),
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

  if (/beta alan/.test(texto)) {
    return crear(
      'Beta-alanina, aminoácido precursor de la carnosina muscular, sustancia que ayuda a amortiguar la acidez durante esfuerzos intensos.',
      [
        'Ayuda a elevar la carnosina disponible dentro del músculo.',
        'Puede retrasar la fatiga en esfuerzos intensos de uno a varios minutos.',
        'Resulta útil en series largas, intervalos y entrenamientos de alta intensidad.',
        'No reemplaza una proteína: su función principal no es aportar aminoácidos esenciales.',
        'Puede producir hormigueo transitorio, especialmente con porciones altas.'
      ]
    );
  }

  if (/\beaa\b|aminoacidos esenciales/.test(texto)) {
    return crear(
      'Mezcla de aminoácidos esenciales (EAA): reúne los aminoácidos que el cuerpo no fabrica y necesita obtener de la alimentación.',
      [
        'Aporta el conjunto esencial necesario para fabricar nuevas proteínas.',
        'Ofrece un perfil más completo que una fórmula compuesta solo por BCAA.',
        'Puede complementar comidas con poca cantidad o calidad de proteína.',
        'Es una opción práctica alrededor del entrenamiento o entre comidas.',
        'No sustituye una alimentación con suficiente proteína completa.'
      ]
    );
  }

  if (/bcaa|leucina/.test(texto)) {
    return crear(
      'BCAA: combinación específica de tres aminoácidos de cadena ramificada, leucina, isoleucina y valina.',
      [
        'La leucina actúa como una señal vinculada a la síntesis de proteína muscular.',
        'Isoleucina y valina también pueden utilizarse como energía durante el ejercicio.',
        'Se incorpora fácilmente antes, durante o después del entrenamiento.',
        'Se diferencia de los EAA porque contiene tres aminoácidos, no los nueve esenciales.',
        'No reemplaza una proteína completa ni corrige por sí solo una ingesta insuficiente.'
      ]
    );
  }

  if (/arginin|oxido nitrico|nitrico/.test(texto)) {
    return crear(
      'L-arginina, aminoácido que el organismo utiliza como precursor del óxido nítrico, molécula vinculada a la dilatación de los vasos sanguíneos.',
      [
        'Participa en la ruta metabólica que produce óxido nítrico.',
        'Se utiliza en fórmulas orientadas al flujo sanguíneo y la congestión muscular.',
        'Su función es distinta a la de BCAA, EAA o glutamina.',
        'La respuesta sobre el rendimiento puede variar entre personas.',
        'Conviene respetar la porción y consultar si se usan medicamentos cardiovasculares.'
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

  if (/pre work|pre entren|prework|pump|tnt|dynamite/.test(texto)) {
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

  if (/mamushka|3 en 1|tres en uno/.test(texto) && /botella|vaso|quencher|mamushka/.test(texto)) {
    return crear('Set de hidratación con tres recipientes de distinto tamaño que se guardan uno dentro de otro para ocupar menos espacio.', [
      'Incluye tres capacidades para elegir según la bebida o el momento del día.',
      'Los recipientes se encastran entre sí y simplifican el guardado y transporte.',
      'Permite separar agua u otras bebidas en envases independientes.',
      'El vaso grande con asa facilita beber y llevar una mayor cantidad.',
      'Es un set de botellas reutilizables: no licúa ni tritura alimentos.'
    ]);
  }

  if (/mini licuadora|licuadora portatil|portable blender/.test(texto)) {
    return crear('Licuadora portátil con motor integrado, diseñada para preparar batidos y bebidas directamente en su propio vaso.', [
      'Mezcla suplementos en polvo con agua o leche sin usar una licuadora grande.',
      'Puede procesar frutas blandas en porciones adecuadas a su capacidad.',
      'El mismo recipiente permite preparar y beber el batido.',
      'Su formato compacto facilita llevarla al trabajo, gimnasio o viaje.',
      'A diferencia de una botella, incorpora cuchillas y motor; no debe usarse fuera de sus límites.'
    ]);
  }

  if (/mini batidora|batidora a pilas|mezclador electrico/.test(texto)) {
    return crear('Batidor eléctrico compacto para mezclar suplementos en un vaso, sin necesidad de agitar manualmente.', [
      'Ayuda a disolver proteína, leche en polvo y otras mezclas livianas.',
      'Funciona dentro del vaso que ya utilizás y ocupa poco espacio.',
      'Es práctico para cocina, oficina o viajes.',
      'Reduce grumos en preparaciones líquidas sencillas.',
      'No es una licuadora: no está diseñado para cortar fruta, hielo ni alimentos duros.'
    ]);
  }

  if (/shaker/.test(texto) && /compart|doble|gold/.test(texto)) {
    return crear('Shaker con compartimento adicional para transportar por separado el polvo, cápsulas o una segunda preparación.', [
      'Mantiene el suplemento separado del líquido hasta el momento de usarlo.',
      'Evita llevar otro recipiente para la porción de polvo.',
      'Permite preparar el batido justo antes de consumirlo.',
      'Ayuda a organizar suplementos dentro del bolso del gimnasio.',
      'Mezcla por agitación y no necesita motor ni electricidad.'
    ]);
  }

  if (/botella sport|botella deportiva|\bbidon\b|botellon/.test(texto)) {
    return crear('Botella deportiva reutilizable pensada para tener agua o bebida preparada al alcance durante la actividad y el día.', [
      'Facilita controlar y sostener la hidratación cotidiana.',
      'Su formato permite transportarla al gimnasio, trabajo o aire libre.',
      'Reduce la necesidad de comprar botellas descartables.',
      'Permite beber con rapidez durante las pausas del entrenamiento.',
      'Es un recipiente para líquidos: no mezcla ni licúa como un equipo con motor.'
    ]);
  }

  if (/hand grip|ejercitador.*dedos|fortalecedor.*mano/.test(texto)) {
    var esDedos = /dedos/.test(texto);
    return crear(esDedos
      ? 'Ejercitador específico para trabajar apertura, control y resistencia individual de los dedos.'
      : 'Ejercitador de agarre para fortalecer mano y antebrazo mediante repeticiones de cierre contra resistencia.', [
      esDedos ? 'Trabaja la extensión y coordinación de los dedos.' : 'Desarrolla fuerza de agarre para pesas y tareas cotidianas.',
      'Fortalece musculatura de la mano y el antebrazo de forma progresiva.',
      'Permite realizar sesiones cortas en casa, oficina o viaje.',
      /regulable/.test(texto) ? 'La resistencia regulable permite aumentar la dificultad gradualmente.' : 'La dificultad se adapta variando repeticiones y tiempo de trabajo.',
      'Complementa el entrenamiento, pero no reemplaza la rehabilitación indicada.'
    ]);
  }

  if (/banda circular|mini band|banda elastica|power band/.test(texto)) {
    return crear('Banda elástica de resistencia que agrega tensión progresiva a ejercicios de fuerza, activación y movilidad.', [
      'Permite activar glúteos, piernas, hombros u otros grupos según el ejercicio.',
      'La tensión aumenta a medida que la banda se estira.',
      'Sirve para calentamiento, técnica, movilidad y trabajo de fuerza.',
      'Es liviana y fácil de usar en casa, gimnasio o viaje.',
      'El nivel, largo y anclaje determinan qué ejercicios permite realizar.'
    ]);
  }

  if (/strap/.test(texto)) {
    return crear('Correas de agarre que conectan la mano con la barra para reducir cuánto limita el antebrazo en tirones pesados.', [
      'Refuerzan la sujeción en peso muerto, remos y otros ejercicios de tirón.',
      'Permiten concentrar el esfuerzo en espalda o cadena posterior.',
      'Son útiles cuando el agarre se fatiga antes que el músculo objetivo.',
      'Se enrollan alrededor de la barra y ocupan muy poco espacio.',
      'No sustituyen el entrenamiento de agarre ni una técnica segura.'
    ]);
  }

  if (/callera/.test(texto)) {
    return crear('Protector de palma para mejorar el contacto con barras y reducir el roce directo durante el entrenamiento.', [
      'Protege la palma en dominadas, barras y movimientos repetidos.',
      'Reduce fricción, pellizcos y formación excesiva de callos.',
      'Conserva mayor contacto directo que un guante completo.',
      'Es práctica para calistenia, cross training y gimnasio.',
      'Debe ajustarse a la mano sin limitar el cierre del agarre.'
    ]);
  }

  if (/guante/.test(texto)) {
    return crear('Guantes de entrenamiento que cubren la palma para mejorar comodidad y protección al sujetar pesas y máquinas.', [
      'Reducen el roce directo de barras y mancuernas sobre la piel.',
      'Ayudan a mantener un contacto más cómodo durante la rutina.',
      'Protegen la palma en ejercicios repetidos con carga.',
      'Son útiles para musculación, máquinas y entrenamiento general.',
      'El talle correcto evita pliegues y pérdida de sensibilidad.'
    ]);
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
      estado: String(filas[i][10] || '').trim(),
      fila: i + 1
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
    var revisada = ficha && _normalizarTextoFicha(ficha.estado) === 'revisado';
    producto.descripcion_publicacion = revisada && ficha.queEs ? ficha.queEs : automatica.queEs;
    producto.beneficios_publicacion = revisada && ficha.beneficios.length ? ficha.beneficios.slice(0, 5) : automatica.beneficios;
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
  var actualizadasAutomaticas = 0;
  var filasAutomaticas = hoja.getLastRow() > 1
    ? hoja.getRange(2, 1, hoja.getLastRow() - 1, _HEADERS_FICHAS_PUBLICACIONES.length).getValues()
    : [];
  var ahora = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm');
  productos.forEach(function(producto) {
    var claveSku = _claveFichaPublicacion(producto.marca, producto.nombre, producto.sku || producto.id);
    var claveNombre = _claveNombreFichaPublicacion(producto.marca, producto.nombre);
    var existente = existentes[claveSku] || existentes[claveNombre];
    var ficha = _fichaPublicacionBase(producto);
    if (existente) {
      if (_normalizarTextoFicha(existente.estado) === 'borrador automatico' && existente.fila) {
        filasAutomaticas[existente.fila - 2] = [
          String(producto.sku || producto.id || ''), String(producto.marca || ''), String(producto.nombre || ''),
          String(producto.categoria || 'otros'), ficha.queEs,
          ficha.beneficios[0] || '', ficha.beneficios[1] || '', ficha.beneficios[2] || '',
          ficha.beneficios[3] || '', ficha.beneficios[4] || '', 'BORRADOR AUTOMATICO', ahora
        ];
        actualizadasAutomaticas++;
      }
      return;
    }
    nuevas.push([
      String(producto.sku || producto.id || ''), String(producto.marca || ''), String(producto.nombre || ''),
      String(producto.categoria || 'otros'), ficha.queEs,
      ficha.beneficios[0] || '', ficha.beneficios[1] || '', ficha.beneficios[2] || '',
      ficha.beneficios[3] || '', ficha.beneficios[4] || '', 'BORRADOR AUTOMATICO', ahora
    ]);
  });

  if (actualizadasAutomaticas && filasAutomaticas.length) {
    hoja.getRange(2, 1, filasAutomaticas.length, _HEADERS_FICHAS_PUBLICACIONES.length).setValues(filasAutomaticas);
  }

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

  return { ok: true, hoja: _HOJA_FICHAS_PUBLICACIONES, creada: creada, agregadas: nuevas.length,
    actualizadasAutomaticas: actualizadasAutomaticas, totalCatalogo: productos.length };
}

function configurarFichasPublicaciones() {
  return sincronizarFichasPublicaciones();
}

