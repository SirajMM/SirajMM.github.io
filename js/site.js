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

  /* ---------- Scramble text ---------- */
  const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz0123456789';
  function scramble(el, to, dur = 560) {
    if (!el) return;
    cancelAnimationFrame(el._scr);
    if (reduceMotion.matches) { el.textContent = to; return; }
    const from = el.textContent;
    const len = Math.max(from.length, to.length);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      let out = '';
      for (let i = 0; i < len; i++) {
        const settle = 0.35 + (i / len) * 0.65; // later letters settle later
        if (t >= settle) out += to[i] || '';
        else if (t > settle - 0.45) out += (to[i] || from[i]) === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        else out += from[i] || '';
      }
      el.textContent = out;
      if (t < 1) el._scr = requestAnimationFrame(step); else el.textContent = to;
    };
    el._scr = requestAnimationFrame(step);
  }

  /* ---------- Hero stage ---------- */
  const hero = $('.hero');
  const stage = $('#stage');
  const device = $('#device');
  const frame = stage && $('.stage-frame', stage);
  const buttons = stage ? $$('.switch button', stage) : [];
  const platEl = $('#hl-plat');
  const ORDER = ['android', 'ios', 'macos', 'windows'];
  const LABEL = { android: 'Android', ios: 'iOS', macos: 'macOS', windows: 'Windows' };
  const SIZE = { android: [300, 620], ios: [300, 620], macos: [660, 430], windows: [660, 430] };
  let current = 'android';
  let ready = false;

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
    if (changed && platEl) scramble(platEl, LABEL[p]);
    if (changed && animate && !reduceMotion.matches) {
      device.classList.remove('is-swapping'); void device.offsetWidth; device.classList.add('is-swapping');
    }
    fit();
  }

  // The device cycles through the platforms on its own until someone takes over.
  let autoTimer = null;
  let userTook = false;
  let heroVisible = true;
  const AUTO_MS = 2800;
  function markAuto(on) {
    [stage, hero].forEach((el) => {
      el.classList.remove('is-auto');
      if (on) { void el.offsetWidth; el.classList.add('is-auto'); }
    });
  }
  function stopAuto() { clearTimeout(autoTimer); autoTimer = null; markAuto(false); }
  function startAuto() {
    if (reduceMotion.matches || userTook || autoTimer || !heroVisible) return;
    hero.style.setProperty('--auto', AUTO_MS + 'ms');
    stage.style.setProperty('--auto', AUTO_MS + 'ms');
    const next = () => {
      setPlatform(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length], true);
      markAuto(true);
      autoTimer = setTimeout(next, AUTO_MS);
    };
    markAuto(true);
    autoTimer = setTimeout(next, AUTO_MS);
  }
  function takeOver() { userTook = true; stopAuto(); }

  if (stage && device) {
    buttons.forEach((b) => b.addEventListener('click', () => { takeOver(); setPlatform(b.dataset.p, true); }));
    stage.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') stopAuto(); });
    stage.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && ready) startAuto(); });
    stage.addEventListener('focusin', takeOver);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAuto(); else if (ready) startAuto(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        heroVisible = en.isIntersecting;
        if (!heroVisible) stopAuto(); else if (ready) startAuto();
      }, { threshold: 0.25 }).observe(hero);
    }
    setPlatform('android');
    window.addEventListener('resize', () => requestAnimationFrame(fit), { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(frame);
  }

  /* ---------- Design-token skins, revealed with a circular view transition ---------- */
  const app = device && $('.app', device);
  const skinBtns = stage ? $$('.skin button', stage) : [];
  function setSkin(name, btn, ev) {
    const apply = () => {
      device.dataset.skin = name;
      skinBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.skin === name)));
    };
    if (!document.startViewTransition || reduceMotion.matches || !app) { apply(); return; }
    const r = device.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const ox = ev && ev.clientX ? ev.clientX : br.left + br.width / 2;
    const oy = ev && ev.clientY ? ev.clientY : br.top + br.height / 2;
    root.style.setProperty('--vx', (((ox - r.left) / r.width) * 100).toFixed(1) + '%');
    root.style.setProperty('--vy', (((oy - r.top) / r.height) * 100).toFixed(1) + '%');
    device.style.viewTransitionName = 'device-app';
    device.classList.add('no-tx');
    const vt = document.startViewTransition(apply);
    vt.finished.finally(() => { device.style.viewTransitionName = ''; device.classList.remove('no-tx'); });
  }
  skinBtns.forEach((b) => b.addEventListener('click', (e) => { takeOver(); setSkin(b.dataset.skin, b, e); }));

  /* ---------- Rolling numbers in the hero app ---------- */
  const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function rollNumbers() {
    if (reduceMotion.matches) return;
    $$('[data-roll]').forEach((el, k) => {
      const to = parseFloat(el.dataset.roll);
      const dur = 1500, start = performance.now() + k * 180;
      const step = (now) => {
        const t = Math.max(0, Math.min(1, (now - start) / dur));
        el.textContent = money.format(to * (1 - Math.pow(1 - t, 4)));
        if (t < 1) requestAnimationFrame(step);
      };
      el.textContent = money.format(0);
      requestAnimationFrame(step);
    });
  }

  /* ---------- Entrance ---------- */
  function goReady() {
    if (ready) return;
    ready = true;
    root.classList.add('is-ready');
    setTimeout(rollNumbers, 900);
    if (stage) setTimeout(startAuto, 1800);
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
    device.style.setProperty('--lx', (50 + curr.x * 110).toFixed(1) + '%');
    device.style.setProperty('--ly', (35 + curr.y * 90).toFixed(1) + '%');
    if (Math.abs(target.x - curr.x) > 0.001 || Math.abs(target.y - curr.y) > 0.001) parallaxRaf = requestAnimationFrame(parallaxLoop);
    else parallaxRaf = 0;
  }
  if (hero && finePointer.matches && !reduceMotion.matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width - 0.5;
      target.y = (e.clientY - r.top) / r.height - 0.5;
      device.style.setProperty('--lo', '1');
      if (!parallaxRaf) parallaxRaf = requestAnimationFrame(parallaxLoop);
    });
    hero.addEventListener('pointerleave', () => {
      target.x = 0; target.y = 0;
      device.style.setProperty('--lo', '0');
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
      scrubs();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Reveals ---------- */
  const car = $('.ride .car');
  const route = $('#route');
  function placeCar(t) {
    if (!car || !route) return;
    const pt = route.getPointAtLength(route.getTotalLength() * t);
    car.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
  }
  placeCar(reduceMotion.matches || !('IntersectionObserver' in window) ? 1 : 0);
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
  /* ---------- Scroll-scrubbed scenes ---------- */
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const paper = $('.surface-paper');
  const stackVis = $('.stack-visual');
  const rideFig = $('.ride');
  const etaEl = $('#eta');
  const etaLabel = $('#eta-label');
  if (!reduceMotion.matches) {
    if (stackVis) stackVis.classList.add('is-scrub');
    if (rideFig) rideFig.classList.add('is-scrub');
  }
  let lastEta = '';
  function scrubs() {
    if (reduceMotion.matches) return;
    const vh = window.innerHeight;
    if (paper) {
      const r = paper.getBoundingClientRect();
      paper.style.setProperty('--cp', clamp01((vh - r.top) / (vh * 0.7)).toFixed(3));
    }
    if (stackVis) {
      const r = stackVis.getBoundingClientRect();
      stackVis.style.setProperty('--sp', clamp01((vh * 0.98 - r.top) / (vh * 0.55)).toFixed(3));
    }
    if (rideFig && route) {
      const r = rideFig.getBoundingClientRect();
      const t = clamp01((vh * 0.95 - r.top) / (vh * 0.85));
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      route.style.strokeDashoffset = (1 - e).toFixed(4);
      placeCar(e);
      const eta = e > 0.985 ? 'Now' : Math.max(1, Math.ceil(4 * (1 - e))) + ' min';
      if (eta !== lastEta && etaEl) {
        lastEta = eta;
        etaEl.textContent = eta;
        if (etaLabel) etaLabel.textContent = eta === 'Now' ? 'Driver is here' : 'Driver arriving';
      }
    }
  }
  window.addEventListener('resize', scrubs, { passive: true });
  onScroll();

  /* ---------- Live payment: QR scanned on mobile, lands in the back office ---------- */
  const suite = $('.suite');
  if (suite) {
    const qrStatus = $('#qr-status');
    const newRow = $('.sw-new', suite);
    const rows = $$('#sw-rows tr', suite);
    const lastRow = rows[rows.length - 1];
    const count = $('#sw-count');
    const replay = $('#replay');
    let timers = [];
    const later = (ms, fn) => timers.push(setTimeout(fn, reduceMotion.matches ? 0 : ms));
    function resetPayment() {
      timers.forEach(clearTimeout); timers = [];
      suite.classList.remove('is-paid', 'is-scanning');
      newRow.hidden = true; lastRow.hidden = false;
      count.textContent = '5'; qrStatus.textContent = 'Waiting for payment';
      replay.hidden = true;
    }
    function runPayment(delay = 0) {
      resetPayment();
      later(delay + 300, () => suite.classList.add('is-scanning'));
      later(delay + 2500, () => {
        suite.classList.remove('is-scanning'); suite.classList.add('is-paid');
        qrStatus.textContent = 'Payment received';
      });
      later(delay + 3200, () => {
        lastRow.hidden = true; newRow.hidden = false;
        count.textContent = '6';
        count.classList.remove('is-bump'); void count.offsetWidth; count.classList.add('is-bump');
      });
      later(delay + 4400, () => { replay.hidden = false; });
    }
    replay.addEventListener('click', () => runPayment());
    if ('IntersectionObserver' in window) {
      const pio = new IntersectionObserver(([en]) => {
        if (en.isIntersecting) { runPayment(1200); pio.disconnect(); }
      }, { threshold: 0.45 });
      pio.observe(suite);
    } else runPayment();
  }

  /* ---------- Odometer stats ---------- */
  const odos = $$('.odo');
  odos.forEach((el, k) => {
    const n = el.dataset.odo;
    el.textContent = '';
    const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = n; el.appendChild(sr);
    [...n].forEach((d, j) => {
      const col = document.createElement('span');
      col.className = 'odo-col'; col.setAttribute('aria-hidden', 'true');
      col.style.setProperty('--d', k + j);
      for (let i = 0; i < 20; i++) { const g = document.createElement('i'); g.textContent = i % 10; col.appendChild(g); }
      col.dataset.to = 10 + Number(d);
      el.appendChild(col);
    });
  });
  function spinOdos() { $$('.odo-col').forEach((c) => { c.style.transform = `translateY(${-c.dataset.to * 0.84}em)`; }); }
  if (reduceMotion.matches || !('IntersectionObserver' in window)) spinOdos();
  else if (odos.length) {
    const oio = new IntersectionObserver(([en]) => { if (en.isIntersecting) { spinOdos(); oio.disconnect(); } }, { threshold: 0.4 });
    oio.observe($('.stats'));
  }

  /* ---------- Marquees that answer scroll speed ---------- */
  const marquees = $$('[data-marquee]').map((el) => {
    const track = $('.marquee-track', el);
    track.innerHTML += track.innerHTML;
    return { el, track, x: 0, w: track.scrollWidth / 2, speed: parseFloat(el.dataset.speed || '1'), on: false };
  });
  if (marquees.length && !reduceMotion.matches && 'IntersectionObserver' in window) {
    let vel = 0, dir = -1, prevY = window.scrollY, prevT = performance.now(), mRaf = 0;
    const measure = () => marquees.forEach((m) => { m.w = m.track.scrollWidth / 2; });
    window.addEventListener('resize', measure, { passive: true });
    if (document.fonts) document.fonts.ready.then(measure);
    const loop = (now) => {
      const dt = Math.min(64, now - prevT); prevT = now;
      const y = window.scrollY, dy = y - prevY; prevY = y;
      if (dy) dir = dy > 0 ? -1 : 1;
      vel += (dy - vel) * 0.12;
      const boost = Math.min(14, Math.abs(vel) * 0.5);
      const skew = Math.max(-9, Math.min(9, -vel * 0.35));
      marquees.forEach((m) => {
        if (!m.on || !m.w) return;
        m.x += dir * (0.05 + boost * 0.05) * dt * m.speed;
        if (m.x <= -m.w) m.x += m.w; else if (m.x > 0) m.x -= m.w;
        m.track.style.setProperty('--mq', m.x.toFixed(1) + 'px');
        m.track.style.setProperty('--skew', skew.toFixed(2) + 'deg');
      });
      mRaf = marquees.some((m) => m.on) ? requestAnimationFrame(loop) : 0;
    };
    const mio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { const m = marquees.find((q) => q.el === en.target); if (m) m.on = en.isIntersecting; });
      if (!mRaf && marquees.some((m) => m.on)) { prevT = performance.now(); prevY = window.scrollY; mRaf = requestAnimationFrame(loop); }
    });
    marquees.forEach((m) => mio.observe(m.el));
  }

  /* ---------- Pointer niceties (mouse and trackpad only) ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    // Tilt with a spotlight
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.setProperty('--ty', ((x - 0.5) * 8).toFixed(2) + 'deg');
        el.style.setProperty('--tx', ((0.5 - y) * 6).toFixed(2) + 'deg');
        el.style.setProperty('--sx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--sy2', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-tilting');
        el.style.setProperty('--tx', '0deg'); el.style.setProperty('--ty', '0deg');
      });
    });
    // Spotlight that follows the pointer across cards
    $$('.caps-panels, .repos a').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--sx', (e.clientX - r.left).toFixed(0) + 'px');
        el.style.setProperty('--sy2', (e.clientY - r.top).toFixed(0) + 'px');
      });
    });
    // Magnetic controls
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.classList.add('is-pulled');
        el.style.setProperty('--gx', ((e.clientX - (r.left + r.width / 2)) * 0.3).toFixed(1) + 'px');
        el.style.setProperty('--gy', ((e.clientY - (r.top + r.height / 2)) * 0.4).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-pulled');
        el.style.setProperty('--gx', '0px'); el.style.setProperty('--gy', '0px');
      });
    });
    // Scramble nav labels on hover
    const narrow = window.matchMedia('(max-width: 760px)');
    $$('[data-scramble]').forEach((a) => {
      const txt = a.textContent;
      a.addEventListener('pointerenter', () => {
        if (narrow.matches) return;
        a.style.minWidth = a.offsetWidth + 'px';
        scramble(a, txt, 420);
      });
    });

    // Cursor follower with contextual labels
    const cur = $('.cursor');
    const curLabel = cur && $('.cursor-label', cur);
    if (cur) {
      let mx = -100, my = -100, cx = -100, cy = -100, cRaf = 0;
      const cLoop = () => {
        cx += (mx - cx) * 0.22; cy += (my - cy) * 0.22;
        cur.style.setProperty('--cx', cx.toFixed(1) + 'px');
        cur.style.setProperty('--cy', cy.toFixed(1) + 'px');
        cRaf = Math.abs(mx - cx) + Math.abs(my - cy) > 0.2 ? requestAnimationFrame(cLoop) : 0;
      };
      window.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        mx = e.clientX; my = e.clientY;
        if (!root.classList.contains('has-cursor')) { cx = mx; cy = my; root.classList.add('has-cursor'); }
        if (!cRaf) cRaf = requestAnimationFrame(cLoop);
      }, { passive: true });
      document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) root.classList.remove('has-cursor'); });
      document.addEventListener('pointerover', (e) => {
        const t = e.target.closest('[data-cursor], a, button, [role="tab"]');
        const label = t && t.dataset.cursor;
        cur.classList.toggle('is-label', !!label);
        cur.classList.toggle('is-link', !!t && !label);
        if (label) curLabel.textContent = label;
      });
      window.addEventListener('pointerdown', () => cur.classList.add('is-down'));
      window.addEventListener('pointerup', () => cur.classList.remove('is-down'));
    }

    // Floating preview on the work index
    const peek = $('.peek');
    const peekInner = peek && $('.peek-inner', peek);
    if (peek) {
      const cache = {};
      const contentFor = (key) => {
        if (cache[key]) return cache[key];
        let node;
        if (key === 'fintech' || key === 'ride') {
          node = document.createElement('div');
          node.className = 'peek-clone';
          const c = (key === 'fintech' ? $('.suite-win') : $('.ride-map')).cloneNode(true);
          c.removeAttribute('id');
          $$('[id]', c).forEach((n) => n.removeAttribute('id'));
          $$('[style]', c).forEach((n) => n.removeAttribute('style'));
          if (key === 'ride') { const g = $('.car', c); if (g) g.remove(); }
          node.appendChild(c);
        } else {
          node = new Image(); node.src = key; node.alt = ''; node.decoding = 'async';
        }
        return (cache[key] = node);
      };
      let px = 0, py = 0, tx = 0, ty = 0, pRaf = 0;
      const pLoop = () => {
        const dx = tx - px;
        px += dx * 0.16; py += (ty - py) * 0.16;
        peek.style.setProperty('--px2', px.toFixed(1) + 'px');
        peek.style.setProperty('--py2', py.toFixed(1) + 'px');
        peek.style.setProperty('--pr', Math.max(-10, Math.min(10, dx * 0.08)).toFixed(2) + 'deg');
        pRaf = Math.abs(dx) + Math.abs(ty - py) > 0.2 ? requestAnimationFrame(pLoop) : 0;
      };
      $$('.work-index a[data-preview]').forEach((a) => {
        a.addEventListener('pointerenter', (e) => {
          peekInner.replaceChildren(contentFor(a.dataset.preview));
          if (!peek.classList.contains('is-on')) { px = e.clientX; py = e.clientY; }
          tx = e.clientX; ty = e.clientY;
          peek.classList.add('is-on');
          if (!pRaf) pRaf = requestAnimationFrame(pLoop);
        });
        a.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (!pRaf) pRaf = requestAnimationFrame(pLoop); });
        a.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
      });
    }
  }
})();
