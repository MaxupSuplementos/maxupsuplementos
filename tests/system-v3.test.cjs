const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const api = read('Api.gs');
const system = read('SystemV3.gs');
const admin = read('admin.html');
const mayorista = read('mayorista.html');
const app = read('app.js');

for (const file of ['Api.gs', 'SystemV3.gs', 'Ventas.gs', 'app.js']) {
  assert.doesNotThrow(() => new Function(read(file)), `${file} debe tener sintaxis JavaScript valida`);
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

console.log('OK - contratos principales del sistema v3 verificados');
