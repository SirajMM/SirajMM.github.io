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
  skinBtns.forEach((b) => b.addEventListener('click', (e) => { takeOver(); setSkin(b.dataset.skin, b, e); postSkin(b.dataset.skin); }));

  /* ---------- Live demo: a real Flutter Web build mounts inside the device on request ---------- */
  const liveBtn = $('#live-btn');
  const stageCap = $('#stage-cap');
  const capText = stageCap ? stageCap.textContent : '';
  let liveFrame = null;
  function postSkin(name) {
    if (liveFrame && liveFrame.contentWindow) liveFrame.contentWindow.postMessage('skin:' + name, '*');
  }
  function setLive(on) {
    const label = $('span', liveBtn);
    if (!on) {
      if (liveFrame) { liveFrame.remove(); liveFrame = null; }
      stage.classList.remove('is-live', 'is-live-loading');
      liveBtn.setAttribute('aria-pressed', 'false');
      label.textContent = 'Run the real Flutter app';
      stageCap.textContent = capText;
      return;
    }
    takeOver();
    stage.classList.add('is-live-loading');
    liveBtn.setAttribute('aria-pressed', 'true');
    label.textContent = 'Starting Flutter…';
    liveFrame = document.createElement('iframe');
    liveFrame.className = 'live-frame';
    liveFrame.title = 'Remit demo, a live Flutter Web app';
    liveFrame.setAttribute('data-lenis-prevent', '');
    liveFrame.src = 'demo/index.html?skin=' + (device.dataset.skin || 'petrol');
    app.appendChild(liveFrame);
  }
  if (liveBtn && app) {
    liveBtn.addEventListener('click', () => setLive(!liveFrame));
    window.addEventListener('message', (e) => {
      if (!liveFrame || e.source !== liveFrame.contentWindow || e.data !== 'remit-ready') return;
      stage.classList.remove('is-live-loading'); stage.classList.add('is-live');
      $('span', liveBtn).textContent = 'Running live. Back to the illustration';
      stageCap.textContent = 'This is a real Flutter Web build running in the page: tap around, send a transfer, switch platform or tokens. Sample data only.';
    });
  }

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

  /* ---------- Smooth scrolling: desktop pointers only, native everywhere else ---------- */
  let lenis = null;
  function startLenis() {
    if (lenis || !window.Lenis || !finePointer.matches || reduceMotion.matches) return;
    try { lenis = new window.Lenis({ autoRaf: true, anchors: true, lerp: 0.11 }); } catch (e) { lenis = null; }
  }

  /* ---------- Entrance ---------- */
  function goReady() {
    if (ready) return;
    ready = true;
    root.classList.add('is-ready');
    startLenis();
    setTimeout(rollNumbers, 900);
    if (stage) setTimeout(startAuto, 1800);
  }
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const fontsSoon = Promise.race([fontsReady, new Promise((r) => setTimeout(r, 700))]);

  /* ---------- Intro: a dot drops, becomes "!", the name tumbles in and turns into the craft ---------- */
  function playIntro() {
    const intro = $('#intro');
    const done = () => { root.classList.remove('intro-on'); if (intro) intro.remove(); };
    if (!intro || !root.classList.contains('intro-on') || !intro.animate) { done(); goReady(); return; }
    const lettersEl = $('#intro-letters'), dot = $('.intro-dot', intro), stem = $('.intro-stem', intro), word = $('.intro-word', intro);
    let skipped = false, ended = false;
    const wakers = [];
    const wait = (ms) => new Promise((r) => { const t = setTimeout(r, ms); wakers.push(() => { clearTimeout(t); r(); }); });
    const end = (fast) => {
      if (ended) return; ended = true;
      window.removeEventListener('keydown', skip); window.removeEventListener('wheel', skip); window.removeEventListener('touchmove', skip);
      goReady();
      const a = fast
        ? intro.animate({ opacity: [1, 0] }, { duration: 260, fill: 'forwards' })
        : intro.animate({ clipPath: ['inset(0 0 0 0)', 'inset(0 0 100% 0)'] }, { duration: 850, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      if (!fast) word.animate({ transform: ['none', 'translateY(-14vh)'] }, { duration: 850, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      a.finished.then(done, done);
    };
    function skip() { if (skipped) return; skipped = true; wakers.forEach((w) => w()); end(true); }
    intro.addEventListener('click', skip);
    window.addEventListener('keydown', skip); window.addEventListener('wheel', skip, { passive: true }); window.addEventListener('touchmove', skip, { passive: true });

    (async () => {
      const NAME = 'Siraj', CRAFT = 'Flutter';
      // 1. The dot falls and bounces.
      dot.animate([
        { transform: 'translateY(-62vh)', easing: 'cubic-bezier(.5,0,1,.6)' },
        { transform: 'translateY(0) scale(1.25,.72)', offset: .46, easing: 'cubic-bezier(0,.5,.4,1)' },
        { transform: 'translateY(-9vh)', offset: .66, easing: 'cubic-bezier(.5,0,1,.6)' },
        { transform: 'translateY(0) scale(1.12,.86)', offset: .84, easing: 'cubic-bezier(0,.5,.4,1)' },
        { transform: 'translateY(-2.2vh)', offset: .93, easing: 'ease-in' },
        { transform: 'none' },
      ], { duration: 1000, fill: 'backwards' });
      await wait(1000); if (skipped) return;
      // 2. A stem grows out of it: "!"
      stem.animate({ transform: ['scaleY(0)', 'scaleY(1)'] }, { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)', fill: 'forwards' });
      await wait(520); if (skipped) return;
      // 3. The letters tumble in and shove the "!" along.
      const spans = [...NAME].map((c) => { const s = document.createElement('span'); s.className = 'intro-l'; s.textContent = c; lettersEl.appendChild(s); return s; });
      const widths = spans.map((s) => s.getBoundingClientRect().width);
      spans.forEach((s, i) => {
        s.style.width = '0px'; s.style.opacity = '0';
        const dir = i % 2 ? 1 : -1;
        s.animate([
          { width: '0px', opacity: 0, transform: `translate(${0.5 * dir}em,-1.15em) rotate(${150 * dir}deg)` },
          { width: widths[i] + 'px', opacity: 1, transform: `translate(0,.06em) rotate(${-10 * dir}deg)`, offset: .7 },
          { width: widths[i] + 'px', opacity: 1, transform: 'none' },
        ], { duration: 520, delay: i * 150, easing: 'cubic-bezier(.3,.9,.4,1)', fill: 'forwards' });
      });
      await wait(520 + (spans.length - 1) * 150 + 420); if (skipped) return;
      // 4. The name scrambles into the craft; the "!" settles into a full stop.
      const one = document.createElement('span'); one.className = 'intro-l'; one.textContent = NAME;
      lettersEl.textContent = ''; lettersEl.appendChild(one);
      scramble(one, CRAFT, 760);
      stem.animate({ transform: ['scaleY(1)', 'scaleY(0)'] }, { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      await wait(760 + 520); if (skipped) return;
      end(false);
    })();
  }
  fontsSoon.then(() => requestAnimationFrame(playIntro));

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
  // Word-by-word reveals
  const wordEls = reduceMotion.matches ? [] : $$('[data-words]').map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const spans = words.map((w, i) => {
      const s = document.createElement('span'); s.className = 'wd'; s.textContent = w;
      el.appendChild(s); if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });
    el.classList.add('is-words');
    return { el, spans, shown: 0 };
  });
  // Pinned chapters, pinned ride and stacking cards only switch on when the scene fits the viewport.
  const pinPay = $('#pin-pay');
  const chapterEls = $$('#pay-chapters li');
  const rideCase = $('.case-ride');
  const rideText = rideCase && $('.case-text', rideCase);
  const builds = $('#builds');
  const buildQ = $('.build-quibix'), buildB = $('.build-blaze');
  const finale = $('#finale');
  const wide = window.matchMedia('(min-width: 1101px)');
  let payStage = null; // set by the payment module below
  function setupPins() {
    const ok = wide.matches && !reduceMotion.matches;
    const vh = window.innerHeight;
    if (pinPay) {
      pinPay.classList.toggle('is-pinned', ok);
      if (ok) {
        const need = $('.suite', pinPay).offsetHeight + $('#pay-chapters').offsetHeight + 150;
        if (need > vh) pinPay.classList.remove('is-pinned');
      }
    }
    if (rideCase && rideFig && rideText) {
      rideCase.classList.remove('is-pinned');
      const h1 = rideFig.offsetHeight, h2 = rideText.offsetHeight;
      if (ok && Math.max(h1, h2) + 150 < vh) {
        rideFig.style.setProperty('--h', h1 + 'px'); rideText.style.setProperty('--h', h2 + 'px');
        rideCase.classList.add('is-pinned');
      }
    }
    if (builds && buildQ && buildB) {
      builds.classList.toggle('is-stack', ok);
      if (ok && Math.max(buildQ.offsetHeight, buildB.offsetHeight) + 150 > vh) builds.classList.remove('is-stack');
    }
  }
  setupPins();
  let pinT = 0;
  window.addEventListener('resize', () => { clearTimeout(pinT); pinT = setTimeout(() => { setupPins(); scrubs(); }, 160); }, { passive: true });
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
    wordEls.forEach((w) => {
      const r = w.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const n = Math.round(clamp01((vh * 0.9 - r.top) / (vh * 0.42 + r.height)) * w.spans.length);
      if (n === w.shown) return;
      w.spans.forEach((s, i) => s.classList.toggle('on', i < n));
      w.shown = n;
    });
    if (pinPay && payStage && pinPay.classList.contains('is-pinned')) {
      const r = pinPay.getBoundingClientRect();
      const p = clamp01(-r.top / Math.max(1, r.height - vh));
      payStage(p < 0.2 ? 0 : p < 0.5 ? 1 : p < 0.66 ? 2 : 3);
      const cuts = [0, 0.2, 0.6, 0.96];
      chapterEls.forEach((li, i) => {
        li.classList.toggle('on', p >= cuts[i] && (i === 2 || p < cuts[i + 1]));
        li.style.setProperty('--f', clamp01((p - cuts[i]) / (cuts[i + 1] - cuts[i])).toFixed(3));
      });
    }
    if (builds && builds.classList.contains('is-stack')) {
      const q = buildQ.getBoundingClientRect(), b = buildB.getBoundingClientRect();
      buildQ.style.setProperty('--stk', clamp01((q.bottom - b.top) / q.height).toFixed(3));
    }
    if (finale) {
      const r = finale.getBoundingClientRect();
      if (r.top < vh + 50) finale.style.setProperty('--fp', clamp01((vh - r.top) / (r.height * 0.85)).toFixed(3));
    }
    if (rideFig && route) {
      const r = rideFig.getBoundingClientRect();
      let t = clamp01((vh * 0.95 - r.top) / (vh * 0.85));
      if (rideCase && rideCase.classList.contains('is-pinned')) {
        const c = rideCase.getBoundingClientRect();
        t = clamp01((-c.top + vh * 0.25) / Math.max(1, (c.height - vh) * 0.95));
      }
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
    // When the scene is pinned, scroll position drives the same story instead of timers.
    let stage = -1;
    payStage = (s) => {
      if (s === stage) return;
      stage = s;
      timers.forEach(clearTimeout); timers = [];
      replay.hidden = true;
      suite.classList.toggle('is-scanning', s === 1);
      suite.classList.toggle('is-paid', s >= 2);
      qrStatus.textContent = s >= 2 ? 'Payment received' : 'Waiting for payment';
      const landed = s >= 3;
      if (landed === newRow.hidden) {
        newRow.hidden = !landed; lastRow.hidden = landed;
        count.textContent = landed ? '6' : '5';
        if (landed) { count.classList.remove('is-bump'); void count.offsetWidth; count.classList.add('is-bump'); }
      }
    };
    const pinnedNow = () => pinPay && pinPay.classList.contains('is-pinned');
    if ('IntersectionObserver' in window) {
      const pio = new IntersectionObserver(([en]) => {
        if (en.isIntersecting && !pinnedNow()) { stage = -1; runPayment(1200); pio.disconnect(); }
      }, { threshold: 0.45 });
      pio.observe(suite);
    } else if (!pinnedNow()) runPayment();
    scrubs();
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
  /* ---------- Particle portrait: the About photo assembles from dust and scatters under the pointer ---------- */
  (() => {
    const fig = $('.about-photo');
    const img = fig && $('img', fig);
    if (!fig || !img || reduceMotion.matches || !('IntersectionObserver' in window)) return;
    const cv = document.createElement('canvas');
    cv.className = 'dust'; cv.setAttribute('aria-hidden', 'true');
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    fig.classList.add('has-dust'); // hide the photo until the dust has formed it
    let P = null, n = 0, cell = 4, raf = 0, t0 = 0, formed = false, hover = false, started = false;
    let mx = -9999, my = -9999, W = 0, H = 0, dpr = 1;
    const COLS = window.innerWidth < 700 ? 56 : 84;

    function build(src) {
      const rows = Math.round(COLS * src.naturalHeight / src.naturalWidth);
      const off = document.createElement('canvas'); off.width = COLS; off.height = rows;
      const o = off.getContext('2d'); o.drawImage(src, 0, 0, COLS, rows);
      let data;
      try { data = o.getImageData(0, 0, COLS, rows).data; } catch (e) { return false; }
      n = COLS * rows;
      // x, y, homeX, homeY, vx, vy, delay per particle; colours kept apart.
      P = { f: new Float32Array(n * 7), c: new Array(n), rows };
      for (let i = 0; i < n; i++) {
        const k = i * 4;
        P.c[i] = `rgb(${data[k]},${data[k + 1]},${data[k + 2]})`;
      }
      return true;
    }
    function layout(scatter) {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = fig.clientWidth; H = fig.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      const ix = img.offsetLeft, iy = img.offsetTop, iw = img.offsetWidth, ih = img.offsetHeight;
      cell = iw / COLS;
      const f = P.f;
      for (let i = 0; i < n; i++) {
        const b = i * 7, cx = i % COLS, cy = (i / COLS) | 0;
        f[b + 2] = ix + cx * cell; f[b + 3] = iy + cy * (ih / P.rows);
        if (scatter) {
          const a = Math.random() * Math.PI * 2, r = (0.35 + Math.random() * 0.75) * Math.max(W, H);
          f[b] = W / 2 + Math.cos(a) * r; f[b + 1] = H * 0.35 + Math.sin(a) * r;
          f[b + 4] = 0; f[b + 5] = 0;
          f[b + 6] = (cy / P.rows) * 700 + Math.random() * 900; // head first, then down
        } else { f[b] = f[b + 2]; f[b + 1] = f[b + 3]; }
      }
    }
    function frame(now) {
      raf = 0;
      const f = P.f, el = now - t0, R = 70, R2 = R * R;
      let moving = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const s = cell + 0.6;
      for (let i = 0; i < n; i++) {
        const b = i * 7;
        let x = f[b], y = f[b + 1];
        if (el >= f[b + 6]) {
          let vx = f[b + 4], vy = f[b + 5];
          vx += (f[b + 2] - x) * 0.022; vy += (f[b + 3] - y) * 0.022;
          if (hover) {
            const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
            if (d2 < R2) { const d = Math.sqrt(d2) || 1, k = (1 - d / R) * 5; vx += (dx / d) * k; vy += (dy / d) * k; }
          }
          vx *= 0.8; vy *= 0.8;
          x += vx; y += vy;
          f[b] = x; f[b + 1] = y; f[b + 4] = vx; f[b + 5] = vy;
          if (Math.abs(vx) + Math.abs(vy) > 0.05 || Math.abs(f[b + 2] - x) > 0.4) moving++;
        } else moving++;
        ctx.fillStyle = P.c[i];
        ctx.fillRect(x, y, s, s);
      }
      if (moving === 0 && !hover) {
        if (!formed) { formed = true; fig.classList.add('is-formed'); }
        return; // settled: stop the loop until the pointer comes back
      }
      raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf && P) raf = requestAnimationFrame(frame); };

    function start() {
      if (started) return; started = true;
      const src = new Image();
      src.onload = () => {
        if (!build(src)) { fig.classList.remove('has-dust'); return; }
        fig.appendChild(cv);
        layout(true);
        t0 = performance.now();
        kick();
      };
      src.onerror = () => fig.classList.remove('has-dust');
      src.src = img.currentSrc || img.src;
    }
    new IntersectionObserver((ens, io) => {
      if (ens[0].isIntersecting) { io.disconnect(); start(); }
    }, { threshold: 0.3 }).observe(fig);

    if (finePointer.matches) {
      fig.addEventListener('pointermove', (e) => {
        if (!P || !formed) return;
        const r = fig.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
        if (!hover) { hover = true; fig.classList.remove('is-formed'); }
        kick();
      });
      fig.addEventListener('pointerleave', () => { hover = false; formed = false; kick(); });
    }
    let rt = 0;
    window.addEventListener('resize', () => {
      if (!P || !cv.isConnected) return;
      clearTimeout(rt);
      rt = setTimeout(() => { layout(false); t0 = 0; kick(); }, 150);
    }, { passive: true });
  })();
  /* ---------- WebGL lens: screenshots bulge and split into RGB under the pointer ---------- */
  (() => {
    if (!finePointer.matches || reduceMotion.matches) return;
    const shells = $$('[data-lens] .phone-shell');
    if (!shells.length) return;
    const cv = document.createElement('canvas');
    cv.className = 'lens'; cv.setAttribute('aria-hidden', 'true');
    const gl = cv.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a;varying vec2 v;void main(){v=vec2((a.x+1.)*.5,(1.-a.y)*.5);gl_Position=vec4(a,0.,1.);}'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `precision mediump float;
      uniform sampler2D t; uniform vec2 m; uniform vec2 fr; uniform float k; uniform float hw; uniform float time; varying vec2 v;
      vec2 fit(vec2 p){ return vec2(.5 + (p.x - .5) * fr.x, p.y * fr.y); }
      void main(){
        vec2 d = v - m;
        float r = length(vec2(d.x, d.y * hw));
        float f = smoothstep(.46, 0., r) * k;
        vec2 uv = v - d * f * .34 + normalize(d + 1e-5) * sin(r * 46. - time * 5.) * .0035 * f;
        vec2 s = d * f * .05;
        gl_FragColor = vec4(texture2D(t, fit(uv + s)).r, texture2D(t, fit(uv)).g, texture2D(t, fit(uv - s)).b, 1.);
      }`));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['m', 'fr', 'k', 'hw', 'time'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
    const texs = new Map();
    function texFor(img) {
      if (texs.has(img)) return texs.get(img);
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); } catch (e) { return null; }
      texs.set(img, t);
      return t;
    }
    let host = null, k = 0, kTo = 0, raf = 0, mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
    function frame(now) {
      raf = 0;
      k += (kTo - k) * 0.12; mx += (tx - mx) * 0.2; my += (ty - my) * 0.2;
      gl.uniform2f(U.m, mx, my); gl.uniform1f(U.k, k); gl.uniform1f(U.time, now / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (kTo === 0 && k < 0.01) { cv.remove(); host = null; k = 0; return; }
      raf = requestAnimationFrame(frame);
    }
    function enter(shell, e) {
      const pic = $('picture', shell), img = $('img', shell);
      if (!pic || !img || !img.complete || !img.naturalWidth) return;
      const t = texFor(img);
      if (!t) return;
      if (host !== pic) {
        host = pic; pic.appendChild(cv);
        const bw = pic.clientWidth, bh = pic.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(bw * dpr); cv.height = Math.round(bh * dpr);
        gl.viewport(0, 0, cv.width, cv.height);
        const sc = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
        gl.uniform2f(U.fr, bw / (img.naturalWidth * sc), bh / (img.naturalHeight * sc));
        gl.uniform1f(U.hw, bh / bw);
        gl.bindTexture(gl.TEXTURE_2D, t);
        k = 0;
        move(e); mx = tx; my = ty;
      }
      kTo = 1;
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function move(e) {
      const el = e.target.closest ? e.target.closest('picture') : null;
      if (!el || el !== host) return;
      const r = e.target.tagName === 'IMG' ? e.target : el;
      tx = e.offsetX / r.clientWidth; ty = e.offsetY / r.clientHeight;
    }
    shells.forEach((shell) => {
      shell.addEventListener('pointerenter', (e) => enter(shell, e));
      shell.addEventListener('pointermove', move);
      shell.addEventListener('pointerleave', () => { kTo = 0; });
    });
  })();
})();
