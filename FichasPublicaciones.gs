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
        'Puede aflojar el intestino; revisá el magnesio elemental y posibles interacciones.'
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
        'Revisá cuántos miligramos de magnesio elemental aporta realmente la porción.'
      ]
    );
  }

  if (/carbonato.*magnesio|magnesio.*carbonato/.test(texto)) {
    return crear(
      'Carbonato de magnesio en polvo: fuente mineral concentrada cuya absorción y tolerancia dependen de la dosis y del uso indicado.',
      [
        'Aporta magnesio para la función normal de músculos y sistema nervioso.',
        'Participa en el metabolismo energético y en el mantenimiento normal de los huesos.',
        'No es la misma forma que citrato o bisglicinato y puede tolerarse de manera diferente.',
        'Puede causar molestias o efecto laxante cuando la cantidad resulta alta.',
        'La referencia correcta es el magnesio elemental indicado en la etiqueta.'
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
        'La toma nocturna es práctica, pero no funciona como sedante ni anabólico.',
        'No está demostrado que aumente testosterona si no existe una deficiencia.'
      ]
    );
  }

  if (/omega 3.*omega 6.*9|omega 3 con omega 6 y 9|omega 3 6 9/.test(texto)) {
    return crear(
      'Mezcla de omega 3, 6 y 9: combina grasas distintas; su valor depende de la cantidad real de EPA, DHA y cada aceite por porción.',
      [
        'El omega 3 puede aportar EPA y DHA si la fórmula incluye aceite de pescado.',
        'Omega 6 y omega 9 también están presentes habitualmente en la alimentación.',
        'No equivale a un omega 3 concentrado: compará EPA y DHA, no solo miligramos de aceite.',
        'Aporta grasas que forman parte de membranas celulares y de la dieta diaria.',
        'Consultá si usás anticoagulantes o tenés una cirugía programada.'
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
        '1000 mg de aceite no significan 1000 mg de EPA más DHA: revisá la etiqueta.',
        'Consultá si usás anticoagulantes o tenés una cirugía programada.'
      ]
    );
  }

  if (/ashwagandha/.test(texto)) {
    return crear(
      'Ashwagandha con vitamina C: extracto vegetal estudiado para estrés y sueño, combinado con una vitamina antioxidante.',
      [
        'Algunos extractos pueden reducir estrés percibido; el efecto depende de dosis y estandarización.',
        'Puede mejorar modestamente el sueño en algunas personas, pero no actúa como sedante inmediato.',
        'La vitamina C participa en inmunidad, antioxidación y formación normal de colágeno.',
        'No está demostrada para mejorar por sí sola el rendimiento deportivo.',
        'Evitar en embarazo; consultar por tiroides, autoinmunidad, hígado o medicación.'
      ]
    );
  }

  if (/biotina/.test(texto)) {
    return crear(
      'Biotina con vitamina C: combina una vitamina B del metabolismo con vitamina C, necesaria para formar colágeno y absorber hierro vegetal.',
      [
        'La biotina participa en el metabolismo de grasas, carbohidratos y aminoácidos.',
        'La vitamina C interviene en la formación normal de colágeno y la función inmune.',
        'Puede corregir efectos de una carencia, pero la deficiencia de biotina es poco frecuente.',
        'La evidencia para mejorar cabello o uñas sin deficiencia es limitada.',
        'Dosis altas de biotina pueden alterar análisis de tiroides, hormonas y corazón.'
      ]
    );
  }

  if (/astaxantina/.test(texto)) {
    return crear(
      'Astaxantina: carotenoide rojizo con actividad antioxidante estudiado en humanos, aunque sus beneficios clínicos todavía no son concluyentes.',
      [
        'Actúa como carotenoide antioxidante dentro de membranas y tejidos grasos.',
        'Se estudia en estrés oxidativo, piel y respuesta al ejercicio.',
        'Los ensayos muestran resultados variables según dosis y duración.',
        'No reemplaza protector solar, alimentación ni tratamiento médico.',
        'La cantidad por cápsula y el origen natural o sintético importan para compararlo.'
      ]
    );
  }

  if (/nad.*resveratrol|resveratrol.*nad/.test(texto)) {
    return crear(
      'Fórmula que combina resveratrol con un ingrediente orientado al metabolismo de NAD+; la forma química y la dosis determinan su utilidad real.',
      [
        'El resveratrol es un polifenol estudiado por su actividad antioxidante.',
        'El NAD+ participa en reacciones celulares de obtención y transferencia de energía.',
        'No todos los precursores de NAD+ se absorben ni actúan de la misma manera.',
        'No está demostrado que esta combinación rejuvenezca o prolongue la vida.',
        'Revisá la etiqueta exacta y consultá si usás anticoagulantes u otros medicamentos.'
      ]
    );
  }

  if (/resveratrol/.test(texto)) {
    return crear(
      'Resveratrol: polifenol presente en uvas y otras plantas, investigado por su actividad antioxidante y metabólica.',
      [
        'Puede influir en marcadores oxidativos, pero los resultados en humanos son variables.',
        'No equivale a un tratamiento cardiovascular ni garantiza efecto antiedad.',
        'La absorción y el efecto cambian según forma, dosis y duración de uso.',
        'No reemplaza frutas, verduras, actividad física ni una alimentación completa.',
        'Consultá antes de usarlo con anticoagulantes, antiagregantes o medicación crónica.'
      ]
    );
  }

  if (/multivitamin|vitamin gold|enaccion|live fem/.test(texto)) {
    return crear(
      'Multivitamínico y mineral para cubrir brechas de micronutrientes; la fórmula y las cantidades cambian entre productos.',
      [
        'Puede ayudar a alcanzar recomendaciones cuando la alimentación no cubre algún nutriente.',
        'Las vitaminas B participan en el metabolismo, pero no aportan calorías ni energía inmediata.',
        'Una fórmula para mujer no regula hormonas por sí sola: compará hierro, folato y vitamina D.',
        'No reemplaza una dieta variada ni previene enfermedades por sí mismo.',
        'Evitá duplicar vitaminas A, D, hierro o zinc con otros suplementos.'
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
        'Complementa una ingesta baja, pero no evita por sí sola resfríos o enfermedades.',
        'Dosis altas pueden causar diarrea o molestias digestivas.'
      ]
    );
  }

  if (/cafeina/.test(texto) && categoria === 'vitamin') {
    var dosis = (nombre.match(/\b\d{2,3}\s*mg\b/i) || [])[0] || '';
    return crear(
      'Cafeína' + (dosis ? ' de ' + dosis : '') + ': estimulante del sistema nervioso que aumenta alerta y reduce temporalmente la percepción de esfuerzo.',
      [
        'Puede mejorar resistencia y esfuerzos intermitentes; la respuesta varía entre personas.',
        'Suele actuar entre 15 y 60 minutos después de consumirla.',
        'Más cantidad no asegura más rendimiento y aumenta los efectos adversos.',
        'Puede causar insomnio, ansiedad, temblores, palpitaciones o malestar digestivo.',
        'Sumá la cafeína de café, mate, energizantes y otros suplementos del día.'
      ]
    );
  }

  if (/creatina.*gomita|gomita.*creatina/.test(texto)) {
    return crear(
      'Creatina en gomitas: formato masticable cuya eficacia depende de alcanzar la cantidad diaria de creatina indicada en la etiqueta.',
      [
        'La creatina ayuda a regenerar ATP en esfuerzos breves, intensos y repetidos.',
        'Puede mejorar fuerza, potencia y capacidad de repetir series con entrenamiento.',
        'El beneficio requiere uso diario y una dosis total suficiente, no solo tomar una gomita.',
        'Compará gramos de creatina y azúcares por porción con una creatina en polvo.',
        'Puede aumentar algo el peso corporal por mayor agua dentro del músculo.'
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
        'Se usa todos los días; no necesita sentirse como un estimulante para funcionar.',
        'Puede aumentar algo el peso corporal por mayor agua dentro del músculo.'
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
        'Compará proteína y leucina por porción: no todas equivalen a whey gramo por gramo.',
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
        'Menos lactosa no significa apta para alergia a la proteína de la leche.'
      ]
    );
  }

  if (/proteina.*colag|protein.*collagen|fit.*colag/.test(texto)) {
    return crear(
      'Fórmula mixta de proteína y colágeno: combina aminoácidos musculares con péptidos del tejido conectivo.',
      [
        'La fuente proteica completa ayuda a cubrir aminoácidos esenciales para el músculo.',
        'El colágeno aporta sobre todo glicina, prolina e hidroxiprolina.',
        'No equivale a una whey pura: revisá cuánto aporta de cada proteína por porción.',
        'Puede aportar saciedad y funcionar como colación práctica.',
        'El resultado depende de proteína total, entrenamiento y alimentación del día.'
      ]
    );
  }

  if (/whey|protein shake|proteina 7900|bio prot|best whey|proteina|protein/.test(texto) && categoria === 'proteina') {
    return crear(
      /blend/.test(texto)
        ? 'Blend proteico: combina dos o más fuentes o fracciones de proteína; revisá la etiqueta para conocer la proporción real de cada una.'
        : 'Proteína de suero o fórmula proteica completa para sumar aminoácidos esenciales de forma práctica.',
      [
        'Ayuda a alcanzar la cantidad diaria de proteína necesaria para mantener músculo.',
        'Aporta aminoácidos esenciales, incluida leucina, para la síntesis de proteína muscular.',
        'Es útil después de entrenar o en comidas que quedan cortas de proteína.',
        'Puede aumentar saciedad, pero no adelgaza ni genera músculo sin el resto del plan.',
        'Compará gramos de proteína, fuente, azúcares y lactosa por porción.'
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
        'En personas sanas no mejora de forma consistente masa, fuerza o recuperación.',
        'No está demostrado que actúe como prebiótico ni que trate el estreñimiento.'
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
        'No reemplaza proteína, creatina, descanso ni entrenamiento progresivo.',
        'Los resultados en fuerza y masa son variables entre estudios y personas.'
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
        'Es práctico alrededor del entrenamiento, pero no supera una dieta con proteína suficiente.',
        'Revisá gramos totales y leucina por porción para comparar fórmulas.'
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
        'Con proteína diaria suficiente, el beneficio adicional suele ser pequeño o incierto.',
        'Se diferencia de EAA porque faltan otros seis aminoácidos esenciales.'
      ]
    );
  }

  if (/carnitin/.test(texto)) {
    return crear(
      'L-carnitina, compuesto que transporta ácidos grasos hacia las mitocondrias; el cuerpo sano también la fabrica por sí mismo.',
      [
        'Participa en el uso celular de ácidos grasos como combustible.',
        'Los estudios sobre rendimiento y recuperación muestran resultados mixtos.',
        'Puede producir una reducción de peso pequeña, pero no reemplaza el déficit calórico.',
        'No funciona como estimulante inmediato ni quema grasa sin dieta y actividad.',
        'Puede causar náuseas, diarrea, cólicos u olor corporal característico.'
      ]
    );
  }

  if (/beta alan/.test(texto)) {
    return crear(
      'Beta-alanina, precursor de carnosina muscular: ayuda a amortiguar la caída de pH durante esfuerzos intensos sostenidos.',
      [
        'Funciona por acumulación diaria de carnosina, no como estimulante de efecto inmediato.',
        'Puede ser útil en esfuerzos intensos de aproximadamente uno a cuatro minutos.',
        'Tiene menos utilidad demostrada en fuerza de una repetición o ejercicio muy prolongado.',
        'El hormigueo es un efecto conocido y puede reducirse dividiendo la dosis.',
        'Los resultados varían; no reemplaza creatina, proteína ni entrenamiento.'
      ]
    );
  }

  if (/nox 3000|n o gold|oxido nitrico classic/.test(texto)) {
    return crear(
      'Fórmula sin estimulante principal orientada a óxido nítrico, basada en arginina y/o citrulina según el producto.',
      [
        'Arginina y citrulina son precursores de la ruta que produce óxido nítrico.',
        'La citrulina suele elevar arginina en sangre con mayor eficiencia que arginina oral.',
        'Puede acompañar sensación de bombeo, pero el efecto sobre rendimiento es variable.',
        'No aporta la energía estimulante propia de una fórmula con cafeína.',
        'Consultá si usás medicación para presión, nitratos o fármacos vasodilatadores.'
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
      'Beta-alanina y creatina requieren uso suficiente y sostenido; no dependen de sentir un golpe inmediato.',
      'Citrulina y arginina se orientan al flujo sanguíneo, con respuesta variable entre personas.',
      'No sumes café, energizantes u otro pre-entreno sin contar la cafeína total.',
      'Puede afectar sueño, ansiedad, presión o ritmo cardíaco; respetá una sola porción.'
    ]);
  }

  if (/energy gel/.test(texto)) {
    return crear(
      'Gel de carbohidratos para consumir durante esfuerzos prolongados; las versiones limón y frutilla/naranja declaradas no aportan cafeína.',
      [
        'Aporta cerca de 30 g de carbohidratos y 120 kcal por sachet según la fórmula declarada.',
        'Combina carbohidratos de distinta velocidad para sostener energía durante el ejercicio.',
        'Incluye sodio y se recomienda acompañarlo con agua para facilitar su tolerancia.',
        'Es más útil en sesiones largas que en rutinas cortas con comida reciente.',
        'No reemplaza hidratación ni una estrategia completa para competencias prolongadas.'
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
        'Incluye creatina y aminoácidos, pero sus dosis deben contarse dentro del total diario.',
        'Es más útil tras gran desgaste; aporta azúcares y contiene derivados de leche.'
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
        'Está orientada a carrera, ciclismo y sesiones largas, no a hidratación cotidiana.',
        'La concentración correcta evita una bebida demasiado cargada y difícil de tolerar.'
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
        'Debe probarse en entrenamiento: una concentración alta puede causar malestar intestinal.'
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
        'Es más útil con calor o sesiones largas que en una rutina breve y fresca.',
        'Prepararla con la proporción indicada evita exceso de azúcar o concentración.'
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
        'Puede acompañar piel o molestias articulares, pero el efecto requiere semanas y varía.',
        'No regenera cartílago ni reemplaza tratamiento, fuerza, proteína o rehabilitación.'
      ]
    );
  }

  if (/collagen sport/.test(texto) && /star nutrition/.test(texto)) {
    return crear(
      'Collagen Sport Star: 10 g de colágeno, 1000 mg de vitamina C, 80 mg de magnesio y 200 mg de cafeína por porción.',
      [
        'El colágeno aporta péptidos del tejido conectivo y la vitamina C participa en su formación.',
        'El magnesio participa en función muscular y metabolismo energético normal.',
        'Los 200 mg de cafeína aumentan alerta, pero también pueden alterar el sueño.',
        'No es un colágeno neutro: contá su cafeína junto con café y pre-entrenos.',
        'El efecto en piel o articulaciones es gradual, variable y no reemplaza tratamiento.'
      ]
    );
  }

  if (/colag|collagen/.test(texto) && categoria === 'colageno') {
    return crear(
      /sport/.test(texto)
        ? 'Colágeno hidrolizado orientado a personas activas; revisá si suma vitamina C, minerales o cafeína porque cambia entre fórmulas Sport.'
        : 'Colágeno hidrolizado: péptidos ricos en aminoácidos característicos de piel, tendones y cartílagos.',
      [
        'Aporta glicina, prolina e hidroxiprolina, distintas del perfil de una whey completa.',
        'Algunos estudios muestran mejoras modestas en hidratación o elasticidad de la piel.',
        'Puede ayudar a algunas personas con molestias articulares tras varias semanas.',
        'No es proteína ideal para músculo porque aporta pocos aminoácidos esenciales.',
        'No reconstruye cartílago ni reemplaza fuerza, alimentación o tratamiento profesional.'
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
        'Aumentar peso no significa aumentar solo músculo: la cantidad total importa.',
        'Puede dividirse en porciones para mejorar tolerancia y controlar azúcares y calorías.'
      ]
    );
  }

  if (/\bcla\b|lipolitic cla/.test(texto)) {
    return crear(
      'CLA o ácido linoleico conjugado: tipo de grasa estudiado para composición corporal, con efectos promedio pequeños e inconsistentes.',
      [
        'No es estimulante y no produce un aumento inmediato de energía.',
        'Los estudios muestran cambios pequeños en grasa o peso, no resultados rápidos.',
        'No preserva músculo ni elimina grasa localizada por sí solo.',
        'Solo complementa alimentación, déficit calórico y entrenamiento de fuerza.',
        'Revisá gramos reales de CLA por porción, no solo miligramos de aceite.'
      ]
    );
  }

  if (/tx3 black cuts/.test(texto)) {
    return crear(
      'TX3 Black Cuts combina 850 mg de CLA, 500 mg de L-carnitina y 200 mg de cafeína por porción declarada.',
      [
        'La cafeína aumenta alerta y puede ayudar a entrenar con menor percepción de esfuerzo.',
        'Carnitina participa en transporte de grasas, pero no las elimina automáticamente.',
        'CLA tiene efectos pequeños e inconsistentes sobre composición corporal.',
        'No reemplaza un déficit calórico ni garantiza reducción de grasa.',
        'No usar de noche ni combinar sin contar toda la cafeína del día.'
      ]
    );
  }

  if (/lipo gold elite/.test(texto)) {
    return crear(
      'Lipo Gold Elite combina taurina, carnitina, tirosina, té verde, guaraná y 20 mg de cafeína por porción declarada.',
      [
        'Cafeína y guaraná pueden aumentar alerta; la cantidad declarada es moderada.',
        'Té verde y cafeína pueden aumentar levemente el gasto energético a corto plazo.',
        'Carnitina participa en transporte de grasas, pero no quema grasa por sí sola.',
        'No está probado que suprima el apetito o evite acumular grasa en todas las personas.',
        'Solo complementa déficit calórico, entrenamiento y descanso.'
      ]
    );
  }

  if (/ripped fat|thermo fuel|fat burner|hydroxy max night/.test(texto)) {
    return crear(
      'Fórmula para control de peso con varios ingredientes; su efecto y seguridad dependen de la etiqueta y de la cantidad de estimulantes.',
      [
        'Puede aumentar alerta o gasto energético de forma pequeña si contiene cafeína.',
        'No elimina grasa localizada ni reemplaza un déficit calórico sostenido.',
        'La palabra “night” no garantiza que favorezca el sueño ni que actúe mientras dormís.',
        'Revisá cafeína, guaraná, sinefrina y duplicación con otros productos.',
        'Evitá si tenés presión alta, arritmias, embarazo o sensibilidad a estimulantes.'
      ]
    );
  }

  if (/testo gold/.test(texto)) {
    return crear(
      'Mezcla comercial presentada como soporte hormonal; su efecto depende de ingredientes, dosis y de si existe una deficiencia real.',
      [
        'No está demostrado que un “booster” aumente testosterona en todos los hombres sanos.',
        'Vitaminas o minerales solo corrigen efectos vinculados con una ingesta insuficiente.',
        'No reemplaza análisis, diagnóstico ni tratamiento médico por baja testosterona.',
        'No garantiza más masa muscular, fuerza, libido o fertilidad.',
        'Revisá la fórmula completa y posibles interacciones antes de usarlo.'
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
      'Aporta colágeno y conviene comparar gramos reales por porción.',
      'No equivale a una barra proteica ni a una whey completa.',
      'Puede resolver un postre práctico dentro del plan alimentario.',
      'Revisá azúcares, edulcorantes y tamaño de porción.',
      'El colágeno no reemplaza proteína completa para desarrollar músculo.'
    ]);
  }

  if (categoria === 'barra' && /pancake|cupcake/.test(texto)) {
    return crear('Premezcla proteica para preparar pancakes o cupcakes; combina conveniencia con proteína en una comida cocida.', [
      'Permite preparar una colación con más proteína que una mezcla convencional.',
      'La cantidad final depende de la porción, el líquido y los agregados usados.',
      'Puede servir en desayuno o merienda sin ser un suplemento de efecto inmediato.',
      'Revisá proteína, carbohidratos, azúcares y calorías por porción preparada.',
      'No todas las premezclas tienen la misma fuente o calidad de proteína.'
    ]);
  }

  if (categoria === 'barra' && /barra|protein bar|whey bar/.test(texto)) {
    return crear('Barra proteica lista para comer: colación portátil con proteína, carbohidratos y grasas en cantidades que varían por marca.', [
      'Ayuda a sumar proteína cuando no hay una comida disponible.',
      'Es fácil de transportar y usar antes o después de la actividad.',
      'No equivale automáticamente a una comida completa ni a una barra baja en calorías.',
      'Compará proteína, azúcares, fibra, grasas y tamaño de porción.',
      'La fuente de proteína determina su perfil de aminoácidos y saciedad.'
    ]);
  }

  if (categoria === 'barra' && /granola.*protein/.test(texto)) {
    return crear('Granola proteica: mezcla crocante que suma proteína a cereales, semillas u otros ingredientes energéticos.', [
      'Puede enriquecer yogur, leche o fruta en desayuno y merienda.',
      'Aporta energía además de proteína; la porción cambia mucho las calorías.',
      'La fibra y grasas dependen de los cereales, semillas y frutos secos usados.',
      'No equivale a una whey ni necesariamente tiene poco azúcar.',
      'Compará proteína y azúcares por porción real, no por 100 gramos solamente.'
    ]);
  }

  if (/pasta de mani|manteca de mani|mani king/.test(texto)) {
    return crear('Pasta de maní: alimento concentrado en energía, grasas insaturadas y proteína vegetal; no es una proteína en polvo.', [
      'Aporta grasas insaturadas y energía en poco volumen.',
      'Suma proteína vegetal, aunque no reemplaza una fuente proteica completa.',
      'Puede aumentar saciedad y servir en desayunos, colaciones o recetas.',
      'La porción importa porque concentra muchas calorías.',
      'Revisá si contiene azúcar, aceites o sal agregados y evitá si hay alergia al maní.'
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
      beneficios: beneficios.map(function(item) { return _limpiarTextoFicha(item, 115); }).slice(0, 5)
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
