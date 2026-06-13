// MAXUP SUPLEMENTOS - app.js
// ── LOGO ──────────────────────────────────────────────────
const LOGO_B64 = 'logo.png';
document.querySelectorAll('#navLogo,#heroLogo,#footerLogo').forEach(i => i.src = LOGO_B64);

// Mostrar banner si está activado en CONFIG
(function() {
  var banner = document.getElementById('storeBanner');
  if (banner && typeof BANNER_ACTIVO !== 'undefined' && BANNER_ACTIVO) {
    banner.textContent = BANNER_TEXTO || '';
    banner.style.display = 'block';
    banner.style.backgroundColor = BANNER_COLOR || '#FF0099';
    banner.style.color = '#fff';
  }
})();

// ╔══════════════════════════════════════════════════════════╗
// ║           PANEL DE CONTROL — MAXUP SUPLEMENTOS           ║
// ║   Editá solo esta sección para personalizar la tienda    ║
// ╚══════════════════════════════════════════════════════════╝

// ── DATOS DE LA TIENDA ────────────────────────────────────
const STORE_NAME = 'MAXUP SUPLEMENTOS';   // Nombre de la tienda
const WA_DEFAULT = '5491168461457';        // Número de WhatsApp (sin + ni espacios)
const API_URL = 'https://script.google.com/macros/s/AKfycbwUujcSoSyBWLLla-LOdovJmTDan-DP3O9Gp0k_MSupTHGEPB55TCZqllvGmEK6vlk/exec';

// ── CHEQUEO DE MANTENIMIENTO ──────────────────────────────
// Arranca con appContent visible y mantScreen oculto.
// Si la API confirma mantenimiento activo → oculta appContent, muestra mantScreen.
// Si no hay mantenimiento o falla la API → se queda como está (página normal).
(function(){
  fetch(API_URL + '?accion=mantenimiento')
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (data.ok && data.activo) {
        // Mantenimiento activo: ocultar página, mostrar pantalla mantenimiento
        document.getElementById('appContent').style.display = 'none';
        document.getElementById('mantScreen').style.display = 'block';
        document.body.style.overflow = 'hidden';
      }
      // Si no hay mantenimiento, no hacer nada (página ya visible)
    }).catch(function(){
      // Si falla la API, no hacer nada (página ya visible)
    });
})();

// ── DESCUENTOS POR MONTO ──────────────────────────────────
// Formato: { desde: MONTO_MINIMO, porcentaje: DESCUENTO }
// Podés agregar o quitar filas, o cambiar los montos y porcentajes
const DESCUENTOS_CONFIG = [
  { desde: 100000,  porcentaje: 5  },   // 5% desde $100.000
  { desde: 220000,  porcentaje: 10 },   // 10% desde $220.000
  { desde: 270000,  porcentaje: 15 },   // 15% desde $270.000
];

// ── BANNERS Y CARTELES ────────────────────────────────────
// Activar/desactivar el banner de anuncio superior
const BANNER_ACTIVO = false;            // true = mostrar, false = ocultar
const BANNER_TEXTO = '🔥 ENVÍOS GRATIS a partir de $150.000 — Solo esta semana';
const BANNER_COLOR = '#FF0099';         // Color del banner (código hex)

// ── TIPOS DE CARTEL DISPONIBLES PARA PRODUCTOS ───────────
// Usá estos valores en el campo "badge" de cada producto:
//   "hot"   → 🔥 Rosado  — para los más vendidos
//   "new"   → ✨ Celeste  — para productos nuevos
//   "sale"  → 💸 Naranja  — para ofertas/descuentos
//   "oferta"→ ⚡ Verde    — para precio rebajado (mostrar precio anterior tachado)
//   null    → sin cartel
//
// Para agregar cartel de OFERTA a un producto:
//   "badge": "oferta",
//   "badgeText": "OFERTA",
//   "priceAnterior": 85000,   ← precio original tachado
//
// Ejemplo completo de producto en oferta:
// { "id": "sn_whey_dp", "badge": "oferta", "badgeText": "OFERTA", "priceAnterior": 85000, ... }


/* ════════════════════════════════════════════════════════
   CATÁLOGO DE PRODUCTOS
   ─────────────────────────────────────────────────────
   Cada producto tiene estos campos:

   "id"           → identificador único (no cambiar)
   "name"         → nombre del producto
   "brand"        → marca
   "cat"          → categoría del filtro:
                    "proteina" | "gainer" | "creatina" | "aminoacido"
                    "preworkout" | "colageno" | "quemador" | "vitamin"
                    "hidratacion" | "barra" | "accesorio"
   "img"          → URL de la imagen (podés usar cualquier URL de internet)
   "desc"         → descripción del producto
   "price"        → precio de venta (efectivo/transferencia)
   "badge"        → cartel sobre la imagen: "hot" | "new" | "sale" | "oferta" | null
   "badgeText"    → texto del cartel: "Top Ventas" | "Nuevo" | "Oferta" | etc.
   "priceAnterior"→ (OPCIONAL) precio original tachado para mostrar descuento
                    Solo funciona con badge "oferta"

   EJEMPLO — Producto en oferta:
   {
     "id": "sn_creat_pote",
     "name": "Creatina X 300 Grs Pote",
     "brand": "Star Nutrition",
     "cat": "creatina",
     "badge": "oferta",
     "badgeText": "OFERTA",
     "priceAnterior": 40000,
     "price": 32500,
     ...
   }

   EJEMPLO — Agregar producto nuevo (copiar este bloque):
   {
     "id": "nuevo_producto_01",
     "name": "Nombre del producto",
     "brand": "Marca",
     "cat": "proteina",
     "emoji": "🥛",
     "img": "https://URL-de-la-imagen.jpg",
     "desc": "Descripción del producto.",
     "price": 50000,
     "badge": "new",
     "badgeText": "Nuevo",
     "flavors": [
       { "name": "Chocolate", "stock": 5 },
       { "name": "Vainilla", "stock": 3 }
     ]
   },
════════════════════════════════════════════════════════ */
const PRODUCTS = [
  {
    "id": "sn_whey_dp",
    "name": "Whey Protein Doypack 2 Lb",
    "brand": "Star Nutrition",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=www.demusculos.com/web/wp-content/uploads/2024/02/whey-protein-star-bolsa-frente-1024x1024.jpg&w=400&output=webp&q=82",
    "desc": "Proteína del suero de leche de alta absorción. 24g de proteína por porción. Ideal post-entrenamiento para recuperación y construcción muscular. Bajo en grasas y carbohidratos.",
    "price": 49000,
    "badge": "hot",
    "badgeText": "Top Ventas",
    "flavors": [
      {
        "name": "Chocolate",
        "stock": 17
      },
      {
        "name": "Vainilla",
        "stock": 19
      },
      {
        "name": "Cookies",
        "stock": 7
      },
      {
        "name": "Frutilla",
        "stock": 5
      }
    ]
  },
  {
    "id": "sn_plat_2lb",
    "name": "Platinum Whey Protein 2 Lb Pote",
    "brand": "Star Nutrition",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/PWP-2Lb-Chocolate.png?v=1718218508&width=1100&w=400&output=webp&q=82",
    "desc": "Fórmula premium con concentrado y aislado de proteína de suero. Mayor perfil de aminoácidos, mejor digestibilidad. Pote resistente y hermético.",
    "price": 53000,
    "badge": "new",
    "badgeText": "Premium",
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 4
      },
      {
        "name": "Chocolate",
        "stock": 2
      },
      {
        "name": "Frutilla",
        "stock": 1
      }
    ]
  },
  {
    "id": "sn_plat_3kg",
    "name": "Whey Protein Platinum 3 Kg",
    "brand": "Star Nutrition",
    "cat": "proteina",
    "emoji": "🏆",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/PWP-3Kg-Chocolate.png?v=1718218522&width=1100&w=400&output=webp&q=82",
    "desc": "La opción premium de alto volumen. 3 kg de proteína del suero con tecnología de aislado microfiltrado. Para atletas serios que entrenan al máximo.",
    "price": 142000,
    "badge": "sale",
    "badgeText": "Best Seller",
    "flavors": [
      {
        "name": "Chocolate",
        "stock": 0
      },
      {
        "name": "Vainilla",
        "stock": 2
      },
      {
        "name": "Cookies and Cream",
        "stock": 1
      }
    ]
  },
  {
    "id": "sn_wh3y",
    "name": "Wh3y Platinum Chocolate",
    "brand": "Star Nutrition",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=i.ibb.co/4w4mQvbs/IMG-20260323-230735755-HDR-AE.jpg&w=400&output=webp&q=82",
    "desc": "Triple acción proteica: concentrado, aislado e hidrolizado de suero. La proteína más completa de Star Nutrition para máxima recuperación.",
    "price": 51000,
    "flavors": [
      {
        "name": "Chocolate",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_justwhey",
    "name": "Just Whey x2Lb",
    "brand": "Star Nutrition",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/products/just_4.png?v=1755712483&width=1500&w=400&output=webp&q=82",
    "desc": "Proteína de suero concentrada sin aditivos innecesarios. Máxima pureza proteica a precio accesible. La opción directa al resultado.",
    "price": 48000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_mutant",
    "name": "MutantMass X 1,5 Kg",
    "brand": "Star Nutrition",
    "cat": "gainer",
    "emoji": "💪",
    "img": "https://images.weserv.nl/?url=i.ibb.co/RktxYHBx/Gemini-Generated-Image-6eld1a6eld1a6eld.png&w=400&output=webp&q=82",
    "desc": "Gainer de alta densidad calórica. Ideal para ganar masa muscular rápidamente. Con proteínas, carbohidratos complejos y grasas saludables en proporciones óptimas.",
    "price": 37500,
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 1
      },
      {
        "name": "Chocolate",
        "stock": 0
      }
    ]
  },
  {
    "id": "sn_justcarb",
    "name": "Just Carb 2 Lb",
    "brand": "Star Nutrition",
    "cat": "hidratacion",
    "emoji": "⚗️",
    "img": "https://images.weserv.nl/?url=encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg_2RrSzuVdHnxIupXDcad7N3-XfeVgrRj3A&s&w=400&output=webp&q=82",
    "desc": "Carbohidratos de rápida absorción para recuperación energética post-entrenamiento. Ideal para mezclar con proteína y optimizar la ventana anabólica.",
    "price": 20000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_creat_pote",
    "name": "Creatina 300g Pote",
    "brand": "Star Nutrition",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/003/703/137/products/creatina-hd-a839e43636a193460417291787850812-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato ultramicronizada de máxima pureza. Aumenta fuerza, potencia y resistencia muscular. Envase pote hermético. 60 servicios.",
    "price": 34500,
    "badge": "hot",
    "badgeText": "Top Ventas",
    "flavors": [
      {
        "name": "Neutro",
        "stock": 6
      }
    ]
  },
  {
    "id": "sn_creat_doy",
    "name": "Creatina 300g Doypack",
    "brand": "Star Nutrition",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=suplementsport.com.ar/wp-content/uploads/2024/07/Creatina-doy-pack-300-gr.jpg&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato ultramicronizada en práctico doypack. Disolución instantánea. Sin azúcar ni calorías vacías. El estándar de fuerza y potencia.",
    "price": 32000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 7
      },
      {
        "name": "Frutos Rojos",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_creat_500",
    "name": "Creatina 500g Pote",
    "brand": "Star Nutrition",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/005/314/904/products/creatina-500-grs-star-informacion-nutricional-b60391aaf994f3b46517510401406773-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato en formato 500g pote. Mayor rendimiento por precio. Ideal para usuarios avanzados que no quieren quedarse sin stock.",
    "price": 48000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 0
      }
    ]
  },
  {
    "id": "sn_creat_1kg",
    "name": "Creatina 1 Kg Pote",
    "brand": "Star Nutrition",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_889534-MLA92512456390_092025-F.webp&w=400&output=webp&q=82",
    "desc": "El mejor precio por kg del mercado. 200 servicios de creatina pura. Para atletas de alto rendimiento que entrenan duro sin interrupciones.",
    "price": 90000,
    "badge": "sale",
    "badgeText": "Mejor precio/kg",
    "flavors": [
      {
        "name": "Neutro",
        "stock": 4
      }
    ]
  },
  {
    "id": "sn_mtor",
    "name": "MTOR BCAA 270g",
    "brand": "Star Nutrition",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/MtorBCAA-270g-_2.png?v=1718218499&width=1100&w=400&output=webp&q=82",
    "desc": "BCAAs en proporción 2:1:1 (Leucina, Isoleucina, Valina). Máxima síntesis proteica y reducción del catabolismo muscular. Ideal intra o post-entrenamiento.",
    "price": 30000,
    "badge": "hot",
    "badgeText": "Best Seller",
    "flavors": [
      {
        "name": "Limón",
        "stock": 1
      },
      {
        "name": "Frutilla Lima",
        "stock": 4
      },
      {
        "name": "Frutos Rojos",
        "stock": 1
      },
      {
        "name": "Uva",
        "stock": 1
      }
    ]
  },
  {
    "id": "sn_eaas",
    "name": "EAA's Aminoácidos",
    "brand": "Star Nutrition",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/EEAS-Aminos.png?v=1718218508&width=1100&w=400&output=webp&q=82",
    "desc": "Los 9 aminoácidos esenciales en un solo producto. Fórmula completa para recuperación total, síntesis proteica y reducción de fatiga muscular.",
    "price": 37900,
    "flavors": [
      {
        "name": "Limón",
        "stock": 1
      }
    ]
  },
  {
    "id": "sn_glut",
    "name": "L-Glutamina 300g",
    "brand": "Star Nutrition",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/L-glutamine-300g.png?v=1718218487&width=1100&w=400&output=webp&q=82",
    "desc": "Glutamina pura de alta pureza. El aminoácido más abundante en el músculo. Reduce el dolor muscular y mejora la inmunidad post-entrenamiento.",
    "price": 32000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 3
      }
    ]
  },
  {
    "id": "sn_arginine",
    "name": "L-Arginina 150g",
    "brand": "Star Nutrition",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/L-ArginineGH.png?v=1718218459&width=1100&w=400&output=webp&q=82",
    "desc": "Precursor del óxido nítrico para máxima vasodilatación y bomba muscular. Mejora el flujo sanguíneo y la entrega de nutrientes al músculo.",
    "price": 20000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_lcarnitina",
    "name": "L-Carnitina 60 Comp.",
    "brand": "Star Nutrition",
    "cat": "aminoacido",
    "emoji": "🔥",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/L-Carnitine1000.png?v=1718218457&width=1100&w=400&output=webp&q=82",
    "desc": "L-Carnitina en cápsulas para el transporte de ácidos grasos a la mitocondria. Potencia la quema de grasa como fuente de energía durante el ejercicio.",
    "price": 19000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 1
      }
    ]
  },
  {
    "id": "sn_betaal",
    "name": "Beta Alanina 300g",
    "brand": "Star Nutrition",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/STANUT0040BEAPO.png?v=1719513607&width=1100&w=400&output=webp&q=82",
    "desc": "Beta-alanina pura para aumentar los niveles de carnosina muscular. Retrasa la fatiga, aumenta la resistencia y el rendimiento en entrenamientos de alta intensidad.",
    "price": 28800,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 4
      }
    ]
  },
  {
    "id": "sn_vitc",
    "name": "Vitamina C (Ácido Ascórbico)",
    "brand": "Star Nutrition",
    "cat": "vitamin",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/VitaminaC_sf_2.png?v=1726507301&width=1100&w=400&output=webp&q=82",
    "desc": "Vitamina C pura de alta potencia. Potente antioxidante que refuerza el sistema inmune, mejora la síntesis de colágeno y protege el músculo del daño oxidativo.",
    "price": 12000,
    "flavors": [
      {
        "name": "Comprimidos",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_multi",
    "name": "Multivitamínico 60 Caps",
    "brand": "Star Nutrition",
    "cat": "vitamin",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/STANUT004030.png?v=1719499932&width=1100&w=400&output=webp&q=82",
    "desc": "Complejo vitamínico y mineral completo para atletas. Más de 20 micronutrientes esenciales. Refuerza el sistema inmune, energía y metabolismo. Un cap al día.",
    "price": 23000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_omega3",
    "name": "Omega 3 Fish Oil 60 Caps",
    "brand": "Star Nutrition",
    "cat": "magnesio",
    "emoji": "🐟",
    "img": "https://images.weserv.nl/?url=www.demusculos.com/web/wp-content/uploads/2024/02/fish-oil-omega-3-star-nutrition-x60-1.jpg&w=400&output=webp&q=82",
    "desc": "EPA y DHA de pescado de agua profunda. Reduce triglicéridos, protege el corazón, mejora la función cerebral y reduce la inflamación muscular. Imprescindible.",
    "price": 34000,
    "badge": "hot",
    "badgeText": "Esencial",
    "flavors": [
      {
        "name": "Cápsulas blandas",
        "stock": 3
      }
    ]
  },
  {
    "id": "sn_zma",
    "name": "ZMA 90 Caps",
    "brand": "Star Nutrition",
    "cat": "magnesio",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/products/zma-lanzamiento1.jpg?v=1718296879&w=400&output=webp&q=82",
    "desc": "Zinc, Magnesio y Vitamina B6. Potencia los niveles de testosterona naturales, mejora la calidad del sueño y la recuperación nocturna. Tomar antes de dormir.",
    "price": 22000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_cla",
    "name": "CLA 1000 90 Caps",
    "brand": "Star Nutrition",
    "cat": "vitamin",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/CLA1000.png?v=1718218464&w=400&output=webp&q=82",
    "desc": "Ácido Linoleico Conjugado para reducción de grasa corporal y mantenimiento de masa magra. Efecto continuo 24hs. Sin estimulantes, compatible con cualquier ciclo.",
    "price": 27000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 3
      }
    ]
  },
  {
    "id": "sn_resv",
    "name": "Resveratrol 500 X 60 Caps.",
    "brand": "Star Nutrition",
    "cat": "vitamin",
    "emoji": "🍇",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/Resceratrol500.png?v=1718218466&width=1100&w=400&output=webp&q=82",
    "desc": "Resveratrol de alto potencia. Poderoso antioxidante natural presente en la uva. Protege contra el envejecimiento celular, inflamación y enfermedades cardiovasculares.",
    "price": 24500,
    "badge": "new",
    "badgeText": "Anti-aging",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 7
      }
    ]
  },
  {
    "id": "sn_citr60",
    "name": "Citrato de Magnesio 60 Caps",
    "brand": "Star Nutrition",
    "cat": "magnesio",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/CitratoMagnesio_36ac50e8-5662-4aa0-8b90-10edd71b1236.png?v=1720020323&width=1100&w=400&output=webp&q=82",
    "desc": "Magnesio en la forma más biodisponible en cápsulas. Esencial para contracción muscular, transmisión nerviosa, síntesis proteica y regulación de glucosa.",
    "price": 19000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 4
      }
    ]
  },
  {
    "id": "sn_citr500",
    "name": "Citrato de Magnesio 500g",
    "brand": "Star Nutrition",
    "cat": "magnesio",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/WhatsAppImage2025-01-21at16.41.23.jpg?v=1737657815&w=400&output=webp&q=82",
    "desc": "Magnesio en polvo para máxima absorción. 500g de pura relajación muscular y recuperación. Ideal para calambres nocturnos y sueño profundo.",
    "price": 32000,
    "flavors": [
      {
        "name": "Frutos Rojos",
        "stock": 3
      },
      {
        "name": "Neutro",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_cafeina30",
    "name": "Cafeína 200mg 30 Caps",
    "brand": "Star Nutrition",
    "cat": "vitamin",
    "emoji": "☕",
    "img": "https://images.weserv.nl/?url=encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuBBnyF8GwvV_Jtg1atRIjKpsGcGyDM3Wu1w&s&w=400&output=webp&q=82",
    "desc": "Cafeína anhidra de alta pureza para máxima alerta mental y rendimiento físico. Sin azúcar, sin calorías. El estimulante más estudiado del mundo.",
    "price": 11000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 4
      }
    ]
  },
  {
    "id": "sn_thermo",
    "name": "Thermo Fuel Max",
    "brand": "Star Nutrition",
    "cat": "quemador",
    "emoji": "🌡️",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/ThermoFuelMax.png?v=1718218471&width=1100&w=400&output=webp&q=82",
    "desc": "El termogénico más potente de Star Nutrition. Cafeína anhidra, yerba mate, CLA y L-Tirosina. Máxima termogénesis y oxidación de grasa en cada toma.",
    "price": 24000,
    "badge": "hot",
    "badgeText": "Potente",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 3
      }
    ]
  },
  {
    "id": "sn_tnt",
    "name": "TNT Dynamite 240g",
    "brand": "Star Nutrition",
    "cat": "preworkout",
    "emoji": "🔥",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/TNTDynamite-blueraz.png?v=1718218517&w=400&output=webp&q=82",
    "desc": "Pre-entreno explosivo con cafeína, beta-alanina, citrulina y arginina. Energía máxima, bomba muscular y enfoque mental desde el primer servicio.",
    "price": 26000,
    "badge": "hot",
    "badgeText": "⚡ Explosivo",
    "flavors": [
      {
        "name": "Acai",
        "stock": 1
      },
      {
        "name": "Limón",
        "stock": 1
      },
      {
        "name": "Blue Razz",
        "stock": 0
      },
      {
        "name": "Grape Attack",
        "stock": 1
      }
    ]
  },
  {
    "id": "sn_pumpv8",
    "name": "Pump V8 X285g",
    "brand": "Star Nutrition",
    "cat": "preworkout",
    "emoji": "🔥",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/PumpV8-WMEL_256a8bca-27cd-4ba8-8dc8-edffe507986d.png?v=1719843200&width=1100&w=400&output=webp&q=82",
    "desc": "Pre-entreno vasodilatador premium. 8 ingredientes activos: citrulina malato, agmatina y glicerol para la mayor bomba muscular. Sin estimulantes, apto nocturno.",
    "price": 34000,
    "flavors": [
      {
        "name": "Grape",
        "stock": 0
      },
      {
        "name": "Acai",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_hydroplus",
    "name": "Hydroplus Endurance X700g",
    "brand": "Star Nutrition",
    "cat": "hidratacion",
    "emoji": "💧",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/HydroplusEndurance-Limon.png?v=1718218522&w=400&output=webp&q=82",
    "desc": "Bebida isotónica de alto rendimiento con electrolitos, vitaminas y carbohidratos de rápida absorción. Para entrenamientos largos de resistencia.",
    "price": 20000,
    "flavors": [
      {
        "name": "Blue Razz",
        "stock": 1
      },
      {
        "name": "Lima Limón",
        "stock": 1
      }
    ]
  },
  {
    "id": "wo_fatburner",
    "name": "Fat Burner 60 Caps",
    "brand": "Woman",
    "cat": "quemador",
    "emoji": "🌡️",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/mercado-libre-31-06c8d2b9fc2d0ae3ee17120844289331-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Termogénico femenino con extracto de té verde, CLA, L-Carnitina y cafeína natural. Acelera el metabolismo y controla el apetito. Diseñado para el cuerpo femenino.",
    "price": 23000,
    "badge": "new",
    "badgeText": "💃 Mujer",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 4
      }
    ]
  },
  {
    "id": "wo_creat",
    "name": "Creatina Monohidrato 300g",
    "brand": "Woman",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/diseno-sin-titulo-a9c08fc92439e10e4317701539357351-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato pura formulada para la mujer activa. Aumenta la fuerza y el tono muscular sin volumen excesivo. Alta pureza y rápida absorción.",
    "price": 32000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 10
      }
    ]
  },
  {
    "id": "wo_preentreno",
    "name": "Pre Entreno Con Quemador",
    "brand": "Woman",
    "cat": "preworkout",
    "emoji": "🔥",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/mercado-libre-19-8b254affdefda681b617120844691254-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Pre-entreno y quemador en uno, formulado para la mujer. Energía, enfoque y termogénesis en un solo producto. La fórmula total para el entrenamiento femenino.",
    "price": 35000,
    "flavors": [
      {
        "name": "Único",
        "stock": 0
      }
    ]
  },
  {
    "id": "wo_colageno",
    "name": "Colágeno + Hialurónico 454g",
    "brand": "Woman",
    "cat": "colageno",
    "emoji": "🦴",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/mercado-libre-25-25-8bc6cecba0522bc4d917120845307555-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Colágeno hidrolizado con ácido hialurónico y Vitamina C. El dúo perfecto para piel radiante, articulaciones fuertes y cabello brillante. Antiaging completo.",
    "price": 36000,
    "badge": "new",
    "badgeText": "Antiaging",
    "flavors": [
      {
        "name": "Limón",
        "stock": 1
      }
    ]
  },
  {
    "id": "wo_resv",
    "name": "Resveratrol By Pampita",
    "brand": "Woman",
    "cat": "vitamin",
    "emoji": "🍇",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/ml-productos-13-26145b9991b6bc458b17120845591197-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Resveratrol premium avalado por Pampita. Antioxidante natural para la piel, el corazón y el bienestar general. Formulación exclusiva con alta concentración activa.",
    "price": 22000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 4
      }
    ]
  },
  {
    "id": "wo_prot",
    "name": "Proteína By Pampita 454g",
    "brand": "Woman",
    "cat": "proteina",
    "emoji": "💪",
    "img": "https://images.weserv.nl/?url=www.farmacialeloir.com.ar/img/articulos/2024/08/imagen1_woman_by_pampita_whey_protein_imagen1.webp&w=400&output=webp&q=82",
    "desc": "Proteína del suero de leche pensada para la mujer que quiere resultados. Con colágeno hidrolizado y extracto de té verde. Tono muscular y bienestar en un scoop.",
    "price": 37000,
    "badge": "new",
    "badgeText": "By Pampita",
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 1
      }
    ]
  },
  {
    "id": "wo_protfit",
    "name": "Proteína Fit + Colágeno",
    "brand": "Woman",
    "cat": "proteina",
    "emoji": "💪",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/plantillaimagenes_mesa-de-trabajo-1-copia-5-8b28f220dbd369cc1c17452661791318-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Fórmula para la mujer activa: proteína de suero + colágeno hidrolizado + té verde. Tono muscular, articulaciones fuertes y piel radiante en un solo producto.",
    "price": 44900,
    "badge": "hot",
    "badgeText": "💃 Más Vendida",
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 6
      }
    ]
  },
  {
    "id": "ena_truemade",
    "name": "Whey Protein TrueMade 2,05 Lb",
    "brand": "ENA",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/TMWP2lb-Va_2.png?v=1769005779&width=800&w=400&output=webp&q=82",
    "desc": "Proteína de suero con colágeno hidrolizado y té verde. Fórmula integral para desarrollo muscular, articulaciones y bienestar general. La elección de los pros.",
    "price": 51000,
    "badge": "new",
    "badgeText": "Top ENA",
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 7
      },
      {
        "name": "Chocolate",
        "stock": 1
      },
      {
        "name": "Cookies",
        "stock": 5
      }
    ]
  },
  {
    "id": "ena_ultramass",
    "name": "Ultra Mass X 1,5 Kg",
    "brand": "ENA",
    "cat": "gainer",
    "emoji": "💪",
    "img": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/Umass1lb-Va.png?v=1764942067&width=800&w=400&output=webp&q=82",
    "desc": "Gainer de alto impacto para ganar masa muscular rápidamente. Alto contenido en proteínas y carbohidratos de calidad para un aumento de peso limpio y efectivo.",
    "price": 43000,
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 1
      },
      {
        "name": "Frutilla",
        "stock": 1
      },
      {
        "name": "Chocolate",
        "stock": 0
      }
    ]
  },
  {
    "id": "ena_100whey",
    "name": "100% Whey X 2 Libras",
    "brand": "ENA",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/100_W-FR.png?v=1769688238&width=800&w=400&output=webp&q=82",
    "desc": "Proteína de suero concentrada al 100%, sin agregados. Alta pureza y excelente relación precio-calidad. Ideal para ganar masa muscular y acelerar la recuperación.",
    "price": 44000,
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 5
      },
      {
        "name": "Chocolate",
        "stock": 3
      }
    ]
  },
  {
    "id": "ena_creat",
    "name": "Creatina Micronizada 300g",
    "brand": "ENA",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/CreaN300Mono.png?v=1765981838&width=800&w=400&output=webp&q=82",
    "desc": "Creatina micronizada de partícula ultrafina para máxima absorción. Disolución instantánea sin residuo. Se mezcla con cualquier bebida.",
    "price": 31000,
    "badge": "sale",
    "badgeText": "Stock alto",
    "flavors": [
      {
        "name": "Neutro",
        "stock": 25
      }
    ]
  },
  {
    "id": "ena_bcaa",
    "name": "BCAA 2:1:1 90 Cápsulas",
    "brand": "ENA",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/products/BCAA_211.jpg?v=1683514389&width=800&w=400&output=webp&q=82",
    "desc": "Aminoácidos ramificados en cápsulas. Ratio 2:1:1 ideal. Sin sabor, sin preparación. Para quienes prefieren suplementar sin mezclas ni sabores.",
    "price": 15800,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 1
      }
    ]
  },
  {
    "id": "ena_lcarnitina",
    "name": "L-Carnitina 1500 x60 Caps",
    "brand": "ENA",
    "cat": "aminoacido",
    "emoji": "🔥",
    "img": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/Carnitina_4.png?v=1739377333&width=800&w=400&output=webp&q=82",
    "desc": "L-Carnitina 1500mg por porción. Potencia la oxidación de ácidos grasos para usarlos como energía. Ideal para definición y pérdida de grasa.",
    "price": 19000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 1
      }
    ]
  },
  {
    "id": "ena_glut",
    "name": "Glutamina 300g En Pote",
    "brand": "ENA",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/products/Glutamine_Micronized.jpg?v=1738842769&width=800&w=400&output=webp&q=82",
    "desc": "Glutamina farmacéutica en pote hermético. Recuperación muscular óptima, reducción del daño oxidativo y refuerzo del sistema inmune post-entrenamiento.",
    "price": 30000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 4
      }
    ]
  },
  {
    "id": "ena_multi",
    "name": "Multivitamínico C/Cafeína 60 Comp",
    "brand": "ENA",
    "cat": "vitamin",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/products/MultiVitamin.jpg?v=1738842964&width=800&w=400&output=webp&q=82",
    "desc": "Complejo multivitamínico con cafeína añadida. Energía + micronutrientes en un solo comprimido. Ideal para tomar antes del entrenamiento para máximo rendimiento.",
    "price": 19500,
    "flavors": [
      {
        "name": "Comprimidos",
        "stock": 2
      }
    ]
  },
  {
    "id": "ena_cafeina",
    "name": "Cafeína 200mg",
    "brand": "ENA",
    "cat": "vitamin",
    "emoji": "☕",
    "img": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/products/Cafeina.jpg?v=1683513707&width=800&w=400&output=webp&q=82",
    "desc": "Cafeína anhidra pura 200mg. Máxima concentración y alerta mental. Potencia el rendimiento físico, aumenta la fuerza y reduce la percepción de fatiga.",
    "price": 12500,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 3
      }
    ]
  },
  {
    "id": "ena_enaccion",
    "name": "Enaccion Multivitamínico 30 Caps",
    "brand": "ENA",
    "cat": "vitamin",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=static.wixstatic.com/media/2df297_795469866b47421db862b096b4a450b6~mv2.png/v1/fill/w_555,h_396,al_c,lg_1,q_85,enc_avif,quality_auto/2df297_795469866b47421db862b096b4a450b6~mv2.png&w=400&output=webp&q=82",
    "desc": "Multivitamínico completo de ENA Profesionales. Vitaminas A, B, C, D, E + minerales esenciales. Soporte inmunológico y metabólico de alta calidad.",
    "price": 16000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 7
      }
    ]
  },
  {
    "id": "ena_energygel",
    "name": "Energy Gel 32g",
    "brand": "ENA",
    "cat": "hidratacion",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/EnargyGel6c.jpg?v=1731094910&width=800&w=400&output=webp&q=82",
    "desc": "Gel energético de carbohidratos de rápida absorción para consumo durante el entrenamiento. Textura suave, sin necesidad de agua. Boost de energía instantáneo.",
    "price": 2500,
    "flavors": [
      {
        "name": "Limón",
        "stock": 5
      },
      {
        "name": "Uva",
        "stock": 5
      }
    ]
  },
  {
    "id": "ena_truecol",
    "name": "TrueMade Whey Colágeno 771g",
    "brand": "ENA",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/TMWC_Ch.png?v=1737985937&width=800&w=400&output=webp&q=82",
    "desc": "Proteína del suero combinada con colágeno hidrolizado. La fórmula completa de ENA para atletas que buscan fuerza muscular y salud articular al mismo tiempo.",
    "price": 35000,
    "flavors": [
      {
        "name": "Único",
        "stock": 0
      }
    ]
  },
  {
    "id": "gen_7900",
    "name": "Proteína 7900 Pote",
    "brand": "Gentech",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlWNUkFYisqcuP1NWgOeYhxnJSMwZg-XRbig&s&w=400&output=webp&q=82",
    "desc": "Proteína de suero Gentech con 30g de proteína por porción. Fórmula enriquecida con vitaminas y minerales para máximo rendimiento y recuperación muscular.",
    "price": 49000,
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 3
      },
      {
        "name": "Chocolate",
        "stock": 1
      }
    ]
  },
  {
    "id": "gen_7900dp",
    "name": "Proteína 7900 Doypack",
    "brand": "Gentech",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=www.gentech.com.ar/web/image/product.product/4040/image_1024/%5BGTWPCHM00%5D%20WHEY%20PROTEIN%207900%20%28Chocolate%2C%201%20kg.%29?unique=37bde56&w=400&output=webp&q=82",
    "desc": "Misma fórmula premium en práctico doypack. 30g de proteína por porción en presentación económica y resistente al viaje.",
    "price": 49000,
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 1
      }
    ]
  },
  {
    "id": "gen_tx3",
    "name": "TX3 Black Cuts 60 Caps",
    "brand": "Gentech",
    "cat": "quemador",
    "emoji": "🌡️",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_618088-MLA73504786491_122023-F.webp&w=400&output=webp&q=82",
    "desc": "Termogénico de alta potencia con 3 fuentes de cafeína y extractos termogénicos. Black formula para máxima quema de grasa y energía sostenida.",
    "price": 22000,
    "badge": "hot",
    "badgeText": "Potente",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 5
      }
    ]
  },
  {
    "id": "gen_creat",
    "name": "Creatina 250g",
    "brand": "Gentech",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=www.gentech.com.ar/web/image/product.product/835/image_1024/%5BGTCPSN250%5D%20CREATINA%20MONOHIDRATO%20x%20250%20g?unique=f28600d&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato pura de Gentech. Alta calidad y precio accesible. Para ganar fuerza, potencia y resistencia muscular de forma segura y efectiva.",
    "price": 30000,
    "badge": "sale",
    "badgeText": "Buen precio",
    "flavors": [
      {
        "name": "Neutro",
        "stock": 7
      }
    ]
  },
  {
    "id": "gen_carnit",
    "name": "Carnitina Líquida 500ml",
    "brand": "Gentech",
    "cat": "aminoacido",
    "emoji": "🔥",
    "img": "https://images.weserv.nl/?url=www.gentech.com.ar/web/image/product.product/878/image_1024/%5BGTCLFB500%5D%20L-CARNITINA%20x%20500%20ML?unique=37bde56&w=400&output=webp&q=82",
    "desc": "L-Carnitina en forma líquida para absorción inmediata. 1500mg por porción. Potencia la movilización de grasas como combustible durante el ejercicio aeróbico.",
    "price": 15000,
    "flavors": [
      {
        "name": "Líquido",
        "stock": 1
      }
    ]
  },
  {
    "id": "gen_beautybar",
    "name": "Beauty Bar 45g",
    "brand": "Gentech",
    "cat": "barra",
    "emoji": "🍫",
    "img": "https://images.weserv.nl/?url=www.gentech.com.ar/web/image/product.product/10932/image_1024/%5BGTBBCH010%5D%20BEAUTY%20BAR%20GENTECH?unique=37bde56&w=400&output=webp&q=82",
    "desc": "Barra proteica premium formulada para la mujer. Alta proteína, sin azúcar refinada, con colágeno hidrolizado. Snack nutritivo y delicioso para cualquier momento.",
    "price": 1800,
    "badge": "new",
    "badgeText": "Mujer",
    "flavors": [
      {
        "name": "Único",
        "stock": 4
      }
    ]
  },
  {
    "id": "gen_ironbar",
    "name": "Iron Bar 46g",
    "brand": "Gentech",
    "cat": "barra",
    "emoji": "🍫",
    "img": "https://images.weserv.nl/?url=www.gentech.com.ar/web/image/product.product/4012/image_1024/%5BGTIBFR020%5D%20IRON%20BAR%20AFA%20BARRA%20PROTEICA%20%28Frutilla%2C%2020%20unidades%29?unique=37bde56&w=400&output=webp&q=82",
    "desc": "Barra proteica clásica de Gentech. Alta proteína y carbohidratos para recuperación energética. El snack gym de toda la vida, con el sabor y calidad Gentech.",
    "price": 0,
    "flavors": [
      {
        "name": "Único",
        "stock": 2
      }
    ]
  },
  {
    "id": "gen_lipolitic",
    "name": "Lipolitic CLA 1000 X 60 Caps",
    "brand": "Gentech",
    "cat": "quemador",
    "emoji": "🌡️",
    "img": "https://images.weserv.nl/?url=entresano.com/wp-content/uploads/2023/05/Diseno-sin-titulo-2023-05-17T121510.469.jpg&w=400&output=webp&q=82",
    "desc": "CLA 1000mg para reducción de grasa corporal y preservación de masa muscular. Efecto lipolítico natural sin estimulantes. Compatible con cualquier suplemento.",
    "price": 15500,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 1
      }
    ]
  },
  {
    "id": "xtr_bestwhey",
    "name": "Best Whey X 2 Lb",
    "brand": "Xtrenght",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/fotos_productos/117/BEST-WHEY-Protein-Banana-nuevo-(1).png&w=400&output=webp&q=82",
    "desc": "Proteína de suero de alta calidad. 22g de proteína por porción, enriquecida con vitaminas del complejo B. Excelente relación precio-rendimiento en 3 sabores únicos.",
    "price": 41900,
    "badge": "hot",
    "badgeText": "Top Ventas",
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 6
      },
      {
        "name": "Chocolate",
        "stock": 0
      },
      {
        "name": "Banana",
        "stock": 3
      }
    ]
  },
  {
    "id": "xtr_advanced",
    "name": "Whey Advanced 1 Kg",
    "brand": "Xtrenght",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/fotos_productos/123/Advanced-Banana.png&w=400&output=webp&q=82",
    "desc": "Proteína concentrada de suero en formato de 1 kg. Ideal para quien busca mayor cantidad por compra. Alta pureza proteica con sabores premium tropicales.",
    "price": 46500,
    "flavors": [
      {
        "name": "Frutilla",
        "stock": 7
      },
      {
        "name": "Chocolate",
        "stock": 3
      },
      {
        "name": "Vainilla",
        "stock": 1
      }
    ]
  },
  {
    "id": "xtr_whey3kg",
    "name": "Whey 3 Kg",
    "brand": "Xtrenght",
    "cat": "proteina",
    "emoji": "🏆",
    "img": "https://images.weserv.nl/?url=www.demusculos.com/web/wp-content/uploads/2024/02/best-whest-03-kg-ALEATORIO-xtrenght-01.jpg&w=400&output=webp&q=82",
    "desc": "El pote más grande de Xtrenght. 3 kg de proteína de suero concentrada para atletas que entrenan serio todos los días. El mejor precio por kilo de la marca.",
    "price": 125000,
    "badge": "sale",
    "badgeText": "3KG",
    "flavors": [
      {
        "name": "Frutilla",
        "stock": 3
      }
    ]
  },
  {
    "id": "xtr_creat250",
    "name": "Creatina 250g",
    "brand": "Xtrenght",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/user_ObjDVbDGZY/97/Creatine-250-500.png&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato de alta pureza de Xtrenght. Sin saborizantes artificiales ni aditivos. Solo creatina pura para máxima fuerza y potencia.",
    "price": 30000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 4
      }
    ]
  },
  {
    "id": "xtr_creat500",
    "name": "Creatina 500g",
    "brand": "Xtrenght",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/user_ObjDVbDGZY/127/Creatine-500.500.png&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato en formato 500g. El doble de rendimiento por una diferencia mínima de precio. Para el atleta que no quiere cortar su ciclo a mitad.",
    "price": 54500,
    "badge": "sale",
    "badgeText": "Mejor precio",
    "flavors": [
      {
        "name": "Neutro",
        "stock": 2
      }
    ]
  },
  {
    "id": "xtr_bcaapro",
    "name": "BCAA Pro 120 Caps",
    "brand": "Xtrenght",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/fotos_productos/101/Pro-bcaa.500.png&w=400&output=webp&q=82",
    "desc": "BCAAs en cápsulas de alta concentración. Ratio 2:1:1 con L-Glutamina añadida. Recuperación más rápida, menos dolor muscular y mayor síntesis proteica.",
    "price": 16500,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 4
      }
    ]
  },
  {
    "id": "xtr_bcaahydro",
    "name": "BCAA Pro Hydro 360g — Blue Razz",
    "brand": "Xtrenght",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/user_ObjDVbDGZY/103/HYDRO-BCAA-PRO--punch.500.png&w=400&output=webp&q=82",
    "desc": "BCAAs hidrolizados con electrolitos para hidratación y recuperación simultáneas. El intra-entreno definitivo para sesiones largas e intensas.",
    "price": 30000,
    "flavors": [
      {
        "name": "Blue Razz",
        "stock": 0
      }
    ]
  },
  {
    "id": "xtr_no",
    "name": "Óxido Nítrico 180 Caps",
    "brand": "Xtrenght",
    "cat": "aminoacido",
    "emoji": "🔴",
    "img": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/fotos_productos/100/Nitrox.500.png&w=400&output=webp&q=82",
    "desc": "Precursor de óxido nítrico con Arginina AKG y Citrulina Malato. Máxima vasodilatación, bomba muscular explosiva y mejor entrega de nutrientes al músculo.",
    "price": 18000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 3
      }
    ]
  },
  {
    "id": "xtr_nitrogain",
    "name": "Nitro Gain X 1,5 Kg — Cookies",
    "brand": "Xtrenght",
    "cat": "gainer",
    "emoji": "💪",
    "img": "https://images.weserv.nl/?url=xtrenght-nutrition.com/media/fotos_productos/47/xtrenght-nitrogain-prod-img-1-375x700.png&w=400&output=webp&q=82",
    "desc": "Gainer de alto valor calórico con proteínas y carbohidratos de calidad. Ideal para hardgainers que necesitan un superávit calórico para crecer. Sabor cookies premium.",
    "price": 34000,
    "flavors": [
      {
        "name": "Cookies",
        "stock": 1
      }
    ]
  },
  {
    "id": "gn_prework",
    "name": "Pre Work Gold 280g",
    "brand": "Gold Nutrition",
    "cat": "preworkout",
    "emoji": "🔥",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2021/03/19/pre-work_gold_nutrition.png&w=400&output=webp&q=82",
    "desc": "Pre-entreno Gold Nutrition con cafeína, beta-alanina y citrulina. Energía potente, enfoque mental y bomba muscular de alta calidad desde la primera toma.",
    "price": 22000,
    "flavors": [
      {
        "name": "Único",
        "stock": 1
      }
    ]
  },
  {
    "id": "gn_ripped",
    "name": "Whey Ripped X 2 Libras",
    "brand": "Gold Nutrition",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2022/12/07/whey_ripped_protein_gold_nutrition_proetina_quemadora_suplemento_deportivo_cafeina_carnitina_taurina.png&w=400&output=webp&q=82",
    "desc": "Proteína con quemadores integrados. La fórmula 2 en 1 de Gold Nutrition: proteína de suero + termogénicos para ganar músculo y perder grasa al mismo tiempo.",
    "price": 50000,
    "badge": "new",
    "badgeText": "2 en 1",
    "flavors": [
      {
        "name": "Chocolate",
        "stock": 1
      },
      {
        "name": "Vainilla",
        "stock": 2
      }
    ]
  },
  {
    "id": "gn_100whey",
    "name": "Whey 100% Protein 2 Lb",
    "brand": "Gold Nutrition",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2025/09/01/100_whey_protein_gold_nutrition_doypack_2lb-blend-2025.png&w=400&output=webp&q=82",
    "desc": "Proteína 100% concentrada de suero Gold. Excelente perfil de aminoácidos esenciales. Ideal para ganar masa muscular y acelerar la recuperación post-entrenamiento.",
    "price": 47000,
    "flavors": [
      {
        "name": "Chocolate",
        "stock": 4
      },
      {
        "name": "Vainilla",
        "stock": 3
      },
      {
        "name": "Frutilla",
        "stock": 2
      }
    ]
  },
  {
    "id": "gn_isogold",
    "name": "Iso Gold Protein 2Lb — Vainilla",
    "brand": "Gold Nutrition",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2020/12/14/iso_gold_protein_gold_nutrition_isolate_isolatada_hidrolizada_chocolate_vainilla.png&w=400&output=webp&q=82",
    "desc": "Aislado de proteína de suero de máxima pureza. Sin lactosa, sin grasa, sin carbohidratos innecesarios. Para los que buscan solo proteína pura de élite.",
    "price": 72000,
    "badge": "new",
    "badgeText": "Isolate",
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 1
      }
    ]
  },
  {
    "id": "gn_gainer",
    "name": "Gainer Gold 5 Lb — Vainilla",
    "brand": "Gold Nutrition",
    "cat": "gainer",
    "emoji": "💪",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2021/11/23/gainer-gold-nutrition-ganador-masa-muscular-mejor-doypack-5lb-home.png&w=400&output=webp&q=82",
    "desc": "Gainer de 5 libras para un mes de crecimiento masivo. Proteínas, carbohidratos complejos y grasas saludables en la proporción perfecta para máxima masa muscular.",
    "price": 51500,
    "badge": "sale",
    "badgeText": "5 LB",
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 1
      }
    ]
  },
  {
    "id": "gn_bcaa",
    "name": "BCAA 2000 30 Caps",
    "brand": "Gold Nutrition",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2021/05/31/new-aminoacidos_bcaa_2000_gold_nutrition.png&w=400&output=webp&q=82",
    "desc": "BCAAs 2000mg en cápsulas de rápida absorción. Ratio 2:1:1 para síntesis proteica máxima. Para recuperación acelerada y reducción del dolor muscular post-entrenamiento.",
    "price": 17500,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 3
      }
    ]
  },
  {
    "id": "gn_zma",
    "name": "ZMA 60 Caps",
    "brand": "Gold Nutrition",
    "cat": "magnesio",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2023/11/27/zma_gold_nutrition-zinc-magnesio-vitamina-b6.png&w=400&output=webp&q=82",
    "desc": "Zinc, Magnesio y B6 en cápsulas Gold Nutrition. Potencia la recuperación nocturna, los niveles hormonales naturales y la calidad del sueño profundo.",
    "price": 17300,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 3
      }
    ]
  },
  {
    "id": "gn_vitamin",
    "name": "Vitamin Gold 30 Caps",
    "brand": "Gold Nutrition",
    "cat": "vitamin",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2025/07/04/vitamin-gold-vitaminas-multivitaminico-multimineral-salud-gold-nutrition-gold-prime.png&w=400&output=webp&q=82",
    "desc": "Complejo multivitamínico Gold de alta absorción. Vitaminas A, B-complex, C, D y E + minerales. Un mes de soporte inmunológico y metabólico completo.",
    "price": 17500,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 2
      }
    ]
  },
  {
    "id": "gn_lipo",
    "name": "Lipo Gold Elite 60 Caps",
    "brand": "Gold Nutrition",
    "cat": "quemador",
    "emoji": "🌡️",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2024/04/08/lipo_gold_elite_ultra_concentrate_gold_nutrition_gold_prime.png&w=400&output=webp&q=82",
    "desc": "Termogénico de élite con 7 ingredientes activos. Cafeína, té verde, naranja amarga, pimienta negra y más. Alta potencia para acelerar la pérdida de grasa corporal.",
    "price": 20000,
    "badge": "hot",
    "badgeText": "Potente",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 3
      }
    ]
  },
  {
    "id": "gn_lipo_hc",
    "name": "Lipo Burn Hardcore 120 Caps",
    "brand": "Gold Nutrition",
    "cat": "quemador",
    "emoji": "🌡️",
    "img": "https://images.weserv.nl/?url=www.instagram.com/p/C2S26jQxcFU/?img_index=2&w=400&output=webp&q=82",
    "desc": "El termogénico más hardcore de Gold Nutrition. 120 cápsulas de máxima potencia quema-grasa. Para cuando necesitás resultados serios en el menor tiempo posible.",
    "price": 21000,
    "badge": "hot",
    "badgeText": "Hardcore",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 0
      }
    ]
  },
  {
    "id": "gn_omega3",
    "name": "Omega 3 Fish Oil 30 Caps",
    "brand": "Gold Nutrition",
    "cat": "magnesio",
    "emoji": "🐟",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2024/07/08/omega-3-fish-oil-capsulas-blandas-softgel-aceite-pescado-gold-nutrition-gold-prime.png&w=400&output=webp&q=82",
    "desc": "Aceite de pescado omega-3 de alta pureza. EPA y DHA en cápsulas blandas de fácil digestión. Para la salud cardiovascular, cerebral y reducción de inflamación.",
    "price": 32000,
    "flavors": [
      {
        "name": "Cápsulas blandas",
        "stock": 3
      }
    ]
  },
  {
    "id": "gn_testo",
    "name": "Testo Gold 120 Caps",
    "brand": "Gold Nutrition",
    "cat": "vitamin",
    "emoji": "💪",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2025/05/19/testo_gold_nutrition-testosterona-natural-booster.png&w=400&output=webp&q=82",
    "desc": "Estimulador de testosterona natural con Tribulus Terrestris, Zinc y Magnesio. Para hombres que buscan potenciar sus niveles hormonales naturalmente.",
    "price": 29800,
    "badge": "new",
    "badgeText": "Testo",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 4
      }
    ]
  },
  {
    "id": "gn_creat",
    "name": "Creatina X300g",
    "brand": "Gold Nutrition",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2025/11/03/creatina_monohidrato_gold_nutrition_doypack.png&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato Gold Nutrition. Alta calidad y precio accesible. Para ganar fuerza, potencia y resistencia muscular de forma segura.",
    "price": 29000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 2
      }
    ]
  },
  {
    "id": "gn_col200p",
    "name": "Colágeno Hidrolizado 200g Pote",
    "brand": "Gold Nutrition",
    "cat": "colageno",
    "emoji": "🦴",
    "img": "https://images.weserv.nl/?url=maesport.com.ar/wp-content/uploads/2024/05/540-grs-9.png&w=400&output=webp&q=82",
    "desc": "Colágeno hidrolizado de Gold Nutrition en pote. Péptidos de colágeno tipo I y III para regeneración de tejidos, articulaciones, piel y uñas.",
    "price": 25000,
    "flavors": [
      {
        "name": "Pote",
        "stock": 2
      }
    ]
  },
  {
    "id": "gn_col200d",
    "name": "Colágeno Hidrolizado 200g Doypack",
    "brand": "Gold Nutrition",
    "cat": "colageno",
    "emoji": "🦴",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/011/728/products/hydrolyzed-collagen-frutilla-200g-19c840121dd6f2c20f17496820151286-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Colágeno hidrolizado en doypack práctico. Alta concentración de péptidos de colágeno para salud articular, piel y cabello.",
    "price": 23500,
    "flavors": [
      {
        "name": "Doypack",
        "stock": 3
      }
    ]
  },
  {
    "id": "gn_vegetal",
    "name": "Vegetal Protein Isolate 2 Lb",
    "brand": "Gold Nutrition",
    "cat": "proteina",
    "emoji": "🌱",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2025/09/12/vegetal_protein_isolate_gold_nutrition_doypack_2lb.png&w=400&output=webp&q=82",
    "desc": "Proteína vegetal aislada 100% de origen vegetal. Sin lactosa, sin gluten, apta para veganos. Alta pureza proteica con excelente perfil de aminoácidos.",
    "price": 39500,
    "badge": "new",
    "badgeText": "Vegana",
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 1
      },
      {
        "name": "Chocolate",
        "stock": 3
      },
      {
        "name": "Neutro",
        "stock": 0
      }
    ]
  },
  {
    "id": "gn_hmb",
    "name": "HMB 60 Caps",
    "brand": "Gold Nutrition",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2020/08/31/hmb_gold_nutrition_suplemento.png&w=400&output=webp&q=82",
    "desc": "Beta-Hidroxi-Beta-Metilbutirato para preservar masa muscular durante corte o déficit calórico. Anti-catabólico natural de alta eficacia.",
    "price": 14000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 6
      }
    ]
  },
  {
    "id": "gn_no",
    "name": "N.O Gold Óxido Nítrico 195g",
    "brand": "Gold Nutrition",
    "cat": "aminoacido",
    "emoji": "🔴",
    "img": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2020/02/11/n.o_gold_nutrition_oxido_nitrico.png&w=400&output=webp&q=82",
    "desc": "Fórmula de óxido nítrico en polvo para máxima bomba muscular. Citrulina + Arginina para vasodilatación potente y entrega de nutrientes al músculo.",
    "price": 25000,
    "flavors": [
      {
        "name": "Único",
        "stock": 0
      }
    ]
  },
  {
    "id": "on_creat",
    "name": "Creatine Powder 300g",
    "brand": "ON (Optimum Nutrition)",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=www.optimumnutrition.com/cdn/shop/files/on-1160419_Image_01.png?v=1766415834&width=800&w=400&output=webp&q=82",
    "desc": "La creatina más reconocida del mundo. Patentada bajo sello Creapure® — el estándar de oro en pureza. Fabricada en Alemania. Aval de miles de atletas de élite global.",
    "price": 45000,
    "badge": "new",
    "badgeText": "🌍 Mundial",
    "flavors": [
      {
        "name": "Neutro",
        "stock": 8
      }
    ]
  },
  {
    "id": "resv_nad",
    "name": "Resveratrol NAD+",
    "brand": "Resveratrol NAD+",
    "cat": "vitamin",
    "emoji": "🍇",
    "img": "https://images.weserv.nl/?url=m.media-amazon.com/images/I/51WKLQqEUKL._AC_SX679_.jpg&w=400&output=webp&q=82",
    "desc": "Combinación única de Resveratrol y NAD+ para máxima protección celular y longevidad. Anti-aging de última generación para optimizar la energía mitocondrial.",
    "price": 35000,
    "badge": "new",
    "badgeText": "Anti-aging",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 1
      }
    ]
  },
  {
    "id": "nutrex_carnitine",
    "name": "L-Carnitine 1000 X 60 Comp",
    "brand": "Nutrex",
    "cat": "aminoacido",
    "emoji": "🔥",
    "img": "https://images.weserv.nl/?url=nutrex.com/cdn/shop/files/L-Carnitine-120-FR.png?v=1740145582&width=750&w=400&output=webp&q=82",
    "desc": "L-Carnitina 1000mg de Nutrex, marca importada de USA. Transporta ácidos grasos a la mitocondria para producir energía. Máxima eficacia en forma de comprimidos.",
    "price": 35000,
    "badge": "new",
    "badgeText": "Importado USA",
    "flavors": [
      {
        "name": "Comprimidos",
        "stock": 3
      }
    ]
  },
  {
    "id": "lap_nad",
    "name": "NAD 500 + Resveratrol 60 Caps",
    "brand": "LAPPIEL",
    "cat": "vitamin",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=mayorista.lappiel.com/wp-content/uploads/2025/09/placa-0-37821fa7dd6fbd916117513075432136-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "NAD+ 500mg con Resveratrol. La combinación más estudiada para activar las sirtuinas y potenciar la longevidad celular. Energía mitocondrial y protección antioxidante.",
    "price": 32000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 0
      }
    ]
  },
  {
    "id": "lap_omega3",
    "name": "Omega 3 con Omega 6 y 9",
    "brand": "LAPPIEL",
    "cat": "magnesio",
    "emoji": "🐟",
    "img": "https://images.weserv.nl/?url=mayorista.lappiel.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-22-at-1.57.52-PM.jpeg&w=400&output=webp&q=82",
    "desc": "La triple fórmula de ácidos grasos: Omega 3, 6 y 9 en proporciones óptimas. Soporte cardiovascular, cerebral y antiinflamatorio completo en una sola cápsula.",
    "price": 49500,
    "badge": "new",
    "badgeText": "Triple Omega",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 1
      }
    ]
  },
  {
    "id": "lap_ashwa",
    "name": "Ashwagandha con Vit C 60 Caps",
    "brand": "LAPPIEL",
    "cat": "vitamin",
    "emoji": "🌿",
    "img": "https://images.weserv.nl/?url=mayorista.lappiel.com/wp-content/uploads/2025/12/PLACA-0.jpg&w=400&output=webp&q=82",
    "desc": "Ashwagandha KSM-66® con Vitamina C. El adaptógeno más estudiado para reducir el cortisol, mejorar el sueño y aumentar la energía y vitalidad natural.",
    "price": 28000,
    "badge": "new",
    "badgeText": "Adaptógeno",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 2
      }
    ]
  },
  {
    "id": "lap_mag",
    "name": "Bisglicinato de Magnesio 60 Comp",
    "brand": "LAPPIEL",
    "cat": "magnesio",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=mayorista.lappiel.com/wp-content/uploads/2025/09/placa-0-bed5b7aaaaff42b56517512973517226-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "La forma quelada de magnesio de mayor absorción. Sin efecto laxante. Relajación muscular, reducción de calambres, mejor sueño profundo y concentración.",
    "price": 16000,
    "badge": "hot",
    "badgeText": "Alta absorción",
    "flavors": [
      {
        "name": "Comprimidos",
        "stock": 5
      }
    ]
  },
  {
    "id": "mer_blend",
    "name": "Whey Protein Blend 2,05 Lb",
    "brand": "Mervick",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_661811-MLA96870760129_102025-F.webp&w=400&output=webp&q=82",
    "desc": "Blend de proteínas de suero de alta calidad Mervick. Combinación de concentrado e hidrolizado para absorción escalonada y recuperación continua.",
    "price": 43000,
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 1
      },
      {
        "name": "Chocolate",
        "stock": 2
      },
      {
        "name": "Frutilla",
        "stock": 3
      }
    ]
  },
  {
    "id": "mer_proper",
    "name": "Whey Pro Performance 2 Lb",
    "brand": "Mervick",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_725012-MLA99452402346_112025-F.webp&w=400&output=webp&q=82",
    "desc": "Proteína de suero de rendimiento profesional Mervick. Formulada para atletas que buscan alto rendimiento con ingredientes de primera calidad.",
    "price": 39000,
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 0
      },
      {
        "name": "Chocolate",
        "stock": 2
      },
      {
        "name": "Frutilla",
        "stock": 3
      }
    ]
  },
  {
    "id": "mer_gainer",
    "name": "Gainer Complex 1,5 Kg — Vainilla",
    "brand": "Mervick",
    "cat": "gainer",
    "emoji": "💪",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-gainer-complex-vainilla-3-3lbs-1-b4967435a0d090767e17637296721389-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Gainer complejo de Mervick con proteínas, carbohidratos y grasas en la proporción ideal. Para ganar masa muscular de calidad sin exceso de grasa corporal.",
    "price": 31000,
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 0
      }
    ]
  },
  {
    "id": "mer_col",
    "name": "Colageno Sport 330g",
    "brand": "Mervick",
    "cat": "colageno",
    "emoji": "🦴",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-colageno-sport-hidrolizado-naranja-suplemento-330g-1-a189dbe32888cf205a17545051619293-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Colágeno hidrolizado deportivo Mervick con Magnesio y Vitamina C. Protege articulaciones, cartílagos y tendones bajo el estrés del entrenamiento intenso.",
    "price": 25000,
    "flavors": [
      {
        "name": "Frutilla",
        "stock": 0
      },
      {
        "name": "Naranja",
        "stock": 2
      }
    ]
  },
  {
    "id": "mer_lowcarb",
    "name": "Low Carbs Protein Bar 46g",
    "brand": "Mervick",
    "cat": "barra",
    "emoji": "🍫",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-whey-low-carb-protein-barra-sabor-frutos-rojos-12u-1-fa260f7421e9cc44b017544956585720-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "15g de proteína por barra. Sin azúcar agregada, cobertura de chocolate, textura suave y cremosa. El snack ideal para entre comidas sin culpa ni calorías vacías.",
    "price": 2000,
    "badge": "sale",
    "badgeText": "75 unidades",
    "flavors": [
      {
        "name": "Varios sabores",
        "stock": 75
      }
    ]
  },
  {
    "id": "mer_wheybar65",
    "name": "Whey Bar 65g",
    "brand": "Mervick",
    "cat": "barra",
    "emoji": "🍫",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-whey-protein-barra-proteina-frambuesa-chocolate-12u-1-a074f1cb81f58b182d17545084229856-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Barra de proteína whey de mayor tamaño. 20g de proteína con cobertura de chocolate premium. Textura esponjosa y sabor a tarta. Más proteína, más satisfacción.",
    "price": 2000,
    "badge": "sale",
    "badgeText": "39 unidades",
    "flavors": [
      {
        "name": "Varios sabores",
        "stock": 39
      }
    ]
  },
  {
    "id": "mer_wheybar46",
    "name": "Whey Bar 46g — Frutos Rojos",
    "brand": "Mervick",
    "cat": "barra",
    "emoji": "🍫",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/barritas-586fcb4b2f270f6af217558917015683-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Barra proteica clásica de Mervick en formato compacto. Sabor frutos rojos con cobertura de chocolate negro. Alto contenido proteico en tamaño pocket.",
    "price": 2000,
    "flavors": [
      {
        "name": "Frutos Rojos",
        "stock": 12
      }
    ]
  },
  {
    "id": "mer_creat",
    "name": "Creatina 300g",
    "brand": "Mervick",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-creatine-suplemento-creatina-micronizada-x-300grs-1-0af7e886f411d9107617544966078692-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato Mervick de alta pureza. Sin agregados artificiales. Para ganar fuerza, potencia y resistencia muscular de forma efectiva.",
    "price": 30000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 4
      }
    ]
  },
  {
    "id": "mer_sport",
    "name": "Sport Drink 1 Kg",
    "brand": "Mervick",
    "cat": "hidratacion",
    "emoji": "💧",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-sport-drink-maxima-hidratacion-naranja-mandarina-1kg-1-25af661ca83968044f17544992172155-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Bebida deportiva isotónica en polvo. Carbohidratos de rápida absorción + electrolitos para reposición energética durante entrenamientos de resistencia.",
    "price": 18000,
    "flavors": [
      {
        "name": "Mandarina Naranja",
        "stock": 3
      },
      {
        "name": "Pomelo",
        "stock": 1
      }
    ]
  },
  {
    "id": "idn_100whey",
    "name": "100% Whey Protein 1 Kg",
    "brand": "IDN",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2022/09/idn-cookies.jpg&w=400&output=webp&q=82",
    "desc": "Proteína de suero IDN en formato 1 kg. Alta concentración proteica por porción con el respaldo de una marca establecida en el mercado argentino.",
    "price": 36000,
    "flavors": [
      {
        "name": "Único",
        "stock": 0
      }
    ]
  },
  {
    "id": "idn_creat",
    "name": "Creatina 300g",
    "brand": "IDN",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2021/05/CREATINA-300-IDN.png&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato IDN. Calidad garantizada, precio accesible. Ideal para iniciantes o para completar un ciclo sin gastar de más.",
    "price": 28000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 3
      }
    ]
  },
  {
    "id": "idn_massfusion",
    "name": "Mass Fusion 1,5 Kg",
    "brand": "IDN",
    "cat": "gainer",
    "emoji": "💪",
    "img": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2018/11/mass-fusion.jpg&w=400&output=webp&q=82",
    "desc": "Gainer de calidad IDN con proteínas y carbohidratos balanceados. Para un aumento de masa muscular consistente y progresivo sin exceso de calorías vacías.",
    "price": 29000,
    "flavors": [
      {
        "name": "Cookies",
        "stock": 0
      },
      {
        "name": "Vainilla",
        "stock": 0
      },
      {
        "name": "Frutilla",
        "stock": 0
      }
    ]
  },
  {
    "id": "idn_leucina",
    "name": "L-Leucina 250g",
    "brand": "IDN",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2018/11/LEUCINE.png&w=400&output=webp&q=82",
    "desc": "L-Leucina pura, el aminoácido más anabólico de los BCAAs. Estimula directamente la síntesis proteica muscular (mTOR). Ideal para potenciar cualquier proteína.",
    "price": 33500,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 0
      }
    ]
  },
  {
    "id": "idn_carnitina",
    "name": "L-Carnitina 150g — Naranja",
    "brand": "IDN",
    "cat": "aminoacido",
    "emoji": "🔥",
    "img": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2018/11/l-carnitine-768x768.png&w=400&output=webp&q=82",
    "desc": "L-Carnitina en polvo sabor naranja de IDN. Transporta ácidos grasos a la mitocondria para producir energía. Sabor refrescante en polvo para tomar antes del cardio.",
    "price": 18000,
    "flavors": [
      {
        "name": "Naranja",
        "stock": 0
      }
    ]
  },
  {
    "id": "idn_bcaa",
    "name": "BCAA Ultimate 435g",
    "brand": "IDN",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2020/12/bcaa-ultimate-2.png&w=400&output=webp&q=82",
    "desc": "BCAAs en formato 435g con alta concentración por porción. Ratio optimizado para máxima síntesis proteica y recuperación muscular post-entrenamiento.",
    "price": 33000,
    "flavors": [
      {
        "name": "Único",
        "stock": 0
      }
    ]
  },
  {
    "id": "nmax_recov540",
    "name": "Recovery Drink 540g — Naranja",
    "brand": "Nutremax",
    "cat": "hidratacion",
    "emoji": "💧",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_775962-MLA93508034495_092025-F.webp&w=400&output=webp&q=82",
    "desc": "Bebida de recuperación post-entreno con proteínas, carbohidratos y electrolitos. Recupera los depósitos de glucógeno, repara músculo y rehidrata en una sola toma.",
    "price": 21000,
    "flavors": [
      {
        "name": "Naranja",
        "stock": 4
      }
    ]
  },
  {
    "id": "nmax_recov1500",
    "name": "Recovery Drink 1500g — Naranja",
    "brand": "Nutremax",
    "cat": "hidratacion",
    "emoji": "💧",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/003/189/220/products/20-off-en-2024-04-24t231528-412-5af016cb9cea23842a17157364979766-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Bebida de recuperación en formato grande. Un mes de recuperación post-entreno completa. Proteínas + carbohidratos + electrolitos para máxima regeneración muscular.",
    "price": 38000,
    "badge": "sale",
    "badgeText": "Mejor precio",
    "flavors": [
      {
        "name": "Naranja",
        "stock": 2
      }
    ]
  },
  {
    "id": "nmax_hmax600",
    "name": "Hydromax 600g",
    "brand": "Nutremax",
    "cat": "hidratacion",
    "emoji": "💧",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/003/189/220/products/20-off-en-2024-04-24t225618-358-630a850d3b2029fdd917157366932195-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Bebida isotónica Nutremax para reposición de electrolitos. Sin azúcar, con carbohidratos de rápida absorción. Para entrenamientos de 1+ hora de duración.",
    "price": 15500,
    "flavors": [
      {
        "name": "Pomelo",
        "stock": 1
      },
      {
        "name": "Manzana",
        "stock": 1
      }
    ]
  },
  {
    "id": "nmax_hmax1320",
    "name": "Hydromax 1320g — Manzana",
    "brand": "Nutremax",
    "cat": "hidratacion",
    "emoji": "💧",
    "img": "https://images.weserv.nl/?url=www.nutremax.com.ar/images/products/1767634277612348118.png&w=400&output=webp&q=82",
    "desc": "El mayor formato de Hydromax. Para atletas de alta exigencia que entrenan todos los días. Hidratación de élite sin interrupciones por falta de stock.",
    "price": 21000,
    "badge": "sale",
    "badgeText": "Gran formato",
    "flavors": [
      {
        "name": "Manzana",
        "stock": 3
      }
    ]
  },
  {
    "id": "nmax_cafeina_boost",
    "name": "Cafeína Booster 30 Serv",
    "brand": "Nutremax",
    "cat": "vitamin",
    "emoji": "☕",
    "img": "https://images.weserv.nl/?url=www.nutremax.com.ar/images/products/1669909137397658513.png&w=400&output=webp&q=82",
    "desc": "Cafeína en formato dosis precisa para 30 tomas. Energía inmediata sin calorías extras. Para los días que necesitás ese extra de concentración y rendimiento.",
    "price": 16000,
    "flavors": [
      {
        "name": "Único",
        "stock": 1
      }
    ]
  },
  {
    "id": "nmax_cafeina200",
    "name": "Cafeína 200mg 60 Serv",
    "brand": "Nutremax",
    "cat": "vitamin",
    "emoji": "☕",
    "img": "https://images.weserv.nl/?url=www.nutremax.com.ar/images/products/1724711172524698018.png&w=400&output=webp&q=82",
    "desc": "Cafeína anhidra 200mg en 60 servicios. El paquete más económico para mantener energía y foco durante entrenamientos y el día a día.",
    "price": 13500,
    "badge": "sale",
    "badgeText": "60 servicios",
    "flavors": [
      {
        "name": "Único",
        "stock": 2
      }
    ]
  },
  {
    "id": "nmax_prework",
    "name": "Pre Work 240g — Limonada",
    "brand": "Nutremax",
    "cat": "preworkout",
    "emoji": "🔥",
    "img": "https://images.weserv.nl/?url=www.nutremax.com.ar//images/products/162610047160061173.png&w=400&output=webp&q=82",
    "desc": "Pre-entreno integral con cafeína, beta-alanina y citrulina. Energía sostenida sin crashes, enfoque mental agudo y resistencia extendida. Sabor limonada refrescante.",
    "price": 28000,
    "badge": "hot",
    "badgeText": "Top",
    "flavors": [
      {
        "name": "Limonada",
        "stock": 4
      }
    ]
  },
  {
    "id": "nmax_glut",
    "name": "Glutamina 200g",
    "brand": "Nutremax",
    "cat": "aminoacido",
    "emoji": "🧬",
    "img": "https://images.weserv.nl/?url=www.nutremax.com.ar/images/products/1674561592349880733.png&w=400&output=webp&q=82",
    "desc": "Glutamina pura Nutremax de alta pureza. Para recuperación muscular óptima, salud intestinal y refuerzo del sistema inmune después del entrenamiento intenso.",
    "price": 21000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 2
      }
    ]
  },
  {
    "id": "grg_pancake",
    "name": "Pancakes Proteicos",
    "brand": "Granger",
    "cat": "barra",
    "emoji": "🥞",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/123/325/products/vainilla-11-6236aeed6b13bd6c3a16585849970594-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Mix para pancakes con proteína del suero de leche. Solo agregar agua o leche. Alto contenido proteico, bajo en grasas. El desayuno ideal para atletas.",
    "price": 15000,
    "flavors": [
      {
        "name": "Chocolate",
        "stock": 3
      },
      {
        "name": "Vainilla",
        "stock": 4
      }
    ]
  },
  {
    "id": "grg_cupcake",
    "name": "Cupcakes Proteicos Chocolate",
    "brand": "Granger",
    "cat": "barra",
    "emoji": "🧁",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/123/325/products/cupclae1-827a5a7c746379e14d17277176524280-1024-1024.gif&w=400&output=webp&q=82",
    "desc": "Mix para cupcakes con proteína. Preparación fácil y rápida. El snack proteico más delicioso del mercado para saciar el dulce sin salirse de la dieta.",
    "price": 15000,
    "flavors": [
      {
        "name": "Chocolate",
        "stock": 3
      }
    ]
  },
  {
    "id": "grg_omelette",
    "name": "Omelettes Proteicos 210g",
    "brand": "Granger",
    "cat": "barra",
    "emoji": "🍳",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/123/325/products/este1-7ac9fd227ceaa051f116428055775019-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Mix para omelettes proteicos de alto valor nutricional. La forma más sabrosa y original de aumentar el consumo de proteína en el desayuno.",
    "price": 16500,
    "flavors": [
      {
        "name": "Único",
        "stock": 2
      }
    ]
  },
  {
    "id": "grg_gelatina",
    "name": "Gelatina con Colágeno 150g",
    "brand": "Granger",
    "cat": "colageno",
    "emoji": "🦴",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/123/325/products/gelatina-96ba3eb5176a70070117682475303477-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Gelatina con colágeno hidrolizado. La forma más fácil y rica de consumir colágeno diariamente. Ideal para articulaciones, piel y cabello.",
    "price": 12000,
    "flavors": [
      {
        "name": "Único",
        "stock": 1
      }
    ]
  },
  {
    "id": "grg_citr",
    "name": "Citrato de Magnesio 144g",
    "brand": "Granger",
    "cat": "magnesio",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/123/325/products/01-2025-03-15t120118-025-1c5a75441bbda97b8117420509143883-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Citrato de magnesio en polvo Granger. Máxima biodisponibilidad para relajación muscular, reducción de calambres y mejor descanso nocturno.",
    "price": 14000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 2
      }
    ]
  },
  {
    "id": "hs_zmab",
    "name": "ZMA-B 120 Caps",
    "brand": "Hoch Sport",
    "cat": "magnesio",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=hochsport.com/wp-content/uploads/ZMAB_CARRUSEL_06.jpg&w=400&output=webp&q=82",
    "desc": "ZMA con el doble de cápsulas que la versión estándar. 4 meses de recuperación nocturna, soporte hormonal natural y calidad de sueño mejorada.",
    "price": 23000,
    "badge": "sale",
    "badgeText": "120 caps",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 13
      }
    ]
  },
  {
    "id": "hs_citr400",
    "name": "Citrato de Magnesio 400mg 60 Caps",
    "brand": "Hoch Sport",
    "cat": "magnesio",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=hochsport.com/wp-content/uploads/ESCALA-WEB_Magnesium-Citrate-400_Frente_800x800.png&w=400&output=webp&q=82",
    "desc": "Citrato de magnesio en cápsulas de 400mg de alta biodisponibilidad. Relajación muscular, calambres, sueño profundo y función nerviosa óptima.",
    "price": 16000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 5
      }
    ]
  },
  {
    "id": "hs_bioprot",
    "name": "Bio Prot Premium",
    "brand": "Hoch Sport",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=hochsport.com/wp-content/uploads/Bio-Prot-Chocolate_Frente_800x800.png&w=400&output=webp&q=82",
    "desc": "Proteína premium de Hoch Sport con fórmula avanzada de concentrado e hidrolizado. Para atletas de alto rendimiento que exigen lo mejor en cada porción.",
    "price": 68000,
    "badge": "new",
    "badgeText": "Premium",
    "flavors": [
      {
        "name": "Frutilla",
        "stock": 0
      },
      {
        "name": "Chocolate",
        "stock": 0
      }
    ]
  },
  {
    "id": "hs_extreme",
    "name": "Extreme Mass 1,5 Kg",
    "brand": "Hoch Sport",
    "cat": "gainer",
    "emoji": "💪",
    "img": "https://images.weserv.nl/?url=hochsport.com/wp-content/uploads/Extreme-Mass-1-5Chocolate_Frente_800x800.png&w=400&output=webp&q=82",
    "desc": "Gainer de alta densidad calórica para hardgainers extremos. El gainer más potente de Hoch Sport para subir de peso de manera rápida y efectiva.",
    "price": 20000,
    "flavors": [
      {
        "name": "Único",
        "stock": 0
      }
    ]
  },
  {
    "id": "nlab_bestwhey",
    "name": "Best Whey 2 Libras",
    "brand": "Nutrilab",
    "cat": "proteina",
    "emoji": "🥛",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/242/511/products/mesa-de-trabajo-1-2b5c7c8ee0e4e8828f17183133452909-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Proteína de suero Nutrilab de alta calidad. Fórmula balanceada para recuperación muscular y construcción de masa. Precio accesible sin comprometer la calidad.",
    "price": 38000,
    "flavors": [
      {
        "name": "Chocolate",
        "stock": 1
      }
    ]
  },
  {
    "id": "nlab_collagen",
    "name": "Collagen Flex Uva 300g",
    "brand": "Nutrilab",
    "cat": "colageno",
    "emoji": "🦴",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/242/511/products/pic-collagen-flex-1-fe2c4f313f411b652e17520003028904-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Colágeno con glucosamina y condroitina en polvo. Fórmula completa para la salud articular y movilidad. Sabor uva refrescante para tomar todos los días.",
    "price": 26500,
    "flavors": [
      {
        "name": "Uva",
        "stock": 1
      }
    ]
  },
  {
    "id": "nlab_thermo120",
    "name": "Thermogenic Max 120 Caps",
    "brand": "Nutrilab",
    "cat": "quemador",
    "emoji": "🌡️",
    "img": "https://images.weserv.nl/?url=scontent.ftuc1-2.fna.fbcdn.net/v/t1.6435-9/101029076_1399525610231947_5715364206862139392_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=7b2446&_nc_ohc=tspyWH25CSwQ7kNvwHiBSNB&_nc_oc=Adqq6Y19-xQdacEuZJiokLLJOphc9Bnnzr0QIr86bRgZeIDu0rwUbhH5znWNR_dLGhs&_nc_zt=23&_nc_ht=scontent.ftuc1-2.fna&_nc_gid=OQOywNu0RfJmSdqJwZ08gw&_nc_ss=7a30f&oh=00_AfzVXvMXC4zI0g83jKbg5Ctfa8sKV4DxVOg81ER8bn-FJA&oe=69EA18ED&w=400&output=webp&q=82",
    "desc": "Termogénico de 120 cápsulas para 2 meses de quema de grasa continua. Cafeína + extractos termogénicos naturales para acelerar el metabolismo.",
    "price": 16000,
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 1
      }
    ]
  },
  {
    "id": "nlab_thermo240",
    "name": "Termogenic Max 240 Comp",
    "brand": "Nutrilab",
    "cat": "quemador",
    "emoji": "🌡️",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/242/511/products/pic-termo-genic-1-fb60a3eca2acd3a99617521652427526-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "El termogénico de mayor duración del mercado. 240 comprimidos para más de 2 meses de tratamiento continuo. Termogénesis sostenida todo el día.",
    "price": 28000,
    "flavors": [
      {
        "name": "Comprimidos",
        "stock": 1
      }
    ]
  },
  {
    "id": "nlab_livefem",
    "name": "Live Fem Multivitamínico 150g",
    "brand": "Nutrilab",
    "cat": "vitamin",
    "emoji": "💊",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/242/511/products/pic-live-fem-1-adfaad01e528a62f2717521670876308-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Multivitamínico completo formulado para la mujer activa. Vitaminas, minerales y antioxidantes en las dosis específicas para las necesidades femeninas.",
    "price": 14000,
    "badge": "new",
    "badgeText": "💃 Mujer",
    "flavors": [
      {
        "name": "Polvo",
        "stock": 3
      }
    ]
  },
  {
    "id": "nfit_vegprot",
    "name": "Proteína Vegetal Isolate — Chocolate",
    "brand": "Nucleo Fit",
    "cat": "proteina",
    "emoji": "🌱",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/001/066/362/products/vegetal-protein_chocolate_sin-fondo-030877304ddb78207317594224312004-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Proteína vegetal aislada de Nucleo Fit. 100% origen vegetal, sin lactosa, sin gluten. Apta para veganos con alto perfil de aminoácidos. La proteína verde más completa.",
    "price": 37000,
    "badge": "new",
    "badgeText": "Vegana",
    "flavors": [
      {
        "name": "Chocolate",
        "stock": 1
      }
    ]
  },
  {
    "id": "ei45_iso",
    "name": "Iso Sport Bebida Isotónica 1190g",
    "brand": "EI45",
    "cat": "hidratacion",
    "emoji": "💧",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_993230-MLA99006997397_112025-F.webp&w=400&output=webp&q=82",
    "desc": "Bebida isotónica de alta gama en formato grande. Carbohidratos + electrolitos para mantener el rendimiento en entrenamientos prolongados de resistencia.",
    "price": 26500,
    "badge": "new",
    "badgeText": "1190g",
    "flavors": [
      {
        "name": "Limonada Rosa",
        "stock": 1
      }
    ]
  },
  {
    "id": "ei45_malto",
    "name": "Maltodextrina Fructosa",
    "brand": "EI45",
    "cat": "hidratacion",
    "emoji": "⚗️",
    "img": "https://images.weserv.nl/?url=encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJdmI3NxIuJHozzDRFnZ3wUmZQZhhTDgBVVg&s&w=400&output=webp&q=82",
    "desc": "Carbohidratos de rápida absorción para energía inmediata. Ideal pre y post-entrenamiento para maximizar el rendimiento y acelerar la recuperación de glucógeno.",
    "price": 2000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 4
      }
    ]
  },
  {
    "id": "que_choc",
    "name": "Barras de Chocolate",
    "brand": "Quelopaleo",
    "cat": "barra",
    "emoji": "🍫",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/002/590/783/products/file_000000000ae071f58f84e7bd426c2f00-1-5abfbab95a30166bdf17626388277213-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Chocolate artesanal sin TACC, sin azúcar refinada, endulzado naturalmente. Sin conservantes. El snack ideal para el día sin salirse de la dieta. Quedan geniales frías.",
    "price": 1800,
    "flavors": [
      {
        "name": "Blanco",
        "stock": 31
      },
      {
        "name": "Negro",
        "stock": 30
      }
    ]
  },
  {
    "id": "brava_bar",
    "name": "Barra Proteica 58g",
    "brand": "Brava",
    "cat": "barra",
    "emoji": "🍫",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/002/590/783/products/diseno-sin-titulo-2025-10-24t165016-399-0e11628a24b3f3303e17613354219949-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Barra proteica Brava de formato estándar. Alta proteína por barra con cobertura de chocolate y textura suave. El snack proteico para llevar a todas partes.",
    "price": 2000,
    "flavors": [
      {
        "name": "Único",
        "stock": 12
      }
    ]
  },
  {
    "id": "bros_bar",
    "name": "Barra Proteica 50g",
    "brand": "Bro's",
    "cat": "barra",
    "emoji": "🍫",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/2287/image_1024/%5B11927%5D%20Barra%20proteica%20bros%20unidad%2050gs%20chocolate%20%28Chocolate%20blanco%29?unique=534892d&w=400&output=webp&q=82",
    "desc": "Barra proteica Bro's. Textura crujiente con cobertura de chocolate. Alta proteína, sin azúcar añadida. En dos versiones de chocolate para todos los gustos.",
    "price": 1800,
    "flavors": [
      {
        "name": "Negro",
        "stock": 24
      },
      {
        "name": "Blanco",
        "stock": 20
      }
    ]
  },
  {
    "id": "mole_granola",
    "name": "Granola Proteica 400g",
    "brand": "Molé",
    "cat": "barra",
    "emoji": "🌾",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/001/499/676/products/recorte-79-f0e6e32fe77aa22e7017563184765122-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Granola artesanal con proteína agregada. Alta en fibra, baja en azúcar. Con avena, frutos secos y proteína del suero. Para desayunos y meriendas nutritivas.",
    "price": 15000,
    "flavors": [
      {
        "name": "Chocolate",
        "stock": 2
      },
      {
        "name": "Frutos Rojos",
        "stock": 3
      }
    ]
  },
  {
    "id": "mole_pancake",
    "name": "Pancakes Proteicos Vainilla",
    "brand": "Molé",
    "cat": "barra",
    "emoji": "🥞",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/001/499/676/products/recorte-78-489e9407c9cfc69f2117563178267914-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Mix para pancakes Molé con proteína de suero. Sabor vainilla artesanal. Preparación en minutos, nutrición completa. La merienda proteica más rica del mercado.",
    "price": 15000,
    "flavors": [
      {
        "name": "Vainilla",
        "stock": 2
      }
    ]
  },
  {
    "id": "mole_cereal",
    "name": "Barras de Cereal",
    "brand": "Molé",
    "cat": "barra",
    "emoji": "🍫",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/001/499/676/products/fuerza-e4aab5fc8bd11670da17577051435537-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Barras de cereal artesanales Molé. Naturales, sin conservantes, con cereales y frutas seleccionadas. El snack de energía para llevar a todas partes.",
    "price": 1600,
    "flavors": [
      {
        "name": "Único",
        "stock": 12
      }
    ]
  },
  {
    "id": "vit_cereal",
    "name": "Cereal Bar",
    "brand": "Vitalgy",
    "cat": "barra",
    "emoji": "🌾",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/002/268/228/products/barras-de-cereal-vitalgy-arandanos-y-almendras-caja-10-x-40g-1-69adeec6defc602b6617528531796997-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Barritas de cereal Vitalgy. Naturales, sin azúcar refinada, con cereales de alta calidad. Para un snack de energía saludable en cualquier momento del día.",
    "price": 1000,
    "badge": "sale",
    "badgeText": "Desde $1000",
    "flavors": [
      {
        "name": "Chocolate",
        "stock": 36
      },
      {
        "name": "Arándanos",
        "stock": 29
      },
      {
        "name": "Cacao",
        "stock": 17
      },
      {
        "name": "Manzana",
        "stock": 52
      },
      {
        "name": "Cajú",
        "stock": 30
      }
    ]
  },
  {
    "id": "mani_king",
    "name": "Maní King Original 350g",
    "brand": "Pasta de Maní",
    "cat": "barra",
    "emoji": "🥜",
    "img": "https://images.weserv.nl/?url=jumboargentina.vtexassets.com/arquivos/ids/866739-1200-auto?v=638824017897070000&width=1200&height=auto&aspect=true&w=400&output=webp&q=82",
    "desc": "Pasta de maní natural 100% sin azúcar, sin sal. Solo maní. Rica en proteínas y grasas saludables. El complemento perfecto para tostadas, pancakes o smoothies.",
    "price": 3300,
    "badge": "new",
    "badgeText": "Natural",
    "flavors": [
      {
        "name": "Original",
        "stock": 8
      }
    ]
  },
  {
    "id": "grows_bar",
    "name": "Grows Bar 46g",
    "brand": "Grows",
    "cat": "barra",
    "emoji": "🍫",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/005/510/154/products/chocolate-1-b71020166ef398093817327183795204-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Barra proteica Grows con textura suave y cobertura de chocolate. Alta proteína, bajo en azúcar. En varios sabores únicos para no aburrirse nunca del snack fitness.",
    "price": 1800,
    "flavors": [
      {
        "name": "Cookies & Cream",
        "stock": 0
      },
      {
        "name": "Coco",
        "stock": 0
      },
      {
        "name": "Banana",
        "stock": 0
      },
      {
        "name": "Frutilla",
        "stock": 0
      }
    ]
  },
  {
    "id": "sn_col210",
    "name": "Collageno Hidrolizado 210g",
    "brand": "Star Nutrition",
    "cat": "colageno",
    "emoji": "🦴",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/STANUT2030BCL.png?v=1719509920&width=1100&w=400&output=webp&q=82",
    "desc": "Colágeno hidrolizado tipo I y III en polvo. De rápida absorción para regenerar cartílagos, tendones y piel. Mezcla con agua o jugo.",
    "price": 23000,
    "flavors": [
      {
        "name": "Limón",
        "stock": 0
      },
      {
        "name": "Frutos Rojos",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_col_sport",
    "name": "Collagen Sport Naranja 360g",
    "brand": "Star Nutrition",
    "cat": "colageno",
    "emoji": "🦴",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/collagensport.png?v=1738085374&width=1100&w=400&output=webp&q=82",
    "desc": "Colágeno deportivo con Magnesio, Fósforo y Vitamina C. Para atletas de alta exigencia. Protege articulaciones y cartílagos del desgaste por entrenamiento intenso.",
    "price": 25000,
    "flavors": [
      {
        "name": "Naranja",
        "stock": 2
      }
    ]
  },
  {
    "id": "sn_col_plus",
    "name": "Collagen Plus Limón 360g",
    "brand": "Star Nutrition",
    "cat": "colageno",
    "emoji": "🦴",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/collagenplus.png?v=1738086248&width=1100&w=400&output=webp&q=82",
    "desc": "Colágeno + Vitamina C + Ácido Hialurónico. La fórmula antiaging más completa del mercado. Para piel, articulaciones, cabello y uñas en una sola toma diaria.",
    "price": 25000,
    "badge": "hot",
    "badgeText": "Antiaging",
    "flavors": [
      {
        "name": "Limón",
        "stock": 1
      }
    ]
  },
  {
    "id": "mxf_creat",
    "name": "Creatina Monohidrato 300g",
    "brand": "Max Force",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/005/542/784/products/creatinamonohidrato-tuttifrutti-1-0da0580cbca6627e9517597534068631-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato de Max Force. Calidad garantizada a precio accesible. Para quienes buscan los beneficios de la creatina sin gastar de más.",
    "price": 15000,
    "flavors": [
      {
        "name": "Neutro",
        "stock": 0
      }
    ]
  },
  {
    "id": "pp_pea",
    "name": "Protein Isolate Pea",
    "brand": "Protein Project",
    "cat": "proteina",
    "emoji": "🌱",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/001/725/864/products/protein_project_pea_protein_isolate_2lbs_unflavored_adn_palermo_web1-51c1e530574c18c5be16239512778522-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Aislado de proteína de arveja. 100% vegetal, sin lactosa, sin gluten, apta veganos. Completa en aminoácidos esenciales para una nutrición plant-based de élite.",
    "price": 30000,
    "badge": "new",
    "badgeText": "Plant-based",
    "flavors": [
      {
        "name": "Neutro",
        "stock": 0
      }
    ]
  },
  {
    "id": "pp_creat",
    "name": "Creatina 200g",
    "brand": "Protein Project",
    "cat": "creatina",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_922449-MLA99999907837_112025-F.webp&w=400&output=webp&q=82",
    "desc": "Creatina monohidrato de origen vegetal. Apta veganos. Para aumentar fuerza y potencia sin compromiso ético. La creatina para la comunidad plant-based.",
    "price": 13000,
    "badge": "new",
    "badgeText": "Vegana",
    "flavors": [
      {
        "name": "Neutro",
        "stock": 0
      }
    ]
  },
  {
    "id": "shk_varios",
    "name": "Shakers deportivos",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🥤",
    "img": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/Shaker-1_4f513345-ed58-4d2c-8f51-da1ebdb0588d.png?v=1756412538&width=1100&w=400&output=webp&q=82",
    "desc": "Vasos mezcladores deportivos con bola agitadora. Capacidad 500-700ml. Libre de BPA, fácil de limpiar. Para llevar tu proteína al gym sin complicaciones.",
    "price": 11000,
    "flavors": [
      {
        "name": "Star Simple",
        "stock": 3
      },
      {
        "name": "Gold Simple",
        "stock": 2
      },
      {
        "name": "C4 Simple",
        "stock": 2
      },
      {
        "name": "Generation Fit Doble",
        "stock": 1
      },
      {
        "name": "Universal Simple",
        "stock": 2
      },
      {
        "name": "ENA Simple",
        "stock": 4
      },
      {
        "name": "IDN Simple",
        "stock": 1
      },
      {
        "name": "Bioaction Simple",
        "stock": 2
      },
      {
        "name": "Star V8 Simple",
        "stock": 3
      }
    ]
  },
  {
    "id": "shk_everlast",
    "name": "Shaker Everlast con compartimento",
    "brand": "Everlast",
    "cat": "accesorio",
    "emoji": "🥤",
    "img": "https://images.weserv.nl/?url=m.media-amazon.com/images/I/41ljj4tKP5L._SY300_SX300_QL70_FMwebp_.jpg&w=400&output=webp&q=82",
    "desc": "Shaker premium Everlast con compartimento extra para suplementos en polvo. Sistema de cierre hermético anti-derrame. El shaker más completo del mercado.",
    "price": 15000,
    "flavors": [
      {
        "name": "Único",
        "stock": 2
      }
    ]
  },
  {
    "id": "shk_gold_doble",
    "name": "Shaker Gold Doble",
    "brand": "Gold Nutrition",
    "cat": "accesorio",
    "emoji": "🥤",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_893667-MLA99594894568_122025-F.webp&w=400&output=webp&q=82",
    "desc": "Shaker doble Gold Nutrition con dos compartimentos separados. Para llevar diferentes suplementos en un solo vaso. El compañero de gym más práctico.",
    "price": 11000,
    "flavors": [
      {
        "name": "Único",
        "stock": 0
      }
    ]
  },
  {
    "id": "lic_mini",
    "name": "Mini Licuadora Portátil",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_783264-MLA82479583759_022025-F.webp&w=400&output=webp&q=82",
    "desc": "Mini licuadora USB portátil recargable. Para preparar tus proteínas y batidos en cualquier lugar. Batería de larga duración y cuchillas de acero inoxidable.",
    "price": 16000,
    "badge": "new",
    "badgeText": "Portátil",
    "flavors": [
      {
        "name": "Único",
        "stock": 15
      }
    ]
  },
  {
    "id": "acc_guantes",
    "name": "Guantes para Gym",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🥊",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/6561/image_1024/%5B11569%5D%20Guante%20fitness%20drb%20full%20gym%20celeste%20%28xs%29?unique=e09afc4&w=400&output=webp&q=82",
    "desc": "Guantes de entrenamiento con refuerzo en palma. Protegen las manos, mejoran el agarre y reducen el dolor en ejercicios de halón y empuje. Talle ajustable.",
    "price": 15000,
    "badge": "hot",
    "badgeText": "Esencial",
    "flavors": [
      {
        "name": "Talle único",
        "stock": 13
      }
    ]
  },
  {
    "id": "acc_cinturon",
    "name": "Cinturón Lumbar",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🏋️",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.image/99/image_1024/cinturon%20lum%20ne.webp?unique=cca5d6a&w=400&output=webp&q=82",
    "desc": "Cinturón lumbar de apoyo para ejercicios de fuerza. Protege la zona lumbar durante sentadillas, peso muerto y press. Material de alta resistencia y ajuste velcro.",
    "price": 25500,
    "flavors": [
      {
        "name": "Talle M",
        "stock": 2
      }
    ]
  },
  {
    "id": "acc_mancuernas",
    "name": "Mancuernas Recubiertas",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🏋️",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/4043/image_1024/%5B10844%5D%20Mancuerna%20recubierta%203kg?unique=edd1e91&w=400&output=webp&q=82",
    "desc": "Mancuernas recubiertas en goma para ejercicios en casa o gym. Agarre cómodo y antideslizante. Protegen el piso y reducen el ruido. Disponibles en 3 pesos.",
    "price": 11000,
    "flavors": [
      {
        "name": "1 Kg — $11.000",
        "stock": 3
      },
      {
        "name": "2 Kg — $18.000",
        "stock": 2
      },
      {
        "name": "3 Kg — $25.000",
        "stock": 2
      }
    ]
  },
  {
    "id": "acc_straps",
    "name": "Straps Cinta para Levantamiento (par)",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🏋️",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.image/49/image_1024/D_NQ_NP_690793-MLA43173008342_082020-V.webp?unique=7fcf988&w=400&output=webp&q=82",
    "desc": "Correas de tela para levantamiento de pesas. Mejoran el agarre en jalones, remo y peso muerto. Evitan que el agarre limite el rendimiento en músculos grandes.",
    "price": 15000,
    "flavors": [
      {
        "name": "Par",
        "stock": 4
      }
    ]
  },
  {
    "id": "acc_calleras",
    "name": "Calleras de Cuero Talle Único (par)",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🥊",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/3696/image_1024/%5B11637%5D%20Callera%20ags%20full%20de%20cuero%20c-mu%C3%B1equera%20-%20talle%20unico?unique=324d3c0&w=400&output=webp&q=82",
    "desc": "Calleras de cuero genuino para halterofilia y crossfit. Protegen las palmas y optimizan el agarre en ejercicios de barra. Duración máxima con uso intensivo.",
    "price": 26000,
    "flavors": [
      {
        "name": "Talle único (par)",
        "stock": 3
      }
    ]
  },
  {
    "id": "acc_tobilleras",
    "name": "Tobilleras 1 Kg (par)",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🏃",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/7611/image_1024/%5B30349%5D%20Tobilleras%20con%20peso%20vinilicas%20pro%20ags%201kg%20%28par%29%20%20%28naranja%29?unique=263f72c&w=400&output=webp&q=82",
    "desc": "Tobilleras de peso de 1 kg el par. Para aumentar la resistencia en ejercicios de piernas y glúteos. Cierre ajustable y peso distribuido uniformemente.",
    "price": 20000,
    "flavors": [
      {
        "name": "1 Kg (par)",
        "stock": 2
      }
    ]
  },
  {
    "id": "acc_rueda",
    "name": "Rueda de Abdominales",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🏋️",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/7355/image_1024/%5B30328%5D%20Rueda%20abdominal%20doble%20estandar%20tsp?unique=f77be10&w=400&output=webp&q=82",
    "desc": "Rueda abdominal con rodamiento silencioso. Para trabajar el core completo desde casa o el gym. Con alfombrilla de rodillas incluida.",
    "price": 13500,
    "flavors": [
      {
        "name": "Única",
        "stock": 1
      }
    ]
  },
  {
    "id": "acc_botella",
    "name": "Botella Mamushka 3 en 1",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🍶",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_946566-MLA99615928592_122025-F.webp&w=400&output=webp&q=82",
    "desc": "Botella deportiva 3 en 1 con compartimentos para suplementos. Sistema triple que te permite llevar agua, proteína y cápsulas en una sola botella.",
    "price": 16000,
    "flavors": [
      {
        "name": "Cilíndrica",
        "stock": 5
      },
      {
        "name": "Hexagonal",
        "stock": 1
      }
    ]
  },
  {
    "id": "acc_botellasport",
    "name": "Botella Sport",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🍶",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_608099-MLA75199272882_032024-F.webp&w=400&output=webp&q=82",
    "desc": "Botella deportiva clásica. Libre de BPA, tapa de seguridad anti-derrame y boquilla ergonómica. Para hidratarte durante el entrenamiento sin interrupciones.",
    "price": 14000,
    "flavors": [
      {
        "name": "Única",
        "stock": 2
      }
    ]
  },
  {
    "id": "acc_grip",
    "name": "Hand Grip Regulable",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "✊",
    "img": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/898/402/products/8-e189e50369e1736f9d17555459513676-1024-1024.webp&w=400&output=webp&q=82",
    "desc": "Ejercitador de agarre regulable de 5 a 60 kg. Para fortalecer la muñeca, el antebrazo y los dedos. Ideal para escaladores, tenistas y atletas de fuerza.",
    "price": 10000,
    "flavors": [
      {
        "name": "Único",
        "stock": 2
      }
    ]
  },
  {
    "id": "acc_banda",
    "name": "Banda Circular de Latex",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🔄",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/8328/image_1024/Banda%20circular%20de%20latex%20krv%20tension%20baja%2050mm%20?unique=1803f15&w=400&output=webp&q=82",
    "desc": "Banda elástica circular para ejercicios de glúteos, piernas y rehabilitación. Tensión progresiva para diferentes niveles. 100% látex natural.",
    "price": 4000,
    "flavors": [
      {
        "name": "Tensión Baja",
        "stock": 1
      }
    ]
  },
  {
    "id": "acc_banda_tob",
    "name": "Banda Elástica con Tobilleras",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🔄",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/3733/image_1024/%5B10055%5D%20Banda%20elastica%20circular%20c-tobilleras%20ags%20t.media?unique=324d3c0&w=400&output=webp&q=82",
    "desc": "Banda elástica circular con tobilleras integradas para mayor comodidad. Ideal para ejercicios de glúteos, abductores y piernas con resistencia media.",
    "price": 13000,
    "flavors": [
      {
        "name": "Tensión Media",
        "stock": 1
      }
    ]
  },
  {
    "id": "acc_bolso35",
    "name": "Bolso Dribbling 35L",
    "brand": "Dribbling",
    "cat": "accesorio",
    "emoji": "🎒",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/7394/image_1024/%5B30052%5D%20Bolso%20deportivo%20drb%2035l%20?unique=bef0044&w=400&output=webp&q=82",
    "desc": "Bolso deportivo de 35 litros. Compartimentos múltiples para ropa, zapatillas y suplementos. Material resistente al agua, asas y correa regulable.",
    "price": 19000,
    "flavors": [
      {
        "name": "Único",
        "stock": 1
      }
    ]
  },
  {
    "id": "acc_bolso20",
    "name": "Bolso Dribbling 20L",
    "brand": "Dribbling",
    "cat": "accesorio",
    "emoji": "🎒",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/7393/image_1024/%5B30051%5D%20Bolso%20deportivo%20drb%2020l%20?unique=bef0044&w=400&output=webp&q=82",
    "desc": "Bolso deportivo compacto de 20 litros. Perfecto para llevar lo esencial al gym. Resistente al agua y con compartimento interior para tablet o ropa interior.",
    "price": 16000,
    "flavors": [
      {
        "name": "Único",
        "stock": 1
      }
    ]
  },
  {
    "id": "acc_rodillera",
    "name": "Rodillera DRB Voley (par)",
    "brand": "DRB",
    "cat": "accesorio",
    "emoji": "🦵",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/6990/image_1024/%5B10024%5D%20Rodillera%20drb%20voley%20clasic%20%28Kids%29?unique=11bbd7e&w=400&output=webp&q=82",
    "desc": "Rodillera clásica DRB para voley y entrenamiento funcional. Protege la rótula y amortigua los impactos. Talle adulto con material elástico transpirable.",
    "price": 16000,
    "flavors": [
      {
        "name": "Par adulto",
        "stock": 1
      }
    ]
  },
  {
    "id": "acc_munequera",
    "name": "Muñequera Elástica (par)",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "💪",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/3703/image_1024/%5B11684%5D%20Mu%C3%B1equera%20ags%20elastico%20%28por%20par%29?unique=324d3c0&w=400&output=webp&q=82",
    "desc": "Muñequeras elásticas para soporte durante el entrenamiento. Reducen el riesgo de lesión en press y curl. Ajuste preciso con velcro.",
    "price": 14500,
    "flavors": [
      {
        "name": "Elástica (par)",
        "stock": 2
      }
    ]
  },
  {
    "id": "acc_tope",
    "name": "Tope Barra Olímpica",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🏋️",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/3871/image_1024/%5B10160%5D%20Tope%20collar%20seguro%20para%20barra%20olimpica%20diametro%2050mm%20%28par%29?unique=3ff8cad&w=400&output=webp&q=82",
    "desc": "Tope para barra olímpica. Asegura los discos durante el entrenamiento. Compatible con barras estándar de 50mm. Material de alta resistencia.",
    "price": 17000,
    "flavors": [
      {
        "name": "Único",
        "stock": 1
      }
    ]
  },
  {
    "id": "acc_mini_batidora",
    "name": "Mini Batidora a Pilas",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "⚡",
    "img": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_675164-MLA87363005217_072025-F.webp&w=400&output=webp&q=82",
    "desc": "Mini batidora de mano a pilas para mezclar proteínas al instante. Compacta, silenciosa y fácil de limpiar. Para usar en casa, trabajo o hotel.",
    "price": 6000,
    "flavors": [
      {
        "name": "Única",
        "stock": 4
      }
    ]
  },
  {
    "id": "acc_dedos",
    "name": "Ejercitador de Dedos con Muñequera",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "✊",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/8558/image_1024/Ejercitador%20de%20dedos-mano%20-%20fortalecedor%20en%203%20intensidades%20.5%20%2C%207%20y%209kg%20-?unique=3ff8cad&w=400&output=webp&q=82",
    "desc": "Ejercitador de dedos y muñeca con soporte integrado. Para rehabilitación, escalada, guitarristas y atletas. Resistencia ajustable para cada dedo.",
    "price": 14000,
    "flavors": [
      {
        "name": "Único",
        "stock": 2
      }
    ]
  },
  {
    "id": "acc_vincha",
    "name": "Vincha con Pelota para Reflejos",
    "brand": "Varios",
    "cat": "accesorio",
    "emoji": "🥊",
    "img": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/8324/image_1024/Vincha%20con%20pelota%20para%20reflejos%20boxeo?unique=36cb9f5&w=400&output=webp&q=82",
    "desc": "Vincha para entrenamiento de reflejos de boxeo. Mejora la velocidad de reacción, coordinación ojo-mano y concentración. Para boxeo, MMA y entrenamiento funcional.",
    "price": 10000,
    "flavors": [
      {
        "name": "Único",
        "stock": 1
      }
    ]
  },
  {
    "id": "mx_shaker",
    "name": "Shaker MAXUP Simple",
    "brand": "MAXUP",
    "cat": "accesorio",
    "emoji": "🥤",
    "img": "https://images.weserv.nl/?url=i.ibb.co/VWNn63tk/IMG-20260324-182147752-MP-AE.jpg&w=400&output=webp&q=82",
    "desc": "El shaker oficial de MAXUP. Volumen 600ml con bola agitadora de acero. Logo MAXUP. Libre de BPA, fácil de limpiar. El shaker para el equipo MAXUP.",
    "price": 8000,
    "flavors": [
      {
        "name": "Blanco",
        "stock": 4
      },
      {
        "name": "Negro",
        "stock": 3
      }
    ]
  },
  {
    "id": "mx_scoop",
    "name": "Scoop 5g MAXUP",
    "brand": "MAXUP",
    "cat": "accesorio",
    "emoji": "🥄",
    "img": "https://images.weserv.nl/?url=i.ibb.co/PZMhvwMF/IMG-20260324-182652585-MP-AE.jpg&w=400&output=webp&q=82",
    "desc": "Scoop medidor oficial MAXUP de 5 gramos. Para dosificar creatina, glutamina o cualquier suplemento en polvo con precisión. Con logo MAXUP.",
    "price": 1500,
    "flavors": [
      {
        "name": "Único",
        "stock": 33
      }
    ]
  },
  {
    "id": "mx_bidon",
    "name": "Bidón 1L MAXUP",
    "brand": "MAXUP",
    "cat": "accesorio",
    "emoji": "🍶",
    "img": "",
    "desc": "Bidón deportivo oficial MAXUP de 1 litro. Para mantener la hidratación durante las sesiones largas. Material libre de BPA y cierre seguro anti-derrame.",
    "price": 10000,
    "flavors": [
      {
        "name": "Único",
        "stock": 2
      }
    ]
  },
  {
    "id": "mx_llavero",
    "name": "Llavero MAXUP",
    "brand": "MAXUP",
    "cat": "accesorio",
    "emoji": "🔑",
    "img": "https://images.weserv.nl/?url=i.ibb.co/mVVypHc0/IMG-20260324-182904529-HDR-AE.jpg&w=400&output=webp&q=82",
    "desc": "Llavero oficial MAXUP. El detalle para el equipo. Con logo y colores de la marca. El regalo ideal para los clientes fieles de MAXUP.",
    "price": 2500,
    "badge": "new",
    "badgeText": "Merchandising",
    "flavors": [
      {
        "name": "Único",
        "stock": 27
      }
    ]
  },
  {
    "id": "ge_omega3",
    "name": "Omega 3 1000mg 200 Caps",
    "brand": "Good Energy",
    "cat": "magnesio",
    "emoji": "🐟",
    "img": "https://images.weserv.nl/?url=scontent.ftuc1-2.fna.fbcdn.net/v/t1.6435-9/65161617_2391541677631485_995261020471558144_n.jpg?stp=dst-jpg_s640x640_tt6&_nc_cat=102&ccb=1-7&_nc_sid=7b2446&_nc_ohc=z2IMDEbawbUQ7kNvwGCMzSS&_nc_oc=AdraSLI5uPgl2FDNYo7DvYl9cRkAYngz76G7KoJ7gj7RBctMzPtvYdBRtIOuSBpfGrU&_nc_zt=23&_nc_ht=scontent.ftuc1-2.fna&_nc_gid=LvxinaFUKOZz2bYPvdJm3w&_nc_ss=7a30f&oh=00_AfzGWlcg3g04oAKV0vrjZCw1gbvneLoDoHWcDczl_CdYUw&oe=69EA3A2D&w=400&output=webp&q=82",
    "desc": "Omega 3 de alta concentración en el formato más conveniente. 200 cápsulas de 1000mg. Para 6 meses de protección cardiovascular, cerebral y antiinflamatoria.",
    "price": 75000,
    "badge": "sale",
    "badgeText": "200 Caps",
    "flavors": [
      {
        "name": "Cápsulas",
        "stock": 0
      }
    ]
  }
];
var PRODUCTS_ESTATICO = PRODUCTS.slice(); // Copia estática para el comparador


/* ════════════════════════════════════════════════════════
   RENDER ENGINE
════════════════════════════════════════════════════════ */
let activeCat = 'all';
let activeBrand = 'all';
let activeSearch = '';
let paginaActual = 1;
let ITEMS_POR_PAGINA = 30;
try{ var _pp = parseInt(localStorage.getItem('maxup_por_pagina')); if(_pp===30||_pp===50||_pp===100) ITEMS_POR_PAGINA=_pp; }catch(e){}
function setPorPagina(v){
  ITEMS_POR_PAGINA = parseInt(v) || 30;
  try{ localStorage.setItem('maxup_por_pagina', String(ITEMS_POR_PAGINA)); }catch(e){}
  paginaActual = 1;
  applyFilters(); syncURLIndex();
  var c = document.getElementById('catalogo');
  if(c) c.scrollIntoView({behavior:'smooth', block:'start'});
}

function syncURLIndex(){
  var p=new URLSearchParams();
  if(activeCat!=='all')p.set('cat',activeCat);
  if(activeBrand!=='all')p.set('marca',activeBrand);
  if(activeSearch)p.set('buscar',activeSearch);
  if(paginaActual>1)p.set('pag',paginaActual);
  if(typeof precioMax!=='undefined'&&precioMax<200000)p.set('precio',precioMax);
  var qs=p.toString();
  history.replaceState(null,'',location.pathname+(qs?'?'+qs:'')+(location.hash||''));
}

function readURLIndex(){
  var p=new URLSearchParams(location.search);
  if(p.get('cat')){activeCat=p.get('cat');var ft=document.getElementById('filtroTipo');if(ft)ft.value=activeCat;}
  if(p.get('marca')){activeBrand=p.get('marca').toLowerCase();var fb=document.getElementById('filtroBrand');if(fb)fb.value=activeBrand;}
  if(p.get('buscar')){activeSearch=p.get('buscar').toLowerCase().trim();var si=document.getElementById('searchInput');if(si)si.value=p.get('buscar');}
  if(p.get('pag'))paginaActual=parseInt(p.get('pag'))||1;
  if(p.get('precio')&&typeof precioMax!=='undefined'){precioMax=parseInt(p.get('precio'));var r=document.getElementById('precioRange');if(r)r.value=precioMax;var l=document.getElementById('precioVal');if(l)l.textContent=precioMax>=200000?'Sin límite':'$'+precioMax.toLocaleString('es-AR');}
  if(location.hash){var sec=document.querySelector(location.hash);if(sec)setTimeout(function(){sec.scrollIntoView({behavior:'smooth',block:'start'});},500);}
}

function fmt(n){ return '$' + n.toLocaleString('es-AR'); }


const SVG_PLACEHOLDERS = {
  "proteina":"", "creatina":"", "preworkout":"", "colageno":"",
  "vitamin":"", "magnesio":"", "aminoacido":"", "quemador":"", "gainer":"",
  "barra":"", "hidratacion":"", "accesorio":"", "indumentaria":"", "otros":""
};

function getFallbackImg(cat){
  const MAP = {
    proteina:   'https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/PWP-2Lb-Chocolate.png?v=1718218508&width=400',
    creatina:   'https://images.weserv.nl/?url=suplementsport.com.ar/wp-content/uploads/2024/07/Creatina-doy-pack-300-gr.jpg',
    preworkout: 'https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/TNT-Acai.png?v=1718218508&width=400',
    colageno:   'https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/Collagen-Plus-Limon.png?v=1718218508&width=400',
    vitamin:    'https://images.weserv.nl/?url=goldnutrition.com.ar/images/2025/07/04/vitamin-gold-vitaminas-multivitaminico-multimineral-salud-gold-nutrition-gold-prime.png',
    aminoacido: 'https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/MtorBCAA-270g-_2.png?v=1718218499&width=400',
    quemador:   'https://images.weserv.nl/?url=goldnutrition.com.ar/images/2024/04/08/lipo_gold_elite_ultra_concentrate_gold_nutrition_gold_prime.png',
    gainer:     'https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/MutantMass-1.5.png?v=1718218508&width=400',
    barra:      'https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-whey-protein-barra-proteina-frambuesa-chocolate-12u-1-a074f1cb81f58b182d17545084229856-1024-1024.webp',
    magnesio:   'https://images.weserv.nl/?url=goldnutrition.com.ar/images/2024/04/08/magnesio_citrato_gold_nutrition_gold_prime.png',
    accesorio:  'https://images.weserv.nl/?url=m.media-amazon.com/images/I/51WKLQqEUKL._AC_SX679_.jpg',
  };
  return SVG_PLACEHOLDERS[cat] || SVG_PLACEHOLDERS['proteina'];
}

function buildCard(p){
  const totalStock = p.flavors.reduce((s,f)=>s+f.stock,0);
  const multiFlav = p.flavors.length > 1;
  const badgeHtml = p.badge ? `<div class="prod-badge badge-${p.badge}">${p.badgeText||''}</div>` : '';

  // ── GALLERY: support "imgs" array OR legacy single "img" ──
  // In the PRODUCTS data you can use:
  //   "img": "url"           → single photo (backwards compatible)
  //   "imgs": ["url1","url2","url3"]  → gallery of multiple photos
  const imgList = p.imgs_gallery && p.imgs_gallery.length ? p.imgs_gallery : (p.imgs && Array.isArray(p.imgs) && p.imgs.length ? p.imgs : (p.img ? [p.img] : []));
  const hasMultiple = imgList.length > 1;
  const galleryId = `gal-${p.id}`;

  const slidesHtml = imgList.length
    ? imgList.map((src,i) => `
      <div class="gallery-slide">
        <img src="${src}" alt="${p.name}" loading="${i===0?'eager':'lazy'}" decoding="async" onerror="this.onerror=null;this.src=getFallbackImg('${p.cat}')" style="background:#1a1a2e">
      </div>`).join('')
    : `<div class="gallery-slide"><span class="prod-emoji">${p.emoji}</span></div>`;

  const arrowsHtml = hasMultiple ? `
    <button class="gal-btn gal-prev" onclick="galMove('${galleryId}',-1,event)" title="Anterior">‹</button>
    <button class="gal-btn gal-next" onclick="galMove('${galleryId}',1,event)" title="Siguiente">›</button>` : '';

  const dotsHtml = hasMultiple ? `
    <div class="gal-dots" id="${galleryId}-dots">
      ${imgList.map((_,i)=>`<button class="gal-dot${i===0?' active':''}" onclick="galGo('${galleryId}',${i},event)"></button>`).join('')}
    </div>` : '';

  const counterHtml = hasMultiple
    ? `<div class="gal-counter show" id="${galleryId}-counter">1 / ${imgList.length}</div>` : '';

  const firstFlavor = p.flavors[0];
  const initStock = firstFlavor.stock;
  const stockClass = initStock===0?'stock-zero':initStock<=3?'stock-low':'';
  const stockTxt = initStock===0?'Sin stock':`${initStock} unid.`;

  const flavorOpts = p.flavors.map(f=>{
    const tag = f.stock===0?' (Agotado)':f.stock<=3&&f.stock>0?` (Últimas ${f.stock})`:'';
    return `<option value="${f.name}" data-stock="${f.stock}" class="${f.stock===0?'agotado':''}">${f.name}${tag}</option>`;
  }).join('\n');

  const flavorSel = multiFlav ? `
    <div class="flavor-label">Sabor / Presentación</div>
    <select class="flavor-select" data-pid="${p.id}" onchange="onFlavorChange(this,'${p.id}')">
      ${flavorOpts}
    </select>` : `<input type="hidden" class="flavor-select" data-pid="${p.id}" value="${firstFlavor.name}">`;

  const addDisabled = initStock===0 ? 'disabled' : '';
  const addText = initStock===0 ? '❌ Agotado' : '🛒 Agregar';

  const isFav = _favoritos.indexOf(p.id) >= 0;
  return `
<div class="prod-card" data-id="${p.id}" data-cat="${p.cat}" data-brand="${(p.brand||'').toLowerCase()}"
     data-search="${(p.name+' '+p.brand+' '+p.cat+' '+p.flavors.map(f=>f.name).join(' ')).toLowerCase()}">
  ${badgeHtml}
  <button class="fav-btn${isFav?' active':''}" onclick="toggleFav('${p.id}',event)" title="Favorito">${isFav?'❤️':'🤍'}</button>
  <div class="prod-img-wrap">
    <div class="gallery-slides" id="${galleryId}" data-index="0" data-total="${imgList.length}"
         onclick="imgList_${p.id.replace(/-/g,'_')}&&imgList_${p.id.replace(/-/g,'_')}.length>0?openImgModal(imgList_${p.id.replace(/-/g,'_')}[document.getElementById('${galleryId}').dataset.index||0],'${p.name}'):null"
         style="cursor:${imgList.length?'pointer':'default'}">
      ${slidesHtml}
    </div>
    ${arrowsHtml}
    ${dotsHtml}
    ${counterHtml}
  </div>
  <div class="prod-body">
    <div class="prod-brand">${p.brand}</div>
    <div class="prod-name">${p.name}</div>
    <div id="reviews-${p.id}" style="min-height:20px">${renderReviews(p.id)}</div>
    <div class="prod-desc" id="desc-${p.id}">${p.desc}</div>
    <span class="read-more" onclick="toggleDesc('${p.id}',this)">Ver más ▾</span>
    ${flavorSel}
    <div class="prod-footer">
      <div>
        ${p.priceAnterior ? `<div style="font-size:.7rem;color:#888;text-decoration:line-through;margin-bottom:2px">Antes: ${fmt(p.priceAnterior)}</div>` : ''}
        <div class="prod-price-label" style="text-decoration:line-through;color:rgba(255,255,255,.35);font-size:.7rem">
          Tarjeta/QR/Débito: ${fmt(p.price_tarjeta || Math.round(p.price*1.08))}
        </div>
        <div class="prod-price-val${p.priceAnterior ? ' price-oferta' : ''}" id="price-${p.id}">${fmt(p.price)}</div>
        <div style="font-size:.65rem;color:#00C8FF;font-weight:700;letter-spacing:.06em;margin-top:1px">💵 EFECTIVO / TRANSF.</div>
      </div>
      <div class="prod-stock-info">
        <div class="prod-stock-num ${stockClass}" id="stock-${p.id}">${stockTxt}</div>
        <div class="prod-stock-lbl">en stock</div>
      </div>
    </div>
    <div class="prod-actions">
      <div class="qty-wrap">
        <button class="qty-btn qty-dec" data-pid="${p.id}" onclick="qtyDec('${p.id}')" disabled>−</button>
        <span class="qty-val" id="qty-${p.id}">1</span>
        <button class="qty-btn qty-inc" data-pid="${p.id}" onclick="qtyInc('${p.id}')" ${initStock<=1?'disabled':''}>+</button>
      </div>
      <button class="add-cart-btn" id="addbtn-${p.id}" ${addDisabled}
        onclick="addToCartById('${p.id}')">${addText}</button>
    </div>
    ${initStock===0 ? `<button class="avisar-stock-btn" onclick="abrirStockAlert('${p.id}')">🔔 Avisame cuando haya stock</button>` : ''}
  </div>
</div>`;
}

function renderAll(){
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = PRODUCTS.map(p => buildCard(p)).join('');
  poblarFiltroBrands();
  poblarComparador();
  setTimeout(makeCardsClickable, 100);
  // Aplicar paginación inmediatamente (sin scroll reveal para que funcione bien)
  applyFilters();
}

var activeOrden = 'default';

function applyFilters(){
  var _pp = document.getElementById('filtroPorPagina');
  if(_pp && _pp.value !== String(ITEMS_POR_PAGINA)) _pp.value = String(ITEMS_POR_PAGINA);
  const cards = Array.from(document.querySelectorAll('.prod-card'));
  // Filtrar
  let visibles = cards.filter(card => {
    let matchCat;
    if(activeCat==='favoritos') matchCat = _favoritos.indexOf(card.dataset.id)>=0;
    else if(activeCat==='magnesio'){
      matchCat = card.dataset.cat==='magnesio' || /magnesio|omega|zma/i.test(card.dataset.search);
    }
    else matchCat = activeCat==='all' || card.dataset.cat===activeCat;
    const matchBrand = activeBrand==='all' || card.dataset.brand===activeBrand;
    const matchSearch = !activeSearch || card.dataset.search.includes(activeSearch);
    return matchCat && matchBrand && matchSearch;
  });

  // ── #2 ORDENAR ──
  if(activeOrden !== 'default'){
    var grid = document.getElementById('productsGrid');
    visibles.sort(function(a,b){
      if(activeOrden==='precio-asc') return _cardPrice(a) - _cardPrice(b);
      if(activeOrden==='precio-desc') return _cardPrice(b) - _cardPrice(a);
      if(activeOrden==='nombre-asc') return (a.dataset.search||'').localeCompare(b.dataset.search||'');
      if(activeOrden==='nombre-desc') return (b.dataset.search||'').localeCompare(a.dataset.search||'');
      if(activeOrden==='stock-desc') return _cardStock(b) - _cardStock(a);
      return 0;
    });
    // Re-append in sorted order
    visibles.forEach(function(c){ grid.appendChild(c); });
  }

  // Reset página si cambió el filtro
  const totalPags = Math.ceil(visibles.length / ITEMS_POR_PAGINA);
  if(paginaActual > totalPags) paginaActual = 1;
  const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const fin = inicio + ITEMS_POR_PAGINA;
  // Mostrar/ocultar con animación (#9)
  cards.forEach(card => { card.style.display = 'none'; card.classList.remove('filter-anim'); });
  visibles.slice(inicio, fin).forEach(function(card, i){
    card.style.display = 'flex';
    card.style.opacity = '0';
    setTimeout(function(){ card.classList.add('filter-anim'); }, i * 30);
  });
  // Info búsqueda
  const info = document.getElementById('searchInfo');
  const noRes = document.getElementById('noResults');
  if(activeSearch){
    info.textContent = visibles.length>0 ? `${visibles.length} resultado${visibles.length!==1?'s':''} para "${activeSearch}"` : '';
    noRes.style.display = visibles.length===0 ? 'block' : 'none';
  } else {
    info.textContent = '';
    noRes.style.display = 'none';
  }
  // Renderizar paginación
  renderPaginacion(visibles.length);
  // ── #3 Chips activos ──
  renderFiltrosActivos();
}

// Helpers para ordenar
function _cardPrice(card){
  var el = card.querySelector('.prod-price-val');
  if(!el) return 0;
  return parseInt(el.textContent.replace(/[^0-9]/g,'')) || 0;
}
function _cardStock(card){
  var el = card.querySelector('.prod-stock-num');
  if(!el) return 0;
  return parseInt(el.textContent) || 0;
}

// ── #2 ORDENAR POR ──
function onOrdenFilter(val){
  activeOrden = val;
  paginaActual = 1;
  applyFilters();syncURLIndex();
}

// ── #3 CHIPS FILTROS ACTIVOS ──
var _tipoLabels = {favoritos:'❤️ Favoritos',proteina:'🥛 Proteinas',gainer:'💪 Gainers',creatina:'⚡ Creatinas',aminoacido:'🧬 Aminoacidos',vitamin:'💊 Vitaminas',magnesio:'🧲 Magnesio/Omega',preworkout:'🔥 Pre-Entreno',quemador:'🌡️ Quemadores',colageno:'🦴 Colageno',hidratacion:'💧 Hidratacion',barra:'🍫 Barras',accesorio:'🏋️ Accesorios',combo:'🎁 Combos'};
var _ordenLabels = {'precio-asc':'💲 Menor precio','precio-desc':'💲 Mayor precio','nombre-asc':'🔤 A-Z','nombre-desc':'🔤 Z-A','stock-desc':'📦 Mayor stock'};

function renderFiltrosActivos(){
  var cont = document.getElementById('filtrosActivos');
  if(!cont) return;
  var html = '';
  if(activeBrand!=='all'){
    var brandName = activeBrand.toUpperCase();
    var sel = document.getElementById('filtroBrand');
    if(sel){ var opt = sel.querySelector('option[value="'+activeBrand+'"]'); if(opt) brandName = opt.textContent; }
    html += '<span class="filtro-chip filtro-chip-marca" onclick="clearBrand()">'+brandName+' <span class="chip-x">✕</span></span>';
  }
  if(activeCat!=='all'){
    html += '<span class="filtro-chip" onclick="clearTipo()">'+(_tipoLabels[activeCat]||activeCat)+' <span class="chip-x">✕</span></span>';
  }
  if(activeOrden!=='default'){
    html += '<span class="filtro-chip filtro-chip-orden" onclick="clearOrden()">'+(_ordenLabels[activeOrden]||activeOrden)+' <span class="chip-x">✕</span></span>';
  }
  if(html){
    html += '<button class="filtro-limpiar" onclick="limpiarTodosFiltros()">LIMPIAR TODO</button>';
  }
  cont.innerHTML = html;
}

function clearBrand(){ activeBrand='all'; var s=document.getElementById('filtroBrand'); if(s)s.value='all'; paginaActual=1; applyFilters();syncURLIndex(); }
function clearTipo(){ activeCat='all'; var s=document.getElementById('filtroTipo'); if(s)s.value='all'; paginaActual=1; applyFilters();syncURLIndex(); }
function clearOrden(){ activeOrden='default'; var s=document.getElementById('filtroOrden'); if(s)s.value='default'; paginaActual=1; applyFilters();syncURLIndex(); }
function limpiarTodosFiltros(){
  activeBrand='all'; activeCat='all'; activeOrden='default'; activeSearch=''; paginaActual=1;
  var fb=document.getElementById('filtroBrand'); if(fb)fb.value='all';
  var ft=document.getElementById('filtroTipo'); if(ft)ft.value='all';
  var fo=document.getElementById('filtroOrden'); if(fo)fo.value='default';
  var si=document.getElementById('searchInput'); if(si)si.value='';
  // Restaurar grid si estaban combos
  var cs=document.getElementById('combosSection'); if(cs)cs.style.display='none';
  var pg=document.getElementById('productsGrid'); if(pg)pg.style.display='';
  applyFilters();syncURLIndex();
}

function irAPagina(n){
  paginaActual = n;syncURLIndex();
  applyFilters();
  document.getElementById('catalogo').scrollIntoView({behavior:'smooth', block:'start'});
}

function renderPaginacion(total){
  let cont = document.getElementById('paginacion');
  if(!cont){
    cont = document.createElement('div');
    cont.id = 'paginacion';
    cont.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:32px 0 16px;align-items:center';
    const grid = document.getElementById('productsGrid');
    grid.parentNode.insertBefore(cont, grid.nextSibling);
  }
  const totalPags = Math.ceil(total / ITEMS_POR_PAGINA);
  if(totalPags <= 1){ cont.innerHTML = ''; return; }
  let html = '';
  // Botón anterior
  if(paginaActual > 1)
    html += `<button onclick="irAPagina(${paginaActual-1})" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#aaa;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:.85rem">← Anterior</button>`;
  // Páginas
  for(let i=1; i<=totalPags; i++){
    const activo = i===paginaActual;
    html += `<button onclick="irAPagina(${i})" style="background:${activo?'var(--cyan)':'rgba(255,255,255,.08)'};border:1px solid ${activo?'var(--cyan)':'rgba(255,255,255,.15)'};color:${activo?'#000':'#aaa'};width:38px;height:38px;border-radius:8px;cursor:pointer;font-weight:${activo?'700':'400'};font-size:.9rem">${i}</button>`;
  }
  // Botón siguiente
  if(paginaActual < totalPags)
    html += `<button onclick="irAPagina(${paginaActual+1})" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#aaa;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:.85rem">Siguiente →</button>`;
  // Info
  html += `<span style="color:#666;font-size:.8rem;margin-left:8px">Página ${paginaActual} de ${totalPags} · ${total} productos</span>`;
  cont.innerHTML = html;
}

function setCat(cat){
  activeCat = cat;
  paginaActual = 1;
  var sel = document.getElementById('filtroTipo');
  if(sel) sel.value = cat;
  applyFilters();syncURLIndex();
}

// Ir a una categoría desde los accesos rápidos de la home
function irACategoria(cat){
  var sel = document.getElementById('filtroTipo');
  if(sel) sel.value = cat;
  if(typeof onTipoFilter === 'function') onTipoFilter(cat);
  var cont = document.getElementById('catalogo');
  if(cont) cont.scrollIntoView({behavior:'smooth', block:'start'});
}

function onTipoFilter(val){
  if(val==='combo'){ mostrarCombos(); return; }
  activeCat = val;
  paginaActual = 1;
  // Ocultar combos si estaban visibles
  var cs = document.getElementById('combosSection');
  if(cs) cs.style.display = 'none';
  var pg = document.getElementById('productsGrid');
  if(pg) pg.style.display = '';
  applyFilters();syncURLIndex();
}

function onBrandFilter(val){
  activeBrand = val;
  paginaActual = 1;
  applyFilters();syncURLIndex();
}

function poblarFiltroBrands(){
  var sel = document.getElementById('filtroBrand');
  if(!sel) return;
  var marcas = [...new Set(PRODUCTS.map(function(p){return p.brand}).filter(Boolean))].sort();
  sel.innerHTML = '<option value="all">FILTRA POR MARCA (' + PRODUCTS.length + ')</option>';
  marcas.forEach(function(m){
    var count = PRODUCTS.filter(function(p){ return p.brand === m; }).length;
    var opt = document.createElement('option');
    opt.value = m.toLowerCase();
    opt.textContent = m + ' (' + count + ')';
    sel.appendChild(opt);
  });
  // ── #10 Contadores por tipo ──
  poblarContadoresTipo();
}

function poblarContadoresTipo(){
  var sel = document.getElementById('filtroTipo');
  if(!sel) return;
  var catCounts = {};
  PRODUCTS.forEach(function(p){ var c = p.cat || 'otro'; catCounts[c] = (catCounts[c]||0) + 1; });
  Array.from(sel.options).forEach(function(opt){
    if(opt.value === 'all'){ opt.textContent = 'FILTRA POR TIPO (' + PRODUCTS.length + ')'; return; }
    if(opt.value === 'favoritos'){ opt.textContent = '❤️ Favoritos (' + (_favoritos ? _favoritos.length : 0) + ')'; return; }
    if(opt.value === 'combo'){ opt.textContent = '🎁 Combos (' + (typeof COMBOS !== 'undefined' ? COMBOS.length : 0) + ')'; return; }
    var count = catCounts[opt.value] || 0;
    // Magnesio incluye omega/zma
    if(opt.value === 'magnesio'){
      count = PRODUCTS.filter(function(p){ return p.cat==='magnesio' || /magnesio|omega|zma/i.test(p.name); }).length;
    }
    var label = opt.textContent.replace(/\s*\(\d+\)$/, '');
    opt.textContent = label + ' (' + count + ')';
  });
}

document.getElementById('searchInput').addEventListener('focus',()=>{
  document.getElementById('catalogo').scrollIntoView({behavior:'smooth', block:'start'});
});
document.getElementById('searchInput').addEventListener('input',e=>{
  activeSearch = e.target.value.toLowerCase().trim();
  activeCat = 'all';
  activeBrand = 'all';
  activeOrden = 'default';
  paginaActual = 1;
  var selTipo = document.getElementById('filtroTipo');
  var selBrand = document.getElementById('filtroBrand');
  var selOrden = document.getElementById('filtroOrden');
  if(selTipo) selTipo.value = 'all';
  if(selBrand) selBrand.value = 'all';
  if(selOrden) selOrden.value = 'default';
  applyFilters();syncURLIndex();
  renderSearchSuggest(e.target.value);
});
// Cerrar sugerencias al perder foco (con delay para que el click registre) y con Escape
document.getElementById('searchInput').addEventListener('blur', function(){ setTimeout(cerrarSugerencias, 180); });
document.getElementById('searchInput').addEventListener('keydown', function(e){ if(e.key==='Escape') cerrarSugerencias(); });

// ── SUGERENCIAS DE BÚSQUEDA (autocompletado) ──
function renderSearchSuggest(q){
  var box = document.getElementById('searchSuggest');
  if(!box) return;
  q = (q||'').toLowerCase().trim();
  if(q.length < 2){ box.style.display='none'; box.innerHTML=''; return; }
  var matches = (typeof PRODUCTS!=='undefined'?PRODUCTS:[]).filter(function(p){
    var stock = p.flavors ? p.flavors.reduce(function(s,f){return s+f.stock;},0) : 0;
    if(stock<=0) return false;
    return ((p.name||'')+' '+(p.brand||'')+' '+(p.cat||'')).toLowerCase().indexOf(q) >= 0;
  }).slice(0, 6);
  if(!matches.length){
    box.innerHTML = '<div class="ss-empty">Sin coincidencias con "'+q+'"</div>';
    box.style.display = 'block';
    return;
  }
  box.innerHTML = matches.map(function(p){
    var img = (p.imgs && p.imgs[0]) || p.img || '';
    return '<div class="ss-item" onmousedown="event.preventDefault()" onclick="abrirDesdeSugerencia(\''+String(p.id).replace(/'/g,"\\'")+'\')">'
      + '<div class="ss-thumb">' + (img?'<img src="'+img+'" alt="" loading="lazy">':'<span>'+(p.emoji||'💊')+'</span>') + '</div>'
      + '<div class="ss-info"><div class="ss-name">'+p.name+'</div><div class="ss-brand">'+(p.brand||'')+'</div></div>'
      + '<div class="ss-price">'+fmt(p.price)+'</div>'
      + '</div>';
  }).join('');
  box.style.display = 'block';
}
function cerrarSugerencias(){ var b=document.getElementById('searchSuggest'); if(b){ b.style.display='none'; b.innerHTML=''; } }
function abrirDesdeSugerencia(pid){ cerrarSugerencias(); if(typeof openProdModal==='function') openProdModal(pid); }

/* ── FLAVOR ── */
function getProduct(id){ return PRODUCTS.find(p=>p.id===id); }
function getSelectedFlavor(pid){
  const sel = document.querySelector(`.flavor-select[data-pid="${pid}"]`);
  if(!sel) return null;
  const p = getProduct(pid);
  return p.flavors.find(f=>f.name===sel.value) || p.flavors[0];
}

function onFlavorChange(sel, pid){
  const p = getProduct(pid);
  const flav = p.flavors.find(f=>f.name===sel.value);
  if(!flav) return;
  const stock = flav.stock;
  const stockEl = document.getElementById(`stock-${pid}`);
  const addBtn  = document.getElementById(`addbtn-${pid}`);
  const decBtn  = document.querySelector(`.qty-dec[data-pid="${pid}"]`);
  const incBtn  = document.querySelector(`.qty-inc[data-pid="${pid}"]`);
  const qtyEl   = document.getElementById(`qty-${pid}`);
  const priceEl = document.getElementById(`price-${pid}`);

  // Actualizar stock display
  const stockClass = stock===0?'sin-stock':stock<=3?'stock-low':'';
  if(stockEl) {
    stockEl.textContent = stock===0?'Sin stock':`${stock} unid.`;
    stockEl.className = `prod-stock-num ${stockClass}`;
  }

  // Actualizar precio si el sabor tiene precio diferente (futuro)
  // Por ahora mantener precio base

  // Actualizar imagen si el sabor tiene imagen propia
  if (p.imgs && p.imgs[sel.value]) {
    const galleryEl = document.querySelector(`#gal-${pid} .gallery-slides`);
    if (galleryEl) {
      const firstImg = galleryEl.querySelector('img');
      if (firstImg) firstImg.src = p.imgs[sel.value];
    }
    // También actualizar img principal
    const mainImg = document.querySelector(`#gal-${pid}`);
    if (mainImg) {
      const imgs = mainImg.querySelectorAll('img');
      if (imgs.length > 0) imgs[0].src = p.imgs[sel.value];
    }
  }

  // Actualizar botones
  if(addBtn)  { addBtn.disabled  = stock===0; addBtn.textContent = stock===0?'Sin stock':'🛒 Agregar'; }
  if(decBtn)  { decBtn.disabled  = true; }
  if(incBtn)  { incBtn.disabled  = stock<=1; }
  if(qtyEl)   { qtyEl.textContent= '1'; }
}

/* ── QTY ── */
function qtyDec(pid){
  const el = document.getElementById(`qty-${pid}`);
  let v = parseInt(el.textContent);
  if(v>1){ v--; el.textContent=v; }
  document.querySelector(`.qty-dec[data-pid="${pid}"]`).disabled = v<=1;
  const flav = getSelectedFlavor(pid);
  document.querySelector(`.qty-inc[data-pid="${pid}"]`).disabled = v>=(flav?flav.stock:99);
}
function qtyInc(pid){
  const el = document.getElementById(`qty-${pid}`);
  const flav = getSelectedFlavor(pid);
  const max = flav ? flav.stock : 99;
  let v = parseInt(el.textContent);
  if(v<max){ v++; el.textContent=v; }
  document.querySelector(`.qty-inc[data-pid="${pid}"]`).disabled = v>=max;
  document.querySelector(`.qty-dec[data-pid="${pid}"]`).disabled = v<=1;
}

/* ── DESC TOGGLE ── */
function toggleDesc(id, btn){
  const el = document.getElementById(`desc-${id}`);
  const expanded = el.classList.toggle('expanded');
  btn.textContent = expanded ? 'Ver menos ▴' : 'Ver más ▾';
}

/* ── IMAGE MODAL (simple) ── */
function openImgModal(src, name){
  if(!src) return;
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:20px';
  ov.innerHTML=`<img src="${src}" alt="${name}" style="max-width:90%;max-height:90vh;object-fit:contain;border-radius:10px">`;
  ov.onclick=()=>ov.remove();
  document.body.appendChild(ov);
}

/* ════════════════════════════════════════════════════════
   CART
════════════════════════════════════════════════════════ */
// ── FAVORITOS ────────────────────────────────────────────────
let _favoritos = [];
function loadFavoritos(){
  try{ const s=localStorage.getItem('maxup_favs'); if(s) _favoritos=JSON.parse(s); }catch(e){_favoritos=[];}
}
function saveFavoritos(){ try{localStorage.setItem('maxup_favs',JSON.stringify(_favoritos));}catch(e){} }
function toggleFav(pid, e){
  if(e){e.stopPropagation();e.preventDefault();}
  const idx = _favoritos.indexOf(pid);
  if(idx>=0) _favoritos.splice(idx,1);
  else _favoritos.push(pid);
  saveFavoritos();
  // Actualizar botón
  const card = document.querySelector(`.prod-card[data-id="${pid}"]`);
  if(card){
    const btn = card.querySelector('.fav-btn');
    if(btn){
      const isFav = _favoritos.indexOf(pid)>=0;
      btn.classList.toggle('active',isFav);
      btn.textContent = isFav?'❤️':'🤍';
    }
  }
  // Si estamos en tab favoritos, re-filtrar
  if(activeCat==='favoritos') applyFilters();
}
loadFavoritos();

let cart = [];

function loadCart(){
  try{ const s=localStorage.getItem('maxup_cart_v3'); if(s) cart=JSON.parse(s); }catch(e){cart=[];}
  renderCart(); updateBadge();
}
function saveCart(){ try{localStorage.setItem('maxup_cart_v3',JSON.stringify(cart));}catch(e){} }

function addToCartById(pid){
  const p = getProduct(pid);
  const flav = getSelectedFlavor(pid);
  if(!flav || flav.stock===0) return;
  const qty = parseInt(document.getElementById(`qty-${pid}`).textContent)||1;
  const key = `${pid}__${flav.name}`;
  const existing = cart.find(i=>i.key===key);
  if(existing){
    existing.qty = Math.min(existing.qty+qty, flav.stock);
  } else {
    const imgList = p.imgs_gallery && p.imgs_gallery.length ? p.imgs_gallery : (p.imgs && Array.isArray(p.imgs) && p.imgs.length ? p.imgs : (p.img ? [p.img] : []));
    cart.push({key, pid, name:p.name, brand:p.brand, flavor:flav.name, price:p.price, emoji:p.emoji, img:imgList[0]||'', maxStock:flav.stock, qty});
  }
  saveCart(); renderCart(); updateBadge();
  const btn = document.getElementById(`addbtn-${pid}`);
  btn.classList.add('added'); btn.textContent='✅ Agregado';
  setTimeout(()=>{ btn.classList.remove('added'); btn.textContent='🛒 Agregar'; }, 1800);
  showToast(`${p.emoji} ${p.name} (${flav.name}) agregado`);
  const qtyEl = document.getElementById(`qty-${pid}`);
  qtyEl.textContent='1';
  document.querySelector(`.qty-dec[data-pid="${pid}"]`).disabled=true;
  const maxS = flav.stock;
  document.querySelector(`.qty-inc[data-pid="${pid}"]`).disabled = maxS<=1;
}

function changeCartQty(key,delta){
  const item = cart.find(i=>i.key===key);
  if(!item) return;
  item.qty = Math.max(1, Math.min(item.qty+delta, item.maxStock));
  saveCart(); renderCart(); updateBadge();
}
function removeFromCart(key){ cart=cart.filter(i=>i.key!==key); saveCart(); renderCart(); updateBadge(); }
function clearCart(){ cart=[]; saveCart(); renderCart(); updateBadge(); }
function cartTotal(){
  return cart.reduce(function(s,i){
    var precio = i.price * i.qty;
    if(i.combo) precio = Math.round(precio * (1 - COMBO_DESCUENTO/100));
    return s + precio;
  },0);
}
function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }

// ── DESCUENTO POR MONTO ──────────────────────────────────────
const DESCUENTOS_MONTO = [
  { minimo: 270000, pct: 0.15, label: '15% off por compra +$270.000' },
  { minimo: 220000, pct: 0.10, label: '10% off por compra +$220.000' },
  { minimo: 100000, pct: 0.05, label: '5% off por compra +$100.000'  },
];
function getDescuentoMonto(total){
  for(const d of DESCUENTOS_MONTO){ if(total >= d.minimo) return d; }
  return null;
}
function cartTotalConDescuento(){
  const base = cartTotal();
  const desc = getDescuentoMonto(base);
  return desc ? Math.round(base * (1 - desc.pct)) : base;
}

// ── CUPÓN DE DESCUENTO ──────────────────────────────────────
const CUPONES = {
  'MAXUP5':    { pct: 0.05, label: '5% off con cupón MAXUP5' },
  'MAXUP10':   { pct: 0.10, label: '10% off con cupón MAXUP10' },
  'PRIMERA15': { pct: 0.15, label: '15% off primera compra' },
};
let _cuponActivo = null;

function aplicarCupon(){
  const input = document.getElementById('cuponInput');
  const msg = document.getElementById('cuponMsg');
  const code = (input.value||'').trim().toUpperCase();
  if(!code){ msg.style.display='none'; return; }
  const cupon = CUPONES[code];
  if(cupon){
    _cuponActivo = { code, ...cupon };
    msg.style.display='block';
    msg.style.background='rgba(0,230,118,.08)';
    msg.style.border='1px solid rgba(0,230,118,.25)';
    msg.style.color='#00E676';
    msg.innerHTML='🎉 <strong>'+cupon.label+'</strong> aplicado!';
    input.disabled=true;
    input.style.opacity='.5';
  } else {
    _cuponActivo = null;
    msg.style.display='block';
    msg.style.background='rgba(255,61,61,.08)';
    msg.style.border='1px solid rgba(255,61,61,.25)';
    msg.style.color='#FF3D3D';
    msg.textContent='❌ Cupón inválido';
    setTimeout(()=>{ msg.style.display='none'; },2500);
  }
  renderCart(); updateBadge();
}

function quitarCupon(){
  _cuponActivo = null;
  const input = document.getElementById('cuponInput');
  const msg = document.getElementById('cuponMsg');
  if(input){ input.disabled=false; input.style.opacity='1'; input.value=''; }
  if(msg) msg.style.display='none';
  renderCart(); updateBadge();
}

function renderCart(){
  const container = document.getElementById('cartItemsContainer');
  const empty = document.getElementById('cartEmpty');
  const summary = document.getElementById('cartSummary');
  container.querySelectorAll('.cart-item').forEach(e=>e.remove());
  if(cart.length===0){ empty.style.display='block'; summary.style.display='none'; renderComboSuggest(); renderCartUpsell(); return; }
  empty.style.display='none'; summary.style.display='block';
  const base = cartTotal();
  const desc = getDescuentoMonto(base);
  let totalTrasMonto = desc ? Math.round(base*(1-desc.pct)) : base;
  // Aplicar cupón sobre el total (después del descuento por monto)
  let totalFinal = totalTrasMonto;
  if(_cuponActivo){
    totalFinal = Math.round(totalTrasMonto * (1 - _cuponActivo.pct));
  }
  // Mostrar descuento aplicado
  let totalHTML = '';
  if(desc || _cuponActivo){
    totalHTML = `<span style="text-decoration:line-through;font-size:1.2rem;color:#888">${fmt(base)}</span> <span style="color:var(--cyan)">${fmt(totalFinal)}</span>`;
    document.getElementById('cartTotal').innerHTML = totalHTML;
  } else {
    document.getElementById('cartTotal').textContent = fmt(base);
  }
  // Mostrar barra de progreso hacia próximo descuento
  const promoBar = document.getElementById('promoBar');
  if(promoBar){
    const siguiente = DESCUENTOS_MONTO.slice().reverse().find(d => d.minimo > base);
    if(desc && desc.pct===0.15){
      promoBar.innerHTML = `<span style="color:var(--cyan)">🎉 ${desc.label} aplicado!</span>`;
    } else if(siguiente){
      const falta = siguiente.minimo - base;
      const pct_sig = siguiente.pct*100 + '%';
      promoBar.innerHTML = `<span style="color:#aaa">Agregá <strong style="color:var(--cyan)">${fmt(falta)}</strong> más y obtenés <strong style="color:var(--pink)">${pct_sig} de descuento</strong></span>`;
    } else {
      promoBar.innerHTML = '';
    }
  }
  cart.forEach(item=>{
    const el=document.createElement('div'); el.className='cart-item';
    const k = item.key.replace(/'/g,"\\'");
    const placeholder = SVG_PLACEHOLDERS[getProduct(item.pid)?.cat] || SVG_PLACEHOLDERS['proteina'];
    el.innerHTML=`
      <div class="ci-thumb">
        <img src="${item.img || placeholder}" 
             onerror="this.onerror=null;this.src='${placeholder}'"
             alt="${item.name}">
      </div>
      <div class="ci-info">
        <div class="ci-name">${item.name}${item.combo?'<span style="background:rgba(0,230,118,.15);color:#00E676;padding:1px 6px;border-radius:10px;font-size:.6rem;font-weight:700;margin-left:6px;vertical-align:middle">COMBO -'+COMBO_DESCUENTO+'%</span>':''}</div>
        <div class="ci-detail">${item.brand} · ${item.flavor}</div>
        <div class="ci-price-row">
          <div class="ci-qty-wrap">
            <button class="ci-qty-btn" onclick="changeCartQty('${k}',-1)">−</button>
            <span class="ci-qty-val">${item.qty}</span>
            <button class="ci-qty-btn" onclick="changeCartQty('${k}',1)">+</button>
          </div>
          <span class="ci-subtotal">${item.combo?'<span style="text-decoration:line-through;color:#666;font-size:.75em;margin-right:4px">'+fmt(item.price*item.qty)+'</span>'+fmt(Math.round(item.price*item.qty*(1-COMBO_DESCUENTO/100))):fmt(item.price*item.qty)}</span>
          <button class="ci-remove" onclick="removeFromCart('${k}')">✕</button>
        </div>
      </div>`;
    container.appendChild(el);
  });
  renderComboSuggest();
  renderCartUpsell();
}

// ── SUGERENCIA DE COMBO: "armá un combo y ahorrá" según lo que hay en el carrito ──
function sugerirCombo(){
  if(!cart || !cart.length) return null;
  var combos;
  try{ combos = COMBOS; }catch(e){ return null; } // COMBOS se define más abajo; evitar error si se llama temprano
  if(!combos || !combos.length) return null;
  var cats = {};
  cart.forEach(function(i){ var p=getProduct(i.pid); if(p && p.cat) cats[p.cat]=true; });
  var mejor = null;
  combos.forEach(function(combo){
    var cubiertos = 0, faltan = [];
    combo.slots.forEach(function(s){ if(cats[s.cat]) cubiertos++; else faltan.push(s); });
    // Sirve si ya tenés al menos 1 parte y te falta al menos 1
    if(cubiertos >= 1 && faltan.length >= 1){
      if(!mejor || cubiertos > mejor.cubiertos || (cubiertos===mejor.cubiertos && faltan.length < mejor.faltan.length)){
        mejor = { combo: combo, cubiertos: cubiertos, faltan: faltan };
      }
    }
  });
  return mejor;
}

function renderComboSuggest(){
  var box = document.getElementById('comboSuggest');
  if(!box) return;
  var s = sugerirCombo();
  if(!s){ box.innerHTML=''; return; }
  var faltanTxt = s.faltan.map(function(sl){ return sl.label.replace(/^Eleg[ií] tus? /i,''); }).join(' + ');
  box.innerHTML = '<div class="combo-suggest">'
    + '<div class="combo-suggest-txt">🎁 ¡Estás a un paso del <strong>'+s.combo.nombre+'</strong>!<br>'
    + 'Sumá <strong>'+faltanTxt+'</strong> y armalo en combo con <strong>'+COMBO_DESCUENTO+'% OFF</strong>.</div>'
    + '<button class="combo-suggest-btn" onclick="irACombos()">🎁 Armar combo</button>'
    + '</div>';
}

function irACombos(){
  closeCart();
  if(typeof mostrarCombos==='function') mostrarCombos();
  var sec = document.getElementById('combosSection');
  if(sec) setTimeout(function(){ sec.scrollIntoView({behavior:'smooth', block:'start'}); }, 100);
}

// ── UPSELL: "Completá tu compra" (sugerencias de 1 toque en el carrito) ──
function renderCartUpsell(){
  var box = document.getElementById('cartUpsell');
  if(!box) return;
  if(!cart.length){ box.innerHTML=''; return; }
  var inCart = {}; cart.forEach(function(i){ inCart[i.pid]=true; });
  // Complementos baratos primero (accesorios, barras, hidratación, creatina, vitaminas)
  var prefCats = {accesorio:1, barra:1, hidratacion:1, creatina:1, vitamin:1};
  var cands = (typeof PRODUCTS!=='undefined'?PRODUCTS:[]).filter(function(p){
    if(inCart[p.id]) return false;
    var stock = p.flavors ? p.flavors.reduce(function(s,f){return s+f.stock;},0) : 0;
    return stock>0 && p.price>0;
  });
  cands.sort(function(a,b){
    var pa = prefCats[a.cat]?0:1, pb = prefCats[b.cat]?0:1;
    if(pa!==pb) return pa-pb;
    return a.price-b.price;
  });
  var sug = cands.slice(0,3);
  if(!sug.length){ box.innerHTML=''; return; }
  box.innerHTML = '<div class="cart-upsell-title">✨ Completá tu compra</div>' +
    sug.map(function(p){
      var img = (p.imgs && p.imgs[0]) || p.img || '';
      return '<div class="cart-upsell-item">' +
        '<div class="cu-thumb">' + (img?'<img src="'+img+'" alt="'+p.name+'" loading="lazy">':'<span>'+(p.emoji||'💊')+'</span>') + '</div>' +
        '<div class="cu-info"><div class="cu-name">'+p.name+'</div><div class="cu-price">'+fmt(p.price)+'</div></div>' +
        '<button class="cu-add" onclick="addToCartById(\''+p.id+'\')">+ Agregar</button>' +
        '</div>';
    }).join('');
}

function updateBadge(){
  const b = document.getElementById('cartBadge');
  const c = cartCount();
  if(c===0){ b.classList.add('hidden'); } else {
    b.classList.remove('hidden'); b.textContent=c;
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  }
  // #8 — Actualizar badge en nav
  var nb = document.getElementById('navCartCount');
  if(nb){ if(c===0){ nb.classList.add('hidden'); } else { nb.classList.remove('hidden'); nb.textContent=c; } }
}

function openCart(){ document.getElementById('cartOverlay').classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart(){ document.getElementById('cartOverlay').classList.remove('open'); document.body.style.overflow=''; }
// ── DESCUENTO BIENVENIDA ─────────────────────────────────────
var _esClienteNuevo = false;
var DESCUENTO_BIENVENIDA = 0.02;

function verificarClienteNuevo() {
  var phone = document.getElementById('clientPhone').value.trim();
  if (!phone || phone.length < 8) return;
  var API_URL = 'https://script.google.com/macros/s/AKfycbwUujcSoSyBWLLla-LOdovJmTDan-DP3O9Gp0k_MSupTHGEPB55TCZqllvGmEK6vlk/exec';
  fetch(API_URL + '?accion=es_nuevo&telefono=' + encodeURIComponent(phone))
    .then(function(r){ return r.json(); })
    .then(function(data) {
      _esClienteNuevo = data.ok && data.esNuevo;
      var box = document.getElementById('descBienvenidaBox');
      if (box) box.style.display = _esClienteNuevo ? 'block' : 'none';
      buildMiniList(); // actualizar total con descuento
    }).catch(function(){ _esClienteNuevo = false; });
}

function cartTotalConBienvenida() {
  var base = cartTotalConDescuento(); // ya incluye descuento por monto
  if (_esClienteNuevo) {
    // El 2% se aplica sobre el total ya con descuento de monto si lo hay
    var baseOriginal = cartTotal();
    var descMonto = getDescuentoMonto(baseOriginal);
    if (!descMonto) {
      return Math.round(baseOriginal * (1 - DESCUENTO_BIENVENIDA));
    }
  }
  return base;
}

function openCheckout(){
  if(!cart.length) return;
  closeCart();
  buildMiniList();
  document.getElementById('checkoutFormBody').style.display='block';
  document.getElementById('orderSuccess').style.display='none';
  document.getElementById('checkoutOverlay').classList.add('open');
  document.body.style.overflow='hidden';
  // Mostrar/ocultar el campo de dirección según la opción de entrega activa
  // (por defecto es "envío a domicilio", así el campo aparece desde el inicio)
  toggleAddress();
}
function closeCheckout(){ document.getElementById('checkoutOverlay').classList.remove('open'); document.body.style.overflow=''; }

function buildMiniList(){
  const el=document.getElementById('orderMiniList');
  const base = cartTotal();
  const desc = getDescuentoMonto(base);
  const totalConMonto = desc ? Math.round(base*(1-desc.pct)) : base;
  let totalConCupon = totalConMonto;
  if(_cuponActivo) totalConCupon = Math.round(totalConMonto * (1 - _cuponActivo.pct));
  const totalFinal = (_esClienteNuevo && !desc && !_cuponActivo) ? Math.round(base*(1-DESCUENTO_BIENVENIDA)) : totalConCupon;
  let totalRow = '<div class="omi" style="margin-top:6px"><span><strong>Subtotal</strong></span><span>' + fmt(base) + '</span></div>';
  if(desc){
    totalRow += '<div class="omi" style="color:var(--cyan)"><span>🎉 ' + desc.label + '</span><span>-' + fmt(base-totalConMonto) + '</span></div>';
  }
  if(_cuponActivo){
    totalRow += '<div class="omi" style="color:#00E676"><span>🏷️ ' + _cuponActivo.label + '</span><span>-' + fmt(totalConMonto-totalConCupon) + '</span></div>';
  }
  if(_esClienteNuevo && !desc && !_cuponActivo){
    totalRow += '<div class="omi" style="color:#00E676"><span>🎉 5% descuento bienvenida</span><span>-' + fmt(base-totalFinal) + '</span></div>';
  }
  totalRow += '<div class="omi" style="border-top:1px solid rgba(0,200,255,.2);margin-top:4px;padding-top:6px"><span><strong>TOTAL</strong></span><span style="color:var(--cyan);font-size:1.1em">' + fmt(totalFinal) + '</span></div>';
  el.innerHTML = cart.map(function(i){ return '<div class="omi"><span>' + i.emoji + ' ' + i.name + ' — ' + i.flavor + ' x' + i.qty + '</span><span>' + fmt(i.price*i.qty) + '</span></div>'; }).join('') + totalRow;
}

function toggleAddress(){
  const dt=document.getElementById('deliveryType').value;
  document.getElementById('addressGroup').style.display=dt==='envio'?'block':'none';
}
function selPay(m,el){
  document.querySelectorAll('.pay-option').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
  var t = document.getElementById('finalizeBtnText');
  if(t) t.textContent = (m==='mercadopago') ? 'Pagar con Mercado Pago' : 'Enviar pedido por WhatsApp';
}

function finalizarPedido(){
  const name=document.getElementById('clientName').value.trim();
  const phone=document.getElementById('clientPhone').value.trim();
  const email=document.getElementById('clientEmail').value.trim();
  const delivery=document.getElementById('deliveryType').value;
  const address=document.getElementById('clientAddress')?.value?.trim()||'';
  const notes=document.getElementById('clientNotes').value.trim();
  const pay=(document.querySelector('input[name="pay"]:checked')||{}).value||'transferencia';
  const waNum=document.getElementById('waChoice').value;

  if(!name){showToast('⚠️ Ingresá tu nombre');return;}
  if(!phone){showToast('⚠️ Ingresá tu WhatsApp');return;}
  if(delivery==='envio'&&!address){showToast('⚠️ Ingresá tu dirección');return;}

  let msg=`🏋️ *NUEVO PEDIDO — ${STORE_NAME}*\n\n`;
  msg+=`👤 *Cliente:* ${name}\n`;
  msg+=`📱 *WhatsApp:* ${phone}\n`;
  if(email) msg+=`📧 *Email:* ${email}\n`;
  msg+=`\n📦 *Detalle:*\n`;
  cart.forEach(i=>{ msg+=`  • ${i.emoji} ${i.name} — ${i.flavor} × ${i.qty}  →  ${fmt(i.price*i.qty)}\n`; });
  const _baseTotal = cartTotal();
  const _descQty = getDescuentoCantidad();
  const _baseTrasQty = _baseTotal - _descQty;
  const _desc = getDescuentoMonto(_baseTrasQty);
  const _totalConMonto = _desc ? Math.round(_baseTrasQty*(1-_desc.pct)) : _baseTrasQty;
  let _totalConCupon = _totalConMonto;
  if(_cuponActivo) _totalConCupon = Math.round(_totalConMonto * (1 - _cuponActivo.pct));
  const _totalFinal = (_esClienteNuevo && !_desc && !_cuponActivo) ? Math.round(_baseTrasQty*(1-DESCUENTO_BIENVENIDA)) : _totalConCupon;
  if(_descQty > 0) msg+='\n🏷️ *5% off por cantidad (2+ iguales):* -'+fmt(_descQty)+'\n';
  if(_desc) msg+='\n🎉 *Descuento: '+_desc.label+'* (-'+fmt(_baseTrasQty-_totalConMonto)+')\n';
  if(_cuponActivo) msg+='\n🏷️ *Cupón: '+_cuponActivo.code+' ('+_cuponActivo.label+')* (-'+fmt(_totalConMonto-_totalConCupon)+')\n';
  if(_esClienteNuevo && !_desc && !_cuponActivo) msg+='\n🎉 *Descuento bienvenida: 5%* (-'+fmt(_baseTrasQty-_totalFinal)+')\n';
  // Puntos que gana con esta compra
  var _puntosGanados = Math.floor(_totalFinal / 1000);
  if(_puntosGanados > 0) msg+='\n⭐ *Puntos ganados: +'+_puntosGanados+'*\n';
  msg+='\n💰 *TOTAL: '+fmt(_totalFinal)+'*\n';
  msg+='\n🚚 *Entrega:* ' + (delivery==='envio' ? 'Envío a domicilio 📦' : 'Retiro en local 🏪') + '\n';
  if(delivery==='envio'&&address) {
    msg+='📍 *Dirección:* ' + address + '\n';
    msg+='💡 *Recordá cotizar el envío por Correo Argentino según peso/medidas del paquete.*\n';
  }
  msg+=`💳 *Pago:* ${pay.charAt(0).toUpperCase()+pay.slice(1)}\n`;
  if(notes) msg+=`📝 *Notas:* ${notes}\n`;
  msg+=`\n¡Gracias por tu compra! 💪`;

  // ── Registrar en Google Sheets ───────────────────────────
  const API_URL = 'https://script.google.com/macros/s/AKfycbwUujcSoSyBWLLla-LOdovJmTDan-DP3O9Gp0k_MSupTHGEPB55TCZqllvGmEK6vlk/exec';
  const payload = {
    nombre:   name,
    telefono: phone,
    email:    email,
    entrega:  delivery,
    direccion:address,
    pago:     pay,
    total:    _totalFinal,
    descuento: _desc ? _desc.label : '',
    cupon: _cuponActivo ? _cuponActivo.code : '',
    items: cart.map(i=>({
      nombre:   i.name,
      marca:    i.brand||'',
      precio:   i.price,
      cantidad: i.qty
    }))
  };
  // Registrar en Sheets — mostrar código cuando responde
  fetch(API_URL, {
    method:'POST',
    body: JSON.stringify(payload)
  }).then(function(r){ return r.json(); })
  .then(function(data) {
    // ── Pago con Mercado Pago: llevar al cliente a pagar ──
    if (data && data.init_point) {
      showToast('💳 Redirigiendo a Mercado Pago...');
      setTimeout(function(){ window.location.href = data.init_point; }, 700);
      return;
    }
    if (pay === 'mercadopago' && data && data.ok && !data.init_point) {
      showToast('⚠️ No se pudo generar el link de pago. Te contactamos por WhatsApp.');
    }
    // ── Mostrar confirmación al cliente ──
    var codigo = (data && data.codigo) ? data.codigo : '';
    var ct = document.getElementById('codigoPedidoTexto');
    if (ct && codigo) ct.textContent = codigo;
    var le = document.getElementById('linkEstadoPedido');
    if (le && codigo) le.href = 'https://maxupsuplementos.github.io/maxupsuplementos/estado.html?pedido=' + codigo;
    // Cajas según método/entrega
    var retiroBox = document.getElementById('retiroInfoBox');
    if (retiroBox) retiroBox.style.display = (delivery === 'retiro') ? 'block' : 'none';
    var transferBox = document.getElementById('transferInfoBox');
    if (transferBox) transferBox.style.display = (pay === 'transferencia') ? 'block' : 'none';
    // Botón para enviar el pedido por WhatsApp al comercio (click directo = sin bloqueo de popup)
    var waBtn = document.getElementById('waRepeatBtn');
    if (waBtn) {
      waBtn.textContent = '📲 Enviar pedido por WhatsApp';
      waBtn.onclick = function(){ window.open('https://wa.me/' + waNum + '?text=' + encodeURIComponent(msg), '_blank'); };
    }
    // Pedido de reseña post-compra: botones para valorar lo comprado
    var ppr = document.getElementById('postPurchaseReview');
    if (ppr) {
      var seen = {}, uniq = [];
      (cart || []).forEach(function(i){ if(i.pid && !seen[i.pid]){ seen[i.pid]=1; uniq.push(i); } });
      if (uniq.length) {
        ppr.innerHTML = '<p style="color:#FFD700;font-size:.85rem;font-weight:700;margin-bottom:8px">⭐ Valorá tu compra y ayudá a otros</p>'
          + uniq.slice(0,4).map(function(i){
              return '<button onclick="rateProduct(\''+String(i.pid).replace(/\'/g,"\\\'")+'\')" style="display:inline-block;margin:3px;padding:6px 12px;background:rgba(255,215,0,.12);border:1px solid rgba(255,215,0,.4);color:#FFD700;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;font-family:Rajdhani,sans-serif">⭐ '+i.name+'</button>';
            }).join('');
      } else { ppr.innerHTML = ''; }
    }
    // Mostrar pantalla de éxito
    var _form = document.getElementById('checkoutFormBody');
    var _ok = document.getElementById('orderSuccess');
    if (_form) _form.style.display = 'none';
    if (_ok) _ok.style.display = 'block';
    setTimeout(function(){ cargarDesdeSheets(); }, 5000);
  }).catch(function(){ showToast('⚠️ No pudimos registrar el pedido. Probá de nuevo o escribinos por WhatsApp.'); });
}

cargarLiquidaciones();

function mostrarLiquidaciones() {
  var sec = document.getElementById('liquidaciones');
  if (sec) sec.style.display = 'block';
}

// ── ACCESO SECRETO AL ADMIN (5 clicks en el logo) ────────────
(function() {
  var clicks = 0, timer;
  var logo = document.getElementById('navLogoLink');
  if (!logo) return;
  logo.addEventListener('click', function(e) {
    e.preventDefault();
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(function(){ clicks = 0; }, 2000);
    if (clicks >= 5) {
      clicks = 0;
      window.location.href = 'admin.html';
    }
  });
})();

// ── CARGAR LIQUIDACIONES DESDE API ───────────────────────────
async function cargarLiquidaciones() {
  try {
    var API_LIQ = 'https://script.google.com/macros/s/AKfycbwUujcSoSyBWLLla-LOdovJmTDan-DP3O9Gp0k_MSupTHGEPB55TCZqllvGmEK6vlk/exec';
    var res = await fetch(API_LIQ + '?accion=ofertas');
    var data = await res.json();
    if (!data.ok || !data.productos || data.productos.length === 0) return;

    var seccion = document.getElementById('liquidaciones');
    var grid = document.getElementById('liquidacionesGrid');
    // No mostrar automáticamente — el usuario entra por el botón del nav

    var URGENCIA_CONFIG = {
      vencido:  { color:'#FF3D3D', bg:'rgba(255,61,61,.12)',  label:'💀 VENCIDO',         border:'rgba(255,61,61,.4)' },
      critico:  { color:'#FF3D3D', bg:'rgba(255,61,61,.1)',   label:'🚨 VENCE EN DÍAS',    border:'rgba(255,61,61,.35)' },
      urgente:  { color:'#FFA500', bg:'rgba(255,165,0,.1)',   label:'⚠️ ÚLTIMAS UNIDADES', border:'rgba(255,165,0,.35)' },
      pronto:   { color:'#FFD700', bg:'rgba(255,215,0,.08)', label:'🟡 PRÓXIMO A VENCER',  border:'rgba(255,215,0,.3)' },
      atencion: { color:'#00C8FF', bg:'rgba(0,200,255,.07)', label:'🔵 EN OFERTA',         border:'rgba(0,200,255,.25)' }
    };

    grid.innerHTML = data.productos.map(function(p) {
      var cfg = URGENCIA_CONFIG[p.urgencia] || URGENCIA_CONFIG.atencion;
      var diasTxt = p.diasRestantes < 0
        ? 'Venció hace ' + Math.abs(p.diasRestantes) + ' días'
        : p.diasRestantes === 0 ? 'Vence HOY'
        : 'Vence en ' + p.diasRestantes + ' días';
      var waMsg = encodeURIComponent('Hola! Me interesa: ' + p.nombre + '. ¿Tienen precio especial?');
      return '<div style="background:var(--dark2);border:1px solid ' + cfg.border + ';border-radius:12px;overflow:hidden">'
        + '<div style="background:' + cfg.bg + ';border-bottom:1px solid ' + cfg.border + ';padding:6px 12px;display:flex;justify-content:space-between;align-items:center">'
        + '<span style="color:' + cfg.color + ';font-size:.72rem;font-weight:700">' + cfg.label + '</span>'
        + '<span style="color:' + cfg.color + ';font-size:.72rem;font-weight:700">' + diasTxt + '</span>'
        + '</div>'
        + '<div style="padding:14px">'
        + '<div style="font-size:.78rem;color:#888;margin-bottom:4px">' + p.marca + '</div>'
        + '<div style="font-weight:700;font-size:.92rem;margin-bottom:8px;line-height:1.3">' + p.nombre + '</div>'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'
        + '<span style="font-size:1.4rem;font-weight:700;color:var(--cyan)">$' + Number(p.precio).toLocaleString('es-AR') + '</span>'
        + '<span style="font-size:.75rem;color:#666">Stock: ' + p.stock + '</span>'
        + '</div>'
        + '<a href="https://wa.me/5491168461457?text=' + waMsg + '" target="_blank"'
        + ' style="display:block;text-align:center;padding:8px;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;border-radius:8px;font-size:.85rem;font-weight:700;letter-spacing:.06em;text-decoration:none">'
        + '📲 CONSULTAR PRECIO ESPECIAL</a>'
        + '</div></div>';
    }).join('');
  } catch(e) {}
}

// Abrir un producto para valorarlo (desde el pedido de reseña post-compra)
function rateProduct(pid){
  closeCheckout();
  setTimeout(function(){
    if(typeof openProdModal==='function') openProdModal(pid);
    var rs = document.getElementById('modalReviewSection');
    if(rs) rs.scrollIntoView({behavior:'smooth', block:'center'});
  }, 220);
}

function resetAfterOrder(){
  clearCart(); closeCheckout();
  ['clientName','clientPhone','clientEmail','clientAddress','clientNotes'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  cargarDesdeSheets();
cargarLiquidaciones();

// ── ACCESO SECRETO AL ADMIN (5 clicks en el logo) ────────────
(function() {
  var clicks = 0, timer;
  var logo = document.getElementById('navLogoLink');
  if (!logo) return;
  logo.addEventListener('click', function(e) {
    e.preventDefault();
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(function(){ clicks = 0; }, 2000);
    if (clicks >= 5) {
      clicks = 0;
      window.location.href = 'admin.html';
    }
  });
})();


}

/* ── TOAST ── */
let _tt;
function showToast(msg){
  const t=document.getElementById('toast'); t.textContent=msg;
  t.classList.add('show'); clearTimeout(_tt);
  _tt=setTimeout(()=>t.classList.remove('show'),2800);
}

/* ── SCROLL REVEAL ── */
function initScrollReveal(){
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.style.opacity='1';e.target.style.transform='translateY(0)'; } });
  },{threshold:.06});
  document.querySelectorAll('.prod-card,.feat-card').forEach(el=>{
    el.style.opacity='0';el.style.transform='translateY(22px)';
    el.style.transition='opacity .6s ease,transform .6s ease';
    obs.observe(el);
  });
}

/* ── CLOSE OVERLAY ON BACKDROP ── */
['cartOverlay','checkoutOverlay'].forEach(id=>{
  document.getElementById(id).addEventListener('click',e=>{
    if(e.target.id===id){ id==='cartOverlay'?closeCart():closeCheckout(); }
  });
});

/* ── INIT ── */
loadCart();
// Precarga instantánea desde cache (muestra productos de inmediato mientras la API responde)
(function(){
  try{
    const cached = localStorage.getItem('maxup_cache_prods');
    const ts = parseInt(localStorage.getItem('maxup_cache_ts')||'0');
    // Usar cache si tiene menos de 2 horas
    if(cached && (Date.now()-ts) < 7200000){
      const parsed = JSON.parse(cached);
      if(parsed.length > 0){
        PRODUCTS.length = 0;
        parsed.forEach(p => PRODUCTS.push(p));
        renderAll();
        console.log('⚡ Cache cargado:', PRODUCTS.length, 'productos (se actualizará con la API)');
      }
    }
  }catch(e){}
})();
cargarDesdeSheets();
cargarLiquidaciones();

// ── ACCESO SECRETO AL ADMIN (5 clicks en el logo) ────────────
(function() {
  var clicks = 0, timer;
  var logo = document.getElementById('navLogoLink');
  if (!logo) return;
  logo.addEventListener('click', function(e) {
    e.preventDefault();
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(function(){ clicks = 0; }, 2000);
    if (clicks >= 5) {
      clicks = 0;
      window.location.href = 'admin.html';
    }
  });
})();



const PROD_IMG_MAP = {
  "whey protein doypack 2 lb": "https://images.weserv.nl/?url=www.demusculos.com/web/wp-content/uploads/2024/02/whey-protein-star-bolsa-frente-1024x1024.jpg",
  "platinum whey protein 2 lb pote": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/PWP-2Lb-Chocolate.png?v=1718218508&width=1100",
  "whey protein platinum 3 kg": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/PWP-3Kg-Chocolate.png?v=1718218522&width=1100",
  "wh3y platinum chocolate": "https://i.ibb.co/4w4mQvbs/IMG-20260323-230735755-HDR-AE.jpg",
  "just whey x2lb": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/products/just_4.png?v=1755712483&width=1500",
  "mutantmass x 1,5 kg": "https://i.ibb.co/RktxYHBx/Gemini-Generated-Image-6eld1a6eld1a6eld.png",
  "just carb 2 lb": "https://images.weserv.nl/?url=encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg_2RrSzuVdHnxIupXDcad7N3-XfeVgrRj3A&s",
  "creatina 300g pote": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/003/703/137/products/creatina-hd-a839e43636a193460417291787850812-1024-1024.webp",
  "creatina 300g doypack": "https://images.weserv.nl/?url=suplementsport.com.ar/wp-content/uploads/2024/07/Creatina-doy-pack-300-gr.jpg",
  "creatina 500g pote": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/005/314/904/products/creatina-500-grs-star-informacion-nutricional-b60391aaf994f3b46517510401406773-1024-1024.webp",
  "creatina 1 kg pote": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_889534-MLA92512456390_092025-F.webp",
  "mtor bcaa 270g": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/MtorBCAA-270g-_2.png?v=1718218499&width=1100",
  "eaa's aminoácidos": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/EEAS-Aminos.png?v=1718218508&width=1100",
  "l-glutamina 300g": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/L-glutamine-300g.png?v=1718218487&width=1100",
  "l-arginina 150g": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/L-ArginineGH.png?v=1718218459&width=1100",
  "l-carnitina 60 comp.": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/L-Carnitine1000.png?v=1718218457&width=1100",
  "beta alanina 300g": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/STANUT0040BEAPO.png?v=1719513607&width=1100",
  "vitamina c (ácido ascórbico)": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/VitaminaC_sf_2.png?v=1726507301&width=1100",
  "multivitamínico 60 caps": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/STANUT004030.png?v=1719499932&width=1100",
  "omega 3 fish oil 60 caps": "https://images.weserv.nl/?url=www.demusculos.com/web/wp-content/uploads/2024/02/fish-oil-omega-3-star-nutrition-x60-1.jpg",
  "zma 90 caps": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/products/zma-lanzamiento1.jpg?v=1718296879",
  "cla 1000 90 caps": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/CLA1000.png?v=1718218464",
  "resveratrol 500 x 60 caps.": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/Resceratrol500.png?v=1718218466&width=1100",
  "citrato de magnesio 60 caps": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/CitratoMagnesio_36ac50e8-5662-4aa0-8b90-10edd71b1236.png?v=1720020323&width=1100",
  "citrato de magnesio 500g": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/WhatsAppImage2025-01-21at16.41.23.jpg?v=1737657815",
  "cafeína 200mg 30 caps": "https://images.weserv.nl/?url=encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuBBnyF8GwvV_Jtg1atRIjKpsGcGyDM3Wu1w&s",
  "thermo fuel max": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/ThermoFuelMax.png?v=1718218471&width=1100",
  "tnt dynamite 240g": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/TNTDynamite-blueraz.png?v=1718218517",
  "pump v8 x285g": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/PumpV8-WMEL_256a8bca-27cd-4ba8-8dc8-edffe507986d.png?v=1719843200&width=1100",
  "hydroplus endurance x700g": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/HydroplusEndurance-Limon.png?v=1718218522",
  "fat burner 60 caps": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/mercado-libre-31-06c8d2b9fc2d0ae3ee17120844289331-1024-1024.webp",
  "creatina monohidrato 300g": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/diseno-sin-titulo-a9c08fc92439e10e4317701539357351-1024-1024.webp",
  "pre entreno con quemador": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/mercado-libre-19-8b254affdefda681b617120844691254-1024-1024.webp",
  "colágeno + hialurónico 454g": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/mercado-libre-25-25-8bc6cecba0522bc4d917120845307555-1024-1024.webp",
  "resveratrol by pampita": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/ml-productos-13-26145b9991b6bc458b17120845591197-1024-1024.webp",
  "proteína by pampita 454g": "https://images.weserv.nl/?url=www.farmacialeloir.com.ar/img/articulos/2024/08/imagen1_woman_by_pampita_whey_protein_imagen1.webp",
  "proteína fit + colágeno": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/512/322/products/plantillaimagenes_mesa-de-trabajo-1-copia-5-8b28f220dbd369cc1c17452661791318-1024-1024.webp",
  "whey protein truemade 2,05 lb": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/TMWP2lb-Va_2.png?v=1769005779&width=800",
  "ultra mass x 1,5 kg": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/Umass1lb-Va.png?v=1764942067&width=800",
  "100% whey x 2 libras": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/100_W-FR.png?v=1769688238&width=800",
  "creatina micronizada 300g": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/CreaN300Mono.png?v=1765981838&width=800",
  "bcaa 2:1:1 90 cápsulas": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/products/BCAA_211.jpg?v=1683514389&width=800",
  "l-carnitina 1500 x60 caps": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/Carnitina_4.png?v=1739377333&width=800",
  "glutamina 300g en pote": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/products/Glutamine_Micronized.jpg?v=1738842769&width=800",
  "multivitamínico c/cafeína 60 comp": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/products/MultiVitamin.jpg?v=1738842964&width=800",
  "cafeína 200mg": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/products/Cafeina.jpg?v=1683513707&width=800",
  "enaccion multivitamínico 30 caps": "https://images.weserv.nl/?url=static.wixstatic.com/media/2df297_795469866b47421db862b096b4a450b6~mv2.png/v1/fill/w_555,h_396,al_c,lg_1,q_85,enc_avif,quality_auto/2df297_795469866b47421db862b096b4a450b6~mv2.png",
  "energy gel 32g": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/EnargyGel6c.jpg?v=1731094910&width=800",
  "truemade whey colágeno 771g": "https://images.weserv.nl/?url=www.enasport.com/cdn/shop/files/TMWC_Ch.png?v=1737985937&width=800",
  "proteína 7900 pote": "https://images.weserv.nl/?url=encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlWNUkFYisqcuP1NWgOeYhxnJSMwZg-XRbig&s",
  "proteína 7900 doypack": "https://images.weserv.nl/?url=www.gentech.com.ar/web/image/product.product/4040/image_1024/%5BGTWPCHM00%5D%20WHEY%20PROTEIN%207900%20%28Chocolate%2C%201%20kg.%29?unique=37bde56",
  "tx3 black cuts 60 caps": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_618088-MLA73504786491_122023-F.webp",
  "creatina 250g": "https://images.weserv.nl/?url=www.gentech.com.ar/web/image/product.product/835/image_1024/%5BGTCPSN250%5D%20CREATINA%20MONOHIDRATO%20x%20250%20g?unique=f28600d",
  "carnitina líquida 500ml": "https://images.weserv.nl/?url=www.gentech.com.ar/web/image/product.product/878/image_1024/%5BGTCLFB500%5D%20L-CARNITINA%20x%20500%20ML?unique=37bde56",
  "beauty bar 45g": "https://images.weserv.nl/?url=www.gentech.com.ar/web/image/product.product/10932/image_1024/%5BGTBBCH010%5D%20BEAUTY%20BAR%20GENTECH?unique=37bde56",
  "iron bar 46g": "https://images.weserv.nl/?url=www.gentech.com.ar/web/image/product.product/4012/image_1024/%5BGTIBFR020%5D%20IRON%20BAR%20AFA%20BARRA%20PROTEICA%20%28Frutilla%2C%2020%20unidades%29?unique=37bde56",
  "lipolitic cla 1000 x 60 caps": "https://images.weserv.nl/?url=entresano.com/wp-content/uploads/2023/05/Diseno-sin-titulo-2023-05-17T121510.469.jpg",
  "best whey x 2 lb": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/fotos_productos/117/BEST-WHEY-Protein-Banana-nuevo-(1).png",
  "whey advanced 1 kg": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/fotos_productos/123/Advanced-Banana.png",
  "whey 3 kg": "https://images.weserv.nl/?url=www.demusculos.com/web/wp-content/uploads/2024/02/best-whest-03-kg-ALEATORIO-xtrenght-01.jpg",
  "creatina 250g": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/user_ObjDVbDGZY/97/Creatine-250-500.png",
  "creatina 500g": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/user_ObjDVbDGZY/127/Creatine-500.500.png",
  "bcaa pro 120 caps": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/fotos_productos/101/Pro-bcaa.500.png",
  "bcaa pro hydro 360g — blue razz": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/user_ObjDVbDGZY/103/HYDRO-BCAA-PRO--punch.500.png",
  "óxido nítrico 180 caps": "https://images.weserv.nl/?url=xtrenght-nutrition.com/imgc/500x500/media/fotos_productos/100/Nitrox.500.png",
  "nitro gain x 1,5 kg — cookies": "https://images.weserv.nl/?url=xtrenght-nutrition.com/media/fotos_productos/47/xtrenght-nitrogain-prod-img-1-375x700.png",
  "pre work gold 280g": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2021/03/19/pre-work_gold_nutrition.png",
  "whey ripped x 2 libras": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2022/12/07/whey_ripped_protein_gold_nutrition_proetina_quemadora_suplemento_deportivo_cafeina_carnitina_taurina.png",
  "whey 100% protein 2 lb": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2025/09/01/100_whey_protein_gold_nutrition_doypack_2lb-blend-2025.png",
  "iso gold protein 2lb — vainilla": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2020/12/14/iso_gold_protein_gold_nutrition_isolate_isolatada_hidrolizada_chocolate_vainilla.png",
  "gainer gold 5 lb — vainilla": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2021/11/23/gainer-gold-nutrition-ganador-masa-muscular-mejor-doypack-5lb-home.png",
  "bcaa 2000 30 caps": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2021/05/31/new-aminoacidos_bcaa_2000_gold_nutrition.png",
  "zma 60 caps": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2023/11/27/zma_gold_nutrition-zinc-magnesio-vitamina-b6.png",
  "vitamin gold 30 caps": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2025/07/04/vitamin-gold-vitaminas-multivitaminico-multimineral-salud-gold-nutrition-gold-prime.png",
  "lipo gold elite 60 caps": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2024/04/08/lipo_gold_elite_ultra_concentrate_gold_nutrition_gold_prime.png",
  "lipo burn hardcore 120 caps": "https://images.weserv.nl/?url=www.instagram.com/p/C2S26jQxcFU/?img_index=2",
  "omega 3 fish oil 30 caps": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2024/07/08/omega-3-fish-oil-capsulas-blandas-softgel-aceite-pescado-gold-nutrition-gold-prime.png",
  "testo gold 120 caps": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2025/05/19/testo_gold_nutrition-testosterona-natural-booster.png",
  "creatina x300g": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2025/11/03/creatina_monohidrato_gold_nutrition_doypack.png",
  "colágeno hidrolizado 200g pote": "https://images.weserv.nl/?url=maesport.com.ar/wp-content/uploads/2024/05/540-grs-9.png",
  "colágeno hidrolizado 200g doypack": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/011/728/products/hydrolyzed-collagen-frutilla-200g-19c840121dd6f2c20f17496820151286-1024-1024.webp",
  "vegetal protein isolate 2 lb": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2025/09/12/vegetal_protein_isolate_gold_nutrition_doypack_2lb.png",
  "hmb 60 caps": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2020/08/31/hmb_gold_nutrition_suplemento.png",
  "n.o gold óxido nítrico 195g": "https://images.weserv.nl/?url=goldnutrition.com.ar/images/2020/02/11/n.o_gold_nutrition_oxido_nitrico.png",
  "creatine powder 300g": "https://images.weserv.nl/?url=www.optimumnutrition.com/cdn/shop/files/on-1160419_Image_01.png?v=1766415834&width=800",
  "resveratrol nad+": "https://images.weserv.nl/?url=m.media-amazon.com/images/I/51WKLQqEUKL._AC_SX679_.jpg",
  "l-carnitine 1000 x 60 comp": "https://images.weserv.nl/?url=nutrex.com/cdn/shop/files/L-Carnitine-120-FR.png?v=1740145582&width=750",
  "nad 500 + resveratrol 60 caps": "https://images.weserv.nl/?url=mayorista.lappiel.com/wp-content/uploads/2025/09/placa-0-37821fa7dd6fbd916117513075432136-1024-1024.webp",
  "omega 3 con omega 6 y 9": "https://images.weserv.nl/?url=mayorista.lappiel.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-22-at-1.57.52-PM.jpeg",
  "ashwagandha con vit c 60 caps": "https://images.weserv.nl/?url=mayorista.lappiel.com/wp-content/uploads/2025/12/PLACA-0.jpg",
  "bisglicinato de magnesio 60 comp": "https://images.weserv.nl/?url=mayorista.lappiel.com/wp-content/uploads/2025/09/placa-0-bed5b7aaaaff42b56517512973517226-1024-1024.webp",
  "whey protein blend 2,05 lb": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_661811-MLA96870760129_102025-F.webp",
  "whey pro performance 2 lb": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_725012-MLA99452402346_112025-F.webp",
  "gainer complex 1,5 kg — vainilla": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-gainer-complex-vainilla-3-3lbs-1-b4967435a0d090767e17637296721389-1024-1024.webp",
  "colageno sport 330g": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-colageno-sport-hidrolizado-naranja-suplemento-330g-1-a189dbe32888cf205a17545051619293-1024-1024.webp",
  "low carbs protein bar 46g": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-whey-low-carb-protein-barra-sabor-frutos-rojos-12u-1-fa260f7421e9cc44b017544956585720-1024-1024.webp",
  "whey bar 65g": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-whey-protein-barra-proteina-frambuesa-chocolate-12u-1-a074f1cb81f58b182d17545084229856-1024-1024.webp",
  "whey bar 46g — frutos rojos": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/barritas-586fcb4b2f270f6af217558917015683-1024-1024.webp",
  "creatina 300g": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-creatine-suplemento-creatina-micronizada-x-300grs-1-0af7e886f411d9107617544966078692-1024-1024.webp",
  "sport drink 1 kg": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/006/077/318/products/mervick-sport-drink-maxima-hidratacion-naranja-mandarina-1kg-1-25af661ca83968044f17544992172155-1024-1024.webp",
  "100% whey protein 1 kg": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2022/09/idn-cookies.jpg",
  "creatina 300g": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2021/05/CREATINA-300-IDN.png",
  "mass fusion 1,5 kg": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2018/11/mass-fusion.jpg",
  "l-leucina 250g": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2018/11/LEUCINE.png",
  "l-carnitina 150g — naranja": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2018/11/l-carnitine-768x768.png",
  "bcaa ultimate 435g": "https://images.weserv.nl/?url=idnnutrition.com/wp-content/uploads/2020/12/bcaa-ultimate-2.png",
  "recovery drink 540g — naranja": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_775962-MLA93508034495_092025-F.webp",
  "recovery drink 1500g — naranja": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/003/189/220/products/20-off-en-2024-04-24t231528-412-5af016cb9cea23842a17157364979766-1024-1024.webp",
  "hydromax 600g": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/003/189/220/products/20-off-en-2024-04-24t225618-358-630a850d3b2029fdd917157366932195-1024-1024.webp",
  "hydromax 1320g — manzana": "https://images.weserv.nl/?url=www.nutremax.com.ar/images/products/1767634277612348118.png",
  "cafeína booster 30 serv": "https://images.weserv.nl/?url=www.nutremax.com.ar/images/products/1669909137397658513.png",
  "cafeína 200mg 60 serv": "https://images.weserv.nl/?url=www.nutremax.com.ar/images/products/1724711172524698018.png",
  "pre work 240g — limonada": "https://images.weserv.nl/?url=www.nutremax.com.ar//images/products/162610047160061173.png",
  "glutamina 200g": "https://images.weserv.nl/?url=www.nutremax.com.ar/images/products/1674561592349880733.png",
  "pancakes proteicos": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/123/325/products/vainilla-11-6236aeed6b13bd6c3a16585849970594-1024-1024.webp",
  "cupcakes proteicos chocolate": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/123/325/products/cupclae1-827a5a7c746379e14d17277176524280-1024-1024.gif",
  "omelettes proteicos 210g": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/123/325/products/este1-7ac9fd227ceaa051f116428055775019-1024-1024.webp",
  "gelatina con colágeno 150g": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/123/325/products/gelatina-96ba3eb5176a70070117682475303477-1024-1024.webp",
  "citrato de magnesio 144g": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/123/325/products/01-2025-03-15t120118-025-1c5a75441bbda97b8117420509143883-1024-1024.webp",
  "zma-b 120 caps": "https://images.weserv.nl/?url=hochsport.com/wp-content/uploads/ZMAB_CARRUSEL_06.jpg",
  "citrato de magnesio 400mg 60 caps": "https://images.weserv.nl/?url=hochsport.com/wp-content/uploads/ESCALA-WEB_Magnesium-Citrate-400_Frente_800x800.png",
  "bio prot premium": "https://images.weserv.nl/?url=hochsport.com/wp-content/uploads/Bio-Prot-Chocolate_Frente_800x800.png",
  "extreme mass 1,5 kg": "https://images.weserv.nl/?url=hochsport.com/wp-content/uploads/Extreme-Mass-1-5Chocolate_Frente_800x800.png",
  "best whey 2 libras": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/242/511/products/mesa-de-trabajo-1-2b5c7c8ee0e4e8828f17183133452909-1024-1024.webp",
  "collagen flex uva 300g": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/242/511/products/pic-collagen-flex-1-fe2c4f313f411b652e17520003028904-1024-1024.webp",
  "thermogenic max 120 caps": "https://images.weserv.nl/?url=scontent.ftuc1-2.fna.fbcdn.net/v/t1.6435-9/101029076_1399525610231947_5715364206862139392_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=7b2446&_nc_ohc=tspyWH25CSwQ7kNvwHiBSNB&_nc_oc=Adqq6Y19-xQdacEuZJiokLLJOphc9Bnnzr0QIr86bRgZeIDu0rwUbhH5znWNR_dLGhs&_nc_zt=23&_nc_ht=scontent.ftuc1-2.fna&_nc_gid=OQOywNu0RfJmSdqJwZ08gw&_nc_ss=7a30f&oh=00_AfzVXvMXC4zI0g83jKbg5Ctfa8sKV4DxVOg81ER8bn-FJA&oe=69EA18ED",
  "termogenic max 240 comp": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/242/511/products/pic-termo-genic-1-fb60a3eca2acd3a99617521652427526-1024-1024.webp",
  "live fem multivitamínico 150g": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/004/242/511/products/pic-live-fem-1-adfaad01e528a62f2717521670876308-1024-1024.webp",
  "proteína vegetal isolate — chocolate": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/001/066/362/products/vegetal-protein_chocolate_sin-fondo-030877304ddb78207317594224312004-1024-1024.webp",
  "iso sport bebida isotónica 1190g": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_993230-MLA99006997397_112025-F.webp",
  "maltodextrina fructosa": "https://images.weserv.nl/?url=encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJdmI3NxIuJHozzDRFnZ3wUmZQZhhTDgBVVg&s",
  "barras de chocolate": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/002/590/783/products/file_000000000ae071f58f84e7bd426c2f00-1-5abfbab95a30166bdf17626388277213-1024-1024.webp",
  "barra proteica 58g": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/002/590/783/products/diseno-sin-titulo-2025-10-24t165016-399-0e11628a24b3f3303e17613354219949-1024-1024.webp",
  "barra proteica 50g": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/2287/image_1024/%5B11927%5D%20Barra%20proteica%20bros%20unidad%2050gs%20chocolate%20%28Chocolate%20blanco%29?unique=534892d",
  "granola proteica 400g": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/001/499/676/products/recorte-79-f0e6e32fe77aa22e7017563184765122-1024-1024.webp",
  "pancakes proteicos vainilla": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/001/499/676/products/recorte-78-489e9407c9cfc69f2117563178267914-1024-1024.webp",
  "barras de cereal": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/001/499/676/products/fuerza-e4aab5fc8bd11670da17577051435537-1024-1024.webp",
  "cereal bar": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/002/268/228/products/barras-de-cereal-vitalgy-arandanos-y-almendras-caja-10-x-40g-1-69adeec6defc602b6617528531796997-1024-1024.webp",
  "maní king original 350g": "https://images.weserv.nl/?url=jumboargentina.vtexassets.com/arquivos/ids/866739-1200-auto?v=638824017897070000&width=1200&height=auto&aspect=true",
  "grows bar 46g": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/005/510/154/products/chocolate-1-b71020166ef398093817327183795204-1024-1024.webp",
  "collageno hidrolizado 210g": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/STANUT2030BCL.png?v=1719509920&width=1100",
  "collagen sport naranja 360g": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/collagensport.png?v=1738085374&width=1100",
  "collagen plus limón 360g": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/collagenplus.png?v=1738086248&width=1100",
  "creatina monohidrato 300g": "https://images.weserv.nl/?url=dcdn-us.mitiendanube.com/stores/005/542/784/products/creatinamonohidrato-tuttifrutti-1-0da0580cbca6627e9517597534068631-1024-1024.webp",
  "protein isolate pea": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/001/725/864/products/protein_project_pea_protein_isolate_2lbs_unflavored_adn_palermo_web1-51c1e530574c18c5be16239512778522-1024-1024.webp",
  "creatina 200g": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_922449-MLA99999907837_112025-F.webp",
  "shakers deportivos": "https://images.weserv.nl/?url=starnutrition.com.ar/cdn/shop/files/Shaker-1_4f513345-ed58-4d2c-8f51-da1ebdb0588d.png?v=1756412538&width=1100",
  "shaker everlast con compartimento": "https://images.weserv.nl/?url=m.media-amazon.com/images/I/41ljj4tKP5L._SY300_SX300_QL70_FMwebp_.jpg",
  "shaker gold doble": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_893667-MLA99594894568_122025-F.webp",
  "mini licuadora portátil": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_783264-MLA82479583759_022025-F.webp",
  "guantes para gym": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/6561/image_1024/%5B11569%5D%20Guante%20fitness%20drb%20full%20gym%20celeste%20%28xs%29?unique=e09afc4",
  "cinturón lumbar": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.image/99/image_1024/cinturon%20lum%20ne.webp?unique=cca5d6a",
  "mancuernas recubiertas": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/4043/image_1024/%5B10844%5D%20Mancuerna%20recubierta%203kg?unique=edd1e91",
  "straps cinta para levantamiento (par)": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.image/49/image_1024/D_NQ_NP_690793-MLA43173008342_082020-V.webp?unique=7fcf988",
  "calleras de cuero talle único (par)": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/3696/image_1024/%5B11637%5D%20Callera%20ags%20full%20de%20cuero%20c-mu%C3%B1equera%20-%20talle%20unico?unique=324d3c0",
  "tobilleras 1 kg (par)": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/7611/image_1024/%5B30349%5D%20Tobilleras%20con%20peso%20vinilicas%20pro%20ags%201kg%20%28par%29%20%20%28naranja%29?unique=263f72c",
  "rueda de abdominales": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/7355/image_1024/%5B30328%5D%20Rueda%20abdominal%20doble%20estandar%20tsp?unique=f77be10",
  "botella mamushka 3 en 1": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_946566-MLA99615928592_122025-F.webp",
  "botella sport": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_608099-MLA75199272882_032024-F.webp",
  "hand grip regulable": "https://images.weserv.nl/?url=acdn-us.mitiendanube.com/stores/898/402/products/8-e189e50369e1736f9d17555459513676-1024-1024.webp",
  "banda circular de latex": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/8328/image_1024/Banda%20circular%20de%20latex%20krv%20tension%20baja%2050mm%20?unique=1803f15",
  "banda elástica con tobilleras": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/3733/image_1024/%5B10055%5D%20Banda%20elastica%20circular%20c-tobilleras%20ags%20t.media?unique=324d3c0",
  "bolso dribbling 35l": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/7394/image_1024/%5B30052%5D%20Bolso%20deportivo%20drb%2035l%20?unique=bef0044",
  "bolso dribbling 20l": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/7393/image_1024/%5B30051%5D%20Bolso%20deportivo%20drb%2020l%20?unique=bef0044",
  "rodillera drb voley (par)": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/6990/image_1024/%5B10024%5D%20Rodillera%20drb%20voley%20clasic%20%28Kids%29?unique=11bbd7e",
  "muñequera elástica (par)": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/3703/image_1024/%5B11684%5D%20Mu%C3%B1equera%20ags%20elastico%20%28por%20par%29?unique=324d3c0",
  "tope barra olímpica": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/3871/image_1024/%5B10160%5D%20Tope%20collar%20seguro%20para%20barra%20olimpica%20diametro%2050mm%20%28par%29?unique=3ff8cad",
  "mini batidora a pilas": "https://images.weserv.nl/?url=http2.mlstatic.com/D_NQ_NP_2X_675164-MLA87363005217_072025-F.webp",
  "ejercitador de dedos con muñequera": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/8558/image_1024/Ejercitador%20de%20dedos-mano%20-%20fortalecedor%20en%203%20intensidades%20.5%20%2C%207%20y%209kg%20-?unique=3ff8cad",
  "vincha con pelota para reflejos": "https://images.weserv.nl/?url=www.agsuplementos.com/web/image/product.product/8324/image_1024/Vincha%20con%20pelota%20para%20reflejos%20boxeo?unique=36cb9f5",
  "shaker maxup simple": "https://i.ibb.co/VWNn63tk/IMG-20260324-182147752-MP-AE.jpg",
  "scoop 5g maxup": "https://i.ibb.co/PZMhvwMF/IMG-20260324-182652585-MP-AE.jpg",
  "llavero maxup": "https://i.ibb.co/mVVypHc0/IMG-20260324-182904529-HDR-AE.jpg",
  "omega 3 1000mg 200 caps": "https://images.weserv.nl/?url=scontent.ftuc1-2.fna.fbcdn.net/v/t1.6435-9/65161617_2391541677631485_995261020471558144_n.jpg?stp=dst-jpg_s640x640_tt6&_nc_cat=102&ccb=1-7&_nc_sid=7b2446&_nc_ohc=z2IMDEbawbUQ7kNvwGCMzSS&_nc_oc=AdraSLI5uPgl2FDNYo7DvYl9cRkAYngz76G7KoJ7gj7RBctMzPtvYdBRtIOuSBpfGrU&_nc_zt=23&_nc_ht=scontent.ftuc1-2.fna&_nc_gid=LvxinaFUKOZz2bYPvdJm3w&_nc_ss=7a30f&oh=00_AfzGWlcg3g04oAKV0vrjZCw1gbvneLoDoHWcDczl_CdYUw&oe=69EA3A2D"
};

function _buscarImagen(nombre, marca) {
  // Buscar exacto
  const key = (nombre || '').toLowerCase().trim();
  if (PROD_IMG_MAP[key]) return PROD_IMG_MAP[key];
  // Buscar parcial (primeras 3 palabras)
  const words = key.split(' ').slice(0, 3).join(' ');
  for (const [k, v] of Object.entries(PROD_IMG_MAP)) {
    if (k.startsWith(words) || words.startsWith(k.split(' ').slice(0,3).join(' '))) return v;
  }
  return '';
}

// ── SCHEMA.ORG DINÁMICO — PRODUCTOS ──
function _generarSchemaProductos(){
  // Eliminar schema anterior si existe
  var prev = document.getElementById('schema-products');
  if(prev) prev.remove();

  // Tomar hasta 50 productos con precio (Google recomienda no excederse)
  var items = PRODUCTS.filter(function(p){ return p.price > 0; }).slice(0, 50);
  if(items.length === 0) return;

  var schemas = items.map(function(p){
    var stock = p.flavors ? p.flavors.reduce(function(s,f){return s+f.stock},0) : 0;
    var img = p.img || '';
    return {
      "@type": "Product",
      "name": p.name + (p.brand ? ' — ' + p.brand : ''),
      "image": img,
      "description": p.desc || ('Suplemento deportivo ' + (p.brand||'') + ' disponible en MAXUP Suplementos'),
      "brand": {
        "@type": "Brand",
        "name": p.brand || "MAXUP"
      },
      "category": p.cat || "Suplemento deportivo",
      "offers": {
        "@type": "Offer",
        "url": "https://maxupsuplementos.com.ar/",
        "priceCurrency": "ARS",
        "price": p.price,
        "availability": stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "MAXUP Suplementos"
        }
      }
    };
  });

  var schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Catálogo MAXUP Suplementos",
    "numberOfItems": schemas.length,
    "itemListElement": schemas.map(function(s, i){
      return {
        "@type": "ListItem",
        "position": i + 1,
        "item": s
      };
    })
  };

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'schema-products';
  script.textContent = JSON.stringify(schemaData);
  document.head.appendChild(script);
  console.log('✅ Schema de productos generado:', schemas.length, 'items');
}

async function cargarDesdeSheets() {
  // Mostrar loading
  const grid = document.getElementById('productsGrid');
  if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#aaa"><div style="width:40px;height:40px;border:3px solid rgba(0,200,255,.2);border-top-color:#00C8FF;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px"></div><p>Cargando catálogo...</p></div>';
  
  try {
    const res = await fetch(API_URL + '?accion=catalogo', { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    // Nuevos ingresos calculados en el servidor (iguales para todos los visitantes)
    _nuevosServer = Array.isArray(data.nuevos_ingresos) ? data.nuevos_ingresos : null;

    const prods = data.productos || [];
    if (prods.length === 0) throw new Error('Sin productos');
    
    // Convertir formato Sheets → formato PRODUCTS del HTML
    // Soporta tanto CATALOGO (nombre/marca/categoria) como SUPLEMENTOS (Producto/Marca/Precio unitario)
    const sheetsProds = prods
      .filter(p => {
        // Filtrar filas vacías y headers de marca (sin precio)
        const nombre = p.nombre || p['Producto'] || p.nombre || '';
        const precio = Number(p.precio_venta || p['Precio De Lista'] || p['Precio unitario'] || 0);
        return nombre && precio > 0;
      })
      .map((p, i) => {
        const nombre   = p.nombre   || p['Producto']          || '';
        const marca    = p.marca    || p['Marca']              || '';
        // Col B = Precio unitario = EFECTIVO/TRANSF
        // Col C = Precio De Lista = TARJETA/QR/DÉBITO
        const precio_efectivo = Number(p.precio_venta || p['Precio unitario'] || 0);
        const precio_tarjeta  = Number(p.precio_lista  || p['Precio De Lista'] || precio_efectivo * 1.08 || 0);
        const stock    = Number(p.stock || p['Cantidad en stock'] || 0);
        // Inferir categoría con la función mejorada
        const cat = p.categoria || p.cat || _inferirCategoria(nombre);
        const img      = p.imagen_url || p['imagen_url'] || '';
        // Soporte múltiples imágenes desde Sheets (separadas por \n o ;)
        var imgArr = p.imagenes || [];
        if(!imgArr.length && img) imgArr = img.split(/[\r\n;]+/).map(function(u){return u.trim()}).filter(Boolean);
        const desc     = p.descripcion || p['descripcion'] || '';
        return {
          id: String(p.id || i+1),
          name: nombre,
          brand: marca,
          cat: _mapCategoria(cat),
          emoji: _catEmoji(cat),
          img: imgArr[0] || _buscarImagen(nombre, marca),
          imgs_sheet: imgArr.length > 1 ? imgArr : null,
          desc: desc,
          price: precio_efectivo,
          price_tarjeta: precio_tarjeta,
          flavors: [{ name: 'Unidad', stock: stock }],
          badge: null
        };
      });
    
    // ── AGRUPAR por nombre base + marca (quitar sabor/color del nombre) ──
    const grouped = {};
    sheetsProds.forEach(p => {
      const { base, sabor } = _extraerSabor(p.name);
      const groupKey = (p.brand || '').toUpperCase() + '||' + base;

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          ...p,
          name: base,
          flavors: [],
          imgs: {}, // mapa sabor → imagen
          _sheetImgs: [], // array de imágenes adicionales del Sheet
          img: p.img || _buscarImagen(base, p.brand),
        };
      }
      // Acumular imágenes múltiples del Sheet
      if (p.imgs_sheet) {
        p.imgs_sheet.forEach(function(u){ if(grouped[groupKey]._sheetImgs.indexOf(u)===-1) grouped[groupKey]._sheetImgs.push(u); });
      }
      const saborNombre = sabor || 'Unidad';
      const stockVal = p.flavors[0].stock;
      grouped[groupKey].flavors.push({ name: saborNombre, stock: stockVal });
      // Guardar imagen específica de este sabor
      if (p.img) {
        grouped[groupKey].imgs[saborNombre] = p.img;
        if (!grouped[groupKey].img) grouped[groupKey].img = p.img;
      }
    });
    
    // Reemplazar PRODUCTS con datos agrupados
    PRODUCTS.length = 0;
    Object.values(grouped).forEach(p => {
      // Si hay múltiples imágenes del Sheet, usarlas como galería
      if(p._sheetImgs && p._sheetImgs.length > 1){
        p.imgs_gallery = p._sheetImgs;
      }
      delete p._sheetImgs;
      delete p.imgs_sheet;
      PRODUCTS.push(p);
    });

    // Cache en localStorage para carga instantánea la próxima vez
    try{
      localStorage.setItem('maxup_cache_prods', JSON.stringify(PRODUCTS));
      localStorage.setItem('maxup_cache_ts', Date.now().toString());
    }catch(e){}

    renderAll();
    // Solo subir al inicio si el usuario NO scrolleó mientras cargaba
    // (respeta la posición donde dejó la vista) y si no hay anclas (#seccion)
    if(window.scrollY < 50 && !location.hash) window.scrollTo(0, 0);
    _generarSchemaProductos();
    console.log('✅ Catálogo cargado desde Sheets:', PRODUCTS.length, 'productos agrupados');

  } catch(err) {
    console.warn('⚠️ Sheets no disponible, usando catálogo local:', err.message);
    // Intentar cargar desde cache
    try{
      const cached = localStorage.getItem('maxup_cache_prods');
      if(cached){
        const parsed = JSON.parse(cached);
        if(parsed.length > 0){
          PRODUCTS.length = 0;
          parsed.forEach(p => PRODUCTS.push(p));
          console.log('📦 Catálogo cargado desde cache:', PRODUCTS.length, 'productos');
        }
      }
    }catch(e2){}
    renderAll();
    if(window.scrollY < 50 && !location.hash) window.scrollTo(0, 0);
  }
}

function _extraerSabor(nombre) {
  const n = nombre.trim();
  // Detectar sabor por guion: "Producto X - Sabor" → base="Producto X", sabor="Sabor"
  const guionIdx = n.lastIndexOf(' - ');
  if (guionIdx !== -1) {
    const base  = n.substring(0, guionIdx).trim();
    const sabor = n.substring(guionIdx + 3).trim();
    if (base && sabor) return { base, sabor };
  }
  // Sin guion = sin sabor diferenciado
  return { base: n, sabor: '' };
}

function _inferirCategoria(nombre) {
  const n = nombre.toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
    .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o')
    .replace(/[úùü]/g,'u').replace(/ñ/g,'n');

  // EXCEPCIONES PRIMERO (productos que contienen palabras ambiguas)
  if (/whey.{0,5}bar|low.{0,5}carb.{0,10}bar|protein.{0,5}bar/.test(n)) return 'barra';
  if (/gelatina.{0,15}colag|colag.{0,15}gelatina/.test(n)) return 'barra';

  // ACCESORIOS — antes de barras para evitar "tope barra olimpica"
  if (/guante|cinturon|lumbar|rueda.{0,15}abdom|mancuerna|straps|callera|rodillera|munequera|hand.{0,8}grip|ejercitador.{0,10}dedo|mini.{0,8}batidora|batidora.{0,8}pila|bolso|scoop|bidon|llavero|vincha|tope.{0,8}barra|latex|banda.{0,30}elastic|tobillera/.test(n)) return 'accesorio';
  if (/botella|shaker|new.{0,3}protein/.test(n)) return 'accesorio';

  // CREATINA
  if (/creatin/.test(n)) return 'creatina';

  // GAINER
  if (/gainer|ultra.{0,5}mass|mutant.{0,5}mass|nitro.{0,5}gain|mass.{0,5}fusion|extreme.{0,5}mass/.test(n)) return 'gainer';

  // PROTEÍNA
  if (/whey|proteina|protein|caseina|isolate|pea.{0,5}prot|bio.{0,5}prot/.test(n)) return 'proteina';

  // AMINOÁCIDOS
  if (/bcaa|glutamin|aminoacid|taurina|arginina|leucina|eaa|hmb|carnitin/.test(n)) return 'aminoacido';

  // PRE-ENTRENO
  if (/pre.{0,5}work|pre.{0,5}entreno|pump|tnt|dynamite|beta.{0,5}alan/.test(n)) return 'preworkout';

  // COLÁGENO (sin gelatina, que va en barras)
  if (/colag|collagen/.test(n) && !/gelatina/.test(n)) return 'colageno';

  // QUEMADORES
  if (/thermo|fat.{0,5}burn|cla |quemad|lipo|termogen/.test(n)) return 'quemador';

  // MAGNESIO / OMEGA 3
  if (/magnesio|bisglicinato|citrato.{0,8}mag|omega.{0,3}3|fish.{0,5}oil|aceite.{0,8}pescado/.test(n)) return 'magnesio';

  // VITAMINAS
  if (/vitam|zinc|calcio|resveratrol|ashwagandha|zma|cafeina|nad |multivit|citrato|coenzima/.test(n)) return 'vitamin';

  // HIDRATACIÓN
  if (/hidrat|iso.{0,5}sport|electro|recovery.{0,5}drink|sport.{0,5}drink|just.{0,5}carb|hydromax|hydroplus|energy.{0,5}gel|maltodextri|isotonic/.test(n)) return 'hidratacion';

  // BARRAS & SNACKS
  if (/beauty.{0,5}bar|iron.{0,5}bar|barra.{0,10}proteic|barra.{0,10}cereal|barra.{0,10}chocol|cereal.{0,5}bar|grows.{0,5}bar|brava.{0,5}bar|snack|granola|pancake|cupcake|omelette.{0,10}proteic|quelopaleo|bros.{0,5}bar|gelatina|mani.{0,5}king|vitalgy/.test(n)) return 'barra';

  // INDUMENTARIA
  if (/short|remera|camiseta|calza|top |buzo|campera|catsuit/.test(n)) return 'indumentaria';

  return 'otros';
}

function _mapCategoria(cat) {
  const m = {
    'proteina':'proteina','protein':'proteina','whey':'proteina',
    'creatina':'creatina','creatine':'creatina',
    'aminoacido':'aminoacido','aminoacidos':'aminoacido','bcaa':'aminoacido','aminoácido':'aminoacido',
    'vitaminas':'vitamin','vitamin':'vitamin','vitamina':'vitamin','vitamins':'vitamin',
    'magnesio':'magnesio','omega3':'magnesio','omega 3':'magnesio',
    'preworkout':'preworkout','pre-entreno':'preworkout','pre entreno':'preworkout',
    'quemador':'quemador','quemadores':'quemador','termogenico':'quemador','termogénico':'quemador',
    'colageno':'colageno','colágeno':'colageno','collagen':'colageno',
    'hidratacion':'hidratacion','hidratación':'hidratacion','hidratante':'hidratacion','isotonica':'hidratacion',
    'barra':'barra','barras':'barra','snack':'barra','snacks':'barra',
    'accesorio':'accesorio','accesorios':'accesorio','accesories':'accesorio',
    'indumentaria':'indumentaria','ropa':'indumentaria',
    'gainer':'gainer','gainers':'gainer','hipercalorico':'gainer','hipercalórico':'gainer',
    'otros':'otros','other':'otros'
  };
  const key = (cat||'').toLowerCase().trim();
  return m[key] || key;
}

function _catEmoji(cat) {
  const m = {
    'proteina':'🥛','creatina':'⚡','aminoacido':'🧬','vitaminas':'💊','magnesio':'🧲',
    'preworkout':'🔥','quemador':'🌡️','colageno':'🦴','hidratacion':'💧',
    'barra':'🍫','accesorio':'🏋️','indumentaria':'👕','gainer':'💪','otros':'📦'
  };
  return m[cat.toLowerCase()] || '📦';
}

/* ── GALLERY ENGINE ──────────────────────────────────────────
   Cada producto puede tener múltiples fotos usando "imgs": [...]
   galMove(id, dir)  → mueve -1 (prev) o +1 (next)
   galGo(id, index)  → va a una foto específica
────────────────────────────────────────────────────────────── */
function galMove(galId, dir, e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  const rail = document.getElementById(galId);
  if(!rail) return;
  const total = parseInt(rail.dataset.total)||1;
  let idx = parseInt(rail.dataset.index)||0;
  idx = (idx + dir + total) % total;
  galApply(galId, idx);
}
function galGo(galId, idx, e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  galApply(galId, idx);
}
function galApply(galId, idx){
  const rail = document.getElementById(galId);
  if(!rail) return;
  const total = parseInt(rail.dataset.total)||1;
  rail.style.transform = `translateX(-${idx * 100}%)`;
  rail.dataset.index = idx;
  // dots
  const dots = document.querySelectorAll(`#${galId}-dots .gal-dot`);
  dots.forEach((d,i)=>d.classList.toggle('active', i===idx));
  // counter
  const ctr = document.getElementById(`${galId}-counter`);
  if(ctr) ctr.textContent = `${idx+1} / ${total}`;
}

/* ── OPEN IMAGE MODAL (full screen) ── */
function openImgModal(src, name){
  if(!src || src==='') return;
  const ov = document.createElement('div');
  ov.id = 'imgModalOv';
  ov.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px';
  ov.innerHTML = `<img src="${src}" alt="${name}" style="max-width:92%;max-height:92vh;object-fit:contain;border-radius:10px;box-shadow:0 0 60px rgba(0,200,255,.2)">
    <button onclick="document.getElementById('imgModalOv').remove()" style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.2);color:#fff;width:38px;height:38px;border-radius:50%;font-size:1.1rem;cursor:pointer">✕</button>`;
  ov.onclick = e => { if(e.target===ov) ov.remove(); };
  document.body.appendChild(ov);
}

/* Touch / swipe support for gallery */
(function(){
  let startX = 0;
  document.addEventListener('touchstart', e=>{
    const rail = e.target.closest('.gallery-slides');
    if(rail) startX = e.touches[0].clientX;
  },{passive:true});
  document.addEventListener('touchend', e=>{
    const rail = e.target.closest('.gallery-slides');
    if(!rail || !startX) return;
    const diff = startX - e.changedTouches[0].clientX;
    if(Math.abs(diff) > 40) galMove(rail.id, diff > 0 ? 1 : -1, null);
    startX = 0;
  },{passive:true});
})();


// ── Logo inject ──
(function(){
  // logo injection disabled — logo.png used directly in HTML
  const _noop = true; if(_noop) return;
  const src = 'logo.png';
  ['heroLogo','navLogo','footerLogo'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.src = src;
  });
  document.querySelectorAll('.hero-logo, nav img, .nav-logo img, .footer-brand img').forEach(el=>{
    if(el && !el.src.startsWith('data:') && !el.src.startsWith('http')) el.src = src;
  });
})();



// ══════════════════════════════════════════════════════════
//  MODAL DE PRODUCTO
// ══════════════════════════════════════════════════════════
let modalPid = null;

function openProdModal(pid) {
  const p = getProduct(pid);
  if (!p) return;
  modalPid = pid;

  document.getElementById('modalImg').src = p.img || getFallbackImg(p.cat);
  document.getElementById('modalMarca').textContent = p.brand || '';
  document.getElementById('modalNombre').textContent = p.name || '';
  document.getElementById('modalDesc').textContent = p.desc || 'Suplemento de alta calidad para deportistas y personas activas.';

  const tarjeta = p.price_tarjeta || Math.round(p.price * 1.08);
  document.getElementById('modalPrecioTarjeta').textContent = `Tarjeta/QR/Débito: $${tarjeta.toLocaleString('es-AR')}`;
  document.getElementById('modalPrecioCash').textContent = `$${p.price.toLocaleString('es-AR')}`;

  // Flavors
  const flavorWrap = document.getElementById('modalFlavorWrap');
  if (p.flavors && p.flavors.length > 1) {
    flavorWrap.innerHTML = `<label style="font-size:.7rem;color:#aaa;text-transform:uppercase;letter-spacing:.1em">Sabor / Presentación</label>
      <select id="modalFlavor" style="width:100%;background:#1a1a1a;border:1px solid rgba(0,200,255,.2);border-radius:6px;padding:9px;color:#fff;font-family:'Rajdhani',sans-serif;font-size:.95rem;margin-top:4px" onchange="updateModalFlavor()">
        ${p.flavors.map(f => `<option value="${f.name}" ${f.stock===0?'disabled':''} data-stock="${f.stock}">${f.name}${f.stock===0?' (Sin stock)':f.stock<=3&&f.stock>0?` (Últimas ${f.stock})`:`  ✓ ${f.stock} ud.`}</option>`).join('')}
      </select>`;
    updateModalFlavor();
  } else {
    const stock = p.flavors[0]?.stock || 0;
    flavorWrap.innerHTML = '';
    document.getElementById('modalStock').textContent = stock > 0 ? `✓ ${stock} unidades en stock` : '❌ Sin stock';
  }

  // Reseñas
  var revForm = document.getElementById('modalReviewForm');
  var revList = document.getElementById('modalReviewList');
  if(revForm){
    revForm.innerHTML = '<div style="display:flex;gap:4px;margin-bottom:8px">'
      + [1,2,3,4,5].map(function(n){ return '<label style="cursor:pointer;font-size:1.3rem"><input type="radio" name="rev-stars-'+pid+'" value="'+n+'" style="display:none">' + (n<=3?'☆':'☆') + '</label>'; }).join('')
      + '</div>'
      + '<div style="display:flex;gap:6px"><input id="rev-comment-'+pid+'" type="text" placeholder="Comentario corto (opcional)" style="flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;padding:8px 12px;border-radius:6px;font-family:Rajdhani,sans-serif;font-size:.88rem;outline:none">'
      + '<button onclick="submitReview(\''+pid+'\')" style="padding:8px 14px;background:linear-gradient(135deg,#FFD700,#FFA500);color:#000;border:none;border-radius:6px;font-family:Rajdhani,sans-serif;font-weight:700;font-size:.82rem;cursor:pointer">Enviar</button></div>';
    // Star click handlers
    revForm.querySelectorAll('label').forEach(function(lbl,i){
      lbl.onclick = function(){
        revForm.querySelectorAll('label').forEach(function(l,j){ l.textContent = j<=i ? '★' : '☆'; });
      };
    });
  }
  if(revList){
    var revs = _reviews[_revKey(pid)] || [];
    if(revs.length > 0){
      var avg = revs.reduce(function(s,r){return s+r.rating;},0) / revs.length;
      revList.innerHTML = '<div style="font-size:.85rem;color:#FFD700">' + '★'.repeat(Math.round(avg)) + '☆'.repeat(5-Math.round(avg)) + ' <span style="color:#999">' + avg.toFixed(1) + ' (' + revs.length + ' valoraciones)</span></div>';
      revs.slice(-3).forEach(function(r){
        if(r.text) revList.innerHTML += '<div style="font-size:.78rem;color:#999;margin-top:4px;padding:6px 10px;background:rgba(255,255,255,.03);border-radius:6px">' + '★'.repeat(r.rating) + ' — "' + r.text.substring(0,100) + '" <span style="color:#555">' + r.fecha + '</span></div>';
      });
    }
  }

  document.getElementById('prodModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  mostrarRelacionados(p);
}

function updateModalFlavor() {
  const sel = document.getElementById('modalFlavor');
  if (!sel) return;
  const stock = parseInt(sel.options[sel.selectedIndex].dataset.stock) || 0;
  document.getElementById('modalStock').textContent = stock > 0 ? `✓ ${stock} unidades en stock` : '❌ Sin stock';
  // Update image if product has img per flavor
  const p = getProduct(modalPid);
  if (p && p.imgs && p.imgs[sel.value]) {
    document.getElementById('modalImg').src = p.imgs[sel.value];
  }
}

function mostrarRelacionados(prod) {
  var sec = document.getElementById('modalRelacionados');
  var grid = document.getElementById('modalRelGrid');
  if (!sec || !grid) return;

  var relacionados = PRODUCTS.filter(function(p) {
    return p.id !== prod.id
      && p.cat === prod.cat
      && p.flavors && p.flavors.some(function(f){ return f.stock > 0; });
  }).slice(0, 3);

  if (relacionados.length < 3) {
    var extras = PRODUCTS.filter(function(p) {
      return p.id !== prod.id && p.cat !== prod.cat
        && p.flavors && p.flavors.some(function(f){ return f.stock > 0; })
        && !relacionados.find(function(r){ return r.id === p.id; });
    }).slice(0, 3 - relacionados.length);
    relacionados = relacionados.concat(extras);
  }

  if (relacionados.length === 0) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';

  // Crear cards con createElement para evitar problemas de comillas
  grid.innerHTML = '';
  relacionados.forEach(function(p) {
    var card = document.createElement('div');
    card.style.cssText = 'cursor:pointer;background:var(--dark3);border:1px solid rgba(255,255,255,.07);border-radius:10px;overflow:hidden;transition:border-color .2s';
    card.addEventListener('mouseover', function(){ this.style.borderColor='rgba(0,200,255,.3)'; });
    card.addEventListener('mouseout',  function(){ this.style.borderColor='rgba(255,255,255,.07)'; });
    card.addEventListener('click',     function(){ openProdModal(p.id); });

    var img = p.img || getFallbackImg(p.cat);
    card.innerHTML = '<div style="height:80px;overflow:hidden;background:#0d0d0d;display:flex;align-items:center;justify-content:center">'
      + '<img src="' + img + '" alt="' + p.name + '" style="width:100%;height:100%;object-fit:contain;padding:6px">'
      + '</div>'
      + '<div style="padding:8px">'
      + '<div style="font-size:.72rem;color:#888;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (p.brand||'') + '</div>'
      + '<div style="font-size:.78rem;font-weight:700;line-height:1.2;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + p.name + '</div>'
      + '<div style="font-size:.85rem;color:var(--cyan);font-weight:700">$' + p.price.toLocaleString('es-AR') + '</div>'
      + '</div>';
    grid.appendChild(card);
  });
}

function closeProdModal(e) {
  if (e.target === document.getElementById('prodModal')) closeProdModalBtn();
}
function closeProdModalBtn() {
  document.getElementById('prodModal').classList.remove('open');
  document.body.style.overflow = '';
  modalPid = null;
  if(typeof resetMeta === 'function') resetMeta();
}

function addFromModal() {
  if (!modalPid) return;
  const flavorSel = document.getElementById('modalFlavor');
  // Simulate click on the product's add button
  if (flavorSel) {
    const cardSel = document.querySelector(`select[onchange*="${modalPid}"]`);
    if (cardSel) cardSel.value = flavorSel.value;
  }
  addToCartById(modalPid);
  closeProdModalBtn();
}

function consultarWA() {
  if (!modalPid) return;
  const p = getProduct(modalPid);
  const sabor = document.getElementById('modalFlavor')?.value || '';
  const msg = `Hola MAXUP! Quiero consultar sobre: ${p.name}${sabor?' - '+sabor:''} ($${p.price.toLocaleString('es-AR')} efectivo). ¿Tienen disponible?`;
  window.open(`https://wa.me/${WA_DEFAULT}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ══════════════════════════════════════════════════════════
//  CALCULADORA DE PROTEÍNA
// ══════════════════════════════════════════════════════════
function calcularRecomendacion() {
  var peso = parseFloat(document.getElementById('calcPeso').value);
  var objetivo = document.getElementById('calcObjetivo').value;
  var nivel = document.getElementById('calcNivel').value;
  var res = document.getElementById('calcResultado');
  if (!peso || !objetivo || !nivel) {
    res.style.display = 'block';
    res.innerHTML = '<p style="color:#FF0099">Completa todos los campos para ver tu recomendacion.</p>';
    return;
  }

  // Buscar por palabras clave en el nombre del producto (compatible con datos de Sheets)
  function findProd(keywords, usados) {
    for (var k = 0; k < keywords.length; k++) {
      var kw = keywords[k].toLowerCase();
      for (var pi = 0; pi < PRODUCTS.length; pi++) {
        var p = PRODUCTS[pi];
        if (usados[p.id]) continue;
        var nameMatch = p.name.toLowerCase().indexOf(kw) >= 0;
        var catMatch = p.cat && p.cat.toLowerCase().indexOf(kw) >= 0;
        var hasStock = p.flavors && p.flavors.some(function(f) { return f.stock > 0; });
        if ((nameMatch || catMatch) && hasStock) return p;
      }
    }
    return null;
  }

  var RECS = {
    masa: { slots: [
      { kw: ['whey platinum','whey protein','proteina','protein'], tip: 'Proteina Whey para alcanzar los '+(peso*2).toFixed(0)+'g diarios que necesitas para ganar masa.' },
      { kw: ['creatina','creatine'], tip: 'Creatina para aumentar tu fuerza y potencia en un 10-15%.' },
      { kw: ['mutant','gainer','mass','ultra mass'], tip: 'Gainer para sumar calorias cuando cuesta comer suficiente.' },
      { kw: ['bcaa','mtor','eaa'], tip: 'BCAA para proteger el musculo durante el entrenamiento.' }
    ]},
    definir: { slots: [
      { kw: ['thermo','termogenic','fat burner','lipo','quemador'], tip: 'Termogenico para acelerar el metabolismo y quemar mas grasa.' },
      { kw: ['whey','proteina','protein'], tip: 'Proteina para mantener los '+(peso*2.2).toFixed(0)+'g diarios sin perder musculo.' },
      { kw: ['bcaa','mtor','eaa'], tip: 'BCAA para preservar masa muscular en deficit calorico.' },
      { kw: ['multivitaminico','multi','omega 3','omega3'], tip: 'Multivitaminico para cubrir deficiencias durante la dieta.' }
    ]},
    resistencia: { slots: [
      { kw: ['hydroplus','hydromax','isoton','sport drink','recovery'], tip: 'Hidratacion con electrolitos, clave en entrenamientos de larga duracion.' },
      { kw: ['bcaa','mtor','eaa'], tip: 'BCAA para retrasar la fatiga muscular.' },
      { kw: ['colag','collagen'], tip: 'Colageno para proteger articulaciones del impacto repetido.' },
      { kw: ['multivitaminico','multi','omega 3','omega3'], tip: 'Multivitaminico para mantener energia y recuperacion.' }
    ]},
    salud: { slots: [
      { kw: ['omega 3','omega3','fish oil'], tip: 'Omega-3 para reducir la inflamacion y proteger el corazon.' },
      { kw: ['multivitaminico','multi vitamin'], tip: 'Multivitaminico para cubrir todas las deficiencias nutricionales.' },
      { kw: ['colag','collagen'], tip: 'Colageno para mejorar piel, pelo, unas y articulaciones.' },
      { kw: ['zma','magnesio','citrato'], tip: 'ZMA o Magnesio para mejorar el sueno y la recuperacion.' }
    ]},
    recuperacion: { slots: [
      { kw: ['colag','collagen'], tip: 'Colageno hidrolizado para reparar cartilagos y tendones.' },
      { kw: ['glutamina','glutamine'], tip: 'Glutamina para acelerar la recuperacion muscular post-entreno.' },
      { kw: ['zma','magnesio','citrato'], tip: 'ZMA o Magnesio para reducir calambres y mejorar el sueno.' },
      { kw: ['omega 3','omega3','fish oil'], tip: 'Omega-3 para reducir la inflamacion y el dolor muscular.' }
    ]}
  };

  var rec = RECS[objetivo];
  if (!rec) return;

  var prodsRec = [];
  var tipsRec = [];
  var usados = {};
  rec.slots.forEach(function(slot) {
    var prod = findProd(slot.kw, usados);
    if (prod) { prodsRec.push(prod); tipsRec.push(slot.tip); usados[prod.id] = true; }
  });

  var objTexto = {masa:'Ganar masa muscular', definir:'Definicion y bajar grasa',
    resistencia:'Resistencia y rendimiento', salud:'Salud y bienestar general',
    recuperacion:'Recuperacion'}[objetivo] || objetivo;
  var nivTexto = {principiante:'Principiante', intermedio:'Intermedio', avanzado:'Avanzado'}[nivel];

  var html = '<h4 style="color:#fff;letter-spacing:.04em;margin-bottom:14px">Recomendacion para <span style="color:var(--cyan)">'
    + nivTexto + '</span> &mdash; Objetivo: <span style="color:var(--pink)">' + objTexto + '</span></h4>'
    + '<ul style="color:#bbb;font-size:.88rem;margin:0 0 16px 18px;line-height:2">';
  tipsRec.forEach(function(tip) { html += '<li>' + tip + '</li>'; });
  html += '</ul><div style="display:flex;flex-direction:column;gap:8px">';
  res.style.display = 'block';
  res.innerHTML = html;
  // Agregar productos con event listeners reales (evita problemas de comillas en onclick)
  var prodContainer = res.querySelector('.recom-prods');
  if (!prodContainer) {
    prodContainer = document.createElement('div');
    prodContainer.className = 'recom-prods';
    prodContainer.style.cssText = 'display:flex;flex-direction:column;gap:8px';
    res.appendChild(prodContainer);
  }
  if (prodsRec.length === 0) {
    prodContainer.innerHTML = '<p style="color:#888">No hay productos en stock para este objetivo ahora.</p>';
  } else {
    prodsRec.forEach(function(p) {
      var div = document.createElement('div');
      div.className = 'calc-prod-item';
      div.style.cssText = 'cursor:pointer;border-radius:8px;transition:background .2s';
      div.innerHTML = '<div class="calc-prod-emoji">' + p.emoji + '</div>'
        + '<div class="calc-prod-info">'
        + '<div class="calc-prod-nombre">' + p.name + '</div>'
        + '<div class="calc-prod-razon">' + p.brand + ' &mdash; $' + p.price.toLocaleString('es-AR') + ' efectivo</div>'
        + '</div>'
        + '<span style="color:var(--cyan);font-size:.9rem;font-weight:700">Ver &rarr;</span>';
      div.addEventListener('mouseover', function() { this.style.background = 'rgba(0,200,255,.08)'; });
      div.addEventListener('mouseout',  function() { this.style.background = ''; });
      (function(pid) {
        div.addEventListener('click', function() { openProdModal(pid); });
      })(p.id);
      prodContainer.appendChild(div);
    });
  }
  var note = document.createElement('p');
  note.style.cssText = 'color:#555;font-size:.75rem;margin-top:14px';
  note.textContent = 'Hace clic en cada producto para ver detalles y agregarlo al carrito.';
  res.appendChild(note);
}

// ══════════════════════════════════════════════════════════
//  COMPARADOR
// ══════════════════════════════════════════════════════════
function poblarComparador() {
  ['comp1','comp2','comp3'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const primer = sel.options[0];
    sel.innerHTML = '';
    sel.appendChild(primer);
    PRODUCTS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.brand})`;
      sel.appendChild(opt);
    });
  });
}

function actualizarComparador() {
  var ids = ['comp1','comp2','comp3'].map(function(id){ var el=document.getElementById(id); return el?el.value:''; }).filter(Boolean);
  var tabla = document.getElementById('compTabla');
  var iaDiv = document.getElementById('compIA');
  if (ids.length < 2) { tabla.style.display='none'; iaDiv.style.display='none'; return; }

  var prods = ids.map(function(id){ return getProduct(id); }).filter(Boolean);
  if (prods.length < 2) { tabla.style.display='none'; iaDiv.style.display='none'; return; }

  var precios = prods.map(function(p){ return p.price; });
  var minPrecio = Math.min.apply(null, precios);
  var maxStock = Math.max.apply(null, prods.map(function(p){ return p.flavors.reduce(function(s,f){ return s+f.stock; },0); }));

  // Obtener datos técnicos de cada producto
  var tecsArr = prods.map(function(p){ return buscarEnDB(p); });

  // Construir filas técnicas unificadas
  // Definir qué campos mostrar y en qué orden
  var camposTec = [
    ['tipo',         '🏷 Tipo / Clasificación'],
    ['proteina',     '💪 Proteína por porción'],
    ['colageno',     '🦴 Colágeno por porción'],
    ['carbs',        '🍞 Carbohidratos'],
    ['grasas',       '🫐 Grasas'],
    ['calorias',     '🔥 Calorías por porción'],
    ['lactosa',      '🥛 Lactosa'],
    ['aminoacidos',  '🧬 Aminoácidos clave'],
    ['leucina',      '⚡ Leucina'],
    ['total',        '⚡ Total BCAAs'],
    ['composicion',  '📋 Composición'],
    ['filtrado',     '🔬 Proceso de fabricación'],
    ['absorcion',    '⏱ Absorción'],
    ['pureza',       '✨ Pureza'],
    ['certificacion','🏅 Certificación'],
    ['cafeina',      '☕ Cafeína'],
    ['citrulina',    '💊 Citrulina Malato'],
    ['beta_alanina', '💊 Beta-Alanina'],
    ['agmatina',     '💊 Agmatina'],
    ['glicerol',     '💊 Glicerol'],
    ['otros',        '➕ Otros activos'],
    ['vitc',         '🍊 Vitamina C'],
    ['minerales',    '⚗️ Minerales'],
    ['magnesio',     '🧲 Magnesio'],
    ['zinc',         '🔩 Zinc'],
    ['b6',           '💊 Vitamina B6'],
    ['epa_dha',      '🐟 EPA + DHA'],
    ['fuente_prot',  '📦 Fuente proteica'],
    ['dosis',        '⚖️ Dosis efectiva'],
    ['mecanismo',    '🔬 Cómo funciona'],
    ['efectos',      '⚡ Efectos'],
    ['aditivos',     '🧪 Aditivos / Excipientes'],
    ['cuando',       '⏰ Cuándo tomarlo'],
    ['advertencia',  '⚠️ Importante'],
    ['nota',         '📌 Nota técnica'],
    ['limitacion',   '⚠️ Limitación'],
    ['evitar',       '🚫 Evitar si'],
    ['ideal',        '✅ Ideal para'],
    ['ventaja',      '⭐ Ventaja clave'],
  ];

  tabla.style.display = 'block';
  iaDiv.style.display = 'none'; // Ocultar el bloque separado

  var rows = '';

  // Header
  rows += '<tr><th style="width:200px">Característica</th>' + prods.map(function(p){ return '<th>'+p.name+'</th>'; }).join('') + '</tr>';

  // Separador visual
  rows += '<tr><td colspan="'+(prods.length+1)+'" style="background:rgba(0,200,255,.08);padding:6px 12px;font-family:Bebas Neue,sans-serif;font-size:.85rem;letter-spacing:.1em;color:var(--cyan)">PRECIOS</td></tr>';

  // Precio efectivo
  rows += '<tr><td>Precio efectivo</td>' + prods.map(function(p){
    var mejor = p.price === minPrecio;
    return '<td class="'+(mejor?'mejor':'')+'">$'+p.price.toLocaleString('es-AR')+(mejor?'<br><span style="font-size:.75rem">✓ Mejor precio</span>':'')+'</td>';
  }).join('') + '</tr>';

  // Precio tarjeta
  rows += '<tr><td>Precio tarjeta</td>' + prods.map(function(p){
    return '<td>$'+(p.price_tarjeta||Math.round(p.price*1.08)).toLocaleString('es-AR')+'</td>';
  }).join('') + '</tr>';

  // Sabores
  rows += '<tr><td>Sabores / Presentaciones</td>' + prods.map(function(p){
    return '<td>'+p.flavors.length+' opción'+(p.flavors.length>1?'es':'')+'</td>';
  }).join('') + '</tr>';

  // Separador ficha técnica
  rows += '<tr><td colspan="'+(prods.length+1)+'" style="background:rgba(0,200,255,.08);padding:6px 12px;font-family:Bebas Neue,sans-serif;font-size:.85rem;letter-spacing:.1em;color:var(--cyan)">FICHA TÉCNICA</td></tr>';

  // Filas técnicas — solo mostrar las que al menos UN producto tiene dato
  camposTec.forEach(function(par) {
    var campo = par[0], label = par[1];
    var hayDato = tecsArr.some(function(tec){ return tec && tec[campo]; });
    if (!hayDato) return;

    rows += '<tr><td>'+label+'</td>';
    tecsArr.forEach(function(tec) {
      var val = tec && tec[campo] ? tec[campo] : '—';
      var isWarning = campo === 'evitar' || campo === 'limitacion' || campo === 'advertencia';
      var isGood = campo === 'ideal' || campo === 'ventaja';
      var color = isWarning ? '#FF9900' : isGood ? '#00FF88' : '';
      rows += '<td style="'+(color?'color:'+color:'')+'">'+val+'</td>';
    });
    rows += '</tr>';
  });

  // Botones
  rows += '<tr><td></td>' + prods.map(function(p){
    return '<td><button class="comp-btn" onclick="openProdModal('+JSON.stringify(p.id)+')">Ver producto</button></td>';
  }).join('') + '</tr>';

  tabla.innerHTML = '<table>' + rows + '</table>';
}

function generarHTML(secciones) {
  var html = '';
  secciones.forEach(function(s) {
    html += '<h4>' + s.titulo + '</h4><p>' + s.texto + '</p>';
  });
  return html;
}




var catLabels = {
  proteina:'Proteina', creatina:'Creatina', aminoacido:'Aminoacidos',
  preworkout:'Pre-entreno', quemador:'Quemador/Termogenico', gainer:'Gainer',
  colageno:'Colageno', vitamin:'Vitaminas y Minerales', hidratacion:'Hidratacion',
  barra:'Barra proteica', accesorio:'Accesorio'
};


// ══════════════════════════════════════════════════════════
// DATOS TÉCNICOS POR PRODUCTO
// Composición real, proteína/porción, tipo, aditivos, para quién
// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
// BASE DE DATOS DE ANÁLISIS - MAXUP SUPLEMENTOS
// Sin IA, sin internet. Todo embebido. Actualizado manualmente.
// ══════════════════════════════════════════════════════════

var DB_ANALISIS = {

// ─────────────────────────────────────────────
// PROTEÍNAS
// ─────────────────────────────────────────────
'sn_whey_dp': {
  tipo: 'Concentrado de suero (WPC 80%)',
  proteina: '24g por porción de 35g',
  carbs: '3-4g por porción',
  grasas: '2-3g por porción',
  lactosa: 'Alta (~3g/porción) — puede generar molestias',
  aminoacidos: 'Leucina 2.5g · BCAAs totales ~5.5g/porción',
  filtrado: 'Filtración estándar — retiene algo de grasa y lactosa',
  absorcion: 'Media — 3 a 4 horas',
  aditivos: 'Sucralosa, saborizantes nat. y art.',
  ideal: 'Principiantes o intermedios con buena tolerancia a la lactosa que buscan el mejor precio sin sacrificar calidad.',
  evitar: 'Intolerantes a la lactosa, personas en definición extrema.',
  ventaja: 'Mejor precio por gramo del catálogo. 4 sabores. Mayor stock.',
},
'sn_plat_2lb': {
  tipo: 'Blend: Concentrado + Aislado microfiltrado (WPC+WPI)',
  proteina: '25g por porción de 35g',
  carbs: '2-3g por porción',
  grasas: '1.5-2g por porción',
  lactosa: 'Baja (~1-2g/porción) por fracción aislada',
  aminoacidos: 'Leucina 2.7g · BCAAs totales ~6g/porción',
  filtrado: 'Microfiltración en fracción aislada — mejor pureza',
  absorcion: 'Media-rápida — 2 a 3 horas',
  aditivos: 'Sucralosa, lecitina de soja (emulsionante), saborizantes',
  ideal: 'Intermedios/avanzados que buscan mayor calidad proteica con menor lactosa sin pagar precio de aislado puro.',
  evitar: 'Alérgicos a la soja. Intolerantes severos (mejor aislado puro).',
  ventaja: 'Mejor perfil aminoacídico que el concentrado. Pote hermético de mejor conservación.',
},
'sn_plat_3kg': {
  tipo: 'Blend: Concentrado + Aislado microfiltrado (WPC+WPI) — Formato grande',
  proteina: '25g por porción de 35g',
  carbs: '2-3g por porción',
  lactosa: 'Baja por fracción aislada',
  aminoacidos: 'Leucina 2.7g · BCAAs ~6g/porción',
  filtrado: 'Microfiltración',
  absorcion: 'Media-rápida',
  ideal: 'Uso diario constante. El formato 3kg ofrece el mejor precio por porción de toda la línea Platinum.',
  ventaja: '~85 porciones. Ideal para consumo prolongado sin recompra frecuente.',
},
'ena_truemade': {
  tipo: 'Blend premium: Concentrado + Aislado (proceso TrueMade)',
  proteina: '26g por porción de 38g',
  carbs: '3g por porción',
  grasas: '2g por porción',
  lactosa: 'Baja — fracción aislada incluida',
  aminoacidos: 'Leucina 2.8g · BCAAs ~6.2g/porción. Perfil completo de EAAs.',
  filtrado: 'TrueMade: microfiltración avanzada con mayor transparencia en fracciones declaradas',
  absorcion: 'Media-rápida — 2 a 3 horas',
  aditivos: 'Sin colorantes artificiales. Sucralosa, saborizantes.',
  ideal: 'Deportistas que valoran etiquetado transparente y formulación cuidada. Excelente para volumen o mantenimiento.',
  evitar: 'Presupuesto muy ajustado.',
  ventaja: 'Mayor proteína por porción del segmento 2 Lb. Marca referente en transparencia de etiquetado.',
},
'gn_isogold': {
  tipo: 'Aislado puro (WPI 90%) — Intercambio iónico',
  proteina: '27g por porción de 30g (90%+ proteína en peso)',
  carbs: '0-1g por porción',
  grasas: '0.5g por porción',
  lactosa: 'Menos de 0.5g/porción — APTO intolerantes',
  aminoacidos: 'Leucina 3g · BCAAs ~6.5g/porción — el mayor del catálogo',
  filtrado: 'Intercambio iónico: elimina casi toda lactosa, grasa e impurezas',
  absorcion: 'Rápida — 1 a 2 horas (ideal post-entreno inmediato)',
  aditivos: 'Mínimos. Sucralosa.',
  ideal: 'Intolerantes a la lactosa, personas en definición extrema, atletas de alto rendimiento o competidores.',
  evitar: 'Volumen sin restricción calórica (el concentrado es suficiente y más económico).',
  ventaja: 'Máxima pureza proteica del catálogo. El de mayor leucina por porción.',
},
'gn_vegetal': {
  tipo: 'Aislado vegetal (arveja + arroz)',
  proteina: '25g por porción',
  carbs: '2-3g por porción',
  grasas: '1.5g por porción',
  lactosa: 'Sin lactosa — 100% vegetal',
  aminoacidos: 'Perfil completo. La mezcla arveja+arroz compensa el déficit de metionina del aislado de arveja solo.',
  filtrado: 'Proceso de aislamiento vegetal. Sin derivados animales.',
  absorcion: 'Media — 2 a 3 horas',
  ideal: 'Veganos, vegetarianos, intolerantes a la lactosa, alérgicos a proteína de leche (APLV).',
  evitar: 'Alérgicos a leguminosas.',
  ventaja: 'Sin lactosa, sin gluten, sin derivados animales. Apta para cualquier dieta.',
},
'nfit_vegprot': {
  tipo: 'Aislado de arveja (proteína vegetal)',
  proteina: '24g por porción',
  carbs: '2g por porción',
  lactosa: 'Sin lactosa — 100% vegetal',
  aminoacidos: 'Buen perfil. Solo arveja (sin arroz) — leve déficit en metionina.',
  filtrado: 'Aislamiento vegetal puro',
  ideal: 'Veganos, vegetarianos e intolerantes. Sabor chocolate disponible.',
  ventaja: 'Formulación limpia. Buen precio.',
},
'wo_prot': {
  tipo: 'Blend proteico femenino (concentrado + aislado + colágeno)',
  proteina: '22g por porción',
  carbs: '3g por porción',
  lactosa: 'Moderada',
  aminoacidos: 'Perfil estándar de suero',
  filtrado: 'Blend con adición de colágeno hidrolizado',
  ideal: 'Mujeres que buscan proteína + colágeno en un solo producto. Cómodo como all-in-one.',
  evitar: 'Quienes prefieren controlar dosis de proteína y colágeno por separado.',
  ventaja: 'Proteína + Colágeno en una sola toma. Diseñado para metabolismo femenino.',
},
'wo_protfit': {
  tipo: 'Proteína + Colágeno hidrolizado (fórmula femenina)',
  proteina: '20g por porción aprox.',
  lactosa: 'Moderada',
  ideal: 'Mujeres que quieren proteína muscular y beneficios del colágeno (piel, articulaciones) simultáneamente.',
  ventaja: 'Doble función en un producto. Específico para necesidades femeninas.',
},
'gen_7900': {
  tipo: 'Concentrado de suero (WPC)',
  proteina: '24g por porción aprox.',
  lactosa: 'Moderada-alta',
  ideal: 'Deportistas que buscan una opción alternativa de concentrado a buen precio.',
  ventaja: 'Precio competitivo. Formato pote.',
},
'gen_7900dp': {
  tipo: 'Concentrado de suero (WPC)',
  proteina: '24g por porción aprox.',
  lactosa: 'Moderada-alta',
  ideal: 'Misma fórmula que el pote, formato doypack portable.',
  ventaja: 'Precio accesible. Fácil de transportar.',
},
'xtr_bestwhey': {
  tipo: 'Blend: Concentrado + Aislado (Xtrenght)',
  proteina: '24-25g por porción',
  lactosa: 'Baja-moderada',
  aminoacidos: 'Buen perfil de BCAAs',
  ideal: 'Deportistas que buscan una alternativa al Platinum con buen precio.',
  ventaja: 'Buena relación calidad-precio. Marca reconocida en el mercado nacional.',
},
'gn_ripped': {
  tipo: 'Proteína con termogénicos y L-Carnitina (Whey Ripped)',
  proteina: '22-24g por porción',
  lactosa: 'Moderada',
  otros: 'Incluye L-Carnitina + CLA + termogénicos para quemar grasa',
  ideal: 'Personas en definición que quieren combinar proteína con suporte para perder grasa en una sola toma.',
  evitar: 'Personas sensibles a estimulantes. Uso nocturno.',
  ventaja: 'Proteína + quemador en un producto. Cómodo para fase de definición.',
},
'gn_100whey': {
  tipo: 'Concentrado de suero 100% (Gold Nutrition)',
  proteina: '24g por porción',
  lactosa: 'Moderada-alta',
  ideal: 'Uso general. Buena marca con larga trayectoria.',
  ventaja: 'Marca Gold Nutrition con reputación establecida en el mercado.',
},
'mer_blend': {
  tipo: 'Blend proteico (Mervick)',
  proteina: '24g por porción aprox.',
  lactosa: 'Moderada',
  ideal: 'Deportistas que buscan alternativa a las marcas líderes con buena calidad.',
  ventaja: 'Marca Mervick con buena reputación. Precio competitivo.',
},

// ─────────────────────────────────────────────
// CREATINAS
// ─────────────────────────────────────────────
'sn_creat_pote': {
  tipo: 'Creatina Monohidrato micronizada — Pote 300g',
  pureza: '99.9%+ monohidrato puro',
  dosis: '3-5g diarios. Sin fase de carga obligatoria.',
  particula: 'Micronizada 200 mesh — mejor disolución en agua',
  aditivos: 'Sin aditivos. Solo creatina pura.',
  efectos: '+5-15% fuerza máxima, +1-3kg masa muscular en primeros 3 meses, mejor recuperación entre series',
  cuando: 'Cualquier hora del día. Muchos prefieren post-entreno con carbohidratos para mejor captación.',
  ideal: 'Cualquier persona que entrena fuerza o potencia. El suplemento más estudiado después de la proteína.',
  ventaja: 'Pote hermético de mejor conservación. Fácil dosificación con scoop.',
},
'sn_creat_doy': {
  tipo: 'Creatina Monohidrato micronizada — Doypack 300g',
  pureza: '99.9%+ monohidrato puro',
  dosis: '3-5g diarios',
  particula: 'Micronizada — misma calidad que el pote',
  aditivos: 'Versión saborizada: edulcorante y saborizante. Versión neutra: sin aditivos.',
  efectos: 'Idénticos al pote',
  ideal: 'Mismos casos que el pote. Quienes prefieren formato portátil o versión con sabor.',
  ventaja: 'Doypack más conveniente para llevar. Versión saborizada facilita el consumo.',
},
'sn_creat_500': {
  tipo: 'Creatina Monohidrato micronizada — Pote 500g',
  pureza: '99.9%+ monohidrato',
  dosis: '3-5g diarios (~100 a 166 días de uso)',
  ideal: 'Uso diario regular. El mejor precio por gramo de creatina de toda la línea Star Nutrition.',
  ventaja: 'Mayor duración sin recompra. Precio por gramo inferior al pote de 300g.',
},
'sn_creat_1kg': {
  tipo: 'Creatina Monohidrato micronizada — Pote 1 Kg',
  pureza: '99.9%+ monohidrato',
  dosis: '3-5g diarios (~200 a 333 días de uso)',
  ideal: 'Uso a largo plazo. Máxima economía por gramo del catálogo.',
  ventaja: 'El precio por gramo más bajo de todo el catálogo. Para 6-12 meses de uso continuo.',
},
'on_creat': {
  tipo: 'Creatina Monohidrato Creapure® certificada (Optimum Nutrition)',
  pureza: 'Creapure® = 99.99% monohidrato. El estándar de pureza más alto del mundo.',
  dosis: '3-5g diarios',
  particula: 'Micronizada Creapure® — el gránulo más fino y puro disponible',
  aditivos: 'Sin aditivos. Solo Creapure puro.',
  certificacion: 'Certificado NSF for Sport (apto para atletismo de competición)',
  efectos: 'Biológicamente idénticos a cualquier monohidrato de calidad. La diferencia está en la pureza certificada.',
  ideal: 'Atletas de competición que requieren certificación anti-doping. Quienes quieren el máximo estándar sin margen de duda.',
  ventaja: 'Certificación Creapure® con análisis independiente de pureza. Referente mundial de calidad.',
},
'ena_creat': {
  tipo: 'Creatina Micronizada (ENA)',
  pureza: 'Monohidrato micronizado de buena calidad',
  dosis: '3-5g diarios',
  ideal: 'Deportistas que prefieren la marca ENA. Misma eficacia que otras creatinas de buena calidad.',
  ventaja: 'Marca ENA con trayectoria nacional. Proceso micronizado.',
},
'gn_creat': {
  tipo: 'Creatina Monohidrato (Gold Nutrition)',
  pureza: 'Monohidrato estándar',
  dosis: '3-5g diarios',
  ideal: 'Precio accesible con buena calidad de marca reconocida.',
  ventaja: 'Gold Nutrition es una marca establecida. Opción económica confiable.',
},
'mxf_creat': {
  tipo: 'Creatina Monohidrato (Max Force)',
  pureza: 'Monohidrato estándar',
  dosis: '3-5g diarios',
  ideal: 'Personas con presupuesto ajustado que quieren los beneficios de la creatina.',
  ventaja: 'El precio más bajo de creatina del catálogo.',
},
'xtr_creat250': {
  tipo: 'Creatina Monohidrato (Xtrenght 250g)',
  pureza: 'Monohidrato estándar',
  dosis: '3-5g diarios',
  ideal: 'Opción intermedia de buena calidad.',
  ventaja: 'Marca Xtrenght. Formato de prueba para quienes comienzan.',
},
'xtr_creat500': {
  tipo: 'Creatina Monohidrato (Xtrenght 500g)',
  pureza: 'Monohidrato estándar',
  dosis: '3-5g diarios',
  ideal: 'Uso regular. Mejor precio por gramo que la versión 250g.',
  ventaja: 'Formato grande. Buena relación precio-calidad.',
},

// ─────────────────────────────────────────────
// COLÁGENOS
// ─────────────────────────────────────────────
'sn_col210': {
  tipo: 'Colágeno hidrolizado tipo I y III — 210g',
  colageno: '10g por porción de 10g',
  vitc: '⚠ NO incluida — agregar 50-100mg aparte para maximizar síntesis',
  minerales: 'Sin minerales adicionales',
  peso_mol: 'Péptidos de bajo peso molecular — alta biodisponibilidad',
  cuando: 'En ayunas o post-entreno, con vitamina C aparte',
  ideal: 'Quienes ya toman vitamina C por separado. Articulaciones, piel, tendones, huesos.',
  advertencia: 'Sin vitamina C la síntesis de colágeno endógeno es subóptima. Siempre combinarlo.',
  ventaja: 'Mayor cantidad de colágeno puro por gramo. Precio más accesible.',
},
'sn_col_sport': {
  tipo: 'Colágeno hidrolizado tipo I y III + Magnesio + Fósforo — 360g',
  colageno: '10g por porción',
  vitc: '⚠ NO incluida — agregar 50-100mg aparte',
  minerales: 'Magnesio ~150mg/porción + Fósforo',
  magnesio_efecto: 'Reduce calambres, mejora contracción muscular, potencia el sueño de recuperación. El 70% de los deportistas tiene déficit de Mg.',
  cuando: 'En ayunas o post-entreno. Excelente tomarlo antes de dormir por el Magnesio.',
  ideal: 'Deportistas con alta carga de entrenamiento, personas con calambres frecuentes, quienes no toman magnesio por separado.',
  ventaja: 'Colágeno + Magnesio en una sola toma. Dos suplementos en uno.',
},
'sn_col_plus': {
  tipo: 'Colágeno hidrolizado tipo I y III + Vitamina C + activos — 360g',
  colageno: '10g por porción',
  vitc: '✓ INCLUIDA ~80mg/porción — maximiza síntesis de colágeno endógeno',
  minerales: 'Vitamina C + activos complementarios',
  vitc_efecto: 'La Vit C es cofactor de la enzima prolil-hidroxilasa que estabiliza la triple hélice del colágeno. Sin Vit C el colágeno sintetizado es estructuralmente débil.',
  cuando: 'En ayunas o post-entreno. Ya contiene lo necesario para máxima síntesis.',
  ideal: 'Quienes quieren el combo completo sin suplementar vitamina C aparte. Piel, articulaciones y tejidos.',
  ventaja: 'Todo en uno. La formulación más completa para síntesis de colágeno.',
},
'gn_col200p': {
  tipo: 'Colágeno hidrolizado — Pote 200g (Gold Nutrition)',
  colageno: '10g por porción',
  vitc: '⚠ Verificar etiqueta — generalmente no incluida',
  ideal: 'Articulaciones, piel, tendones. Marca Gold Nutrition reconocida.',
  ventaja: 'Formato pote. Marca establecida.',
},
'gn_col200d': {
  tipo: 'Colágeno hidrolizado — Doypack 200g (Gold Nutrition)',
  colageno: '10g por porción',
  vitc: '⚠ Verificar etiqueta',
  ideal: 'Formato portátil. Misma fórmula que el pote de Gold.',
  ventaja: 'Más conveniente para llevar.',
},
'wo_colageno': {
  tipo: 'Colágeno hidrolizado + Ácido Hialurónico 454g (Woman)',
  colageno: 'Colágeno hidrolizado por porción',
  minerales: 'Ácido Hialurónico — hidratación profunda de piel y articulaciones',
  ac_hialuronico: 'El Ácido Hialurónico retiene 1000 veces su peso en agua. Lubrica articulaciones y mejora la elasticidad e hidratación cutánea.',
  ideal: 'Principalmente mujeres enfocadas en piel, antienvejecimiento e hidratación articular.',
  ventaja: 'Colágeno + Ácido Hialurónico. Resultados estéticos superiores en piel.',
},
'nlab_collagen': {
  tipo: 'Collagen Flex con activos articulares (Nutrilab)',
  colageno: 'Colágeno hidrolizado por porción',
  otros: 'Puede incluir glucosamina, condroitina u otros activos articulares según formulación',
  ideal: 'Personas con dolor articular activo o en recuperación de lesiones.',
  ventaja: 'Fórmula orientada a salud articular.',
},

// ─────────────────────────────────────────────
// PRE-ENTRENOS
// ─────────────────────────────────────────────
'sn_tnt': {
  tipo: 'Pre-entreno estimulante completo',
  cafeina: '~250mg cafeína anhidra/porción — estimulación alta',
  citrulina: '~4g Citrulina Malato — vasodilatación moderada',
  beta_alanina: '~2.5g Beta-alanina — causa picazón en piel (NORMAL, señal de que funciona)',
  arginina: 'Arginina incluida',
  tirosina: 'L-Tirosina — precursor de dopamina, mejora foco mental',
  efectos: 'Energía intensa en 20-30 min, foco mental, mayor intensidad percibida',
  cuando: 'Tomar 20-30 min antes del entreno. NO usar después de las 3pm.',
  ideal: 'Deportistas con buena tolerancia a estimulantes que entrenan de mañana o mediodía.',
  evitar: 'Hipertensión, arritmias, embarazo, sensibilidad a cafeína, ansiedad.',
  ventaja: 'El pre-entreno más vendido de Argentina. Sabores excelentes. Efecto muy notorio.',
},
'sn_pumpv8': {
  tipo: 'Pre-entreno vasodilatador SIN estimulantes (8 activos)',
  cafeina: 'Sin cafeína — apto para entrenar a cualquier hora',
  citrulina: '~6-8g Citrulina Malato — dosis máxima para congestión real',
  agmatina: 'Agmatina sulfato — inhibe arginasa, mantiene óxido nítrico elevado más tiempo',
  glicerol: 'Glicerol — retención hídrica intracelular, músculo más lleno visualmente',
  otros: '8 ingredientes vasodilatadores en dosis completas',
  efectos: 'Mayor congestión (pump) del catálogo. Sin pico ni bajada de energía.',
  cuando: 'Cualquier hora, incluso noche.',
  ideal: 'Entrenamiento nocturno, sensibles a cafeína, días de alto volumen, quienes priorizan la congestión.',
  evitar: 'Quienes necesitan el boost energético de la cafeína.',
  ventaja: 'La mayor bomba muscular sin estimulantes. Apto para entrenar a cualquier hora.',
},
'gn_prework': {
  tipo: 'Pre-entreno estimulante equilibrado (Gold Nutrition)',
  cafeina: '~200mg cafeína — estimulación moderada',
  citrulina: 'Citrulina incluida',
  beta_alanina: 'Beta-alanina incluida',
  ideal: 'Deportistas que encuentran el TNT demasiado intenso. Buen balance estimulación/vasodilatación.',
  ventaja: 'Formulación equilibrada. Buena tolerancia general.',
},
'nmax_prework': {
  tipo: 'Pre-entreno estimulante (Nutremax)',
  cafeina: 'Cafeína moderada',
  ideal: 'Opción nacional de buen precio con efecto pre-entreno completo.',
  ventaja: 'Precio competitivo. Marca Nutremax con buena reputación.',
},
'wo_preentreno': {
  tipo: 'Pre-entreno femenino con quemador (Woman)',
  cafeina: 'Cafeína moderada',
  otros: 'Incluye ingredientes termogénicos orientados a metabolismo femenino',
  ideal: 'Mujeres que quieren pre-entreno + apoyo para quemar grasa en la misma toma.',
  ventaja: 'Formulado para metabolismo femenino. Doble función.',
},

// ─────────────────────────────────────────────
// GAINERS
// ─────────────────────────────────────────────
'sn_mutant': {
  tipo: 'Mass Gainer hipercalórico',
  calorias: '~650 kcal por porción de 250g',
  proteina: '~45g proteína por porción',
  carbs: '~110g carbohidratos (maltodextrina + azúcares)',
  grasas: '~10g por porción',
  fuente_prot: 'Blend de Whey concentrado + Caseína (liberación sostenida)',
  ideal: 'Hardgainers (metabolismo acelerado, dificultad para subir de peso). Etapa de volumen agresivo.',
  evitar: 'Personas con sobrepeso, resistencia a la insulina, diabetes o que ganan grasa fácilmente.',
  ventaja: 'Sabores MutantMass muy populares (Chocolate, Cookies). Fórmula de historial probado.',
},
'ena_ultramass': {
  tipo: 'Mass Gainer hipercalórico (ENA)',
  calorias: '~600 kcal por porción',
  proteina: '~40g proteína por porción',
  carbs: '~100g carbohidratos',
  fuente_prot: 'Blend de whey con transparencia ENA',
  ideal: 'Hardgainers en volumen. Misma aplicación que MutantMass.',
  ventaja: 'Etiquetado transparente característico ENA. Buena calidad proteica.',
},
'xtr_nitrogain': {
  tipo: 'Mass Gainer hipercalórico (Xtrenght)',
  calorias: '~580 kcal por porción aprox.',
  proteina: '~38-40g por porción',
  ideal: 'Hardgainers. Alternativa al MutantMass con la marca Xtrenght.',
  ventaja: 'Buen precio por porción. Sabor Cookies disponible.',
},
'gn_gainer': {
  tipo: 'Mass Gainer formato grande 5 Lb (Gold Nutrition)',
  calorias: 'Alta densidad calórica',
  ideal: 'Hardgainers que buscan formato grande con Gold Nutrition.',
  ventaja: '5 Lb = mayor duración y mejor precio por porción.',
},

// ─────────────────────────────────────────────
// AMINOÁCIDOS
// ─────────────────────────────────────────────
'sn_mtor': {
  tipo: 'BCAAs 2:1:1 (Leucina:Isoleucina:Valina)',
  leucina: '5g de Leucina/porción — activa directamente mTOR (switch anabólico)',
  isoleucina: '2.5g — mejora captación de glucosa muscular',
  valina: '2.5g — energía muscular y recuperación',
  total: '10g de BCAAs por porción',
  limitacion: 'Solo 3 de los 9 aminoácidos esenciales — síntesis proteica incompleta sin los otros 6',
  ideal: 'Entrenamiento en ayunas, cardio en ayunas, anti-catabolismo puntual.',
  ventaja: 'Alta dosis de leucina. Sabores excelentes. Buena elección para intra-workout.',
},
'sn_eaas': {
  tipo: 'EAAs — 9 Aminoácidos Esenciales Completos',
  composicion: 'Los 3 BCAAs + Lisina + Metionina + Fenilalanina + Treonina + Triptofano + Histidina',
  leucina: 'Leucina ~3-4g incluida',
  por_que: 'Para sintetizar músculo necesitás los 9 esenciales. Con solo BCAAs la síntesis proteica no se completa.',
  triptofano: 'Precursor de serotonina — mejora estado de ánimo durante el entreno',
  ideal: 'Cualquiera que quiera suplementar aminoácidos. Superiores a BCAAs para síntesis muscular.',
  ventaja: 'Biológicamente más completos que BCAAs. Para construir músculo cubrís todos los eslabones.',
},
'sn_glut': {
  tipo: 'L-Glutamina pura 300g',
  dosis: '5g por porción',
  mecanismo: 'Aminoácido más abundante en el tejido muscular. Reduce catabolismo post-entreno, mejora permeabilidad intestinal, apoya inmunidad en esfuerzo intenso.',
  cuando: 'Post-entreno o antes de dormir. También útil en períodos de alto estrés o recuperación de enfermedades.',
  ideal: 'Deportistas con alto volumen de entrenamiento (5-7 días/semana), personas con problemas gastrointestinales asociados al ejercicio intenso.',
  ventaja: 'Pura sin aditivos. Dosis generosa (300g = 60 porciones).',
},
'sn_arginine': {
  tipo: 'L-Arginina pura 150g',
  dosis: '3-6g por porción',
  mecanismo: 'Precursor de óxido nítrico (NO). Mejora vasodilatación y flujo sanguíneo muscular.',
  cuando: '30 min antes del entrenamiento',
  ideal: 'Apoyo a vasodilatación y pump muscular. También tiene rol en producción de hormona de crecimiento.',
  nota: 'La Citrulina Malato tiene mayor biodisponibilidad oral para producir NO que la Arginina directa.',
  ventaja: 'Sin aditivos. Versátil — también se puede combinar con otros suplementos.',
},
'sn_lcarnitina': {
  tipo: 'L-Carnitina en cápsulas',
  dosis: '500-1500mg por porción',
  mecanismo: 'Transporta ácidos grasos de cadena larga a la mitocondria para ser oxidados como combustible energético.',
  absorcion: '57-84% biodisponibilidad oral',
  cuando: '30-60 min antes del cardio o entrenamiento. Sin ejercicio el efecto es mínimo.',
  ideal: 'Personas en definición que realizan ejercicio aeróbico. El efecto es real pero requiere actividad física.',
  evitar: 'Esperarlo como "quemador mágico" — sin ejercicio aeróbico no hay resultado.',
  ventaja: 'Cómodo en cápsula. Sin sabor. Fácil de transportar.',
},
'sn_betaal': {
  tipo: 'Beta-Alanina pura 300g',
  dosis: '3.2g por porción (dosis validada clínicamente)',
  mecanismo: 'Se convierte en carnosina muscular que actúa como buffer del ácido láctico, retrasando la fatiga en esfuerzos de alta intensidad.',
  efectos: 'Picazón en piel (parestesia) — NORMAL y pasajera, señal de que absorbiste correctamente.',
  cuando: '30 min antes del entrenamiento',
  ideal: 'HIIT, crossfit, natación, artes marciales, ciclismo — cualquier deporte donde la resistencia al esfuerzo máximo sea clave.',
  ventaja: 'La más estudiada después de creatina. Resultados en 4-6 semanas de uso continuo.',
},
'ena_bcaa': {
  tipo: 'BCAA 2:1:1 en cápsulas (ENA)',
  dosis: 'Variable según porción',
  ideal: 'Quienes prefieren BCAAs en cápsula (sin sabor, sin mezclar). Misma aplicación que MTOR.',
  ventaja: 'Formato cápsula muy cómodo para llevar al gym o viajar.',
},
'ena_lcarnitina': {
  tipo: 'L-Carnitina 1500mg en cápsulas (ENA)',
  dosis: '1500mg por porción — dosis alta',
  mecanismo: 'Misma que L-Carnitina Star: transporte de ácidos grasos a mitocondria',
  cuando: '30-60 min antes del cardio',
  ideal: 'Quienes buscan mayor concentración de carnitina por toma.',
  ventaja: '1500mg es la dosis más estudiada para efecto clínico. Marca ENA reconocida.',
},
'gen_carnit': {
  tipo: 'Carnitina Líquida 500ml (Gentech)',
  dosis: '1500-2000mg por porción',
  mecanismo: 'Misma que cápsulas. Formato líquido para absorción más rápida.',
  absorcion: 'Levemente más rápida que cápsulas (sin barrera de cápsula)',
  cuando: '30-60 min antes del cardio',
  ideal: 'Quienes prefieren líquido o necesitan dosis alta con absorción rápida.',
  ventaja: 'Mayor concentración por toma. Absorción más inmediata que cápsulas.',
},

// ─────────────────────────────────────────────
// QUEMADORES
// ─────────────────────────────────────────────
'sn_thermo': {
  tipo: 'Termogénico estimulante completo (Star Nutrition)',
  cafeina: '~200mg cafeína anhidra/porción',
  otros: 'Yerba mate, CLA, L-Tirosina, extracto de té verde (EGCG)',
  mecanismo: 'Termogénesis aumentada + movilización de grasa + supresión del apetito + foco mental',
  cuando: 'Mañana o mediodía. NUNCA después de las 2-3pm (interfiere sueño).',
  ideal: 'Hombres y mujeres con buena tolerancia a estimulantes en fase de definición.',
  evitar: 'Hipertensión, problemas cardíacos, embarazo, lactancia, menores de 18, sensibilidad a cafeína.',
  ventaja: 'El termogénico más potente de Star Nutrition. Efecto notorio desde el primer uso.',
},
'wo_fatburner': {
  tipo: 'Termogénico femenino suave (Woman)',
  cafeina: '~120-150mg cafeína — estimulación moderada',
  otros: 'CLA, L-Carnitina, extracto de té verde, activos pro-femeninos',
  mecanismo: 'Termogénesis + movilización de grasa con perfil para metabolismo femenino',
  ideal: 'Mujeres que buscan efecto termogénico más suave o que han tenido reacciones adversas a termogénicos fuertes.',
  ventaja: 'Estimulación moderada. Menor riesgo efectos secundarios. Formulado para mujer.',
},
'gen_tx3': {
  tipo: 'Quemador estimulante (Gentech TX3)',
  cafeina: 'Cafeína moderada-alta',
  ideal: 'Deportistas que quieren una alternativa a Thermo Fuel con la marca Gentech.',
  ventaja: 'Marca Gentech con buena trayectoria. Fórmula potente.',
},
'gn_lipo': {
  tipo: 'Quemador Lipo Gold Elite (Gold Nutrition)',
  cafeina: 'Moderada',
  ideal: 'Fase de definición. Opción Gold Nutrition para quemadores.',
  ventaja: 'Marca reconocida. Formulación orientada a definición muscular.',
},
'nlab_thermo120': {
  tipo: 'Termogénico capsulas (Nutrilab 120 caps)',
  ideal: 'Buena cantidad de dosis por envase. Marca Nutrilab.',
  ventaja: '120 capsulas = mayor duración.',
},
'nlab_thermo240': {
  tipo: 'Termogénico comprimidos (Nutrilab 240 comp)',
  ideal: 'El mayor supply de termogénico del catálogo.',
  ventaja: '240 comprimidos = el más económico por dosis de quemadores.',
},

// ─────────────────────────────────────────────
// VITAMINAS Y MINERALES
// ─────────────────────────────────────────────
'sn_vitc': {
  tipo: 'Vitamina C (Ácido Ascórbico puro)',
  dosis: '500mg-1g por porción',
  mecanismo: 'Antioxidante potente. Cofactor enzimático para síntesis de colágeno. Apoya inmunidad y absorción de hierro no hémico.',
  cuando: 'Con las comidas, especialmente junto con colágeno.',
  ideal: 'Uso general para inmunidad. ESENCIAL combinada con colágeno hidrolizado para maximizar síntesis.',
  ventaja: 'Pura sin aditivos. Versátil. Ideal para combinar con cualquier colágeno que no la incluya.',
},
'sn_omega3': {
  tipo: 'Omega 3 de aceite de pescado de agua profunda — 60 caps',
  epa_dha: '~180mg EPA + 120mg DHA por cápsula (300mg totales)',
  dosis_efectiva: '2-3 cápsulas/día para efecto antiinflamatorio real. 1 cápsula/día para mantenimiento.',
  mecanismo: 'EPA y DHA reducen inflamación sistémica, protegen cardiovascular, mejoran función cerebral y disminuyen DOMS (dolor muscular post-entreno).',
  ideal: 'TODO el mundo. Es el suplemento de salud general más respaldado científicamente.',
  cuando: 'Con comidas que contengan grasa para mejor absorción.',
  ventaja: 'Precio accesible. 1 mes a 2 caps/día. Marca Star Nutrition confiable.',
},
'ge_omega3': {
  tipo: 'Omega 3 de aceite de pescado — 200 cápsulas (Good Energy)',
  epa_dha: '~180mg EPA + 120mg DHA por cápsula (verificar etiqueta)',
  dosis_efectiva: 'Misma que cualquier Omega 3. Verificar mg de EPA+DHA, no solo "1000mg aceite".',
  ideal: 'Quienes quieren 3-6 meses de supply en una sola compra.',
  ventaja: '200 caps = hasta 3-6 meses a dosis de mantenimiento. Mejor precio por cápsula del catálogo.',
},
'sn_zma': {
  tipo: 'ZMA — Zinc 30mg + Magnesio 450mg + Vitamina B6 10.5mg',
  zinc: '30mg Zinc — síntesis de testosterona, inmunidad, cicatrización',
  magnesio: '450mg Magnesio — función muscular, sueño profundo, más de 300 reacciones enzimáticas',
  b6: '10.5mg B6 — potencia absorción de Zn y Mg. Cofactor en síntesis de serotonina y dopamina.',
  cuando: 'Antes de dormir con el estómago vacío. El pico de testosterona y GH es nocturno.',
  ideal: 'Hombres deportistas que quieren optimizar testosterona natural, recuperación nocturna y calidad del sueño.',
  ventaja: 'Triple efecto: testosterona + sueño + función muscular en una sola cápsula nocturna.',
},
'sn_citr60': {
  tipo: 'Citrato de Magnesio — 60 cápsulas',
  magnesio: '~200-300mg Magnesio elemental por porción',
  forma: 'Citrato = la forma más biodisponible de Magnesio (absorción 30% mayor que óxido)',
  mecanismo: 'Antagonista natural del calcio intracelular. Permite relajación muscular completa. Bloquea receptores NMDA del glutamato (reduce excitación neuronal = mejor sueño).',
  cuando: 'Antes de dormir. También útil en casos de calambres o estrés.',
  ideal: 'Calambres frecuentes, sueño irregular, alta carga de entrenamiento. Para hombres Y mujeres.',
  ventaja: 'Solo magnesio puro. Sin zinc ni otros minerales. Forma citrato de mejor absorción.',
},
'sn_citr500': {
  tipo: 'Citrato de Magnesio en polvo — 500g',
  magnesio: '~300-400mg Magnesio elemental por porción',
  forma: 'Polvo = absorción muy rápida. Citrato de alta biodisponibilidad.',
  cuando: 'Disolver en agua, tomar antes de dormir.',
  ideal: 'Uso diario regular a largo plazo. Mucho más económico que las cápsulas por gramo.',
  ventaja: 'El mejor precio por mg de magnesio del catálogo. Para 4-6 meses de uso continuo.',
},
'sn_cla': {
  tipo: 'CLA 1000mg — 90 cápsulas (Ácido Linoleico Conjugado)',
  dosis: '1000mg CLA por cápsula. Dosis efectiva: 3-6g/día (3-6 cápsulas).',
  mecanismo: 'Ácido graso omega-6 que puede reducir acumulación de grasa corporal y aumentar masa magra. Efectos modestos pero consistentes.',
  cuando: 'Con las comidas principales.',
  ideal: 'Complemento en fase de definición. Más eficaz combinado con ejercicio y dieta.',
  ventaja: 'Complementa los efectos de dieta y ejercicio para composición corporal. Sin estimulantes.',
},
'sn_resv': {
  tipo: 'Resveratrol 500mg — 60 cápsulas',
  mecanismo: 'Polifenol antioxidante de alto potencial. Activa sirtuinas (proteínas relacionadas con longevidad). Efecto antiinflamatorio y cardiovascular.',
  ideal: 'Salud general, antienvejecimiento, protección cardiovascular.',
  ventaja: '500mg = dosis alta comparada con otras marcas. Star Nutrition estándar.',
},
'sn_cafeina30': {
  tipo: 'Cafeína 200mg — 30 cápsulas',
  dosis: '200mg cafeína anhidra por cápsula',
  mecanismo: 'Estimulante del SNC. Bloquea receptores de adenosina (elimina sensación de cansancio). Mejora rendimiento físico y mental en 3-10%.',
  cuando: '30-45 min antes del entrenamiento. Máximo 2 cápsulas/día.',
  ideal: 'Pre-entreno económico y limpio. También útil para estudio o trabajo que requiera foco.',
  evitar: 'Después de las 2-3pm, hipertensión, arritmias, embarazo.',
  ventaja: 'El estimulante más investigado del mundo. Puro y económico.',
},
'lap_ashwa': {
  tipo: 'Ashwagandha con Vitamina C — 60 cápsulas (LAPPIEL)',
  mecanismo: 'Ashwagandha es un adaptógeno que reduce cortisol (hormona del estrés). Mejora tolerancia al estrés, calidad del sueño y puede apoyar niveles de testosterona.',
  vitc: 'Vitamina C incluida — doble función inmunitaria y antioxidante',
  cuando: 'Antes de dormir para maximizar reducción de cortisol nocturno.',
  ideal: 'Personas con alto estrés (laboral, entrenamiento intenso). Apoya recuperación y sueño.',
  ventaja: 'Adaptógeno + Vitamina C. Formulación LAPPIEL de calidad farmacéutica.',
},
'lap_mag': {
  tipo: 'Bisglicinato de Magnesio — 60 comprimidos (LAPPIEL)',
  magnesio: 'Bisglicinato = la forma con mayor biodisponibilidad y mejor tolerancia gastrointestinal de todas las formas de Mg',
  cuando: 'Antes de dormir.',
  ideal: 'Quienes tienen intolerancia digestiva al citrato o al óxido de Mg. La forma más gentil y eficiente.',
  ventaja: 'Mayor biodisponibilidad que citrato. Sin efectos laxantes. Formulación premium LAPPIEL.',
},
'sn_multi': {
  tipo: 'Multivitamínico completo — 60 cápsulas',
  composicion: 'Vitaminas A, B1, B2, B3, B5, B6, B12, C, D, E, K + Minerales esenciales',
  ideal: 'Cobertura de micronutrientes en deportistas con alta demanda o alimentación restringida.',
  ventaja: 'Todo en uno. Base nutricional para deportistas.',
},
'gn_testo': {
  tipo: 'Testo Gold — Estimulante natural de testosterona (Gold Nutrition)',
  composicion: 'Tribulus terrestris, Zinc, Magnesio, B6 y otros activos anabólicos naturales',
  mecanismo: 'Estimula producción natural de testosterona. Apoya recuperación, masa muscular y libido.',
  ideal: 'Hombres adultos que quieren optimizar testosterona endógena de forma natural.',
  ventaja: 'Fórmula combinada con múltiples activos. Marca Gold Nutrition.',
},
'lap_nad': {
  tipo: 'NAD 500 + Resveratrol — 60 cápsulas (LAPPIEL)',
  mecanismo: 'NAD+ es cofactor esencial en metabolismo energético celular. Declina con la edad. La suplementación busca restaurar niveles para mejor energía, función cognitiva y potencial antienvejecimiento.',
  ideal: 'Personas mayores de 35 años interesadas en longevidad, energía celular y protección cognitiva.',
  ventaja: 'Fórmula premium NAD+ + Resveratrol. LAPPIEL = calidad farmacéutica.',
},

// ─────────────────────────────────────────────
// HIDRATACIÓN
// ─────────────────────────────────────────────
'sn_hydroplus': {
  tipo: 'Bebida isotónica de alta performance — 700g',
  composicion: 'Carbohidratos + Electrolitos (Sodio, Potasio, Magnesio, Calcio)',
  mecanismo: 'Repone glucógeno y electrolitos perdidos en el sudor durante actividad prolongada.',
  cuando: 'Durante o después de entrenamientos de +60 minutos o en condiciones de calor.',
  ideal: 'Deportes de resistencia (running, ciclismo, fútbol, natación) o entrenamientos de alta duración.',
  ventaja: '700g = excelente duración. Fórmula completa electrolitos + carbohidratos.',
},
'nmax_hmax600': {
  tipo: 'Bebida isotónica deportiva (Nutremax Hydromax 600g)',
  composicion: 'Carbohidratos + Electrolitos',
  ideal: 'Misma aplicación que Hydroplus. Alternativa Nutremax a buen precio.',
  ventaja: 'Buen precio. Formato adecuado para consumo moderado.',
},
'nmax_hmax1320': {
  tipo: 'Bebida isotónica deportiva (Nutremax Hydromax 1320g)',
  composicion: 'Carbohidratos + Electrolitos — formato grande',
  ideal: 'Deportistas de alta frecuencia que consumen isotónico regularmente.',
  ventaja: '1320g = mayor duración y mejor precio por porción.',
},
'sn_justcarb': {
  tipo: 'Carbohidratos puros (Maltodextrina + Dextrosa) — Just Carb 2 Lb',
  dosis: '50g carbohidratos por porción',
  mecanismo: 'Fuente de energía de rápida absorción para reponer glucógeno muscular y hepático.',
  cuando: 'Intra-workout (durante el entreno) o post-entreno inmediato junto con proteína.',
  ideal: 'Deportistas de alto volumen que necesitan energía rápida. Excelente mezclado con Whey post-entreno.',
  ventaja: 'Sin proteína ni grasa. Fuente limpia de carbohidratos para timing nutricional preciso.',
},

// ─────────────────────────────────────────────
// BARRAS Y SNACKS
// ─────────────────────────────────────────────
'mer_lowcarb': {
  tipo: 'Barra proteica Low Carbs (Mervick 46g)',
  proteina: '~15-18g por barra',
  carbs: 'Bajos en carbohidratos (~10-12g)',
  ideal: 'Snack proteico en definición o para quienes controlan carbohidratos.',
  ventaja: 'Alta proteína, bajos carbs. Conveniente para llevar.',
},
'mer_wheybar65': {
  tipo: 'Barra proteica Whey Bar 65g (Mervick)',
  proteina: '~20-22g por barra',
  carbs: 'Moderados (~25g)',
  ideal: 'Snack proteico completo para deportistas. Buen balance proteína/carbohidratos.',
  ventaja: 'Tamaño generoso. Alta proteína por barra.',
},
'grg_pancake': {
  tipo: 'Pancakes proteicos en polvo (Granger)',
  proteina: '~10-12g por porción preparada',
  ideal: 'Desayuno o merienda alta en proteína de fácil preparación.',
  ventaja: 'Versátil. Preparación rápida. Alternativa sabrosa al batido de proteína.',
},
'mani_king': {
  tipo: 'Pasta de Maní natural 350g',
  proteina: '~7g por porción de 30g',
  grasas: '~15g (mayormente grasas insaturadas saludables)',
  carbs: '~5g por porción',
  ideal: 'Fuente de proteína + grasas saludables + energía sostenida. Snack natural.',
  ventaja: '100% natural sin agregados. Excelente relación nutricional. Versátil en cocina.',
},

// ─── NUEVOS PRODUCTOS SIN INFO ───────────────────────────────
'sn_wh3y': {
  tipo:'Whey Protein Concentrada + Hidrolizada', proteina:'22g por porción', carbs:'5g', grasas:'2g', calorias:'126 kcal', lactosa:'Muy baja (hidrolizada)', aminoacidos:'BCAA 5.5g, EAA completo', filtrado:'Ultrafiltración + hidrólisis parcial', absorcion:'Rápida (~45 min)', pureza:'Alta', ideal:'Ganancia muscular, post-entreno rápido', ventaja:'Sabor chocolate premium, absorción mejorada'
},
'sn_justwhey': {
  tipo:'Whey Protein Concentrada', proteina:'23g por porción', carbs:'5g', grasas:'2.5g', calorias:'133 kcal', lactosa:'Moderada', aminoacidos:'BCAA 5.5g, perfil completo', filtrado:'Ultrafiltración', absorcion:'Rápida (~45 min)', pureza:'Alta', ideal:'Ganancia muscular, recuperación', ventaja:'Excelente relación precio/calidad Star Nutrition'
},
'wo_creat': {
  tipo:'Creatina Monohidrato pura', proteina:'0g', carbs:'0g', grasas:'0g', calorias:'0 kcal', pureza:'Monohidrato 99.9%', dosis:'3–5g diarios', mecanismo:'Recarga de ATP en músculo', efectos:'Fuerza, volumen muscular, recuperación', cuando:'Pre o post entreno con agua', ideal:'Fuerza y potencia muscular', ventaja:'Sin sabor, compatible con cualquier stack'
},
'wo_resv': {
  tipo:'Antioxidante / Longevidad', composicion:'Trans-resveratrol 500mg', mecanismo:'Activa sirtuínas, antiinflamatorio potente', efectos:'Antioxidante, salud cardiovascular, anti-aging', cuando:'Con comida, preferentemente mañana', aditivos:'Mínimos', ideal:'Salud cardiovascular, recuperación celular', ventaja:'Fórmula by Pampita, alta concentración'
},
'ena_100whey': {
  tipo:'Whey Protein Concentrada 80%', proteina:'22g por porción', carbs:'4g', grasas:'2g', calorias:'120 kcal', lactosa:'Moderada', aminoacidos:'BCAA 5g, perfil completo', filtrado:'Ultrafiltración', absorcion:'Rápida (~45 min)', pureza:'Alta - 80% proteína', ideal:'Ganancia muscular, post-entreno', ventaja:'Marca ENA argentina, amplia disponibilidad de sabores'
},
'ena_glut': {
  tipo:'L-Glutamina pura en polvo', proteina:'5g por porción (glutamina)', carbs:'0g', grasas:'0g', calorias:'20 kcal', pureza:'100% L-Glutamina micronizada', dosis:'5g post-entreno o antes de dormir', mecanismo:'Reparación muscular, salud intestinal, sistema inmune', cuando:'Post-entreno y antes de dormir', ideal:'Recuperación muscular, permeabilidad intestinal', ventaja:'Pote ergonómico, pureza farmacéutica'
},
'ena_multi': {
  tipo:'Multivitamínico con Cafeína', composicion:'Vitaminas A, C, D, E, complejo B + cafeína 100mg', minerales:'Zinc, magnesio, hierro, selenio', cafeina:'100mg por comprimido', cuando:'Con desayuno, no por la tarde', ideal:'Rendimiento deportivo, energía diaria', ventaja:'Fórmula especial con cafeína para deportistas'
},
'ena_cafeina': {
  tipo:'Estimulante / Termogénico', composicion:'Cafeína anhidra 200mg por cápsulas', mecanismo:'Bloquea adenosina, aumenta adrenalina y dopamina', efectos:'Energía, concentración, termogénesis leve', dosis:'1 cápsula 30-45 min antes del entreno', cafeina:'200mg por unidad', evitar:'Hipertensión, embarazo, sensibles a estimulantes', ideal:'Pre-entreno, reducción de grasa, foco mental', ventaja:'Dosis exacta y segura, sin azúcar ni colorantes'
},
'ena_truecol': {
  tipo:'Whey Protein + Colágeno Hidrolizado', proteina:'20g por porción', colageno:'10g de colágeno hidrolizado', carbs:'5g', grasas:'2g', calorias:'116 kcal', cuando:'Post-entreno o entre comidas', ideal:'Mujeres activas, salud articular + masa muscular', ventaja:'Fórmula 2 en 1: proteína muscular + colágeno'
},
'gen_creat': {
  tipo:'Creatina Monohidrato pura', proteina:'0g', pureza:'Monohidrato micronizado 99.9%', dosis:'3–5g diarios con líquido', mecanismo:'Recarga de ATP en músculo', efectos:'Fuerza, potencia, volumen', cuando:'Pre o post entreno', ideal:'Deportistas de fuerza y resistencia', ventaja:'Gentech: marca argentina de alta calidad'
},
'xtr_advanced': {
  tipo:'Whey Protein Concentrada', proteina:'22g por porción', carbs:'5g', grasas:'2.5g', calorias:'128 kcal', lactosa:'Moderada', aminoacidos:'BCAA 5g, perfil completo', filtrado:'Ultrafiltración', absorcion:'Rápida', ideal:'Ganancia muscular, post-entreno', ventaja:'Formato 1kg económico, Xtrenght Argentina'
},
'xtr_whey3kg': {
  tipo:'Whey Protein Concentrada - Granel', proteina:'22g por porción', carbs:'5g', grasas:'2.5g', calorias:'128 kcal', lactosa:'Moderada', aminoacidos:'BCAA 5g', filtrado:'Ultrafiltración', absorcion:'Rápida', ideal:'Atletas con alto consumo proteico', ventaja:'Mayor volumen = mejor precio por kilo, Xtrenght'
},
'xtr_bcaapro': {
  tipo:'BCAA en cápsulas 2:1:1', composicion:'Leucina 500mg, Isoleucina 250mg, Valina 250mg por cápsula', leucina:'500mg', total:'1000mg BCAAs por cápsulas', dosis:'4-6 cápsulas por día', cuando:'Peri-entreno o entre comidas', ideal:'Preservación muscular, recuperación', ventaja:'Práctico sin sabor, fácil dosificación'
},
'xtr_bcaahydro': {
  tipo:'BCAA hidratación 2:1:1 + electrolitos', composicion:'BCAAs 7g + Na, K, Mg por porción', leucina:'3.5g', total:'7g BCAAs por porción', aminoacidos:'Leucina + Isoleucina + Valina', cuando:'Durante y post-entreno', ideal:'Deportes de resistencia, hidratación muscular', ventaja:'Combina BCAAs con electrolitos, sabor Blue Razz'
},
'xtr_no': {
  tipo:'Óxido Nítrico / Booster de Bomba', composicion:'L-Arginina 3g, L-Citrulina 2g, extractos vasodilatadores', citrulina:'2g', dosis:'3-4 cápsulas 30-45 min antes del entreno', mecanismo:'Vasodilatación, mayor flujo sanguíneo al músculo', efectos:'Pump muscular, resistencia, recuperación', ideal:'Entrenamiento de fuerza, mayor congestión', ventaja:'Fórmula completa en cápsulas, 180 unidades'
},
'gn_bcaa': {
  tipo:'BCAA en comprimidos 2:1:1', composicion:'Leucina 400mg, Isoleucina 200mg, Valina 200mg por 2 comprimidos', leucina:'400mg por 2 comp.', total:'800mg BCAAs por toma', dosis:'4-6 comprimidos/día', cuando:'Peri-entreno', ideal:'Mantenimiento muscular en déficit calórico', ventaja:'Gold Nutrition, comprimidos convenientes'
},
'gn_zma': {
  tipo:'Recuperación hormonal / Sueño', composicion:'Zinc 30mg, Magnesio 450mg, Vitamina B6 10.5mg', zinc:'30mg', magnesio:'450mg', b6:'10.5mg', dosis:'3 cápsulas antes de dormir con el estómago vacío', mecanismo:'Optimiza testosterona, mejora sueño profundo', cuando:'30-60 min antes de dormir', ideal:'Recuperación nocturna, deportistas con déficit mineral', ventaja:'Gold Nutrition, dosis clínica de 60 servicios'
},
'gn_vitamin': {
  tipo:'Multivitamínico deportivo', composicion:'Vitaminas A, B, C, D, E + minerales', minerales:'Zinc, magnesio, hierro, cobre, manganeso', dosis:'1 cápsula diaria con comida', cuando:'Con desayuno', ideal:'Cobertura nutricional deportiva diaria', ventaja:'Gold Nutrition, 30 servicios de alta biodisponibilidad'
},
'gn_lipo_hc': {
  tipo:'Termogénico Hardcore', composicion:'Cafeína 200mg, Sinefrina 15mg, Extracto de té verde 300mg, L-Carnitina 200mg', cafeina:'200mg', dosis:'1-2 cápsulas en ayunas o pre-entreno', mecanismo:'Termogénesis, liberación de ácidos grasos, supresión apetito', efectos:'Quema de grasa intensa, energía, foco', evitar:'Hipertensión, cardiopatías, sensibles a estimulantes', ideal:'Definición muscular acelerada', ventaja:'Fórmula hardcore para usuarios avanzados'
},
'gn_omega3': {
  tipo:'Ácidos grasos esenciales Omega-3', composicion:'Fish Oil 1000mg por cápsula, EPA+DHA', epa_dha:'300mg totales EPA+DHA por cápsula', dosis:'2-3 cápsulas con comidas', cuando:'Con comidas para evitar reflujo', ideal:'Salud cardiovascular, antiinflamatorio, articulaciones', ventaja:'Gold Nutrition, 30 servicios, purificado de mercurio'
},
'gn_hmb': {
  tipo:'Anticatabólico / Recuperación', composicion:'HMB (Beta-Hidroxi Beta-Metilbutirato) 1000mg por cápsula', dosis:'2-3 cápsulas/día en fases de definición', mecanismo:'Reduce degradación proteica muscular', efectos:'Preserva músculo en déficit calórico, acelera recuperación', cuando:'Con comidas', ideal:'Deportistas en definición o con alta intensidad', ventaja:'Gold Nutrition, 60 cápsulas, compuesto de leucina'
},
'gn_no': {
  tipo:'Óxido Nítrico en polvo', composicion:'L-Arginina 3g, L-Citrulina 2g, extractos termogénicos', citrulina:'2g', dosis:'1 porción en 150ml de agua pre-entreno', mecanismo:'Vasodilatación, mejor flujo sanguíneo', efectos:'Pump, resistencia, recuperación', ideal:'Entrenamiento de fuerza, mayor congestión muscular', ventaja:'Formato polvo para mayor biodisnibilidad, 195g'
},
'lap_omega3': {
  tipo:'Omega 3-6-9 completo', composicion:'Omega 3 (EPA+DHA) + Omega 6 (GLA) + Omega 9 (ácido oleico)', epa_dha:'360mg EPA+DHA por cápsula', dosis:'2 cápsulas con comida', cuando:'Con comidas', ideal:'Salud cardiovascular completa, equilibrio inflamatorio', ventaja:'LAPPIEL: cobertura triple de ácidos grasos esenciales'
},
'mer_proper': {
  tipo:'Whey Protein Performance 80%', proteina:'22g por porción', carbs:'4g', grasas:'2g', calorias:'120 kcal', lactosa:'Moderada', filtrado:'Ultrafiltración', absorcion:'Rápida', ideal:'Ganancia muscular, post-entreno', ventaja:'Mervick, marca argentina de calidad y precio competitivo'
},
'mer_gainer': {
  tipo:'Mass Gainer hipercalórico', proteina:'30g por porción de 150g', carbs:'75g', grasas:'5g', calorias:'460 kcal', aminoacidos:'BCAA 6g incluidos', dosis:'1 porción en 400ml de leche post-entreno', cuando:'Post-entreno o entre comidas para ganar masa', ideal:'Personas con dificultad para subir de peso (hardgainers)', ventaja:'Mervick: fórmula argentina, sabor vainilla premium'
},
'mer_col': {
  tipo:'Colágeno hidrolizado deportivo', colageno:'10g por porción', composicion:'Colágeno tipo I y II + Vitamina C', dosis:'1 porción en agua post-entreno', cuando:'Post-entreno o con desayuno', ideal:'Recuperación articular, tendones, piel', ventaja:'Mervick Sport, formato 330g con buena disolución'
},
'mer_creat': {
  tipo:'Creatina Monohidrato pura', proteina:'0g', pureza:'Monohidrato 99.9%', dosis:'5g diarios', mecanismo:'Recarga ATP, hidratación muscular', efectos:'Fuerza, potencia, volumen', cuando:'Pre o post entreno', ideal:'Fuerza y masa muscular', ventaja:'Mervick, buena relación calidad-precio'
},
'idn_100whey': {
  tipo:'Whey Protein Concentrada 80%', proteina:'24g por porción', carbs:'4g', grasas:'2g', calorias:'128 kcal', lactosa:'Moderada', filtrado:'Ultrafiltración', absorcion:'Rápida', ideal:'Ganancia muscular, recuperación', ventaja:'IDN: marca argentina con amplia distribución'
},
'idn_creat': {
  tipo:'Creatina Monohidrato', proteina:'0g', pureza:'Monohidrato 99.9%', dosis:'5g diarios', mecanismo:'Recarga ATP, fuerza explosiva', efectos:'Fuerza, volumen, recuperación', ideal:'Deportes de fuerza e hipertrofia', ventaja:'IDN, formato 300g accesible'
},
'idn_massfusion': {
  tipo:'Mass Gainer hipercalórico', proteina:'28g por porción', carbs:'65g', grasas:'4g', calorias:'408 kcal', aminoacidos:'BCAA incluidos', cuando:'Post-entreno o entre comidas', ideal:'Hardgainers, aumento de masa total', ventaja:'IDN Mass Fusion, 1.5kg de calidad nacional'
},
'idn_leucina': {
  tipo:'L-Leucina pura', composicion:'L-Leucina 5g por porción', leucina:'5g por toma', mecanismo:'Activa directamente mTOR, síntesis proteica', efectos:'Estimulo anabólico directo, anti-catabólico', dosis:'5g pre/post entreno', ideal:'Maximizar síntesis proteica junto a proteína', ventaja:'IDN, aminoácido esencial más importante del músculo'
},
'idn_carnitina': {
  tipo:'L-Carnitina líquida', composicion:'L-Carnitina base 1500mg por porción', dosis:'1 porción en 200ml de agua', cuando:'30-45 min antes del cardio o en ayunas', mecanismo:'Transporta ácidos grasos a la mitocondria para oxidación', efectos:'Oxidación de grasa, energía en cardio', ideal:'Cardio en ayunas, definición muscular', ventaja:'IDN: sabor naranja, fácil de tomar'
},
'idn_bcaa': {
  tipo:'BCAA en polvo 2:1:1 Ultimate', composicion:'Leucina 3.5g, Isoleucina 1.75g, Valina 1.75g por 7g de porción', leucina:'3.5g', total:'7g BCAAs por porción', aminoacidos:'Leucina, Isoleucina, Valina + Glutamina', cuando:'Durante y post-entreno', ideal:'Preservación muscular, recuperación intensa', ventaja:'IDN: dosis generosa de 7g, 435g por pote'
},
'nmax_recov540': {
  tipo:'Recuperador post-entreno', proteina:'10g por porción', carbs:'35g (dextrosa + maltodextrina)', calorias:'180 kcal', composicion:'Proteínas + carbohidratos + electrolitos', cuando:'Inmediatamente post-entreno', ideal:'Recuperación rápida de glucógeno muscular', ventaja:'Nutremax: fórmula completa para recuperación, sabor naranja'
},
'nmax_recov1500': {
  tipo:'Recuperador post-entreno - Gran formato', proteina:'10g por porción', carbs:'35g', calorias:'180 kcal', cuando:'Inmediatamente post-entreno', ideal:'Atletas con alto volumen de entrenamiento', ventaja:'Nutremax: formato 1500g, mejor precio por porción'
},
'nmax_cafeina200': {
  tipo:'Cafeína anhidra', composicion:'Cafeína 200mg por cápsula', cafeina:'200mg', dosis:'1 cápsula 30-45 min antes del entreno', mecanismo:'Bloquea adenosina, aumenta adrenalina', efectos:'Energía, foco, termogénesis leve', evitar:'Hipertensión, cardiopatías', ideal:'Pre-entreno, foco cognitivo', ventaja:'Nutremax: 60 servicios, sin excipientes innecesarios'
},
'nmax_glut': {
  tipo:'L-Glutamina en polvo', proteina:'5g por porción', pureza:'100% L-Glutamina', dosis:'5g post-entreno o antes de dormir', mecanismo:'Repara tejido muscular, fortalece sistema inmune', cuando:'Post-entreno y antes de dormir', ideal:'Recuperación muscular intensa, salud intestinal', ventaja:'Nutremax: 200g con buena disolución'
},
'grg_citr': {
  tipo:'Citrato de Magnesio', composicion:'Citrato de Magnesio 144g en polvo (~500mg por porción)', magnesio:'~100mg elemental por porción', dosis:'1 cucharada en agua antes de dormir', mecanismo:'Relajación muscular, función nerviosa, sueño', cuando:'Noche, antes de dormir', ideal:'Calambres, sueño, salud muscular y ósea', ventaja:'Granger: formato polvo con alta absorción'
},
'hs_zmab': {
  tipo:'ZMA con Vitamina B complejo', composicion:'Zinc 30mg + Magnesio 450mg + Vitaminas B1,B2,B3,B6,B12', zinc:'30mg', magnesio:'450mg', b6:'B6 incluida en complejo B', dosis:'3-4 cápsulas antes de dormir', mecanismo:'Optimiza hormonas anabólicas, sueño profundo', cuando:'30-60 min antes de dormir', ideal:'Recuperación nocturna, testosterona natural', ventaja:'Hoch Sport: ZMA-B con complejo de vitaminas B'
},
'hs_citr400': {
  tipo:'Citrato de Magnesio en cápsulas', composicion:'Citrato de Magnesio 400mg por cápsula', magnesio:'60mg elemental por cápsula', dosis:'2-3 cápsulas antes de dormir', mecanismo:'Relajación muscular y nerviosa, calidad de sueño', cuando:'Antes de dormir', ideal:'Calambres, ansiedad, sueño reparador', ventaja:'Hoch Sport: cápsulas convenientes de 400mg'
},
'hs_bioprot': {
  tipo:'Whey Protein Concentrada Premium', proteina:'24g por porción', carbs:'3g', grasas:'2g', calorias:'124 kcal', lactosa:'Baja', filtrado:'Ultrafiltración avanzada', absorcion:'Rápida', pureza:'Alta', ideal:'Ganancia muscular de calidad', ventaja:'Hoch Sport Bio Prot Premium: calidad farmacéutica'
},
'hs_extreme': {
  tipo:'Mass Gainer Extreme', proteina:'30g por porción de 150g', carbs:'80g', grasas:'4g', calorias:'468 kcal', cuando:'Post-entreno o entre comidas', ideal:'Aumento de masa muscular y peso total', ventaja:'Hoch Sport Extreme Mass: alto contenido calórico'
},
'nlab_bestwhey': {
  tipo:'Whey Protein Concentrada', proteina:'22g por porción', carbs:'5g', grasas:'2g', calorias:'124 kcal', lactosa:'Moderada', filtrado:'Ultrafiltración', absorcion:'Rápida', ideal:'Ganancia muscular, post-entreno', ventaja:'Nutrilab Best Whey: marca nacional de calidad'
},
'pp_pea': {
  tipo:'Proteína Vegetal Aislada de Arveja', proteina:'27g por porción', carbs:'2g', grasas:'1g', calorias:'124 kcal', lactosa:'0% - Sin lactosa', aminoacidos:'BCAA 5.5g, alto en lisina', filtrado:'Aislado por ultrafiltración', absorcion:'Media-rápida (~60 min)', ideal:'Veganos, intolerantes a lácteos, ganancia muscular', ventaja:'Protein Project: proteína vegetal de alta calidad'
},
'pp_creat': {
  tipo:'Creatina Monohidrato pura', pureza:'Monohidrato 99.9%', dosis:'5g diarios', mecanismo:'Recarga ATP, fuerza y volumen', efectos:'Fuerza explosiva, recuperación', cuando:'Pre o post entreno', ideal:'Fuerza e hipertrofia muscular', ventaja:'Protein Project: formato 200g compacto y económico'
},
};

// ══════════════════════════════════════════════════════════
// ANÁLISIS COMPARATIVO POR CATEGORÍA (texto fijo)
// ══════════════════════════════════════════════════════════

var ANALISIS_CAT = {
  proteina: 'Las proteínas en polvo se clasifican principalmente por su proceso de filtrado y fuente. El concentrado (WPC) es económico pero contiene más lactosa. El aislado (WPI) es más puro y bajo en lactosa. Los blends combinan ambos para un balance calidad-precio. La proteína vegetal es ideal para quien evita lácteos. Lo más importante no es la marca sino la dosis real de proteína por porción y el perfil de aminoácidos esenciales.',
  creatina: 'La Creatina Monohidrato es el suplemento deportivo más estudiado de la historia — más de 1.000 estudios clínicos la respaldan. No hay diferencias significativas entre marcas si la pureza es alta. El formato (pote/doypack/1kg) y el precio por gramo son los factores decisivos para elegir. La dosis efectiva es 3-5g diarios sin necesidad de "fase de carga".',
  colageno: 'El colágeno hidrolizado se absorbe mejor que el gelatin estándar. Los tipos I y III son los más relevantes para piel, tendones y articulaciones. La vitamina C es cofactor INDISPENSABLE para la síntesis de colágeno endógeno — siempre debe acompañar la toma si no está incluida. El Magnesio en algunos colágenos deportivos agrega beneficio muscular adicional.',
  preworkout: 'Los pre-entrenos se dividen en dos familias: con estimulantes (cafeína, etc.) y sin estimulantes (vasodilatadores puros). Los estimulantes generan energía y foco pero no son aptos para uso nocturno ni para personas con sensibilidad cardiovascular. Los vasodilatadores (pump) ofrecen mayor congestión muscular a cualquier hora del día. La Citrulina Malato y la Beta-Alanina son los ingredientes con mayor evidencia científica.',
  aminoacido: 'Los BCAAs son 3 de los 9 aminoácidos esenciales. Los EAAs incluyen los 9 esenciales y son biológicamente superiores para la síntesis proteica muscular completa. La L-Carnitina requiere ejercicio aeróbico para tener efecto. La Beta-Alanina y la Glutamina tienen aplicaciones muy específicas. Siempre considerar si la proteína diaria ya cubre las necesidades antes de agregar aminoácidos.',
  gainer: 'Los gainers hipercalóricos están diseñados EXCLUSIVAMENTE para personas que tienen dificultades genuinas para subir de peso (hardgainers). Son de alta densidad calórica (600-800 kcal/porción) con predominio de carbohidratos. Para personas con metabolismo normal o tendencia a ganar grasa, suelen generar más grasa que músculo.',
  quemador: 'Los termogénicos estimulantes aumentan el gasto calórico basal mediante termogénesis y movilizan ácidos grasos. Su efecto es real pero modesto (200-400 kcal/día extra). Son COMPLEMENTO de una dieta hipocalórica y ejercicio regular, no sustitutos. Los que contienen cafeína no deben usarse después de las 2-3pm. Las personas con condiciones cardiovasculares deben evitarlos.',
  vitamin: 'Los micronutrientes (vitaminas y minerales) son cofactores de prácticamente todas las reacciones metabólicas del cuerpo. Los deportistas tienen demandas aumentadas, especialmente de Magnesio, Zinc y antioxidantes. El Omega 3 tiene el respaldo científico más sólido para salud general. El ZMA y el Magnesio son especialmente relevantes para recuperación nocturna y calidad del sueño.',
  hidratacion: 'La hidratación adecuada es fundamental para el rendimiento deportivo. Las bebidas isotónicas reponen electrolitos y glucógeno durante el ejercicio prolongado. Son más relevantes en sesiones de más de 60 minutos o en condiciones de calor. Para entrenamientos cortos el agua es suficiente.',
  colageno: 'Los colágenos hidrolizados son superiores a los no hidrolizados por su mejor absorción. La Vitamina C es esencial para la síntesis. El tipo I y III son los más documentados para tendones, piel y articulaciones.',
};

// ══════════════════════════════════════════════════════════
// FUNCIONES DE ANÁLISIS QUE USAN LA BASE DE DATOS
// ══════════════════════════════════════════════════════════

function buscarEnDB(prod) {
  // Mapa nombre estático → clave DB (hardcodeado para no depender de PRODUCTS_ESTATICO)
  var NOMBRE_A_KEY = {
    'whey protein doypack': 'sn_whey_dp',
    'platinum whey protein 2 lb': 'sn_plat_2lb',
    'platinum whey protein 3': 'sn_plat_3kg',
    'wh3y platinum': 'sn_wh3y',
    'just whey': 'sn_justwhey',
    'whey protein truemade': 'ena_truemade',
    '100% whey x 2': 'ena_100whey',
    'truemade whey colageno': 'ena_truecol',
    'proteina 7900 pote': 'gen_7900',
    'proteina 7900 doypack': 'gen_7900dp',
    'best whey x 2': 'xtr_bestwhey',
    'whey advanced': 'xtr_advanced',
    'whey ripped': 'gn_ripped',
    'whey 100% protein': 'gn_100whey',
    'iso gold': 'gn_isogold',
    'vegetal protein isolate': 'gn_vegetal',
    'proteina vegetal isolate': 'nfit_vegprot',
    'protein isolate pea': 'pp_pea',
    'proteina by pampita': 'wo_prot',
    'proteina fit': 'wo_protfit',
    'whey protein blend mervick': 'mer_blend',
    'bio prot': 'hs_bioprot',
    'creatina 300g pote': 'sn_creat_pote',
    'creatina 300g doypack': 'sn_creat_doy',
    'creatina 500g': 'sn_creat_500',
    'creatina 1 kg': 'sn_creat_1kg',
    'creatine powder': 'on_creat',
    'creatina micronizada': 'ena_creat',
    'creatina x300g': 'gn_creat',
    'creatina monohidrato 300g max': 'mxf_creat',
    'creatina 250g xtrenght': 'xtr_creat250',
    'creatina 500g xtrenght': 'xtr_creat500',
    'creatina 300g mervick': 'mer_creat',
    'creatina 200g': 'pp_creat',
    'collageno hidrolizado 210': 'sn_col210',
    'collagen sport': 'sn_col_sport',
    'collagen plus': 'sn_col_plus',
    'colageno hidrolizado 200g pote': 'gn_col200p',
    'colageno hidrolizado 200g doypack': 'gn_col200d',
    'collagen flex': 'nlab_collagen',
    'colageno hialuronico': 'wo_colageno',
    'tnt dynamite': 'sn_tnt',
    'pump v8': 'sn_pumpv8',
    'pre work gold': 'gn_prework',
    'pre work 240g': 'nmax_prework',
    'pre entreno con quemador': 'wo_preentreno',
    'mutantmass': 'sn_mutant',
    'ultra mass': 'ena_ultramass',
    'nitro gain': 'xtr_nitrogain',
    'gainer gold': 'gn_gainer',
    'gainer complex': 'mer_gainer',
    'mass fusion': 'idn_massfusion',
    'extreme mass': 'hs_extreme',
    'mtor bcaa': 'sn_mtor',
    "eaa's aminoacidos": 'sn_eaas',
    'eaas aminoacidos': 'sn_eaas',
    'l-glutamina 300g': 'sn_glut',
    'l-arginina': 'sn_arginine',
    'l-carnitina 60 comp': 'sn_lcarnitina',
    'beta alanina': 'sn_betaal',
    'bcaa 2:1:1 90': 'ena_bcaa',
    'l-carnitina 1500': 'ena_lcarnitina',
    'glutamina 300g en pote': 'ena_glut',
    'carnitina liquida': 'gen_carnit',
    'thermo fuel': 'sn_thermo',
    'fat burner': 'wo_fatburner',
    'tx3 black': 'gen_tx3',
    'lipo gold elite': 'gn_lipo',
    'lipo burn': 'gn_lipo_hc',
    'thermogenic max 120': 'nlab_thermo120',
    'termogenic max 240': 'nlab_thermo240',
    'vitamina c': 'sn_vitc',
    'multivitaminico 60': 'sn_multi',
    'omega 3 fish oil 60': 'sn_omega3',
    'omega 3 1000mg 200': 'ge_omega3',
    'omega 3 con omega 6': 'lap_omega3',
    'zma 90': 'sn_zma',
    'zma 60': 'gn_zma',
    'zma-b': 'hs_zmab',
    'cla 1000': 'sn_cla',
    'resveratrol 500': 'sn_resv',
    'resveratrol by pampita': 'wo_resv',
    'citrato de magnesio 60': 'sn_citr60',
    'citrato magnesio x 500': 'sn_citr500',
    'citrato de magnesio 144': 'grg_citr',
    'citrato de magnesio 400': 'hs_citr400',
    'bisglicinato de magnesio': 'lap_mag',
    'cafeina 200mg 30': 'sn_cafeina30',
    'cafeina 200mg 60': 'nmax_cafeina200',
    'ashwagandha': 'lap_ashwa',
    'nad 500': 'lap_nad',
    'testo gold': 'gn_testo',
    'hydroplus endurance': 'sn_hydroplus',
    'hydromax 600': 'nmax_hmax600',
    'hydromax 1320': 'nmax_hmax1320',
    'just carb': 'sn_justcarb',
    'low carbs protein bar': 'mer_lowcarb',
    'whey bar 65': 'mer_wheybar65',
    'pancakes proteicos': 'grg_pancake',
    'pasta de mani': 'mani_king',
  };

  // 1. ID exacto en DB
  if (DB_ANALISIS[prod.id]) return DB_ANALISIS[prod.id];

  // 2. Buscar por nombre normalizado contra el mapa
  var n = (prod.name || '').toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n')
    .replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

  // Buscar coincidencia exacta en el mapa
  if (NOMBRE_A_KEY[n] && DB_ANALISIS[NOMBRE_A_KEY[n]]) return DB_ANALISIS[NOMBRE_A_KEY[n]];

  // 3. Buscar parcial — la clave del mapa que más palabras comparte con el nombre
  var mejor = null, mejorScore = 0;
  Object.keys(NOMBRE_A_KEY).forEach(function(mapKey) {
    var dbKey = NOMBRE_A_KEY[mapKey];
    if (!DB_ANALISIS[dbKey]) return;
    var palabras = n.split(' ').filter(function(w){ return w.length > 2; });
    if (!palabras.length) return;
    var hits = palabras.filter(function(w){ return mapKey.indexOf(w) >= 0; }).length;
    var score = hits / palabras.length;
    if (score > mejorScore && score >= 0.4) { mejorScore = score; mejor = DB_ANALISIS[dbKey]; }
  });
  return mejor;
}

function buscarParPredefinido(prods) {
  var staticIds = prods.map(function(prod) {
    if (DB_ANALISIS[prod.id]) return prod.id;
    var n = _norm(prod.name);
    var mejor = null, mejorScore = 0;
    PRODUCTS_ESTATICO.forEach(function(sp) {
      if (!DB_ANALISIS[sp.id]) return;
      var sn = _norm(sp.name);
      var palabras = n.split(' ').filter(function(w){ return w.length > 2; });
      if (!palabras.length) return;
      var score = palabras.filter(function(w){ return sn.indexOf(w) >= 0; }).length / palabras.length;
      if (score > mejorScore && score >= 0.45) { mejorScore = score; mejor = sp.id; }
    });
    return mejor || prod.id;
  });
  return staticIds.sort().join('|');
}

function renderDatosTec(tec) {
  if (!tec) return '';
  var html = '';
  var campos = [
    ['tipo',         'Tipo/Clasificación'],
    ['proteina',     'Proteína por porción'],
    ['colageno',     'Colágeno por porción'],
    ['carbs',        'Carbohidratos'],
    ['grasas',       'Grasas'],
    ['calorias',     'Calorías/porción'],
    ['lactosa',      'Lactosa'],
    ['aminoacidos',  'Aminoácidos clave'],
    ['leucina',      'Leucina'],
    ['total',        'Total BCAAs'],
    ['composicion',  'Composición'],
    ['filtrado',     'Proceso de fabricación'],
    ['absorcion',    'Velocidad de absorción'],
    ['pureza',       'Pureza'],
    ['certificacion','Certificación'],
    ['cafeina',      'Cafeína'],
    ['citrulina',    'Citrulina Malato'],
    ['beta_alanina', 'Beta-Alanina'],
    ['agmatina',     'Agmatina'],
    ['glicerol',     'Glicerol'],
    ['otros',        'Otros activos'],
    ['vitc',         'Vitamina C'],
    ['minerales',    'Minerales adicionales'],
    ['magnesio',     'Magnesio'],
    ['zinc',         'Zinc'],
    ['b6',           'Vitamina B6'],
    ['epa_dha',      'EPA + DHA'],
    ['fuente_prot',  'Fuente proteica'],
    ['dosis',        'Dosis efectiva'],
    ['mecanismo',    'Cómo funciona en el cuerpo'],
    ['efectos',      'Efectos'],
    ['aditivos',     'Aditivos/excipientes'],
    ['cuando',       'Cuándo tomarlo'],
    ['advertencia',  '⚠ Importante'],
    ['nota',         '📌 Nota técnica'],
    ['limitacion',   '⚠ Limitación'],
    ['evitar',       '✗ Evitar si'],
  ];
  campos.forEach(function(par) {
    var campo = par[0], label = par[1];
    if (tec[campo]) {
      var esWarning = label.indexOf('⚠') >= 0 || label.indexOf('✗') >= 0 || campo === 'evitar' || campo === 'limitacion';
      html += '<p><strong>' + label + ':</strong> <span style="color:' + (esWarning ? '#FF9900' : '#ccc') + '">' + tec[campo] + '</span></p>';
    }
  });
  if (tec.ideal)   html += '<p style="margin-top:8px"><span class="comp-tag-ok">✓ IDEAL PARA</span> ' + tec.ideal + '</p>';
  if (tec.ventaja) html += '<p><span class="comp-tag-ok">★ VENTAJA CLAVE</span> ' + tec.ventaja + '</p>';
  return html;
}

function generarAnalisisDinamico(prods, cats) {
  var misma = cats.every(function(x){ return x === cats[0]; });
  var html = '';
  var cat = cats[0];

  if (misma) {
    // Info general de categoría
    if (ANALISIS_CAT[cat]) {
      html += '<h3>Sobre los ' + (catLabels[cat]||cat) + '</h3>';
      html += '<p style="color:#aaa;font-size:.88rem">' + ANALISIS_CAT[cat] + '</p>';
    }
    // Análisis de cada producto
    html += '<h3 style="margin-top:20px">Análisis técnico comparado</h3>';
    prods.forEach(function(p) {
      var tec = buscarEnDB(p);
      html += '<div style="border-left:3px solid var(--cyan);padding-left:14px;margin:16px 0">';
      html += '<h4 style="color:#fff;margin-bottom:8px">' + p.name + ' <span style="color:#888;font-size:.8rem">— ' + p.brand + '</span></h4>';
      if (tec) {
        html += renderDatosTec(tec);
      } else {
        html += '<p>' + (p.desc || 'Producto de alta calidad de marca reconocida.') + '</p>';
      }
      html += '</div>';
    });
    // Consejos de categoría
    if (CONSEJOS_CAT[cat]) html += CONSEJOS_CAT[cat](prods);
    // Comparación de precio
    html += generarComparacionPrecio(prods);
  } else {
    html += '<h3>Productos de categorías distintas</h3>';
    html += '<p>Estos productos tienen funciones diferentes. Te explicamos cada uno para que puedas decidir si los necesitás juntos o tenés que priorizar uno.</p>';
    prods.forEach(function(p) {
      var tec = buscarEnDB(p);
      html += '<div style="border-left:3px solid var(--cyan);padding-left:14px;margin:16px 0">';
      html += '<h4>' + p.name + ' (' + p.brand + ')</h4>';
      if (tec) {
        if (tec.tipo)      html += '<p><strong>Tipo:</strong> ' + tec.tipo + '</p>';
        if (tec.mecanismo) html += '<p><strong>Cómo funciona:</strong> ' + tec.mecanismo + '</p>';
        if (tec.ideal)     html += '<p><span class="comp-tag-ok">✓ IDEAL PARA</span> ' + tec.ideal + '</p>';
        if (tec.ventaja)   html += '<p><span class="comp-tag-ok">★ DIFERENCIAL</span> ' + tec.ventaja + '</p>';
      } else {
        if (ANALISIS_CAT[p.cat]) html += '<p>' + ANALISIS_CAT[p.cat] + '</p>';
        html += '<p>' + (p.desc || '') + '</p>';
      }
      html += '</div>';
    });
  }
  return html;
}


function generarComparacionPrecio(prods) {
  var html = '<h4>Comparacion de valor</h4><ul>';
  prods.forEach(function(p) {
    var stock = p.flavors.reduce(function(s,f){ return s+f.stock; }, 0);
    var kg = p.name.toLowerCase().indexOf('1 kg') >= 0 ? 1 :
             p.name.toLowerCase().indexOf('500g') >= 0 ? 0.5 :
             p.name.toLowerCase().indexOf('300g') >= 0 ? 0.3 :
             p.name.toLowerCase().indexOf('200g') >= 0 ? 0.2 : null;
    var pgram = kg ? Math.round(p.price / (kg * 1000)) : null;
    html += '<li><strong>' + p.name + '</strong> (' + p.brand + '): $' + p.price.toLocaleString('es-AR');
    if (pgram) html += ' — <span style="color:var(--cyan)">$' + pgram + ' por gramo</span>';
    html += ' — Stock: ' + stock + ' uds</li>';
  });
  html += '</ul>';
  return html;
}

// ═══════════════════════════════════════════════════════
//  BASE DE CONOCIMIENTO: COMPARACIONES PREDEFINIDAS
var COMPARACIONES = {};

// ═══════════════════════════════════════════════════════


// ── PROTEÍNAS vs PROTEÍNAS ──────────────────────────────

// Whey concentrado vs aislado (par más consultado)
COMPARACIONES['sn_whey_dp|sn_plat_2lb'] = generarHTML([
  {titulo: 'Whey Doypack (Star Nutrition) — Concentrado', texto: 'Es la proteína de suero concentrada (WPC). Contiene entre 70-80% de proteína por porción, más lactosa, más grasas y carbohidratos residuales que el aislado. El proceso de filtración es menos intenso, lo que conserva más componentes bioactivos del suero (lactoferrina, inmunoglobulinas) que pueden ser beneficiosos. Es la opción más accesible económicamente y funciona muy bien para la mayoría de las personas que no tienen intolerancia a la lactosa.'},
  {titulo: 'Platinum Whey Protein (Star Nutrition) — Concentrado + Aislado', texto: 'Fórmula premium que combina concentrado y aislado de proteína de suero. El aislado aporta mayor concentración de proteína por porción (85-90%), menor lactosa y menor contenido graso. La mezcla de ambos da un perfil proteico más completo: absorción rápida del aislado más los péptidos bioactivos del concentrado. Mejor digestibilidad y más apta para intolerantes leves a la lactosa.'},
  {titulo: 'Diferencias técnicas clave', texto: 'El concentrado tiene mayor contenido de lactosa (puede causar molestias digestivas). El Platinum tiene mejor perfil aminoacídico por porción y mayor biodisponibilidad. Ambos son fuentes completas de proteína con todos los aminoácidos esenciales. La diferencia en resultados musculares entre ambos es marginal si la proteína total diaria es adecuada.'},
  {titulo: '¿Para quién es cada uno?', texto: 'Doypack: principiantes, personas sin problemas digestivos, quienes buscan el mejor precio. Ideal para el día a día como batido post-entrenamiento. Platinum: personas con leve intolerancia a la lactosa, atletas intermedios/avanzados que quieren mayor calidad y digestibilidad, quienes priorizan la relación calidad-proteína por porción.'},
  {titulo: 'Recomendación final', texto: 'Si buscás precio: Doypack es imbatible. Si buscás calidad y digestibilidad: Platinum. Para resultados musculares concretos, ambos funcionan igual de bien si cubrís tu objetivo proteico diario (1.6-2.2g/kg). La diferencia es más en digestibilidad y comodidad que en resultados.'}
]);

COMPARACIONES['sn_plat_2lb|sn_plat_3kg'] = generarHTML([
  {titulo: '2 Lb vs 3 Kg: Mismo producto, diferente escala', texto: 'El Platinum Whey 2Lb y el 3Kg son la misma fórmula de Star Nutrition — concentrado + aislado microfiltrado. La diferencia es exclusivamente el formato y el precio por porción. El 3Kg ofrece un costo por porción significativamente menor, ideal para consumo sostenido.'},
  {titulo: '¿Cuándo elegir 2 Lb?', texto: 'Primera vez que probás el producto y querés ver si te cae bien. Si no tenés certeza de mantener el consumo regular. Si el espacio de almacenamiento es limitado. Para viajes o consumo esporádico.'},
  {titulo: '¿Cuándo elegir 3 Kg?', texto: 'Si ya sabés que el producto te sienta bien. Si entrenás regularmente y consumís al menos 1 porción diaria. El ahorro por porción en el 3Kg puede ser de 15-25% respecto al 2Lb. Para atletas serios que consumen proteína todos los días, el 3Kg es la opción inteligente.'},
  {titulo: 'Cálculo de consumo', texto: 'Si tomás 1 porción de 30g por día: el 2Lb (aprox 908g) dura ~30 días. El 3Kg dura ~100 días. Para consumo regular, el 3Kg es claramente la mejor inversión.'}
]);

COMPARACIONES['ena_truemade|sn_whey_dp'] = generarHTML([
  {titulo: 'ENA TrueMade — Blend de Proteínas (Isolada + Concentrada)', texto: 'TrueMade de ENA es una fórmula blend que combina proteína aislada de suero (WPI) con concentrada (WPC). La presencia del aislado como componente principal le da mayor concentración proteica por porción y menor lactosa. ENA es una marca argentina reconocida, con buena relación calidad-precio y control de calidad local.'},
  {titulo: 'Star Nutrition Whey Doypack — Concentrado Clásico', texto: 'El Whey Doypack de Star es un concentrado puro (WPC). Más económico, mayor contenido de lactosa y grasas residuales. Star Nutrition es la marca de referencia en Argentina con décadas de trayectoria. El doypack es un formato conveniente y popular.'},
  {titulo: 'Diferencia principal: Composición', texto: 'TrueMade tiene mayor % de proteína por porción por el aislado. Menor lactosa (mejor para intolerantes leves). Star Doypack tiene más carbohidratos y grasas por porción pero es más económico. Ambos proveen todos los aminoácidos esenciales con alto contenido de leucina para la síntesis proteica.'},
  {titulo: '¿Para quién es cada uno?', texto: 'TrueMade: personas que buscan mayor calidad proteica, intolerantes leves a la lactosa, definición muscular donde importa más la proteína neta. Doypack: volumen/ganancia de masa donde las calorías extra no molestan, quienes priorizan precio, principiantes.'},
  {titulo: 'Recomendación', texto: 'Para calidad y digestibilidad: TrueMade. Para mejor precio con buena calidad: Doypack. En términos de resultados musculares, la diferencia es pequeña si ambos cubren tus necesidades proteicas diarias.'}
]);

COMPARACIONES['gn_isogold|ena_truemade'] = generarHTML([
  {titulo: 'Gold Nutrition Iso Gold — Aislado Puro (WPI)', texto: 'Iso Gold es proteína de suero aislada al 100%. El proceso de micro e ultrafiltración elimina prácticamente toda la lactosa y las grasas, dejando >90% de proteína por porción. Es la forma más pura de proteína de suero disponible. Digestión más rápida, menor carga calórica, ideal para intolerantes a la lactosa.'},
  {titulo: 'ENA TrueMade — Blend (WPI + WPC)', texto: 'TrueMade combina aislado y concentrado. Tiene alta proteína por porción pero no tan pura como el Iso Gold. La mezcla de ambas proteínas da un perfil de absorción más sostenido: el aislado se absorbe rápido (ideal post-entreno) y el concentrado un poco más lento.'},
  {titulo: 'WPI vs WPI+WPC: ¿Importa la diferencia?', texto: 'Para el 90% de las personas, la diferencia práctica es mínima si la ingesta proteica total es correcta. El aislado puro brilla en: intolerancia a la lactosa, dietas muy estrictas de definición donde cada caloría cuenta, personas con digestión muy sensible. El blend es igualmente efectivo para ganancia de masa muscular y cuesta menos.'},
  {titulo: 'Recomendación', texto: 'Iso Gold: si sos intolerante a la lactosa, estás en fase de definición estricta o tu digestión es sensible. TrueMade: si buscás excelente calidad a mejor precio con digestión normal. Para ganancia muscular pura, ambos son equivalentes.'}
]);

COMPARACIONES['gn_vegetal|nfit_vegprot'] = generarHTML([
  {titulo: 'Proteínas Vegetales: Vegetal Protein vs Proteína Vegetal Isolate', texto: 'Ambos son proteínas 100% vegetales, sin lactosa, sin gluten, aptos para veganos y personas con intolerancia a la leche. La diferencia está en la fuente y el proceso de elaboración.'},
  {titulo: 'Gold Nutrition Vegetal Protein', texto: 'Blend de proteínas vegetales (típicamente arveja + arroz o similar). La combinación de fuentes vegetales complementa los perfiles aminoacídicos: la arveja es alta en lisina pero baja en metionina; el arroz es alto en metionina pero bajo en lisina. Juntos forman un perfil más completo.'},
  {titulo: 'NucleoFit Proteína Vegetal Isolate', texto: 'Proteína vegetal en formato aislado. El proceso de aislamiento aumenta el porcentaje de proteína por porción y reduce carbohidratos y grasas. El "isolate" vegetal es más puro y tiene mejor digestibilidad.'},
  {titulo: 'Calidad de proteína vegetal vs animal', texto: 'Las proteínas vegetales tienen un score PDCAAS (digestibilidad y aminoácidos) levemente inferior al whey, pero la diferencia práctica en ganancia muscular es mínima si se consume suficiente cantidad. Estudios recientes muestran resultados equivalentes entre proteína de arveja y whey para hipertrofia cuando las dosis son iguales.'},
  {titulo: 'Recomendación', texto: 'Ambos son excelentes opciones veganas. El Isolate tiene mayor proteína por porción y mejor digestibilidad. El blend puede ofrecer mejor perfil aminoacídico completo. Si sos vegano o intolerante a la lactosa, cualquiera de los dos funciona perfectamente.'}
]);

COMPARACIONES['pp_pea|gn_vegetal'] = generarHTML([
  {titulo: 'Protein Project Pea Isolate — Aislado de Arveja', texto: 'Proteína aislada de arveja al 100%. La arveja amarilla es actualmente la fuente de proteína vegetal con mayor evidencia científica para ganancia muscular. Estudios directos comparan proteína de arveja vs whey para hipertrofia y muestran resultados equivalentes. Alta en leucina, lisina y arginina. Sin lectinas ni fitatos (removidos en el proceso de aislamiento).'},
  {titulo: 'Gold Nutrition Vegetal Protein — Blend Vegetal', texto: 'Mezcla de fuentes vegetales para un perfil aminoacídico más completo. Los blends vegetales compensan las deficiencias individuales de cada fuente proteica.'},
  {titulo: 'Arveja sola vs Blend vegetal', texto: 'La arveja aislada tiene ventaja en pureza y concentración proteica. El blend tiene ventaja en variedad de aminoácidos. Para síntesis proteica muscular, la leucina es el aminoácido más crítico (trigger del mTORC1), y la arveja tiene buena concentración de leucina (~8% del perfil).'},
  {titulo: 'Recomendación', texto: 'Para máxima proteína por porción y mejor evidencia científica: Pea Isolate. Para una dieta vegana variada con perfil aminoacídico más completo: Blend vegetal. Ambos son opciones sólidas para veganos y personas con intolerancia láctea.'}
]);

// ── CREATINAS ──────────────────────────────────────────

COMPARACIONES['on_creat|sn_creat_pote'] = generarHTML([
  {titulo: 'Optimum Nutrition Creatine vs Star Nutrition Creatina', texto: 'Una de las comparaciones más frecuentes del mercado argentino: la creatina importada premium vs la nacional de calidad.'},
  {titulo: 'ON Creatine Powder — El estándar internacional', texto: 'Optimum Nutrition usa Creapure®, la creatina monohidrato alemana considerada el gold standard mundial. Creapure es producida por AlzChem bajo certificación ISO, con pureza >99.9% y sin contaminantes. Ha sido la creatina de referencia en estudios clínicos. ON también tiene tercera certificación Informed Sport (libre de sustancias prohibidas).'},
  {titulo: 'Star Nutrition Creatina — Nacional de alta calidad', texto: 'Star Nutrition produce creatina monohidrato de alta pureza en Argentina. El proceso de micronización permite mejor disolución y absorción. Para el consumidor promedio, la diferencia con Creapure es prácticamente imperceptible en resultados. Star es accesible, confiable y tiene excelente trayectoria en el mercado local.'},
  {titulo: 'La verdad sobre las creatinas', texto: 'La creatina monohidrato es la misma molécula independientemente de la marca. La diferencia está en la pureza y el proceso de fabricación. Ambas marcas ofrecen creatina de alta calidad. Los efectos (aumento de fuerza, potencia y masa muscular) son los mismos con cualquier creatina de calidad cuando se toma la dosis correcta (3-5g diarios).'},
  {titulo: 'Recomendación', texto: 'Si buscás la mejor creatina sin restricciones de presupuesto o competís en deportes con control antidoping: ON Creatine (Creapure certificada). Si buscás excelente calidad al mejor precio posible: Star Nutrition Creatina. Los resultados son prácticamente idénticos.'}
]);

COMPARACIONES['sn_creat_300|ena_creat'] = generarHTML([
  {titulo: 'Star Nutrition vs ENA Creatina Micronizada', texto: 'Dos de las marcas nacionales más populares en creatina.'},
  {titulo: 'Star Nutrition Creatina 300g', texto: 'Creatina monohidrato ultramicronizada. Star es la marca más vendida de Argentina con décadas de respaldo. Su proceso de micronización garantiza rápida disolución y buena biodisponibilidad. Sin aditivos innecesarios.'},
  {titulo: 'ENA Creatina Micronizada 300g', texto: 'ENA también ofrece creatina monohidrato micronizada. ENA tiene larga trayectoria en el mercado argentino y buen control de calidad. Su micronización es comparable a Star en términos de disolución y absorción.'},
  {titulo: 'Diferencia real', texto: 'Ambas son creatina monohidrato micronizada de alta calidad de marcas argentinas reconocidas. La diferencia en resultados es mínima. El factor decisivo es el precio por gramo en el momento de la compra y la disponibilidad.'},
  {titulo: 'Recomendación', texto: 'Elegí la que tenga mejor precio en el momento. Ambas funcionan igual de bien. La constancia en el consumo (3-5g diarios sostenidos) importa mucho más que la marca.'}
]);

COMPARACIONES['sn_creat_pote|sn_creat_1kg'] = generarHTML([
  {titulo: '300g vs 1 Kg: Misma creatina, diferente compromiso', texto: 'Ambos son Star Nutrition Creatina Monohidrato. La única diferencia es el tamaño.'},
  {titulo: '¿Por qué comprar 1 Kg?', texto: 'A 5g diarios (dosis estándar), los 300g duran 60 días. El 1Kg dura 200 días (6-7 meses). El precio por gramo del 1Kg es significativamente menor. Si ya sabés que la creatina te funciona bien (no causa molestias digestivas ni retención hídrica problemática), el 1Kg es la inversión más inteligente.'},
  {titulo: '¿Cuándo elegir 300g?', texto: 'Primera vez que usás creatina y querés probar cómo responde tu cuerpo. Si tu presupuesto mensual es ajustado. Si no estás seguro de mantener el hábito de consumo diario.'},
  {titulo: 'La creatina y la carga', texto: 'El protocolo de carga (20g/día por 5-7 días) satura los músculos más rápido pero el mantenimiento (3-5g/día) llega al mismo punto en 3-4 semanas. Con 1Kg el protocolo de carga no supone un gasto extra significativo.'}
]);

// ── PRE-ENTRENOS ──────────────────────────────────────

COMPARACIONES['sn_tnt|sn_pumpv8'] = generarHTML([
  {titulo: 'TNT Dynamite vs Pump V8 — El duelo de los pre-entrenos de Star', texto: 'Star Nutrition tiene dos pre-entrenos con filosofías completamente diferentes. Esta es una de las comparaciones más importantes de su línea.'},
  {titulo: 'TNT Dynamite — Pre-entreno Estimulante Clásico', texto: 'TNT es el pre-entreno de energía y enfoque. Contiene cafeína (estimulante del SNC), beta-alanina (reduce la fatiga muscular), citrulina malato (vasodilatador, bomba muscular), arginina y otros ingredientes. La cafeína eleva la adrenalina, dopamina y noradrenalina, generando mayor alertamiento mental, reducción de la percepción de esfuerzo y mayor rendimiento en ejercicio de alta intensidad. El hormigueo (parestesia) de la beta-alanina es normal.'},
  {titulo: 'Pump V8 — Pre-entreno Sin Estimulantes (Stim-Free)', texto: 'Pump V8 es radicalmente diferente: NO contiene cafeína ni estimulantes. Su fórmula se centra en 8 ingredientes vasodilatadores: citrulina malato (alta dosis), agmatina, glicerol, norvaline y otros. El objetivo exclusivo es maximizar la bomba muscular (vasodilatación extrema), la hidratación intracelular muscular y el flujo sanguíneo. Sin estimulantes, no genera tolerancia ni interfiere con el sueño.'},
  {titulo: 'Diferencia fundamental', texto: 'TNT = energía + bomba. Pump V8 = solo bomba, sin energía. Con TNT sentís más energía, más agresividad y foco. Con Pump V8 la diferencia es visual (venas, congestión muscular) sin el buzz mental. Pump V8 se puede tomar de noche sin afectar el sueño.'},
  {titulo: '¿Para quién es cada uno?', texto: 'TNT: entrenamiento matutino o vespertino, personas que necesitan motivación y energía, ejercicio de alta intensidad (HIIT, CrossFit, powerlifting). Pump V8: entrenamientos nocturnos, personas sensibles a la cafeína, quienes ya toman cafeína por separado y quieren sumar vasodilatadores, bodybuilders que priorizan la congestión muscular.'},
  {titulo: 'Recomendación', texto: 'Para energía y rendimiento general: TNT Dynamite. Para máxima bomba sin estimulantes: Pump V8. Para el máximo rendimiento absoluto: algunos atletas avanzados los combinan (media dosis de cada uno), aunque esto requiere tolerancia establecida y no se recomienda para principiantes.'}
]);

COMPARACIONES['gn_prework|sn_tnt'] = generarHTML([
  {titulo: 'Gold Nutrition Pre Work vs Star TNT Dynamite', texto: 'Dos pre-entrenos estimulantes de marcas nacionales de referencia.'},
  {titulo: 'Star TNT Dynamite', texto: 'Fórmula bien establecida con cafeína, beta-alanina, citrulina malato y arginina. Star tiene décadas de trayectoria y TNT es uno de los pre-entrenos más vendidos de Argentina. La dosificación está bien equilibrada para la mayoría de los usuarios.'},
  {titulo: 'Gold Nutrition Pre Work Gold', texto: 'Pre-entreno de Gold Nutrition con perfil estimulante similar. GN es una marca argentina sólida. Su fórmula incluye ingredientes similares al TNT aunque con variaciones en dosis y fuentes de cafeína o adaptógenos adicionales según la versión.'},
  {titulo: '¿Cómo elegir entre pre-entrenos similares?', texto: 'Cuando dos pre-entrenos tienen perfiles similares, los factores decisivos son: (1) precio por porción, (2) sabor que preferís (ya que lo vas a tomar frecuentemente), (3) cómo responde tu cuerpo específicamente, (4) si contienen ingredientes que valorás o que preferís evitar.'},
  {titulo: 'Recomendación', texto: 'Probá el de mejor precio y si te funciona bien en términos de energía y tolerancia digestiva, quedate con ese. Ambas marcas tienen buena calidad. La diferencia de rendimiento entre pre-entrenos similares de marcas nacionales de calidad es mínima.'}
]);

COMPARACIONES['sn_tnt|wo_preentreno'] = generarHTML([
  {titulo: 'TNT Dynamite vs Pre Entreno con Quemador — Dos filosofías distintas', texto: 'El TNT es un pre-entreno puro de rendimiento. El Pre Entreno Con Quemador agrega función termogénica al estímulo pre-entrenamiento.'},
  {titulo: 'TNT Dynamite — Rendimiento puro', texto: 'Optimizado para maximizar el rendimiento deportivo: fuerza, potencia, resistencia, foco mental. Los ingredientes están doseados para el entrenamiento intenso.'},
  {titulo: 'Pre Entreno Con Quemador — Doble función', texto: 'Combina los estimulantes del pre-entreno con ingredientes termogénicos (extractos quema grasa, L-carnitina, CLA o similares). La idea es entrenar con energía mientras se potencia la oxidación de grasa simultáneamente.'},
  {titulo: 'La verdad sobre los "quemadores" en pre-entrenos', texto: 'Los ingredientes termogénicos en un pre-entreno tienen efecto más modesto que un termogénico dedicado, ya que las dosis son menores para no comprometer el perfil pre-entrenamiento. Es una solución "2 en 1" conveniente pero no maximiza ninguna de las dos funciones.'},
  {titulo: 'Recomendación', texto: 'Si tu objetivo principal es el RENDIMIENTO deportivo: TNT Dynamite. Si buscás perder grasa y entrenar con más energía sin querer tomar dos suplementos por separado: Pre Entreno con Quemador. Para resultados óptimos en cada función, es mejor un pre-entreno puro (TNT) + un quemador separado.'}
]);

// ── QUEMADORES ──────────────────────────────────────

COMPARACIONES['sn_thermo|gn_lipo_hc'] = generarHTML([
  {titulo: 'Thermo Fuel Max (Star) vs Lipo Burn Hardcore (Gold Nutrition)', texto: 'Los dos termogénicos más potentes de sus respectivas marcas. Esta comparación es para usuarios que buscan el máximo efecto termogénico.'},
  {titulo: 'Star Nutrition Thermo Fuel Max', texto: 'El termogénico insignia de Star. Contiene cafeína anhidra (estimulante principal), yerba mate (cafeína natural + antioxidantes), CLA (ácido linoleico conjugado, anti-lipogénico), L-Tirosina (precursor de dopamina y noradrenalina, mejora el foco) y otros termogénicos. Fórmula sólida, bien dosificada, con años de respaldo en el mercado.'},
  {titulo: 'Gold Nutrition Lipo Burn Hardcore', texto: 'El termogénico máxima potencia de GN. Formato Hardcore implica dosis más altas de estimulantes. Contiene múltiples fuentes de cafeína y termogénicos adicionales para mayor intensidad. Indicado para usuarios con tolerancia establecida a los estimulantes.'},
  {titulo: 'Termogénicos: ¿Qué hacen realmente?', texto: 'Los termogénicos aumentan la temperatura basal del cuerpo (termogénesis), aceleran el metabolismo, reducen el apetito y aumentan la oxidación de grasas. El efecto real sobre la pérdida de grasa es de 3-5% adicional sobre la dieta y el ejercicio. No son la solución mágica, son un complemento que potencia los resultados de una dieta con déficit calórico.'},
  {titulo: '¿Para quién NO son aptos?', texto: 'Personas con hipertensión, arritmias, problemas cardíacos, ansiedad severa, insomnio, embarazadas o lactantes. No deben combinarse con otros estimulantes ni tomarse después de las 3pm para no afectar el sueño.'},
  {titulo: 'Recomendación', texto: 'Para iniciarse en termogénicos: Thermo Fuel Max (fórmula balanceada). Para usuarios avanzados con tolerancia establecida que buscan máxima potencia: Lipo Burn Hardcore. Empezar siempre con media dosis para evaluar tolerancia.'}
]);

COMPARACIONES['wo_fatburner|sn_thermo'] = generarHTML([
  {titulo: 'Fat Burner Woman vs Thermo Fuel Max — Termogénico femenino vs unisex', texto: 'Una comparación importante: el termogénico diseñado para la mujer vs el termogénico general de alta potencia.'},
  {titulo: 'Woman Fat Burner — Formulado para la mujer', texto: 'Termogénico con dosis moderadas de estimulantes y componentes específicos para el metabolismo femenino: extracto de té verde (EGCG, antioxidante y termogénico suave), CLA (anti-lipogénico, preserva masa muscular), L-Carnitina (transporte de grasas a la mitocondria) y cafeína natural en dosis moderada. Diseñado para ser efectivo sin generar los efectos secundarios que las mujeres suelen reportar con termogénicos de alta potencia (ansiedad excesiva, palpitaciones, insomnio).'},
  {titulo: 'Star Thermo Fuel Max — Alta potencia general', texto: 'Termogénico de mayor potencia con cafeína anhidra en dosis más altas. Más agresivo en su efecto estimulante. Muy efectivo para pérdida de grasa pero puede generar mayor ansiedad, insomnio y tolerancia más rápida.'},
  {titulo: 'Diferencias hormonales que importan', texto: 'Las mujeres tienen mayor sensibilidad a los estimulantes que los hombres en promedio. Las variaciones hormonales del ciclo menstrual afectan la tolerancia a la cafeína. En la fase lútea (post-ovulación), la sensibilidad a la cafeína aumenta. El Fat Burner femenino considera estas particularidades con dosis más moderadas.'},
  {titulo: 'Recomendación', texto: 'Para mujeres: Fat Burner es la primera opción, especialmente si nunca usaron termogénicos o son sensibles a los estimulantes. Si ya tienen tolerancia establecida y buscan mayor potencia, Thermo Fuel Max puede ser una opción evaluando tolerancia con media dosis.'}
]);

// ── GAINERS ──────────────────────────────────────────

COMPARACIONES['ena_ultramass|sn_mutant'] = generarHTML([
  {titulo: 'ENA Ultra Mass vs Star MutantMass — Gainers para volumen', texto: 'Comparación de dos de los gainers nacionales más vendidos. Ambos están diseñados para el objetivo de ganar masa muscular y peso corporal.'},
  {titulo: 'Star Nutrition MutantMass', texto: 'Gainer de Star con alta densidad calórica. Combina proteína de suero con carbohidratos de alta y media absorción (maltodextrina, avena). Aporte calórico alto por porción (500-700 kcal dependiendo la dosis). Buena fuente de proteínas con perfil aminoacídico completo. Clásico en el mercado argentino.'},
  {titulo: 'ENA Ultra Mass', texto: 'Gainer de ENA con filosofía similar: altas calorías, proteína moderada, carbohidratos como sustrato principal. ENA tiene buena reputación en el mercado local. La composición es competitiva con MutantMass.'},
  {titulo: '¿Quién necesita un gainer realmente?', texto: 'Los gainers están pensados para personas con metabolismo muy acelerado (hardgainers) que tienen dificultad para aumentar de peso y cubrir sus requerimientos calóricos solo con la dieta. Si sos del tipo que engorda con relativa facilidad, los gainers pueden generar más grasa que músculo. En ese caso, es mejor subir las calorías de la dieta o usar una proteína pura.'},
  {titulo: 'Recomendación', texto: 'Ambos gainers cumplen su función. Elegí por precio y sabor. Importante: usarlos como complemento calórico cuando la dieta no alcanza, no como sustituto de comidas. La dosis real que funciona es la que completa tu objetivo calórico diario, no necesariamente la que indica el envase.'}
]);

COMPARACIONES['gn_gainer|idn_massfusion'] = generarHTML([
  {titulo: 'Gold Nutrition Gainer Gold vs IDN Mass Fusion', texto: 'Dos gainers con enfoques nutricionales ligeramente diferentes.'},
  {titulo: 'Gold Nutrition Gainer Gold 5Lb', texto: 'Gainer con mayor volumen por envase, económico en precio por porción. GN tiene larga trayectoria. Su fórmula prioriza el aporte calórico a través de carbohidratos complejos y proteína de suero. El formato de 5 Lb es conveniente para consumo regular y largo plazo.'},
  {titulo: 'IDN Mass Fusion', texto: 'Gainer con mezcla de proteínas (whey + caseína en algunos formatos) que puede dar absorción más sostenida. IDN es una marca nacional con buena relación calidad-precio.'},
  {titulo: 'Cómo evaluar un gainer', texto: 'Los factores clave son: (1) proteína por porción (mínimo 25-30g), (2) calidad de proteína (whey vs mezcla), (3) tipo de carbohidratos (preferir complejos sobre azúcares simples), (4) precio por porción y (5) sabor. Revisar la etiqueta nutricional y no solo el marketing del envase.'},
  {titulo: 'Recomendación', texto: 'Para mayor volumen económico: Gainer Gold. Para una fórmula más balanceada: evaluar el Mass Fusion. En definitiva, el mejor gainer es el que más te gusta en sabor y el que mejor tolera tu sistema digestivo, ya que la constancia es clave.'}
]);

// ── COLÁGENOS ──────────────────────────────────────

COMPARACIONES['sn_col_sport|sn_col_plus'] = generarHTML([
  {titulo: 'Collagen Sport vs Collagen Plus — El duelo interno de Star', texto: 'Star tiene dos colágenos premium y la diferencia es importante según tu objetivo.'},
  {titulo: 'Collagen Sport Naranja 360g — Para el deportista', texto: 'Formulado específicamente para atletas y personas con alta demanda articular. Contiene colágeno hidrolizado tipo I y III + Magnesio + Fósforo + Vitamina C. El magnesio mejora la función muscular y reduce calambres. El fósforo es importante para la mineralización ósea. La vitamina C es cofactor indispensable para la síntesis de colágeno endógeno. Ideal para desgaste articular por entrenamiento intenso.'},
  {titulo: 'Collagen Plus Limón 360g — Formulación avanzada', texto: 'Colágeno plus con una formulación más completa. Además del colágeno hidrolizado, agrega componentes para la salud articular integral: puede incluir vitamina C, minerales y en algunas versiones ácido hialurónico u otros agentes condroprotectores. Dirigido a quienes buscan la recuperación articular más completa.'},
  {titulo: 'Tipos de colágeno: Tipo I vs Tipo II vs Tipo III', texto: 'Tipo I: el más abundante del cuerpo. Piel, tendones, ligamentos, huesos. Tipo II: cartílago articular. Tipo III: piel joven, vasos sanguíneos. Los colágenos hidrolizados de Star son principalmente tipo I y III. Para condroprotección (cartílago) pura, el tipo II es más específico.'},
  {titulo: 'Recomendación', texto: 'Para deportistas con alta exigencia articular y muscular (entrenamiento intenso, levantamiento de pesas): Collagen Sport por su magnesio y fósforo adicionales. Para recuperación articular general, piel y bienestar integral: Collagen Plus. Ambos requieren consumo sostenido de al menos 3 meses para ver resultados.'}
]);

COMPARACIONES['sn_col210|sn_col_sport'] = generarHTML([
  {titulo: 'Colágeno Hidrolizado 210g vs Collagen Sport — Básico vs Deportivo', texto: 'La diferencia entre el colágeno básico y el deportivo de Star.'},
  {titulo: 'Colágeno Hidrolizado 210g — El clásico', texto: 'Colágeno hidrolizado tipo I y III puro. Ideal como primera opción o para quienes buscan los beneficios base: articulaciones, tendones, piel, uñas, cabello. Formato más pequeño y precio más accesible. Para personas que no practican deporte intenso o que priorizan la salud de la piel y el bienestar general.'},
  {titulo: 'Collagen Sport 360g — Potenciado para el deporte', texto: 'El mismo colágeno base pero con el triple de ingredientes complementarios: magnesio, fósforo y vitamina C. El formato más grande (360g) da mayor duración. La vitamina C es especialmente importante — sin vitamina C suficiente, el colágeno no se sintetiza correctamente en el cuerpo.'},
  {titulo: 'Importancia de la Vitamina C con colágeno', texto: 'La vitamina C es el cofactor de la prolil-hidroxilasa y lisil-hidroxilasa, enzimas que estabilizan la triple hélice del colágeno. Sin vitamina C, el colágeno que tomás no se incorpora eficientemente al tejido. Siempre tomar colágeno con vitamina C — si tu colágeno no la incluye, tomá la vitamina C por separado.'},
  {titulo: 'Recomendación', texto: 'Para uso general (piel, uñas, bienestar): Colágeno 210g. Para deportistas con entrenamiento regular y desgaste articular: Collagen Sport. La diferencia de precio se justifica si entrenás intensamente.'}
]);

COMPARACIONES['gn_col200p|sn_col_sport'] = generarHTML([
  {titulo: 'GN Colágeno 200g vs Star Collagen Sport', texto: 'Dos colágenos de marcas nacionales de referencia con diferentes enfoques.'},
  {titulo: 'Gold Nutrition Colágeno Hidrolizado 200g', texto: 'Colágeno hidrolizado puro de GN. Formato práctico (pote 200g). GN es marca confiable con buena relación calidad-precio. Para los beneficios base del colágeno: articulaciones, piel, tendones.'},
  {titulo: 'Star Collagen Sport 360g', texto: 'Mayor cantidad y fórmula enriquecida con magnesio, fósforo y vitamina C. Para deportistas que entrenan frecuentemente y necesitan mayor soporte articular y muscular.'},
  {titulo: 'Recomendación', texto: 'Para uso regular no deportivo: GN Colágeno (buen precio). Para deportistas con entrenamiento intenso: Collagen Sport. Si elegís el GN, asegurate de tomar vitamina C por separado para maximizar la síntesis de colágeno.'}
]);

// ── AMINOÁCIDOS ───────────────────────────────────────

COMPARACIONES['sn_mtor|sn_eaas'] = generarHTML([
  {titulo: 'BCAA (MTOR) vs EAA — La comparación más importante en aminoácidos', texto: 'Esta es una de las preguntas más frecuentes en nutrición deportiva actual. ¿BCAAs o EAAs? La ciencia ha evolucionado y la respuesta es clara.'},
  {titulo: 'MTOR BCAA 2:1:1 — Los tres ramificados', texto: 'Los BCAAs son 3 aminoácidos esenciales: Leucina (2), Isoleucina (1) y Valina (1). La leucina es el principal activador del mTORC1, la vía de síntesis proteica muscular. Los BCAAs se oxidan directamente en el músculo como fuente de energía durante el ejercicio. Históricamente fueron el suplemento aminoacídico #1.'},
  {titulo: 'EAA — Los 9 aminoácidos esenciales completos', texto: 'Los EAAs incluyen los 3 BCAAs más Histidina, Lisina, Metionina, Fenilalanina, Treonina y Triptófano. Para sintetizar nueva proteína muscular, el cuerpo necesita los 9 aminoácidos esenciales. Si falta cualquiera de los 9, la síntesis proteica se detiene — como construir una pared a la que le faltan ladrillos específicos.'},
  {titulo: 'La ciencia actual: EAAs ganan', texto: 'Estudios recientes demuestran que los EAAs estimulan la síntesis proteica muscular significativamente más que los BCAAs solos. Los BCAAs sin los otros 6 aminoácidos esenciales tienen un efecto limitado porque el cuerpo necesita "robarlos" de otros tejidos para completar la síntesis. Los EAAs proveen el perfil completo para una síntesis proteica óptima.'},
  {titulo: '¿Para qué sí sirven los BCAAs?', texto: 'Los BCAAs siguen siendo útiles en contextos específicos: entrenamiento en ayunas (para proteger músculo), ejercicio de muy larga duración donde la oxidación de BCAAs como combustible es alta, y como fuente de leucina adicional post-entrenamiento.'},
  {titulo: 'Recomendación', texto: 'Si ya tomás proteína whey completa antes/después de entrenar: los BCAAs adicionales tienen poco beneficio incremental (el whey ya tiene todos los EAAs). Si entrenás en ayunas o querés suplementar aminoácidos específicamente: los EAAs son superiores a los BCAAs por la completitud del perfil. El MTOR BCAA es un excelente suplemento; los EAAs son simplemente más completos.'}
]);

COMPARACIONES['sn_glut|ena_glut'] = generarHTML([
  {titulo: 'L-Glutamina Star vs ENA — ¿Importa la marca?', texto: 'Comparación de glutamina pura de dos marcas nacionales de referencia.'},
  {titulo: 'L-Glutamina 300g (Star Nutrition)', texto: 'Glutamina pura de Star. El aminoácido más abundante en el plasma y en el músculo esquelético. Función principal: recuperación muscular, salud intestinal (combustible preferido de los enterocitos), función inmune (sustrato para linfocitos), y reducción del dolor muscular post-esfuerzo intenso. Star garantiza alta pureza.'},
  {titulo: 'ENA Glutamina 300g en Pote', texto: 'Glutamina de ENA con el mismo principio activo. ENA tiene tradición y buen control de calidad. El pote es conveniente para almacenamiento y dosificación.'},
  {titulo: 'La realidad sobre la glutamina', texto: 'La evidencia científica sobre la glutamina para rendimiento deportivo en personas sanas es mixta. El cuerpo sintetiza glutamina endógenamente y la dieta proteica la provee en abundancia. Los beneficios más documentados son: salud intestinal (especialmente en períodos de estrés o entrenamiento muy intenso), recuperación inmune después de ejercicio prolongado de alta intensidad, y apoyo a la salud de la mucosa intestinal.'},
  {titulo: 'Recomendación', texto: 'La glutamina de Star y ENA son prácticamente idénticas en calidad. Elegí por precio. Si tenés presupuesto limitado, priorizá proteína completa sobre glutamina extra: el whey ya contiene glutamina en abundancia. La glutamina separada es más útil para: intestino permeable, períodos de entrenamiento muy intenso, o durante infecciones/enfermedad.'}
]);

COMPARACIONES['sn_lcarnitina|ena_lcarnitina'] = generarHTML([
  {titulo: 'L-Carnitina Star (60 cápsulas) vs ENA (60 cápsulas)', texto: 'L-Carnitina pura de dos marcas nacionales. Una comparación de formato y concentración.'},
  {titulo: 'Star Nutrition L-Carnitina 60 Caps', texto: 'L-Carnitina estándar en cápsulas. La carnitina es un aminoácido condicional que transporta ácidos grasos de cadena larga a través de la membrana mitocondrial interna para su oxidación. Es el "taxi" de las grasas hacia la mitocondria. Sin carnitina suficiente, las grasas no pueden entrar a la mitocondria para quemarse como energía.'},
  {titulo: 'ENA L-Carnitina 1500mg x60 Caps', texto: 'ENA ofrece L-Carnitina de mayor concentración por cápsula (1500mg). Mayor dosis por cápsula significa potencialmente mayor efecto o la posibilidad de tomar menos cápsulas. La alta dosis es relevante porque los estudios que muestran efectos positivos usaron 2-3g diarios.'},
  {titulo: 'La verdad sobre la L-Carnitina', texto: 'El cuerpo sano sintetiza suficiente carnitina endógenamente. Los estudios muestran beneficios modestos en oxidación de grasa, principalmente cuando: (1) los niveles de carnitina están depletados (vegetarianos, personas mayores, déficit renal), (2) se combina con ejercicio aeróbico, (3) se toman dosis de 2-3g diarios por períodos sostenidos. No es un "quema grasa" mágico.'},
  {titulo: 'Recomendación', texto: 'Para mayor efectividad buscar la dosis de 2-3g diarios. La ENA 1500mg tiene ventaja en concentración. Si la dosis de la Star es menor por cápsula, necesitarás más cápsulas para llegar a la dosis efectiva. Comparar el costo por gramo de carnitina activa.'}
]);

COMPARACIONES['gen_carnit|ena_lcarnitina'] = generarHTML([
  {titulo: 'Carnitina Líquida vs Carnitina en Cápsulas', texto: 'Una comparación sobre la forma de administración más que sobre la marca.'},
  {titulo: 'Carnitina Líquida (General Nutrition)', texto: 'La L-Carnitina en forma líquida tiene biodisponibilidad ligeramente mayor que las cápsulas, siendo absorbida más rápidamente. El inicio de acción es más rápido. Ideal para tomar 30-40 minutos antes del ejercicio aeróbico. El sabor suele ser agradable. Mayor concentración por toma en menos volumen.'},
  {titulo: 'ENA Carnitina en Cápsulas', texto: 'Las cápsulas tienen absorción más lenta pero sostenida. Son más convenientes para llevar, no requieren refrigeración y tienen vida útil más larga. La biodisponibilidad es ligeramente menor que la líquida pero la diferencia práctica en resultados es mínima.'},
  {titulo: 'Recomendación', texto: 'Para máxima conveniencia y vida útil: cápsulas. Para máxima absorción pre-ejercicio: líquida. La diferencia en resultados entre ambas formas es pequeña. Elegí por conveniencia y precio por gramo.'}
]);

// ── VITAMINAS Y SUPLEMENTOS ───────────────────────────

COMPARACIONES['sn_omega3|ge_omega3'] = generarHTML([
  {titulo: 'Star Omega 3 60 Caps vs Good Energy Omega 3 200 Caps', texto: 'La misma molécula esencial, diferente escala. Una comparación de costo-beneficio importante.'},
  {titulo: 'Star Nutrition Omega 3 60 Caps', texto: 'Omega 3 Fish Oil de Star. EPA y DHA de pescado de agua profunda. 60 cápsulas. Para uso inicial o si querés probar el producto. Star garantiza calidad y control en el proceso.'},
  {titulo: 'Good Energy Omega 3 1000mg 200 Caps', texto: '200 cápsulas del mismo principio activo. El Good Energy ofrece mayor volumen a menor precio por cápsula. Ideal para consumo regular de largo plazo (el omega 3 debe tomarse de forma continua para sus beneficios — mínimo 3 meses para ver cambios en perfil lipídico).'},
  {titulo: 'Dosis efectiva de Omega 3', texto: 'La dosis efectiva depende del objetivo: Bienestar general: 1g EPA+DHA diario. Reducción de triglicéridos: 2-4g diarios. Efecto antiinflamatorio articular: 3-4g diarios. Efecto antidepresivo: 1-2g de EPA diario. Asegurarse que el producto indique el contenido de EPA y DHA específicamente, no solo "aceite de pescado".'},
  {titulo: 'Recomendación', texto: 'Para consumo regular sostenido: Good Energy 200 caps por el costo por cápsula significativamente menor. Si es tu primera vez con omega 3 y querés probar tolerancia digestiva: 60 caps de cualquier marca. Una vez confirmada la buena tolerancia, pasá al formato mayor.'}
]);

COMPARACIONES['sn_zma|gn_zma'] = generarHTML([
  {titulo: 'ZMA Star 90 Caps vs ZMA Gold Nutrition 60 Caps', texto: 'ZMA es una fórmula patentada con Zinc, Magnesio y Vitamina B6. Una comparación entre los dos más vendidos.'},
  {titulo: 'ZMA: ¿Qué hace realmente?', texto: 'ZMA fue desarrollado originalmente para atletas con deficiencias de zinc y magnesio (muy comunes en personas que sudan mucho). Zinc: cofactor en la síntesis de testosterona y GH. Magnesio: regulación del sueño profundo (ondas delta), función muscular. Vitamina B6: síntesis de neurotransmisores y cofactor metabólico. Los estudios muestran mejora en la calidad del sueño profundo y potencial mejora en niveles de testosterona en personas con deficiencias previas.'},
  {titulo: 'Star ZMA 90 Caps', texto: 'Fórmula ZMA clásica de Star. 90 cápsulas es el formato estándar. Dosis típica: 3 cápsulas antes de dormir. Star usa las formas estándar de zinc y magnesio bien absorbibles.'},
  {titulo: 'Gold Nutrition ZMA 60 Caps', texto: 'Fórmula ZMA de GN. 60 cápsulas. Puede tener variaciones en las formas específicas de zinc y magnesio (aspartato, gluconato, citrato). Las formas de mayor biodisponibilidad son el zinc bisglicinato y el magnesio citrato o glicinato.'},
  {titulo: 'Recomendación', texto: 'Ambos cumplen la función del ZMA. Star tiene más cápsulas por envase (mejor precio por dosis). GN es igualmente confiable. Evaluar las formas de zinc y magnesio en la etiqueta: preferir citrato/bisglicinato/glicinato sobre óxido. Tomar siempre con el estómago vacío antes de dormir (el calcio interfiere con la absorción del zinc y el magnesio).'}
]);

COMPARACIONES['sn_citr60|lap_mag'] = generarHTML([
  {titulo: 'Citrato de Magnesio Star vs Bisglicinato de Magnesio Lapa — Formas de magnesio', texto: 'Esta comparación es sobre la forma química del magnesio, no solo la marca. Y hace una diferencia real.'},
  {titulo: 'Citrato de Magnesio (Star Nutrition)', texto: 'El magnesio citrato es una sal del magnesio con ácido cítrico. Biodisponibilidad media-alta (~25-30%). Es la forma más estudiada y probada. Tiene leve efecto laxante que puede ser positivo para personas con constipación o negativo para personas con digestión sensible. Es la forma más común y accesible en el mercado.'},
  {titulo: 'Bisglicinato de Magnesio (Lapa)', texto: 'El magnesio bisglicinato (quelado con glicina) tiene la mayor biodisponibilidad de todas las formas de magnesio (~35-40%). La glicina además tiene efectos sedantes y mejora la calidad del sueño de forma independiente. Prácticamente sin efecto laxante. Es la forma premium de magnesio, más cara pero más efectiva por miligramo absorbido.'},
  {titulo: 'Comparación por objetivo', texto: 'Para sueño y recuperación nocturna: Bisglicinato (la glicina suma al efecto). Para función muscular y calambres generales: ambos funcionan. Para constipación ocasional: Citrato (el efecto laxante leve es beneficioso). Para personas con intestino sensible: Bisglicinato por su gentileza digestiva.'},
  {titulo: 'Recomendación', texto: 'Si el objetivo principal es mejorar el sueño y la recuperación: Bisglicinato (la diferencia es notable). Si buscás una opción más económica y efectiva para función muscular general: Citrato. En términos de biodisponibilidad pura, el bisglicinato es superior.'}
]);

COMPARACIONES['lap_ashwa|sn_zma'] = generarHTML([
  {titulo: 'Ashwagandha + Vit C vs ZMA — Adaptógeno vs Minerales para la recuperación', texto: 'Dos enfoques muy distintos para apoyar la recuperación, el sueño y el rendimiento hormonal.'},
  {titulo: 'Ashwagandha con Vitamina C (Lapa)', texto: 'La ashwagandha (Withania somnifera) es un adaptógeno con las siguientes acciones documentadas: reducción del cortisol sérico (hormona del estrés catabólica), mejora de la resistencia al estrés, aumento de la testosterona y la fuerza muscular (meta-análisis muestran +10-15% de fuerza en 8 semanas), mejora de la calidad del sueño por efecto GABAérgico y reducción de la ansiedad. La vitamina C es antioxidante y cofactor en la síntesis de cortisol adrenal.'},
  {titulo: 'ZMA (Zinc, Magnesio, B6)', texto: 'Actúa principalmente a través de la corrección de deficiencias minerales. El zinc optimiza la síntesis de testosterona, el magnesio mejora el sueño profundo y la recuperación muscular, y la B6 actúa como cofactor en la síntesis de neurotransmisores.'},
  {titulo: 'Mecanismos diferentes, objetivos similares', texto: 'ZMA corrige deficiencias y optimiza la fisiología base. Ashwagandha actúa directamente sobre el eje HPA (hipotálamo-hipófisis-suprarrenal), reduciendo el cortisol y mejorando la respuesta adaptativa al estrés del entrenamiento.'},
  {titulo: 'Evidencia científica', texto: 'Ashwagandha tiene fuerte evidencia para reducción de cortisol, mejora del sueño y aumento de testosterona. ZMA tiene evidencia principalmente en personas con deficiencias de zinc y magnesio (atletas que sudan mucho). Si ya tenés niveles adecuados de zinc y magnesio, el ZMA tendrá menor efecto que la ashwagandha.'},
  {titulo: 'Recomendación', texto: 'Para estrés crónico, cortisol alto y querer mejorar la testosterona de forma más directa: Ashwagandha es superior. Para optimizar el sueño profundo y la recuperación muscular básica: ZMA. Para máximos resultados: pueden combinarse (son mecanismos complementarios).'}
]);

// ── DIFERENTES CATEGORÍAS ─────────────────────────────

COMPARACIONES['sn_whey_dp|sn_creat_pote'] = generarHTML([
  {titulo: 'Proteína Whey + Creatina — El stack fundamental', texto: 'Estos no son competidores — son los dos suplementos más importantes del fitness y se complementan perfectamente. Si solo pudieras elegir 2 suplementos, la ciencia dice que serían exactamente estos.'},
  {titulo: 'Proteína Whey — El constructor', texto: 'La proteína de suero provee los aminoácidos (especialmente leucina) que activan el mTORC1, la vía principal de síntesis proteica muscular. Sin suficiente proteína, el entrenamiento rompe el músculo pero el cuerpo no tiene los materiales para reconstruirlo y hacerlo más grande. Es el suplemento #1 en respaldo científico para hipertrofia muscular.'},
  {titulo: 'Creatina — El potenciador de rendimiento', texto: 'La creatina monohidrato es el suplemento más estudiado en la historia de la nutrición deportiva con más de 1000 estudios. Aumenta los fosfocreatos intramusculares que regeneran el ATP durante ejercicio de alta intensidad. Resultado: más repeticiones, más peso, mayor volumen de entrenamiento. Y más volumen = más estímulo = más músculo. También tiene efectos directos sobre la síntesis proteica.'},
  {titulo: 'Sinergia documentada', texto: 'Múltiples estudios combinando proteína + creatina muestran mayor ganancia de masa muscular que cada uno por separado. La creatina te permite entrenar más intenso, la proteína te da los materiales para construir el tejido generado por ese entrenamiento más intenso.'},
  {titulo: 'Protocolo recomendado', texto: 'Creatina: 3-5g diarios todos los días (con o sin entrenamiento), cualquier momento del día. La consistencia diaria importa más que el timing. Proteína: 25-30g post-entrenamiento como mínimo, cubriendo un total de 1.6-2.2g/kg de peso corporal por día incluyendo la dieta.'},
  {titulo: 'Recomendación', texto: 'Si solo pudieras comprar uno: proteína (más impacto en principiantes). Si ya consumís proteína adecuada en la dieta: agregá creatina como prioridad. Ambos juntos: el dúo insuperable para cualquier persona que quiera resultados músculares reales.'}
]);

COMPARACIONES['sn_tnt|sn_whey_dp'] = generarHTML([
  {titulo: 'Pre-entreno vs Proteína — ¿Cuál es más importante?', texto: 'Una pregunta frecuente de quienes tienen presupuesto limitado y deben elegir. La respuesta tiene base científica clara.'},
  {titulo: 'Proteína Whey — La base fundamental', texto: 'La proteína es el material de construcción del músculo. Sin suficiente proteína, no hay crecimiento muscular posible independientemente de qué tan bien entrenes. Es el suplemento con mayor respaldo científico para la hipertrofia.'},
  {titulo: 'Pre-entreno TNT — El potenciador', texto: 'El pre-entreno mejora la calidad del entrenamiento: más energía, más fuerza percibida, mejor enfoque, mayor tolerancia al dolor muscular. Pero potencia lo que ya existe — si el entrenamiento básico y la nutrición no están bien, el pre-entreno no construye músculo por sí solo.'},
  {titulo: 'Jerarquía de suplementos para crecimiento muscular', texto: '1° Dieta con suficiente proteína y calorías. 2° Proteína en polvo si la dieta no alcanza los requerimientos. 3° Creatina. 4° Pre-entreno. El pre-entreno es el 4° escalón: útil, pero construís sobre una base sólida de los primeros tres.'},
  {titulo: 'Recomendación', texto: 'Con presupuesto limitado, siempre elegí proteína sobre pre-entreno. La proteína tiene impacto directo en el resultado (músculo). El pre-entreno mejora la experiencia del entrenamiento pero sin la base nutricional correcta, su efecto es limitado. Cuando ya cubrís tu proteína diaria con dieta + suplemento, el pre-entreno se convierte en la adición con mayor impacto percibido.'}
]);

COMPARACIONES['sn_thermo|sn_lcarnitina'] = generarHTML([
  {titulo: 'Termogénico vs L-Carnitina para perder grasa — Mecanismos distintos', texto: 'Dos suplementos con el objetivo común de ayudar a quemar grasa, pero con mecanismos completamente diferentes.'},
  {titulo: 'Thermo Fuel Max — Termogénico estimulante', texto: 'Actúa principalmente aumentando el metabolismo basal (termogénesis), reduciendo el apetito y movilizando ácidos grasos desde el tejido adiposo. La cafeína eleva el AMPc y activa la lipasa hormono-sensible que libera grasa de los adipocitos. Efecto más rápido y perceptible (sentís que funciona). La tolerancia se desarrolla con el tiempo.'},
  {titulo: 'L-Carnitina — Transportador de grasas', texto: 'La L-carnitina actúa en el paso posterior: una vez que los ácidos grasos están movilizados, la carnitina los transporta dentro de la mitocondria para ser quemados. Sin carnitina suficiente, los ácidos grasos no pueden entrar a la mitocondria. Efecto más sutil, acumulativo, sin estimulación del SNC.'},
  {titulo: 'Complementariedad', texto: 'Son complementarios, no competidores. El termogénico moviliza la grasa desde el tejido adiposo. La carnitina asegura que esa grasa llegue a la mitocondria para quemarse. Muchos termogénicos incluyen carnitina en su fórmula justamente por esta sinergia.'},
  {titulo: 'Para quién es cada uno', texto: 'Termogénico: personas sanas sin condiciones cardíacas que toleran bien la cafeína y buscan un efecto más pronunciado y rápido. L-Carnitina: personas sensibles a los estimulantes, hipertensas, con arritmias, o como complemento suave a la dieta y ejercicio.'},
  {titulo: 'Recomendación', texto: 'Para mayor efecto en pérdida de grasa: Termogénico (más potente). Para un enfoque más suave y sostenible: Carnitina. Para máximos resultados seguros: combinar ambos (la carnitina complementa sin sumar estimulantes). Recordar: ninguno reemplaza el déficit calórico y el ejercicio.'}
]);

COMPARACIONES['sn_col_sport|sn_creat_pote'] = generarHTML([
  {titulo: 'Colágeno vs Creatina — Para articulaciones vs Para músculo', texto: 'Dos suplementos con funciones completamente distintas. Esta comparación es clave para entender para qué sirve cada uno.'},
  {titulo: 'Collagen Sport — Protege la estructura', texto: 'El colágeno hidrolizado es el sustrato para regenerar y mantener el tejido conectivo: cartílagos, tendones, ligamentos, huesos y piel. El entrenamiento intenso genera microtraumas en estas estructuras. El colágeno aporta los aminoácidos específicos (glicina, prolina, hidroxiprolina) que el cuerpo usa para repararlos. Previene lesiones y mejora la recuperación articular a largo plazo.'},
  {titulo: 'Creatina — Potencia el rendimiento', texto: 'La creatina actúa en la fase energética del ejercicio: aumenta el ATP disponible para contracciones musculares de alta intensidad. Genera más fuerza, más repeticiones, más volumen de entrenamiento. También tiene evidencia de aumento de masa muscular directa.'},
  {titulo: 'Son complementarios — No compiten', texto: 'La creatina te ayuda a entrenar más intenso. El colágeno protege las articulaciones que soportan ese entrenamiento más intenso. Para alguien que levanta pesas regularmente, los dos juntos es el stack para rendir más y mantenerse sano por más tiempo.'},
  {titulo: 'Prioridad según objetivo', texto: 'Si el objetivo principal es GANAR MÚSCULO y FUERZA: creatina primero. Si hay dolor articular, lesiones recurrentes o entrenás con alta frecuencia con peso: colágeno primero. Para alguien sin historial de lesiones que empieza: creatina tiene mayor impacto inicial. Para alguien de 35+ o con años de entrenamiento intenso: colágeno es igual o más importante.'}
]);

// ═══════════════════════════════════════════════════════
//  COMPARACIONES POR CATEGORÍA (cuando no hay par exacto)
// ═══════════════════════════════════════════════════════


var INFO_CATEGORIAS = {
  proteina: '<strong>Las proteinas en polvo</strong> proveen aminoacidos esenciales para la sintesis y recuperacion muscular. Son el suplemento mas respaldado cientificamente para hipertrofia. La dosis efectiva es de 25-40g por porcion, buscando un total de 1.6-2.2g/kg de peso corporal por dia. <br><br><strong>Tipos que vas a encontrar:</strong> Concentrado (WPC) — economico, tiene lactosa, 70-80% proteina. Aislado (WPI) — microfiltrado, sin lactosa, 90%+ proteina, absorcion mas rapida. Blend — mezcla de ambos. Proteina vegetal — apta para veganos e intolerantes a la lactosa.',

  creatina: '<strong>La creatina monohidrato</strong> es el suplemento mas estudiado de la historia de la nutricion deportiva con mas de 500 estudios clinicos. Funciona aumentando los fosfocreatos intramusculares para regenerar ATP durante el ejercicio explosivo e intenso. Resultados comprobados: +5-15% en fuerza, +1-3kg de masa muscular en los primeros meses, mejor recuperacion entre series. <br><br><strong>Clave:</strong> Todas las creatinas monohidrato son quimicamente identicas. No hay diferencia entre marcas en terminos de molecula — la diferencia esta en la pureza (micronizacion) y el precio. No requiere fase de carga. Dosis: 3-5g diarios siempre, aunque no entrenes.',

  preworkout: '<strong>Los pre-entrenos</strong> combinan multiples ingredientes activos para mejorar el rendimiento. Los ingredientes clave son: Cafeina (200-300mg) — aumenta el foco y reduce la percepcion del esfuerzo. Citrulina malato (6-8g) — aumenta el oxido nitrico para mayor congestion y resistencia muscular. Beta-alanina (3-6g) — aumenta la carnosina muscular, retrasando la fatiga. <br><br><strong>Dos grandes tipos:</strong> Con estimulantes (cafeina alta) — mas energia, mas agresivos, no tomar despues de las 3pm. Sin estimulantes (solo vasodilatadores) — mejor congestion sin efecto en el sueno, apto nocturno.',

  aminoacido: '<strong>Los aminoacidos</strong> son los bloques constructores de las proteinas. La jerarquia de completitud es: EAAs (9 aminoacidos esenciales) > BCAAs (3 ramificados: leucina, isoleucina, valina) > aminoacidos individuales. <br><br>Los BCAAs son utiles principalmente si no consumes suficiente proteina total en el dia. Si ya tomas suficiente proteina (1.8-2.2g/kg), los BCAAs agregan poco. La leucina es el aminoacido mas anabolico — activa directamente mTOR, el interruptor del crecimiento muscular.',

  quemador: '<strong>Los quemadores y termogenicos</strong> aceleran el metabolismo basal (3-7% adicional), reducen el apetito y aumentan la oxidacion de grasas. Su efecto es real pero modesto: sin deficit calorico no queman grasa sola. <br><br><strong>Mecanismos:</strong> Cafeina y estimulantes — elevan el metabolismo y la movilizacion de grasa. L-Carnitina — transporta acidos grasos a la mitocondria (mayor efecto con ejercicio aerobico). CLA — modula el metabolismo lipidico. Extractos vegetales (te verde, yerba mate) — sinergia con cafeina.',

  gainer: '<strong>Los gainers</strong> son hipercaloricos disenados para personas con dificultad para ganar peso (hardgainers o ectomorfos). Combinan proteina con grandes cantidades de carbohidratos. Una porcion aporta entre 500-1200 kcal. <br><br><strong>Para quien son:</strong> Personas con metabolismo muy acelerado que no pueden comer suficiente, personas muy delgadas en etapa de volumen intenso. <strong>Para quien NO son:</strong> Personas con sobrepeso, resistencia a la insulina, diabetes o tendencia a ganar grasa facilmente.',

  colageno: '<strong>El colageno hidrolizado</strong> provee los aminoacidos especificos (glicina, prolina, hidroxiprolina) que estimulan la sintesis de colageno endogeno en cartílagos, tendones, ligamentos, piel y huesos. Los resultados son acumulativos — minimo 3 meses de consumo sostenido para notar diferencia en articulaciones. <br><br><strong>Tipos:</strong> Tipo I y III (piel, tendones, huesos) — mas comun. Tipo II (cartilago articular) — especifico para rodillas y cadera. Siempre tomar con vitamina C que es cofactor indispensable para la sintesis de colageno.',

  magnesio: '<strong>Magnesio y Omega 3</strong> son dos pilares fundamentales para deportistas y salud general. <br><br><strong>Magnesio:</strong> Interviene en mas de 300 reacciones enzimaticas: contraccion muscular, sintesis de proteinas, funcion nerviosa y calidad del sueno. El <strong>bisglicinato</strong> tiene la mayor biodisponibilidad y es suave con el estomago. El <strong>citrato</strong> tiene buena absorcion y ayuda con calambres. Dosis recomendada: 200-400mg/dia. <br><br><strong>Omega 3 (EPA/DHA):</strong> Acidos grasos esenciales con potente efecto antiinflamatorio, mejoran la salud cardiovascular, cerebral y articular. Reducen el dolor muscular post-ejercicio y mejoran la recuperacion. Dosis: 1-3g de EPA+DHA por dia con comida.',

  vitamin: '<strong>Las vitaminas y minerales</strong> son la base que permite que todos los demas suplementos funcionen. Los mas importantes para deportistas: Zinc + B6 (ZMA) — produccion natural de testosterona, recuperacion nocturna. Vitamina C — antioxidante, sintesis de colageno, inmunidad. Multivitaminicos — cubren microdeficiencias en dietas restrictivas.',

  hidratacion: '<strong>Los suplementos de hidratacion</strong> reemplazan electrolitos (sodio, potasio, magnesio) perdidos en el sudor y proveen carbohidratos para mantener el rendimiento. Son fundamentales en sesiones de mas de 60 minutos, en condiciones de calor o para deportes de resistencia.',

  barra: '<strong>Las barras proteicas</strong> son opciones convenientes de proteina para consumir fuera de casa. Evaluar siempre la relacion proteina/azucar: buscar al menos 15g de proteina y menos de 10g de azucar por barra.',

  accesorio: '<strong>Los accesorios de entrenamiento</strong> mejoran la seguridad, el agarre y la experiencia del entrenamiento.'
};

var CONSEJOS_CAT = {
  proteina: function(prods) {
    var html = '<h4>Como elegir entre estas proteinas</h4>';
    var vegetal = prods.filter(function(p){ return p.name.toLowerCase().indexOf('vegetal')>=0||p.name.toLowerCase().indexOf('pea')>=0||p.brand==='Nucleo Fit'||p.brand==='Protein Project'; });
    var blend = prods.filter(function(p){ return p.name.toLowerCase().indexOf('blend')>=0||p.name.toLowerCase().indexOf('truemade')>=0; });
    var isol = prods.filter(function(p){ return p.name.toLowerCase().indexOf('iso')>=0||p.name.toLowerCase().indexOf('platinum')>=0||p.name.toLowerCase().indexOf('isolate')>=0; });
    if (vegetal.length) html += '<p><span class="comp-tag-ok">VEGANOS / SIN LACTOSA</span> ' + vegetal.map(function(p){return '<strong>'+p.name+'</strong>';}).join(', ') + ': proteina de origen vegetal (arveja, arroz). Sin lactosa, sin gluten, apta para intolerantes. Perfil de aminoacidos completo aunque levemente inferior al whey en absorcion.</p>';
    if (isol.length) html += '<p><span class="comp-tag-ok">MAYOR PUREZA</span> ' + isol.map(function(p){return '<strong>'+p.name+'</strong>';}).join(', ') + ': proceso de aislamiento ultrafiltrado, 90%+ proteina, minima lactosa. Mayor precio pero maxima calidad proteica y absorcion mas rapida.</p>';
    if (blend.length) html += '<p><span class="comp-tag-ok">MEJOR RELACION CALIDAD/PRECIO</span> ' + blend.map(function(p){return '<strong>'+p.name+'</strong>';}).join(', ') + ': mezcla de concentrado e isolado. Buen perfil de aminoacidos a precio intermedio. Tiene algo de lactosa — probar tolerancia si sos sensible.</p>';
    html += '<p><strong>Regla de oro:</strong> La mejor proteina es la que tomas todos los dias. Prioriza la que mejor toleres digestivamente y te ajuste al presupuesto. El sabor importa — si no te gusta, no la vas a tomar.</p>';
    return html;
  },
  creatina: function(prods) {
    return '<h4>La verdad sobre comparar creatinas</h4><p>Todas las creatinas monohidrato que ves aqui son quimicamente la misma molecula. La diferencia entre marcas es principalmente la <strong>micronizacion</strong> (granulo mas fino = mejor disolucion) y el precio. No existe evidencia solida de que otras formas de creatina (HCl, etil ester, bufferada) sean superiores al monohidrato. <br><br><strong>Lo que SI importa comparar:</strong> Precio por gramo, envase (pote vs doypack), si viene saborizada o neutra. <br><br><strong>La ON (Optimum Nutrition)</strong> es la marca de referencia mundial con el estandar mas alto de pureza. Las marcas argentinas (Star, ENA, IDN) ofrecen excelente calidad a menor precio.</p>';
  },
  preworkout: function(prods) {
    var sinestim = prods.filter(function(p){ return p.name.toLowerCase().indexOf('pump')>=0||p.id==='sn_pumpv8'; });
    var conestim = prods.filter(function(p){ return p.name.toLowerCase().indexOf('tnt')>=0||p.name.toLowerCase().indexOf('dynamite')>=0||p.id==='sn_tnt'; });
    var html = '<h4>Como elegir el pre-entreno correcto</h4>';
    if (sinestim.length && conestim.length) {
      html += '<p><strong>Con estimulantes vs Sin estimulantes:</strong> Si entrenais de manana o temprano, el pre-entrenamiento con cafeina (TNT Dynamite y similares) te va a dar mas energia y foco. Si entrenais de noche o sos sensible a la cafeina, el pre-entrenamiento vasodilatador sin estimulantes (Pump V8 y similares) te da la congestion y el rendimiento sin afectar el sueno.</p>';
    }
    html += '<p><strong>El orden de importancia de los ingredientes:</strong> 1) Citrulina malato (+6g) para la congestion. 2) Cafeina (150-250mg) para el foco. 3) Beta-alanina para la resistencia. Los que pican en la piel con beta-alanina es completamente normal (parestesia) — no es danino.</p>';
    return html;
  },
  quemador: function(prods) {
    var mujer = prods.filter(function(p){ return p.brand==='Woman'||p.name.toLowerCase().indexOf('fat burner')>=0||p.name.toLowerCase().indexOf('mujer')>=0; });
    var html = '<h4>Como comparar quemadores</h4>';
    if (mujer.length) html += '<p><span class="comp-tag-ok">FEMENINO</span> ' + mujer.map(function(p){return '<strong>'+p.name+'</strong>';}).join(', ') + ': formulado especificamente para metabolismo femenino con extractos hormonalmente beneficiosos como el CLA y la L-Carnitina. Estimulacion mas suave.</p>';
    html += '<p><strong>Lo que mas importa al comparar termogenicos:</strong> Cantidad de cafeina total (si ya tomas cafe o pre-entrenamiento, sumarlo), ingredientes activos por capsula, numero de porciones reales por envase. Revisar siempre el etiquetado nutricional antes que el marketing.</p>';
    html += '<p><strong>La verdad:</strong> Sin deficit calorico y ejercicio, ningun quemador va a eliminar grasa. Son potenciadores de un proceso que tiene que ocurrir en la dieta y el entrenamiento.</p>';
    return html;
  },
  colageno: function(prods) {
    var sport = prods.filter(function(p){ return p.name.toLowerCase().indexOf('sport')>=0; });
    var plus = prods.filter(function(p){ return p.name.toLowerCase().indexOf('plus')>=0; });
    var html = '<h4>Las diferencias entre tipos de colageno</h4>';
    if (sport.length) html += '<p><span class="comp-tag-ok">DEPORTIVO</span> ' + sport.map(function(p){return '<strong>'+p.name+'</strong>';}).join(', ') + ': contiene colageno base + Magnesio y Fosforo. El Magnesio mejora la contraccion muscular y reduce calambres. Ideal para deportistas con alta carga de entrenamiento.</p>';
    if (plus.length) html += '<p><span class="comp-tag-ok">COMPLETO</span> ' + plus.map(function(p){return '<strong>'+p.name+'</strong>';}).join(', ') + ': contiene colageno + Vitamina C ya incluida + otros activos. La vitamina C es cofactor indispensable para la sintesis de colageno endogeno. Conveniente si no queres tomar vitamina C por separado.</p>';
    html += '<p><strong>Para articulaciones:</strong> Cualquier colageno hidrolizado tomado con vitamina C funciona. <strong>Para piel y cabello:</strong> Colágeno tipo I y III. <strong>Para cartilago:</strong> Buscar colageno tipo II especifico. Los resultados son acumulativos — minimo 3 meses para notar diferencia.</p>';
    return html;
  },
  gainer: function(prods) {
    return '<h4>Como elegir entre gainers</h4><p>Los gainers se diferencian principalmente por la <strong>ratio proteina/carbohidratos</strong> y el total de calorias por porcion. Un gainer con 30g proteina y 60g carbos es mas "limpio" (mejor ratio) que uno con 20g proteina y 100g carbos. <br><br><strong>Para ganar masa de calidad:</strong> Buscar al menos 25g de proteina por porcion. <strong>Para un volumen agresivo:</strong> El total de calorias importa mas. <br><br>El secreto de los gainers es beberlos ADEMAS de comer bien — no reemplazar comidas, sino agregar calorias encima de la dieta normal.</p>';
  },
  aminoacido: function(prods) {
    var bcaa = prods.filter(function(p){ return p.name.toLowerCase().indexOf('bcaa')>=0; });
    var eaa = prods.filter(function(p){ return p.name.toLowerCase().indexOf('eaa')>=0; });
    var carn = prods.filter(function(p){ return p.name.toLowerCase().indexOf('carnitina')>=0||p.name.toLowerCase().indexOf('carnitine')>=0; });
    var glut = prods.filter(function(p){ return p.name.toLowerCase().indexOf('glutamina')>=0||p.name.toLowerCase().indexOf('glutamine')>=0; });
    var html = '<h4>Aminoacidos: entendiendo cada uno</h4>';
    if (bcaa.length && eaa.length) {
      html += '<p><strong>BCAA vs EAA:</strong> Los EAAs (aminoacidos esenciales) son superiores a los BCAAs porque contienen los 9 esenciales, incluyendo los 3 BCAAs. Si tenes que elegir entre ambos, los EAAs dan mas valor. Los BCAAs son util si ya tomas suficiente proteina y solo queres los 3 ramificados especificamente.</p>';
    }
    if (carn.length) html += '<p><strong>L-Carnitina:</strong> No es un estimulante — es un transportador de acidos grasos a la mitocondria. Su efecto en la quema de grasa es real pero requiere ejercicio aerobico para activarse. Mejor tomada 30-60 minutos antes del cardio.</p>';
    if (glut.length) html += '<p><strong>L-Glutamina:</strong> El aminoacido mas abundante en el musculo. Util para recuperacion y permeabilidad intestinal. Mayor beneficio en personas que entrenan muy seguido o con alto volumen (puede reducir el dolor muscular tardio).</p>';
    return html;
  },
  hidratacion: function(prods) {
    return '<h4>Hidratacion: cuando usar cada opcion</h4><p>Para sesiones cortas (menos de 60 min): agua sola es suficiente. Para sesiones largas (60-120 min): bebida isotonica con electrolitos. Para entrenamiento de resistencia (+2hs) o condiciones de calor extremo: bebida isotonica + carbohidratos. <br><br>La <strong>maltodextrina/fructosa</strong> es para energia rapida (pre o durante). Los <strong>recovery drinks</strong> son para post-entreno con proteina + carbohidratos.</p>';
  },
  magnesio: function(prods) {
    var bisg = prods.filter(function(p){ var n=p.name.toLowerCase(); return n.indexOf('bisglicinato')>=0||n.indexOf('bisglycinate')>=0; });
    var citr = prods.filter(function(p){ var n=p.name.toLowerCase(); return n.indexOf('citrato')>=0; });
    var omega = prods.filter(function(p){ return p.name.toLowerCase().indexOf('omega')>=0; });
    var html = '<h4>Como elegir Magnesio y Omega 3</h4>';
    if (bisg.length) html += '<p><span class="comp-tag-ok">MEJOR ABSORCION</span> ' + bisg.map(function(p){return '<strong>'+p.name+'</strong>';}).join(', ') + ': El bisglicinato de magnesio tiene la mayor biodisponibilidad — se absorbe mejor y no genera molestias digestivas. Ideal para descanso, calambres y recuperacion muscular. Tomar de noche.</p>';
    if (citr.length) html += '<p><span class="comp-tag-ok">CLASICO EFICAZ</span> ' + citr.map(function(p){return '<strong>'+p.name+'</strong>';}).join(', ') + ': El citrato de magnesio tiene muy buena absorcion y es mas economico que el bisglicinato. Excelente para calambres y funcion muscular general.</p>';
    if (omega.length) html += '<p><span class="comp-tag-ok">SALUD INTEGRAL</span> ' + omega.map(function(p){return '<strong>'+p.name+'</strong>';}).join(', ') + ': Comparar siempre la cantidad de EPA+DHA por capsula (no el total de aceite). Buscar al menos 300mg de EPA+DHA por capsula. Tomar con comida para mejor absorcion.</p>';
    html += '<p><strong>Combo ideal:</strong> Magnesio de noche (mejora el sueno) + Omega 3 con el almuerzo (antiinflamatorio). Juntos cubren las dos deficiencias mas comunes en deportistas.</p>';
    return html;
  },
  vitamin: function(prods) {
    var zma = prods.filter(function(p){ return p.name.toLowerCase().indexOf('zma')>=0; });
    var html = '<h4>Guia de vitaminas y minerales</h4>';
    if (zma.length) html += '<p><strong>ZMA:</strong> Zinc + Magnesio + B6 — formulacion clasica para potenciar la recuperacion nocturna y los niveles de testosterona natural. Tomar antes de dormir con el estomago vacio.</p>';
    html += '<p>Los multivitaminicos cubren microdeficiencias comunes en dietas restrictivas. Las vitaminas individuales son utiles cuando se identifica una carencia especifica.</p>';
    return html;
  },
  barra: function(prods) {
    return '<h4>Como elegir una barra proteica</h4><p>Lo que hay que mirar en el etiquetado: <strong>Proteina por barra</strong> (buscar 15g+), <strong>azucar total</strong> (menos de 10g), <strong>calorias totales</strong> (150-250 kcal es el rango ideal para snack). Evitar barras con mas azucar que proteina — son basicamente golosinas con marketing fitness.</p>';
  }
};

var COMPLEMENTOS = {
  'proteina|creatina': 'Son el duo clasico por excelencia. La proteina provee los aminoacidos para construir musculo y la creatina provee la energia para entrenar mas fuerte y estimular mas la sintesis proteica. Se potencian mutuamente — si tenes que elegir dos suplementos para empezar, estos son los dos.',
  'proteina|preworkout': 'Se usan en momentos distintos: el pre-entreno antes del entrenamiento para rendir mas, la proteina despues para recuperarse mejor. Son completamente complementarios — no compiten entre si.',
  'proteina|colageno': 'La proteina whey apunta al musculo (aminoacidos ramificados), el colageno apunta a tejidos conectivos (tendones, cartílagos, piel). Para una recuperacion completa, especialmente en personas que entrenan seguido o tienen mas de 35 anos, el duo es muy recomendable.',
  'creatina|preworkout': 'Muchos pre-entrenos ya contienen creatina en su formula. Verificar el etiquetado del pre-entrenamiento para no duplicar la dosis. Si el pre-entreno no trae creatina (o trae menos de 3g), agregar creatina por separado es correcto.',
  'creatina|aminoacido': 'La creatina y los aminoacidos (BCAAs/EAAs) operan en mecanismos distintos y son completamente complementarios. La creatina para la energia y la fuerza; los aminoacidos para la sintesis proteica y la recuperacion.',
  'proteina|aminoacido': 'Si ya tomas una cantidad adecuada de proteina (1.8-2.2g/kg/dia), los BCAAs o EAAs adicionales agregan poco. Sin embargo, si tomas la proteina lejos de los entrenamientos, los aminoacidos en el peri-entreno (antes/durante) pueden ser utiles.',
  'proteina|quemador': 'En etapa de definicion o perdida de grasa, el duo proteina + termogenico es el mas usado. La proteina preserva la masa muscular durante el deficit calorico (efecto anticatabolico) mientras el termogenico acelera la movilizacion de grasa.',
  'quemador|aminoacido': 'En entrenamiento en ayunas o dietas muy restrictivas, los aminoacidos (especialmente BCAAs) protegen el musculo del catabolismo mientras el quemador trabaja. Buen combo para definicion extrema.',
  'colageno|vitamin': 'La vitamina C es el cofactor indispensable para que el colageno funcione. Si el colageno que estas tomando no tiene vitamina C ya incluida, agregar vitamina C es fundamental para maximizar la sintesis de colageno endogeno.',
  'preworkout|aminoacido': 'Muchos pre-entrenos ya contienen BCAAs o EAAs. Verificar el etiquetado para no duplicar. Si el pre-entreno no los incluye, tomar aminoacidos durante el entrenamiento (intra-workout) junto al pre-entreno es un stack popular.',
  'gainer|proteina': 'Un gainer ya contiene proteina en su composicion. Si ademas tomas proteina separada, asegurarte de contar el total de proteina del dia para no excederte (maximo util: ~2.5g/kg/dia). El gainer es para las calorias extra; la proteina extra para completar el objetivo proteico si el gainer no alcanza.',
  'quemador|preworkout': 'Ojo con esta combinacion: ambos suelen contener cafeina. Sumar los miligramos de cafeina de ambos para no exceder los 400mg diarios recomendados. En personas sensibles, puede generar taquicardia, ansiedad o problemas para dormir.',
  'colageno|aminoacido': 'El colageno y los aminoacidos/BCAAs son complementarios sin superposicion. El colageno aporta glicina, prolina e hidroxiprolina (no ramificados) que no estan en los BCAAs. Pueden tomarse juntos sin problema.',
  'vitamin|preworkout': 'Las vitaminas y minerales son la base de salud que hace que el pre-entrenamiento funcione mejor. El magnesio especificamente mejora la respuesta al entrenamiento y la recuperacion.',
  'creatina|colageno': 'No compiten entre si y son complementarios. La creatina para el rendimiento muscular; el colageno para proteger las estructuras articulares que soportan el entrenamiento intenso. Stack muy recomendado para personas que entrenan fuerza regularmente.',
  'magnesio|creatina': 'Combo excelente. El magnesio mejora la contraccion muscular, la recuperacion y el descanso nocturno. La creatina mejora la fuerza y el rendimiento. Juntos potencian tanto el entrenamiento como la recuperacion. El magnesio de noche, la creatina a cualquier hora.',
  'magnesio|proteina': 'El magnesio participa directamente en la sintesis de proteinas — sin magnesio suficiente, la proteina no se aprovecha al maximo. Ademas el magnesio mejora la calidad del sueno, que es cuando mas se recupera el musculo. Magnesio de noche + proteina post-entrenamiento.',
  'magnesio|colageno': 'Duo ideal para salud articular y recuperacion. El colageno repara tejidos conectivos y el magnesio reduce la inflamacion y los calambres. Muy recomendado para mayores de 30 anos o deportistas con desgaste articular.',
  'magnesio|preworkout': 'El magnesio mejora la funcion neuromuscular y puede potenciar el efecto del pre-entreno. Ojo: no tomarlos juntos — el magnesio puede relajar y el pre-entreno estimula. Pre-entreno antes de entrenar, magnesio de noche.',
};

var COMPARACIONES_PARES = {
  'sn_plat_2lb|sn_whey_dp': '<h3>Whey Doypack vs Platinum Pote — Concentrado vs Blend</h3><p>El Doypack es el concentrado de suero puro (WPC). El Platinum es un blend que combina concentrado + aislado microfiltrado.</p><h4>Whey Protein Doypack 2 Lb</h4><p><strong>Tipo:</strong> Concentrado de suero (WPC) — proceso de filtración estándar.</p><p><strong>Proteína:</strong> 24g por porción de 35g (~68% proteína por peso).</p><p><strong>Lactosa:</strong> ~3-4g por porción. Puede generar molestias en intolerantes.</p><p><strong>Aminoácidos:</strong> Leucina ~2.5g, BCAAs totales ~5.5g por porción.</p><p><strong>Aditivos:</strong> Sucralosa (edulcorante), saborizantes naturales y artificiales.</p><p><span class="comp-tag-ok">VENTAJA</span> Mejor precio por gramo del catálogo. Sabores muy bien logrados.</p><p><span class="comp-tag-cuidado">LIMITACIÓN</span> Mayor contenido de lactosa. Menos puro que el Platinum.</p><h4>Platinum Whey Protein 2 Lb Pote</h4><p><strong>Tipo:</strong> Blend Concentrado + Aislado microfiltrado (WPC + WPI).</p><p><strong>Proteína:</strong> 25g por porción de 35g (~71% proteína por peso).</p><p><strong>Lactosa:</strong> ~1-2g por porción — menor gracias a la fracción aislada.</p><p><strong>Aminoácidos:</strong> Leucina ~2.7g, BCAAs totales ~6g — mejor perfil que el concentrado puro.</p><p><strong>Proceso:</strong> La microfiltración del aislado elimina más grasa y lactosa que el concentrado estándar.</p><p><strong>Aditivos:</strong> Sucralosa, lecitina de soja (emulsionante), saborizantes.</p><p><span class="comp-tag-ok">VENTAJA</span> Mejor pureza, menor lactosa, mejor perfil aminoacídico. Pote hermético de mejor conservación.</p><h4>¿Cuál elegir?</h4><p><strong>Presupuesto ajustado / buena tolerancia a la lactosa:</strong> Doypack — es más que suficiente para el 90% de las personas.</p><p><strong>Sensibilidad digestiva / busca mayor calidad:</strong> Platinum — menor lactosa y mejor perfil proteico por porción.</p>',

  'ena_truemade|sn_whey_dp': '<h3>Star Whey Doypack vs ENA TrueMade — Los dos más populares del mercado argentino</h3><h4>Whey Protein Doypack (Star Nutrition)</h4><p><strong>Tipo:</strong> Concentrado de suero (WPC).</p><p><strong>Proteína:</strong> 24g por porción.</p><p><strong>Lactosa:</strong> ~3-4g por porción — puede generar molestias en sensibles.</p><p><strong>Filtrado:</strong> Filtración estándar.</p><p><strong>Aminoácidos:</strong> Leucina ~2.5g, BCAAs ~5.5g por porción.</p><p><span class="comp-tag-ok">VENTAJA</span> Precio más accesible. Mayor variedad de sabores. Mayor distribución.</p><h4>Whey Protein TrueMade (ENA)</h4><p><strong>Tipo:</strong> Blend Concentrado + Aislado con proceso TrueMade.</p><p><strong>Proteína:</strong> 26g por porción de 38g — levemente mayor concentración.</p><p><strong>Lactosa:</strong> Baja por la fracción aislada incluida.</p><p><strong>Filtrado:</strong> Proceso TrueMade — mayor transparencia en fracciones proteicas declaradas.</p><p><strong>Aminoácidos:</strong> Leucina ~2.8g, BCAAs ~6.2g. Perfil más completo.</p><p><strong>Aditivos:</strong> Sin colorantes artificiales. Formulación más limpia.</p><p><span class="comp-tag-ok">VENTAJA</span> Mayor proteína por porción, menor lactosa, etiquetado más transparente. Referente en calidad en el mercado nacional.</p><h4>¿Cuál elegir?</h4><p><strong>Precio como factor principal:</strong> Star Doypack — funciona muy bien para el objetivo.</p><p><strong>Quiere la mejor calidad nacional con transparencia:</strong> ENA TrueMade — mejor por porción y menor lactosa.</p><p>Ninguna es mala elección. La diferencia en resultados prácticos entre ambas para alguien que entrena 3-4 veces por semana es mínima.</p>',

  'ena_truemade|sn_plat_2lb': '<h3>Star Platinum Whey vs ENA TrueMade — Nivel Premium Nacional</h3><p>Los dos referentes del segmento premium en proteinas nacionales.</p><h4>Star Platinum Whey</h4><p>Blend de concentrado + aislado microfiltrado. La bandera de calidad de Star Nutrition. Mayor fraccion de aislado que el Doypack, mejor digestibilidad, menor lactosa. Formato pote de alta calidad.</p><h4>ENA TrueMade</h4><p>ENA enfatiza la transparencia en ingredientes. El TrueMade tiene un proceso de elaboracion cuidado y publica informacion clara sobre sus fracciones proteicas. Muy buena digestibilidad y sabores bien logrados.</p><h4>Diferencia clave</h4><p>En este nivel ambas son proteinas de muy alta calidad. La decision puede venir por: sabor preferido (probar ambas si es posible), precio en el momento, o fidelidad a la marca. Star tiene mayor variedad de sabores; ENA tiene una reputacion muy solida en la industria argentina por transparencia y calidad de formulacion.</p>',

  'gn_isogold|sn_plat_2lb': '<h3>Gold Nutrition Iso Gold vs Star Platinum — Aislado vs Blend</h3><p>Comparacion entre un aislado puro y un blend premium.</p><h4>Gold Nutrition Iso Gold (Aislado)</h4><p><strong>Que es:</strong> Proteina de suero aislada pura (WPI). Proceso de intercambio ionico o ultrafiltracion que elimina practicamente toda la lactosa (<1g por porcion) y la grasa. 90%+ de proteina por porcion. Absorcion mas rapida. <strong>Para quien:</strong> Intolerantes a la lactosa, personas en definicion que cuidan cada caloría, atletas que buscan la mayor pureza posible, personas con sistema digestivo sensible.</p><h4>Star Platinum Whey (Blend)</h4><p><strong>Que es:</strong> Mezcla de concentrado + aislado. Buena calidad proteica pero con algo mas de lactosa y calorias que el aislado puro. <strong>Para quien:</strong> La gran mayoria de personas que entrena — ofrece excelente calidad sin el sobreprecio del aislado puro.</p><h4>Recomendacion directa</h4><p>Si toleras bien la lactosa y estas en volumen (ganando masa): Star Platinum es suficiente y mas economico. Si sos intolerante a la lactosa, estas en definicion o queres la maxima pureza posible: el Iso Gold vale la diferencia de precio.</p>',

  'gn_vegetal|nfit_vegprot': '<h3>Gold Nutrition Vegetal Protein vs Nucleo Fit Proteina Vegetal — Veganas</h3><p>Las dos opciones vegetales del catálogo — ideales para veganos e intolerantes.</p><h4>Gold Nutrition Vegetal Protein Isolate</h4><p>Aislado de proteina vegetal. Marca con gran trayectoria. El proceso de aislamiento eleva la concentracion proteica y mejora la digestibilidad. 100% libre de lactosa y gluten.</p><h4>Nucleo Fit Proteina Vegetal Isolate</h4><p>Proteina vegetal aislada en version chocolate. Marca mas nueva pero con formulacion cuidada. Opcion interesante para diversificar.</p><h4>Por que elegir proteina vegetal</h4><p>No solo para veganos — tambien es la mejor opcion para: intolerantes a la lactosa, celiacos (verificar certificacion), personas con sensibilidad a las proteinas de leche de vaca, o cualquiera que quiera variar su fuente proteica. El perfil de aminoacidos de la proteina de arveja es muy completo y muy cercano al del whey en terminos de efecto anabolico real.</p>',

  'on_creat|sn_creat_pote': '<h3>Star Nutrition Creatina vs ON Creatine Powder — Nacional vs Internacional</h3><p>La duda clasica: marca nacional premium vs referente mundial.</p><h4>ON Creatine Powder (Optimum Nutrition)</h4><p><strong>Por que es el referente:</strong> Optimum Nutrition usa creatina Creapure (la marca mas pura del mundo, fabricada en Alemania con certificacion 99.9% monohidrato puro). Ha sido testeada independientemente en miles de estudios. El estandar de oro de la industria. <strong>Realidad:</strong> En terminos de efecto fisiologico, la diferencia con creatinas de calidad es minima para el usuario promedio.</p><h4>Star Nutrition Creatina</h4><p><strong>Por que es excelente:</strong> Star es la marca mas vendida de Argentina con los estandares de calidad mas altos del mercado nacional. Su creatina es monohidrato micronizado de alta pureza. A menor precio que la ON. <strong>Para quien:</strong> Cualquier persona que busca los beneficios de la creatina a precio accesible.</p><h4>Recomendacion directa</h4><p>Para el 99% de las personas que entrenan recreativamente, la creatina de Star Nutrition va a dar exactamente los mismos resultados que la ON. La ON tiene valor para atletas de competicion que necesitan el maximo estandar de pureza certificada. Si el precio no es factor, ON. Si queres el mejor precio-calidad del mercado argentino, Star.</p>',

  'sn_creat_doy|sn_creat_pote': '<h3>Star Creatina Pote vs Doypack — Mismo producto, diferente envase</h3><p>La creatina es identica — la diferencia esta 100% en el envase y el precio por gramo.</p><h4>Pote</h4><p>Envase rigido hermetico. Mejor para conservacion a largo plazo. Mas facil de dosificar con cuchara o scoop. Ideal si compras el formato grande (500g o 1kg).</p><h4>Doypack</h4><p>Bolsa resellable. Mas economico en el formato 300g. Ocupa menos espacio. Algunas personas prefieren el formato saborizados (Frutos Rojos) que viene en doypack.</p><h4>Conclusion simple</h4><p>Si buscas el mejor precio por gramo: pote 500g o 1kg. Si quieres portabilidad o probar saborizados: doypack. El producto interno es identico.</p>',

  'sn_creat_1kg|sn_creat_500': '<h3>Creatina 500g vs 1kg — La logica del volumen</h3><p>Misma creatina, diferente cantidad. La decision es puramente economica.</p><p>La creatina 1kg te da para aproximadamente 200 dias a 5g diarios. La de 500g para 100 dias. El precio por gramo del 1kg siempre es mas conveniente. <br><br><strong>Cuando elegir 1kg:</strong> Si ya sabes que usas creatina regularmente y quieres el mejor precio por gramo — el 1kg es la compra inteligente. <strong>Cuando elegir 500g:</strong> Si es tu primera vez con creatina y quieres probarla antes de comprometerte con mas cantidad.</p>',

  'sn_pumpv8|sn_tnt': '<h3>TNT Dynamite vs Pump V8 — La decisión más importante en pre-entrenos</h3><p>Representan dos filosofías opuestas del pre-entrenamiento. No es mejor uno que el otro — depende de cuándo y cómo entrenás.</p><h4>TNT Dynamite 240g — El explosivo con estimulantes</h4><p><strong>Cafeína:</strong> ~250mg por porción — dosis alta que genera energía notoria y foco intenso.</p><p><strong>Citrulina malato:</strong> ~4g — vasodilatación moderada.</p><p><strong>Beta-alanina:</strong> ~2.5g — aumenta carnosina muscular. CAUSA PICAZÓN en piel: es normal y pasajera, señal de que funciona.</p><p><strong>Arginina:</strong> Incluida para apoyo vasodilatador.</p><p><strong>L-Tirosina:</strong> Precursor de dopamina — mejora el foco mental.</p><p><strong>Efecto:</strong> Energía intensa en 20-30 minutos, foco mental, mayor intensidad percibida en el entrenamiento.</p><p><span class="comp-tag-cuidado">NO USAR</span> Después de las 3pm. Hipertensos, arritmias, sensibilidad a cafeína.</p><p><span class="comp-tag-ok">IDEAL</span> Entrenamientos matutinos o mediodía donde necesitás máxima energía.</p><h4>Pump V8 285g — El vasodilatador sin estimulantes</h4><p><strong>Cafeína:</strong> Sin cafeína (o mínima) — no altera el sueño.</p><p><strong>Citrulina malato:</strong> ~6-8g — dosis máxima efectiva para congestión muscular real.</p><p><strong>Agmatina:</strong> Potencia el óxido nítrico de forma más duradera que la arginina.</p><p><strong>Glicerol:</strong> Retención hídrica intracelular = mayor volumen muscular visible durante el entreno.</p><p><strong>8 ingredientes vasodilatadores</strong> en dosis clínicamente relevantes.</p><p><strong>Efecto:</strong> La mayor congestión (pump) muscular del mercado, sin el pico de energía artificial.</p><p><span class="comp-tag-ok">IDEAL</span> Entrenamientos nocturnos, sensibles a cafeína, días de alto volumen donde priorizás la congestión.</p><h4>Estrategia avanzada</h4><p>Muchos usuarios avanzados usan <strong>Pump V8 siempre</strong> (por la congestión) y agregan <strong>TNT solo en sesiones matutinas</strong> cuando necesitan el boost de cafeína. Combinados cubren todos los escenarios.</p>',

  'gn_prework|sn_tnt': '<h3>TNT Dynamite (Star) vs Pre Work Gold (Gold Nutrition)</h3><p>Dos pre-entrenos de marcas nacionales premium.</p><h4>TNT Dynamite</h4><p>El pre-entrenamiento mas conocido de Star Nutrition. Formula explosiva, sabores muy logrados (especialmente Acai y Limón). Alta cafeina, bien tolerado por la mayoria.</p><h4>Pre Work Gold</h4><p>Gold Nutrition es una marca con muy buena reputacion en formulacion. Su pre-entreno tiene un perfil equilibrado entre estimulacion y vasodilatacion. Puede ser una opcion interesante para quienes encuentran el TNT muy agresivo.</p><h4>Como decidir</h4><p>Si es tu primer pre-entreno: TNT Dynamite tiene mayor historial de uso y mas opiniones disponibles. Si buscas algo un poco menos estimulante con igual performance: Pre Work Gold. Ambas son marcas confiables del mercado argentino.</p>',

  'sn_col210|sn_col_sport': '<h3>Colágeno Hidrolizado 210g vs Collagen Sport 360g</h3><p>Ambos son colágenos tipo I y III de Star Nutrition, pero con una diferencia clave en su composición adicional.</p><h4>Collageno Hidrolizado 210g — El básico puro</h4><p><strong>Composición:</strong> Colágeno hidrolizado tipo I y III puro. 10g de péptidos de colágeno por porción.</p><p><strong>Vitamina C:</strong> <span style="color:#FF6B6B">NO incluida.</span> Deberías tomarla aparte — sin vitamina C la síntesis de colágeno endógeno es subóptima. 50-100mg de vitamina C junto con la toma maximiza el efecto.</p><p><strong>Minerales extra:</strong> Ninguno adicional.</p><p><strong>Peso molecular:</strong> Péptidos de bajo peso molecular — alta biodisponibilidad y absorción rápida.</p><p><span class="comp-tag-ok">IDEAL PARA</span> Quienes ya toman vitamina C por separado o quieren el colágeno más económico. Articulaciones, piel, tendones y huesos.</p><h4>Collagen Sport Naranja 360g — El deportivo con Magnesio</h4><p><strong>Composición:</strong> Colágeno hidrolizado tipo I y III + Magnesio (~150mg/porción) + Fósforo.</p><p><strong>Vitamina C:</strong> <span style="color:#FF6B6B">NO incluida.</span> También necesitás tomarla aparte para maximizar la síntesis.</p><p><strong>El diferencial clave — Magnesio:</strong> El Magnesio es cofactor en más de 300 reacciones enzimáticas. En deportistas reduce calambres musculares, mejora la contracción y relajación muscular, y mejora el sueño de recuperación. Es el mineral más deficitario en personas que entrenan.</p><p><strong>Fósforo:</strong> Interviene en la mineralización ósea junto con el calcio.</p><p><span class="comp-tag-ok">IDEAL PARA</span> Deportistas con alta carga de entrenamiento, personas que sufren calambres frecuentes, o quienes no toman magnesio por separado. Dos suplementos en uno.</p><h4>¿Cuál elegir?</h4><p><strong>Si ya tomás magnesio aparte:</strong> El Collageno 210g es suficiente y más económico por gramo de colágeno.</p><p><strong>Si no tomás magnesio:</strong> El Collagen Sport te cubre colágeno + magnesio en una sola toma — más conveniente y puede resultar más económico que comprar ambos por separado.</p><p><strong>En ambos casos:</strong> Acompañar siempre con vitamina C (50-100mg) para maximizar la síntesis de colágeno endógeno.</p>',

  'sn_col_plus|sn_col_sport': '<h3>Collagen Sport vs Collagen Plus — Los dos premium de Star Nutrition</h3><p>Ambos son superiores al colágeno básico pero con enriquecimientos distintos orientados a diferentes necesidades.</p><h4>Collagen Sport Naranja 360g</h4><p><strong>Composición:</strong> Colágeno hidrolizado tipo I y III + <strong>Magnesio (~150mg)</strong> + Fósforo por porción.</p><p><strong>Vitamina C:</strong> <span style="color:#FF6B6B">NO incluida.</span></p><p><strong>El Magnesio como diferencial:</strong> Bloquea la entrada de calcio excesivo en las células musculares (relajación muscular), reduce calambres post-ejercicio, mejora el sueño profundo y la recuperación nocturna. El 70% de los deportistas tiene déficit de magnesio.</p><p><span class="comp-tag-ok">IDEAL PARA</span> Deportistas con calambres frecuentes, personas con sueño irregular, alta carga de entrenamiento.</p><h4>Collagen Plus Limón 360g</h4><p><strong>Composición:</strong> Colágeno hidrolizado tipo I y III + <strong>Vitamina C incluida (60-100mg)</strong> + activos complementarios.</p><p><strong>Vitamina C como diferencial:</strong> La vitamina C es cofactor INDISPENSABLE para la enzima prolil hidroxilasa, que estabiliza la triple hélice del colágeno. Sin vitamina C, el colágeno sintetizado es estructuralmente débil. Tenerla ya incluida asegura que la síntesis sea siempre óptima sin necesitar suplemento extra.</p><p><span class="comp-tag-ok">IDEAL PARA</span> Quienes quieren el combo completo colágeno+vitamina C sin tomar dos productos. Enfocado en piel, articulaciones y recuperación de tejidos.</p><h4>Decisión práctica</h4><p><strong>¿Tenés calambres o dormís mal?</strong> → Collagen Sport (te da el magnesio que necesitás).</p><p><strong>¿No tomás vitamina C por separado?</strong> → Collagen Plus (ya la incluye, maximizás la síntesis sin esfuerzo extra).</p><p><strong>Avanzado:</strong> Algunos usuarios combinan ambos o alternan según la época del año (más Collagen Sport en temporada de mayor entrenamiento, más Collagen Plus en cuidado de piel).</p>',

  'ena_ultramass|sn_mutant': '<h3>MutantMass (Star) vs Ultra Mass (ENA) — Los dos gigantes del volumen</h3><p>Los gainers mas populares del mercado argentino, cara a cara.</p><h4>MutantMass Star Nutrition</h4><p><strong>Historia:</strong> MutantMass es una formula con anos de historia, originalmente canadiense y adaptada por Star para Argentina. Alta densidad calorica, buen perfil proteico. La variedad de sabores es amplia y muy bien lograda. <strong>Carbohidratos:</strong> Mix de fuentes de distinta velocidad de absorcion para un aporte sostenido.</p><h4>Ultra Mass ENA</h4><p><strong>Formulacion:</strong> ENA mantiene estandares muy altos de calidad en todos sus productos. El Ultra Mass tiene una relacion proteina/carbohidratos bien equilibrada. Transparencia en etiquetado — caracteristica sello ENA.</p><h4>Como elegir entre ambos</h4><p>Las dos son excelentes opciones para volumen. La decision final puede ser por: sabor preferido (el Chocolate y Cookies de MutantMass son muy populares), precio en el momento, o preferencia de marca. Para un hardgainer serio que quiere ganar peso rapidamente, ambas funcionan — lo que mas importa es tomarlas consistentemente con la dieta.</p>',

  'sn_thermo|wo_fatburner': '<h3>Thermo Fuel Max (Star) vs Fat Burner Woman — Unisex vs Femenino</h3><p>Dos enfoques diferentes al mismo objetivo: quemar grasa.</p><h4>Thermo Fuel Max — Star Nutrition</h4><p><strong>Para quien:</strong> Hombres y mujeres con buena tolerancia a los estimulantes. Formula mas agresiva con cafeina, yerba mate, CLA y L-Tirosina. Maximo efecto termogenico. <strong>Efecto esperado:</strong> Aumento notable del metabolismo, reduccion del apetito, mayor energia para entrenar. <strong>Precaucion:</strong> No tomar de noche, no combinar con otros estimulantes, no recomendado para personas con problemas cardiovasculares o hipertension.</p><h4>Fat Burner Woman — Woman</h4><p><strong>Para quien:</strong> Disenado especificamente para el metabolismo femenino. Estimulacion mas suave. Incluye ingredientes que abordan aspectos hormonales del metabolismo femenino (CLA, L-Carnitina). Mejor tolerado durante la menstruacion y en periodos de mayor sensibilidad hormonal. <strong>Efecto esperado:</strong> Mas suave que el Thermo Max pero con menos efectos secundarios.</p><h4>Recomendacion directa</h4><p>Mujer con buena tolerancia a estimulantes y que busca el maximo efecto: Thermo Fuel. Mujer que prefiere algo mas suave o que ha tenido efectos secundarios con otros termogenicos: Fat Burner Woman. Hombres: Thermo Fuel Max directamente.</p>',

  'sn_eaas|sn_mtor': '<h3>BCAA MTOR vs EAAs — La diferencia técnica que importa</h3><h4>MTOR BCAA 270g (3 aminoácidos)</h4><p><strong>Composición:</strong> Solo 3 aminoácidos ramificados en proporción 2:1:1.</p><p><strong>Leucina:</strong> 5g por porción — el más anabólico, activa directamente mTOR (switch del crecimiento muscular).</p><p><strong>Isoleucina:</strong> 2.5g — mejora la captación de glucosa muscular.</p><p><strong>Valina:</strong> 2.5g — energía muscular y recuperación.</p><p><strong>Total:</strong> 10g de BCAAs, pero solo 3 de los 9 aminoácidos esenciales.</p><p><strong>Limitación clave:</strong> Para sintetizar proteína muscular completa, el cuerpo necesita los 9 esenciales. Con solo 3, la síntesis proteica no puede completarse aunque haya leucina suficiente para activar mTOR.</p><p><span class="comp-tag-ok">ÚTIL CUANDO</span> Entrenás en ayunas, hacés cardio largo, o como suplemento anti-catabolismo puntual.</p><h4>EAAs Aminoácidos (9 aminoácidos esenciales)</h4><p><strong>Composición:</strong> Los 9 aminoácidos esenciales que el cuerpo NO puede sintetizar.</p><p><strong>Incluye:</strong> Los 3 BCAAs (Leucina, Isoleucina, Valina) + Lisina + Metionina + Fenilalanina + Treonina + Triptofano + Histidina.</p><p><strong>Por qué son superiores:</strong> Con los 9 esenciales el cuerpo tiene TODO lo que necesita para síntesis proteica muscular completa. No falta ningún eslabón en la cadena.</p><p><strong>Triptofano:</strong> Precursor de serotonina — mejora el estado de ánimo durante el entreno.</p><p><span class="comp-tag-ok">SUPERIORES PARA</span> Síntesis proteica, recuperación muscular completa, estado anabólico sostenido. Son biológicamente más completos que los BCAAs.</p><h4>Conclusión directa</h4><p>Si tenés que elegir uno: <strong>EAAs</strong>. Son superiores porque cubren los 9 esenciales. Los BCAAs tienen valor específico para entrenamiento en ayunas o como anti-catabolismo rápido, pero si ya consumís proteína suficiente en el día, los BCAAs agregan poco.</p>',

  'gen_carnit|sn_lcarnitina': '<h3>L-Carnitina Caps (Star) vs Carnitina Liquida (Gentech)</h3><p>Misma molecula, diferente forma de presentacion.</p><h4>L-Carnitina en Capsulas — Star Nutrition</h4><p><strong>Ventajas:</strong> Conveniente, facil de dosificar, sin sabor, larga vida util. <strong>Absorcion:</strong> Algo mas lenta que la liquida pero efectiva. <strong>Para quien:</strong> Personas que prefieren simplicidad y conveniencia.</p><h4>Carnitina Liquida 500ml — Gentech</h4><p><strong>Ventajas:</strong> Absorcion mas rapida al ser liquida (no necesita digerirse el excipiente de la capsula). Mayor flexibilidad en la dosis. <strong>Para quien:</strong> Personas que buscan rapida absorcion pre-cardio o que prefieren la forma liquida.</p><h4>Recomendacion</h4><p>La diferencia de absorcion entre liquida y capsulas es real pero modesta en el resultado final. Ambas funcionan bien tomadas 30-60 minutos antes del ejercicio aerobico. La eleccion es principalmente de preferencia personal y precio.</p>',

  'ge_omega3|sn_omega3': '<h3>Omega 3 Star 60 caps vs Good Energy 200 caps — Formato corto vs largo</h3><p>Como comparar omega 3: lo que importa NO es la cantidad de capsulas sino la concentracion de EPA+DHA por capsula.</p><h4>Omega 3 Star Nutrition 60 Caps</h4><p>60 capsulas = 2 meses a 1 capsula/dia. Verificar en el etiquetado la cantidad de EPA+DHA por capsula (no solo el total de aceite de pescado).</p><h4>Omega 3 Good Energy 200 Caps</h4><p>200 capsulas = formato economico de larga duracion. Excelente relacion precio por capsula. Para quien quiere 4-6 meses de supply en una compra.</p><h4>Como comparar omega 3 correctamente</h4><p>El numero de capsulas no dice nada sin saber la concentracion. Un omega 3 de 60 capsulas con 600mg EPA+DHA por capsula es mejor que uno de 200 capsulas con 200mg EPA+DHA. <strong>Buscar siempre:</strong> al menos 300mg de EPA+DHA por capsula. <strong>Dosis efectiva:</strong> 1-3g de EPA+DHA diarios dependiendo del objetivo.</p>',

  'sn_citr60|sn_zma': '<h3>ZMA vs Citrato de Magnesio — Mismo mineral, distinto objetivo</h3><h4>ZMA 90 caps (Zinc + Magnesio + B6)</h4><p><strong>Zinc:</strong> 30mg — cofactor indispensable en la síntesis de testosterona. El 45% de los deportistas tiene déficit de zinc.</p><p><strong>Magnesio:</strong> 450mg (como óxido de magnesio) — función muscular y sueño.</p><p><strong>Vitamina B6:</strong> 10.5mg — potencia la absorción de zinc y magnesio. Cofactor en síntesis de serotonina y dopamina.</p><p><strong>Mecanismo hormonal:</strong> El zinc y el magnesio juntos optimizan la producción nocturna de testosterona y GH (hormona de crecimiento). El pico de ambas hormonas es durante el sueño profundo.</p><p><strong>Tomar:</strong> 30-60 minutos antes de dormir, con el estómago relativamente vacío para maximizar absorción.</p><p><span class="comp-tag-ok">IDEAL PARA</span> Hombres deportistas que quieren optimizar niveles naturales de testosterona, mejorar la recuperación nocturna y la calidad del sueño profundo.</p><h4>Citrato de Magnesio 60 caps</h4><p><strong>Magnesio:</strong> ~200-300mg como citrato — la forma más biodisponible de magnesio (absorción 30% mayor que el óxido del ZMA).</p><p><strong>Solo magnesio:</strong> Sin zinc ni B6 — más simple y dirigido.</p><p><strong>Mecanismo:</strong> El magnesio actúa como antagonista natural del calcio en las células musculares, permitiendo la relajación muscular completa. Bloquea receptores NMDA del glutamato (reduce excitación neuronal = mejor sueño).</p><p><span class="comp-tag-ok">IDEAL PARA</span> Cualquier persona con calambres, sueño irregular, o que entrena frecuentemente. También excelente para mujeres y hombres que no buscan optimizar testosterona específicamente.</p><h4>¿Cuál elegir?</h4><p><strong>Hombre deportista que quiere testosterona + sueño + recuperación:</strong> ZMA.</p><p><strong>Mujer, hombre sin objetivo hormonal específico, o quien principalmente quiere eliminar calambres y mejorar el sueño:</strong> Citrato de Magnesio — además tiene mejor biodisponibilidad del magnesio.</p><p><strong>Nota:</strong> El Citrato de Magnesio 500g en polvo es mucho más económico para uso diario prolongado.</p>',

  'nmax_hmax600|sn_hydroplus': '<h3>Hydroplus Endurance (Star) vs Hydromax (Nutremax) — Isotonicos</h3><p>Comparacion de bebidas isotonicas para rendimiento en resistencia.</p><h4>Hydroplus Endurance — Star Nutrition 700g</h4><p>Formula isotonica con electrolitos (sodio, potasio, magnesio), carbohidratos de rapida absorcion y vitaminas del complejo B. Disenado especificamente para actividades de resistencia prolongadas. La etiqueta "Endurance" indica que esta pensado para sesiones largas.</p><h4>Hydromax — Nutremax 600g</h4><p>Bebida isotonica de alta calidad de Nutremax. Electrolitos completos con buen perfil de carbohidratos para mantener el rendimiento. Disponible en formato 600g y 1320g para mayor economia.</p><h4>Como usarlos</h4><p>Ambos son muy similares en funcion. La diferencia puede estar en la concentracion de electrolitos y el sabor. Para sesiones de mas de 60 minutos o en condiciones de calor: cualquiera de los dos es una excelente opcion. El formato 1320g de Hydromax es mas economico por gramo si lo usas frecuentemente.</p>',

};
;






function formatearAnalisis(texto) {
  var html = texto;
  // Titulos ### 
  var lines = html.split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('### ') === 0) {
      lines[i] = '<h4>' + lines[i].slice(4) + '</h4>';
    }
  }
  html = lines.join('\n');
  // Negritas **texto**
  html = html.replace(/\*\*([^*]+)\*\*/g, function(m, t){ return '<strong>' + t + '</strong>'; });
  // Párrafos
  html = html.split('\n\n').join('</p><p>');
  html = html.split('\n').join('<br>');
  return '<p>' + html + '</p>';
}

// ══════════════════════════════════════════════════════════
//  FILTROS DESPLEGABLES (reemplazan carrusel de marcas)
// ══════════════════════════════════════════════════════════
// poblarFiltroBrands() ya está definido arriba junto con onBrandFilter/onTipoFilter

// ══════════════════════════════════════════════════════════
//  FILTRO DE PRECIO
// ══════════════════════════════════════════════════════════
let precioMax = 999999;
function filtrarPrecio(val) {
  precioMax = parseInt(val);
  const label = document.getElementById('precioVal');
  if (label) label.textContent = precioMax >= 200000 ? 'Sin límite' : `$${precioMax.toLocaleString('es-AR')}`;
  applyFilters();
  setTimeout(aplicarFiltroPrecio, 50);
  syncURLIndex();
}

// ══════════════════════════════════════════════════════════
//  STOCK URGENTE — badge en cards
// ══════════════════════════════════════════════════════════
// Se maneja dentro de buildCard con el stock count

// ══════════════════════════════════════════════════════════
//  HACER CARDS CLICKEABLES → abrir modal
// ══════════════════════════════════════════════════════════
function makeCardsClickable() {
  document.querySelectorAll('.prod-card').forEach(card => {
    const pid = card.dataset.id; // uses data-id not data-pid
    if (!pid) return;
    const img = card.querySelector('.prod-img-wrap');
    const nombre = card.querySelector('.prod-name');
    [img, nombre].forEach(el => {
      if (!el) return;
      el.style.cursor = 'pointer';
      // Remove old listener by cloning
      const newEl = el.cloneNode(true);
      el.parentNode.replaceChild(newEl, el);
      newEl.addEventListener('click', (e) => {
        e.stopPropagation();
        openProdModal(pid);
      });
    });
  });
}

// ── Precio filter aplicado después de cada render ──
function aplicarFiltroPrecio() {
  if (precioMax >= 200000) return;
  document.querySelectorAll('.prod-card').forEach(card => {
    const pid = card.dataset.id;
    if (!pid) return;
    const p = getProduct(pid);
    if (p && p.price > precioMax) card.style.display = 'none';
  });
}

// ══════════════════════════════════════════════════════════
//  INIT — llamar todo después de que carguen los productos
// ══════════════════════════════════════════════════════════
// Llamada inicial garantizada
window.addEventListener('load', function() {
  if (typeof PRODUCTS !== 'undefined' && PRODUCTS.length > 0) {
    renderAll();
    readURLIndex();
    applyFilters();
    if(typeof precioMax!=='undefined'&&precioMax<200000)setTimeout(aplicarFiltroPrecio,50);
  }
});


// ── Mostrar/ocultar botón scroll top ──
function updateScrollBtn() {
  var btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  var scrolled = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  if (scrolled > 200) {
    btn.classList.add('visible');
  } else {
    btn.classList.remove('visible');
  }
}
window.addEventListener('scroll', updateScrollBtn, {passive:true});
setInterval(updateScrollBtn, 800);


// ══════════════════════════════════════════════════════════
// MOSTRAR ANÁLISIS - SISTEMA SIMPLE POR NOMBRE
// ══════════════════════════════════════════════════════════
function mostrarAnalisis(prods) {
  var iaDiv = document.getElementById('compIA');
  var iaContent = document.getElementById('compIAContent');
  if (!iaDiv || !iaContent) return;
  iaDiv.style.display = 'block';

  var html = '';

  // Info general de la categoría
  var cat = prods[0] ? prods[0].cat : '';
  if (ANALISIS_CAT && ANALISIS_CAT[cat]) {
    html += '<div style="background:rgba(0,200,255,.05);border-left:3px solid var(--cyan);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px">';
    html += '<p style="color:#aaa;font-size:.85rem;margin:0;line-height:1.7">' + ANALISIS_CAT[cat] + '</p>';
    html += '</div>';
  }

  // Análisis de cada producto
  html += '<h3 style="font-family:Bebas Neue,sans-serif;font-size:1.1rem;letter-spacing:.08em;color:var(--cyan);margin-bottom:16px">FICHA TÉCNICA DE CADA PRODUCTO</h3>';

  prods.forEach(function(prod) {
    // Buscar en DB_ANALISIS por nombre (la forma más robusta)
    var tec = null;

    // 1. Buscar por ID exacto
    if (DB_ANALISIS[prod.id]) {
      tec = DB_ANALISIS[prod.id];
    } else {
      // 2. Buscar por similitud de nombre
      var nombre = (prod.name || '').toLowerCase()
        .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
        .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n')
        .replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

      var mejorScore = 0;
      Object.keys(DB_ANALISIS).forEach(function(key) {
        // Buscar el nombre del producto estático con ese key
        var sp = null;
        for (var i = 0; i < PRODUCTS_ESTATICO.length; i++) {
          if (PRODUCTS_ESTATICO[i].id === key) { sp = PRODUCTS_ESTATICO[i]; break; }
        }
        if (!sp) return;
        var spNombre = (sp.name || '').toLowerCase()
          .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
          .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n')
          .replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

        var palabras = nombre.split(' ').filter(function(w){ return w.length > 2; });
        if (palabras.length === 0) return;
        var hits = 0;
        palabras.forEach(function(w){ if (spNombre.indexOf(w) >= 0) hits++; });
        var score = hits / palabras.length;
        if (score > mejorScore && score >= 0.4) {
          mejorScore = score;
          tec = DB_ANALISIS[key];
        }
      });
    }

    // Renderizar ficha del producto
    html += '<div style="border:1px solid rgba(0,200,255,.2);border-radius:10px;padding:16px;margin-bottom:16px;background:rgba(0,200,255,.02)">';
    html += '<div style="font-family:Bebas Neue,sans-serif;font-size:1rem;letter-spacing:.06em;color:#fff;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.08)">';
    html += prod.name + ' <span style="color:#888;font-size:.75rem;font-weight:normal;font-family:sans-serif">— ' + prod.brand + '</span></div>';

    if (tec) {
      var filas = [
        ['tipo',         '🏷 Tipo'],
        ['proteina',     '💪 Proteína/porción'],
        ['colageno',     '🦴 Colágeno/porción'],
        ['carbs',        '🍞 Carbohidratos'],
        ['grasas',       '🫐 Grasas'],
        ['calorias',     '🔥 Calorías/porción'],
        ['lactosa',      '🥛 Lactosa'],
        ['aminoacidos',  '🧬 Aminoácidos clave'],
        ['leucina',      '⚡ Leucina'],
        ['total',        '⚡ Total BCAAs'],
        ['composicion',  '📋 Composición'],
        ['filtrado',     '🔬 Proceso de fabricación'],
        ['absorcion',    '⏱ Velocidad de absorción'],
        ['pureza',       '✨ Pureza'],
        ['certificacion','🏅 Certificación'],
        ['cafeina',      '☕ Cafeína'],
        ['citrulina',    '💊 Citrulina Malato'],
        ['beta_alanina', '💊 Beta-Alanina'],
        ['agmatina',     '💊 Agmatina'],
        ['glicerol',     '💊 Glicerol'],
        ['otros',        '➕ Otros activos'],
        ['vitc',         '🍊 Vitamina C'],
        ['minerales',    '⚗️ Minerales'],
        ['magnesio',     '🧲 Magnesio'],
        ['zinc',         '🔩 Zinc'],
        ['b6',           '💊 Vitamina B6'],
        ['epa_dha',      '🐟 EPA + DHA'],
        ['fuente_prot',  '📦 Fuente proteica'],
        ['dosis',        '⚖️ Dosis efectiva'],
        ['mecanismo',    '🔬 Cómo funciona'],
        ['efectos',      '⚡ Efectos'],
        ['aditivos',     '🧪 Aditivos'],
        ['cuando',       '⏰ Cuándo tomarlo'],
        ['advertencia',  '⚠️ Importante'],
        ['nota',         '📌 Nota'],
        ['limitacion',   '⚠️ Limitación'],
        ['evitar',       '🚫 Evitar si'],
        ['ideal',        '✅ Ideal para'],
        ['ventaja',      '⭐ Ventaja clave'],
      ];
      filas.forEach(function(par) {
        var campo = par[0], label = par[1];
        if (!tec[campo]) return;
        var isWarning = campo === 'evitar' || campo === 'limitacion' || campo === 'advertencia';
        var isGood = campo === 'ideal' || campo === 'ventaja';
        var color = isWarning ? '#FF9900' : isGood ? '#00FF88' : '#ccc';
        html += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:.85rem;line-height:1.6">';
        html += '<span style="color:#888;min-width:160px;flex-shrink:0">' + label + '</span>';
        html += '<span style="color:' + color + '">' + tec[campo] + '</span>';
        html += '</div>';
      });
    } else {
      html += '<p style="color:#888;font-size:.85rem">Producto de alta calidad de ' + prod.brand + '.</p>';
    }

    html += '</div>'; // cierre ficha
  });

  iaContent.innerHTML = html;
}


// INDUMENTARIA
var INDUM_PRODS = [{"nombre":"Short Con Lineas Blancas Suplex","color":"AZUL MARINO","precio":15000,"precio_lista":15900,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Catsuit Largo Liso Con Lineas Nue - M","color":"NEGRO","precio":23000,"precio_lista":24380,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Calza con faja L","color":"LILA","precio":18000,"precio_lista":19080,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza rasgada 2XL-3XL","color":"ROSADO","precio":17000,"precio_lista":18020,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Short Batik S-M","color":"FUCSIA","precio":9000,"precio_lista":9540,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Batik en V, S-M","color":"VERDE LIMA","precio":11000,"precio_lista":11660,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Batik en V, L-XL","color":"TURQUESA","precio":11000,"precio_lista":11660,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Calza Prelavada Total Black con cierre  S-M","color":"NEGRO","precio":18000,"precio_lista":19080,"stock":2,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Prelavada Total Black con cierre  L-XL","color":"NEGRO","precio":18000,"precio_lista":19080,"stock":2,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Short Batik L-XL","color":"AZUL","precio":9000,"precio_lista":9540,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Liso M","color":"FUCSIA","precio":7000,"precio_lista":7420,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Liso XL","color":"MORADO","precio":7000,"precio_lista":7420,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Calza Larga Degrade con Red - S","color":"ROSADO - LILA","precio":17000,"precio_lista":18020,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Larga Degrade con Red - M","color":"NARANJA - AMARILLO","precio":17000,"precio_lista":18020,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza degrade S-M","color":"MORADO/CELESTE","precio":22000,"precio_lista":23320,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Batik detalle en ambas piernas S-M","color":"MARRON CLARO","precio":17000,"precio_lista":18020,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Batik detalle en ambas piernas L-XL","color":"MORADO","precio":17000,"precio_lista":18020,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Batik detalle a una pierna S-M","color":"VERDE MANZANA","precio":17000,"precio_lista":18020,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Batik detalle a una pierna L-XL","color":"FUCSIA","precio":17000,"precio_lista":18020,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Short ruche frontal S-M","color":"CELESTE","precio":13000,"precio_lista":13780,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short ruche frontal L-XL","color":"VERDE MANZANA","precio":13000,"precio_lista":13780,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Calza Corta Prelavada S/M","color":"ROSADO","precio":10000,"precio_lista":10600,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Calza Prelavada Total Black S-M","color":"NEGRO","precio":18000,"precio_lista":19080,"stock":2,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Prelavada Total Black L-XL","color":"NEGRO","precio":18000,"precio_lista":19080,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Oxford L-XL","color":"ROSA CHICLE","precio":17000,"precio_lista":18020,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Short a Rayas L","color":"CHOCOLATE","precio":7500,"precio_lista":7950,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Conjunto detalle lateral S/M","color":"MARRON","precio":20000,"precio_lista":21200,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Conjunto detalle lateral L-XL","color":"AZUL","precio":20000,"precio_lista":21200,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Short Prelavado con red a los costados - S-M","color":"LILA","precio":9000,"precio_lista":9540,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Prelavado con red a los costados - L-XL","color":"CHOCOLATE","precio":9000,"precio_lista":9540,"stock":2,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Catsuit S-M","color":"AZUL DENIM","precio":19000,"precio_lista":20140,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit L-XL","color":"AZUL DENIM","precio":19000,"precio_lista":20140,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit S-M","color":"AZUL","precio":18000,"precio_lista":19080,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit L-XL","color":"VERDE OLIVA","precio":18000,"precio_lista":19080,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Conjunto S-M","color":"MANTECA","precio":22000,"precio_lista":23320,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Conjunto L-XL","color":"LILA","precio":22000,"precio_lista":23320,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Conjunto S-M","color":"FUCSIA","precio":22500,"precio_lista":23850,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Conjunto L-XL","color":"ROJO","precio":22500,"precio_lista":23850,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Catsuit Corto Taza Definida S-M","color":"LILA","precio":19500,"precio_lista":20670,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit Corto Taza Definida L-XL","color":"NEGRO","precio":19500,"precio_lista":20670,"stock":2,"cat":"Catsuit","marca":"","img":""},{"nombre":"Conjunto Corto S-M","color":"CHOCOLATE","precio":22000,"precio_lista":23320,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Conjunto Corto L-XL","color":"BEIGE","precio":22000,"precio_lista":23320,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Catsuit Corto Relieve - L-XL","color":"LILA","precio":19500,"precio_lista":20670,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit Corto Cierre al Frente L-XL","color":"NEGRO","precio":20000,"precio_lista":21200,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Top Morley S-M","color":"VERDE OLIVA","precio":12000,"precio_lista":12720,"stock":1,"cat":"Top","marca":"","img":""},{"nombre":"Top Morley L-XL","color":"NEGRO","precio":12000,"precio_lista":12720,"stock":2,"cat":"Top","marca":"","img":""},{"nombre":"Calza Corta Prelavada S/M","color":"NEGRO","precio":10000,"precio_lista":10600,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Nuevo S-M","color":"CHOCOLATE","precio":10000,"precio_lista":10600,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Nuevo L-XL","color":"FUCSIA","precio":10000,"precio_lista":10600,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short con relieve S-M","color":"CELESTE","precio":9000,"precio_lista":9540,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short con relieve L-XL","color":"AZUL CELESTE","precio":9000,"precio_lista":9540,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Catsuit Corto Taza Blanca S-M","color":"CELESTE","precio":19500,"precio_lista":20670,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit Corto Taza Blanca L-XL","color":"CELESTE","precio":19500,"precio_lista":20670,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Biker Batik M","color":"NARANJA","precio":7500,"precio_lista":7950,"stock":1,"cat":"Otros","marca":"","img":""},{"nombre":"Short Batik Detalle L","color":"LILA","precio":9000,"precio_lista":9540,"stock":3,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Batik Detalle XL","color":"VERDE AGUA","precio":9000,"precio_lista":9540,"stock":4,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Batik Tigre - M","color":"BLANCO","precio":7000,"precio_lista":7420,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Batik Tigre - L","color":"BLANCO","precio":7000,"precio_lista":7420,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Corto Sin Frunce - M","color":"NEGRO","precio":9000,"precio_lista":9540,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Corto Sin Frunce - L","color":"NEGRO","precio":9000,"precio_lista":9540,"stock":2,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Corto Sin Frunce - XL","color":"VERDE AGUA","precio":9000,"precio_lista":9540,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Catsuit Corto Prelavado - S","color":"CELESTE","precio":19000,"precio_lista":20140,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit Corto Prelavado - M","color":"NEGRO","precio":19000,"precio_lista":20140,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit Corto Prelavado - L","color":"BORDO","precio":19000,"precio_lista":20140,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Short Linea Blanca M","color":"VERDE","precio":11000,"precio_lista":11660,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short c/Cordel BATIK S","color":"VERDE","precio":12000,"precio_lista":12720,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short c/Cordel DEGRADÉ S","color":"AZUL/NEGRO","precio":12000,"precio_lista":12720,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Conjunto Corto Morly - S","color":"NEGRO","precio":20000,"precio_lista":21200,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Conjunto Corto Morly - L","color":"AZUL","precio":20000,"precio_lista":21200,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Catsuit Largo Oxford - S","color":"NEGRO","precio":24000,"precio_lista":25440,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit Largo Oxford - M","color":"CHOCOLATE","precio":24000,"precio_lista":25440,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Short Prelavado S-M","color":"NEGRO","precio":10000,"precio_lista":10600,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Morley Cruzado L-XL","color":"ROSADO","precio":9000,"precio_lista":9540,"stock":2,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Catsuit Largo Linea Blanca - S","color":"NEGRO","precio":22000,"precio_lista":23320,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit Largo Linea Blanca - M","color":"NEGRO","precio":22000,"precio_lista":23320,"stock":2,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit Largo Linea Blanca - L","color":"NEGRO","precio":22000,"precio_lista":23320,"stock":2,"cat":"Catsuit","marca":"","img":""},{"nombre":"Conjunto S","color":"LILA","precio":26000,"precio_lista":27560,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Calza Larga Sin Frunce S","color":"NEGRO","precio":18000,"precio_lista":19080,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Larga Sin Frunce L","color":"NEGRO","precio":18000,"precio_lista":19080,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Catsuit Corto Con Manga - S","color":"VERDE OLIVA","precio":19500,"precio_lista":20670,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Catsuit Corto Con Manga - L","color":"CHOCOLATE","precio":19500,"precio_lista":20670,"stock":1,"cat":"Catsuit","marca":"","img":""},{"nombre":"Conjunto Largo Liso - S","color":"NARANJA","precio":15000,"precio_lista":15900,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Conjunto Largo Liso - M","color":"VERDE","precio":15000,"precio_lista":15900,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Conjunto Largo Liso - L","color":"NARANJA","precio":15000,"precio_lista":15900,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Conjunto Largo Liso - XL","color":"VERDE","precio":15000,"precio_lista":15900,"stock":1,"cat":"Conjunto","marca":"","img":""},{"nombre":"Calza Larga Degrade M","color":"NEGRO/CELESTE","precio":17000,"precio_lista":18020,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Oxford ZARA - M","color":"NEGRO","precio":12000,"precio_lista":12720,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Top Deportivo NEON M","color":"VERDE NEON","precio":9500,"precio_lista":10070,"stock":1,"cat":"Top","marca":"","img":""},{"nombre":"Short Liso Frente V - M","color":"NEGRO","precio":15000,"precio_lista":15900,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Liso Frente V - L","color":"NEGRO","precio":15000,"precio_lista":15900,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Liso Frente V - XL","color":"NEGRO","precio":15000,"precio_lista":15900,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Faja Condon M-XL","color":"CORAL","precio":13000,"precio_lista":13780,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Calza Prelavada S-M","color":"NEGRO","precio":15000,"precio_lista":15900,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Larga Sin Frunce Bolsillo Lateral M-L","color":"NEGRO","precio":13000,"precio_lista":13780,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Larga Sin Frunce Bolsillo Lateral XL-XXL","color":"NEGRO","precio":13000,"precio_lista":13780,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Conjunto Corto Short Pollera S-M","color":"AZUL","precio":30000,"precio_lista":31800,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Conjunto Corto Short Pollera M-L","color":"GRIS","precio":30000,"precio_lista":31800,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Remerón Superpoderosas","color":"NEGRO","precio":11000,"precio_lista":11660,"stock":1,"cat":"Otros","marca":"","img":""},{"nombre":"Remerón Bellota","color":"BORDÓ","precio":11000,"precio_lista":11660,"stock":1,"cat":"Otros","marca":"","img":""},{"nombre":"Remerón Tinkerbell","color":"CELESTE","precio":11000,"precio_lista":11660,"stock":1,"cat":"Otros","marca":"","img":""},{"nombre":"Remerón Burbuja","color":"CHOCOLATE","precio":11000,"precio_lista":11660,"stock":1,"cat":"Otros","marca":"","img":""},{"nombre":"Remerón Poderosa Modificada","color":"ROJO","precio":11000,"precio_lista":11660,"stock":1,"cat":"Otros","marca":"","img":""},{"nombre":"Remerón Lola","color":"BLANCO","precio":11000,"precio_lista":11660,"stock":1,"cat":"Otros","marca":"","img":""},{"nombre":"Remerón Hamptoms","color":"NEGRO","precio":9500,"precio_lista":10070,"stock":1,"cat":"Otros","marca":"","img":""},{"nombre":"Remerón Alo","color":"CHOCOLATE","precio":8000,"precio_lista":8480,"stock":1,"cat":"Otros","marca":"","img":""},{"nombre":"Crop Top BOSTON","color":"BLANCO","precio":6500,"precio_lista":6890,"stock":1,"cat":"Top","marca":"","img":""},{"nombre":"Crop Top SuperPoderosas","color":"NEGRO","precio":7000,"precio_lista":7420,"stock":2,"cat":"Top","marca":"","img":""},{"nombre":"Crop Top Alo","color":"CHOCOLATE","precio":6000,"precio_lista":6360,"stock":1,"cat":"Top","marca":"","img":""},{"nombre":"Top Liso","color":"LILA","precio":4500,"precio_lista":4770,"stock":1,"cat":"Top","marca":"","img":""},{"nombre":"Top Deportivo L","color":"NEGRO","precio":9500,"precio_lista":10070,"stock":1,"cat":"Top","marca":"","img":""},{"nombre":"Top Deportivo M","color":"AMARILLO","precio":9500,"precio_lista":10070,"stock":1,"cat":"Top","marca":"","img":""},{"nombre":"Musculosa Alo T/U","color":"NEGRO","precio":5500,"precio_lista":5830,"stock":2,"cat":"Top","marca":"","img":""},{"nombre":"Top Deportivo Follow me 3-4","color":"ROSA","precio":5000,"precio_lista":5300,"stock":1,"cat":"Top","marca":"","img":""},{"nombre":"Top Deportivo Follow me 3-4","color":"AZUL","precio":5000,"precio_lista":5300,"stock":1,"cat":"Top","marca":"","img":""},{"nombre":"Calza Larga Lycra 1","color":"ROSA","precio":12000,"precio_lista":12720,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Calza Larga Lycra 3","color":"NARANJA","precio":12000,"precio_lista":12720,"stock":1,"cat":"Calza Larga","marca":"","img":""},{"nombre":"Short Pollera S","color":"NEGRO","precio":10000,"precio_lista":10600,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Short Pollera XL","color":"NEGRO","precio":10000,"precio_lista":10600,"stock":1,"cat":"Calza Corta","marca":"","img":""},{"nombre":"Medias 3/4","color":"","precio":2500,"precio_lista":2650,"stock":39,"cat":"Medias","marca":"","img":""},{"nombre":"Set de Toallas 3 piezas","color":"AZUL","precio":13000,"precio_lista":13780,"stock":1,"cat":"Otros","marca":"","img":""}];
var indumCatActiva = 'all';
var indumMarcaActiva = 'all';
var indumPagina = 1;
var INDUM_POR_PAG = 24;

function colorDot(color) {
  var m = {'NEGRO':'#222','BLANCO':'#eee','ROJO':'#e53','ROSA':'#f4a','ROSADO':'#f7b','FUCSIA':'#f06','LILA':'#b8f','VIOLETA':'#96f','MORADO':'#73c','AZUL':'#38f','CELESTE':'#5cf','VERDE PINO':'#2a5','VERDE':'#4c8','VERDE LIMA':'#9f0','VERDE MANZANA':'#7d0','VERDE AGUA':'#0d9','NARANJA':'#f80','AMARILLO':'#fe0','TURQUESA':'#0cd','MARRON':'#964','CHOCOLATE':'#7B3F00','GRIS':'#888','BEIGE':'#d9c'};
  var cu = (color||'').toUpperCase();
  for (var k in m) { if (cu.indexOf(k) >= 0) return m[k]; }
  return '#888';
}

function getIndumFiltrados() {
  return INDUM_PRODS.filter(function(p) {
    var matchCat   = indumCatActiva === 'all' || p.cat === indumCatActiva;
    var matchMarca = indumMarcaActiva === 'all' || p.marca === indumMarcaActiva;
    return matchCat && matchMarca;
  });
}

function renderIndum() {
  var grid = document.getElementById('indumGrid');
  if (!grid) return;
  var lista = getIndumFiltrados();
  var totalPags = Math.ceil(lista.length / INDUM_POR_PAG);
  if (indumPagina > totalPags) indumPagina = 1;
  var inicio = (indumPagina - 1) * INDUM_POR_PAG;
  var pagina = lista.slice(inicio, inicio + INDUM_POR_PAG);
  if (!lista.length) {
    grid.innerHTML = '<p style="color:#888;padding:20px;grid-column:1/-1">No hay prendas disponibles.</p>';
    renderIndumPaginacion(0); return;
  }
  var html = '';
  for (var i = 0; i < pagina.length; i++) {
    var p = pagina[i];
    var dot = colorDot(p.color);
    var last = p.stock === 1;
    var tarjeta = p.precio_lista || Math.round(p.precio * 1.06);
    // Galería de múltiples imágenes
    var imgList = p.imagenes && p.imagenes.length ? p.imagenes : (p.img ? [p.img] : []);
    var hasMultiImg = imgList.length > 1;
    var galId = 'indum-gal-' + i + '-' + indumPagina;
    var imgBlock = '';
    if (imgList.length) {
      imgBlock = '<div class="indum-img" style="position:relative;overflow:hidden">';
      imgBlock += '<div class="gallery-slides" id="'+galId+'" data-index="0" data-total="'+imgList.length+'" style="display:flex;transition:transform .3s">';
      imgList.forEach(function(src){ imgBlock += '<div class="gallery-slide" style="min-width:100%;flex-shrink:0"><img src="'+src+'" alt="'+p.nombre+'" loading="lazy" style="width:100%;height:100%;object-fit:cover"></div>'; });
      imgBlock += '</div>';
      if (hasMultiImg) {
        imgBlock += '<button class="gal-btn gal-prev" onclick="galMove(\''+galId+'\',-1,event)" style="position:absolute;left:4px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:28px;height:28px;font-size:16px;cursor:pointer;z-index:2">‹</button>';
        imgBlock += '<button class="gal-btn gal-next" onclick="galMove(\''+galId+'\',1,event)" style="position:absolute;right:4px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:28px;height:28px;font-size:16px;cursor:pointer;z-index:2">›</button>';
        imgBlock += '<div style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.6);color:#fff;padding:2px 8px;border-radius:10px;font-size:.7rem">1 / '+imgList.length+'</div>';
      }
      imgBlock += '</div>';
    } else {
      imgBlock = '<div class="indum-img indum-no-img" style="display:flex;align-items:center;justify-content:center;font-size:2rem">&#128085;</div>';
    }
    html += '<div class="indum-card">' + imgBlock + '<div class="indum-body">';
    html += '<div class="indum-cat">' + p.cat + (p.marca ? ' &middot; ' + p.marca : '') + '</div>';
    html += '<div class="indum-nombre">' + p.nombre + '</div>';
    html += '<div class="indum-color" style="--dot-color:'+dot+'">' + p.color + '</div>';
    html += '<div class="indum-precio">$'+p.precio.toLocaleString('es-AR')+'</div>';
    html += '<div class="indum-precio-tarjeta">Tarjeta $'+tarjeta.toLocaleString('es-AR')+'</div>';
    html += '<div class="indum-stock '+(last?'last':'ok')+'">'+(last?'Ultima unidad!':p.stock+' disponibles')+'</div>';
    html += '<button class="indum-wa-btn" onclick="consultarIndum(this)" data-n="'+p.nombre.replace(/"/g,"'")+'" data-c="'+p.color+'" data-p="'+p.precio+'">Consultar por WhatsApp</button>';
    html += '</div></div>';
  }
  grid.innerHTML = html;
  renderIndumPaginacion(lista.length);
}

function renderIndumPaginacion(total) {
  var cont = document.getElementById('indumPaginacion');
  if (!cont) return;
  var totalPags = Math.ceil(total / INDUM_POR_PAG);
  if (totalPags <= 1) { cont.innerHTML = ''; return; }
  var html = '';
  if (indumPagina > 1) html += '<button onclick="irIndumPagina('+(indumPagina-1)+')" class="pag-btn">Anterior</button>';
  for (var i = 1; i <= totalPags; i++) html += '<button onclick="irIndumPagina('+i+')" class="pag-btn'+(i===indumPagina?' pag-activo':'')+'">' + i + '</button>';
  if (indumPagina < totalPags) html += '<button onclick="irIndumPagina('+(indumPagina+1)+')" class="pag-btn">Siguiente</button>';
  html += '<span class="pag-info">Pagina '+indumPagina+' de '+totalPags+' - '+total+' prendas</span>';
  cont.innerHTML = html;
}

function irIndumPagina(n) {
  indumPagina = n;
  renderIndum();syncURLIndex();
  document.getElementById('indumentaria').scrollIntoView({behavior:'smooth',block:'start'});
}

function filtrarIndum(cat) {
  indumCatActiva = cat;
  indumPagina = 1;
  document.querySelectorAll('.indum-filtro').forEach(function(b){ b.classList.toggle('activo', b.getAttribute('data-cat')===cat); });
  renderIndum();
  syncURLIndex();
}

function filtrarIndumMarca(marca) {
  indumMarcaActiva = marca;
  indumPagina = 1;
  document.querySelectorAll('.indum-filtro-marca').forEach(function(b){ b.classList.toggle('activo', b.getAttribute('data-marca')===marca); });
  renderIndum();
  syncURLIndex();
}

function consultarIndum(btn) {
  var n = btn.getAttribute('data-n');
  var col = btn.getAttribute('data-c');
  var pr = btn.getAttribute('data-p');
  var msg = encodeURIComponent('Hola MAXUP! Me interesa: ' + n + ' - Color: ' + col + ' - Precio: $' + Number(pr).toLocaleString('es-AR') + ' - Esta disponible?');
  window.open('https://wa.me/5491168461457?text=' + msg, '_blank');
}

function actualizarFiltrosMarca() {
  var cont = document.getElementById('indumFiltrosMarca');
  if (!cont) return;
  var marcas = [];
  INDUM_PRODS.forEach(function(p){ if(p.marca && marcas.indexOf(p.marca)<0) marcas.push(p.marca); });
  marcas.sort();
  var btns = [document.createElement('button')];
  btns[0].className = 'indum-filtro-marca activo';
  btns[0].setAttribute('data-marca','all');
  btns[0].textContent = 'Todas las marcas';
  btns[0].onclick = function(){ filtrarIndumMarca('all'); };
  marcas.forEach(function(m){
    var b = document.createElement('button');
    b.className = 'indum-filtro-marca';
    b.setAttribute('data-marca', m);
    b.textContent = m;
    b.onclick = function(){ filtrarIndumMarca(m); };
    btns.push(b);
  });
  cont.innerHTML = '';
  btns.forEach(function(b){ cont.appendChild(b); });
}

async function cargarIndumentariaSheets() {
  try {
    var res = await fetch(API_URL + '?accion=indumentaria');
    if (!res.ok) return;
    var data = await res.json();
    if (data.ok && data.prendas && data.prendas.length > 0) {
      INDUM_PRODS = data.prendas;
      actualizarFiltrosMarca();
      renderIndum();
    }
  } catch(e) {}
}

window.addEventListener('load', function() {
  actualizarFiltrosMarca();
  renderIndum();
  setTimeout(cargarIndumentariaSheets, 3000);
});

// ── RESEÑAS / VALORACIONES ──
let _reviews = {};
// Clave ESTABLE por marca+nombre (no cambia aunque se reordene la planilla)
function _revKey(pid){
  var p = (typeof getProduct==='function') ? getProduct(pid) : null;
  if(p) return ((p.brand||'')+'||'+(p.name||'')).toUpperCase();
  return 'PID_'+pid;
}
function loadReviews(){
  try{ const s=localStorage.getItem('maxup_reviews'); if(s) _reviews=JSON.parse(s)||{}; }catch(e){_reviews={};}
  // Reseñas GLOBALES del servidor (iguales para todos los visitantes)
  try{
    fetch(API_URL + '?accion=resenas').then(function(r){return r.json();}).then(function(d){
      if(d && d.ok && d.resenas){
        _reviews = d.resenas;
        try{ localStorage.setItem('maxup_reviews', JSON.stringify(_reviews)); }catch(e){}
        // Actualizar las valoraciones visibles sin re-renderizar todo
        document.querySelectorAll('.prod-card').forEach(function(card){
          var box = document.getElementById('reviews-'+card.dataset.id);
          if(box) box.innerHTML = renderReviews(card.dataset.id);
        });
      }
    }).catch(function(){});
  }catch(e){}
}
function saveReviews(){ try{localStorage.setItem('maxup_reviews',JSON.stringify(_reviews));}catch(e){} }

function submitReview(pid){
  var stars = document.querySelector('input[name="rev-stars-'+pid+'"]:checked');
  var comment = document.getElementById('rev-comment-'+pid);
  if(!stars){ showToast('⚠️ Seleccioná las estrellas'); return; }
  var rating = Number(stars.value);
  var text = comment ? comment.value.trim() : '';
  var key = _revKey(pid);
  var p = (typeof getProduct==='function') ? getProduct(pid) : null;
  if(!_reviews[key]) _reviews[key] = [];
  _reviews[key].push({ rating: rating, text: text, fecha: new Date().toLocaleDateString('es-AR'), nombre:'' });
  saveReviews();
  showToast('⭐ ¡Gracias por tu valoración!');
  var revBox = document.getElementById('reviews-'+pid);
  if(revBox) revBox.innerHTML = renderReviews(pid);
  // Guardar en el servidor (global, para todos)
  try{
    fetch(API_URL, { method:'POST', body: JSON.stringify({ accion:'nueva_resena', key:key, producto:(p?p.name:''), rating:rating, texto:text }) });
  }catch(e){}
}

function renderReviews(pid){
  var revs = _reviews[_revKey(pid)] || [];
  if(revs.length===0) return '<div class="card-rating-empty">Sin valoraciones aún</div>';
  var avg = revs.reduce(function(s,r){return s+r.rating;},0) / revs.length;
  var stars = '★'.repeat(Math.round(avg)) + '☆'.repeat(5-Math.round(avg));
  var html = '<div class="card-rating">' + stars + ' <span>' + avg.toFixed(1) + ' (' + revs.length + ')</span></div>';
  html += '<div class="card-rating-comments">';
  revs.slice(-2).forEach(function(r){
    if(r.text) html += '<div class="card-rating-c">"' + r.text.substring(0,80) + '"</div>';
  });
  html += '</div>';
  return html;
}

function getAvgRating(pid){
  var revs = _reviews[_revKey(pid)] || [];
  if(revs.length===0) return 0;
  return revs.reduce(function(s,r){return s+r.rating;},0) / revs.length;
}

loadReviews();

// ── COMBOS DINÁMICOS ──
const COMBO_DESCUENTO = 5; // % de descuento en combos

const COMBOS = [
  {
    id: 'combo_principiante',
    nombre: '💥 Combo Principiante',
    desc: 'Los 2 básicos para arrancar. Elegí tu proteína y creatina favoritas.',
    slots: [
      { label: 'Elegí tu Proteína', cat: 'proteina' },
      { label: 'Elegí tu Creatina', cat: 'creatina' }
    ],
    color: '#00C8FF'
  },
  {
    id: 'combo_fuerza',
    nombre: '🏋️ Combo Fuerza Total',
    desc: 'Potencia + energía + anti-catabolismo. El trío para levantar más pesado.',
    slots: [
      { label: 'Elegí tu Creatina', cat: 'creatina' },
      { label: 'Elegí tu Pre-Entreno', cat: 'preworkout' },
      { label: 'Elegí tus Aminoácidos', cat: 'aminoacido' }
    ],
    color: '#FF0099'
  },
  {
    id: 'combo_masa',
    nombre: '💪 Combo Masa Muscular',
    desc: 'Hipercalórico + Creatina + Recuperación. Para ganar volumen rápido.',
    slots: [
      { label: 'Elegí tu Gainer', cat: 'gainer' },
      { label: 'Elegí tu Creatina', cat: 'creatina' },
      { label: 'Elegí tus Aminoácidos', cat: 'aminoacido' }
    ],
    color: '#9933FF'
  },
  {
    id: 'combo_definicion',
    nombre: '🔥 Combo Definición',
    desc: 'Proteína + Quemador. Perdé grasa sin perder músculo.',
    slots: [
      { label: 'Elegí tu Proteína', cat: 'proteina' },
      { label: 'Elegí tu Quemador', cat: 'quemador' }
    ],
    color: '#FFA500'
  },
  {
    id: 'combo_salud',
    nombre: '🧬 Combo Salud & Bienestar',
    desc: 'Omega 3 + Magnesio + Vitaminas. Tu base diaria de salud.',
    slots: [
      { label: 'Elegí tu Omega/Magnesio', cat: 'magnesio' },
      { label: 'Elegí tus Vitaminas', cat: 'vitamin' }
    ],
    color: '#00E676'
  },
  {
    id: 'combo_recuperacion',
    nombre: '🛌 Combo Recuperación',
    desc: 'Magnesio + Aminoácidos. Dormí mejor, recuperate más rápido.',
    slots: [
      { label: 'Elegí tu Magnesio/ZMA', cat: 'magnesio' },
      { label: 'Elegí tus Aminoácidos', cat: 'aminoacido' }
    ],
    color: '#7B68EE'
  },
  {
    id: 'combo_mujer',
    nombre: '👑 Combo Mujer Fit',
    desc: 'Proteína + Colágeno + Quemador. Para verte y sentirte increíble.',
    slots: [
      { label: 'Elegí tu Proteína', cat: 'proteina' },
      { label: 'Elegí tu Colágeno', cat: 'colageno' },
      { label: 'Elegí tu Quemador', cat: 'quemador' }
    ],
    color: '#FF69B4'
  },
  {
    id: 'combo_resistencia',
    nombre: '🏃 Combo Resistencia & Cardio',
    desc: 'Hidratación + Aminoácidos. Ideal runners, ciclismo y CrossFit.',
    slots: [
      { label: 'Elegí tu Hidratación', cat: 'hidratacion' },
      { label: 'Elegí tus Aminoácidos', cat: 'aminoacido' }
    ],
    color: '#00BCD4'
  },
  {
    id: 'combo_articulaciones',
    nombre: '🦴 Combo Articulaciones & Piel',
    desc: 'Colágeno + Omega/Magnesio + Vitaminas. Articulaciones sanas y piel firme.',
    slots: [
      { label: 'Elegí tu Colágeno', cat: 'colageno' },
      { label: 'Elegí tu Omega/Magnesio', cat: 'magnesio' },
      { label: 'Elegí tus Vitaminas', cat: 'vitamin' }
    ],
    color: '#26A69A'
  },
  {
    id: 'combo_bestia',
    nombre: '🦍 Combo Bestia Mode',
    desc: 'Proteína + Creatina + Pre-entreno + Aminoácidos. El pack completo.',
    slots: [
      { label: 'Elegí tu Proteína', cat: 'proteina' },
      { label: 'Elegí tu Creatina', cat: 'creatina' },
      { label: 'Elegí tu Pre-Entreno', cat: 'preworkout' },
      { label: 'Elegí tus Aminoácidos', cat: 'aminoacido' }
    ],
    color: '#E91E63'
  }
];

function _getProductsByCat(cat){
  return PRODUCTS.filter(function(p){
    if(p.cat === cat) return true;
    // Fallback: buscar también por nombre para magnesio/omega
    if(cat === 'magnesio') return /magnesio|omega|zma/i.test(p.name);
    return false;
  }).filter(function(p){
    return p.flavors && p.flavors.reduce(function(s,f){return s+f.stock},0) > 0;
  }).sort(function(a,b){ return (a.price||0) - (b.price||0); });
}

function _comboPrice(comboId){
  var total = 0;
  var combo = COMBOS.find(function(c){return c.id===comboId});
  if(!combo) return 0;
  combo.slots.forEach(function(slot, i){
    var sel = document.getElementById('combo-sel-'+comboId+'-'+i);
    if(sel && sel.value){
      var p = PRODUCTS.find(function(x){return x.id===sel.value});
      if(p) total += (p.price || p.flavors[0].price || 0);
    }
  });
  return total;
}

function _comboThumbUrl(src){
  if(!src) return '';
  // Si es weserv, pedir versión chica para carga rápida
  if(src.indexOf('weserv.nl')!==-1) return src + (src.indexOf('?')!==-1?'&':'?') + 'w=80&h=80&fit=cover';
  return src;
}
function actualizarComboPrice(comboId){
  var combo = COMBOS.find(function(c){return c.id===comboId});
  // Actualizar miniaturas
  if(combo){
    combo.slots.forEach(function(slot, i){
      var sel = document.getElementById('combo-sel-'+comboId+'-'+i);
      var thumb = document.getElementById('combo-thumb-'+comboId+'-'+i);
      if(!sel || !thumb) return;
      var p = sel.value ? PRODUCTS.find(function(x){return x.id===sel.value}) : null;
      if(p){
        var imgSrc = p.img || getFallbackImg(p.cat);
        thumb.innerHTML = '<img src="'+_comboThumbUrl(imgSrc)+'" alt="" style="width:100%;height:100%;object-fit:cover" loading="lazy">';
        thumb.style.borderColor = (combo.color || '#00C8FF') + '88';
      } else {
        thumb.innerHTML = '<span style="font-size:.6rem;color:#555">📦</span>';
        thumb.style.borderColor = (combo.color || '#00C8FF') + '33';
      }
    });
  }
  var total = _comboPrice(comboId);
  var descEl = document.getElementById('combo-total-'+comboId);
  var btnEl = document.getElementById('combo-btn-'+comboId);
  if(!descEl) return;
  if(total > 0){
    var descuento = Math.round(total * COMBO_DESCUENTO / 100);
    var final = total - descuento;
    descEl.innerHTML = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
      + '<span style="text-decoration:line-through;color:#666;font-size:1rem;font-family:Bebas Neue,sans-serif">$'+total.toLocaleString('es-AR')+'</span>'
      + '<span style="font-family:Bebas Neue,sans-serif;font-size:1.8rem;background:linear-gradient(90deg,#00C8FF,#FF0099);-webkit-background-clip:text;-webkit-text-fill-color:transparent">$'+final.toLocaleString('es-AR')+'</span>'
      + '<span style="background:rgba(0,230,118,.15);color:#00E676;padding:2px 10px;border-radius:20px;font-size:.72rem;font-weight:700">-'+COMBO_DESCUENTO+'% OFF</span>'
      + '</div>'
      + '<div style="font-size:.7rem;color:#666;margin-top:2px">Ahorrás $'+descuento.toLocaleString('es-AR')+' comprando en combo</div>';
    if(btnEl) btnEl.style.display = 'block';
  } else {
    descEl.innerHTML = '<div style="font-size:.82rem;color:#888;margin-top:4px">⬆️ Seleccioná los productos para ver el precio</div>';
    if(btnEl) btnEl.style.display = 'none';
  }
}

function mostrarCombos(){
  var sec = document.getElementById('combosSection');
  var grid = document.getElementById('combosGrid');
  sec.style.display = 'block';
  // Ocultar grid normal y paginacion
  var pg = document.getElementById('productsGrid');
  if(pg) pg.style.display = 'none';
  var pag = document.getElementById('paginacion');
  if(pag) pag.style.display = 'none';
  activeCat = 'combo';

  grid.innerHTML = COMBOS.map(function(c){
    var slotsHtml = c.slots.map(function(slot, i){
      var prods = _getProductsByCat(slot.cat);
      var opts = '<option value="" style="background:#1a1a2e;color:'+c.color+'">— '+slot.label+' —</option>';
      opts += prods.map(function(p){
        var stock = p.flavors.reduce(function(s,f){return s+f.stock},0);
        var precio = p.price || 0;
        return '<option value="'+p.id+'" style="background:#1a1a2e;color:#e0e0e0;padding:6px">'+p.name+(p.brand?' ('+p.brand+')':'')
          +' — $'+precio.toLocaleString('es-AR')
          +(stock<=3?' ⚠️ Últimas '+stock:'')
          +'</option>';
      }).join('');
      return '<div style="margin-bottom:8px">'
        + '<div style="font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:'+c.color+';margin-bottom:4px">'+slot.label+'</div>'
        + '<div style="display:flex;align-items:center;gap:8px">'
        + '<div id="combo-thumb-'+c.id+'-'+i+'" style="width:40px;height:40px;border-radius:6px;overflow:hidden;flex-shrink:0;background:rgba(255,255,255,.04);border:1px solid '+c.color+'33;display:flex;align-items:center;justify-content:center">'
        + '<span style="font-size:.6rem;color:#555">📦</span>'
        + '</div>'
        + '<select id="combo-sel-'+c.id+'-'+i+'" onchange="actualizarComboPrice(\''+c.id+'\')" style="flex:1;min-width:0;background:#1a1a2e;border:1.5px solid '+c.color+'66;color:'+c.color+';font-family:Rajdhani,sans-serif;font-size:.82rem;font-weight:600;padding:8px 10px;border-radius:6px;outline:none;cursor:pointer;appearance:none;background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\''+encodeURIComponent(c.color)+'\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E&quot;);background-repeat:no-repeat;background-position:right 10px center;padding-right:30px">'
        + opts + '</select>'
        + '</div>'
        + (prods.length===0?'<div style="font-size:.72rem;color:#ff4444;margin-top:3px">Sin productos disponibles</div>':'')
        + '</div>';
    }).join('');

    var waMsg = encodeURIComponent('Hola MAXUP! Me interesa el '+c.nombre.replace(/[^\w\s]/g,'')+'. ¿Cuál es el precio del combo?');
    var waLink = 'https://wa.me/5491168461457?text='+waMsg;

    return '<div style="background:var(--dark2);border:1px solid '+c.color+'33;border-radius:12px;overflow:hidden;transition:border-color .3s" onmouseenter="this.style.borderColor=\''+c.color+'88\'" onmouseleave="this.style.borderColor=\''+c.color+'33\'">'
      + '<div style="background:'+c.color+'10;border-bottom:1px solid '+c.color+'22;padding:16px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center">'
      + '<div style="font-family:Bebas Neue,sans-serif;font-size:1.3rem;letter-spacing:.06em;color:'+c.color+'">' + c.nombre + '</div>'
      + '<span style="background:'+c.color+';color:#000;padding:2px 10px;border-radius:20px;font-size:.7rem;font-weight:700">'+COMBO_DESCUENTO+'% OFF</span>'
      + '</div>'
      + '<p style="color:#999;font-size:.82rem;margin-top:6px;line-height:1.5">' + c.desc + '</p>'
      + '</div>'
      + '<div style="padding:14px">'
      + slotsHtml
      + '<div id="combo-total-'+c.id+'" style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)">'
      + '<div style="font-size:.82rem;color:#888">⬆️ Seleccioná los productos para ver el precio</div>'
      + '</div>'
      + '<button id="combo-btn-'+c.id+'" onclick="agregarCombo(\''+c.id+'\')" style="display:none;width:100%;margin-top:10px;padding:10px;border:none;border-radius:8px;background:linear-gradient(90deg,'+c.color+','+c.color+'cc);color:#000;font-family:Rajdhani,sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;transition:opacity .2s">🛒 Agregar Combo al Carrito</button>'
      + '<a href="'+waLink+'" target="_blank" style="display:block;text-align:center;margin-top:8px;font-size:.78rem;color:'+c.color+';text-decoration:none;font-weight:600">💬 Consultar por WhatsApp</a>'
      + '</div></div>';
  }).join('');
}

function agregarCombo(comboId){
  var combo = COMBOS.find(function(c){return c.id===comboId});
  if(!combo) return;
  var allSelected = true;
  var selectedProds = [];
  combo.slots.forEach(function(slot, i){
    var sel = document.getElementById('combo-sel-'+comboId+'-'+i);
    if(!sel || !sel.value){ allSelected = false; return; }
    var p = PRODUCTS.find(function(x){return x.id===sel.value});
    if(p) selectedProds.push(p);
    else allSelected = false;
  });
  if(!allSelected || selectedProds.length !== combo.slots.length){
    showToast('⚠️ Seleccioná un producto en cada categoría');
    return;
  }
  // Verificar stock
  var sinStock = selectedProds.filter(function(p){
    return p.flavors.reduce(function(s,f){return s+f.stock},0) <= 0;
  });
  if(sinStock.length > 0){
    showToast('❌ '+sinStock[0].name+' sin stock');
    return;
  }
  // Agregar cada producto al carrito con marca de combo
  selectedProds.forEach(function(p){
    var flav = p.flavors.find(function(f){return f.stock>0}) || p.flavors[0];
    var key = p.id+'__'+flav.name;
    var existing = cart.find(function(i){return i.key===key});
    if(existing){
      existing.qty = Math.min(existing.qty+1, flav.stock);
      existing.combo = true;
    } else {
      var imgList = p.imgs && Object.values(p.imgs).length ? Object.values(p.imgs) : (p.img ? [p.img] : []);
      cart.push({key:key, pid:p.id, name:p.name, brand:p.brand||'', flavor:flav.name, price:p.price||0, emoji:p.emoji||'📦', img:imgList[0]||'', maxStock:flav.stock, qty:1, combo:true});
    }
  });
  saveCart(); renderCart(); updateBadge();
  showToast('✅ '+combo.nombre+' agregado con '+COMBO_DESCUENTO+'% OFF');
}

// ── FAQ ──
(function(){
  var faqs = [
    { q:'¿Hacen envíos a todo el país?', a:'Sí, enviamos por Correo Argentino a todo el país. El costo se cotiza por WhatsApp según peso y destino. También podés retirar en nuestro local en Calixto Gauna 1045, General Güemes, Salta.' },
    { q:'¿Cuánto tarda el envío?', a:'Envíos locales (Salta): 1-2 días hábiles. Interior del país: 3-7 días hábiles dependiendo de la zona. Te enviamos el código de seguimiento apenas despachamos.' },
    { q:'¿Aceptan tarjeta de crédito?', a:'Sí, aceptamos transferencia bancaria, efectivo, Mercado Pago y tarjetas. Los precios publicados son para efectivo/transferencia. Tarjeta/QR/débito tiene un 8% adicional (precio tachado en cada producto).' },
    { q:'¿Los productos son originales?', a:'100% originales y sellados de fábrica. Trabajamos directamente con distribuidores oficiales de cada marca. Todos los productos tienen fecha de vencimiento visible.' },
    { q:'¿Tienen local físico?', a:'Sí, estamos en Calixto Gauna 1045, General Güemes, Salta. Podés venir a ver los productos, consultar y retirar tu pedido personalmente.' },
    { q:'¿Cómo funciona el sistema de puntos?', a:'Cada $1.000 en compras = 1 punto. Cuando juntás 250 puntos podés canjearlos por $5.000 de descuento en compras mayores a $50.000. Los puntos se acumulan automáticamente.' },
    { q:'¿Tienen descuentos por cantidad?', a:'Sí, comprando 2 o más del mismo producto tenés un 5% off automático. Además hay descuentos por monto total: 5% desde $100.000, 10% desde $220.000 y 15% desde $270.000.' },
    { q:'¿Puedo usar cupón de descuento?', a:'Sí, ingresá tu código en el campo "Cupón" dentro del carrito antes de finalizar el pedido. Seguinos en Instagram y TikTok para enterarte de los cupones activos.' },
  ];
  var el = document.getElementById('faqList');
  if(!el) return;
  el.innerHTML = faqs.map(function(f,i){
    return '<div style="background:var(--dark2);border:1px solid rgba(255,255,255,.06);border-radius:10px;margin-bottom:8px;overflow:hidden">'
      + '<div onclick="this.parentElement.classList.toggle(\'faq-open\');this.querySelector(\'.faq-arrow\').textContent=this.parentElement.classList.contains(\'faq-open\')?\'▴\':\'▾\'" style="padding:16px 20px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:.95rem">'
      + '<span>' + f.q + '</span><span class="faq-arrow" style="color:var(--cyan);font-size:1.1rem">▾</span></div>'
      + '<div style="max-height:0;overflow:hidden;transition:max-height .3s;padding:0 20px"><p style="color:var(--gray);font-size:.88rem;line-height:1.7;padding-bottom:16px">' + f.a + '</p></div>'
      + '</div>';
  }).join('');
})();

// ── BANNER ROTATIVO PROMOS ──
(function(){
  var msgs = [
    'ENVÍO A TODO EL PAÍS 📦 STOCK REAL ACTUALIZADO',
    '💰 DESCUENTOS EXCLUSIVOS EN NUESTRAS REDES SOCIALES',
    '⚡ DESCUENTO AUTOMÁTICO EN COMPRAS +$100.000',
    '🏪 RETIRÁ EN LOCAL — CALIXTO GAUNA 1045, GRAL. GÜEMES',
    '🏷️ ACUMULÁ PUNTOS Y CANJEÁ DESCUENTOS'
  ];
  var idx = 0;
  var el = document.getElementById('promoBannerText');
  if(!el) return;
  setInterval(function(){
    el.style.opacity = '0';
    setTimeout(function(){
      idx = (idx+1) % msgs.length;
      el.textContent = msgs[idx];
      el.style.opacity = '1';
    }, 400);
  }, 4000);
})();

// ── TEMA CLARO/OSCURO ──
function toggleTheme(){
  document.body.classList.toggle('light');
  var isLight = document.body.classList.contains('light');
  var btn = document.getElementById('themeToggle');
  if(btn) btn.textContent = isLight ? '🌞' : '🌙';
  try{ localStorage.setItem('maxup_theme', isLight?'light':'dark'); }catch(e){}
}
// Restaurar tema guardado
(function(){
  try{
    if(localStorage.getItem('maxup_theme')==='light'){
      document.body.classList.add('light');
      var btn = document.getElementById('themeToggle');
      if(btn) btn.textContent = '🌞';
    }
  }catch(e){}
})();

// ── PWA: Registrar Service Worker ──
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').then(()=>console.log('✅ SW registrado')).catch(()=>{});
}

// ══════════════════════════════════════════════════════════
// ║ MEJORAS BATCH 2 — 16 FUNCIONALIDADES NUEVAS           ║
// ══════════════════════════════════════════════════════════

// ── #3: CARRUSEL NUEVOS INGRESOS ──
// Detección por TIEMPO (no se congela): marca productos nuevos o con stock
// aumentado con la fecha de detección; expiran a los 14 días.
function _detectarNuevosIngresos(){
  var STOCK_KEY  = 'maxup_stock_snap_v4';   // foto del stock anterior
  var NUEVOS_KEY = 'maxup_nuevos_ts_v4';    // {clave: timestamp de detección}
  var VENTANA_MS = 14*24*60*60*1000;        // 14 días visibles
  var ahora = Date.now();

  // Clave estable por marca+nombre
  function pKey(p){ return (p.brand||'')+'||'+p.name; }
  function stockDe(p){ return p.flavors ? p.flavors.reduce(function(s,f){return s+f.stock;},0) : 0; }

  var prevStock = null, nuevosTs = {};
  try { var s=localStorage.getItem(STOCK_KEY);  if(s) prevStock = JSON.parse(s); } catch(e){}
  try { var n=localStorage.getItem(NUEVOS_KEY); if(n) nuevosTs  = JSON.parse(n) || {}; } catch(e){}

  // Stock actual
  var curStock = {};
  PRODUCTS.forEach(function(p){ curStock[pKey(p)] = stockDe(p); });

  // Detectar cambios SOLO si ya teníamos una foto previa
  // (en la primera visita no inundamos: solo guardamos la foto)
  if(prevStock){
    PRODUCTS.forEach(function(p){
      var k = pKey(p), cur = curStock[k];
      if(cur <= 0) return;
      var prev = prevStock[k];
      if(prev === undefined || cur > prev){
        nuevosTs[k] = ahora; // producto nuevo o reposición → fecha de hoy
      }
    });
  }

  // Expirar lo que pasó la ventana
  Object.keys(nuevosTs).forEach(function(k){
    if(ahora - nuevosTs[k] > VENTANA_MS) delete nuevosTs[k];
  });

  // Guardar estado
  try { localStorage.setItem(STOCK_KEY,  JSON.stringify(curStock)); } catch(e){}
  try { localStorage.setItem(NUEVOS_KEY, JSON.stringify(nuevosTs)); } catch(e){}

  // Detectados, más recientes primero
  return Object.keys(nuevosTs)
    .sort(function(a,b){ return nuevosTs[b]-nuevosTs[a]; })
    .map(function(k){ return PRODUCTS.find(function(p){ return pKey(p)===k; }); })
    .filter(function(p){ return p && p.price>0 && (p.flavors?p.flavors.reduce(function(s,f){return s+f.stock;},0):0)>0; });
}

var _nuevosServer = null;       // lista de {marca,nombre} calculada en el servidor (global)
var NUEVOS_MAX_SUP = 15;        // máximo de productos en el carrusel de suplementos

function renderNuevosIngresos(){
  var nuevos = [], vistos = {};
  function _add(p){ if(!p) return; var k=(p.brand||'')+'||'+p.name; if(vistos[k]) return; vistos[k]=1; nuevos.push(p); }

  if(_nuevosServer && _nuevosServer.length){
    // ── ÚNICA FUENTE: el servidor → TODOS los dispositivos ven EXACTAMENTE lo mismo ──
    // (no se mezcla detección del navegador, así PC = móvil = todos los visitantes)
    _nuevosServer.forEach(function(it){
      var base = (typeof _extraerSabor==='function') ? _extraerSabor(it.nombre||'').base : (it.nombre||'');
      var marca = (it.marca||'').toUpperCase();
      var prod = PRODUCTS.find(function(p){
        return (p.brand||'').toUpperCase()===marca &&
               ((p.name||'')===base || (p.name||'')===(it.nombre||''));
      });
      if(prod && prod.flavors && prod.flavors.reduce(function(s,f){return s+f.stock},0)>0) _add(prod);
    });
  } else {
    // ── Fallback SOLO si el servidor no responde (igual para todos: orden de planilla) ──
    PRODUCTS.filter(function(p){
      return p.flavors && p.flavors.reduce(function(s,f){return s+f.stock},0) > 0 && p.price > 0;
    }).slice(-15).reverse().forEach(_add);
  }

  nuevos = nuevos.slice(0, NUEVOS_MAX_SUP);

  var sec = document.getElementById('nuevosSection');
  var track = document.getElementById('nuevosTrack');
  if(!sec || !track || nuevos.length < 3) return;
  sec.style.display = 'block';
  track.innerHTML = nuevos.map(function(p){
    var imgSrc = (p.imgs && p.imgs[0]) || p.img || '';
    return '<div class="nuevos-card" onclick="openProdModal(\''+p.id+'\')">'
      + (imgSrc ? '<img src="'+imgSrc+'" alt="'+p.name+'" loading="lazy">' : '<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:#111">'+p.emoji+'</div>')
      + '<div class="nuevos-card-body">'
      + '<div class="nuevos-card-brand">'+p.brand+'</div>'
      + '<div class="nuevos-card-name">'+p.name+'</div>'
      + '<div class="nuevos-card-price">'+fmt(p.price)+'</div>'
      + '</div></div>';
  }).join('');
}

// ── #4: AVISAR CUANDO HAYA STOCK ──
function avisarStock(pid, nombre, btn){
  var tel = prompt('Ingresá tu WhatsApp para avisarte cuando haya stock de '+nombre+':');
  if(!tel || tel.length < 8) return;
  try{
    var avisos = JSON.parse(localStorage.getItem('maxup_avisos_stock')||'[]');
    avisos.push({ pid: pid, nombre: nombre, tel: tel, fecha: new Date().toISOString() });
    localStorage.setItem('maxup_avisos_stock', JSON.stringify(avisos));
  }catch(e){}
  btn.textContent = '✅ Te avisamos!';
  btn.disabled = true;
  btn.style.color = '#00E676';
  btn.style.borderColor = 'rgba(0,230,118,.3)';
  showToast('🔔 Te vamos a avisar cuando '+nombre+' tenga stock');
}

// ── #5: DESCUENTO POR CANTIDAD (5% comprando 2+) ──
function getDescuentoCantidad(){
  var descTotal = 0;
  cart.forEach(function(item){
    if(item.qty >= 2){
      descTotal += Math.round(item.price * item.qty * 0.05);
    }
  });
  return descTotal;
}

// ── #7: HISTORIAL DE PEDIDOS ──
function buscarHistorial(){
  var phone = document.getElementById('historialPhone').value.trim();
  var list = document.getElementById('historialList');
  if(!phone || phone.length < 8){
    list.innerHTML = '<p style="color:#FF3D3D">Ingresá un número válido</p>';
    return;
  }
  list.innerHTML = '<p style="color:var(--cyan)">🔄 Buscando...</p>';
  fetch(API_URL + '?accion=historial_cliente&telefono=' + encodeURIComponent(phone))
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data.ok || !data.pedidos || data.pedidos.length === 0){
        list.innerHTML = '<p style="text-align:center;padding:20px">📭 No se encontraron pedidos con este número.<br><span style="font-size:.8rem;color:#666">Asegurate de usar el mismo número con que hiciste el pedido.</span></p>';
        return;
      }
      // Mostrar puntos
      var puntos = data.puntos || 0;
      var puntosHtml = '<div style="text-align:center;padding:12px;background:rgba(255,215,0,.06);border:1px solid rgba(255,215,0,.2);border-radius:10px;margin-bottom:16px">'
        + '<div class="puntos-badge" style="font-size:.85rem;margin-bottom:4px">⭐ '+puntos+' puntos</div>'
        + '<div style="font-size:.75rem;color:#aaa">250 puntos = $5.000 de descuento en compras +$50.000</div>'
        + (puntos >= 250 ? '<div style="margin-top:6px;font-size:.82rem;color:#00E676;font-weight:700">🎉 ¡Podés canjear tus puntos! Avisanos por WhatsApp.</div>' : '<div style="margin-top:6px;font-size:.75rem;color:#666">Te faltan '+(250-puntos)+' puntos para tu próximo descuento</div>')
        + '</div>';
      list.innerHTML = puntosHtml + data.pedidos.map(function(p){
        var estadoColor = {'pendiente':'#FFA500','confirmado':'#00C8FF','preparando':'#9933FF','enviado':'#00E676','entregado':'#00FF88','cancelado':'#FF3D3D'}[p.estado] || '#aaa';
        return '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px;margin-bottom:8px">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
          + '<span style="font-family:Bebas Neue,sans-serif;font-size:1rem;color:var(--cyan);letter-spacing:.06em">'+p.codigo+'</span>'
          + '<span style="font-size:.72rem;padding:3px 10px;border-radius:12px;background:'+estadoColor+'20;color:'+estadoColor+';font-weight:700;text-transform:uppercase;border:1px solid '+estadoColor+'40">'+p.estado+'</span>'
          + '</div>'
          + '<div style="font-size:.8rem;color:#888">'+p.fecha+'</div>'
          + '<div style="font-size:.9rem;color:var(--cyan);font-weight:700;margin-top:4px">'+fmt(p.total)+'</div>'
          + '</div>';
      }).join('');
    }).catch(function(){
      list.innerHTML = '<p style="color:#FF3D3D">Error al buscar. Intentá de nuevo.</p>';
    });
}

// ── #8: CALCULADORA DE PROTEÍNA / CREATINA ──
function calcularSuplemento(){
  var peso = parseInt(document.getElementById('calcProtPeso').value);
  var tipo = document.getElementById('calcProtTipo').value;
  var obj = document.getElementById('calcProtObj').value;
  var res = document.getElementById('calcProtResultado');
  if(!peso || peso < 30 || peso > 250){
    res.innerHTML = '<p style="color:#FF3D3D;text-align:center;margin-top:12px">Ingresá un peso válido (30-250 kg)</p>';
    return;
  }
  var html = '';
  if(tipo === 'proteina'){
    var grPorKg = obj === 'ganar' ? 2.2 : obj === 'definir' ? 2.4 : 1.6;
    var protTotal = Math.round(peso * grPorKg);
    var protDieta = Math.round(protTotal * 0.6);
    var protSupl = protTotal - protDieta;
    var scoops = Math.ceil(protSupl / 24);
    var grPorDia = scoops * 30;
    var duracion1kg = Math.floor(1000 / grPorDia);
    var duracion2lb = Math.floor(908 / grPorDia);
    html = '<div class="calc-prot-result">'
      + '<div style="text-align:center;margin-bottom:12px"><span style="font-family:Bebas Neue,sans-serif;font-size:1.4rem;color:var(--cyan)">Tu plan de proteína</span></div>'
      + '<div class="calc-prot-row"><span>Proteína diaria total</span><span style="color:var(--cyan);font-weight:700">'+protTotal+'g/día</span></div>'
      + '<div class="calc-prot-row"><span>De la dieta (~60%)</span><span>'+protDieta+'g</span></div>'
      + '<div class="calc-prot-row"><span>Del suplemento</span><span style="color:#00E676;font-weight:700">'+protSupl+'g ('+scoops+' scoop'+(scoops>1?'s':'')+')</span></div>'
      + '<div class="calc-prot-row"><span>📦 Doypack 2 lb (908g)</span><span>Dura ~'+duracion2lb+' días</span></div>'
      + '<div class="calc-prot-row"><span>📦 Pote 1 kg</span><span>Dura ~'+duracion1kg+' días</span></div>'
      + '<div style="margin-top:12px;text-align:center"><a href="#catalogo" onclick="setCat(\'proteina\')" style="color:var(--cyan);font-weight:700;font-size:.88rem">→ Ver proteínas disponibles</a></div>'
      + '</div>';
  } else {
    var fase = obj === 'ganar' ? 'carga' : 'mantener';
    var grDia = fase === 'carga' ? 20 : (peso > 80 ? 5 : 3);
    var duracion300 = Math.floor(300 / grDia);
    var duracion500 = Math.floor(500 / grDia);
    html = '<div class="calc-prot-result">'
      + '<div style="text-align:center;margin-bottom:12px"><span style="font-family:Bebas Neue,sans-serif;font-size:1.4rem;color:var(--cyan)">Tu plan de creatina</span></div>'
      + '<div class="calc-prot-row"><span>Fase recomendada</span><span style="color:var(--cyan);font-weight:700">'+(fase==='carga'?'Carga (5-7 días)':'Mantenimiento')+'</span></div>'
      + '<div class="calc-prot-row"><span>Dosis diaria</span><span style="color:#00E676;font-weight:700">'+grDia+'g/día</span></div>'
      + (fase==='carga' ? '<div class="calc-prot-row"><span>Luego mantenimiento</span><span>'+(peso>80?5:3)+'g/día</span></div>' : '')
      + '<div class="calc-prot-row"><span>📦 Pote 300g</span><span>Dura ~'+duracion300+' días</span></div>'
      + '<div class="calc-prot-row"><span>📦 Pote 500g</span><span>Dura ~'+duracion500+' días</span></div>'
      + '<div style="margin-top:8px;font-size:.78rem;color:#aaa;text-align:center">💡 Tomá la creatina todos los días, con o sin entrenamiento.</div>'
      + '<div style="margin-top:12px;text-align:center"><a href="#catalogo" onclick="setCat(\'creatina\')" style="color:var(--cyan);font-weight:700;font-size:.88rem">→ Ver creatinas disponibles</a></div>'
      + '</div>';
  }
  res.innerHTML = html;
}

// ── #9: FILTRO POR RANGO DE PRECIO VISUAL ──
var _precioBadgeMax = 999999;
function filtroPrecioBadge(max, btn){
  document.querySelectorAll('.precio-badge').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  if(max < 0){
    // "Más de $100.000"
    _precioBadgeMax = -max;
    precioMax = 999999;
  } else {
    _precioBadgeMax = max;
    precioMax = max < 999999 ? max : 200000;
  }
  var range = document.getElementById('precioRange');
  if(range && max > 0 && max < 999999) range.value = max;
  else if(range) range.value = 200000;
  var label = document.getElementById('precioVal');
  if(label) label.textContent = max >= 999999 ? 'Sin límite' : max < 0 ? '+$100.000' : '$'+max.toLocaleString('es-AR');
  applyFilters();
}

// ── #10: NOTIFICACIONES PUSH WEB ──
function solicitarPush(){
  if(!('Notification' in window)) return;
  if(Notification.permission === 'granted'){
    showToast('🔔 Notificaciones ya activadas');
    return;
  }
  Notification.requestPermission().then(function(perm){
    if(perm === 'granted'){
      showToast('🔔 ¡Notificaciones activadas!');
      try{ localStorage.setItem('maxup_push','true'); }catch(e){}
      // Enviar notificación de prueba
      new Notification('MAXUP Suplementos', {
        body: '¡Listo! Te avisaremos de ofertas y nuevos productos.',
        icon: 'favicon.png'
      });
    }
  });
}
// Auto-solicitar después de 30 segundos si no se pidió antes
setTimeout(function(){
  try{
    if(!localStorage.getItem('maxup_push_asked') && 'Notification' in window && Notification.permission === 'default'){
      localStorage.setItem('maxup_push_asked','true');
      // No preguntar automáticamente, solo preparar el botón
    }
  }catch(e){}
}, 30000);

// ── #11: LAZY LOADING OPTIMIZADO CON INTERSECTION OBSERVER ──
(function(){
  if(!('IntersectionObserver' in window)) return;
  var imgObs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var img = entry.target;
        if(img.dataset.src){
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imgObs.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });
  // Observar imágenes con data-src
  new MutationObserver(function(){
    document.querySelectorAll('img[data-src]').forEach(function(img){
      imgObs.observe(img);
    });
  }).observe(document.body, { childList: true, subtree: true });
})();

// ── #12: COMPRESIÓN AUTOMÁTICA DE IMÁGENES (vía weserv.nl proxy) ──
function optimizeImgUrl(url){
  if(!url) return url;
  if(url.indexOf('images.weserv.nl') >= 0) return url;
  if(url.indexOf('data:') === 0) return url;
  if(url.indexOf('.svg') >= 0) return url;
  return 'https://images.weserv.nl/?url=' + encodeURIComponent(url.replace(/^https?:\/\//, '')) + '&w=400&output=webp&q=80';
}

// ── #15: META TAGS DINÁMICOS POR PRODUCTO ──
function updateMetaForProduct(p){
  if(!p) return;
  var title = p.name + ' — ' + p.brand + ' | MAXUP Suplementos';
  var desc = p.desc ? p.desc.substring(0, 160) : p.name + ' de ' + p.brand + '. Disponible en MAXUP Suplementos.';
  document.title = title;
  var metaDesc = document.querySelector('meta[name="description"]');
  if(metaDesc) metaDesc.content = desc;
  var ogTitle = document.querySelector('meta[property="og:title"]');
  if(ogTitle) ogTitle.content = title;
  var ogDesc = document.querySelector('meta[property="og:description"]');
  if(ogDesc) ogDesc.content = desc;
  var ogImg = document.querySelector('meta[property="og:image"]');
  if(ogImg && p.img) ogImg.content = p.img;
}
// Restaurar metas al cerrar modal
var _originalTitle = document.title;
var _originalDesc = document.querySelector('meta[name="description"]')?.content || '';
function resetMeta(){
  document.title = _originalTitle;
  var metaDesc = document.querySelector('meta[name="description"]');
  if(metaDesc) metaDesc.content = _originalDesc;
}

// ── #16: SISTEMA DE PUNTOS ──
// Cada $1.000 en compras = 1 punto. 250 puntos = $5.000 de descuento en compras >$50.000.
var _puntosCliente = 0;
function cargarPuntos(telefono){
  if(!telefono || telefono.length < 8) return;
  fetch(API_URL + '?accion=puntos_cliente&telefono=' + encodeURIComponent(telefono))
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data.ok) _puntosCliente = data.puntos || 0;
    }).catch(function(){});
}
function mostrarPuntosEnCheckout(){
  var phone = document.getElementById('clientPhone').value.trim();
  if(!phone || phone.length < 8) return;
  cargarPuntos(phone);
}

// ── INTEGRAR DESCUENTO POR CANTIDAD EN renderCart ──
// Parchear renderCart para incluir descuento por cantidad
var _origRenderCart = renderCart;
renderCart = function(){
  _origRenderCart();
  // Añadir info de descuento por cantidad en promoBar si aplica
  var descQty = getDescuentoCantidad();
  if(descQty > 0 && cart.length > 0){
    var promoBar = document.getElementById('promoBar');
    if(promoBar){
      promoBar.innerHTML += '<br><span style="color:#00E676;font-size:.78rem">🏷️ 5% off por cantidad (2+ iguales): -'+fmt(descQty)+'</span>';
    }
  }
};

// ── INTEGRAR DESCUENTO POR CANTIDAD EN buildMiniList ──
var _origBuildMiniList = buildMiniList;
buildMiniList = function(){
  _origBuildMiniList();
  var descQty = getDescuentoCantidad();
  if(descQty > 0){
    var el = document.getElementById('orderMiniList');
    if(el){
      // Insertar antes del TOTAL row
      var totalDiv = el.querySelector('div:last-child');
      if(totalDiv){
        var qtyDiv = document.createElement('div');
        qtyDiv.className = 'omi';
        qtyDiv.style.color = '#00E676';
        qtyDiv.innerHTML = '<span>🏷️ 5% off por cantidad (2+ iguales)</span><span>-'+fmt(descQty)+'</span>';
        el.insertBefore(qtyDiv, totalDiv);
      }
    }
  }
};

// ── INTEGRAR META TAGS DINÁMICOS EN MODAL ──
var _origOpenProdModal = typeof openProdModal === 'function' ? openProdModal : null;
if(_origOpenProdModal){
  var _wrappedOpenProdModal = openProdModal;
  openProdModal = function(pid){
    _wrappedOpenProdModal(pid);
    var p = getProduct(pid);
    if(p) updateMetaForProduct(p);
  };
}

// ── INTEGRAR NUEVOS INGRESOS DESPUÉS DE CARGAR PRODUCTOS ──
var _origRenderAll = renderAll;
renderAll = function(){
  _origRenderAll();
  // #7 — Guardar historial de precios y mostrar badges
  _guardarHistorialPrecios();
  _mostrarBadgesPrecios();
  renderNuevosIngresos();
  // Drag-to-scroll para el carrusel (touch + mouse)
  var track = document.getElementById('nuevosTrack');
  if(track && !track._dragInit){
    track._dragInit = true;
    var isDown=false, startX=0, scrollL=0;
    track.addEventListener('mousedown',function(e){isDown=true;startX=e.pageX-track.offsetLeft;scrollL=track.scrollLeft;track.style.cursor='grabbing'});
    track.addEventListener('mouseleave',function(){isDown=false;track.style.cursor='grab'});
    track.addEventListener('mouseup',function(){isDown=false;track.style.cursor='grab'});
    track.addEventListener('mousemove',function(e){if(!isDown)return;e.preventDefault();track.scrollLeft=scrollL-(e.pageX-track.offsetLeft-startX)});
    // Scroll con ruedita del mouse
    track.addEventListener('wheel',function(e){
      if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){
        e.preventDefault();
        track.scrollBy({left:e.deltaY>0?200:-200,behavior:'smooth'});
      }
    },{passive:false});
  }
};

// ── #6 AVISAR STOCK — Modal ──
var _stockAlertPid = '';
function abrirStockAlert(pid){
  _stockAlertPid = pid;
  var p = getProduct(pid);
  var modal = document.getElementById('stockAlertModal');
  var label = document.getElementById('stockAlertProduct');
  if(p && label) label.textContent = p.name + (p.brand ? ' — ' + p.brand : '');
  if(modal) modal.classList.add('open');
  // Pre-fill si ya guardó su número
  var saved = localStorage.getItem('maxup_alert_phone');
  var input = document.getElementById('stockAlertPhone');
  if(saved && input) input.value = saved;
}
function cerrarStockAlert(){
  var modal = document.getElementById('stockAlertModal');
  if(modal) modal.classList.remove('open');
  _stockAlertPid = '';
}
function enviarStockAlert(){
  var phone = (document.getElementById('stockAlertPhone').value || '').trim();
  if(!phone || phone.length < 8){ toast('Ingresá un número válido'); return; }
  // Guardar en localStorage
  localStorage.setItem('maxup_alert_phone', phone);
  var alerts = JSON.parse(localStorage.getItem('maxup_stock_alerts') || '[]');
  alerts.push({pid: _stockAlertPid, phone: phone, date: new Date().toISOString()});
  localStorage.setItem('maxup_stock_alerts', JSON.stringify(alerts));
  // Enviar WhatsApp al dueño
  var p = getProduct(_stockAlertPid);
  var msg = 'Nuevo pedido de aviso de stock:\n📦 ' + (p ? p.name : _stockAlertPid) + '\n📱 Cliente: ' + phone;
  window.open('https://wa.me/5491168461457?text=' + encodeURIComponent(msg), '_blank');
  cerrarStockAlert();
  toast('✅ Te avisaremos cuando haya stock!');
}

// ── #7 HISTORIAL DE PRECIOS (localStorage) ──
function _mostrarBadgesPrecios(){
  document.querySelectorAll('.prod-card').forEach(function(card){
    var pid = card.dataset.id;
    var change = _getPriceChange(pid);
    if(change && change.type === 'down'){
      var existing = card.querySelector('.price-change-badge');
      if(existing) return;
      var badge = document.createElement('div');
      badge.className = 'price-change-badge';
      badge.style.cssText = 'font-size:.65rem;color:#00E676;font-weight:700;margin-top:2px';
      badge.textContent = '⬇️ Bajó ' + change.pct + '% (era $' + change.prev.toLocaleString('es-AR') + ')';
      var priceEl = card.querySelector('.prod-price-val');
      if(priceEl && priceEl.parentNode) priceEl.parentNode.appendChild(badge);
    }
  });
}

function _guardarHistorialPrecios(){
  var hoy = new Date().toISOString().slice(0,10);
  var hist = JSON.parse(localStorage.getItem('maxup_price_history') || '{}');
  if(hist._lastDate === hoy) return; // Ya se guardó hoy
  PRODUCTS.forEach(function(p){
    if(!hist[p.id]) hist[p.id] = [];
    var last = hist[p.id][hist[p.id].length - 1];
    // Solo guardar si cambió el precio o es la primera vez
    if(!last || last.p !== p.price){
      hist[p.id].push({d: hoy, p: p.price});
      // Máximo 30 registros por producto
      if(hist[p.id].length > 30) hist[p.id] = hist[p.id].slice(-30);
    }
  });
  hist._lastDate = hoy;
  localStorage.setItem('maxup_price_history', JSON.stringify(hist));
}
function _getPriceChange(pid){
  var hist = JSON.parse(localStorage.getItem('maxup_price_history') || '{}');
  var arr = hist[pid];
  if(!arr || arr.length < 2) return null;
  var prev = arr[arr.length - 2].p;
  var curr = arr[arr.length - 1].p;
  if(curr < prev) return {type:'down', prev: prev, curr: curr, pct: Math.round((1 - curr/prev) * 100)};
  if(curr > prev) return {type:'up', prev: prev, curr: curr, pct: Math.round((curr/prev - 1) * 100)};
  return null;
}

// ── #2: TEMPORIZADOR DE OFERTA EN PRODUCTOS CON BADGE ──
(function(){
  function initTimers(){
    document.querySelectorAll('.prod-badge.badge-sale,.prod-badge.badge-oferta').forEach(function(badge){
      if(badge.dataset.timer) return;
      badge.dataset.timer = 'true';
      // Crear un temporizador de oferta hasta fin del día
      var card = badge.closest('.prod-card');
      if(!card) return;
      var timerEl = document.createElement('div');
      timerEl.style.cssText = 'font-size:.65rem;color:#FF0099;font-weight:700;text-align:center;padding:2px 0;letter-spacing:.04em';
      badge.parentNode.insertBefore(timerEl, badge.nextSibling);
      function updateTimer(){
        var now = new Date();
        var end = new Date(now);
        end.setHours(23,59,59,999);
        var diff = end - now;
        var h = Math.floor(diff/3600000);
        var m = Math.floor((diff%3600000)/60000);
        var s = Math.floor((diff%60000)/1000);
        timerEl.textContent = '⏰ '+h+'h '+m+'m '+s+'s';
      }
      updateTimer();
      setInterval(updateTimer, 1000);
    });
  }
  // Ejecutar después de que se rendericen las cards
  setTimeout(initTimers, 2000);
  // Re-ejecutar si se cargan nuevos productos
  var origRenderAll2 = renderAll;
  renderAll = function(){
    origRenderAll2();
    setTimeout(initTimers, 500);
  };
})();

// ── APLICAR FILTRO POR PRECIO BADGE EN applyFilters ──
(function(){
  var origApply2 = applyFilters;
  applyFilters = function(){
    origApply2();
    // Filtro adicional por badge de precio
    if(_precioBadgeMax < 999999){
      var lastBadgeBtn = document.querySelector('.precio-badge[data-max="100001"]');
      var isOverFilter = lastBadgeBtn && lastBadgeBtn.classList.contains('active');
      document.querySelectorAll('.prod-card').forEach(function(card){
        if(card.style.display === 'none') return;
        var pid = card.dataset.id;
        var p = getProduct(pid);
        if(!p) return;
        if(isOverFilter){
          if(p.price < 100000) card.style.display = 'none';
        } else {
          if(p.price > _precioBadgeMax) card.style.display = 'none';
        }
      });
    }
  };
})();

// ── Card compacta (mobile): tocar cualquier parte de la card abre el modal ──
// Los controles internos (sabor, +/−, agregar, favorito, galería) siguen funcionando.
(function(){
  var grid = document.getElementById('productsGrid');
  if(!grid || grid._modalTapBound) return;
  grid._modalTapBound = true;
  grid.addEventListener('click', function(e){
    // No interferir con controles interactivos ni con la galería de imágenes
    if(e.target.closest('button, select, input, a, .flavor-select, .qty-wrap, .add-cart-btn, .fav-btn, .gal-btn, .gal-dot, .gallery-slides')) return;
    var card = e.target.closest('.prod-card');
    if(!card) return;
    var pid = card.dataset.id;
    if(pid && typeof openProdModal === 'function') openProdModal(pid);
  });
})();
