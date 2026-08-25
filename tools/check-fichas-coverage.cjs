const fs = require('node:fs');
const path = require('node:path');

const API = 'https://script.google.com/macros/s/AKfycbwUujcSoSyBWLLla-LOdovJmTDan-DP3O9Gp0k_MSupTHGEPB55TCZqllvGmEK6vlk/exec?accion=catalogo';
const CATEGORIAS = new Set([
  'proteina', 'vitamin', 'creatina', 'aminoacido', 'hidratacion', 'preworkout',
  'colageno', 'quemador', 'gainer', 'quimicos', 'barra'
]);

async function main() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'FichasPublicaciones.gs'), 'utf8');
  const block = source.match(/[\s\S]*?(?=function _leerFichasPublicaciones\()/);
  if (!block) throw new Error('No se pudo cargar el motor de fichas.');
  const ficha = new Function(block[0] + '\nreturn _fichaPublicacionBase;')();
  const response = await fetch(API);
  if (!response.ok) throw new Error(`Catálogo HTTP ${response.status}`);
  const data = await response.json();
  const productos = (data.productos || []).filter(p => {
    if (Number(p.stock) <= 0) return false;
    if (CATEGORIAS.has(String(p.categoria))) return true;
    return String(p.categoria) === 'otros' && /hydroxy max|pasta de mani/i.test(String(p.nombre));
  });
  const genericos = [];
  const incompletos = [];
  const textosCortados = [];

  for (const producto of productos) {
    const resultado = ficha(producto);
    if (/^Producto pensado para complementar/i.test(resultado.queEs)) genericos.push(producto);
    if (!resultado.queEs || !Array.isArray(resultado.beneficios) || resultado.beneficios.length !== 5) incompletos.push(producto);
    resultado.beneficios.forEach((beneficio, index) => {
      if (beneficio.length === 115 && !/[.!?]$/.test(beneficio)) {
        textosCortados.push(`${producto.marca} | ${producto.nombre} | B${index + 1}: ${beneficio}`);
      }
    });
  }

  console.log(JSON.stringify({
    activosRevisados: productos.length,
    genericos: genericos.map(p => `${p.marca} | ${p.nombre}`),
    incompletos: incompletos.map(p => `${p.marca} | ${p.nombre}`),
    textosCortados
  }, null, 2));
  if (genericos.length || incompletos.length || textosCortados.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
