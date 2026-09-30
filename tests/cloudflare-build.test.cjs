const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

test('Cloudflare recibe solo la tienda pública y conserva las reglas de caché', () => {
  const result = spawnSync(process.execPath, ['tools/build-cloudflare.mjs'], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  for (const required of ['index.html', 'app.js', 'styles.css', 'sw.js', '_headers']) {
    assert.ok(fs.existsSync(path.join(dist, required)), `falta ${required} en dist`);
  }
  assert.equal(fs.existsSync(path.join(dist, 'Api.gs')), false,
    'el código interno de Apps Script no debe publicarse');
  assert.equal(fs.existsSync(path.join(dist, 'tests')), false,
    'las pruebas no deben publicarse');

  const headers = fs.readFileSync(path.join(dist, '_headers'), 'utf8');
  assert.match(headers, /\/app\.js[\s\S]*max-age=31536000/);
  assert.match(headers, /\/sw\.js[\s\S]*max-age=0/);
});
