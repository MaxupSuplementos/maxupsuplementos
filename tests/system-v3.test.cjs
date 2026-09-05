const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const api = read('Api.gs');
const system = read('SystemV3.gs');
const stockObjetivo = read('StockObjetivo.gs');
const admin = read('admin.html');
const mayorista = read('mayorista.html');
const app = read('app.js');
const indumentaria = read('indumentaria.html');
const styles = read('styles.css');
const index = read('index.html');
const privacy = read('privacidad.html');
const transparentLogo = fs.readFileSync(path.join(root, 'logo-transparent.png'));

for (const file of ['Api.gs', 'SystemV3.gs', 'Ventas.gs', 'StockObjetivo.gs', 'app.js']) {
  assert.doesNotThrow(() => new Function(read(file)), `${file} debe tener sintaxis JavaScript valida`);
}
assert.doesNotThrow(() => new Function(admin.match(/<script>([\s\S]*?)<\/script>/)[1]), 'admin.html debe tener sintaxis JavaScript valida');
for (const [i, match] of [...mayorista.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()) {
  if (!match[1].trim()) continue;
  assert.doesNotThrow(() => new Function(match[1]), `mayorista.html script ${i + 1} debe tener sintaxis JavaScript valida`);
}
for (const [i, match] of [...indumentaria.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()) {
  if (!match[1].trim()) continue;
  assert.doesNotThrow(() => new Function(match[1]), `indumentaria.html script ${i + 1} debe tener sintaxis JavaScript valida`);
}

assert(!/bot\d{8,}:[A-Za-z0-9_-]{20,}/.test(api), 'No debe haber tokens de Telegram en el codigo');
assert(!/accion=admin_[^'"\s]*clave=/.test(admin), 'La clave admin no debe viajar en la URL');
assert(!/login_mayorista[^'"\s]*password=/.test(mayorista), 'La clave mayorista no debe viajar en la URL');
assert(api.includes("notification_url: _getConfig().API_URL_SELF"), 'Mercado Pago debe tener webhook');
assert(system.includes('procesarWebhookMercadoPago'), 'Debe verificarse el pago con Mercado Pago');
assert(system.includes('MOVIMIENTOS_STOCK'), 'Debe existir historial de movimientos de stock');
assert(stockObjetivo.includes('CONTROL DE STOCK OBJETIVO Y CAPITAL'), 'El control debe mostrar stock objetivo y capital');
assert(stockObjetivo.includes('Costo compra unitario'), 'El control debe conservar el costo real de compra');
assert(stockObjetivo.includes('Reinversión necesaria'), 'El control debe calcular la reinversion necesaria');
assert(stockObjetivo.includes("}, 15);"), 'Debe precargar 15 creatinas Star como objetivo inicial');
assert(stockObjetivo.includes("}, 6);"), 'Debe precargar 6 Collagen Sport Star como objetivo inicial');
assert(stockObjetivo.includes("}, 3);"), 'Debe precargar 3 glutaminas como objetivo inicial');
assert(stockObjetivo.includes("='SUPLEMENTOS'!D"), 'El stock actual debe actualizarse solo desde SUPLEMENTOS');
assert(stockObjetivo.includes('instalarControlStockObjetivo'), 'Debe poder instalarse el control y su menú');
assert(api.includes("return { ok: false, errores:"), 'El stock insuficiente debe bloquear la operacion');
assert(app.includes("sku:      i.sku || ''"), 'Los pedidos web deben enviar SKU');
assert(app.includes("cache: 'no-store'"), 'El catálogo público no debe reutilizar stock guardado por el navegador');
assert(app.includes("'?accion=catalogo&_=' + Date.now()"), 'Cada lectura del catálogo debe pedir stock fresco');
assert(app.includes("document.addEventListener('visibilitychange', _refrescarCatalogoAlVolver_)"), 'La tienda debe actualizar stock al volver a una pestaña abierta');
assert(app.includes("window.addEventListener('focus', _refrescarCatalogoAlVolver_)"), 'La tienda debe actualizar stock al recuperar el foco');
const caja = read('CajaMaxup.gs');
const cajaHtml = read('CajaMaxup.html');
assert.doesNotThrow(() => new Function(caja), 'CajaMaxup.gs debe tener sintaxis JavaScript valida');
for (const [i, match] of [...cajaHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()) {
  if (!match[1].trim()) continue;
  const scriptCaja = match[1].replace(/<\?[\s\S]*?\?>/g, 'null');
  assert.doesNotThrow(() => new Function(scriptCaja), `CajaMaxup.html script ${i + 1} debe tener sintaxis JavaScript valida`);
}
assert(caja.includes('LockService.getScriptLock()'), 'La caja debe impedir ventas simultáneas que pisen el stock');
assert(caja.includes("if (antes < item.cantidad) throw new Error('El stock cambió"), 'La caja debe volver a validar el stock justo antes de descontar');
assert(caja.includes('hoja.getRange(item.fila, item.colStock).setValue(despues)'), 'La caja debe guardar el nuevo stock en la fila exacta vendida');
assert(caja.indexOf('setValue(despues)') < caja.lastIndexOf('_cajaInsertarVentaBatch_(hojaVD'), 'El stock debe descontarse antes de confirmar la venta');
assert(caja.includes('_cajaInsertarVentaBatch_'), 'La caja debe registrar compras de varios productos en bloque');
assert(caja.includes('_cajaDescontarStockDetalladoBatch_'), 'La caja debe actualizar los lotes en una sola lectura');
assert(caja.includes('_cajaRegistrarMovimientosBatch_'), 'La caja debe guardar los movimientos de stock en bloque');
assert(caja.includes('_cajaFidelidadFila_(rows[i], headers, reglasFidelidad)'), 'La carga de clientes no debe recorrer toda la hoja por cada persona');
assert(cajaHtml.includes('refrescarDatosCajaEnSegundoPlano('), 'La caja debe actualizar sus datos sin bloquear la siguiente venta');
assert(!cajaHtml.includes("byId('loading').textContent='Preparando la caja para la siguiente venta…'"), 'La siguiente venta no debe esperar la recarga completa');
assert(caja.includes("getSheetByName('VENTAS_PENDIENTES')"), 'La caja rápida debe conservar una bandeja editable antes del cierre');
assert(caja.includes('guardarVentaPendienteCajaMaxup'), 'La caja debe reservar stock con una venta rápida');
assert(caja.includes('cancelarVentaPendienteCajaMaxup'), 'Cancelar una pendiente debe devolver el stock');
assert(caja.includes('cerrarJornadaCajaMaxup'), 'El cierre debe registrar las ventas pendientes en bloque');
assert(cajaHtml.includes('⚡ GUARDAR VENTA RÁPIDA'), 'Guardar rápido debe ser la acción principal de la caja');
assert(cajaHtml.includes('✏️ Editar'), 'Las ventas pendientes deben poder corregirse desde la caja');
assert(stockObjetivo.includes('actualizarPreciosMayoristasMaxup'), 'Debe poder actualizar costos y precios mayoristas desde proveedores');
const pricingHelpers = new Function(stockObjetivo + '; return {_mayoDiagnosticoPrecioMinorista_, _mayoEnlaceMercadoLibre_};')();
assert.strictEqual(pricingHelpers._mayoDiagnosticoPrecioMinorista_(65000, 50000).estado, 'SINCRONIZADO', 'Costo 50.000 y venta 65.000 deben quedar sincronizados');
assert.strictEqual(pricingHelpers._mayoDiagnosticoPrecioMinorista_(58000, 50000).estado, 'RIESGO DE REPOSICIÓN', 'Un precio con margen insuficiente debe alertarse');
assert.strictEqual(pricingHelpers._mayoDiagnosticoPrecioMinorista_(64000, 50000).estado, 'REVISAR', 'Un precio seguro pero inferior al objetivo debe quedar para revisar');
assert(pricingHelpers._mayoEnlaceMercadoLibre_('Star Nutrition', 'Creatina 300 g').includes('Star%20Nutrition%20Creatina%20300%20g'), 'Cada producto debe tener búsqueda directa en Mercado Libre');
assert(stockObjetivo.includes('actualizarComparativaProveedoresSemanal'), 'Debe existir una comparativa semanal de proveedores');
assert(stockObjetivo.includes("onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8)"), 'La comparativa debe actualizarse los lunes por la mañana');
assert(stockObjetivo.includes("fuente:'AG SUPLEMENTOS'"), 'AG debe formar parte de la comparativa');
assert(stockObjetivo.includes("fuente:'COLO MAYORISTA'"), 'Colo debe formar parte de la comparativa');
assert(stockObjetivo.includes("fuente:'ONE FIT'"), 'One Fit debe formar parte de la comparativa');
assert(stockObjetivo.includes('MAYO_PREFERENCIA_AG = 0.03'), 'AG debe priorizarse cuando la diferencia final es pequeña');
assert(stockObjetivo.includes("['AG precio','AG puesto local','Colo precio'"), 'El control debe mostrar los costos comparados junto a la reposición');
assert(stockObjetivo.includes("fletePct: Math.max(0, Number(r[2]) || 0)"), 'El flete estimado debe ser configurable desde la hoja');
assert(api.includes('MAYO_MINIMO_API     = 400000'), 'El mínimo mayorista debe validarse en el servidor');
assert(api.includes('desc_mayorista_max'), 'Cada producto debe tener un tope de descuento rentable');
assert(api.includes('_nivelMayorista_'), 'El servidor debe aplicar descuentos mayoristas por volumen');
assert(mayorista.includes('Nivel Distribuidor'), 'La tienda mayorista debe informar el nivel de volumen');
assert(system.includes('backupDiarioMaxup'), 'Debe existir backup automatico');
assert(system.includes('pruebaSaludSistema'), 'Debe existir prueba de salud automatica');
assert(system.includes("getSheetByName('CUPONES')"), 'Los cupones deben administrarse desde Sheets');
assert(system.includes("insertCheckboxes()"), 'La columna Activo debe usar casillas de verificacion');
assert(system.includes('Duracion horas'), 'Debe poder configurarse una vigencia de 24 horas');
assert(system.includes('Max usos por cliente'), 'Debe limitarse la reutilizacion por cliente');
assert(system.includes("getSheetByName('USOS_CUPONES')"), 'Cada uso de cupon debe quedar registrado');
assert(system.includes('Cupon vencido'), 'El servidor debe rechazar cupones vencidos');
assert(system.includes('ya fue utilizado por este cliente'), 'El servidor debe impedir usos repetidos');
assert(api.includes("data.accion === 'admin_cupones'"), 'El panel debe leer cupones desde la API segura');
assert(api.includes('_registrarUsoCupon('), 'Los pedidos deben registrar el uso del cupon');
assert(admin.includes('cargarCuponesSheets'), 'El panel debe mostrar los cupones dinamicos');
assert(app.includes('let CUPONES = {};'), 'La tienda no debe conservar cupones locales vencidos');
assert(admin.includes('GOOGLE_REVIEW_URL'), 'El aviso de entrega debe incluir la ficha de Google para pedir resenas');
assert(admin.includes('Visitas web'), 'El panel debe ofrecer acceso directo a Google Analytics');
assert(app.includes("gtag('event', 'purchase'"), 'Los pedidos web deben medirse como compras en Google Analytics');
assert(api.includes("data.object === 'whatsapp_business_account'"), 'WhatsApp debe tener un webhook separado de los pedidos web');
assert(api.includes('_verificarWebhookWhatsApp'), 'Meta debe poder verificar el webhook de WhatsApp');
assert(api.includes('_procesarWebhookWhatsApp'), 'Los mensajes entrantes de WhatsApp deben procesarse');
assert(api.includes('_waDerivarHumano'), 'El asistente debe ofrecer derivacion a una persona');
assert(api.includes('WA_RATE_'), 'El asistente debe limitar mensajes excesivos');
assert(api.includes('WA_MSG_'), 'El webhook debe ignorar mensajes repetidos');
assert(api.includes("getSheetByName('ASISTENTE_RESPUESTAS')"), 'Las respuestas comerciales del asistente deben ser editables desde Sheets');
assert(api.includes('p.beneficios_publicacion'), 'El asistente debe reutilizar los beneficios precisos de cada ficha');
assert(api.includes('WA_RESULTS_'), 'El asistente debe recordar las opciones de producto mostradas');
assert(api.includes('_waEsConsultaGeneralCatalogo'), 'Max debe reconocer el mensaje general enviado por la tienda');
assert(api.includes('_waRespuestaCatalogoGeneral'), 'Max debe orientar por categorías en vez de buscar una oración completa');
assert(api.indexOf('_waEsConsultaGeneralCatalogo(normal)') < api.indexOf("if (estado.paso === 'PRODUCTO')"), 'La consulta general debe resolverse antes de buscar productos');
assert(app.includes("const WA_DEFAULT = '5493876233406'"), 'La tienda debe enviar consultas al WhatsApp oficial de Max');
assert(index.includes('Quiero%20asesoramiento%20general%20sobre%20los%20productos%20y%20precios'), 'El botón de WhatsApp debe enviar una intención general clara');
assert(!app.includes('5491168461457'), 'La tienda no debe enviar clientes al numero personal');
assert(!index.includes('5491168461457'), 'La portada no debe publicar el numero personal');
assert(api.includes("WA_ATENCION_HUMANA_1 = '5491168461457'"), 'La derivacion debe incluir el WhatsApp de atencion 1');
assert(api.includes("WA_ATENCION_HUMANA_2 = '5493875104606'"), 'La derivacion debe incluir el WhatsApp de atencion 2');
assert(api.includes("https://wa.me/' + WA_ATENCION_HUMANA_1"), 'Max debe entregar enlaces directos al pedir una persona');
assert(stockObjetivo.includes('_mayoActualizarFaltantes_'), 'La comparativa debe listar los productos por reponer sin proveedor');
assert(stockObjetivo.includes('Proveedor habitual'), 'La hoja de proveedores debe permitir completar proveedores manuales');
assert(stockObjetivo.includes("fuente: 'AG SUPLEMENTOS'"), 'Todos los accesorios deben quedar asignados a AG SUPLEMENTOS');
assert(stockObjetivo.includes('Proveedor habitual fijo para accesorios: AG SUPLEMENTOS'), 'AG debe prevalecer como proveedor habitual de accesorios');
assert(!/EA[A-Za-z0-9_-]{80,}/.test(api), 'No debe haber tokens de acceso de Meta en el codigo');
assert(app.includes('function getInitialFlavor(p)'), 'Las variantes deben elegir primero una opcion con stock');
assert(app.includes('Number(f.stock) > 0'), 'Una tarjeta solo debe mostrarse agotada si todas sus variantes lo estan');
assert(app.includes('resumeWhenSettled'), 'El carrusel debe esperar a que termine la inercia manual');
assert(indumentaria.includes('resumeWhenSettled'), 'El carrusel de indumentaria debe esperar a que termine la inercia manual');
assert(/\.wa-float\{[^}]*width:46px;height:46px/.test(styles), 'WhatsApp debe medir igual que el carrito en escritorio');
assert(/\.scroll-top-btn\{[^}]*width:46px;height:46px/.test(styles), 'Subir al inicio debe medir igual que el carrito en escritorio');
assert(styles.includes('.wa-float{width:40px;height:40px'), 'WhatsApp debe medir igual que el carrito en mobile');
assert(styles.includes('.scroll-top-btn{width:40px;height:40px'), 'Subir al inicio debe medir igual que el carrito en mobile');
assert(index.includes('logo-transparent.png?v=20260803'), 'El logo principal debe usar la version transparente');
assert(index.includes('id="navLogo" src="logo-transparent.png'), 'El logo superior junto al buscador debe ser transparente desde la carga inicial');
assert(app.includes("logoNavegacion.src = 'logo-transparent.png"), 'El script no debe volver a colocar el logo negro en la navegación');
assert.strictEqual(transparentLogo[25], 6, 'El logo principal debe ser PNG con canal alfa RGBA');
assert(!index.includes('href="admin.html"'), 'El acceso administrativo no debe estar enlazado desde la tienda pública');
assert(!app.includes("window.location.href = 'admin.html'"), 'La tienda pública no debe revelar gestos ocultos de acceso administrativo');
assert(app.includes("toques>=5"), 'El panel debe requerir cinco toques para evitar aperturas accidentales');
assert(app.includes("iframe title=\"Panel de administración MAXUP\""), 'El panel debe abrir dentro de la tienda y no en otro espacio');
assert(app.includes("maxupLayer: 'producto'"), 'Las fichas de suplementos deben formar parte del historial');
assert(app.includes("window.addEventListener('popstate'"), 'Atrás debe cerrar o restaurar la ficha de suplementos');
assert(indumentaria.includes("maxupLayer:'prenda'"), 'Las fichas de indumentaria deben formar parte del historial');
assert(indumentaria.includes("Atrás cierra sólo la prenda"), 'Atrás debe conservar los filtros de indumentaria');
assert(admin.includes('function postAdmin(body)'), 'El acceso admin mobile debe usar el POST compatible');
assert(admin.includes('credentials:\'omit\''), 'El login mobile no debe depender de cookies de terceros');
assert(api.includes("data.accion === 'admin_cambiar_clave'"), 'La contraseña debe poder cambiarse desde el panel');
assert(api.includes("setProperty('ADMIN_SESSION_VERSION'"), 'Cambiar la clave debe invalidar sesiones anteriores');
assert(admin.includes('function cambiarClaveAdmin()'), 'Ajustes debe incluir el cambio seguro de contraseña');
assert(admin.includes('POLITICA_DESCUENTOS_20260803'), 'El panel debe sincronizar la politica comercial solicitada');
assert(app.includes("if(e.key==='Enter')"), 'Enter debe confirmar la busqueda');
assert(app.includes("this.blur(); // cierra también el teclado móvil"), 'Enter debe cerrar sugerencias y teclado mobile');
assert(app.includes("{ minimo: 500000, pct: 0.15"), 'Debe aplicar 15% desde $500.000');
assert(app.includes("{ minimo: 300000, pct: 0.08"), 'Debe aplicar 8% desde $300.000');
assert(system.includes('"minimo":500000,"pct":0.15'), 'El servidor debe validar 15% desde $500.000');
assert(system.includes('"minimo":300000,"pct":0.08'), 'El servidor debe validar 8% desde $300.000');
assert(system.includes("DESCUENTO_BIENVENIDA: '0.02'"), 'Bienvenida debe permanecer en 2%');
assert(system.includes("COMBO_DESCUENTO: '5'"), 'Combos deben permanecer en 5%');
assert(!app.includes('function getDescuentoCantidad()'), 'No debe quedar el descuento viejo por llevar dos unidades');
assert(!system.includes('if (item.cantidad >= 2) descuentoCantidad'), 'El servidor no debe aplicar descuentos fuera de la politica vigente');

const amountRules = app.match(/let DESCUENTOS_MONTO = (\[[\s\S]*?\]);/);
const amountHelper = app.match(/function getDescuentoMonto\(total\)\{[\s\S]*?\n\}/);
assert(amountRules && amountHelper, 'Debe existir la politica de descuentos por monto');
const amountSandbox = {};
vm.runInNewContext(`${amountRules[0]} ${amountHelper[0]}; this.discount = getDescuentoMonto;`, amountSandbox);
assert.strictEqual(amountSandbox.discount(299999), null, 'No debe descontar antes de $300.000');
assert.strictEqual(amountSandbox.discount(300000).pct, 0.08, 'Debe descontar 8% desde $300.000');
assert.strictEqual(amountSandbox.discount(499999).pct, 0.08, 'Debe mantener 8% antes de $500.000');
assert.strictEqual(amountSandbox.discount(500000).pct, 0.15, 'Debe descontar 15% desde $500.000');

assert(api.includes("case 'club_verificar'"), 'El email del Club debe poder verificarse');
assert(api.includes("case 'club_estado'"), 'La tienda debe activar el Club solo cuando el servidor este actualizado');
assert(api.includes("case 'club_baja'"), 'Cada miembro debe poder solicitar la baja');
assert(api.includes("data.accion === 'club_registro'"), 'La API debe aceptar registros del Club');
assert(api.includes("data.accion === 'admin_club_chance'"), 'El panel debe administrar chances');
assert(system.includes("'CLUB_MAXUP'"), 'Los miembros deben guardarse en una hoja propia');
assert(system.includes('function _clubFilaTienePersona'), 'El Club debe distinguir personas reales de filas preparadas');
assert(system.includes('function _clubCompactarFilasVacias'), 'Las filas fantasma del Club deben compactarse automaticamente');
assert(!system.includes("h.getRange(2, 7, h.getMaxRows() - 1, 1).insertCheckboxes()"), 'No se deben crear casillas en las 1000 filas vacias');
assert(system.includes('var datos = _clubCompactarFilasVacias(hoja).datos;'), 'El panel debe contar solamente miembros con datos reales');
const clubEmailHelper = system.match(/function _clubEmail\(v\) \{[^\n]+\}/);
const clubTelefonoHelper = system.match(/function _clubTelefono\(v\) \{[^\n]+\}/);
const clubRealRowHelper = system.match(/function _clubFilaTienePersona\(r\) \{[\s\S]*?\n\}/);
assert(clubEmailHelper && clubTelefonoHelper && clubRealRowHelper, 'Debe poder validarse el filtro de filas reales del Club');
const clubRowSandbox = {};
vm.runInNewContext(`${clubEmailHelper[0]} ${clubTelefonoHelper[0]} ${clubRealRowHelper[0]}; this.esPersona = _clubFilaTienePersona;`, clubRowSandbox);
assert.strictEqual(clubRowSandbox.esPersona(['','', '', '', '', '', false, '', false, '', false]), false, 'Una fila con casillas vacias no es una persona');
assert.strictEqual(clubRowSandbox.esPersona(['CLUB-123','', 'Dario', '541168461457', 'maxups24@gmail.com']), true, 'Una fila identificada si es una persona');
assert(system.includes("'CHANCES_CLUB'"), 'Las chances deben tener historial auditable');
assert(system.includes("'SORTEOS_CLUB'"), 'Los sorteos deben quedar registrados');
assert(system.includes('MailApp.getRemainingDailyQuota()'), 'Los avisos deben respetar la cuota diaria de correo');
assert(system.includes("everyHours(1)"), 'El stock debe revisarse automaticamente');
assert(system.includes('ejecutarSorteoMensualClubAutomatico'), 'Debe existir el sorteo mensual automatico');
assert(system.includes('CLUB_MIN_VERIFICADOS_SORTEO = 50'), 'El primer sorteo debe exigir 50 miembros verificados');
assert(system.includes('participantes.length < CLUB_MIN_VERIFICADOS_SORTEO'), 'El servidor debe bloquear sorteos antes del minimo');
assert(admin.includes('data.sorteoHabilitado===true'), 'El panel debe bloquear visualmente el sorteo antes de 50 confirmados');
assert(api.includes("data.object === 'instagram'"), 'Las menciones de Instagram deben tener un webhook separado');
assert(system.includes('function _procesarWebhookInstagramClub'), 'Las menciones compatibles deben acreditarse automaticamente');
assert(system.includes("tipo:'ETIQUETA_INSTAGRAM'" ) || admin.includes("tipo:'ETIQUETA_INSTAGRAM'"), 'Las etiquetas deben sumar chances identificables');
assert(index.includes('id="clubMaxup"'), 'La tienda debe invitar al Club sin bloquear el catalogo');
assert(index.includes('id="clubOverlay"'), 'El registro debe estar disponible en una ventana accesible');
assert.strictEqual((index.match(/id="clubMaxup"/g)||[]).length, 1, 'La invitacion visible al Club no debe estar duplicada');
assert.strictEqual((index.match(/id="clubOverlay"/g)||[]).length, 1, 'La ventana de registro al Club no debe estar duplicada');
assert(app.includes('setTimeout(function(){mostrarAlEntrar(0);},1400)'), 'La invitacion debe aparecer al entrar y no al llegar al final');
assert(!app.includes('maxup_club_visto'), 'Cerrar la invitacion no debe ocultarla durante visitas futuras');
assert(admin.includes("localStorage.setItem('maxup_admin_device','1')"), 'Un inicio admin debe excluir automaticamente ese dispositivo');
assert(admin.includes('cfgClubExcluidos'), 'Ajustes debe permitir editar las personas excluidas');
assert(system.includes('CLUB_POPUP_EXCLUIDOS'), 'Las exclusiones deben guardarse de forma persistente');
assert(api.includes("data.accion === 'club_estado'"), 'El servidor debe decidir la exclusion sin publicar la lista');
assert(app.includes("body:JSON.stringify({accion:'club_estado'"), 'La identidad no debe viajar en la direccion publica');
assert(app.includes('if(!capacidad.controlExclusiones)'), 'La tienda no debe enviar una accion nueva a una version anterior del servidor');
assert(index.includes('id="accountOverlay"'), 'La tienda debe incluir una cuenta de cliente accesible');
assert.strictEqual((index.match(/id="accountOverlay"/g)||[]).length, 1, 'La cuenta de cliente no debe estar duplicada');
assert(system.includes("'CLUB_CARRITOS'"), 'El carrito debe persistir fuera del dispositivo');
assert(system.includes("'CLUB_SESIONES'"), 'Las sesiones de clientes deben validarse en el servidor');
assert(api.includes("data.accion === 'cuenta_solicitar'"), 'La cuenta debe permitir solicitar un código seguro');
assert(api.includes("data.accion === 'cuenta_carrito'"), 'La cuenta debe guardar el carrito autenticado');
assert(app.includes("maxup_cuenta_sesion"), 'El dispositivo debe recordar la sesión de cliente');
assert(app.includes('programarSincronizacionCarrito'), 'Cada cambio del carrito debe sincronizarse');
assert(app.includes("Marca: ${p.brand || 'Sin marca informada'}"), 'La consulta de un suplemento debe incluir su marca');
assert(app.includes('Producto: ${p.name}'), 'La consulta de un suplemento debe identificar el producto');
assert(app.includes('Precio contado: $${p.price.toLocaleString'), 'La consulta de un suplemento debe incluir el precio');
assert(app.includes("'Marca: ' + (p.marca || 'Sin marca informada')"), 'Las consultas de ofertas también deben incluir la marca');
assert(app.includes("consentimiento:document.getElementById('clubConsentimiento').checked,empresa:''"), 'El autocompletado no debe activar por error el campo antispam');
assert(app.includes('¡Bienvenido/a a MAXUP! Tu cuenta quedó creada'), 'El registro debe mostrar una bienvenida clara');
assert(system.includes('cuentaCliente:true'), 'La cuenta sólo debe mostrarse después de actualizar el servidor');
assert(!app.includes("trigger.addEventListener('dblclick'"), 'El doble clic no debe abrir el panel por accidente');
assert(!app.includes("e.ctrlKey&&e.altKey"), 'No debe quedar un atajo administrativo accidental');
assert(app.includes('function registrarEnClub'), 'La tienda debe enviar el registro al servidor');
assert(app.includes("?accion=club_estado"), 'El formulario no debe mostrarse antes de que el backend este disponible');
assert(admin.includes("switchTab('club'"), 'El panel debe incluir la gestion del Club');
assert(admin.includes('function sortearClub()'), 'El panel debe permitir ejecutar el sorteo');
assert(system.includes('handlersClub.procesarNotificacionesClubStock'), 'El panel debe comprobar si los avisos automáticos están instalados');
assert(system.includes('handlersClub.ejecutarSorteoMensualClubAutomatico'), 'El panel debe comprobar si el sorteo automático está instalado');
assert(admin.includes("autoOk?'✅ Automatizaciones activas':'⚡ Activar automatizaciones'"), 'El panel debe mostrar claramente si las automatizaciones están activas');
assert(privacy.includes('El registro es opcional'), 'La politica debe aclarar que el catalogo sigue abierto');
assert(privacy.includes('Bases generales de los sorteos'), 'Deben publicarse bases generales del sorteo');

const flavorHelper = app.match(/function getInitialFlavor\(p\)\{[\s\S]*?\n\}/);
assert(flavorHelper, 'Debe existir la seleccion inicial de variantes');
const flavorSandbox = {};
vm.runInNewContext(`${flavorHelper[0]}; this.pick = getInitialFlavor;`, flavorSandbox);
assert.strictEqual(
  flavorSandbox.pick({flavors:[{name:'Chocolate',stock:0},{name:'Vainilla',stock:4}]}).name,
  'Vainilla',
  'Debe mostrar primero una variante que tenga stock'
);
assert.strictEqual(
  flavorSandbox.pick({flavors:[{name:'Chocolate',stock:0},{name:'Vainilla',stock:0}]}).name,
  'Chocolate',
  'Si todas estan agotadas debe conservar la primera variante'
);

const waSandbox = {};
vm.runInNewContext(api, waSandbox);
assert(waSandbox._waMenu().includes('Soy *Max*'), 'El asistente debe presentarse como Max');
assert(waSandbox._waMenu().includes('volver a este menu principal'), 'El menu debe explicar para que sirve escribir menu');
assert.strictEqual(waSandbox._waNormalizar('¿Tenés CREATÍNA?'), 'tenes creatina', 'La busqueda debe tolerar tildes y signos');
assert(waSandbox._waRespuestaPagos().includes('1 a 3 cuotas'), 'La respuesta debe explicar las cuotas');
assert(waSandbox._waRespuestaEntregas().includes('Calixto Gauna 1045'), 'La respuesta debe informar el retiro');
assert(waSandbox._waEsConsultaSalud('como tomar si tengo diabetes'), 'Las consultas de salud deben derivarse');
assert.strictEqual(waSandbox._waMoneda(123456), '$123.456', 'Los precios deben tener formato argentino');
assert.strictEqual(waSandbox._nivelMayorista_(399999).extra, 0, 'Antes del mínimo no debe sumar descuento por volumen');
assert.strictEqual(waSandbox._nivelMayorista_(700000).extra, 2, 'Desde $700.000 debe sumar dos puntos de descuento');
assert.strictEqual(waSandbox._nivelMayorista_(1000000).extra, 4, 'Desde $1.000.000 debe sumar cuatro puntos de descuento');
const detalleAsistente = waSandbox._waDetalleProducto({
  marca: 'MAXUP', nombre: 'Whey Test', precio_venta: 10000, precio_lista: 12000, stock: 3,
  descripcion_publicacion: 'Proteina de suero para complementar la alimentacion.',
  beneficios_publicacion: ['Ayuda a reparar el musculo', 'Aporta saciedad']
});
assert(detalleAsistente.includes('Proteina de suero'), 'El detalle debe explicar que es el producto');
assert(detalleAsistente.includes('Ayuda a reparar el musculo'), 'El detalle debe enumerar beneficios especificos');
assert(detalleAsistente.includes('3 x $4.000'), 'El detalle debe informar el estimado de cuotas');

console.log('OK - contratos principales del sistema v3 verificados');
