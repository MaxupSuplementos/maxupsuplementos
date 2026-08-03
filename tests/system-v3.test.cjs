const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const api = read('Api.gs');
const system = read('SystemV3.gs');
const admin = read('admin.html');
const mayorista = read('mayorista.html');
const app = read('app.js');
const indumentaria = read('indumentaria.html');
const styles = read('styles.css');
const index = read('index.html');
const transparentLogo = fs.readFileSync(path.join(root, 'logo-transparent.png'));

for (const file of ['Api.gs', 'SystemV3.gs', 'Ventas.gs', 'app.js']) {
  assert.doesNotThrow(() => new Function(read(file)), `${file} debe tener sintaxis JavaScript valida`);
}
assert.doesNotThrow(() => new Function(admin.match(/<script>([\s\S]*?)<\/script>/)[1]), 'admin.html debe tener sintaxis JavaScript valida');
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
assert(api.includes("return { ok: false, errores:"), 'El stock insuficiente debe bloquear la operacion');
assert(app.includes("sku:      i.sku || ''"), 'Los pedidos web deben enviar SKU');
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
assert.strictEqual(transparentLogo[25], 6, 'El logo principal debe ser PNG con canal alfa RGBA');
assert(!index.includes('href="admin.html"'), 'El acceso administrativo no debe estar enlazado desde la tienda pública');
assert(!app.includes("window.location.href = 'admin.html'"), 'La tienda pública no debe revelar gestos ocultos de acceso administrativo');
assert(admin.includes('function postAdmin(body)'), 'El acceso admin mobile debe usar el POST compatible');
assert(admin.includes('credentials:\'omit\''), 'El login mobile no debe depender de cookies de terceros');
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
assert(waSandbox._waMenu().includes('asistente automatico de MAXUP'), 'El asistente debe identificarse claramente');
assert.strictEqual(waSandbox._waNormalizar('¿Tenés CREATÍNA?'), 'tenes creatina', 'La busqueda debe tolerar tildes y signos');
assert(waSandbox._waRespuestaPagos().includes('1 a 3 cuotas'), 'La respuesta debe explicar las cuotas');
assert(waSandbox._waRespuestaEntregas().includes('Calixto Gauna 1045'), 'La respuesta debe informar el retiro');
assert(waSandbox._waEsConsultaSalud('como tomar si tengo diabetes'), 'Las consultas de salud deben derivarse');
assert.strictEqual(waSandbox._waMoneda(123456), '$123.456', 'Los precios deben tener formato argentino');

console.log('OK - contratos principales del sistema v3 verificados');
