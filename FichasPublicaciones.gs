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

// Los flyers son piezas promocionales: muestran únicamente ventajas claras.
// Advertencias, comparaciones de etiqueta e instrucciones quedan reservadas
// para la atención personalizada y nunca se usan como uno de los cinco puntos.
function _esBeneficioPromocionalFicha(value) {
  var texto = _normalizarTextoFicha(value);
  if (!texto) return false;
  return !(
    /^(no|evita|evitar|revisa|revisar|compara|comparar|consulta|consultar|respeta|respetar|conviene|debe|la eleccion|su utilidad depende|su funcion exacta depende|se diferencia|su funcion es distinta|suma la cafeina|conta su cafeina)\b/.test(texto) ||
    /\b(anticoagul|cirugia programada|medicacion|contraindic|interaccion|efecto advers|puede causar|dosis altas|alergia|embarazo|arritmia|prohibido|prohibida|regulacion sanitaria|suprimir hormonas|afectar fertilidad|riesgo cardiovascular|dano hepatico)\b/.test(texto) ||
    /\b(no reemplaza|no equivale|no significa|no esta demostrado|no esta probado|no funciona|no garantiza|resultados mixtos|resultados variables|evidencia limitada|depende de|debe utilizarse|debe evitarse|conviene revisar)\b/.test(texto)
  );
}

function _beneficiosRespaldoFicha(categoria, texto) {
  var categoriaNormalizada = _normalizarTextoFicha(categoria);
  if (categoriaNormalizada === 'vitamin') categoriaNormalizada = 'vitamina';
  if (categoriaNormalizada === 'amino') categoriaNormalizada = 'aminoacido';
  if (categoriaNormalizada === 'accessory' || categoriaNormalizada === 'accesorios') categoriaNormalizada = 'accesorio';
  if (categoriaNormalizada === 'fatburner' || categoriaNormalizada === 'quemadores') categoriaNormalizada = 'quemador';
  var porCategoria = {
    proteina: [
      'Ayuda a completar el aporte diario de proteína.',
      'Aporta aminoácidos para mantener y reparar el músculo.',
      'Acompaña la recuperación después del entrenamiento.',
      'Contribuye al mantenimiento de la masa muscular.',
      'Puede aportar saciedad en una colación práctica.'
    ],
    aminoacido: [
      'Aporta aminoácidos en un formato práctico para el entrenamiento.',
      'Acompaña la recuperación en etapas de mayor exigencia.',
      'Contribuye al metabolismo y mantenimiento muscular.',
      'Facilita complementar la nutrición alrededor de la actividad.',
      'Se integra fácilmente a una rutina deportiva.'
    ],
    preworkout: [
      'Aumenta la energía y la predisposición para entrenar.',
      'Favorece el enfoque durante sesiones exigentes.',
      'Ayuda a reducir la percepción de esfuerzo.',
      'Acompaña el rendimiento en trabajos intensos.',
      'Ofrece varios ingredientes de preentreno en una sola toma.'
    ],
    vitamina: [
      'Ayuda a cubrir necesidades diarias de micronutrientes.',
      'Contribuye al metabolismo energético normal.',
      'Acompaña el funcionamiento normal del sistema inmune.',
      'Participa en funciones celulares esenciales.',
      'Ofrece una forma práctica de complementar la alimentación.'
    ],
    colageno: [
      'Aporta péptidos y aminoácidos propios del tejido conectivo.',
      'Acompaña el cuidado de la piel.',
      'Contribuye al mantenimiento de tendones y articulaciones.',
      'Puede acompañar la comodidad articular con uso sostenido.',
      'Es fácil de incorporar a la rutina diaria.'
    ],
    quemador: [
      'Acompaña la energía y el enfoque durante la actividad.',
      'Puede favorecer una mayor intensidad de entrenamiento.',
      'Reúne ingredientes orientados al metabolismo energético.',
      'Complementa objetivos de composición corporal.',
      'Ofrece una presentación práctica para la rutina diaria.'
    ],
    barra: [
      'Ofrece una colación práctica y fácil de transportar.',
      'Ayuda a sumar nutrientes entre comidas.',
      'Es útil antes o después de la actividad.',
      'Facilita sostener una rutina fuera de casa.',
      'Aporta una alternativa lista para consumir.'
    ],
    accesorio: [
      'Facilita la preparación o el traslado durante la rutina.',
      'Aporta comodidad en el gimnasio y fuera de casa.',
      'Es reutilizable y fácil de incorporar al uso diario.',
      'Ayuda a organizar mejor los elementos de entrenamiento.',
      'Ofrece una solución práctica para personas activas.'
    ]
  };
  if (/creatin/.test(texto)) return [
    'Aumenta la energía rápida disponible para esfuerzos intensos.',
    'Puede mejorar fuerza y potencia con entrenamiento.',
    'Ayuda a repetir series de alta intensidad.',
    'Acompaña la ganancia de masa magra.',
    'Favorece una mayor hidratación dentro del músculo.'
  ];
  return porCategoria[categoriaNormalizada] || [
    'Ofrece un formato práctico para sumar a la rutina.',
    'Acompaña objetivos de nutrición o entrenamiento.',
    'Facilita un uso frecuente y sencillo.',
    'Complementa una rutina activa.',
    'Aporta una ventaja concreta según su función.'
  ];
}

function _soloBeneficiosPromocionalesFicha(beneficios, categoria, texto, respaldoExtra) {
  var resultado = [];
  var vistos = {};
  function agregar(item) {
    var limpio = _limpiarTextoFicha(item, 115);
    var clave = _normalizarTextoFicha(limpio);
    if (!clave || vistos[clave] || !_esBeneficioPromocionalFicha(limpio)) return;
    vistos[clave] = true;
    resultado.push(limpio);
  }
  (beneficios || []).forEach(agregar);
  (respaldoExtra || []).forEach(agregar);
  _beneficiosRespaldoFicha(categoria, texto).forEach(agregar);
  return resultado.slice(0, 5);
}

// Fichas específicas por ingrediente, forma química o fórmula declarada.
// Las frases describen funciones nutricionales y distinguen nivel de evidencia;
// no convierten un suplemento en tratamiento médico ni prometen resultados.
function _fichaSuplementoPuntual(texto, nombre, categoria, crear) {
  if (/citrato.*magnesio|magnesio.*citrato/.test(texto)) {
    return crear(
      'Magnesio unido a ácido cítrico: una forma soluble que aporta magnesio y que, según la dosis, también puede atraer agua al intestino.',
      [
        'Participa en la contracción y relajación muscular y en la función nerviosa normal.',
        'Puede acompañar la relajación y el descanso si la ingesta de magnesio es insuficiente.',
        'Puede ayudar cuando los calambres se relacionan con una ingesta baja de magnesio.',
        'El citrato se usa también para favorecer el tránsito ante estreñimiento ocasional.',
        'Contribuye al metabolismo energético y al mantenimiento normal de los huesos.'
      ]
    );
  }

  if (/bisglicinato.*magnesio|glicinato.*magnesio|magnesio.*bisglicinato|magnesio.*glicinato/.test(texto)) {
    return crear(
      'Magnesio unido a glicina, una forma quelada elegida por su buena tolerancia digestiva y por no buscar un efecto laxante marcado.',
      [
        'Participa en la contracción y relajación muscular y en la función nerviosa normal.',
        'Contribuye al metabolismo energético cuando la ingesta de magnesio es adecuada.',
        'Puede acompañar relajación y descanso si existía una ingesta insuficiente.',
        'Suele elegirse cuando se busca magnesio con menor efecto intestinal que el citrato.',
        'Su forma quelada favorece una buena tolerancia digestiva en el uso diario.'
      ]
    );
  }

  if (/carbonato.*magnesio|magnesio.*carbonato/.test(texto)) {
    return crear(
      'Carbonato de magnesio en polvo: fuente mineral concentrada cuya absorción y tolerancia dependen de la dosis y del uso indicado.',
      [
        'Aporta magnesio para la función normal de músculos y sistema nervioso.',
        'Participa en el metabolismo energético y en el mantenimiento normal de los huesos.',
        'Contribuye al equilibrio de electrolitos del organismo.',
        'Participa en la síntesis normal de proteínas.',
        'Ofrece una fuente concentrada de magnesio en polvo.'
      ]
    );
  }

  if (/\bzma\b|zma b/.test(texto)) {
    return crear(
      'Combinación de zinc, magnesio y vitamina B6 para complementar tres micronutrientes vinculados con metabolismo y función muscular.',
      [
        'El magnesio participa en función muscular, nerviosa y metabolismo energético.',
        'El zinc contribuye a la función inmune y a la síntesis normal de proteínas.',
        'La vitamina B6 participa en el metabolismo de proteínas y glucógeno.',
        'Reúne nutrientes que acompañan recuperación y descanso nocturno.',
        'Contribuye a reducir cansancio y fatiga cuando ayuda a cubrir necesidades nutricionales.'
      ]
    );
  }

  if (/omega 3.*omega 6.*9|omega 3 con omega 6 y 9|omega 3 6 9/.test(texto)) {
    return crear(
      'Mezcla de omega 3, 6 y 9: combina grasas distintas; su valor depende de la cantidad real de EPA, DHA y cada aceite por porción.',
      [
        'El omega 3 aporta grasas que acompañan la función cardiovascular normal.',
        'El DHA forma parte de las membranas del cerebro y la retina.',
        'El omega 6 aporta ácidos grasos esenciales para membranas y piel.',
        'El omega 9 suma grasas monoinsaturadas a la alimentación diaria.',
        'Combina distintas grasas útiles para completar una alimentación variada.'
      ]
    );
  }

  if (/omega 3|fish oil|aceite de pescado/.test(texto)) {
    return crear(
      'Aceite de pescado que aporta omega 3; la información decisiva es cuántos miligramos de EPA y DHA contiene cada porción.',
      [
        'EPA y DHA ayudan a cubrir una dieta con poco pescado graso.',
        'EPA y DHA participan en el funcionamiento cardiovascular normal.',
        'El DHA forma parte de membranas del cerebro y de la retina.',
        'Los omega 3 forman parte de las membranas de las células.',
        'Aporta grasas poliinsaturadas importantes para funciones celulares.'
      ]
    );
  }

  if (/ashwagandha/.test(texto)) {
    return crear(
      'Ashwagandha con vitamina C: extracto vegetal estudiado para estrés y sueño, combinado con una vitamina antioxidante.',
      [
        'Puede ayudar a reducir la sensación de estrés cotidiano.',
        'Puede acompañar una mejor calidad de descanso.',
        'La vitamina C participa en inmunidad, antioxidación y formación normal de colágeno.',
        'Acompaña la relajación y el bienestar general.',
        'Puede favorecer concentración y equilibrio durante etapas exigentes.'
      ]
    );
  }

  if (/biotina/.test(texto)) {
    return crear(
      'Biotina con vitamina C: combina una vitamina B del metabolismo con vitamina C, necesaria para formar colágeno y absorber hierro vegetal.',
      [
        'La biotina participa en el metabolismo de grasas, carbohidratos y aminoácidos.',
        'La vitamina C interviene en la formación normal de colágeno y la función inmune.',
        'La biotina contribuye al mantenimiento normal del cabello y la piel.',
        'La biotina acompaña el mantenimiento normal de las uñas.',
        'La vitamina C aporta acción antioxidante frente al estrés oxidativo.'
      ]
    );
  }

  if (/astaxantina/.test(texto)) {
    return crear(
      'Astaxantina: carotenoide rojizo y liposoluble con actividad antioxidante.',
      [
        'Actúa como carotenoide antioxidante dentro de membranas y tejidos grasos.',
        'Ayuda a proteger las células frente al estrés oxidativo.',
        'Acompaña el cuidado de la piel desde la nutrición.',
        'Puede apoyar la recuperación frente al esfuerzo físico.',
        'Su afinidad por tejidos grasos amplía su acción antioxidante en el organismo.'
      ]
    );
  }

  if (/nad.*resveratrol|resveratrol.*nad/.test(texto)) {
    return crear(
      'Fórmula que combina resveratrol con un ingrediente orientado al metabolismo de NAD+; la forma química y la dosis determinan su utilidad real.',
      [
        'El resveratrol es un polifenol estudiado por su actividad antioxidante.',
        'El NAD+ participa en reacciones celulares de obtención y transferencia de energía.',
        'Acompaña el metabolismo energético dentro de las células.',
        'Contribuye a proteger las células frente al estrés oxidativo.',
        'Reúne soporte antioxidante y metabólico en una sola fórmula.'
      ]
    );
  }

  if (/resveratrol/.test(texto)) {
    return crear(
      'Resveratrol: polifenol presente en uvas y otras plantas, investigado por su actividad antioxidante y metabólica.',
      [
        'Aporta acción antioxidante frente al estrés oxidativo celular.',
        'Acompaña el cuidado cardiovascular dentro de un estilo de vida saludable.',
        'Puede favorecer el equilibrio metabólico del organismo.',
        'Contribuye a proteger lípidos y tejidos frente a la oxidación.',
        'Suma polifenoles vegetales en un formato concentrado.'
      ]
    );
  }

  if (/multivitamin|vitamin gold|enaccion|live fem/.test(texto)) {
    return crear(
      'Multivitamínico y mineral para cubrir brechas de micronutrientes; la fórmula y las cantidades cambian entre productos.',
      [
        'Puede ayudar a alcanzar recomendaciones cuando la alimentación no cubre algún nutriente.',
        'Las vitaminas B participan en el metabolismo energético.',
        'Vitaminas y minerales acompañan la función normal del sistema inmune.',
        'Puede aportar nutrientes vinculados con huesos, músculos y formación de sangre.',
        'Reúne varios micronutrientes en una sola toma práctica.'
      ]
    );
  }

  if (/vitamina c|vit c|ascorb/.test(texto)) {
    return crear(
      'Vitamina C o ácido ascórbico: vitamina hidrosoluble necesaria para formar colágeno, absorber hierro vegetal y apoyar la función inmune.',
      [
        'Participa en la síntesis normal de colágeno de piel, tendones y otros tejidos.',
        'Mejora la absorción del hierro no hemo presente en alimentos vegetales.',
        'Actúa como antioxidante y contribuye al funcionamiento normal del sistema inmune.',
        'Contribuye a proteger las células frente al estrés oxidativo.',
        'Acompaña la cicatrización y el mantenimiento normal de los tejidos.'
      ]
    );
  }

  if (/cafeina/.test(texto) && categoria === 'vitamin') {
    var dosis = (nombre.match(/\b\d{2,3}\s*mg\b/i) || [])[0] || '';
    return crear(
      'Cafeína' + (dosis ? ' de ' + dosis : '') + ': estimulante del sistema nervioso que aumenta alerta y reduce temporalmente la percepción de esfuerzo.',
      [
        'Aumenta el estado de alerta y la concentración.',
        'Ayuda a reducir la percepción de esfuerzo durante el ejercicio.',
        'Puede mejorar el rendimiento en actividades de resistencia.',
        'Acompaña esfuerzos intermitentes y sesiones deportivas exigentes.',
        'Ofrece energía estimulante en un formato práctico y medido.'
      ]
    );
  }

  if (/creatina.*gomita|gomita.*creatina/.test(texto)) {
    return crear(
      'Creatina en gomitas: formato masticable cuya eficacia depende de alcanzar la cantidad diaria de creatina indicada en la etiqueta.',
      [
        'La creatina ayuda a regenerar ATP en esfuerzos breves, intensos y repetidos.',
        'Puede mejorar fuerza, potencia y capacidad de repetir series con entrenamiento.',
        'Acompaña la ganancia de masa magra junto con entrenamiento de fuerza.',
        'Su formato masticable facilita mantener una rutina diaria.',
        'Favorece una mayor hidratación dentro del músculo.'
      ]
    );
  }

  if (/creapure/.test(texto)) {
    return crear(
      'Creatina monohidrato Creapure®, materia prima con controles específicos de identidad, pureza y trazabilidad.',
      [
        'Aumenta la disponibilidad de energía rápida para esfuerzos intensos y repetidos.',
        'Puede mejorar fuerza, potencia y capacidad de entrenamiento con uso diario.',
        'Acompaña ganancias de masa magra junto con entrenamiento de fuerza.',
        'Creapure® describe la materia prima; la función sigue siendo creatina monohidrato.',
        'Puede aumentar algo el peso por mayor agua dentro del músculo.'
      ]
    );
  }

  if (/creatin/.test(texto)) {
    return crear(
      'Creatina monohidrato, la forma más estudiada para aumentar fosfocreatina y regenerar energía rápida dentro del músculo.',
      [
        'Mejora sobre todo esfuerzos breves, intensos y repetidos, como series o sprints.',
        'Puede aumentar fuerza y potencia cuando se combina con entrenamiento adecuado.',
        'Ayuda a realizar más trabajo total y acompaña la ganancia de masa magra.',
        'Acelera la reposición de energía entre esfuerzos repetidos.',
        'Favorece una mayor hidratación dentro del músculo.'
      ]
    );
  }

  if (/vegetal.*protein|protein.*vegetal/.test(texto)) {
    return crear(
      'Proteína vegetal aislada: alternativa sin proteína láctea; su perfil de aminoácidos depende de la fuente o mezcla utilizada.',
      [
        'Ayuda a completar la proteína diaria en dietas vegetales o sin lácteos.',
        'Aporta aminoácidos para mantener y reparar tejido muscular.',
        'La mezcla de fuentes puede mejorar el perfil de aminoácidos esenciales.',
        'Acompaña la recuperación después del entrenamiento.',
        'Puede aportar saciedad y servir como colación o postentreno.'
      ]
    );
  }

  if (/isolate|iso gold|aislad/.test(texto) && /protein|proteina|whey/.test(texto)) {
    return crear(
      'Proteína aislada: fuente completa y concentrada, generalmente con menos lactosa, carbohidratos y grasa que un concentrado.',
      [
        'Aporta los nueve aminoácidos esenciales y una cantidad alta de leucina.',
        'Ayuda a alcanzar la proteína diaria y reparar el músculo después del entrenamiento.',
        'Suele elegirse cuando se busca más proteína por porción o menor contenido de lactosa.',
        'Acompaña fuerza y masa muscular junto con entrenamiento y calorías adecuadas.',
        'Su bajo contenido de lactosa puede favorecer una mejor tolerancia digestiva.'
      ]
    );
  }

  if (/proteina.*colag|protein.*collagen|fit.*colag/.test(texto)) {
    return crear(
      'Fórmula mixta de proteína y colágeno: combina aminoácidos musculares con péptidos del tejido conectivo.',
      [
        'La fuente proteica completa ayuda a cubrir aminoácidos esenciales para el músculo.',
        'El colágeno aporta sobre todo glicina, prolina e hidroxiprolina.',
        'Combina soporte muscular con aminoácidos del tejido conectivo.',
        'Puede aportar saciedad y funcionar como colación práctica.',
        'Es una opción práctica para recuperación y cuidado estructural.'
      ]
    );
  }

  if (/whey|protein shake|proteina 7900|bio prot|best whey|proteina|protein/.test(texto) && categoria === 'proteina') {
    return crear(
      /blend/.test(texto)
        ? 'Blend proteico: combina dos o más fuentes o fracciones de proteína para aportar un perfil amplio de aminoácidos.'
        : 'Proteína de suero o fórmula proteica completa para sumar aminoácidos esenciales de forma práctica.',
      [
        'Ayuda a alcanzar la cantidad diaria de proteína necesaria para mantener músculo.',
        'Aporta aminoácidos esenciales, incluida leucina, para la síntesis de proteína muscular.',
        'Es útil después de entrenar o en comidas que quedan cortas de proteína.',
        'Puede aumentar la saciedad dentro de un plan alimentario.',
        'Ofrece una forma rápida y cómoda de sumar proteína de calidad.'
      ]
    );
  }

  if (/glutamin/.test(texto)) {
    return crear(
      'L-glutamina, aminoácido abundante en el cuerpo y combustible para células intestinales e inmunes; no es una proteína completa.',
      [
        'Complementa la ingesta de glutamina en períodos de alta demanda o dietas específicas.',
        'Participa en transporte de nitrógeno y equilibrio ácido-base del organismo.',
        'Es utilizada como combustible por células del intestino y del sistema inmune.',
        'Acompaña el mantenimiento de la barrera intestinal.',
        'Puede apoyar la recuperación durante períodos de gran exigencia física.'
      ]
    );
  }

  if (/\bhmb\b/.test(texto)) {
    return crear(
      'HMB, metabolito de la leucina investigado por su papel en el recambio de proteína y la integridad de células musculares sometidas a estrés.',
      [
        'Puede ayudar a limitar degradación muscular en contextos de entrenamiento exigente.',
        'Podría favorecer recuperación cuando el ejercicio produce daño muscular suficiente.',
        'La evidencia es más útil en principiantes, reinicios o períodos de alta carga.',
        'Acompaña el mantenimiento muscular durante pausas o menor actividad.',
        'Puede complementar objetivos de fuerza y masa en etapas de entrenamiento intenso.'
      ]
    );
  }

  if (/\beaa\b|aminoacidos esenciales/.test(texto)) {
    return crear(
      'EAA: mezcla de los nueve aminoácidos esenciales que el cuerpo no fabrica y necesita para construir nuevas proteínas.',
      [
        'Aporta el conjunto completo de aminoácidos esenciales para síntesis proteica.',
        'Es más completo que BCAA, que aporta solamente leucina, isoleucina y valina.',
        'Puede complementar comidas con poca proteína o proteína vegetal incompleta.',
        'Es práctico para sumar aminoácidos alrededor del entrenamiento.',
        'Aporta leucina, señal clave para iniciar la síntesis de proteína muscular.'
      ]
    );
  }

  if (/bcaa|mtor bcaa/.test(texto)) {
    return crear(
      'BCAA: leucina, isoleucina y valina; son tres aminoácidos esenciales, no el conjunto completo que aporta una proteína o un EAA.',
      [
        'La leucina participa como señal en el inicio de la síntesis de proteína muscular.',
        'Isoleucina y valina también pueden utilizarse como energía durante el ejercicio.',
        'Puede ser práctico si entrenás sin una comida proteica cercana.',
        'Acompaña la recuperación después de sesiones exigentes.',
        'Su formato en polvo permite incorporarlos fácilmente a la hidratación deportiva.'
      ]
    );
  }

  if (/carnitin/.test(texto)) {
    return crear(
      'L-carnitina, compuesto que transporta ácidos grasos hacia las mitocondrias; el cuerpo sano también la fabrica por sí mismo.',
      [
        'Participa en el uso celular de ácidos grasos como combustible.',
        'Contribuye al metabolismo energético dentro de las mitocondrias.',
        'Puede acompañar la recuperación después del ejercicio.',
        'Apoya la utilización normal de grasas para producir energía.',
        'Ofrece una forma práctica de complementar la ingesta de carnitina.'
      ]
    );
  }

  if (/beta alan/.test(texto)) {
    return crear(
      'Beta-alanina, precursor de carnosina muscular: ayuda a amortiguar la caída de pH durante esfuerzos intensos sostenidos.',
      [
        'Eleva gradualmente la carnosina disponible dentro del músculo.',
        'Puede ser útil en esfuerzos intensos de aproximadamente uno a cuatro minutos.',
        'Ayuda a amortiguar la acidez producida durante series exigentes.',
        'Puede retrasar la fatiga en intervalos y trabajos de alta intensidad.',
        'Acompaña una mayor capacidad de entrenamiento con uso sostenido.'
      ]
    );
  }

  if (/nox 3000|n o gold|oxido nitrico classic/.test(texto)) {
    return crear(
      'Fórmula sin estimulante principal orientada a óxido nítrico, basada en arginina y/o citrulina según el producto.',
      [
        'Arginina y citrulina son precursores de la ruta que produce óxido nítrico.',
        'La citrulina suele elevar arginina en sangre con mayor eficiencia que arginina oral.',
        'Puede favorecer una mayor sensación de bombeo muscular.',
        'Acompaña el flujo de sangre, oxígeno y nutrientes hacia el músculo.',
        'Permite trabajar el bombeo sin depender de un estimulante central.'
      ]
    );
  }

  if (/pre work gold|pre work 240|pump v8|tnt dynamite/.test(texto)) {
    var detallePre = /pump v8/.test(texto)
      ? 'Pump V8 combina cafeína y guaraná con beta-alanina, citrulina, arginina, betaína, taurina y tirosina.'
      : (/tnt dynamite/.test(texto)
        ? 'TNT Dynamite combina cafeína, beta-alanina, creatina nitrato, arginina, taurina y tirosina.'
        : (/pre work gold/.test(texto)
          ? 'Pre Work Gold combina 176 mg de cafeína con creatina, beta-alanina, taurina, citrulina y arginina.'
          : 'Pre Work Nutremax combina creatina, beta-alanina, citrulina, arginina, taurina, cafeína y vitaminas.'));
    return crear(detallePre, [
      'La cafeína aumenta alerta y puede reducir la percepción de esfuerzo durante la sesión.',
      'Beta-alanina y creatina acompañan trabajos intensos y repetidos.',
      'Citrulina y arginina favorecen el flujo sanguíneo y el bombeo muscular.',
      'Taurina y tirosina acompañan enfoque y rendimiento durante la sesión.',
      'Reúne energía, concentración y soporte muscular en una sola preparación.'
    ]);
  }

  if (/energy gel/.test(texto)) {
    return crear(
      'Gel de carbohidratos para consumir durante esfuerzos prolongados; las versiones limón y frutilla/naranja declaradas no aportan cafeína.',
      [
        'Aporta cerca de 30 g de carbohidratos y 120 kcal por sachet según la fórmula declarada.',
        'Combina carbohidratos de distinta velocidad para sostener energía durante el ejercicio.',
        'Incluye sodio para acompañar la reposición de electrolitos.',
        'Es ideal para sesiones largas, carreras y ciclismo.',
        'Su sachet portátil facilita consumir energía durante la actividad.'
      ]
    );
  }

  if (/recovery drink/.test(texto)) {
    return crear(
      'Bebida postentreno con carbohidratos, whey, electrolitos, glutamina, creatina y aminoácidos para recuperar energía y sumar proteína.',
      [
        'Los carbohidratos ayudan a reponer glucógeno después de un esfuerzo largo o doble turno.',
        'La proteína de suero aporta aminoácidos esenciales para la reparación muscular.',
        'Sodio y potasio ayudan a reponer parte de los electrolitos perdidos por sudor.',
        'Creatina y aminoácidos acompañan la recuperación y el rendimiento muscular.',
        'Reúne energía, proteína y electrolitos en una sola preparación postentreno.'
      ]
    );
  }

  if (/hydroplus endurance/.test(texto)) {
    return crear(
      'Bebida de endurance con maltodextrina, dextrosa y fructosa, más sodio, potasio, magnesio, calcio y BCAA.',
      [
        'Aporta carbohidratos de distintas fuentes para sostener esfuerzos prolongados.',
        'Sodio y potasio ayudan a reponer electrolitos eliminados con la transpiración.',
        'Se prepara como bebida, por lo que combina combustible e hidratación en una toma.',
        'Acompaña carrera, ciclismo y sesiones de larga duración.',
        'La combinación de azúcares favorece una absorción amplia de carbohidratos.'
      ]
    );
  }

  if (/maltodextrina fructosa/.test(texto)) {
    return crear(
      'Mezcla neutra de maltodextrina y fructosa: dos fuentes de carbohidratos para aportar combustible durante actividad prolongada.',
      [
        'La maltodextrina aporta glucosa disponible para el músculo durante el esfuerzo.',
        'La fructosa usa otra vía intestinal y puede aumentar la absorción total de carbohidratos.',
        'Es útil en endurance y sesiones largas, especialmente al superar una hora.',
        'El sabor neutro permite sumarla a agua o bebida deportiva.',
        'Permite ajustar fácilmente la cantidad de combustible a cada sesión.'
      ]
    );
  }

  if (/isoton|sport drink|hydromax/.test(texto)) {
    return crear(
      'Bebida deportiva con carbohidratos y electrolitos para reponer combustible y minerales durante sudoración o ejercicio prolongado.',
      [
        'Aporta líquido y sodio para sostener hidratación cuando hay transpiración abundante.',
        'Los carbohidratos ayudan a mantener energía en actividad prolongada.',
        'Potasio y otros minerales complementan las pérdidas del sudor según la fórmula.',
        'Es ideal para entrenamientos con calor o sesiones prolongadas.',
        'Ofrece hidratación, energía y electrolitos en una sola bebida.'
      ]
    );
  }

  if (/flexo drink|colageno.*hialuron|colageno \+ hialuron/.test(texto)) {
    return crear(
      /flexo drink/.test(texto)
        ? 'Flexo Drink aporta 10 g de colágeno hidrolizado, 50 mg de ácido hialurónico, vitamina C, D3, B6, calcio y magnesio.'
        : 'Colágeno hidrolizado con ácido hialurónico, fórmula orientada a tejido conectivo y cuidado de la piel.',
      [
        'El colágeno aporta péptidos ricos en glicina, prolina e hidroxiprolina.',
        'La vitamina C es necesaria para que el cuerpo forme su propio colágeno.',
        'El ácido hialurónico se diferencia del colágeno y forma parte de piel y articulaciones.',
        'Puede acompañar la hidratación y elasticidad de la piel.',
        'Puede favorecer la comodidad articular con uso sostenido.'
      ]
    );
  }

  if (/collagen sport/.test(texto) && /star nutrition/.test(texto)) {
    return crear(
      'Collagen Sport Star: 10 g de colágeno, 1000 mg de vitamina C, 80 mg de magnesio y 200 mg de cafeína por porción.',
      [
        'El colágeno aporta péptidos del tejido conectivo y la vitamina C participa en su formación.',
        'El magnesio participa en función muscular y metabolismo energético normal.',
        'Los 200 mg de cafeína aumentan alerta y predisposición para entrenar.',
        'Acompaña el cuidado de piel, tendones y articulaciones.',
        'Combina soporte estructural, función muscular y energía en una sola fórmula.'
      ]
    );
  }

  if (/colag|collagen/.test(texto) && categoria === 'colageno') {
    return crear(
      /sport/.test(texto)
        ? 'Colágeno hidrolizado orientado a personas activas y al cuidado de tejidos sometidos al entrenamiento.'
        : 'Colágeno hidrolizado: péptidos ricos en aminoácidos característicos de piel, tendones y cartílagos.',
      [
        'Aporta glicina, prolina e hidroxiprolina, distintas del perfil de una whey completa.',
        'Algunos estudios muestran mejoras modestas en hidratación o elasticidad de la piel.',
        'Puede ayudar a algunas personas con molestias articulares tras varias semanas.',
        'Acompaña el mantenimiento de tendones y otros tejidos conectivos.',
        'Su formato hidrolizado facilita incorporarlo diariamente.'
      ]
    );
  }

  if (/ultra mass|mutantmass|mutant mass/.test(texto)) {
    return crear(
      'Ganador de peso: mezcla de carbohidratos y proteína diseñada para concentrar muchas calorías en una preparación.',
      [
        'Facilita un superávit calórico cuando cuesta comer suficiente cantidad.',
        'Los carbohidratos aportan combustible y ayudan a recuperar glucógeno.',
        'La proteína aporta aminoácidos para mantener y desarrollar músculo con entrenamiento.',
        'Ayuda a aumentar el peso corporal dentro de un plan de volumen.',
        'Concentra muchas calorías en una preparación rápida y práctica.'
      ]
    );
  }

  if (/\bcla\b|lipolitic cla/.test(texto)) {
    return crear(
      'CLA o ácido linoleico conjugado: tipo de grasa utilizado como complemento en objetivos de composición corporal.',
      [
        'Aporta ácido linoleico conjugado en una presentación concentrada.',
        'Puede acompañar modestamente objetivos de composición corporal.',
        'Se integra a planes orientados al control de grasa corporal.',
        'Su formato sin estimulantes facilita incorporarlo a distintos horarios.',
        'Ofrece una presentación práctica para sostener el uso diario.'
      ]
    );
  }

  if (/tx3 black cuts/.test(texto)) {
    return crear(
      'TX3 Black Cuts combina 850 mg de CLA, 500 mg de L-carnitina y 200 mg de cafeína por porción declarada.',
      [
        'La cafeína aumenta alerta y puede ayudar a entrenar con menor percepción de esfuerzo.',
        'La carnitina participa en el transporte de grasas para producir energía.',
        'El CLA acompaña objetivos de composición corporal.',
        'Puede favorecer una mayor intensidad y enfoque durante el entrenamiento.',
        'Combina energía y soporte metabólico en una sola fórmula.'
      ]
    );
  }

  if (/lipo gold elite/.test(texto)) {
    return crear(
      'Lipo Gold Elite combina taurina, carnitina, tirosina, té verde, guaraná y 20 mg de cafeína por porción declarada.',
      [
        'Cafeína y guaraná pueden aumentar el estado de alerta.',
        'Té verde y cafeína pueden aumentar levemente el gasto energético a corto plazo.',
        'La carnitina participa en el transporte de grasas para producir energía.',
        'Taurina y tirosina acompañan enfoque y rendimiento durante la actividad.',
        'Reúne ingredientes de energía y metabolismo en una sola toma.'
      ]
    );
  }

  if (/ripped fat|thermo fuel|fat burner|hydroxy max night/.test(texto)) {
    return crear(
      'Fórmula con ingredientes orientados a energía, termogénesis y objetivos de composición corporal.',
      [
        'Puede aumentar la energía y el estado de alerta.',
        'Acompaña el gasto energético mediante ingredientes termogénicos.',
        'Puede favorecer el enfoque para sostener entrenamientos exigentes.',
        'Complementa objetivos de control de peso y composición corporal.',
        'Reúne varios ingredientes metabólicos en una presentación práctica.'
      ]
    );
  }

  if (/testo gold/.test(texto)) {
    return crear(
      'Mezcla de vitaminas, minerales y extractos presentada como soporte de vitalidad y función hormonal normal.',
      [
        'El zinc contribuye al mantenimiento de niveles normales de testosterona.',
        'El magnesio participa en función muscular y metabolismo energético.',
        'La vitamina B6 acompaña el metabolismo de proteínas y glucógeno.',
        'Puede ayudar a cubrir micronutrientes vinculados con energía y vitalidad.',
        'Reúne soporte mineral y vegetal en una sola fórmula.'
      ]
    );
  }

  if (/stanozol/.test(texto)) {
    return crear(
      'Stanozolol: esteroide anabólico de uso médico controlado y sustancia prohibida en deporte; no es un suplemento nutricional común.',
      [
        'Puede causar daño hepático y cambios desfavorables en colesterol y riesgo cardiovascular.',
        'Puede suprimir hormonas propias y afectar fertilidad, piel, ánimo y otros órganos.',
        'Está prohibido por la Agencia Mundial Antidopaje en competencia y fuera de ella.',
        'No debe utilizarse para mejorar físico o rendimiento sin indicación y control médico.',
        'La venta o uso requiere cumplir estrictamente la regulación sanitaria aplicable.'
      ]
    );
  }

  if (categoria === 'barra' && /gelatina.*colag/.test(texto)) {
    return crear('Gelatina preparada con colágeno: alimento de postre que suma péptidos de colágeno en un formato distinto al polvo.', [
      'Aporta péptidos de colágeno en un formato diferente y agradable.',
      'Suma glicina, prolina e hidroxiprolina a la alimentación.',
      'Puede resolver un postre práctico dentro del plan alimentario.',
      'Facilita incorporar colágeno a la rutina diaria.',
      'Ofrece una opción lista para consumir y fácil de servir.'
    ]);
  }

  if (categoria === 'barra' && /pancake|cupcake/.test(texto)) {
    return crear('Premezcla proteica para preparar pancakes o cupcakes; combina conveniencia con proteína en una comida cocida.', [
      'Permite preparar una colación con más proteína que una mezcla convencional.',
      'Ayuda a completar el aporte diario de proteína.',
      'Puede servir como desayuno o merienda práctica.',
      'Permite variar sabores y agregados según la preparación.',
      'Simplifica una receta proteica en pocos minutos.'
    ]);
  }

  if (categoria === 'barra' && /barra|protein bar|whey bar/.test(texto)) {
    return crear('Barra proteica lista para comer: colación portátil con proteína, carbohidratos y grasas en cantidades que varían por marca.', [
      'Ayuda a sumar proteína cuando no hay una comida disponible.',
      'Es fácil de transportar y usar antes o después de la actividad.',
      'Puede aumentar la saciedad entre comidas.',
      'Aporta energía y nutrientes en un formato compacto.',
      'Facilita sostener la alimentación cuando estás fuera de casa.'
    ]);
  }

  if (categoria === 'barra' && /granola.*protein/.test(texto)) {
    return crear('Granola proteica: mezcla crocante que suma proteína a cereales, semillas u otros ingredientes energéticos.', [
      'Puede enriquecer yogur, leche o fruta en desayuno y merienda.',
      'Aporta proteína y energía para comenzar o continuar el día.',
      'Puede sumar fibra mediante cereales, semillas y frutos secos.',
      'Su textura crocante ayuda a variar desayunos y colaciones.',
      'Ofrece una alternativa práctica para llevar y servir.'
    ]);
  }

  if (/pasta de mani|manteca de mani|mani king/.test(texto)) {
    return crear('Pasta de maní: alimento concentrado en energía, grasas insaturadas y proteína vegetal.', [
      'Aporta grasas insaturadas y energía en poco volumen.',
      'Suma proteína vegetal a desayunos y colaciones.',
      'Puede aumentar saciedad y servir en desayunos, colaciones o recetas.',
      'Ayuda a aumentar calorías en etapas de volumen.',
      'Es versátil para tostadas, frutas, licuados y preparaciones.'
    ]);
  }

  return null;
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
      beneficios: _soloBeneficiosPromocionalesFicha(beneficios, categoria, texto)
    };
  }

  var puntual = _fichaSuplementoPuntual(texto, nombre, categoria, crear);
  if (puntual) return puntual;

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
        'Ayuda a amortiguar la acidez generada durante trabajos exigentes.',
        'Acompaña una mayor capacidad de entrenamiento con uso sostenido.'
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
        'Aporta leucina para iniciar la síntesis de proteína muscular.'
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
        'Acompaña la recuperación después de sesiones exigentes.',
        'Puede sumarse fácilmente a la hidratación durante el entrenamiento.'
      ]
    );
  }

  if (/arginin|oxido nitrico|nitrico/.test(texto)) {
    return crear(
      'L-arginina, aminoácido que el organismo utiliza como precursor del óxido nítrico, molécula vinculada a la dilatación de los vasos sanguíneos.',
      [
        'Participa en la ruta metabólica que produce óxido nítrico.',
        'Se utiliza en fórmulas orientadas al flujo sanguíneo y la congestión muscular.',
        'Puede favorecer una mayor sensación de bombeo muscular.',
        'Acompaña el transporte de oxígeno y nutrientes hacia el músculo.',
        'Puede complementar el rendimiento en sesiones de gran volumen.'
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
        'Contribuye al metabolismo energético dentro de las células.'
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
        'Favorece el enfoque durante sesiones deportivas exigentes.'
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
        'Acompaña el mantenimiento normal de huesos y proteínas.'
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
        'Acompaña la relajación en períodos de gran exigencia.',
        'Puede favorecer concentración y equilibrio durante el día.'
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
        'Reúne varios ingredientes de preentreno en una sola preparación.'
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
        'Puede favorecer el enfoque durante la actividad.',
        'Acompaña objetivos de composición corporal.',
        'Reúne ingredientes orientados al metabolismo energético.'
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
        'Facilita sostener la alimentación cuando estás fuera de casa.'
      ]
    );
  }

  if (/mamushka|3 en 1|tres en uno/.test(texto) && /botella|vaso|quencher|mamushka/.test(texto)) {
    return crear('Set de hidratación con tres recipientes de distinto tamaño que se guardan uno dentro de otro para ocupar menos espacio.', [
      'Incluye tres capacidades para elegir según la bebida o el momento del día.',
      'Los recipientes se encastran entre sí y simplifican el guardado y transporte.',
      'Permite separar agua u otras bebidas en envases independientes.',
      'El vaso grande con asa facilita beber y llevar una mayor cantidad.',
      'Sus tres tamaños cubren hidratación individual, entrenamiento y uso diario.'
    ]);
  }

  if (/mini licuadora|licuadora portatil|portable blender/.test(texto)) {
    return crear('Licuadora portátil con motor integrado, diseñada para preparar batidos y bebidas directamente en su propio vaso.', [
      'Mezcla suplementos en polvo con agua o leche sin usar una licuadora grande.',
      'Puede procesar frutas blandas en porciones adecuadas a su capacidad.',
      'El mismo recipiente permite preparar y beber el batido.',
      'Su formato compacto facilita llevarla al trabajo, gimnasio o viaje.',
      'Su motor y cuchillas permiten preparar licuados frescos fuera de casa.'
    ]);
  }

  if (/mini batidora|batidora a pilas|mezclador electrico/.test(texto)) {
    return crear('Batidor eléctrico compacto para mezclar suplementos en un vaso, sin necesidad de agitar manualmente.', [
      'Ayuda a disolver proteína, leche en polvo y otras mezclas livianas.',
      'Funciona dentro del vaso que ya utilizás y ocupa poco espacio.',
      'Es práctico para cocina, oficina o viajes.',
      'Reduce grumos en preparaciones líquidas sencillas.',
      'Su tamaño compacto permite guardarlo y transportarlo fácilmente.'
    ]);
  }

  if (/shaker/.test(texto) && /compart|doble|gold/.test(texto)) {
    return crear('Shaker con compartimento adicional para transportar por separado el polvo, cápsulas o una segunda preparación.', [
      'Mantiene el suplemento separado del líquido hasta el momento de usarlo.',
      'Evita llevar otro recipiente para la porción de polvo.',
      'Permite preparar el batido justo antes de consumirlo.',
      'Ayuda a organizar suplementos dentro del bolso del gimnasio.',
      'Mezcla por agitación y funciona en cualquier lugar sin electricidad.'
    ]);
  }

  if (/botella sport|botella deportiva|\bbidon\b|botellon/.test(texto)) {
    return crear('Botella deportiva reutilizable pensada para tener agua o bebida preparada al alcance durante la actividad y el día.', [
      'Facilita controlar y sostener la hidratación cotidiana.',
      'Su formato permite transportarla al gimnasio, trabajo o aire libre.',
      'Reduce la necesidad de comprar botellas descartables.',
      'Permite beber con rapidez durante las pausas del entrenamiento.',
      'Ayuda a tener la bebida preparada y disponible durante todo el día.'
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
      'Acompaña un agarre más firme para pesas, barras y tareas cotidianas.'
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
      'Ayudan a sostener más repeticiones en series pesadas de tirón.'
    ]);
  }

  if (/callera/.test(texto)) {
    return crear('Protector de palma para mejorar el contacto con barras y reducir el roce directo durante el entrenamiento.', [
      'Protege la palma en dominadas, barras y movimientos repetidos.',
      'Reduce fricción, pellizcos y formación excesiva de callos.',
      'Conserva mayor contacto directo que un guante completo.',
      'Es práctica para calistenia, cross training y gimnasio.',
      'Su diseño liviano acompaña un agarre firme y cómodo.'
    ]);
  }

  if (/guante/.test(texto)) {
    return crear('Guantes de entrenamiento que cubren la palma para mejorar comodidad y protección al sujetar pesas y máquinas.', [
      'Reducen el roce directo de barras y mancuernas sobre la piel.',
      'Ayudan a mantener un contacto más cómodo durante la rutina.',
      'Protegen la palma en ejercicios repetidos con carga.',
      'Son útiles para musculación, máquinas y entrenamiento general.',
      'Acompañan un agarre más cómodo durante sesiones prolongadas.'
    ]);
  }

  if (categoria === 'shaker') {
    return crear('Recipiente reutilizable diseñado para mezclar, transportar y consumir suplementos en polvo.', [
      'Ayuda a disolver proteínas y otros suplementos.',
      'Evita tener que usar una licuadora fuera de casa.',
      'Es práctico para llevar al gimnasio o al trabajo.',
      'Permite preparar la bebida justo antes de consumirla.',
      'Es reutilizable y fácil de incorporar a la rutina diaria.'
    ]);
  }

  if (categoria === 'indumentaria') {
    return crear('Prenda deportiva diseñada para brindar comodidad y libertad de movimiento durante la actividad.', [
      'Acompaña el movimiento durante el entrenamiento.',
      'Resulta cómoda para gimnasio y uso cotidiano.',
      'Permite armar un conjunto deportivo práctico.',
      'Está pensada para uso frecuente.',
      'Combina funcionalidad deportiva con un uso cotidiano versátil.'
    ]);
  }

  if (categoria === 'accesorio') {
    return crear('Accesorio deportivo pensado para sumar comodidad, soporte o practicidad a una rutina de entrenamiento.', [
      'Facilita ejercicios o tareas específicas del entrenamiento.',
      'Puede mejorar la comodidad durante el uso.',
      'Es práctico para sumar al bolso del gimnasio.',
      'Está diseñado para utilizarse de manera frecuente.',
      'Aporta una solución funcional para una rutina más organizada.'
    ]);
  }

  return crear('Producto pensado para complementar una rutina activa de manera práctica.', [
    'Ofrece un formato práctico para incorporar a la rutina.',
    'Aporta una solución sencilla para el uso diario.',
    'Puede acompañar objetivos de nutrición o entrenamiento.',
    'Facilita sostener hábitos vinculados con una vida activa.',
    'Se integra fácilmente al gimnasio, trabajo o actividades cotidianas.'
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
    var beneficiosElegidos = revisada && ficha.beneficios.length ? ficha.beneficios : automatica.beneficios;
    var textoProducto = _normalizarTextoFicha([producto.nombre, producto.marca, producto.categoria].join(' '));
    producto.beneficios_publicacion = _soloBeneficiosPromocionalesFicha(
      beneficiosElegidos,
      String(producto.categoria || 'otros'),
      textoProducto,
      automatica.beneficios
    );
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
