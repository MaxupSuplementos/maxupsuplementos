import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

function fechaArgentina() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

const fecha = process.env.MAXUP_SOCIAL_DATE || fechaArgentina();
const salida = path.resolve('generated/daily/current');
const url = `https://maxupsuplementos.github.io/maxupsuplementos/promo.html?modo=diario&fecha=${encodeURIComponent(fecha)}`;
await fs.rm(salida, { recursive: true, force: true });
await fs.mkdir(salida, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => {
    const cards = [...document.querySelectorAll('.daily-card')];
    return cards.length === 5 && cards.every(card => card.querySelector('.daily-status')?.textContent.includes('Lista para publicar'));
  }, { timeout: 120000 });

  const placas = await page.evaluate(() => [...document.querySelectorAll('.daily-card')].map((card, index) => ({
    orden: index + 1,
    titulo: card.querySelector('h2')?.textContent?.replace(/^\d+\.\s*/, '').trim() || `Producto ${index + 1}`,
    imagen: card.querySelector('canvas')?.toDataURL('image/jpeg', 0.94) || ''
  })));
  if (placas.length !== 5 || placas.some(placa => !placa.imagen.startsWith('data:image/jpeg;base64,'))) {
    throw new Error('El generador no devolvió las cinco imágenes completas.');
  }

  const items = [];
  for (const placa of placas) {
    const archivo = `${String(placa.orden).padStart(2, '0')}.jpg`;
    const base64 = placa.imagen.slice(placa.imagen.indexOf(',') + 1);
    await fs.writeFile(path.join(salida, archivo), Buffer.from(base64, 'base64'));
    items.push({
      orden: placa.orden,
      titulo: placa.titulo,
      file: `generated/daily/current/${archivo}`,
      caption: `${placa.titulo}\n\nMAXUP Suplementos\nmaxupsuplementos.com.ar`
    });
  }
  const manifest = { fecha, generado: new Date().toISOString(), cantidad: items.length, items };
  await fs.writeFile(path.resolve('generated/daily/latest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Generadas ${items.length} publicaciones para ${fecha}.`);
} finally {
  await browser.close();
}
