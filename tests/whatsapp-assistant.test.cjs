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

