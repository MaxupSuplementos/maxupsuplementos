const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Max reconoce la consulta general enviada desde la tienda', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  const block = source.match(/function _waNormalizar[\s\S]*?(?=function _waClaveEstado\()/);
  assert.ok(block, 'No se encontraron las funciones de intención general');
  const run = new Function(block[0] + `
    var mensaje = 'Hola MAXUP! Estoy viendo su catálogo y quiero más info sobre sus productos y precios. ¿Pueden asesorarme?';
    return {
      esGeneral: _waEsConsultaGeneralCatalogo(_waNormalizar(mensaje)),
      productoPuntual: _waEsConsultaGeneralCatalogo(_waNormalizar('precio de proteína Star')),
      respuesta: _waRespuestaCatalogoGeneral()
    };
  `);
  const result = run();
  assert.equal(result.esGeneral, true);
  assert.equal(result.productoPuntual, false);
  assert.match(result.respuesta, /Soy \*Max\*/);
  assert.match(result.respuesta, /proteínas/);
  assert.doesNotMatch(result.respuesta, /No encontre stock/i);
});

test('Max deriva a los dos WhatsApp de atención humana', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'Api.gs'), 'utf8');
  const constants = source.match(/var WA_ATENCION_HUMANA_1[\s\S]*?var WA_ATENCION_HUMANA_2[^;]+;/);
  const block = source.match(/function _waDerivarHumano[\s\S]*?(?=function _enviarWhatsAppTexto\()/);
  assert.ok(constants && block, 'No se encontró la derivación humana');
  const run = new Function(`
    function _waGuardarEstado() {}
    function _notificarTelegram() { return false; }
    ${constants[0]}
    ${block[0]}
    return _waDerivarHumano('5491112345678', 'prueba');
  `);
  const respuesta = run();
  assert.match(respuesta, /wa\.me\/5491168461457/);
  assert.match(respuesta, /wa\.me\/5493875104606/);
  assert.match(respuesta, /Toca el enlace/);
});

