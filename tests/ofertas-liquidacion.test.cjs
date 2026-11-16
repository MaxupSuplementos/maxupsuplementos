const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const api = fs.readFileSync(path.join(root, 'Api.gs'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(api, /admin_ofertas_web/,
  'el panel debe poder consultar los productos y las ofertas activas');
assert.match(api, /admin_oferta_guardar/,
  'el panel debe poder publicar o quitar un precio de liquidación');
assert.match(api, /function adminGuardarOfertaWeb\(/,
  'debe existir una operación protegida para guardar la oferta');
assert.match(api, /precio >= p/,
  'el precio de liquidación debe ser menor al precio normal');
assert.match(api, /_leerOfertasManualesWeb_\(\)/,
  'las ofertas manuales deben incorporarse al apartado público');

assert.match(index, /OFERTAS Y LIQUIDACIÓN/,
  'la tienda debe mostrar un apartado reconocible de ofertas y liquidación');
assert.match(app, /p\.precioRegular/,
  'la tarjeta debe mostrar el precio normal anterior');
assert.match(app, /p\.precioOferta/,
  'la tarjeta debe destacar el precio especial');
assert.match(admin, /id="tabOfertas"/,
  'el administrador debe tener su propia pantalla de ofertas');
assert.match(admin, /creatina gold, whey pro, catsuit/,
  'el administrador debe permitir elegir cualquier producto');

console.log('Ofertas y liquidación administrables: OK');
