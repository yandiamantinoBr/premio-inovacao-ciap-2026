(() => {
  'use strict';

  const dataNode = document.getElementById('site-data');
  const app = document.getElementById('app');
  if (!dataNode || !app) return;
  const data = JSON.parse(dataNode.textContent);
  const episodes = data.episodes || [];
  if (!episodes.length) return;

  const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function safeUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(value, location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  }
  const attrUrl = value => esc(safeUrl(value));
  const pathHome = data.homeUrl || '/';
  const current = episodes.find(item => item.id === data.selected) || episodes[0];
  const isHome = data.isHome ?? !location.pathname.startsWith('/videos/');
  const sequence = ep => String(episodes.indexOf(ep) + 1).padStart(2, '0');
  const icons = {
    play: '<path d="m8 4.9 11.5 7.1L8 19.1z" fill="currentColor" stroke="none"/>',
    arrow: '<path d="M4 12h15M13 5l7 7-7 7"/>',
    external: '<path d="M6 18 18 6M7 6h11v11"/>',
    down: '<path d="M12 4v15m-7-7 7 7 7-7"/>',
    prev: '<path d="m14 5-7 7 7 7"/>',
    next: '<path d="m9 5 7 7-7 7"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19"/>',
    moon: '<path d="M20.7 13.8A8.8 8.8 0 0 1 10.2 3.3 9 9 0 1 0 20.7 13.8Z"/>',
    download: '<path d="M12 3v11m-4-4 4 4 4-4M4 16v4h16v-4"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    share: '<path d="M12 15V3M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    whatsapp: '<path d="M20.6 11.7a8.6 8.6 0 0 1-12.8 7.5L3 20.6l1.4-4.7a8.6 8.6 0 1 1 16.2-4.2Z"/><path d="M8 7.5c1-.6 1.4.4 1.8 1.5.2.4-.6 1-.6 1.3.3.9 1.5 2.2 2.9 2.7.4.2.9-.9 1.3-.9s2 .9 2.1 1.2c.2.7-.5 1.6-1.2 1.8-2 .5-6.5-2.2-7.2-5.8-.2-.9.4-1.5.9-1.8Z" fill="currentColor" stroke="none"/>',
    landscape: '<rect x="2.5" y="5" width="19" height="14" rx="2"/>',
    portrait: '<rect x="6" y="2" width="12" height="20" rx="2"/>',
    mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5.5 11v.5a6.5 6.5 0 0 0 13 0V11M12 18v4m-4 0h8"/>',
    link: '<path d="m10 14 4-4m-5.5 5.5-1 1a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5-.1m1 2.1 1-1a3.5 3.5 0 0 1 5 5l-4 4a3.5 3.5 0 0 1-5 .1"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11s-7-6-7-11a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>'
  };
  const icon = name => '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' + (icons[name] || '') + '</svg>';
  function duration(value) {
    if (typeof value === 'string' && value.includes(':')) return value;
    const seconds = Math.round(Number(value) || 0);
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }
  function sizeOf(file) {
    if (!file?.bytes) return '';
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(file.bytes / 1000000) + ' MB';
  }

  const modeKey = 'ciap-galeria-tema';
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  let storedTheme;
  try { storedTheme = localStorage.getItem(modeKey); } catch {}
  const validTheme = value => ['dark', 'light'].includes(value);
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#11161e' : '#f6f5f0');
    document.querySelectorAll('img[data-brand]').forEach(img => {
      const brand = img.dataset.brand;
      const value = theme === 'dark' ? data.logos?.[brand] : data.logos?.[brand + 'Color'];
      img.src = safeUrl(value || data.logos?.[brand]);
      img.classList.toggle('mono-logo', !value);
    });
    const btn = document.getElementById('theme');
    if (!btn) return;
    const next = theme === 'dark' ? 'claro' : 'escuro';
    btn.setAttribute('aria-label', 'Ativar modo ' + next);
    btn.title = 'Ativar modo ' + next;
    btn.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
  }
  const firstTheme = validTheme(storedTheme) ? storedTheme : (systemDark.matches ? 'dark' : 'light');
  setTheme(firstTheme);

  function header() {
    const logo = data.logos?.ciap;
    return '<header class="mast"><div class="wrap mast-inner"><a class="identity" href="' + attrUrl(pathHome) + '" aria-label="Galeria audiovisual do CIAP, início">' +
      (logo ? '<img class="ciap-logo" data-brand="ciap" src="' + attrUrl(logo) + '" alt="CIAP">' : '<strong class="ciap-text">CIAP</strong>') +
      '<span class="identity-sep" aria-hidden="true"></span><span class="identity-title">Audiovisual</span></a>' +
      '<nav class="main-nav" aria-label="Navegação principal"><a href="' + attrUrl(pathHome + '#filmes') + '">Filmes</a><a href="#sobre">Sobre</a></nav>' +
      '<button type="button" id="theme" class="theme" aria-label="Alternar tema"></button></div></header>';
  }

  function hero() {
    const main = episodes[0];
    const cover = data.cover || main.poster;
    return '<section class="hero" aria-labelledby="hero-title">' +
      '<img class="hero-image" src="' + attrUrl(cover) + '" alt="' + esc(data.coverAlt || '') + '" fetchpriority="high">' +
      '<div class="hero-shade"></div><div class="hero-content"><p class="eyebrow hero-eyebrow"><span class="bar"></span>3º Prêmio de Inovação</p>' +
      '<h1 id="hero-title">ChatPP<span>no pódio.</span></h1>' +
      '<p class="hero-story">A conquista do CIAP e da UFG no Prêmio de Inovação do Setor Público de Goiás em ' + episodes.length + ' filmes.</p>' +
      '<div class="hero-actions"><a class="btn hero-watch" href="' + attrUrl(main.url) + '">' + icon('play') + 'Assistir ao filme</a>' +
      '<a class="hero-browse" href="#filmes">Explorar a série ' + icon('down') + '</a></div></div>' +
      '<div class="hero-meta">' + icon('pin') + '<span>Goiânia, GO</span><i></i><time datetime="2026-11-24">24 nov. 2026</time></div></section>';
  }
  function card(ep, index) {
    return '<article class="film-card" data-category="' + esc(ep.category || '') + '"><a href="' + attrUrl(ep.url) + '">' +
      '<div class="card-img"><img src="' + attrUrl(ep.poster) + '" width="768" height="432" alt="' + esc(ep.posterAlt || '') + '" loading="' + (index < 3 ? 'eager' : 'lazy') + '" decoding="async">' +
      '<span class="card-play" aria-hidden="true">' + icon('play') + '</span><span class="runtime">' + esc(duration(ep.duration)) + '</span></div>' +
      '<div class="card-caption"><div><p class="card-tag">' + (ep.category ? esc(ep.category) : 'Filme ' + sequence(ep)) +
      '</p><h3>' + esc(ep.title) + '</h3></div><span class="card-arrow">' + icon('external') + '</span></div></a></article>';
  }
  function catalogue() {
    const categories = [...new Set(episodes.map(v => v.category).filter(Boolean))];
    const tabs = categories.length > 1 ? '<div class="filters" role="group" aria-label="Filtrar por assunto">' +
      ['Todos', ...categories].map((v, i) => '<button class="filter" type="button" data-filter="' + esc(i ? v : '') + '" aria-pressed="' + String(i === 0) + '">' + esc(v) + '</button>').join('') + '</div>' : '';
    return '<section class="catalogue" id="filmes" aria-labelledby="catalogue-title"><div class="catalog-top"><div class="section-naming">' +
      '<p class="eyebrow section-kicker"><span class="bar"></span>Acervo audiovisual</p><h2 id="catalogue-title">Os filmes<span class="count">' + episodes.length + '</span></h2></div>' + tabs + '</div>' +
      '<div class="card-grid">' + episodes.map(card).join('') + '</div><p class="sr" id="filter-status" role="status"></p></section>';
  }
  function externalLink(item, cls = '') {
    if (!item?.url) return '';
    return '<a class="' + cls + '" href="' + attrUrl(item.url) + '" target="_blank" rel="noopener noreferrer">' + esc(item.name || item.label || item.url) + icon('external') + '</a>';
  }
  function footer() {
    const v = data.vozes || {};
    const podcast = !v.url ? '' : '<aside class="podcast" aria-labelledby="podcast-title"><div class="podcast-copy"><p class="eyebrow podcast-kicker">' +
      icon('mic') + 'Podcast</p><h2 id="podcast-title">Vozes da Gestão Pública</h2><p>' +
      esc(v.description || 'Conversas sobre gestão pública e as pessoas que fazem as políticas públicas acontecerem.') +
      '</p><a class="podcast-link" href="' + attrUrl(v.url) + '" target="_blank" rel="noopener noreferrer">Conheça o podcast ' + icon('external') + '</a></div>' +
      (v.image ? '<img class="podcast-art" src="' + attrUrl(v.image) + '" alt="' + esc(v.coverAlt || '') + '" loading="lazy" decoding="async">' :
      '<div class="wave" aria-hidden="true">' + Array.from({length: 56}, (_, i) => {
        const envelope = .28 + .72 * Math.pow(Math.sin((i + 4) * Math.PI / 35), 2);
        const height = Math.round(8 + envelope * (50 + 44 * Math.sin(i * .68) * Math.cos(i * .23)));
        return '<i style="--bar-height:' + height + '%"></i>';
      }).join('') + '</div>') + '</aside>';
    const institutions = (data.institutions || []).map(institution => '<section class="foot-links"><h3>' +
      esc(institution.name) + '</h3>' + externalLink({ name: 'Site oficial', url: institution.url }) +
      (institution.links || []).map(x => externalLink(x)).join('') + '</section>').join('');
    const author = data.creator || { name: 'Yan Diamantino' };
    return '<div class="wrap">' + podcast + '</div><footer class="footer" id="sobre"><div class="wrap">' +
      '<div class="foot-grid"><div class="foot-intro"><div class="co-brand">' +
      (data.logos?.ciap ? '<img data-brand="ciap" src="' + attrUrl(data.logos.ciap) + '" alt="CIAP">' : '<b>CIAP</b>') +
      '<span></span>' + (data.logos?.ufg ? '<img data-brand="ufg" src="' + attrUrl(data.logos.ufg) + '" alt="Universidade Federal de Goiás">' : '<b>UFG</b>') +
      '</div><p>Cobertura audiovisual do 3º Prêmio de Inovação do Setor Público de Goiás.</p></div>' + institutions +
      '<section class="foot-links author"><h3>Desenvolvido por</h3><b>' + esc(author.name || 'Yan Diamantino') + '</b>' +
      (author.links || []).map(x => externalLink(x)).join('') + '</section></div>' +
      '<div class="foot-line"><span>CIAP · Universidade Federal de Goiás</span><a href="#topo">Voltar ao topo ' + icon('down') + '</a></div></div></footer>';
  }

  let format = ['9x16','16x9'].includes(data.initialFormat) ? data.initialFormat : '16x9';
  let caption = ['captioned','clean'].includes(data.initialCaption) ? data.initialCaption : 'captioned';
  function preferencesFromAddress() {
    const params = new URLSearchParams(location.search);
    if (['9x16','16x9'].includes(params.get('formato'))) format = params.get('formato');
    if (['sem','com'].includes(params.get('legendas'))) caption = params.get('legendas') === 'sem' ? 'clean' : 'captioned';
  }
  preferencesFromAddress();
  const hasFileShare = (() => {
    try { return !!navigator.canShare?.({ files: [new File(['v'], 'filme.mp4', { type: 'video/mp4' })] }); }
    catch { return false; }
  })();
  function clipUrl(ep = current) {
    const specific = ep.shareUrls?.[format]?.[caption];
    if (specific) return safeUrl(specific);
    const url = new URL(ep.url, location.href);
    url.searchParams.set('formato', format);
    url.searchParams.set('legendas', caption === 'captioned' ? 'com' : 'sem');
    return url.href;
  }
  function specs() {
    return '<section class="controls-box" aria-labelledby="versions-title"><h2 id="versions-title">Escolha a versão</h2>' +
      '<fieldset><legend>Formato</legend><div class="segments"><button type="button" data-format="16x9">' + icon('landscape') + 'Horizontal <small>16:9</small></button>' +
      '<button type="button" data-format="9x16">' + icon('portrait') + 'Vertical <small>9:16</small></button></div></fieldset>' +
      '<fieldset><legend>Legendas no vídeo</legend><div class="segments"><button type="button" data-caption="captioned">Com legenda</button><button type="button" data-caption="clean">Sem legenda</button></div></fieldset>' +
      '<div class="download"><h3>Baixar vídeo</h3><a class="download-row" id="dl-hd" download><span class="download-icon">' + icon('download') +
      '</span><span class="download-name"><b>Original HD</b><small>MP4 em 1080p</small></span><span class="download-size" id="sz-hd"></span></a>' +
      '<a class="download-row" id="dl-light" download><span class="download-icon">' + icon('download') + '</span><span class="download-name"><b>Leve para WhatsApp</b><small>MP4 compactado</small></span><span class="download-size" id="sz-light"></span></a></div>' +
      '</section>';
  }
  function watch() {
    return '<div class="watch wrap"><nav class="breadcrumb" aria-label="Caminho de navegação"><a href="' + attrUrl(pathHome + '#filmes') + '">Filmes</a>' +
      icon('next') + '<span>Filme ' + sequence(current) + '</span></nav><p class="eyebrow section-kicker"><span class="bar"></span>' +
      esc(current.category || '3º Prêmio de Inovação') + '</p><h1 class="watch-title">' + esc(current.title) + '</h1>' +
      '<div class="watch-layout"><div class="watch-main"><div class="video-frame"><video id="video" playsinline controls preload="metadata" aria-label="' + esc(current.title) + '"></video></div>' +
      '<p class="video-error" id="video-error" hidden>Não foi possível carregar o vídeo. <button type="button" id="retry-video">Tentar novamente</button> ou <a id="open-file">abrir o arquivo</a>.</p>' +
      '<p class="watch-meta">Filme ' + sequence(current) + ' de ' + episodes.length + '<i></i>' + esc(duration(current.duration)) + '<i></i><span id="stream-quality">Reprodução leve</span></p>' +
      '<p class="watch-desc">' + esc(current.description || '') + '</p>' +
      '<div class="sharing"><h2>Compartilhar</h2><div class="share-buttons"><a class="share-btn" id="wa" target="_blank" rel="noopener noreferrer">' +
      icon('whatsapp') + 'Link no WhatsApp</a><button class="share-btn" id="copy" type="button">' + icon('copy') + 'Copiar link</button>' +
      (navigator.share ? '<button type="button" class="share-btn" id="native-share">' + icon('share') + 'Mais opções</button>' : '') +
      (hasFileShare ? '<button type="button" class="share-btn" id="share-file">' + icon('download') + 'Encaminhar MP4 leve</button>' : '') +
      '</div><p class="feedback" id="share-status" aria-live="polite"></p></div></div>' + specs() + '</div>' + nextFilms() + '</div>';
  }
  function nextFilms() {
    const index = episodes.indexOf(current);
    const near = Array.from({length:Math.min(3, episodes.length - 1)}, (_, i) => episodes[(index + i + 1) % episodes.length]);
    return '<section class="next-films" aria-labelledby="next-heading"><div class="next-head"><h2 id="next-heading">Continue assistindo</h2>' +
      '<a class="text-link" href="' + attrUrl(pathHome + '#filmes') + '">Todos os filmes ' + icon('arrow') + '</a></div><div class="card-grid">' + near.map(card).join('') + '</div></section>';
  }
  app.innerHTML = '<div id="topo"></div><a class="skip-link" href="#principal">Pular para o conteúdo</a>' + header() +
    '<main id="principal">' + (isHome ? '<div class="wrap home">' + hero() + catalogue() + '</div>' : watch()) + '</main>' + footer();
  setTheme(firstTheme);
  document.getElementById('theme').addEventListener('click', () => {
    storedTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(modeKey, storedTheme); } catch {}
    setTheme(storedTheme);
  });
  systemDark.addEventListener('change', () => {
    if (!validTheme(storedTheme)) setTheme(systemDark.matches ? 'dark' : 'light');
  });
  document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => {
    const chosen = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach(el => el.setAttribute('aria-pressed', String(el === btn)));
    let count = 0;
    document.querySelectorAll('.film-card').forEach(card => {
      card.hidden = !!chosen && card.dataset.category !== chosen;
      if (!card.hidden) count++;
    });
    document.querySelector('.count').textContent = count;
    document.getElementById('filter-status').textContent = count + (count === 1 ? ' filme exibido.' : ' filmes exibidos.');
  }));
  if (isHome) return;

  const byId = id => document.getElementById(id);
  const video = byId('video');
  const status = byId('share-status');
  const fileButton = byId('share-file');
  let fileTask = null;
  let readyFile = null;
  let pendingSeek = null;
  let resume = false;
  let renderToken = 0;
  function currentFiles() { return current.media?.[format] || {}; }
  function updateVersion(keepTime, rewriteUrl = false) {
    const token = ++renderToken;
    if (fileTask) fileTask.abort();
    readyFile = null; fileTask = null;
    if (fileButton) { fileButton.disabled = false; fileButton.innerHTML = icon('download') + 'Encaminhar MP4 leve'; }
    status.textContent = '';
    const light = currentFiles().light?.[caption] || {};
    const hd = currentFiles().hd?.[caption] || {};
    const source = light.playUrl || hd.playUrl || light.url || hd.url;
    byId('stream-quality').textContent = source && (source === light.playUrl || source === light.url) ? 'Reprodução leve' : 'Reprodução em HD';
    const setSrc = safeUrl(source);
    const previousTime = keepTime ? (video.readyState && Number.isFinite(video.currentTime) ? video.currentTime : pendingSeek || 0) : 0;
    const playing = keepTime && (!video.paused || (video.readyState === 0 && resume));
    pendingSeek = previousTime;
    resume = playing;
    const frame = video.closest('.video-frame');
    frame.dataset.format = format;
    video.poster = safeUrl(format === '9x16' ? (current.posterVertical || current.poster) : current.poster);
    document.querySelectorAll('[data-format]').forEach(btn => {
      if (btn.tagName === 'BUTTON') btn.setAttribute('aria-pressed', String(btn.dataset.format === format));
    });
    document.querySelectorAll('[data-caption]').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.caption === caption)));
    for (const [key, file] of [['hd', hd], ['light', light]]) {
      const a = byId('dl-' + key);
      if (file.url) { a.href = safeUrl(file.url); a.removeAttribute('aria-disabled'); }
      else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); }
      byId('sz-' + key).textContent = sizeOf(file);
    }
    byId('open-file').href = safeUrl(hd.url || light.url) || '#';
    byId('wa').href = 'https://wa.me/?text=' + encodeURIComponent(current.title + '\n' + clipUrl());
    byId('video-error').hidden = true;
    if (rewriteUrl) history.replaceState(history.state, '', clipUrl());
    video.onloadedmetadata = () => {
      if (token !== renderToken) return;
      if (pendingSeek > 0 && Number.isFinite(video.duration)) {
        try { video.currentTime = Math.min(pendingSeek, Math.max(0, video.duration - .04)); } catch {}
      }
      pendingSeek = null;
      if (resume) { resume = false; video.play().catch(() => {}); }
    };
    video.onerror = () => {
      if (token === renderToken) byId('video-error').hidden = false;
    };
    video.replaceChildren();
    if (caption === 'clean' && current.captionUrl) {
      const track = document.createElement('track');
      track.kind = 'captions'; track.srclang = 'pt-BR'; track.label = 'Português'; track.src = safeUrl(current.captionUrl);
      video.append(track);
    }
    if (setSrc) { video.src = setSrc; video.load(); }
    else { video.removeAttribute('src'); video.load(); byId('video-error').hidden = false; }
  }
  document.querySelectorAll('button[data-format]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.format === format) return;
    format = b.dataset.format; updateVersion(true, true);
  }));
  document.querySelectorAll('button[data-caption]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.caption === caption) return;
    caption = b.dataset.caption; updateVersion(true, true);
  }));
  byId('retry-video').addEventListener('click', () => updateVersion(true));
  byId('copy').addEventListener('click', async () => {
    const url = clipUrl();
    try {
      if (!navigator.clipboard?.writeText) throw new Error();
      await navigator.clipboard.writeText(url);
      status.textContent = 'Link da versão selecionada copiado.';
    } catch {
      const field = document.createElement('input');
      field.className = 'copy-field'; field.value = url; field.readOnly = true;
      field.setAttribute('aria-label', 'Link da versão selecionada');
      status.replaceChildren(document.createTextNode('Copie este link: '), field);
      field.focus(); field.select();
    }
  });
  byId('native-share')?.addEventListener('click', async () => {
    try { await navigator.share({ title: current.title, url: clipUrl() }); }
    catch (e) { if (e.name !== 'AbortError') status.textContent = 'Use o botão Copiar link para encaminhar esta versão.'; }
  });
  function fileFallback(version, label) {
    const copy = document.createElement('button');
    copy.type = 'button'; copy.textContent = 'Copiar o link desta versão';
    copy.addEventListener('click', () => byId('copy').click());
    status.replaceChildren(document.createTextNode('O envio do arquivo ficou indisponível. '), copy);
    if (version?.url) {
      const link = document.createElement('a');
      link.href = safeUrl(version.url); link.download = ''; link.textContent = label;
      status.append(document.createTextNode(' ou '), link, document.createTextNode('.'));
    }
  }
  fileButton?.addEventListener('click', async () => {
    if (readyFile) {
      try { await navigator.share({ files: [readyFile] }); }
      catch (e) { if (e.name !== 'AbortError') fileFallback(currentFiles().light?.[caption], 'baixar o MP4 leve'); }
      return;
    }
    const file = currentFiles().light?.[caption];
    if (!file) return;
    const task = new AbortController(); fileTask = task;
    fileButton.disabled = true;
    status.textContent = 'Preparando o MP4 leve para encaminhar…';
    try {
      const response = await fetch(safeUrl(file.playUrl || file.url), { signal: task.signal });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const expectedBytes = Number(file.bytes);
      if (!Number.isSafeInteger(expectedBytes) || blob.size !== expectedBytes || blob.size < 12) throw new Error();
      const header = new Uint8Array(await blob.slice(4, 8).arrayBuffer());
      if (String.fromCharCode(...header) !== 'ftyp') throw new Error();
      const prepared = new File([blob], current.id + '-' + format + '-' + (caption === 'captioned' ? 'com-legenda' : 'sem-legenda') + '.mp4', { type: 'video/mp4' });
      if (!navigator.canShare({ files: [prepared] })) throw new Error();
      if (task.signal.aborted) return;
      readyFile = prepared;
      fileButton.innerHTML = icon('share') + 'Enviar arquivo agora';
      status.textContent = 'MP4 pronto. Selecione Enviar arquivo agora para escolher o aplicativo.';
    } catch (e) {
      if (e.name !== 'AbortError') fileFallback(currentFiles().hd?.[caption], 'baixar o original HD');
    } finally {
      if (fileTask === task) { fileButton.disabled = false; fileTask = null; }
    }
  });
  updateVersion(false);
})();
