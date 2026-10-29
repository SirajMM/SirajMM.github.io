/* Siraj M M — portfolio interactions, v2. No dependencies. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Text splitting ---------- */
  // Characters for the name (the h1 keeps an aria-label with the full name).
  $$('[data-split]').forEach((el) => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', i);
      s.textContent = c;
      el.appendChild(s);
    });
  });
  // Words for section titles; the heading text stays readable as one string.
  $$('.split-title').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = w;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- Guilloche linework ---------- */
  function polarPath(fn, steps) {
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const r = fn(t);
      d += (i ? 'L' : 'M') + (r * Math.cos(t)).toFixed(1) + ' ' + (r * Math.sin(t)).toFixed(1);
    }
    return d + 'Z';
  }
  function drawRosette(svg, { rings = 10, base = 300, spread = 130, lobes = 24, amp = 20, rose = true } = {}) {
    if (!svg) return;
    const frag = document.createDocumentFragment();
    let k = 0;
    const add = (d) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('pathLength', '1');
      p.style.setProperty('--k', k++);
      frag.appendChild(p);
    };
    for (let r = 0; r < rings; r++) {
      const b = base + (r / (rings - 1)) * spread;
      const phase = (r * Math.PI) / rings;
      add(polarPath((t) => b + amp * Math.sin(lobes * t + phase) * (0.72 + 0.28 * Math.cos(3 * t)), 900));
    }
    if (rose) for (let r = 0; r < 5; r++) add(polarPath((t) => 70 + 120 * Math.abs(Math.sin(4 * t + (r * Math.PI) / 10)), 900));
    svg.appendChild(frag);
  }
  function drawBand(svg) {
    const frag = document.createDocumentFragment();
    for (let k = 0; k < 7; k++) {
      let d = '';
      for (let x = 0; x <= 1200; x += 6) {
        const y = 30 + 18 * Math.sin(x / 38 + k * 0.9) * Math.cos(x / 210 - k * 0.3);
        d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
      }
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('pathLength', '1');
      frag.appendChild(p);
    }
    svg.appendChild(frag);
  }
  drawRosette($('#guilloche'));
  drawRosette($('#guilloche-contact'), { rings: 9, base: 260, spread: 170, lobes: 14, amp: 30 });
  drawRosette($('#guilloche-photo'), { rings: 6, base: 380, spread: 90, lobes: 30, amp: 14, rose: false });
  $$('[data-band]').forEach(drawBand);

  /* ---------- Illustrative QR (decorative pattern, not a real code) ---------- */
  (function drawQR(svg) {
    if (!svg) return;
    const n = 29;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const finder = (x, y) => {
      const inF = (fx, fy) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7;
      for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
        if (inF(fx, fy)) {
          const dx = x - fx, dy = y - fy;
          const ring = Math.min(dx, dy, 6 - dx, 6 - dy);
          return ring === 0 || ring >= 2 ? 1 : 0;
        }
        if (x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7) return 0;
      }
      return -1;
    };
    let rects = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const f = finder(x, y);
      if (f === 1 || (f === -1 && rnd() > 0.52)) rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    svg.innerHTML = rects;
  })($('#qr'));

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Navigation ---------- */
  const nav = $('#nav');
  const toggle = $('.nav-toggle', nav);
  const links = $$('.nav-links a[href^="#"]', nav);
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    if (open) nav.classList.remove('is-hidden');
  }
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('.nav-links a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

  if ('IntersectionObserver' in window) {
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove('is-current'));
        const a = byId.get(en.target.id);
        if (a) a.classList.add('is-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['work', 'experience', 'about', 'contact'].forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ---------- Hero stage ---------- */
  const hero = $('.hero');
  const stage = $('#stage');
  const device = $('#device');
  const frame = stage && $('.stage-frame', stage);
  const buttons = stage ? $$('.switch button', stage) : [];
  const nameEl = $('.name');
  const ORDER = ['android', 'ios', 'macos', 'windows'];
  const SIZE = { android: [300, 620], ios: [300, 620], macos: [660, 430], windows: [660, 430] };
  let current = 'android';
  let ready = false;

  // The name widens with the device, but never past what the hero can hold.
  let maxWd = 125;
  function measureName() {
    if (!nameEl) return;
    const prev = nameEl.style.getPropertyValue('--wd');
    nameEl.style.transition = 'none';
    nameEl.style.setProperty('--wd', '100%');
    const widest = Math.max(...$$('.name-word', nameEl).map((s) => s.offsetWidth));
    widest100 = $$('.name-word', nameEl)[0].offsetWidth;
    maxWd = widest ? Math.max(62, Math.min(125, ((100 * nameEl.clientWidth) / widest) * 0.97)) : 100;
    if (prev) nameEl.style.setProperty('--wd', prev); else nameEl.style.removeProperty('--wd');
    void nameEl.offsetWidth;
    nameEl.style.transition = '';
  }
  // Where the device overlaps the name (side-by-side layout), the first line may
  // run right up to the bezel, so the type and the device read as one composition.
  let widest100 = 0;
  const overlapping = window.matchMedia('(min-width: 1101px)');
  function deviceCap(p) {
    if (!overlapping.matches || !frame || !widest100) return 125;
    const [dw, dh] = SIZE[p];
    const s = Math.min(1, (frame.clientWidth - 4) / dw, (frame.clientHeight - 8) / dh);
    const fr = frame.getBoundingClientRect();
    const deviceLeft = fr.left + fr.width / 2 - (dw * s) / 2;
    const fontPx = parseFloat(getComputedStyle(nameEl).fontSize);
    // phones: tuck part of the last letter under the bezel; desktop windows have a
    // light title bar the same tone as the type, so keep a clear gap instead.
    const tuck = p === 'macos' || p === 'windows' ? -0.12 : -0.03;
    const allowed = deviceLeft - nameEl.getBoundingClientRect().left + fontPx * tuck;
    return Math.max(62, (100 * allowed) / widest100);
  }
  const nameStretch = (p) => Math.min(p === 'macos' || p === 'windows' ? 116 : 110, maxWd, deviceCap(p)).toFixed(1) + '%';

  function fit() {
    if (!frame) return;
    const [dw, dh] = SIZE[current];
    const s = Math.min(1, (frame.clientWidth - 4) / dw, (frame.clientHeight - 8) / dh);
    device.style.setProperty('--s', s.toFixed(3));
  }
  function setPlatform(p, animate) {
    const changed = p !== current;
    current = p;
    device.dataset.platform = p;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.p === p)));
    if (ready && nameEl) nameEl.style.setProperty('--wd', nameStretch(p));
    if (changed && animate && !reduceMotion.matches) {
      device.classList.remove('is-swapping'); void device.offsetWidth; device.classList.add('is-swapping');
    }
    fit();
  }

  let autoTimer = null;
  const AUTO_MS = 2800;
  function stopAuto() { clearTimeout(autoTimer); autoTimer = null; stage.classList.remove('is-auto'); }
  function startAuto() {
    if (reduceMotion.matches) return;
    let step = 0;
    stage.style.setProperty('--auto', AUTO_MS + 'ms');
    const next = () => {
      step += 1;
      if (step >= ORDER.length) { stopAuto(); setPlatform('android', true); return; }
      stage.classList.remove('is-auto'); void stage.offsetWidth; stage.classList.add('is-auto');
      setPlatform(ORDER[step], true);
      autoTimer = setTimeout(next, AUTO_MS);
    };
    stage.classList.add('is-auto');
    autoTimer = setTimeout(next, AUTO_MS);
  }

  if (stage && device) {
    buttons.forEach((b) => b.addEventListener('click', () => { stopAuto(); setPlatform(b.dataset.p, true); }));
    stage.addEventListener('pointerenter', () => { if (autoTimer) stopAuto(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAuto(); });
    measureName();
    setPlatform('android');
    let rz = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => { measureName(); setPlatform(current); });
    }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(frame);
  }

  /* ---------- Entrance ---------- */
  function goReady() {
    if (ready) return;
    ready = true;
    measureName();
    root.classList.add('is-ready');
    if (nameEl) nameEl.style.setProperty('--wd', nameStretch(current));
    if (stage) setTimeout(startAuto, 1600);
  }
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 700))]).then(() => requestAnimationFrame(goReady));

  /* ---------- Depth: pointer parallax and scroll ---------- */
  const target = { x: 0, y: 0 };
  const curr = { x: 0, y: 0 };
  let parallaxRaf = 0;
  function parallaxLoop() {
    curr.x += (target.x - curr.x) * 0.08;
    curr.y += (target.y - curr.y) * 0.08;
    hero.style.setProperty('--px', curr.x.toFixed(3));
    hero.style.setProperty('--py', curr.y.toFixed(3));
    device.style.setProperty('--ry', (curr.x * 7).toFixed(2) + 'deg');
    device.style.setProperty('--rx', (-curr.y * 5).toFixed(2) + 'deg');
    if (Math.abs(target.x - curr.x) > 0.001 || Math.abs(target.y - curr.y) > 0.001) parallaxRaf = requestAnimationFrame(parallaxLoop);
    else parallaxRaf = 0;
  }
  if (hero && finePointer.matches && !reduceMotion.matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width - 0.5;
      target.y = (e.clientY - r.top) / r.height - 0.5;
      if (!parallaxRaf) parallaxRaf = requestAnimationFrame(parallaxLoop);
    });
    hero.addEventListener('pointerleave', () => {
      target.x = 0; target.y = 0;
      if (!parallaxRaf) parallaxRaf = requestAnimationFrame(parallaxLoop);
    });
  }

  const photoRose = $('#guilloche-photo');
  const about = $('#about');
  let lastY = window.scrollY;
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      nav.classList.toggle('is-scrolled', y > 24);
      nav.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
      // hide the bar while reading downwards, bring it back on any upward scroll
      if (!nav.classList.contains('is-open') && !nav.contains(document.activeElement)) {
        if (y > 640 && y > lastY + 4) nav.classList.add('is-hidden');
        else if (y < lastY - 4 || y <= 640) nav.classList.remove('is-hidden');
      }
      lastY = y;
      if (!reduceMotion.matches) {
        if (hero) hero.style.setProperty('--sy', Math.min(1, y / window.innerHeight).toFixed(3));
        if (photoRose && about) {
          const r = about.getBoundingClientRect();
          photoRose.style.setProperty('--rot', ((window.innerHeight - r.top) / 30).toFixed(1));
        }
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveals ---------- */
  const car = $('.ride .car');
  const route = $('#route');
  function placeCar(t) {
    if (!car || !route) return;
    const pt = route.getPointAtLength(route.getTotalLength() * t);
    car.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
  }
  placeCar(reduceMotion.matches || !('IntersectionObserver' in window) ? 1 : 0);
  function driveCar() {
    if (reduceMotion.matches) { placeCar(1); return; }
    const dur = 2400, start = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now) => { const t = Math.min(1, (now - start) / dur); placeCar(ease(t)); if (t < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  // Bracket split for the architecture stack
  const stackWrap = $('.stack-wrap');
  function placeBrackets() {
    if (!stackWrap) return;
    const base = $('.plate-base', stackWrap);
    stackWrap.style.setProperty('--split', (base.offsetTop - 10) + 'px');
  }
  placeBrackets();
  window.addEventListener('resize', placeBrackets, { passive: true });

  // Tenure bars from real dates; the current job runs to today.
  (function tenure() {
    const t0 = new Date(2023, 0, 1), t1 = new Date(2027, 0, 1);
    const span = t1 - t0;
    const pos = (d) => Math.max(0, Math.min(1, (d - t0) / span)) * 100;
    const set = (el, a, b) => { if (!el) return; el.style.setProperty('--l', pos(a).toFixed(2) + '%'); el.style.setProperty('--w', (pos(b) - pos(a)).toFixed(2) + '%'); };
    set($('.bar-spoider'), new Date(2023, 7, 1), new Date(2024, 2, 1));
    set($('.bar-thoughtbox'), new Date(2024, 2, 1), new Date());
  })();

  const revealables = [...$$('[data-reveal]'), ...$$('.split-title')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in-view');
        if (en.target.classList.contains('ride')) driveCar();
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('in-view'));
  }

  /* ---------- Capability index (tabs on wide screens, plain list otherwise) ---------- */
  const caps = $('#caps');
  if (caps) {
    const list = $('.caps-list', caps);
    const tabs = $$('[role="tab"]', caps);
    const panels = $$('[role="tabpanel"]', caps);
    const wide = window.matchMedia('(min-width: 900px)');
    let hoverTimer = 0;
    function select(i, focus) {
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; });
      panels.forEach((p, j) => {
        p.hidden = i !== j;
        if (i === j && !reduceMotion.matches) { p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
      });
      if (focus) tabs[i].focus();
    }
    function mode() {
      if (wide.matches) {
        caps.classList.add('is-tabs'); list.hidden = false;
        panels.forEach((p) => p.setAttribute('role', 'tabpanel'));
        select(Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')));
      } else {
        caps.classList.remove('is-tabs'); list.hidden = true;
        panels.forEach((p) => { p.hidden = false; p.removeAttribute('role'); });
      }
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const k = e.key;
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length, true); }
        if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
        if (k === 'Home') { e.preventDefault(); select(0, true); }
        if (k === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
      if (finePointer.matches) {
        t.addEventListener('pointerenter', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => { if (t.getAttribute('aria-selected') !== 'true') select(i); }, 120); });
        t.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
      }
    });
    wide.addEventListener('change', mode);
    mode();
  }

  /* ---------- Contact: rosette follows the pointer, local time ---------- */
  const contact = $('#contact');
  const contactRose = $('#guilloche-contact');
  if (contact && contactRose && finePointer.matches && !reduceMotion.matches) {
    contact.addEventListener('pointermove', (e) => {
      const r = contact.getBoundingClientRect();
      contactRose.style.setProperty('--rot', (((e.clientX - r.left) / r.width - 0.5) * 24).toFixed(1));
    });
    contact.addEventListener('pointerleave', () => contactRose.style.setProperty('--rot', 0));
  }
  const timeEl = $('#kochi-time');
  if (timeEl && window.Intl) {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    const tick = () => { timeEl.textContent = `It's ${fmt.format(new Date())} in Kochi right now.`; };
    tick();
    timeEl.hidden = false;
    setInterval(tick, 30000);
  }

  /* ---------- Copy email ---------- */
  const copyBtn = $('.copy');
  const status = $('.copy-status');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(copyBtn.dataset.copy); status.textContent = 'Copied'; }
      catch { status.textContent = 'Select the address to copy it'; }
      clearTimeout(copyBtn._t);
      copyBtn._t = setTimeout(() => { status.textContent = ''; }, 2400);
    });
  }
})();
