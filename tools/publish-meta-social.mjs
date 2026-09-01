import fs from 'node:fs/promises';

if (String(process.env.META_AUTOPUBLISH || '').toLowerCase() !== 'true') {
  console.log('Publicación en Meta preparada pero desactivada hasta autorizar las cuentas.');
  process.exit(0);
}

const token = process.env.META_ACCESS_TOKEN || '';
const igUserId = process.env.META_IG_USER_ID || '';
const pageId = process.env.META_PAGE_ID || '';
const graphVersion = process.env.META_GRAPH_VERSION || 'v26.0';
if (!token || (!igUserId && !pageId)) throw new Error('Faltan las credenciales de Meta para publicar.');

const manifest = JSON.parse(await fs.readFile('generated/daily/latest.json', 'utf8'));
const repository = process.env.GITHUB_REPOSITORY || 'MaxupSuplementos/maxupsuplementos';
const revision = process.env.GITHUB_SHA || 'main';
const baseRaw = `https://raw.githubusercontent.com/${repository}/${revision}/`;

async function graph(path, payload) {
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${path}`, {
    method: 'POST', body: new URLSearchParams({ ...payload, access_token: token })
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(JSON.stringify(data.error || data));
  return data;
}

for (const item of manifest.items) {
  const imageUrl = baseRaw + item.file;
  if (igUserId) {
    const container = await graph(`${igUserId}/media`, { image_url: imageUrl, media_type: 'STORIES' });
    await graph(`${igUserId}/media_publish`, { creation_id: container.id });
    console.log(`Historia de Instagram publicada: ${item.titulo}`);
  }
  if (pageId) {
    await graph(`${pageId}/photos`, { url: imageUrl, caption: item.caption, published: 'true' });
    console.log(`Publicación de Facebook publicada: ${item.titulo}`);
  }
}
