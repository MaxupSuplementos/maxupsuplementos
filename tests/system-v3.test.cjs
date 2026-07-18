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

console.log('OK - contratos principales del sistema v3 verificados');
