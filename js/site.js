/* Siraj M M — portfolio interactions. No dependencies. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- Guilloche linework (banknote-style rosettes) ---------- */
  function polarPath(fn, steps) {
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const r = fn(t);
      d += (i ? 'L' : 'M') + (r * Math.cos(t)).toFixed(1) + ' ' + (r * Math.sin(t)).toFixed(1);
    }
    return d + 'Z';
  }

  function drawRosette(svg, { rings = 10, base = 300, spread = 130, lobes = 24, amp = 20 } = {}) {
    if (!svg) return;
    const frag = document.createDocumentFragment();
    for (let k = 0; k < rings; k++) {
      const b = base + (k / (rings - 1)) * spread;
      const phase = (k * Math.PI) / rings;
      const fn = (t) =>
        b + amp * Math.sin(lobes * t + phase) * (0.72 + 0.28 * Math.cos(3 * t));
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', polarPath(fn, 900));
      p.setAttribute('pathLength', '1');
      frag.appendChild(p);
    }
    // inner rose
    for (let k = 0; k < 5; k++) {
      const fn = (t) => 70 + 120 * Math.abs(Math.sin(4 * t + (k * Math.PI) / 10));
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', polarPath(fn, 900));
      p.setAttribute('pathLength', '1');
      frag.appendChild(p);
    }
    svg.appendChild(frag);
  }

  function drawBand(svg) {
    if (!svg) return;
    const frag = document.createDocumentFragment();
    for (let k = 0; k < 7; k++) {
      let d = '';
      for (let x = 0; x <= 1200; x += 6) {
        const y = 30 + 18 * Math.sin(x / 38 + k * 0.9) * Math.cos(x / 210 - k * 0.3);
        d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
      }
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      frag.appendChild(p);
    }
    svg.appendChild(frag);
  }

  drawRosette(document.getElementById('guilloche'));
  drawRosette(document.getElementById('guilloche-contact'), { rings: 9, base: 260, spread: 170, lobes: 14, amp: 30 });
  drawBand(document.getElementById('footer-band'));

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Entrance ---------- */
  const ready = () => root.classList.add('is-ready');
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 700))]).then(() => requestAnimationFrame(ready));

  /* ---------- Navigation ---------- */
  const nav = document.getElementById('nav');
  const toggle = nav.querySelector('.nav-toggle');
  const links = [...nav.querySelectorAll('.nav-links a[href^="#"]')];

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
  }
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      nav.classList.toggle('is-scrolled', y > 24);
      nav.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
    ['work', 'experience', 'about', 'contact'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- Platform stage ---------- */
  const stage = document.getElementById('stage');
  const device = document.getElementById('device');
  const frame = stage && stage.querySelector('.stage-frame');
  const buttons = stage ? [...stage.querySelectorAll('.switch button')] : [];
  const nameEl = document.querySelector('.name');
  const ORDER = ['android', 'ios', 'macos', 'windows'];
  const SIZE = { android: [300, 620], ios: [300, 620], macos: [660, 430], windows: [660, 430] };
  let current = 'android';

  // The name widens with the device, but never past what its column can hold.
  let maxWd = 125;
  function measureName() {
    if (!nameEl) return;
    const prev = nameEl.style.transition;
    nameEl.style.transition = 'none';
    nameEl.style.setProperty('--wd', '100%');
    const spans = nameEl.querySelectorAll('.name-line > span');
    const widest = Math.max(...[...spans].map((s) => s.offsetWidth));
    maxWd = widest ? Math.max(62, Math.min(125, (100 * nameEl.clientWidth) / widest * 0.97)) : 100;
    void nameEl.offsetWidth;
    nameEl.style.transition = prev;
  }
  function nameStretch(p) {
    const desk = p === 'macos' || p === 'windows';
    return Math.min(desk ? 112 : 70, maxWd).toFixed(1);
  }

  function fit() {
    if (!frame) return;
    const [dw, dh] = SIZE[current];
    const s = Math.min(1, (frame.clientWidth - 4) / dw, (frame.clientHeight - 8) / dh);
    device.style.setProperty('--s', s.toFixed(3));
  }

  function setPlatform(p) {
    current = p;
    device.dataset.platform = p;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.p === p)));
    if (nameEl) nameEl.style.setProperty('--wd', nameStretch(p) + '%');
    fit();
  }

  // One unattended pass through the platforms, then it waits for the visitor.
  let autoTimer = null;
  const AUTO_MS = 3200;
  function stopAuto() {
    clearTimeout(autoTimer);
    autoTimer = null;
    stage.classList.remove('is-auto');
  }
  function startAuto() {
    if (reduceMotion.matches) return;
    let step = 0;
    stage.style.setProperty('--auto', AUTO_MS + 'ms');
    const next = () => {
      step += 1;
      if (step >= ORDER.length) { stopAuto(); setPlatform('android'); return; }
      // restart the tick animation on the newly active button
      stage.classList.remove('is-auto'); void stage.offsetWidth; stage.classList.add('is-auto');
      setPlatform(ORDER[step]);
      autoTimer = setTimeout(next, AUTO_MS);
    };
    stage.classList.add('is-auto');
    autoTimer = setTimeout(next, AUTO_MS + 900);
  }

  if (stage && device) {
    buttons.forEach((b) => b.addEventListener('click', () => { stopAuto(); setPlatform(b.dataset.p); }));
    stage.addEventListener('pointerenter', () => { if (autoTimer) stopAuto(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAuto(); });

    measureName();
    setPlatform('android');
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureName(); setPlatform(current); });
    let rz = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => { measureName(); setPlatform(current); });
    }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(frame);
    startAuto();

    // Gentle tilt toward the pointer on desktop
    if (finePointer.matches && !reduceMotion.matches) {
      let raf = 0;
      frame.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = frame.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          device.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
          device.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
        });
      });
      frame.addEventListener('pointerleave', () => {
        device.style.setProperty('--ry', '0deg');
        device.style.setProperty('--rx', '0deg');
      });
    }
  }

  /* ---------- Content reveals that explain something ---------- */
  const car = document.querySelector('.route-visual .car');
  const route = document.getElementById('route');
  function placeCar(t) {
    if (!car || !route) return;
    const len = route.getTotalLength();
    const pt = route.getPointAtLength(len * t);
    car.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
  }
  placeCar(reduceMotion.matches ? 1 : 0);
  if (!('IntersectionObserver' in window)) placeCar(1);

  function driveCar() {
    if (reduceMotion.matches) { placeCar(1); return; }
    const dur = 2400;
    const start = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const frameFn = (now) => {
      const t = Math.min(1, (now - start) / dur);
      placeCar(ease(t));
      if (t < 1) requestAnimationFrame(frameFn);
    };
    requestAnimationFrame(frameFn);
  }

  const reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in-view');
        if (en.target.classList.contains('route-visual')) driveCar();
        io.unobserve(en.target);
      });
    }, { threshold: 0.3 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in-view'));
  }

  /* ---------- Copy email ---------- */
  const copyBtn = document.querySelector('.copy');
  const status = document.querySelector('.copy-status');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = copyBtn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = 'Copied';
      } catch {
        status.textContent = 'Select the address to copy it';
      }
      clearTimeout(copyBtn._t);
      copyBtn._t = setTimeout(() => { status.textContent = ''; }, 2400);
    });
  }
})();
