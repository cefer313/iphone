(function () {
  const dict = window.I18N;
  const supported = Object.keys(dict);
  let lang = 'az';
  let quoteIndex = 0;

  try {
    const saved = localStorage.getItem('lang');
    if (saved && supported.includes(saved)) lang = saved;
  } catch (e) { /* storage unavailable */ }

  function t(key) { return (dict[lang] && dict[lang][key]) || dict.az[key] || key; }

  function applyLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    renderQuote();
    renderChallenge();
    const status = document.getElementById('formStatus');
    status.textContent = ''; status.className = 'form__status';
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }
  }

  function renderQuote() {
    const quotes = dict[lang].quotes;
    document.getElementById('dailyQuote').textContent = '“' + quotes[quoteIndex % quotes.length] + '”';
  }

  // Language switcher
  document.querySelectorAll('.lang button').forEach(btn =>
    btn.addEventListener('click', () => applyLang(btn.dataset.lang)));

  // Daily quote — start from today's quote
  quoteIndex = Math.floor(Date.now() / 86400000) % dict.az.quotes.length;
  document.getElementById('nextQuote').addEventListener('click', () => {
    const q = document.getElementById('dailyQuote');
    q.style.opacity = 0;
    setTimeout(() => { quoteIndex++; renderQuote(); q.style.opacity = 1; }, 250);
  });

  // Mobile menu
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger.addEventListener('click', () => {
    nav.classList.toggle('open'); burger.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); burger.classList.remove('open');
  }));

  // Eye follows the cursor
  const iris = document.querySelector('.eye__iris');
  if (iris && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', e => {
      const r = iris.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(18, Math.hypot(dx, dy) / 25);
      iris.style.transform = `translate(${Math.cos(angle) * dist * 2}px, ${Math.sin(angle) * dist}px)`;
    });
  }

  // Contact form (front-end only — connect to a backend / Formspree / WhatsApp later)
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const status = document.getElementById('formStatus');
    let ok = true;
    ['name', 'phone'].forEach(n => {
      const field = form.elements[n];
      const valid = field.value.trim().length > 1;
      field.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) { status.textContent = t('form.err'); status.className = 'form__status err'; return; }
    status.textContent = t('form.ok'); status.className = 'form__status ok';
    form.reset();
  });

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.section__head, .card, .format, .events, .challenge, .article, .review, .about > *, .contact > *');
  revealEls.forEach(el => el.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    }), { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // Birgə: 21 günlük çağırış (irəliləyiş bu cihazda saxlanılır)
  const DAYS = 21;
  const daysEl = document.getElementById('challengeDays');
  let done = [];
  try { done = JSON.parse(localStorage.getItem('birge.challenge') || '[]').filter(n => n >= 1 && n <= DAYS); } catch (e) { done = []; }
  function saveChallenge() { try { localStorage.setItem('birge.challenge', JSON.stringify(done)); } catch (e) { /* ignore */ } }
  for (let i = 1; i <= DAYS; i++) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'day'; b.textContent = i; b.dataset.day = i;
    b.addEventListener('click', () => {
      done = done.includes(i) ? done.filter(n => n !== i) : done.concat(i);
      saveChallenge(); renderChallenge();
    });
    daysEl.appendChild(b);
  }
  function renderChallenge() {
    if (!daysEl) return;
    daysEl.querySelectorAll('.day').forEach(b => {
      const on = done.includes(+b.dataset.day);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', t('birge.ch.day') + ' ' + b.dataset.day);
    });
    document.getElementById('challengeBar').style.width = (done.length / DAYS * 100) + '%';
    document.getElementById('challengeStatus').textContent =
      done.length === DAYS ? t('birge.ch.done') : t('birge.ch.status').replace('{n}', done.length);
  }
  document.getElementById('challengeReset').addEventListener('click', () => { done = []; saveChallenge(); renderChallenge(); });

  // Tədbirə "Qoşul" — formda Birgə seçilsin
  document.querySelectorAll('[data-program]').forEach(a => a.addEventListener('click', () => {
    form.elements.program.value = a.dataset.program;
  }));

  document.getElementById('year').textContent = new Date().getFullYear();
  applyLang(lang);

  // PWA: offline dəstəyi (yalnız http/https-də işləyir)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
