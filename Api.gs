// ============================================================
//  MAXUP — API.gs (v2 — corregido)
//  Reemplazar el contenido de Api.gs con este código
//  Luego: Implementar → Administrar implementaciones →
//         ✏️ Editar → Nueva versión → Imper-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">📲 Escribinos por WhatsApp</a>' +
            '<p><a href="' + urlWeb + '" style="color:#00C8FF">🌐 Ver catálogo completo</a></p>' +
            '<p style="color:#888;font-size:12px;margin-top:24px">MAXUP Suplementos — maxupsuplementos.com.ar</p>' +
            '</div>'
        });
      } catch(e) { Logger.log('Error email bienvenida: ' + e.message); }
    }

    hojaCli.getRange(cli.fila, colBienvenida + 1).setValue(Utilities.formatDate(hoy, zona, 'dd/MM/yyyy'));
  }

  _notificarTelegram(msgTelegram);
}

// ════════════════════════════════════════════════════════════
//  AUTOMATIZACIÓN: CONTENIDO DIARIO PARA REDES SOCIALES
// ════════════════════════════════════════════════════════════

var HOJA_HISTORIAL_PUBLICACIONES = '_HISTORIAL_PUBLICACIONES';

function _normalizarPublicacionDiaria(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function _clavePublicacionDiaria(marca, nombre) {
  return _normalizarPublicacionDiaria(marca) + '||' + _normalizarPublicacionDiaria(nombre);
}

function _hojaHistorialPublicaciones() {
  var ss = _getSS();
  var hoja = ss.getSheetByName(HOJA_HISTORIAL_PUBLICACIONES);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA_HISTORIAL_PUBLICACIONES);
    hoja.getRange(1, 1, 1, 5).setValues([['Tipo','Clave producto','Firma publicación','Fecha','Producto']]);
    hoja.getRange(1, 1, 1, 5).setFontWeight('bold');
    try { hoja.hideSheet(); } catch(e) {}
  }
  return hoja;
}

function _leerHistorialPublicaciones(tipo) {
  var historial = {};
  var inicializado = false;
  try {
    var hoja = _hojaHistorialPublicaciones();
    if (hoja.getLastRow() < 2) return historial;
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 5).getValues().forEach(function(r) {
      if (String(r[0] || '') !== tipo || !String(r[1] || '')) return;
      inicializado = true;
      var fecha = r[3] instanceof Date ? r[3] : new Date(r[3]);
      historial[String(r[1])] = { firma: String(r[2] || ''), fecha: isNaN(fecha.getTime()) ? 0 : fecha.getTime() };
    });
  } catch(e) {
    Logger.log('Historial de publicaciones: ' + e.message);
  }
  historial.__inicializado = inicializado;
  return historial;
}

function _guardarHistorialPublicaciones(tipo, publicaciones, fecha) {
  if (!publicaciones || !publicaciones.length) return;
  try {
    var hoja = _hojaHistorialPublicaciones();
    var filas = publicaciones.map(function(p) {
      return [tipo, p.clave, p.firma || '', fecha || new Date(), p.nombre || ''];
    });
    hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, 5).setValues(filas);
  } catch(e) {
    Logger.log('No se pudo guardar el historial de publicaciones: ' + e.message);
  }
}

function _seleccionarProductosEstadosDiarios(cantidad, fecha) {
  try {
    sincronizarFichasPublicaciones();
  } catch(e) {
    Logger.log('Estados diarios: no se pudo sincronizar FICHAS_PUBLICACIONES: ' + e.message);
  }
  var catalogo = getCatalogo();
  var productos = (catalogo && catalogo.productos ? catalogo.productos : []).filter(function(p) {
    var categoria = String(p.categoria || '').toLowerCase().trim();
    return Number(p.stock || 0) > 0 &&
      Number(p.precio_venta || p.precio || 0) > 0 &&
      String(p.imagen_url || '').trim() !== '' &&
      categoria !== 'quimicos';
  });
  if (!productos.length) return [];

  function normalizar(value) { return _normalizarPublicacionDiaria(value); }
  function clave(marca, nombre) {
    return _clavePublicacionDiaria(marca, nombre);
  }

  var fechaBase = fecha || new Date();
  var desde = new Date(fechaBase.getTime() - 30 * 86400000);
  var ventasPorClave = {};
  var ventasPorNombre = {};
  var lotes = {};
  var ss = _getSS();

  // Ventas reales de los últimos 30 días para todos los productos.
  try {
    var hojaVD = ss.getSheetByName('VentasDiarias');
    if (hojaVD && hojaVD.getLastRow() > 1) {
      var ventasRows = hojaVD.getDataRange().getValues();
      for (var v = 1; v < ventasRows.length; v++) {
        var fechaVenta = ventasRows[v][0];
        if (!fechaVenta || typeof fechaVenta === 'string') continue;
        var fv = new Date(fechaVenta);
        if (isNaN(fv.getTime()) || fv < desde || fv > fechaBase) continue;
        var nombreVenta = String(ventasRows[v][1] || '').trim();
        var marcaVenta = String(ventasRows[v][2] || '').trim();
        var cantidadVenta = Number(ventasRows[v][3]) || 0;
        if (!nombreVenta || cantidadVenta <= 0) continue;
        var claveVenta = clave(marcaVenta, nombreVenta);
        ventasPorClave[claveVenta] = (ventasPorClave[claveVenta] || 0) + cantidadVenta;
        var nombreNormalizado = normalizar(nombreVenta);
        ventasPorNombre[nombreNormalizado] = (ventasPorNombre[nombreNormalizado] || 0) + cantidadVenta;
      }
    }
  } catch(e) {
    Logger.log('Estados diarios: no se pudieron leer ventas de 30 días: ' + e.message);
  }

  // Refrescar y leer la hoja que concentra vencimientos, stock y rotación.
  try {
    actualizarAnalisisOfertas();
    var hojaAO = ss.getSheetByName('ANALISIS_OFERTAS');
    if (hojaAO && hojaAO.getLastRow() > 1) {
      var analisisRows = hojaAO.getDataRange().getValues();
      for (var a = 1; a < analisisRows.length; a++) {
        var nombreLote = String(analisisRows[a][0] || '').replace(/\s*\[Vence:.*\]\s*$/i, '').trim();
        var marcaLote = String(analisisRows[a][1] || '').trim();
        var stockLote = Number(analisisRows[a][2]) || 0;
        var diasValor = analisisRows[a][4];
        if (!nombreLote || stockLote <= 0 || diasValor === '' || diasValor === null) continue;
        var dias = Number(diasValor);
        if (isNaN(dias)) continue;
        var claveLote = clave(marcaLote, nombreLote);
        if (!lotes[claveLote]) lotes[claveLote] = { vigente: false, vencido: false, dias: 999999 };
        if (dias < 0) {
          lotes[claveLote].vencido = true;
        } else {
          lotes[claveLote].vigente = true;
          if (dias < lotes[claveLote].dias) lotes[claveLote].dias = dias;
        }
      }
    }
  } catch(e) {
    Logger.log('Estados diarios: no se pudo actualizar ANALISIS_OFERTAS: ' + e.message);
  }

  var zona = 'America/Argentina/Buenos_Aires';
  var semilla = Utilities.formatDate(fechaBase, zona, 'yyyyMMdd');
  var historialEstados = _leerHistorialPublicaciones('ESTADO');
  var historialEstadosInicializado = !!historialEstados.__inicializado;
  var baselineUrgentes = [];

  productos = productos.filter(function(p) {
    var estado = lotes[clave(p.marca, p.nombre)];
    return !(estado && estado.vencido && !estado.vigente);
  });

  productos.forEach(function(p) {
    var claveProducto = clave(p.marca, p.nombre);
    var estado = lotes[claveProducto];
    var ventas = ventasPorClave[claveProducto];
    if (typeof ventas === 'undefined') ventas = ventasPorNombre[normalizar(p.nombre)] || 0;
    p._ventas30Estado = Number(ventas) || 0;
    p._diasVencimientoEstado = estado && estado.vigente ? estado.dias : 999999;
    p._urgenteEstado = p._diasVencimientoEstado <= 90;
    p._descuentoEstado = p._diasVencimientoEstado <= 20 ? 20 : p._diasVencimientoEstado <= 30 ? 15 : p._diasVencimientoEstado <= 50 ? 10 : 0;
    p._firmaPublicacionEstado = p._urgenteEstado ? 'URGENCIA-' + p._descuentoEstado : 'INFORMATIVA';
    p._historialPublicacionEstado = historialEstados[claveProducto] || null;
    p._cambioPublicacionEstado = historialEstadosInicializado && (!p._historialPublicacionEstado ||
      (p._urgenteEstado && p._historialPublicacionEstado.firma !== p._firmaPublicacionEstado));
    p._bloqueadoPublicacionEstado = p._urgenteEstado && !p._cambioPublicacionEstado;
    p._ultimaPublicacionEstado = p._historialPublicacionEstado ? p._historialPublicacionEstado.fecha : 0;
    if (!historialEstadosInicializado && p._urgenteEstado) {
      baselineUrgentes.push({ clave: claveProducto, firma: p._firmaPublicacionEstado, nombre: p.nombre });
    }

    var textoHash = semilla + '|' + claveProducto;
    var hash = 2166136261;
    for (var h = 0; h < textoHash.length; h++) {
      hash ^= textoHash.charCodeAt(h);
      hash = Math.imul(hash, 16777619);
    }
    p._rotacionEstado = hash >>> 0;
    p._motivoEstado = p._urgenteEstado
      ? 'vence en ' + p._diasVencimientoEstado + ' días'
      : (p._ventas30Estado === 0 ? 'sin ventas en 30 días' : p._ventas30Estado + ' ventas en 30 días');
  });

  productos.sort(function(a, b) {
    // Urgentes nuevos o cuyo descuento cambió primero. Los productos normales
    // que nunca salieron van después y luego rotan desde el menos reciente.
    var grupoA = a._urgenteEstado ? (a._cambioPublicacionEstado ? 0 : 3) : (a._historialPublicacionEstado ? 2 : 1);
    var grupoB = b._urgenteEstado ? (b._cambioPublicacionEstado ? 0 : 3) : (b._historialPublicacionEstado ? 2 : 1);
    if (grupoA !== grupoB) return grupoA - grupoB;
    if (grupoA === 2 && a._ultimaPublicacionEstado !== b._ultimaPublicacionEstado) {
      return a._ultimaPublicacionEstado - b._ultimaPublicacionEstado;
    }
    if (a._urgenteEstado !== b._urgenteEstado) return a._urgenteEstado ? -1 : 1;
    if (a._urgenteEstado && a._diasVencimientoEstado !== b._diasVencimientoEstado) {
      return a._diasVencimientoEstado - b._diasVencimientoEstado;
    }
    if (a._ventas30Estado !== b._ventas30Estado) return a._ventas30Estado - b._ventas30Estado;
    var stockDiff = Number(b.stock || 0) - Number(a.stock || 0);
    if (stockDiff !== 0) return stockDiff;
    return a._rotacionEstado - b._rotacionEstado;
  });

  // Los urgentes que hoy ya aparecen repetidos se registran silenciosamente
  // como publicados. Así, desde la primera ejecución salen otros productos.
  if (!historialEstadosInicializado && baselineUrgentes.length) {
    _guardarHistorialPublicaciones('ESTADO', baselineUrgentes, fechaBase);
  }

  // Un urgente ya publicado queda afuera hasta que cambie su descuento.
  return productos.filter(function(p) { return !p._bloqueadoPublicacionEstado; }).slice(0, cantidad);
}

function _crearEnlaceEstadosDiarios(productos, fecha) {
  var zona = 'America/Argentina/Buenos_Aires';
  var ids = productos.map(function(p) { return String(p.id || p.sku || ''); }).join('|');
  var nombres = productos.map(function(p) { return String(p.nombre || ''); }).join('|');
  var dia = Utilities.formatDate(fecha || new Date(), zona, 'yyyy-MM-dd');
  return 'https://maxupsuplementos.github.io/maxupsuplementos/promo.html' +
    '?modo=diario&ids=' + encodeURIComponent(ids) +
    '&productos=' + encodeURIComponent(nombres) +
    '&fecha=' + encodeURIComponent(dia);
}

function _enviarEnlaceEstadosDiarios(fecha) {
  try {
    var productos = _seleccionarProductosEstadosDiarios(5, fecha);
    if (!productos.length) {
      Logger.log('Estados diarios: no hay productos con stock, precio e imagen');
      return { ok: false, productos: [] };
    }

    var zona = 'America/Argentina/Buenos_Aires';
    var enlace = _crearEnlaceEstadosDiarios(productos, fecha);
    var mensaje = '📸 5 ESTADOS LISTOS — ' + Utilities.formatDate(fecha || new Date(), zona, 'dd/MM') + '\n\n' +
      'Abri este enlace para generar las 5 placas verticales con foto, reseña y beneficios:\n' +
      enlace + '\n\n' +
      productos.map(function(p, i) {
        var motivo = p._motivoEstado ? ' · ' + p._motivoEstado : '';
        return (i + 1) + '. ' + String(p.nombre || '') + (p.marca ? ' — ' + p.marca : '') + motivo;
      }).join('\n') + '\n\n' +
      '✅ Podes guardar o compartir cada placa directamente en WhatsApp.';
    var ofertasActualizadas = productos.filter(function(p) {
      return p._urgenteEstado && p._cambioPublicacionEstado && p._descuentoEstado > 0;
    });
    if (ofertasActualizadas.length) {
      mensaje += '\n\n🔄 FLYERS DE OFERTA NUEVOS O ACTUALIZADOS:\n' + ofertasActualizadas.map(function(p) {
        return '📸 ' + p.nombre + ' -' + p._descuentoEstado + '%: https://maxupsuplementos.github.io/maxupsuplementos/promo.html?q=' +
          encodeURIComponent(p.nombre) + '&desc=' + p._descuentoEstado;
      }).join('\n');
    }
    var enviado = _notificarTelegram(mensaje);
    if (enviado) {
      _guardarHistorialPublicaciones('ESTADO', productos.map(function(p) {
        return { clave: _clavePublicacionDiaria(p.marca, p.nombre), firma: p._firmaPublicacionEstado, nombre: p.nombre };
      }), fecha || new Date());
    }
    return { ok: true, productos: productos, enlace: enlace };
  } catch(e) {
    Logger.log('Error generando enlace de estados diarios: ' + e.message);
    return { ok: false, error: e.message, productos: [] };
  }
}

function generarContenidoRedes() {
  var ss = _getSS();
  var hoy = new Date();
  var zona = 'America/Argentina/Buenos_Aires';
  var diaSemana = hoy.getDay();
  var urlWeb = 'https://maxupsuplementos.com.ar';

  var HASHTAGS_BASE = '#suplementos #fitness #gym #nutricion #salta #argentina #maxup #salud #entrenamiento #proteina';

  var posts = [];
  _enviarEnlaceEstadosDiarios(hoy);

  // ── TIPO 1: OFERTAS POR VENCIMIENTO (Lunes y Jueves)
  if (diaSemana === 1 || diaSemana === 4) {
    var ofertas = _leerOfertasHoja(10);
    var ofertasBuenas = ofertas.filter(function(p) {
      return (p.urgencia === 'critico' || p.urgencia === 'urgente') && p.precioOferta > 0;
    });
    if (ofertasBuenas.length > 0) {
      var top = ofertasBuenas.slice(0, 3);
      var textoIG = '🔥 OFERTAS DE LA SEMANA 🔥\n\n';
      var textoFB = '🔥 ¡OFERTAS IMPERDIBLES en MAXUP! 🔥\n\n';
      var textoTT = '🔥 Ofertas que no vas a encontrar en otro lado 👇\n\n';

      for (var i = 0; i < top.length; i++) {
        var o = top[i];
        var linea = '✅ ' + (o.producto || o.nombre) + '\n' +
          '   💰 $' + _formatoPrecio(o.precioOferta) + ' (antes $' + _formatoPrecio(o.precio) + ')\n' +
          '   📉 ' + o.ahorro + '% OFF\n\n';
        textoIG += linea;
        textoFB += linea;
        textoTT += '• ' + (o.producto || o.nombre) + ' → $' + _formatoPrecio(o.precioOferta) + ' (-' + o.ahorro + '%)\n';
      }

      textoIG += '⚡ Stock limitado\n📲 Pedí por WhatsApp o entrá al catálogo\n🔗 Link en bio\n\n' + HASHTAGS_BASE + ' #ofertas #descuentos #promo';
      textoFB += '⚡ Stock limitado — ¡No te quedes sin el tuyo!\n\n📲 Escribinos por WhatsApp\n🌐 ' + urlWeb;
      textoTT += '\n📲 Link en bio para ver todo\n\n' + HASHTAGS_BASE + ' #ofertas #fyp #viral';

      posts.push({ tipo: '🏷️ OFERTAS', instagram: textoIG, facebook: textoFB, tiktok: textoTT, imagenes: top.map(function(o) { return o.producto || o.nombre; }) });
    }
  }

  // ── TIPO 2: PRODUCTO DESTACADO (Martes y Viernes)
  if (diaSemana === 2 || diaSemana === 5) {
    var hojaVD = ss.getSheetByName('VentasDiarias');
    if (hojaVD) {
      var ventas = hojaVD.getDataRange().getValues();
      var conteo = {};
      var hace30 = new Date(hoy.getTime() - 30 * 86400000);
      for (var v = 1; v < ventas.length; v++) {
        if (!ventas[v][0] || typeof ventas[v][0] === 'string') continue;
        try {
          var fv = new Date(ventas[v][0]);
          if (fv >= hace30) {
            var prod = String(ventas[v][1] || '').trim();
            var cant = Number(ventas[v][3]) || 1;
            if (prod) conteo[prod] = (conteo[prod] || 0) + cant;
          }
        } catch(e) {}
      }
      var ranking = Object.keys(conteo).map(function(k) { return { nombre: k, cant: conteo[k] }; });
      ranking.sort(function(a, b) { return b.cant - a.cant; });

      if (ranking.length > 0) {
        var hojaSup = ss.getSheetByName('SUPLEMENTOS');
        var best = ranking[0];
        var precioInfo = '';
        if (hojaSup) {
          var supData = hojaSup.getDataRange().getValues();
          for (var s = 0; s < supData.length; s++) {
            if (String(supData[s][0]).toLowerCase() === best.nombre.toLowerCase()) {
              precioInfo = '$' + _formatoPrecio(supData[s][1]);
              break;
            }
          }
        }

        var textoIG = '🏆 PRODUCTO MÁS VENDIDO DEL MES 🏆\n\n' +
          '💪 ' + best.nombre + '\n' +
          (precioInfo ? '💰 ' + precioInfo + '\n' : '') +
          '📊 +' + best.cant + ' unidades vendidas este mes\n\n' +
          '¿Por qué es el favorito? Porque funciona. 💯\n\n' +
          '📲 Consultanos por WhatsApp\n🔗 Link en bio\n\n' +
          HASHTAGS_BASE + ' #masvendido #top #recomendado';

        var textoFB = '🏆 EL MÁS VENDIDO DEL MES\n\n' +
          '💪 ' + best.nombre + '\n' +
          (precioInfo ? '💰 ' + precioInfo + '\n' : '') +
          '📊 +' + best.cant + ' unidades vendidas\n\n' +
          'El favorito de nuestros clientes. ¿Ya lo probaste?\n\n' +
          '📲 Pedí el tuyo\n🌐 ' + urlWeb;

        var textoTT = '🏆 El suplemento MÁS VENDIDO del mes 👇\n\n' +
          '💪 ' + best.nombre + '\n' +
          '📊 +' + best.cant + ' vendidos\n' +
          (precioInfo ? '💰 ' + precioInfo + '\n' : '') +
          '\n¿Vos ya lo probaste? 🤔\n\n' +
          HASHTAGS_BASE + ' #masvendido #fyp #viral';

        posts.push({ tipo: '🏆 MÁS VENDIDO', instagram: textoIG, facebook: textoFB, tiktok: textoTT, imagenes: [best.nombre] });
      }
    }
  }

  // ── TIPO 3: TIPS Y EDUCACIÓN (Miércoles)
  if (diaSemana === 3) {
    var tips = [
      { titulo: 'Creatina', texto: '¿Sabías que la creatina es el suplemento con MÁS evidencia científica? 🧬\n\n✅ Mejora fuerza y potencia\n✅ Acelera recuperación\n✅ 3-5g por día es suficiente\n✅ No necesita fase de carga\n✅ Segura a largo plazo\n\n¡Y en MAXUP tenemos las mejores marcas!' },
      { titulo: 'Proteína', texto: '¿Cuánta proteína necesitás por día? 🤔\n\n📊 Sedentario: 0.8g/kg\n🏃 Activo: 1.2-1.6g/kg\n💪 Entrena fuerza: 1.6-2.2g/kg\n🏋️ Competidor: 2.2-2.8g/kg\n\nEjemplo: Si pesás 75kg y entrenás → 120-165g de proteína/día\n\n¡Te ayudamos a elegir la mejor opción!' },
      { titulo: 'Pre-entreno', texto: '⚡ ¿Cuándo tomar tu pre-entreno?\n\n⏰ 20-30 min antes de entrenar\n🚫 No después de las 17hs (puede afectar el sueño)\n💧 Con agua fría para mejor absorción\n📏 Empezá con media dosis si es tu primera vez\n⚠️ No mezclar con café el mismo día\n\n¡Consultanos cuál es el mejor para vos!' },
      { titulo: 'BCAA', texto: '🧬 BCAA: ¿Cuándo sirven realmente?\n\n✅ Entrenás en ayunas → SÍ, protegen músculo\n✅ No llegás a tu cuota de proteína → SÍ, complementan\n❌ Ya tomás whey suficiente → No necesitás extra\n\n💡 Tip: 5-10g antes o durante el entreno\n\n¡En MAXUP te asesoramos sin compromiso!' },
      { titulo: 'Colágeno', texto: '🦴 Colágeno: No es solo para la piel\n\n✅ Protege articulaciones\n✅ Fortalece tendones y ligamentos\n✅ Mejora recuperación post-entreno\n✅ Ideal si entrenás fuerte o tenés +30 años\n\n💡 Tip: Combinalo con Vitamina C para máxima absorción\n\n¡Consultanos!' },
      { titulo: 'Hidratación', texto: '💧 ¿Sabías que un 2% de deshidratación baja tu rendimiento un 20%?\n\n✅ Bebé 500ml 2hs antes de entrenar\n✅ 200ml cada 15-20 min durante\n✅ Reponé electrolitos si sudás mucho\n✅ No esperes a tener sed\n\n¡Tenemos bebidas isotónicas listas para tu entreno!' }
    ];

    var semana = Math.floor(hoy.getDate() / 7);
    var tip = tips[semana % tips.length];

    var textoIG = '💡 TIP MAXUP 💡\n\n' + tip.texto + '\n\n📲 Escribinos por WhatsApp\n🔗 Link en bio\n\n' + HASHTAGS_BASE + ' #tips #consejo #nutricióndeportiva';
    var textoFB = '💡 TIP DEL DÍA\n\n' + tip.texto + '\n\n📲 ¿Dudas? Escribinos\n🌐 ' + urlWeb;
    var textoTT = '💡 ' + tip.titulo + ' — Lo que nadie te dice 👇\n\n' + tip.texto + '\n\n' + HASHTAGS_BASE + ' #tips #fyp #aprendeentiktok';

    posts.push({ tipo: '💡 TIP: ' + tip.titulo, instagram: textoIG, facebook: textoFB, tiktok: textoTT, imagenes: [] });
  }

  // ── TIPO 4: INDUMENTARIA (Sábado)
  if (diaSemana === 6) {
    var hojaInd = ss.getSheetByName('INDUMENTARIA');
    if (hojaInd) {
      var datosInd = hojaInd.getDataRange().getValues();
      var prendas = [];
      var marcaInd = '';
      for (var j = 2; j < datosInd.length; j++) {
        var nombreInd = String(datosInd[j][1] || '').trim();
        var precioInd = Number(datosInd[j][3]) || 0;
        var stockInd = Number(datosInd[j][5]) || 0;
        if (nombreInd && !datosInd[j][2] && precioInd === 0) { marcaInd = nombreInd; continue; }
        if (nombreInd && precioInd > 0 && stockInd > 0) {
          prendas.push({ nombre: nombreInd, marca: marcaInd, precio: precioInd, stock: stockInd });
        }
      }
      if (prendas.length > 0) {
        prendas.sort(function() { return Math.random() - 0.5; });
        var seleccion = prendas.slice(0, 4);

        var textoIG = '👗 INDUMENTARIA DEPORTIVA 👗\n\n';
        var textoFB = '👗 ¡Nueva colección de indumentaria deportiva!\n\n';
        for (var p = 0; p < seleccion.length; p++) {
          var pr = seleccion[p];
          var lineaInd = '• ' + pr.nombre + (pr.marca ? ' (' + pr.marca + ')' : '') + ' — $' + _formatoPrecio(pr.precio) + '\n';
          textoIG += lineaInd;
          textoFB += lineaInd;
        }
        textoIG += '\n💳 Efectivo y tarjeta\n📲 Consultá talles y colores por WhatsApp\n🔗 Link en bio\n\n' + HASHTAGS_BASE + ' #indumentaria #ropaDeportiva #gym #outfit';
        textoFB += '\n💳 Efectivo y tarjeta\n📲 Consultá disponibilidad\n🌐 ' + urlWeb + '/indumentaria.html';

        var textoTT = '👗 Ropa deportiva que necesitás 👇\n\n' +
          seleccion.map(function(pr) { return '• ' + pr.nombre + ' $' + _formatoPrecio(pr.precio); }).join('\n') +
          '\n\n📲 Link en bio\n\n' + HASHTAGS_BASE + ' #ropaDeportiva #fyp #outfit';

        posts.push({ tipo: '👗 INDUMENTARIA', instagram: textoIG, facebook: textoFB, tiktok: textoTT, imagenes: seleccion.map(function(pr) { return pr.nombre; }) });
      }
    }
  }

  // ── TIPO 5: STATS DEL MES (Domingo)
  if (diaSemana === 0) {
    var hojaVD2 = ss.getSheetByName('VentasDiarias');
    if (hojaVD2) {
      var ventasMes = hojaVD2.getDataRange().getValues();
      var totalMes = 0;
      var clientesMes = {};
      var mesActual = hoy.getMonth();
      for (var vm = 1; vm < ventasMes.length; vm++) {
        if (!ventasMes[vm][0] || typeof ventasMes[vm][0] === 'string') continue;
        try {
          var fvm = new Date(ventasMes[vm][0]);
          if (fvm.getMonth() === mesActual) {
            totalMes += Number(ventasMes[vm][3]) || 0;
            var cliNom = String(ventasMes[vm][6] || '').trim();
            if (cliNom) clientesMes[cliNom] = true;
          }
        } catch(e) {}
      }

      var textoIG = '📊 MAXUP EN NÚMEROS 📊\n\n' +
        '💪 +' + totalMes + ' productos entregados este mes\n' +
        '👥 ' + Object.keys(clientesMes).length + ' clientes confían en nosotros\n' +
        '⭐ 100% productos originales\n' +
        '🚀 Envíos a todo Salta\n\n' +
        '¡Gracias por elegirnos! 🙌\n\n' +
        '📲 Unite vos también\n🔗 Link en bio\n\n' + HASHTAGS_BASE + ' #comunidad #resultados';

      var textoFB = '📊 ¡Gracias por elegirnos!\n\n' +
        '💪 +' + totalMes + ' productos entregados este mes\n' +
        '👥 ' + Object.keys(clientesMes).length + ' clientes satisfechos\n\n' +
        '⭐ 100% productos originales y al mejor precio\n\n' +
        '🌐 ' + urlWeb;

      var textoTT = '📊 Lo que logramos este mes 👇\n\n' +
        '💪 +' + totalMes + ' productos entregados\n' +
        '👥 ' + Object.keys(clientesMes).length + ' clientes\n' +
        '⭐ 100% originales\n\n' +
        '¿Todavía no nos probaste? 🤔\n\n' + HASHTAGS_BASE + ' #fyp #viral #emprendimiento';

      posts.push({ tipo: '📊 STATS DEL MES', instagram: textoIG, facebook: textoFB, tiktok: textoTT, imagenes: [] });
    }
  }

  if (posts.length === 0) return;

  var msgTelegram = '📱 CONTENIDO PARA REDES — ' +
    Utilities.formatDate(hoy, zona, 'EEEE dd/MM') + '\n';
  msgTelegram += '━━━━━━━━━━━━━━━━━━━━\n\n';

  for (var idx = 0; idx < posts.length; idx++) {
    var post = posts[idx];
    msgTelegram += '📌 ' + post.tipo + '\n';
    msgTelegram += '━━━━━━━━━━━━━━━━━━━━\n\n';

    msgTelegram += '📸 INSTAGRAM:\n';
    msgTelegram += '─────────────\n';
    msgTelegram += post.instagram + '\n\n';

    msgTelegram += '📘 FACEBOOK:\n';
    msgTelegram += '─────────────\n';
    msgTelegram += post.facebook + '\n\n';

    msgTelegram += '🎵 TIKTOK:\n';
    msgTelegram += '─────────────\n';
    msgTelegram += post.tiktok + '\n\n';

    if (post.imagenes && post.imagenes.length > 0) {
      msgTelegram += '🖼️ Productos para la foto/video: ' + post.imagenes.join(', ') + '\n\n';
    }

    msgTelegram += '━━━━━━━━━━━━━━━━━━━━\n\n';
  }

  msgTelegram += '💡 Tip: Copiá el texto, agregá tu foto/video y publicá.\n';
  msgTelegram += '📷 Usá fotos reales de los productos para mejor engagement.';

  _notificarTelegram(msgTelegram);
}

// ============================================================
//  TRIGGER onEdit — Cambiar estado desde la hoja PEDIDOS
//  Cuando editás la columna J (Estado) en la hoja PEDIDOS,
//  se descuenta stock automáticamente si ponés Entregado/Retirado
// ============================================================
function onEdit(e) {
  try {
    var hoja = e.range.getSheet();
    if (hoja.getName() === 'SUPLEMENTOS') {
      _actualizarPrecioListaTresCuotasEdit(e);
      _actualizarSkuEdit(e);
      return;
    }
    if (hoja.getName() === 'CUPONES') {
      _actualizarCuponEdit(e, true);
      return;
    }
    if (hoja.getName() === 'PEDIDOS') _colorearEstadoPedido(e);
  } catch(err) {
    Logger.log('onEdit error: ' + err.message);
  }
}

// Los activadores simples no pueden usar UrlFetchApp ni abrir la planilla por ID.
// Este handler se instala una sola vez y ejecuta los cambios de stock/ventas/Telegram
// con los permisos de la cuenta propietaria.
function onEditPedidosAutorizado(e) {
  try {
    var hoja = e.range.getSheet();
    if (hoja.getName() === 'CUPONES') {
      _actualizarCuponEdit(e, false);
      return;
    }
    if (hoja.getName() !== 'PEDIDOS') return;

    var rango = e.range;
    var col = rango.getColumn();
    var fila = rango.getRow();
    if (col !== 10 || fila < 2) return;

    var nuevoEstado = String(e.value || '').trim();
    var estadoAnterior = String(e.oldValue || '').trim();
    var estadosFinales = ['Entregado', 'Retirado'];

    if (estadosFinales.indexOf(nuevoEstado) >= 0 && estadosFinales.indexOf(estadoAnterior) < 0) {
      var rowData = hoja.getRange(fila, 1, 1, 11).getValues()[0];
      var codigo = String(rowData[0]);
      var cliente = String(rowData[2]);
      var itemsJSON = String(rowData[10] || '[]');
      try {
        var items = JSON.parse(itemsJSON);
        var resultadoStock = _descontarStockPedido(items, codigo);
        if (!resultadoStock.ok) {
          hoja.getRange(fila, 10).setValue(estadoAnterior || 'Recibido');
          _registrarAuditoria('STOCK BLOQUEADO', codigo + ': ' + (resultadoStock.errores || []).join('; '), 'edicion Sheets');
          _notificarTelegram('⚠️ ' + codigo + ': no se cambio el estado. ' + (resultadoStock.errores || []).join('; '));
          return;
        }
        _notificarTelegram('✅ ' + codigo + ' → ' + nuevoEstado + ' (' + cliente + ')' + String.fromCharCode(10) + '📦 Stock descontado y venta anotada');
      } catch(eJSON) {
        _notificarTelegram('⚠️ ' + codigo + ' → ' + nuevoEstado + ' (' + cliente + ')' + String.fromCharCode(10) + '❌ No se pudo descontar stock');
      }
      _registrarVentaPedidoWeb(codigo);
      _registrarAuditoria('ESTADO PEDIDO', codigo + ': ' + estadoAnterior + ' -> ' + nuevoEstado, 'edicion Sheets');
    }

    if (nuevoEstado === 'Cancelado' && estadoAnterior !== 'Cancelado') {
      var codigoCanc = String(hoja.getRange(fila, 1).getValue());
      try { _revertirVentaPedidoWeb(codigoCanc, estadoAnterior); } catch(eRev) {
        Logger.log('Error revirtiendo venta de ' + codigoCanc + ': ' + eRev.message);
      }
      try { _actualizarEstadoUsoCupon(codigoCanc, 'Cancelado'); } catch(eCup) {
        Logger.log('Error liberando cupon de ' + codigoCanc + ': ' + eCup.message);
      }
    }

    _colorearEstadoPedido(e);
  } catch(err) {
    Logger.log('onEditPedidosAutorizado error: ' + err.message);
  }
}

function _colorearEstadoPedido(e) {
  var rango = e.range;
  if (rango.getColumn() !== 10 || rango.getRow() < 2) return;
  var nuevoEstado = String(e.value || '').trim();
  var colores = {
    'Recibido': '#FFF3CD',
    'En preparación': '#CCE5FF',
    'Listo para retirar': '#D4EDDA',
    'Enviado': '#D1ECF1',
    'Entregado': '#C3E6CB',
    'Retirado': '#C3E6CB',
    'Cancelado': '#F5C6CB'
  };
  if (colores[nuevoEstado]) rango.setBackground(colores[nuevoEstado]).setFontColor('#000');
}

function instalarTriggerEdicionPedidos() {
  var ss = _getSS();
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onEditPedidosAutorizado') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('onEditPedidosAutorizado').forSpreadsheet(ss).onEdit().create();
  Logger.log('Trigger autorizado de PEDIDOS instalado correctamente');
}

// ============================================================
//  SETUP: Crear desplegable de estados en hoja PEDIDOS
//  Ejecutar UNA VEZ para configurar
// ============================================================
function setupPedidos() {
  var ss = _getSS();
  var hoja = ss.getSheetByName('PEDIDOS');
  if (!hoja) { Logger.log('Hoja PEDIDOS no encontrada'); return; }

  var headers = hoja.getRange(1, 1, 1, 11).getValues()[0];
  if (!headers[10] || headers[10] !== 'Items JSON') {
    hoja.getRange(1, 11).setValue('Items JSON').setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#00C8FF');
  }
  hoja.hideColumns(11);

  var ultimaFila = Math.max(hoja.getLastRow(), 100);
  var regla = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Recibido','En preparación','Listo para retirar','Enviado','Entregado','Retirado','Cancelado'], true)
    .setAllowInvalid(false)
    .build();
  hoja.getRange(2, 10, ultimaFila - 1, 1).setDataValidation(regla);
  hoja.setColumnWidth(10, 150);

  Logger.log('✅ PEDIDOS configurado con desplegable de estados');
}

// ── DASHBOARD ─────────────────────────────────────────────────
function adminGetDashboard(clave) {
  _validarClave(clave);
  var ss = _getSS();
  var hojaVD = ss.getSheetByName('VentasDiarias');
  if (!hojaVD) return { ok: true, semana: 0, mes: 0, pedidosMes: 0, ticketProm: 0, topProductos: [], topMarcas: [], ultimos7: [] };

  var hoy = new Date();
  var tz = 'America/Argentina/Buenos_Aires';
  var rows = hojaVD.getDataRange().getValues();

  // Calcular fechas de referencia
  var hace7 = new Date(hoy); hace7.setDate(hace7.getDate() - 7);
  var primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  var totalSemana = 0, totalMes = 0, ventasMes = 0;
  var prodMap = {}, marcaMap = {};
  var dias = {}; // dd/MM → total

  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0] || typeof rows[i][0] === 'string') continue;
    var fecha;
    try { fecha = new Date(rows[i][0]); } catch(e) { continue; }
    var monto = Number(rows[i][5]) || 0;
    var nombre = String(rows[i][1] || '');
    var marca = String(rows[i][2] || '');
    var cantidad = Number(rows[i][3]) || 1;

    // Este mes
    if (fecha >= primerDiaMes) {
      totalMes += monto;
      ventasMes++;
      // Top productos
      if (nombre) {
        if (!prodMap[nombre]) prodMap[nombre] = { nombre: nombre, marca: marca, cantidad: 0, total: 0 };
        prodMap[nombre].cantidad += cantidad;
        prodMap[nombre].total += monto;
      }
      // Top marcas
      if (marca) {
        if (!marcaMap[marca]) marcaMap[marca] = { marca: marca, total: 0 };
        marcaMap[marca].total += monto;
      }
    }

    // Esta semana
    if (fecha >= hace7) {
      totalSemana += monto;
    }

    // Últimos 7 días (para gráfico)
    if (fecha >= hace7) {
      var diaKey = Utilities.formatDate(fecha, tz, 'dd/MM');
      if (!dias[diaKey]) dias[diaKey] = 0;
      dias[diaKey] += monto;
    }
  }

  // Armar array de últimos 7 días
  var ultimos7 = [];
  for (var d = 6; d >= 0; d--) {
    var dia = new Date(hoy); dia.setDate(dia.getDate() - d);
    var key = Utilities.formatDate(dia, tz, 'dd/MM');
    var diaNombre = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][dia.getDay()];
    ultimos7.push({ dia: diaNombre + ' ' + key, total: dias[key] || 0 });
  }

  // Top productos (ordenar por total, top 10)
  var topProductos = Object.values(prodMap);
  topProductos.sort(function(a,b){ return b.total - a.total; });
  if (topProductos.length > 10) topProductos.length = 10;

  // Top marcas (ordenar por total, top 5)
  var topMarcas = Object.values(marcaMap);
  topMarcas.sort(function(a,b){ return b.total - a.total; });
  if (topMarcas.length > 5) topMarcas.length = 5;

  // Pedidos web del mes
  var pedidosMes = 0;
  var hojaPed = ss.getSheetByName('PEDIDOS');
  if (hojaPed && hojaPed.getLastRow() > 1) {
    var rowsPed = hojaPed.getDataRange().getValues();
    for (var j = 1; j < rowsPed.length; j++) {
      if (!rowsPed[j][1]) continue;
      try {
        var fPed = new Date(rowsPed[j][1]);
        if (fPed >= primerDiaMes) pedidosMes++;
      } catch(e) {}
    }
  }

  return {
    ok: true,
    semana: totalSemana,
    mes: totalMes,
    pedidosMes: pedidosMes,
    ticketProm: ventasMes > 0 ? Math.round(totalMes / ventasMes) : 0,
    topProductos: topProductos,
    topMarcas: topMarcas,
    ultimos7: ultimos7
  };
}

// ── MANTENIMIENTO ─────────────────────────────────────────────
function getMantenimiento() {
  var props = PropertiesService.getScriptProperties();
  var activo = props.getProperty('MANT_ACTIVO') === 'true';
  var mensaje = props.getProperty('MANT_MENSAJE') || '';
  return { ok: true, activo: activo, mensaje: mensaje };
}

function adminMantenimiento(claveIn, activoIn, mensajeIn) {
  _validarSesionAdmin(claveIn);
  var props = PropertiesService.getScriptProperties();
  if (typeof activoIn !== 'undefined' && activoIn !== null) {
    var activo = (activoIn === 'true' || activoIn === '1');
    props.setProperty('MANT_ACTIVO', activo ? 'true' : 'false');
    if (mensajeIn) props.setProperty('MANT_MENSAJE', mensajeIn);
    if (!activo) props.setProperty('MANT_MENSAJE', '');
    _registrarAuditoria('MANTENIMIENTO', activo ? 'Activado' : 'Desactivado', 'administracion');
    return { ok: true, activo: activo, mensaje: activo ? (mensajeIn || props.getProperty('MANT_MENSAJE') || '') : '' };
  }
  // Solo consultar estado
  return getMantenimiento();
}

// ── HISTORIAL DE PEDIDOS POR CLIENTE ────────────────────────
function getHistorialCliente(telefono) {
  if (!telefono || telefono.length < 8) return { ok: false, error: 'Teléfono inválido' };
  try {
    var ss = _getSS();
    var sheet = ss.getSheetByName('Pedidos');
    if (!sheet) return { ok: false, error: 'Hoja no encontrada' };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var colTel = -1, colCodigo = -1, colEstado = -1, colFecha = -1, colTotal = -1;
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i]).toLowerCase().trim();
      if (h === 'telefono' || h === 'whatsapp' || h === 'celular') colTel = i;
      if (h === 'codigo' || h === 'código' || h === 'pedido') colCodigo = i;
      if (h === 'estado') colEstado = i;
      if (h === 'fecha') colFecha = i;
      if (h === 'total') colTotal = i;
    }
    if (colTel < 0) return { ok: false, error: 'No se encontró columna teléfono' };

    var telLimpio = telefono.replace(/[^0-9]/g, '');
    var pedidos = [];
    var totalGastado = 0;

    for (var r = 1; r < data.length; r++) {
      var rowTel = String(data[r][colTel] || '').replace(/[^0-9]/g, '');
      if (rowTel.length >= 8 && (rowTel.indexOf(telLimpio) >= 0 || telLimpio.indexOf(rowTel) >= 0)) {
        var total = colTotal >= 0 ? Number(data[r][colTotal]) || 0 : 0;
        totalGastado += total;
        pedidos.push({
          codigo: colCodigo >= 0 ? String(data[r][colCodigo]) : 'N/A',
          estado: colEstado >= 0 ? String(data[r][colEstado]) : 'desconocido',
          fecha:  colFecha >= 0 ? Utilities.formatDate(new Date(data[r][colFecha]), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy') : '',
          total:  total
        });
      }
    }

    // Calcular puntos: $1.000 = 1 punto
    var puntos = Math.floor(totalGastado / 1000);

    return {
      ok: true,
      pedidos: pedidos.reverse().slice(0, 20),
      puntos: puntos,
      totalGastado: totalGastado
    };
  } catch(err) {
    return { ok: false, error: err.message };
  }
}

// ── PUNTOS DEL CLIENTE ──────────────────────────────────────
function getPuntosCliente(telefono) {
  if (!telefono || telefono.length < 8) return { ok: false, puntos: 0 };
  try {
    var result = getHistorialCliente(telefono);
    return { ok: true, puntos: result.puntos || 0, totalGastado: result.totalGastado || 0 };
  } catch(err) {
    return { ok: false, puntos: 0 };
  }
}

// ============================================================
//  ASISTENTE DE WHATSAPP (PRUEBA GRATUITA POR REGLAS)
// ============================================================
// Usa el WhatsApp oficial 387-6233406 mediante Cloud API de Meta. No consume
// servicios de IA pagos y no modifica los pedidos ni el stock.
var WA_TTL_ESTADO = 21600; // 6 horas, maximo de CacheService
var WA_RESPUESTAS_HEADERS = ['Tema','Palabras clave','Respuesta de MAXUP','Activo','Prioridad'];

function _waAsegurarRespuestasMaxup() {
  var ss = _getSS();
  var hoja = ss.getSheetByName('ASISTENTE_RESPUESTAS');
  if (hoja) return hoja;
  hoja = ss.insertSheet('ASISTENTE_RESPUESTAS');
  hoja.getRange(1,1,1,WA_RESPUESTAS_HEADERS.length).setValues([WA_RESPUESTAS_HEADERS]);
  hoja.getRange(2,4,4,1).insertCheckboxes();
  hoja.getRange(2,1,4,WA_RESPUESTAS_HEADERS.length).setValues([
    ['Originalidad','original,originales,son originales','Trabajamos con productos originales adquiridos a distribuidores y marcas habilitadas. Podés revisar el envase, lote, vencimiento y registro correspondiente al recibirlo.',true,10],
    ['Como comprar','como compro,hacer pedido,quiero comprar','Podés armar el carrito desde maxupsuplementos.com.ar y enviarnos el pedido por WhatsApp. Confirmamos stock, forma de pago y entrega antes de cerrarlo.',true,9],
    ['Recomendacion','que me recomendas,recomendame,no se cual elegir','Contame cuál es tu objetivo, si entrenás y qué producto estabas considerando. Puedo mostrarte opciones y beneficios generales; para una recomendación personalizada te comunico con una persona.',true,8],
    ['Atencion humana','quiero asesoramiento,necesito ayuda','Claro. Contame brevemente qué necesitás y, si hace falta una recomendación personal, aviso al equipo de MAXUP para que continúe la conversación.',true,7]
  ]);
  hoja.getRange(1,1,1,WA_RESPUESTAS_HEADERS.length).setFontWeight('bold').setBackground('#111827').setFontColor('#00C8FF');
  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1,WA_RESPUESTAS_HEADERS.length);
  return hoja;
}

function configurarAsistenteWhatsApp() {
  var hoja = _waAsegurarRespuestasMaxup();
  return {ok:true,hoja:hoja.getName(),respuestas:Math.max(0,hoja.getLastRow()-1),mensaje:'El asistente usa esta hoja para responder con el estilo de MAXUP.'};
}

function _waRespuestaPersonalizada(normal) {
  try {
    var hoja = _waAsegurarRespuestasMaxup();
    if (hoja.getLastRow()<2) return '';
    var filas=hoja.getRange(2,1,hoja.getLastRow()-1,WA_RESPUESTAS_HEADERS.length).getValues();
    var mejor='',mejorPuntaje=-1;
    filas.forEach(function(r){
      var activa=r[3]===true || /^(si|true|activo|1)$/i.test(String(r[3]||''));
      if(!activa || !String(r[2]||'').trim()) return;
      var prioridad=Number(r[4])||0,puntaje=-1;
      String(r[1]||'').split(/[,;|\n]+/).forEach(function(frase){
        var clave=_waNormalizar(frase);
        if(clave && normal.indexOf(clave)>=0) puntaje=Math.max(puntaje,prioridad*100+clave.length);
      });
      if(puntaje>mejorPuntaje){mejorPuntaje=puntaje;mejor=String(r[2]||'').trim();}
    });
    return mejor;
  } catch(e) {
    Logger.log('Asistente respuestas: '+e.message);
    return '';
  }
}

function _verificarWebhookWhatsApp(e) {
  var p = (e && e.parameter) || {};
  var tokenEsperado = String(_getConfig().WA_VERIFY_TOKEN || '');
  var tokenRecibido = String(p['hub.verify_token'] || '');
  var modo = String(p['hub.mode'] || '');
  if (tokenEsperado && modo === 'subscribe' && tokenRecibido === tokenEsperado) {
    return ContentService.createTextOutput(String(p['hub.challenge'] || ''));
  }
  return ContentService.createTextOutput('Verificacion rechazada');
}

function _procesarWebhookWhatsApp(payload) {
  var cfg = _getConfig();
  var cache = CacheService.getScriptCache();
  var recibidos = 0;
  var entry = (payload && payload.entry) || [];

  for (var i = 0; i < entry.length; i++) {
    var changes = entry[i].changes || [];
    for (var j = 0; j < changes.length; j++) {
      var value = changes[j].value || {};
      var phoneId = String((value.metadata && value.metadata.phone_number_id) || '');
      if (cfg.WA_PHONE_ID && phoneId && phoneId !== String(cfg.WA_PHONE_ID)) continue;

      var messages = value.messages || [];
      for (var m = 0; m < messages.length; m++) {
        var mensaje = messages[m] || {};
        var messageId = String(mensaje.id || '');
        if (messageId && cache.get('WA_MSG_' + _hashSeguro(messageId))) continue;
        if (messageId) cache.put('WA_MSG_' + _hashSeguro(messageId), '1', WA_TTL_ESTADO);

        var telefono = String(mensaje.from || '').replace(/\D/g, '');
        if (!telefono) continue;
        recibidos++;
        _waRegistrarDiagnostico('MENSAJE_RECIBIDO', telefono, 'Meta entrego correctamente el mensaje al asistente.');

        try {
          if (!_waPermitirMensaje(telefono)) continue;
          var texto = _waTextoEntrante(mensaje);
          if (!texto) {
            _enviarWhatsAppTexto(telefono, 'Por ahora puedo leer mensajes de texto. Escribi *menu* para ver las opciones.');
            continue;
          }
          var respuesta = _resolverAsistenteWhatsApp(telefono, texto);
          if (respuesta) _enviarWhatsAppTexto(telefono, respuesta);
        } catch (errMensaje) {
          _waRegistrarDiagnostico('ERROR_AL_RESPONDER', telefono, errMensaje.message);
          Logger.log('WhatsApp: no se pudo procesar un mensaje (' + errMensaje.message + ')');
        }
      }
    }
  }
  return { ok: true, recibidos: recibidos };
}

function _waTextoEntrante(mensaje) {
  if (mensaje.type === 'text' && mensaje.text) return String(mensaje.text.body || '').trim();
  if (mensaje.type === 'button' && mensaje.button) return String(mensaje.button.text || '').trim();
  if (mensaje.type === 'interactive' && mensaje.interactive) {
    var inter = mensaje.interactive;
    if (inter.button_reply) return String(inter.button_reply.title || inter.button_reply.id || '').trim();
    if (inter.list_reply) return String(inter.list_reply.title || inter.list_reply.id || '').trim();
  }
  return '';
}

function _waPermitirMensaje(telefono) {
  var cache = CacheService.getScriptCache();
  var key = 'WA_RATE_' + _hashSeguro(telefono);
  var cantidad = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(cantidad), 600);
  if (cantidad === 21) {
    try { _enviarWhatsAppTexto(telefono, 'Recibi muchos mensajes seguidos. Espera unos minutos o pedi hablar con una persona.'); } catch (e) {}
  }
  return cantidad <= 20;
}

function _waNormalizar(texto) {
  return String(texto || '').toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function _waMenu() {
  return 'Hola! Soy *Max*, el asistente virtual de *MAXUP*.\n\n'
    + 'Puedo ayudarte con:\n'
    + '*1* - Buscar producto, beneficios, stock y precio\n'
    + '*2* - Consultar el estado de un pedido\n'
    + '*3* - Medios de pago y 3 cuotas\n'
    + '*4* - Envios y retiro\n'
    + '*5* - Hablar con una persona\n\n'
    + 'Responde con un numero. En cualquier momento escribi *menu* para volver a este menu principal.';
}

function _waEsConsultaGeneralCatalogo(normal) {
  normal = _waNormalizar(normal);
  return /viendo (el |su )?catalogo/.test(normal)
    || /(?:mas|mayor) (?:info|informacion).*(?:productos|catalogo).*(?:precio|precios)/.test(normal)
    || /asesoramiento general.*(?:producto|catalogo|precio)/.test(normal)
    || (/(?:producto|productos|catalogo)/.test(normal) && /asesor|orientar|recomendar/.test(normal) && /precio|precios|info|informacion/.test(normal));
}

function _waRespuestaCatalogoGeneral() {
  return '¡Claro! Soy *Max* y te asesoro para encontrar una opción con stock.\n\n'
    + 'Decime qué querés ver:\n'
    + '• *proteínas*\n'
    + '• *creatinas*\n'
    + '• *aminoácidos*\n'
    + '• *pre entrenos*\n'
    + '• *colágenos o vitaminas*\n'
    + '• *snacks, shakers o accesorios*\n\n'
    + 'También podés mandarme el nombre o la marca de un producto. Te voy a mostrar solamente opciones disponibles, con precio y beneficios.';
}

function _waClaveEstado(telefono) {
  return 'WA_STATE_' + _hashSeguro(telefono);
}

function _waLeerEstado(telefono) {
  try {
    var raw = CacheService.getScriptCache().get(_waClaveEstado(telefono));
    return raw ? JSON.parse(raw) : { paso: 'MENU' };
  } catch (e) {
    return { paso: 'MENU' };
  }
}

function _waGuardarEstado(telefono, paso) {
  CacheService.getScriptCache().put(
    _waClaveEstado(telefono),
    JSON.stringify({ paso: paso, fecha: new Date().toISOString() }),
    WA_TTL_ESTADO
  );
}

function _waLimpiarEstado(telefono) {
  CacheService.getScriptCache().remove(_waClaveEstado(telefono));
  CacheService.getScriptCache().remove('WA_RESULTS_' + _hashSeguro(telefono));
}

function _waGuardarResultadosProductos(telefono, coincidencias) {
  var referencias=(coincidencias||[]).slice(0,30).map(function(item){
    var p=item.p||item;
    return {id:String(p.id||''),sku:String(p.sku||''),marca:String(p.marca||''),nombre:String(p.nombre||'')};
  });
  CacheService.getScriptCache().put('WA_RESULTS_'+_hashSeguro(telefono),JSON.stringify(referencias),WA_TTL_ESTADO);
}

function _waProductoElegido(telefono, numero) {
  try {
    var raw=CacheService.getScriptCache().get('WA_RESULTS_'+_hashSeguro(telefono));
    var refs=raw?JSON.parse(raw):[];
    var ref=refs[Number(numero)-1];
    if(!ref) return null;
    var productos=(getCatalogo().productos||[]);
    for(var i=0;i<productos.length;i++){
      var p=productos[i];
      if(ref.sku && String(p.sku||'')===ref.sku) return p;
      if(ref.id && String(p.id||'')===ref.id) return p;
      if(_waNormalizar(p.marca)===_waNormalizar(ref.marca) && _waNormalizar(p.nombre)===_waNormalizar(ref.nombre)) return p;
    }
  } catch(e) { Logger.log('Asistente seleccion: '+e.message); }
  return null;
}

function _waDetalleProducto(p) {
  if(!p) return '';
  var marca=String(p.marca||'').trim(),nombre=String(p.nombre||'').trim();
  var contado=Number(p.precio_venta||0),lista=Number(p.precio_lista||contado),stock=Number(p.stock||0);
  var descripcion=String(p.descripcion_publicacion||p.descripcion||'').trim();
  var beneficios=Array.isArray(p.beneficios_publicacion)?p.beneficios_publicacion.filter(Boolean).slice(0,5):[];
  var salida=['*'+(marca?marca+' - ':'')+nombre+'*'];
  if(descripcion) salida.push('\n*Qué es:* '+descripcion);
  if(beneficios.length){
    salida.push('\n*Beneficios principales:*');
    beneficios.forEach(function(b){salida.push('• '+String(b));});
  }
  salida.push('\n*Precio contado:* '+_waMoneda(contado));
  salida.push('*Crédito de 1 a 3 cuotas:* '+_waMoneda(lista)+(lista>0?' (3 x '+_waMoneda(Math.ceil(lista/3))+')':''));
  salida.push('*Stock disponible:* '+stock);
  salida.push('\nSi querés comprarlo, decime *lo quiero*. Para dosis, contraindicaciones o una situación de salud te comunico con una persona.');
  return salida.join('\n');
}

function _resolverAsistenteWhatsApp(telefono, texto) {
  var normal = _waNormalizar(texto);
  var estado = _waLeerEstado(telefono);

  if (!normal) return _waMenu();
  if (/^(menu|inicio|volver|atras|cancelar|hola|buenas|buen dia|buenas tardes|buenas noches)$/.test(normal)) {
    _waLimpiarEstado(telefono);
    return _waMenu();
  }

  var codigo = normal.toUpperCase().match(/MXP-?\d+/);
  if (codigo) {
    _waLimpiarEstado(telefono);
    return _waRespuestaPedido(codigo[0].replace(/^MXP(?=\d)/, 'MXP-'));
  }

  if (_waEsConsultaSalud(normal)) {
    return 'Para dosis, contraindicaciones o temas de salud no doy respuestas automaticas. '
      + 'Te paso con una persona; si corresponde, consulta tambien a un profesional de salud.\n\n'
      + _waDerivarHumano(telefono, 'consulta de salud o dosificacion');
  }

  if (estado.paso === 'HUMANO') return '';

  // El botón flotante de la web envía una consulta general. No hay que tratar
  // toda esa oración como si fuera el nombre literal de un producto.
  if (_waEsConsultaGeneralCatalogo(normal)) {
    _waGuardarEstado(telefono, 'MENU');
    return _waRespuestaCatalogoGeneral();
  }

  if (/^(lo quiero|quiero comprarlo|quiero llevarlo|comprar|reservar|encargar)$/.test(normal)) {
    return _waDerivarHumano(telefono, 'quiere comprar un producto consultado');
  }

  if (estado.paso === 'PRODUCTO') {
    var opcionProducto=normal.match(/^\d{1,2}$/);
    if(opcionProducto){
      var elegido=_waProductoElegido(telefono,Number(opcionProducto[0]));
      if(elegido) return _waDetalleProducto(elegido);
      return 'Esa opción ya venció o no está disponible. Escribí nuevamente el producto que buscás.';
    }
    _waGuardarEstado(telefono, 'PRODUCTO');
    return _waBuscarProductos(telefono,texto,false);
  }
  if (estado.paso === 'PEDIDO') {
    var codigoPedido = normal.toUpperCase().match(/(?:MXP-?)?\d{3,}/);
    if (!codigoPedido) return 'No reconoci el codigo. Ejemplo: *MXP-8111*. Escribilo otra vez o envia *menu*.';
    _waLimpiarEstado(telefono);
    var limpio = codigoPedido[0].replace(/^MXP(?=\d)/, 'MXP-');
    if (limpio.indexOf('MXP-') !== 0) limpio = 'MXP-' + limpio;
    return _waRespuestaPedido(limpio);
  }

  if (normal === '1' || /buscar|producto|precio|stock|tenes|tienen|beneficio|para que sirve|que es|contiene|composicion|ingrediente/.test(normal)) {
    _waGuardarEstado(telefono, 'PRODUCTO');
    var consultaDirecta = normal.replace(/\b(buscar|busco|producto|precio|stock|tenes|tienen|hay|beneficio|beneficios|sirve|contiene|composicion|ingrediente|ingredientes|que|es|para|de|del|la|el|los|las|un|una|quiero|necesito)\b/g, ' ').replace(/\s+/g, ' ').trim();
    if (normal === '1' || consultaDirecta.length < 2) {
      return 'Que producto buscas? Podes escribir, por ejemplo: *creatina ENA* o *whey vainilla*.';
    }
    return _waBuscarProductos(telefono,consultaDirecta,false);
  }
  if (normal === '2' || /estado.*pedido|seguir.*pedido|donde.*pedido/.test(normal)) {
    _waGuardarEstado(telefono, 'PEDIDO');
    return 'Enviame el codigo de tu pedido. Ejemplo: *MXP-8111*.';
  }
  if (normal === '3' || /pago|cuota|tarjeta|transferencia|efectivo|debito|credito/.test(normal)) {
    return _waRespuestaPagos();
  }
  if (normal === '4' || /envio|entrega|retir|direccion|ubicacion|correo/.test(normal)) {
    return _waRespuestaEntregas();
  }
  if (normal === '5' || /persona|humano|asesor|vendedor|atencion/.test(normal)) {
    return _waDerivarHumano(telefono, 'solicitud del cliente');
  }

  var personalizada=_waRespuestaPersonalizada(normal);
  if(personalizada) return personalizada+'\n\nEscribí *menu* para ver todas las opciones.';

  var posibleProducto=_waBuscarProductos(telefono,texto,true);
  if(posibleProducto){
    _waGuardarEstado(telefono,'PRODUCTO');
    return posibleProducto;
  }

  return 'No llegue a entender la consulta.\n\n' + _waMenu();
}

function _waEsConsultaSalud(normal) {
  return /dosis|dosificacion|como tomar|cuanto tomar|embaraz|presion|diabetes|medicamento|contraindic|efecto secundario|enfermedad|lesion/.test(normal);
}

function _waCategoriaConsulta(normal) {
  if (/\b(proteina|proteinas|protein|proteins|whey|wh3y|isolate|isolada|caseina)\b/.test(normal)) return 'proteina';
  if (/\b(creatina|creatinas|creatine)\b/.test(normal)) return 'creatina';
  if (/\b(gainer|ganador|ganadores)\b|\bmass\b/.test(normal)) return 'gainer';
  if (/\b(aminoacido|aminoacidos|amino|bcaa|eaa|glutamina|glutamine)\b/.test(normal)) return 'aminoacido';
  if (/\b(preworkout|preentreno|pre-entreno)\b|pre entreno/.test(normal)) return 'preworkout';
  if (/\b(colageno|colagenos|collagen)\b/.test(normal)) return 'colageno';
  if (/\b(quemador|quemadores|termogenico|termogenicos)\b/.test(normal)) return 'quemador';
  if (/\b(vitamina|vitaminas|mineral|minerales)\b/.test(normal)) return 'vitamin';
  if (/\b(hidratacion|isotonico|isotonicos|electrolito|electrolitos)\b/.test(normal)) return 'hidratacion';
  if (/\b(barra|barras|snack|snacks)\b/.test(normal)) return 'barra';
  if (/\b(shaker|shakers|vaso|vasos|botella|botellas)\b/.test(normal)) return 'shaker';
  if (/\b(accesorio|accesorios)\b/.test(normal)) return 'accesorio';
  return '';
}

function _waCategoriaProducto(p) {
  var categoria = _waNormalizar(p && p.categoria || '');
  var aliases = {
    proteinas:'proteina', protein:'proteina', proteins:'proteina',
    creatinas:'creatina', creatine:'creatina',
    aminoacidos:'aminoacido', amino:'aminoacido',
    preentreno:'preworkout', 'pre entreno':'preworkout',
    colagenos:'colageno', collagen:'colageno',
    quemadores:'quemador', termogenico:'quemador', termogenicos:'quemador',
    vitamina:'vitamin', vitaminas:'vitamin', minerales:'vitamin',
    isotonico:'hidratacion', isotonicos:'hidratacion',
    barras:'barra', snacks:'barra',
    shakers:'shaker', vasos:'shaker', botellas:'shaker',
    accesorios:'accesorio'
  };
  categoria = aliases[categoria] || categoria;
  if (categoria && categoria !== 'otros') return categoria;
  return inferirCat(String(p && p.nombre || ''));
}

function _waTokenGenericoCategoria(token, categoria) {
  var genericos = {
    proteina:{proteina:1,proteinas:1,protein:1,proteins:1},
    creatina:{creatina:1,creatinas:1,creatine:1},
    gainer:{gainer:1,ganador:1,ganadores:1},
    aminoacido:{aminoacido:1,aminoacidos:1,amino:1},
    preworkout:{preworkout:1,preentreno:1},
    colageno:{colageno:1,colagenos:1,collagen:1},
    quemador:{quemador:1,quemadores:1,termogenico:1,termogenicos:1},
    vitamin:{vitamina:1,vitaminas:1,mineral:1,minerales:1},
    hidratacion:{hidratacion:1,isotonico:1,isotonicos:1,electrolito:1,electrolitos:1},
    barra:{barra:1,barras:1,snack:1,snacks:1},
    shaker:{shaker:1,shakers:1,vaso:1,vasos:1,botella:1,botellas:1},
    accesorio:{accesorio:1,accesorios:1}
  };
  return !!(genericos[categoria] && genericos[categoria][token]);
}

function _waBuscarProductos(telefono, consulta, silencioso) {
  var normal = _waNormalizar(consulta);
  var stop = { de:1, del:1, la:1, el:1, los:1, las:1, con:1, para:1, que:1, es:1, sirve:1, beneficio:1, beneficios:1, precio:1, stock:1, quiero:1, busco:1, tenes:1, tienen:1, hay:1 };
  var categoriaConsulta = _waCategoriaConsulta(normal);
  var tokens = normal.split(' ').filter(function(t) {
    return t.length > 1 && !stop[t] && !_waTokenGenericoCategoria(t, categoriaConsulta);
  });
  // "pre entreno" se reconoce como categoría aunque sus palabras se separen.
  if (categoriaConsulta === 'preworkout') tokens = tokens.filter(function(t){ return t !== 'pre' && t !== 'entreno'; });
  if (!tokens.length && !categoriaConsulta) return silencioso?'':'Escribi el nombre o la marca del producto que buscas.';

  var catalogo = getCatalogo();
  var productos = catalogo.productos || [];
  var coincidencias = [];
  productos.forEach(function(p) {
    var hay = Number(p.stock || 0);
    if (hay <= 0) return;
    if (categoriaConsulta && _waCategoriaProducto(p) !== categoriaConsulta) return;
    var base = _waNormalizar(String(p.marca || '') + ' ' + String(p.nombre || ''));
    // Todos los términos específicos deben coincidir. Así "proteína STAR"
    // exige categoría proteína + marca/nombre STAR y nunca mezcla creatinas.
    var coincideTodo = tokens.every(function(t) { return base.indexOf(t) >= 0; });
    if (!coincideTodo) return;
    var puntaje = 0;
    tokens.forEach(function(t) {
      if (base.indexOf(t) >= 0) puntaje += (base === t ? 4 : 1);
    });
    if (base.indexOf(normal) >= 0) puntaje += 3;
    if (categoriaConsulta) puntaje += 5;
    coincidencias.push({ p: p, puntaje: puntaje });
  });

  coincidencias.sort(function(a, b) {
    if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
    return Number(b.p.stock || 0) - Number(a.p.stock || 0);
  });
  if (!coincidencias.length) {
    return silencioso?'':'No encontre stock para *' + String(consulta).slice(0, 80) + '*. Proba con otra marca o escribi *5* para consultar a una persona.';
  }

  if(coincidencias.length===1) return _waDetalleProducto(coincidencias[0].p);
  var totalCoincidencias = coincidencias.length;
  var visibles = coincidencias.slice(0,30);
  _waGuardarResultadosProductos(telefono,visibles);

  var salida = ['Tengo *' + totalCoincidencias + '* opciones con stock' + (categoriaConsulta ? ' de ' + categoriaConsulta : '') + ':'];
  visibles.forEach(function(item, i) {
    var p = item.p;
    var contado = Number(p.precio_venta || 0);
    var linea = '\n*' + (i + 1) + '. ' + String(p.marca || '') + ' - ' + String(p.nombre || '') + '*'
      + '\nContado: ' + _waMoneda(contado)
      + ' · Stock: ' + Number(p.stock || 0);
    salida.push(linea);
  });
  if(totalCoincidencias>visibles.length) salida.push('\nHay ' + (totalCoincidencias-visibles.length) + ' opciones más. Escribí una marca o sabor para afinar la búsqueda.');
  salida.push('\nRespondé con el número para ver qué es, sus beneficios, precio completo y cuotas. También podés escribir otro producto o enviar *menu*.');
  return salida.join('\n');
}

function _waMoneda(valor) {
  var n = Math.round(Number(valor) || 0);
  return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function _waRespuestaPedido(codigo) {
  var pedido = getEstadoPedido(codigo);
  if (!pedido.ok) return 'No encontre *' + codigo + '*. Revisa el codigo o escribi *5* para hablar con una persona.';
  var texto = '*Pedido ' + pedido.codigo + '*\n'
    + 'Estado: ' + String(pedido.estado || 'Sin estado') + '\n'
    + 'Pago: ' + String(pedido.estadoPago || pedido.pago || 'A confirmar') + '\n'
    + 'Entrega: ' + String(pedido.entrega || 'A coordinar') + '\n'
    + 'Total: ' + _waMoneda(pedido.total);
  if (pedido.productos) texto += '\nProductos: ' + String(pedido.productos).slice(0, 400);
  return texto + '\n\nEscribi *menu* para volver.';
}

function _waRespuestaPagos() {
  return '*Medios de pago*\n\n'
    + '- Efectivo, transferencia y debito: precio contado.\n'
    + '- Tarjeta de credito de 1 a 3 cuotas: precio de lista.\n'
    + '- En cada producto te muestro ambos valores y el estimado de 3 cuotas.\n\n'
    + 'El pago y la disponibilidad se confirman al cerrar el pedido. Escribi *1* para consultar un producto.';
}

function _waRespuestaEntregas() {
  return '*Entregas MAXUP*\n\n'
    + '- Retiro: Calixto Gauna 1045, General Guemes, Salta.\n'
    + '- Envios a todo el pais por Correo Argentino, Andreani, OCA o Via Cargo.\n'
    + '- El costo exacto se confirma segun peso, localidad y modalidad.\n\n'
    + 'Escribi *5* si queres coordinar una entrega con una persona.';
}

function _waDerivarHumano(telefono, motivo) {
  _waGuardarEstado(telefono, 'HUMANO');
  try {
    _notificarTelegram('🙋 WhatsApp solicita atencion humana\nTelefono: +' + telefono + '\nMotivo: ' + String(motivo || 'consulta'));
  } catch (e) {}
  return 'Listo, deje avisado al equipo de MAXUP. Una persona va a contactarte para continuar la atencion.';
}

function _enviarWhatsAppTexto(telefono, texto) {
  var cfg = _getConfig();
  if (!cfg.WA_ACCESS_TOKEN || !cfg.WA_PHONE_ID) throw new Error('WhatsApp aun no esta configurado');
  var version = String(cfg.WA_GRAPH_VERSION || 'v26.0').replace(/[^v0-9.]/g, '');
  var url = 'https://graph.facebook.com/' + version + '/' + cfg.WA_PHONE_ID + '/messages';
  var destinos = _waVariantesTelefonoDestino(telefono);
  var ultimoError = '';

  for (var i = 0; i < destinos.length; i++) {
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + cfg.WA_ACCESS_TOKEN },
      payload: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: destinos[i],
        type: 'text',
        text: { preview_url: false, body: String(texto || '').slice(0, 3900) }
      }),
      muteHttpExceptions: true
    });
    var status = response.getResponseCode();
    var respuestaMeta = String(response.getContentText() || '');
    if (status >= 200 && status < 300) {
      _waRegistrarDiagnostico('RESPUESTA_ENVIADA', telefono, 'Meta acepto la respuesta del asistente (estado ' + status + ', variante ' + (i + 1) + ').');
      return true;
    }

    ultimoError = 'Meta respondio con estado ' + status + ': ' + respuestaMeta.slice(0, 1200);
    // Solo probamos otra escritura del mismo numero ante el error de lista autorizada.
    // Otros errores (token, permisos, contenido) no se resuelven cambiando el telefono.
    if (respuestaMeta.indexOf('131030') < 0) break;
  }

  throw new Error(ultimoError || 'Meta no acepto el mensaje');
}

// Devuelve primero el WhatsApp ID original y luego variantes argentinas.
// El panel de prueba de Meta puede autorizar +54 11 15... aunque WhatsApp
// entregue el mismo movil como +54 9 11... o +54 11...
function _waVariantesTelefonoDestino(telefono) {
  var original = String(telefono || '').replace(/\D/g, '');
  var variantes = [];
  function agregar(valor) {
    if (valor && variantes.indexOf(valor) < 0) variantes.push(valor);
  }
  agregar(original);

  var restoBuenosAires = '';
  if (/^54911\d{8}$/.test(original)) restoBuenosAires = original.slice(5);
  else if (/^5411\d{8}$/.test(original)) restoBuenosAires = original.slice(4);

  if (restoBuenosAires) {
    agregar('54911' + restoBuenosAires);
    agregar('541115' + restoBuenosAires);
  }
  return variantes;
}

function _waFormatearTelefonoDestino(telefono) {
  return _waVariantesTelefonoDestino(telefono)[0] || '';
}

// Guarda un diagnostico legible en el Sheets sin exponer tokens ni el telefono completo.
// Asi se pueden resolver errores de Meta aunque Apps Script no muestre los registros del doPost.
function _waRegistrarDiagnostico(etapa, telefono, detalle) {
  try {
    var cfg = _getConfig();
    var texto = String(detalle || '');
    if (cfg.WA_ACCESS_TOKEN) texto = texto.split(String(cfg.WA_ACCESS_TOKEN)).join('[TOKEN OCULTO]');

    var digitos = String(telefono || '').replace(/\D/g, '');
    var telefonoSeguro = digitos ? '***' + digitos.slice(-4) : '';
    var ss = _getSS();
    var hoja = ss.getSheetByName('WA_DIAGNOSTICO');
    if (!hoja) hoja = ss.insertSheet('WA_DIAGNOSTICO');
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(['Fecha y hora', 'Etapa', 'Telefono', 'Detalle']);
      hoja.setFrozenRows(1);
    }
    hoja.appendRow([new Date(), String(etapa || ''), telefonoSeguro, texto.slice(0, 1500)]);
    hoja.autoResizeColumns(1, 4);

    // Conserva solamente los ultimos 100 eventos para que la hoja siga siendo liviana.
    var excedentes = hoja.getLastRow() - 101;
    if (excedentes > 0) hoja.deleteRows(2, excedentes);
  } catch (errorDiagnostico) {
    Logger.log('WhatsApp diagnostico: ' + errorDiagnostico.message);
  }
}

// Prueba desde el editor sin enviar mensajes ni consumir la API de Meta.
function pruebaAsistenteWhatsApp(texto) {
  var telefonoPrueba = '5490000000000';
  _waLimpiarEstado(telefonoPrueba);
  return {
    entrada: texto || 'menu',
    respuesta: _resolverAsistenteWhatsApp(telefonoPrueba, texto || 'menu')
  };
}

