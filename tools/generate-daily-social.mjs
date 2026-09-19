import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

function fechaArgentina() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

const fecha = process.env.MAXUP_SOCIAL_DATE || fechaArgentina();
const salida = path.resolve('generated/daily/current');
const apiBase = process.env.MAXUP_API_URL || 'https://script.google.com/macros/s/AKfycbwUujcSoSyBWLLla-LOdovJmTDan-DP3O9Gp0k_MSupTHGEPB55TCZqllvGmEK6vlk/exec';

async function fetchJsonWithRetry(action, attempts = 3) {
  const endpoint = `${apiBase}?accion=${encodeURIComponent(action)}`;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      console.log(`Consultando ${action} (${attempt}/${attempts})...`);
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(210000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      lastError = error;
      console.warn(`Falló ${action} (${attempt}/${attempts}): ${error.message}`);
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, 12000 * attempt));
    }
  }
  throw new Error(`No se pudo cargar ${action}: ${lastError?.message || 'error desconocido'}`);
}

const [catalogo, indumentaria] = await Promise.all([
  fetchJsonWithRetry('catalogo'),
  fetchJsonWithRetry('indumentaria')
]);
if (!Array.isArray(catalogo.productos) || catalogo.productos.length < 4) {
  throw new Error('El catálogo no devolvió suficientes suplementos para generar cuatro placas.');
}
if (!Array.isArray(indumentaria.prendas) || indumentaria.prendas.length < 1) {
  throw new Error('El catálogo no devolvió indumentaria para generar la quinta placa.');
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  return ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' })[ext] || 'application/octet-stream';
}

async function startStaticServer(root) {
  const resolvedRoot = path.resolve(root);
  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      const relative = decodeURIComponent(requestUrl.pathname === '/' ? '/promo.html' : requestUrl.pathname);
      const file = path.resolve(resolvedRoot, `.${relative}`);
      if (file !== resolvedRoot && !file.startsWith(resolvedRoot + path.sep)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const body = await fs.readFile(file);
      response.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
      response.end(body);
    } catch (error) {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

await fs.rm(salida, { recursive: true, force: true });
await fs.mkdir(salida, { recursive: true });

const local = await startStaticServer(process.cwd());
const promoBase = process.env.MAXUP_PROMO_URL || `${local.baseUrl}/promo.html`;
const url = `${promoBase}?modo=diario&fecha=${encodeURIComponent(fecha)}`;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  page.on('console', message => console.log(`[promo:${message.type()}] ${message.text()}`));
  page.on('pageerror', error => console.error(`[promo:error] ${error.message}`));
  await page.route(`${apiBase}**`, async route => {
    const action = new URL(route.request().url()).searchParams.get('accion');
    const payload = action === 'indumentaria' ? indumentaria : catalogo;
    await route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify(payload) });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => {
    const cards = [...document.querySelectorAll('.daily-card')];
    const types = cards.map(card => card.dataset.tipo);
    return cards.length === 5
      && types.filter(type => type === 'suplemento').length === 4
      && types.filter(type => type === 'indumentaria').length === 1
      && cards.every(card => card.querySelector('.daily-status')?.textContent.includes('Lista para publicar'));
  }, undefined, { timeout: 300000 });

  const placas = await page.evaluate(() => [...document.querySelectorAll('.daily-card')].map((card, index) => ({
    orden: index + 1,
    tipo: card.dataset.tipo || 'suplemento',
    titulo: card.querySelector('h2')?.textContent?.replace(/^\d+\.\s*/, '').trim() || `Producto ${index + 1}`,
    imagen: card.querySelector('canvas')?.toDataURL('image/jpeg', 0.94) || ''
  })));
  const suplementos = placas.filter(placa => placa.tipo === 'suplemento').length;
  const prendas = placas.filter(placa => placa.tipo === 'indumentaria').length;
  if (placas.length !== 5 || suplementos !== 4 || prendas !== 1 || placas.some(placa => !placa.imagen.startsWith('data:image/jpeg;base64,'))) {
    throw new Error(`El generador devolvió una mezcla inválida: ${suplementos} suplementos y ${prendas} prendas.`);
  }

  const items = [];
  for (const placa of placas) {
    const archivo = `${String(placa.orden).padStart(2, '0')}.jpg`;
    const base64 = placa.imagen.slice(placa.imagen.indexOf(',') + 1);
    await fs.writeFile(path.join(salida, archivo), Buffer.from(base64, 'base64'));
    items.push({
      orden: placa.orden,
      tipo: placa.tipo,
      titulo: placa.titulo,
      file: `generated/daily/current/${archivo}`,
      caption: `${placa.titulo}\n\nMAXUP Suplementos\n🛒 Mirá precios, stock y productos:\nhttps://maxupsuplementos.com.ar/`
    });
  }
  const manifest = { fecha, generado: new Date().toISOString(), cantidad: items.length, items };
  await fs.writeFile(path.resolve('generated/daily/latest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Generadas ${items.length} publicaciones para ${fecha}: 4 suplementos y 1 prenda.`);
} finally {
  await browser.close();
  await new Promise(resolve => local.server.close(resolve));
}
