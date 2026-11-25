import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { cp, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const read = async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const editorial = await read('editorial.json');
const inventory = await read('arquivos.json');
const alt = await read('assets/fotos/descricoes.json');
const origin = editorial.origin;
const release = editorial.repository + '/releases/download/' + editorial.releaseTag + '/';
const formats = { '16x9': 'horizontal', '9x16': 'vertical' };
const modes = { captioned: 'com-legendas', clean: 'sem-legendas' };
const publicFiles = [];
const xml = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const jsonForHtml = obj => JSON.stringify(obj).replaceAll('<', '\\u003c');
const full = src => new URL(src, origin).href;
const episodes = editorial.episodes.map(e => {
  const source = inventory.videos.find(v => v.id.toUpperCase() === e.id);
  if (!source) throw new Error('Falta a peça ' + e.id);
  const id = e.id.toLowerCase(), base = '/videos/' + e.slug + '/';
  const media = {}, shareUrls = {};
  for (const [fmt, folder] of Object.entries(formats)) {
    media[fmt] = { hd: {}, light: {} };
    shareUrls[fmt] = {};
    for (const [mode, captions] of Object.entries(modes)) {
      shareUrls[fmt][mode] = base + folder + '/' + captions + '/';
      for (const [quality, label] of [['hd', 'hd'], ['light', 'leve']]) {
        const asset = source.formats[fmt].variants[label + '-' + captions];
        if (!asset?.bytes || !/^[a-f0-9]{64}$/.test(asset.sha256)) throw new Error('Arquivo incompleto: ' + e.id);
        const local = '/media/' + asset.file;
        media[fmt][quality][mode] = { url: quality === 'light' ? local : release + asset.file, bytes: asset.bytes, width: asset.width, height: asset.height };
        if (quality === 'light') {
          media[fmt][quality][mode].playUrl = local;
          publicFiles.push(asset);
        }
      }
    }
  }
  return { ...e, url: base, media, shareUrls, duration: source.duration, poster: '/assets/fotos/' + id + '.webp', posterAlt: alt[e.id], posterVertical: '/assets/retratos/' + id + '.webp', captionUrl: '/assets/legendas/' + id + '.vtt' };
});
if (episodes.length !== 12 || new Set(publicFiles.map(a => a.file)).size !== 48) throw new Error('Catálogo incompleto');

await mkdir(dist, { recursive: true });
await cp(path.join(root, 'assets'), path.join(dist, 'assets'), {
  recursive: true,
  filter: source => !['desktop.ini','thumbs.db','.ds_store'].includes(path.basename(source).toLowerCase())
});
for (const name of ['app.js', 'app.css']) await cp(path.join(root, name), path.join(dist, name));
const outMedia = path.join(dist, 'media');
await mkdir(outMedia, { recursive: true });
async function digest(file) {
  const hash = createHash('sha256');
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return hash.digest('hex');
}
async function syncAsset(asset) {
  const target = path.join(outMedia, asset.file), tmp = target + '.part';
  if ((await stat(target).catch(() => null))?.size === asset.bytes && await digest(target) === asset.sha256) return;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      if (process.env.MEDIA_SOURCE_DIR) await cp(path.join(process.env.MEDIA_SOURCE_DIR, asset.file), tmp);
      else {
        const res = await fetch(release + asset.file, { signal: AbortSignal.timeout(120000), headers: { 'User-Agent': 'CIAP-Galeria-Build/1.0' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
      }
      if ((await stat(tmp)).size !== asset.bytes || await digest(tmp) !== asset.sha256) throw new Error('Falha na verificação SHA-256');
      await rename(tmp, target);
      return;
    } catch (error) {
      await rm(tmp, { force: true });
      if (attempt === 4) throw new Error(asset.file + ' — ' + error.message);
      await new Promise(resolve => setTimeout(resolve, attempt * 1400));
    }
  }
}
let next = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (next < publicFiles.length) await syncAsset(publicFiles[next++]);
}));
const meta = (kind, key, content) => '<meta ' + kind + '="' + xml(key) + '" content="' + xml(content) + '">';
const posterUrl = (e, fmt, mode) => '/assets/social/' + e.id.toLowerCase() + '-' + fmt + '-' + (mode === 'clean' ? 'sem' : 'com') + '.jpg';
async function render(e = null, fmt = '16x9', mode = 'captioned', variant = false) {
  const isHome = e === null, active = e || episodes[0];
  const route = isHome ? '/' : (variant ? e.shareUrls[fmt][mode] : e.url);
  const canonical = full(route);
  const choice = formats[fmt] + ', ' + modes[mode].replace('-', ' ');
  const title = isHome ? 'CIAP/UFG no 3º Prêmio de Inovação' : active.title + (variant ? ' · ' + choice : '') + ' | CIAP/UFG';
  const description = isHome ? editorial.description : active.description + (variant ? ' Vídeo ' + choice + '.' : '');
  const art = isHome ? '/assets/social/colecao.jpg' : posterUrl(active, fmt, mode);
  const metaImage = full(art), video = active.media[fmt].light[mode];
  const site = { ...editorial, episodes, homeUrl: '/', isHome, selected: active.id, initialFormat: fmt, initialCaption: mode };
  const og = { 'og:locale':'pt_BR', 'og:type':isHome?'website':'video.other', 'og:site_name':'CIAP/UFG · 3º Prêmio de Inovação', 'og:title':title, 'og:description':description, 'og:url':canonical, 'og:image':metaImage, 'og:image:secure_url':metaImage, 'og:image:type':'image/jpeg', 'og:image:width':'1200','og:image:height':'630','og:image:alt':isHome?'A equipe do CIAP segura o troféu diante do painel do 3º Prêmio de Inovação.':active.posterAlt };
  if (!isHome) Object.assign(og, {'og:video':full(video.url),'og:video:secure_url':full(video.url),'og:video:type':'video/mp4','og:video:width':video.width,'og:video:height':video.height,'video:duration':Math.round(active.duration)});
  const xCard = { 'twitter:card':'summary_large_image','twitter:title':title, 'twitter:description':description, 'twitter:image':metaImage,'twitter:image:alt':og['og:image:alt'] };
  const structured = isHome ? { '@type':'CollectionPage',name:title,description,url:canonical,mainEntity:{'@type':'ItemList',itemListElement:episodes.map((v,i)=>({'@type':'ListItem',position:i+1,name:v.title,url:full(v.url)}))} } : { '@type':'VideoObject',name:active.title,description,thumbnailUrl:[metaImage],uploadDate:'2026-11-25T00:00:00-03:00',duration:'PT'+Math.round(active.duration)+'S',contentUrl:full(video.url),url:canonical,inLanguage:'pt-BR' };
  const links = episodes.map(item => '<li><a href="'+xml(item.url)+'">'+xml(item.title)+'</a></li>').join('');
  const credits = editorial.institutions.map(org=>'<a href="'+xml(org.url)+'">'+xml(org.name)+'</a>').join(' · ');
  const feature = isHome ? '<img src="'+editorial.cover+'" alt="'+xml(editorial.coverAlt)+'" width="840">' : '<video playsinline controls preload="metadata" width="840" poster="'+xml(fmt==='9x16'?active.posterVertical:active.poster)+'" src="'+xml(video.url)+'"></video><p><a download href="'+xml(video.url)+'">Baixar versão leve</a> · <a href="'+xml(active.media[fmt].hd[mode].url)+'">Baixar em Full HD</a></p>';
  const fallback = '<article><h1>'+xml(isHome?editorial.title:active.title)+'</h1><p>'+xml(description)+'</p>'+feature+'<nav aria-label="Vídeos da coleção"><h2>Os 12 vídeos</h2><ol>'+links+'</ol></nav><footer>'+credits+' · <a href="'+editorial.vozes.url+'">Vozes da Gestão Pública</a><p>Site desenvolvido por <a href="'+editorial.creator.links[0].url+'">Yan Diamantino</a>.</p></footer></article>';
  const page = '<!doctype html><html lang="pt-BR" prefix="og: https://ogp.me/ns# video: https://ogp.me/ns/video#"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#101e34"><title>'+xml(title)+'</title>'+meta('name','description',description)+'<link rel="canonical" href="'+canonical+'"><link rel="icon" type="image/png" href="/assets/icone.png">'+Object.entries(og).map(([k,v])=>meta('property',k,v)).join('')+Object.entries(xCard).map(([k,v])=>meta('name',k,v)).join('')+'<script type="application/ld+json">'+jsonForHtml({'@context':'https://schema.org',...structured})+'</script><link rel="preload" as="font" type="font/woff2" href="/assets/fonts/barlow-condensed-700.woff2" crossorigin><link rel="stylesheet" href="/app.css"></head><body><div id="app">'+fallback+'</div><script id="site-data" type="application/json">'+jsonForHtml(site)+'</script><script src="/app.js" defer></script></body></html>';
  const folder = path.join(dist, route.slice(1));
  await mkdir(folder,{recursive:true});
  await writeFile(path.join(folder,'index.html'),page);
}
await render();
for(const ep of episodes) {
  await render(ep);
  for(const fmt of Object.keys(formats)) for(const mode of Object.keys(modes)) await render(ep,fmt,mode,true);
}
await writeFile(path.join(dist,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/',...episodes.map(v=>v.url)].map(s=>'<url><loc>'+xml(full(s))+'</loc></url>').join('')+'</urlset>');
await writeFile(path.join(dist,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n');
console.log('61 páginas com Open Graph. 48 MP4 de reprodução e 48 versões Full HD no catálogo.');
