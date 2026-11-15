// Şəriət məsələləri — oxu səhifəsi
(function () {
  const view = document.getElementById('view');
  const tocList = document.getElementById('tocList');
  const SOURCE = 'Mənbə: Ayətullah əl-üzma Seyid Əli Hüseyni Sistani cənablarının fətvaları, «Geniş izahlı şəriət məsələləri», I cild. ' +
    'Tərcümə: Bəxtiyar Hüseynov. Nəşr: <strong>«Zərdabi LTD» MMC</strong>, Bakı, 2018. Nəşriyyatın icazəsi ilə dərc olunur.';
  let INDEX = [];
  const cache = {};

  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lower = s => s.toLocaleLowerCase('az');
  const plain = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent; };

  function load(i) {
    if (!cache[i]) {
      const n = String(i).padStart(2, '0');
      cache[i] = fetch(`data/ch${n}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
    }
    return cache[i];
  }

  function parseHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    return { f: +p.get('f') || 0, m: +p.get('m') || 0, s: p.get('s'), b: p.get('b'), fn: p.get('fn'), q: p.get('q') };
  }

  function chapterOfMasala(n) {
    return INDEX.find(c => c.m && n >= c.m[0] && n <= c.m[1]);
  }

  // ---------- Font ölçüsü ----------
  let size = 1.06;
  try { size = parseFloat(localStorage.getItem('sr.size')) || size; } catch (e) { /* yox */ }
  function applySize() {
    document.documentElement.style.setProperty('--sr-size', size + 'rem');
    try { localStorage.setItem('sr.size', size); } catch (e) { /* yox */ }
  }
  document.getElementById('fontUp').onclick = () => { size = Math.min(1.5, +(size + 0.08).toFixed(2)); applySize(); };
  document.getElementById('fontDown').onclick = () => { size = Math.max(0.86, +(size - 0.08).toFixed(2)); applySize(); };
  applySize();

  // ---------- Mündəricat ----------
  const toc = document.getElementById('toc');
  const backdrop = document.getElementById('backdrop');
  const tocBtn = document.getElementById('tocBtn');
  function setToc(open) {
    toc.classList.toggle('open', open); backdrop.classList.toggle('open', open);
    tocBtn.setAttribute('aria-expanded', open);
  }
  tocBtn.onclick = () => setToc(!toc.classList.contains('open'));
  document.getElementById('tocClose').onclick = () => setToc(false);
  backdrop.onclick = () => setToc(false);

  function renderToc() {
    tocList.innerHTML = INDEX.map(c => `
      <details data-ch="${c.i}">
        <summary><a href="#f=${c.i}">${esc(c.t)}</a>${c.m ? `<small>${c.m[0]}–${c.m[1]}</small>` : ''}</summary>
        ${c.s.length ? `<ul>${c.s.map(s => `<li><a href="#f=${c.i}&s=${s.id}">${esc(s.t)}</a></li>`).join('')}</ul>` : ''}
      </details>`).join('');
    tocList.addEventListener('click', e => { if (e.target.closest('a')) setToc(false); });
  }
  function markToc(i) {
    tocList.querySelectorAll('details').forEach(d => {
      const on = +d.dataset.ch === i;
      d.classList.toggle('current', on);
      if (on) { d.open = true; toc.scrollTop = Math.max(0, d.offsetTop - toc.offsetTop - 60); }
    });
  }

  // ---------- Ana görünüş ----------
  function renderHome() {
    markToc(0);
    view.innerHTML = `
      <div class="sr-intro">
        <p>Bu bölmədə Ayətullah əl-üzma Seyid Əli Hüseyni Sistani cənablarının fətvaları əsasında hazırlanmış
        <strong>«Geniş izahlı şəriət məsələləri»</strong> kitabının (I cild) tam mətni yer alır. Mətn kitabdakı kimi,
        heç bir dəyişiklik edilmədən verilir.</p>
        <p class="sr-note">${SOURCE}</p>
        <p class="sr-note">Kitab Azərbaycan Respublikasının Dini Qurumlarla İş Üzrə Dövlət Komitəsinin DK-395/Q saylı,
        12 aprel 2018-ci il tarixli məktubu əsasında «Zərdabi LTD» MMC-nin mətbəəsində çap olunmuşdur.</p>
      </div>
      <h2 class="sr-h">Fəsillər</h2>
      <ol class="sr-chapters">
        ${INDEX.map(c => `<li><a href="#f=${c.i}"><span class="sr-chapters__n">${c.i}</span>
          <span class="sr-chapters__t">${esc(c.t)}</span>
          <span class="sr-chapters__m">${c.m ? `Məsələ ${c.m[0]}–${c.m[1]}` : 'Giriş'}</span></a></li>`).join('')}
      </ol>`;
    window.scrollTo(0, 0);
  }

  // ---------- Fəsil ----------
  async function renderChapter(h) {
    const meta = INDEX.find(c => c.i === h.f);
    if (!meta) return renderHome();
    view.innerHTML = '<p class="sr-loading">Yüklənir…</p>';
    let d;
    try { d = await load(h.f); } catch (e) { view.innerHTML = '<p class="sr-loading">Fəsli yükləmək olmadı. İnternet bağlantısını yoxlayın.</p>'; return; }
    markToc(h.f);
    const used = new Set();
    let html = `<header class="sr-chhead">
      <p class="eyebrow">Fəsil ${d.i} / ${INDEX.length}${meta.m ? ` · Məsələ ${meta.m[0]}–${meta.m[1]}` : ''}</p>
      <h2>${esc(d.t)}</h2></header>`;
    let open = false;
    d.b.forEach((b, k) => {
      if (b.t === 'm' || b.t === 'h') { if (open) { html += '</section>'; open = false; } }
      if (b.t === 'h') {
        html += `<h3 id="${b.id}" data-b="${k}">${b.h}</h3>`;
      } else if (b.t === 'm') {
        let id = 'm' + b.n; if (used.has(id)) id += '-2'; used.add(id);
        html += `<section class="masala" id="${id}" data-n="${b.n}">
          <a class="masala__link" href="#f=${d.i}&m=${b.n}" title="Bu məsələnin linki" aria-label="Məsələ ${b.n} linki">#</a>
          <p data-b="${k}">${b.h}</p>`;
        open = true;
      } else {
        html += `<p data-b="${k}">${b.h}</p>`;
      }
    });
    if (open) html += '</section>';
    if (d.f.length) {
      html += `<h3 class="sr-fnh">Haşiyələr</h3><ol class="sr-fns">${d.f.map(f =>
        `<li id="fn${f.id}" value="${f.k}">${f.h} <a href="#r${f.id}" class="sr-back" aria-label="Mətnə qayıt">↩</a></li>`).join('')}</ol>`;
    }
    html += `<p class="sr-note sr-source">${SOURCE}</p>`;
    const prev = INDEX.find(c => c.i === d.i - 1), next = INDEX.find(c => c.i === d.i + 1);
    html += `<nav class="sr-pager">
      ${prev ? `<a href="#f=${prev.i}" class="btn btn--ghost">← ${esc(prev.t)}</a>` : '<span></span>'}
      ${next ? `<a href="#f=${next.i}" class="btn btn--primary">${esc(next.t)} →</a>` : ''}
    </nav>`;
    view.innerHTML = html;

    let target = null;
    if (h.m) target = document.getElementById('m' + h.m);
    else if (h.s) target = document.getElementById(h.s);
    else if (h.b) target = view.querySelector(`[data-b="${h.b}"]`);
    else if (h.fn) target = document.getElementById('fn' + h.fn);
    if (target) {
      const el = target.closest('.masala') || target;
      el.classList.add('hl');
      const go = () => el.scrollIntoView({ block: 'start', behavior: 'instant' });
      requestAnimationFrame(go);
      if (document.fonts) document.fonts.ready.then(go);   // şriftlər yüklənəndən sonra yer dəyişə bilər
      setTimeout(() => el.classList.remove('hl'), 2600);
    } else {
      window.scrollTo(0, document.querySelector('.sr-layout').offsetTop - 80);
    }
  }

  // ---------- Axtarış ----------
  async function renderSearch(q) {
    markToc(0);
    document.getElementById('q').value = q;
    const num = /^\s*\d+\s*$/.test(q) ? +q : 0;
    if (num) {
      const c = chapterOfMasala(num);
      if (c) { location.replace(`#f=${c.i}&m=${num}`); return; }
    }
    const needle = lower(q.trim());
    if (needle.length < 2) { view.innerHTML = '<p class="sr-loading">Ən azı 2 hərf yazın.</p>'; return; }
    view.innerHTML = '<p class="sr-loading">Axtarılır…</p>';
    let all;
    try { all = await Promise.all(INDEX.map(c => load(c.i))); } catch (e) { view.innerHTML = '<p class="sr-loading">Axtarış üçün məlumat yüklənmədi.</p>'; return; }
    const res = []; let total = 0;
    for (const d of all) {
      let cur = 0;
      d.b.forEach((b, k) => {
        if (b.t === 'm') cur = b.n; else if (b.t === 'h') cur = 0;
        const t = plain(b.h); const lt = lower(t);
        const at = lt.indexOf(needle);
        if (at < 0) return;
        total++;
        if (res.length >= 150) return;
        const s = Math.max(0, at - 70), e = Math.min(t.length, at + needle.length + 110);
        const snip = (s ? '…' : '') + esc(t.slice(s, at)) + '<mark>' + esc(t.slice(at, at + needle.length)) + '</mark>' +
          esc(t.slice(at + needle.length, e)) + (e < t.length ? '…' : '');
        res.push(`<li><a href="#f=${d.i}&b=${k}"><span class="sr-res__meta">${esc(d.t)}${cur ? ` · Məsələ ${cur}` : ''}</span>
          <span class="sr-res__snip">${snip}</span></a></li>`);
      });
      d.f.forEach(f => {
        const t = plain(f.h); const lt = lower(t);
        const at = lt.indexOf(needle);
        if (at < 0) return;
        total++;
        if (res.length >= 150) return;
        const s = Math.max(0, at - 70), e = Math.min(t.length, at + needle.length + 110);
        const snip = (s ? '…' : '') + esc(t.slice(s, at)) + '<mark>' + esc(t.slice(at, at + needle.length)) + '</mark>' +
          esc(t.slice(at + needle.length, e)) + (e < t.length ? '…' : '');
        res.push(`<li><a href="#f=${d.i}&fn=${f.id}"><span class="sr-res__meta">${esc(d.t)} · Haşiyə ${f.k}</span>
          <span class="sr-res__snip">${snip}</span></a></li>`);
      });
    }
    view.innerHTML = `<h2 class="sr-h">«${esc(q)}» üzrə nəticələr: ${total}</h2>` +
      (total ? `<ol class="sr-res">${res.join('')}</ol>${total > res.length ? `<p class="sr-loading">İlk ${res.length} nəticə göstərilir. Axtarışı dəqiqləşdirin.</p>` : ''}`
        : '<p class="sr-loading">Heç nə tapılmadı.</p>');
    window.scrollTo(0, document.querySelector('.sr-layout').offsetTop - 80);
  }

  document.getElementById('searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('q').value.trim();
    if (q) location.hash = 'q=' + encodeURIComponent(q);
  });

  // ---------- Haşiyə pəncərəsi ----------
  const pop = document.getElementById('pop'), popBody = document.getElementById('popBody');
  view.addEventListener('click', e => {
    const a = e.target.closest('.fnref a');
    if (a) {
      e.preventDefault();
      const li = document.getElementById(a.getAttribute('href').slice(1));
      if (!li) return;
      const c = li.cloneNode(true); c.querySelector('.sr-back')?.remove();
      popBody.innerHTML = `<p class="eyebrow">Haşiyə ${a.textContent}</p>` + c.innerHTML;
      pop.hidden = false;
      return;
    }
    const back = e.target.closest('.sr-back');
    if (back) {
      e.preventDefault();
      const r = document.getElementById(back.getAttribute('href').slice(1));
      if (r) r.scrollIntoView({ block: 'center' });
    }
    const link = e.target.closest('.masala__link');
    if (link && navigator.clipboard) {
      navigator.clipboard.writeText(link.href).then(() => {
        link.classList.add('copied'); setTimeout(() => link.classList.remove('copied'), 1500);
      }).catch(() => {});
    }
  });
  document.getElementById('popClose').onclick = () => { pop.hidden = true; };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { pop.hidden = true; setToc(false); } });

  // ---------- Marşrut ----------
  function route() {
    pop.hidden = true;
    const h = parseHash();
    if (h.q) return renderSearch(h.q);
    if (h.m && !h.f) { const c = chapterOfMasala(h.m); if (c) h.f = c.i; }
    if (h.f) return renderChapter(h);
    renderHome();
  }

  fetch('data/index.json').then(r => r.json()).then(idx => {
    INDEX = idx; renderToc(); route();
    window.addEventListener('hashchange', route);
  }).catch(() => { view.innerHTML = '<p class="sr-loading">Məlumat yüklənmədi. Səhifəni yeniləyin.</p>'; });
})();
