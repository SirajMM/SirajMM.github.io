/* Motion for the glass theme: loader, bokeh background, spark cursor,
   flying project grid, swinging photo, counters, project sheet, form. */
(function () {
  'use strict';
  const root = document.documentElement;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const ACC = [255, 122, 26];

  /* ---------- loader ---------- */
  function loader() {
    const el = $('#loader');
    if (!el || !root.classList.contains('loading')) return;
    const word = $('#intro-word'), letters = $('#intro-letters');
    const dot = $('.intro-dot', el), stem = $('.intro-stem', el), bang = $('.intro-bang', el);
    let done = false, flying = false;
    const wakers = [];
    const wait = ms => new Promise(r => { const t = setTimeout(r, ms); wakers.push(() => { clearTimeout(t); r(); }); });
    const unbind = () => ['pointerdown', 'keydown'].forEach(e => removeEventListener(e, skip));
    // skipped: the plain wipe
    function skip() {
      if (done || flying) return; done = true; unbind(); wakers.forEach(w => w());
      el.classList.add('is-leaving');
      root.classList.remove('loading');
      setTimeout(() => { el.classList.remove('is-leaving'); el.style.display = 'none'; }, 1000);
    }
    // played through: the written name travels into the hero and becomes its headline
    function land() {
      const name = $('.name');
      if (done || !name || !letters.animate) return skip();
      flying = true; unbind();
      const a = letters.getBoundingClientRect(), b = name.getBoundingClientRect();
      const s = parseFloat(getComputedStyle(name).fontSize) / parseFloat(getComputedStyle(word).fontSize);
      root.classList.add('flying'); el.classList.add('is-flying'); root.classList.remove('loading');
      bang.animate({ opacity: [1, 0], transform: ['none', 'translateY(-.5em) scale(.2)'] }, { duration: 380, easing: 'ease-in', fill: 'forwards' });
      const fl = letters.animate([
        { transform: 'none' },
        { transform: 'translate(' + (b.left - a.left) * .5 + 'px,' + ((b.top - a.top) * .5 - innerHeight * .05) + 'px) scale(' + (1 + (s - 1) * .5) * .9 + ')', offset: .45 },
        { transform: 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px) scale(' + s + ')' },
      ], { duration: 1150, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' });
      const end = () => { done = true; root.classList.remove('flying'); el.classList.remove('is-flying'); el.style.display = 'none'; };
      fl.finished.then(end, end);
    }
    async function intro() {
      if (done) return;
      word.classList.add('is-on');
      // 1. the dot falls and bounces
      dot.animate([
        { transform: 'translateY(-62vh)', easing: 'cubic-bezier(.5,0,1,.6)' },
        { transform: 'translateY(0) scale(1.25,.72)', offset: .46, easing: 'cubic-bezier(0,.5,.4,1)' },
        { transform: 'translateY(-9vh)', offset: .66, easing: 'cubic-bezier(.5,0,1,.6)' },
        { transform: 'translateY(0) scale(1.12,.86)', offset: .84, easing: 'cubic-bezier(0,.5,.4,1)' },
        { transform: 'translateY(-2.2vh)', offset: .93, easing: 'ease-in' },
        { transform: 'none' },
      ], { duration: 1000, fill: 'backwards' });
      await wait(1000); if (done) return;
      // 2. a stem grows out of it: "!"
      stem.animate({ transform: ['scaleY(0)', 'scaleY(1)'] }, { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)', fill: 'forwards' });
      await wait(480); if (done) return;
      // 3. the letters tumble in and shove the "!" along
      const spans = [...'SIRAJ'].map(c => { const sp = document.createElement('span'); sp.className = 'intro-l'; sp.textContent = c; letters.appendChild(sp); return sp; });
      const widths = spans.map(sp => sp.getBoundingClientRect().width);
      spans.forEach((sp, i) => {
        sp.style.width = '0px'; sp.style.opacity = '0';
        const dir = i % 2 ? 1 : -1;
        sp.animate([
          { width: '0px', opacity: 0, transform: 'translate(' + .5 * dir + 'em,-1.15em) rotate(' + 150 * dir + 'deg)' },
          { width: widths[i] + 'px', opacity: 1, transform: 'translate(0,.06em) rotate(' + -10 * dir + 'deg)', offset: .7 },
          { width: widths[i] + 'px', opacity: 1, transform: 'none' },
        ], { duration: 520, delay: i * 150, easing: 'cubic-bezier(.3,.9,.4,1)', fill: 'forwards' });
      });
      await wait(520 + (spans.length - 1) * 150 + 380); if (done) return;
      land();
    }
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, wait(700)]).then(() => wait(250)).then(intro);
    addEventListener('pointerdown', skip); addEventListener('keydown', skip);
  }

  /* ---------- drifting glow background ---------- */
  function bokeh() {
    const cv = $('#bokeh'); if (!cv) return;
    const ctx = cv.getContext('2d');
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 128;
    const sc = sprite.getContext('2d'), g = sc.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,214,170,1)'); g.addColorStop(.12, 'rgba(' + ACC + ',.95)');
    g.addColorStop(.4, 'rgba(' + ACC + ',.28)'); g.addColorStop(1, 'rgba(' + ACC + ',0)');
    sc.fillStyle = g; sc.fillRect(0, 0, 128, 128);
    let w = 0, h = 0, dots = [], sy = scrollY, vy = 0, last = 0;
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp(w * h / 14000, 36, 110));
      dots = Array.from({ length: n }, () => {
        const z = Math.random();              // depth: 0 far, 1 near
        return { x: Math.random() * w, y: Math.random() * h, z, r: z > .86 ? 30 + Math.random() * 46 : 3 + z * 12 + Math.random() * 4,
          vx: (Math.random() - .5) * .16, vy: -(.05 + z * .3), ph: Math.random() * 6.28, a: z > .86 ? .75 : .45 + Math.random() * .55 };
      });
    }
    function frame(t) {
      if (document.hidden) return requestAnimationFrame(frame);
      const dt = Math.min(50, t - last) / 16.7; last = t;
      const ny = scrollY; vy += ((ny - sy) - vy) * .2; sy = ny;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const d of dots) {
        d.x += d.vx * dt; d.y += (d.vy - vy * (.05 + d.z * .22)) * dt;
        if (d.y < -80) d.y += h + 160; else if (d.y > h + 80) d.y -= h + 160;
        if (d.x < -80) d.x += w + 160; else if (d.x > w + 80) d.x -= w + 160;
        ctx.globalAlpha = d.a * (.7 + .3 * Math.sin(t * .0012 + d.ph));
        ctx.drawImage(sprite, d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
      }
      ctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(frame);
    }
    size(); addEventListener('resize', size);
    requestAnimationFrame(frame);
  }

  /* ---------- spark trail cursor ---------- */
  function sparks() {
    const cv = $('#sparks'); if (!cv || !fine || reduce) return;
    const ctx = cv.getContext('2d'); let w, h, ps = [], lx = null, ly = null, on = false;
    function size() { const dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(x, y, n, burst) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.28, s = (burst ? 2 + Math.random() * 5 : .4 + Math.random() * 1.6);
        ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, k: .02 + Math.random() * .03 });
      }
      if (ps.length > 260) ps.splice(0, ps.length - 260);
      if (!on) { on = true; requestAnimationFrame(frame); }
    }
    function frame() {
      ctx.clearRect(0, 0, w, h); ctx.lineCap = 'round';
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.l -= p.k; if (p.l <= 0) { ps.splice(i, 1); continue; }
        const ox = p.x, oy = p.y; p.vy += .05; p.vx *= .97; p.vy *= .97; p.x += p.vx; p.y += p.vy;
        ctx.strokeStyle = 'rgba(255,' + Math.round(120 + 110 * p.l) + ',' + Math.round(40 + 120 * p.l * p.l) + ',' + p.l + ')';
        ctx.lineWidth = 1 + p.l * 1.4; ctx.beginPath(); ctx.moveTo(ox - p.vx * 2, oy - p.vy * 2); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      if (ps.length) requestAnimationFrame(frame); else on = false;
    }
    size(); addEventListener('resize', size);
    addEventListener('pointermove', e => {
      if (lx !== null) { const d = Math.hypot(e.clientX - lx, e.clientY - ly); if (d > 6) spawn(e.clientX, e.clientY, Math.min(4, 1 + (d / 18 | 0))); }
      lx = e.clientX; ly = e.clientY;
    }, { passive: true });
    addEventListener('pointerdown', e => spawn(e.clientX, e.clientY, 22, true), { passive: true });
  }

  /* ---------- hero parallax, card light ---------- */
  function pointerFx() {
    const frame = $('#frame');
    if (frame && fine && !reduce) frame.addEventListener('pointermove', e => {
      const r = frame.getBoundingClientRect();
      frame.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      frame.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    });
    if (fine) $$('.glass').forEach(c => {
      c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); c.style.setProperty('--lit', 1); });
      c.addEventListener('pointerleave', () => c.style.setProperty('--lit', 0));
    });
  }

  /* ---------- reveals, counters, nav state ---------- */
  function reveals() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target); e.target.classList.add('is-in');
      const b = e.target.querySelector('[data-count]'); if (b) countUp(b);
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.rv').forEach(el => {
      const sibs = $$(':scope > .rv', el.parentNode); el.style.setProperty('--d', Math.min(sibs.indexOf(el), 8) * 70 + 'ms');
      io.observe(el);
    });
    const links = $$('.nav nav a'), map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const nio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.classList.remove('is-on')); const a = map.get(e.target.id); if (a) a.classList.add('is-on'); } }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((a, id) => { const s = document.getElementById(id); if (s) nio.observe(s); });
  }
  function countUp(b) {
    const to = +b.dataset.count, suf = b.dataset.suffix || ''; if (reduce) return;
    const t0 = performance.now(), D = 1400;
    (function f(now) { const p = clamp((now - t0) / D, 0, 1); b.textContent = Math.round(easeOut(p) * to) + suf; if (p < 1) requestAnimationFrame(f); })(t0);
  }

  /* ---------- projects: tiles fly in from scattered 3D positions ---------- */
  function fly() {
    const wrap = $('#fly'), tiles = $$('.tile', wrap); if (!wrap || reduce) return;
    // x, y in viewport units from the settled spot; z px; rotations deg; start scale
    const from = [[-62, 18, 420, 38, -14, 1.5], [-18, -10, -900, -30, 10, .5], [30, 6, -1300, 24, -8, .4], [58, -4, 300, -54, 6, 1.3], [-40, 46, -700, 20, 22, .6], [44, 50, 160, -36, -18, 1.2]];
    let ticking = false;
    function update() {
      ticking = false;
      const r = wrap.getBoundingClientRect(), span = r.height - innerHeight;
      const p = clamp(-r.top / span, 0, 1), vw = innerWidth / 100, vh = innerHeight / 100;
      tiles.forEach((el, i) => {
        const f = from[i % from.length];
        const t = easeInOut(clamp((p * 1.18 - i * .075) / .55, 0, 1)), k = 1 - t;
        const drift = Math.sin(p * 6 + i * 1.7) * 10 * k;
        el.style.transform = 'translate3d(' + (f[0] * vw * k) + 'px,' + (f[1] * vh * k + drift) + 'px,' + (f[2] * k) + 'px) rotateY(' + (f[3] * k) + 'deg) rotateX(' + (f[4] * k) + 'deg) scale(' + (1 + (f[5] - 1) * k) + ')';
        el.style.opacity = clamp(.12 + t * 2.4 + p * 3, 0, 1);
        el.style.pointerEvents = t > .9 ? '' : 'none';
      });
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update); update();
  }

  /* ---------- swinging photo: a damped pendulum pushed by scroll and pointer ---------- */
  function hang() {
    const el = $('#hang'); if (!el || reduce) return;
    let a = 9, v = 0, sy = scrollY, drag = false, running = false, vis = false, last = 0;
    function frame(t) {
      const dt = Math.min(32, t - last || 16) / 1000; last = t;
      if (!drag) { v += (-34 * a - 1.5 * v) * dt; a += v * dt; }
      el.style.setProperty('--sw', a.toFixed(3) + 'deg');
      if (vis && (drag || Math.abs(a) > .02 || Math.abs(v) > .05)) requestAnimationFrame(frame); else running = false;
    }
    function kick(dv) { v = clamp(v + dv, -260, 260); if (!running && vis) { running = true; last = 0; requestAnimationFrame(frame); } }
    new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) kick(30); }).observe(el);
    addEventListener('scroll', () => { const y = scrollY, d = y - sy; sy = y; if (vis) kick(clamp(d * .55, -40, 40)); }, { passive: true });
    const ang = e => { const r = el.parentNode.getBoundingClientRect(), nx = r.left + r.width / 2, ny = el.getBoundingClientRect().top; return clamp(-Math.atan2(e.clientX - nx, Math.max(60, e.clientY - ny)) * 57.3, -40, 40); };
    let pa = 0, pt = 0;
    el.addEventListener('pointerdown', e => { drag = true; el.setPointerCapture(e.pointerId); a = ang(e); pa = a; pt = performance.now(); v = 0; kick(0); el.style.cursor = 'grabbing'; });
    el.addEventListener('pointermove', e => {
      if (drag) { const n = ang(e), now = performance.now(); v = (n - pa) / Math.max(8, now - pt) * 1000; pa = n; pt = now; a = n; }
      else if (fine && e.movementX) kick(clamp(-e.movementX * 1.4, -30, 30));
    });
    const up = () => { if (drag) { drag = false; el.style.cursor = ''; kick(0); } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }

  /* ---------- project sheet ---------- */
  function sheet() {
    const dlg = $('#sheet'), body = $('#sheet-body'); if (!dlg || !dlg.showModal) return;
    $$('[data-project]').forEach(btn => btn.addEventListener('click', () => {
      const tpl = document.getElementById('p-' + btn.dataset.project); if (!tpl) return;
      body.replaceChildren(tpl.content.cloneNode(true));
      const h = $('h3', body); if (h) h.id = 'sheet-title';
      $$('iframe[data-src]', body).forEach(f => { f.src = f.dataset.src; });
      dlg.showModal(); dlg.scrollTop = 0;
    }));
    const close = () => dlg.close();
    $('#sheet-x').addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => body.replaceChildren());
  }

  /* ---------- contact ---------- */
  function contact() {
    const timeEl = $('#kochi-time');
    if (timeEl && window.Intl) {
      const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      const tick = () => { timeEl.textContent = "It's " + fmt.format(new Date()) + ' in Kochi right now'; };
      tick(); timeEl.hidden = false; setInterval(tick, 30000);
    }
    const copy = $('#copy');
    if (copy) copy.addEventListener('click', () => {
      const done = () => { copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(copy.dataset.copy).then(done, () => {}); 
    });
    const form = $('#form'), note = $('#form-note');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(form), to = form.getAttribute('action');
      const subject = 'Project enquiry from ' + d.get('name');
      const text = d.get('message') + '\n\n' + d.get('name') + '\n' + d.get('email');
      location.href = to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
      note.textContent = 'Your email app should have opened with the message ready to send.';
    });
  }

  /* Marquee that speeds up and leans with the scroll */
  function globe() {
    function fit(cv) {
      const d = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
      return { d, w, h };
    }
    function whileVisible(el, frame, still) {
      if (reduce) { still(); return; }
      let on = false, raf = 0, last = 0, seen = false;
      const tick = (t) => { raf = 0; if (!on) return; frame(t, Math.min(50, t - (last || t))); last = t; raf = requestAnimationFrame(tick); };
      const set = (v) => { on = v && !document.hidden; if (on && !raf) { last = 0; raf = requestAnimationFrame(tick); } };
      new IntersectionObserver((es) => { seen = es[0].isIntersecting; set(seen); }, { rootMargin: '120px' }).observe(el);
      document.addEventListener('visibilitychange', () => set(seen));
    }
    const cv = $('#globe'); if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const LAND = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4P+AAAAAAAAAAAAAAAD9P//ABYAAAYAAAAAAABa8f/+AAAACACwAAAAAAcrMB/+AAAAgH/dBAAAYABy/g/wAAAADf///+Ax////64/gAB/z/f/////I////6weBgDv///////+B///+DAMAAPf//////9cAIP/+DoAACLf/////+BgAgH//j8AACGf/////4DAAAB//7+AAFv///////CAAAAf//wAAB////////AAAAAf//wAAB/9f////8AAAAAf//gAAF38f////5AAAAAf/+AAAHB7////9gAAAAAf/+AAAHCX////8iAAAAAP/8AAAD4A////8MAAAAAH/4AAAH+Z////8QAAAAAB8IAAAP//9///+AAAAAAA8AAAAf//+P//8AAAAAAAYEAAAf//fx//wAAAAAAAcggAAf//Pg8egAAAAAAAHgAAAf//vA4fCAAAAAAAAwAAA///8AYHAAAAAAAAARwAAf//+AYBAAAAAAAAAD8AAP//+AAABAAAAAAAAD/gAEP/8AAIMAAAAAAAAD/gAAH/4AAG4AAAAAAAAH/4AAH/wAACaoAAAAAAAH/+AAD/gAACCHAAAAAAAH//AAD/gAAAwDgAAAAAAD//AAB/wAAAAAAAIAAAAB/+AAD/yAAAAZAAAAAAAA/+AAD/mAAAB/AAAAAAAAf+AAD/EAAAD/gAAAAAAAf8AAB/MAAAP/wAAAAAAA/wAAB+AAAAP/4AAAAAAA/wAAB+AAAAP/4AAAAAAA/gAAA8AAAAH/4AAAAAAA/AAAAgAAAAEDwAAAAAAB+AAAAAAAAAABwCAAAAAB4AAAAAAAAAAAACAAAAAAwAAAAAAAAAAAAEAAAAABwAAAAAAAAAAAAIAAAAABgAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAHwD///AAAAAAAA8AAADD/+/////AAAAAH04AA//////////wAD///9gAP//////////ABj///+gcP//////////AAH////53///////////g////////////////////////////////////////';
    const W = 120, H = 60, bin = atob(LAND), pts = [];
    const R = Math.PI / 180;
    const vec = (lat, lon) => { const a = lat * R, o = lon * R; return [Math.cos(a) * Math.sin(o), Math.sin(a), Math.cos(a) * Math.cos(o)]; };
    for (let j = 0; j < H; j++) {
      const lat = 90 - (j + 0.5) * 180 / H, keep = Math.cos(lat * R);
      let acc = 0;
      for (let i = 0; i < W; i++) {
        const k = j * W + i;
        if (!((bin.charCodeAt(k >> 3) >> (7 - (k & 7))) & 1)) continue;
        acc += keep; if (acc < 1) continue; acc -= 1;           // even density towards the poles
        pts.push(vec(lat, -180 + (i + 0.5) * 360 / W));
      }
    }
    const P = new Float32Array(pts.length * 3); pts.forEach((p, i) => P.set(p, i * 3));
    const HOME = { lat: 9.93, lon: 76.27 };
    const home = vec(HOME.lat, HOME.lon);
    const arcs = [[25.2, 55.3], [51.5, -0.1], [40.7, -74], [1.35, 103.8], [-33.9, 151.2], [24.7, 46.7], [35.7, 139.7]].map(([la, lo], n) => {
      const b = vec(la, lo), dot = clamp(home[0] * b[0] + home[1] * b[1] + home[2] * b[2], -1, 1), om = Math.acos(dot), so = Math.sin(om), N = 56;
      const line = new Float32Array((N + 1) * 3);
      for (let i = 0; i <= N; i++) {
        const t = i / N, k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so, lift = 1 + Math.sin(Math.PI * t) * (0.1 + om * 0.16);
        for (let c = 0; c < 3; c++) line[i * 3 + c] = (home[c] * k1 + b[c] * k2) * lift;
      }
      return { line, N, end: b, off: n * 0.37, speed: 0.16 + (n % 3) * 0.03 };
    });
    let rot = -(HOME.lon - 14) * R, tilt = 0.34, vel = 0, drag = null, t0 = 0;
    const paper = '245,242,236', foil = '255,122,26';

    function draw(time) {
      const { d, w, h } = fit(cv); if (!w) return;
      ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.4;
      const cr = Math.cos(rot), sr = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
      const tf = (x, y, z) => { const x1 = x * cr + z * sr, z1 = -x * sr + z * cr; return [x1, y * ct - z1 * st, y * st + z1 * ct]; };
      // body
      const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
      g.addColorStop(0, 'rgba(255,122,26,.26)'); g.addColorStop(1, 'rgba(20,14,12,.3)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(${paper},.22)`; ctx.lineWidth = 1; ctx.stroke();
      // land, in three depth bands so each needs a single fill
      const band = [[], [], []], s = Math.max(1.3, r / 150);
      for (let i = 0; i < P.length; i += 3) {
        const v = tf(P[i], P[i + 1], P[i + 2]);
        (v[2] < 0 ? band[0] : v[2] < 0.55 ? band[1] : band[2]).push(cx + v[0] * r, cy - v[1] * r);
      }
      [[`rgba(${paper},.09)`, s * 0.8], [`rgba(${paper},.45)`, s], [`rgba(${paper},.85)`, s * 1.15]].forEach(([col, sz], b) => {
        ctx.fillStyle = col; ctx.beginPath();
        const a = band[b]; for (let i = 0; i < a.length; i += 2) ctx.rect(a[i] - sz / 2, a[i + 1] - sz / 2, sz, sz);
        ctx.fill();
      });
      // routes
      const sec = time / 1000;
      arcs.forEach((a) => {
        const head = (sec * a.speed + a.off) % 1.25;
        ctx.lineWidth = 1.1; let prev = null;
        for (let i = 0; i <= a.N; i++) {
          const v = tf(a.line[i * 3], a.line[i * 3 + 1], a.line[i * 3 + 2]);
          const hidden = v[2] < 0 && v[0] * v[0] + v[1] * v[1] < 1;
          const cur = hidden ? null : [cx + v[0] * r, cy - v[1] * r];
          if (prev && cur) {
            const t = i / a.N, near = head - t, hot = near > 0 && near < 0.22 ? 1 - near / 0.22 : 0;
            ctx.strokeStyle = `rgba(${foil},${(0.2 + hot * 0.8).toFixed(2)})`; ctx.lineWidth = 1 + hot * 1.4;
            ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke();
          }
          prev = cur;
        }
        const e = tf(a.end[0], a.end[1], a.end[2]);
        if (e[2] > 0) { ctx.fillStyle = `rgba(${foil},.9)`; ctx.beginPath(); ctx.arc(cx + e[0] * r, cy - e[1] * r, 2.2, 0, 7); ctx.fill(); }
      });
      // home
      const hv = tf(home[0], home[1], home[2]);
      if (hv[2] > 0) {
        const hx = cx + hv[0] * r, hy = cy - hv[1] * r, pulse = (sec * 0.6) % 1;
        ctx.strokeStyle = `rgba(${foil},${(1 - pulse).toFixed(2)})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(hx, hy, 4 + pulse * 16, 0, 7); ctx.stroke();
        ctx.fillStyle = `rgb(${foil})`; ctx.beginPath(); ctx.arc(hx, hy, 4, 0, 7); ctx.fill();
        if (w > 360) {
          ctx.font = '600 12px Archivo, system-ui, sans-serif'; ctx.textBaseline = 'middle';
          ctx.fillStyle = `rgba(${paper},${clamp(hv[2] * 2).toFixed(2)})`;
          ctx.fillText('Kochi  9.93°N 76.27°E', hx + 14, hy - 12);
        }
      }
    }
    whileVisible(cv, (t, dt) => {
      if (!drag) { rot += (0.00009 + vel) * dt; vel *= 0.94; }
      t0 = t; draw(t);
    }, () => draw(0));
    if (reduce) window.addEventListener('resize', () => draw(0));

    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, rot, tilt, lx: e.clientX, lt: e.timeStamp }; vel = 0; try { cv.setPointerCapture(e.pointerId); } catch (_) {} cv.classList.add('is-grabbing'); });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      rot = drag.rot + (e.clientX - drag.x) * 0.006; tilt = clamp(drag.tilt + (e.clientY - drag.y) * 0.004, -0.9, 0.9);
      const dt = Math.max(1, e.timeStamp - drag.lt); vel = clamp((e.clientX - drag.lx) * 0.006 / dt, -0.004, 0.004); drag.lx = e.clientX; drag.lt = e.timeStamp;
      if (reduce) draw(0);
    });
    const up = () => { drag = null; cv.classList.remove('is-grabbing'); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    document.documentElement.classList.add('has-globe');
  }

  /* Hero portrait: a liquid glass "X-ray" melts open wherever the cursor
     (or a finger) moves, then flows shut again. WebGL; the <img> stays as
     the fallback. Set data-xray="img/your-glass-layer.webp" on .hero-me to
     reveal an aligned second image instead of the drawn glass layer. */
  function xray() {
    const img = $('.hero-me'), frame = $('#frame');
    if (!img || !frame || reduce) return;
    const cv = document.createElement('canvas');
    cv.className = 'hero-xray'; cv.setAttribute('aria-hidden', 'true');
    cv.width = img.getAttribute('width'); cv.height = img.getAttribute('height');
    const gl = cv.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const N = 18;
    const vs = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0,1);}';
    const fs = `precision highp float;varying vec2 v;
uniform sampler2D P,X;uniform float hasX,T,A;uniform vec2 px;uniform vec3 pts[${N}];const float HX=.63,HY=.2,HS=.11;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fld(vec2 uv){vec2 q=vec2(uv.x*A,uv.y);float f=0.;
 for(int i=0;i<${N};i++){vec3 p=pts[i];vec2 d=q-vec2(p.x*A,p.y);f+=p.z*p.z*.016/(dot(d,d)+.0006);}
 float w=n(uv*vec2(7.,5.)+vec2(0.,T*.7))+.5*n(uv*15.-T*.5);
 return f*(.78+.3*w);}
float BV,BA;
mat2 R(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float sdE(vec3 p,vec3 r){float k0=length(p/r),k1=length(p/(r*r));return k0*(k0-1.)/k1;}
float sdC(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;return length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.,1.))-r;}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
vec2 hmap(vec3 p){
 vec3 q=p;q.xy=R(.5)*q.xy;q.xz*=1.+.32*clamp(-q.y-.1,0.,1.);
 float sv=1.-.075*BV,sa=1.-.1*BA;
 float m=smin(sdE(q-vec3(.12,-.2,-.05),vec3(.6,.85,.55)*sv),sdE(q-vec3(-.22,-.05,.14),vec3(.56,.7,.47)*sv),.22);
 m=smin(m,sdE(p-vec3(-.6,.36,0.),vec3(.32,.36,.3)*sa),.16);
 m=smin(m,sdE(p-vec3(.45,.42,-.25),vec3(.3,.27,.28)*sa),.16);
 m=smin(m,sdE(p-vec3(-.4,.56,.24),vec3(.16,.1,.13)*sa),.08);
 vec3 c=vec3(.12,.78,-.05),pa=p-c;pa.xz=R(-.9)*pa.xz;
 float ar=pa.y>=0.?length(vec2(length(pa.xy)-.32,pa.z))-.13:1e3;
 ar=min(ar,sdC(p,vec3(-.08,.78,.2),vec3(-.12,.22,.12),.13));
 ar=min(ar,sdC(p,vec3(.32,.78,-.3),vec3(.42,-.3,-.45),.12));
 ar=min(ar,sdC(p,vec3(.03,1.03,.07),vec3(-.04,1.4,.1),.06));
 ar=min(ar,sdC(p,vec3(.12,1.07,-.05),vec3(.13,1.45,-.06),.055));
 ar=min(ar,sdC(p,vec3(.21,1.03,-.17),vec3(.3,1.38,-.22),.055));
 float pu=sdC(p,vec3(0.,.2,.36),vec3(.16,.6,.26),.14);
 pu=min(pu,sdC(p,vec3(.16,.6,.26),vec3(.62,.64,.02),.085));
 pu=min(pu,sdC(p,vec3(.16,.6,.26),vec3(-.2,.66,.02),.08));
 float ve=sdC(p,vec3(-.62,.45,0.),vec3(-.6,1.3,0.),.11);
 vec2 r=vec2(m,0.);
 float a2=smin(m,ar,.08);if(ar<m)r=vec2(a2,1.);else r.x=a2;
 float u2=smin(r.x,pu,.07);if(pu<r.x)r=vec2(u2,2.);else r.x=u2;
 float v2=smin(r.x,ve,.07);if(ve<r.x)r=vec2(v2,2.);else r.x=v2;
 return r;}
vec4 heart(vec2 u){
 vec2 q=(vec2(u.x*A,u.y)-vec2(HX*A,HY))/HS;
 float ph=fract(T/.86);
 BV=exp(-pow(ph*11.,2.))+.6*exp(-pow((ph-.2)*11.,2.))+exp(-pow((ph-1.)*11.,2.));
 BA=exp(-pow((ph-.88)*12.,2.));
 if(abs(q.x)>1.5||q.y<-1.45||q.y>1.8)return vec4(0.);
 mat2 Ry=R(-.3+.38*sin(T*.45)),Rx=R(.1);
 vec3 ro=vec3(q,2.5),rd=vec3(0.,0.,-1.),Lt=normalize(vec3(-.5,.6,.85));
 ro.xz=Ry*ro.xz;rd.xz=Ry*rd.xz;Lt.xz=Ry*Lt.xz;ro.yz=Rx*ro.yz;rd.yz=Rx*rd.yz;Lt.yz=Rx*Lt.yz;
 float t=0.;vec2 h=vec2(1.);
 for(int i=0;i<60;i++){h=hmap(ro+rd*t);if(h.x<.004||t>5.)break;t+=h.x*.75;}
 if(h.x>.03)return vec4(0.);
 vec3 p=ro+rd*t;vec2 e=vec2(.004,-.004);
 vec3 N=normalize(e.xyy*hmap(p+e.xyy).x+e.yyx*hmap(p+e.yyx).x+e.yxy*hmap(p+e.yxy).x+e.xxx*hmap(p+e.xxx).x);
 vec3 V=-rd;
 vec3 base=h.y<.5?vec3(.6,.07,.05):h.y<1.5?vec3(.85,.2,.1):vec3(.3,.2,.46);
 if(h.y<.5){vec3 k=p;k.xy=R(.5)*k.xy;
  float gr=exp(-pow((k.x+.08-.12*sin(k.y*2.2))*13.,2.))*step(0.,k.z);
  base=mix(base,vec3(1.,.62,.25),gr*.75);
  base+=vec3(.9,.3,.1)*pow(n(k.xy*vec2(5.,9.)+k.z*4.),5.)*.6;}
 float wr=clamp((dot(N,Lt)+.45)/1.45,0.,1.),fr=pow(1.-max(dot(N,V),0.),2.5);
 float sp=pow(max(dot(reflect(-Lt,N),V),0.),38.);
 vec3 col=base*(.25+1.05*wr)*(.85+.45*BV)+vec3(1.,.38,.16)*fr*.75+vec3(1.,.92,.85)*sp*.85;
 return vec4(col,.94);}
float L(vec2 u){return dot(texture2D(P,u).rgb,vec3(.3,.59,.11));}
void main(){
 vec2 uv=v;vec3 ph=texture2D(P,uv).rgb;
 float f=fld(uv);
 if(f<.55){gl_FragColor=vec4(ph,1.);return;}
 float e=.0035;vec2 g=vec2(fld(uv+vec2(e,0.))-f,fld(uv+vec2(0.,e))-f)/e;
 float m=smoothstep(.92,1.04,f);
 float edge=1.-smoothstep(1.,2.6,f);
 vec2 off=-clamp(g*.0009,-.05,.05)*(.35+edge);
 vec2 ru=uv+off;
 vec3 inside;
 if(hasX>.5){
  vec2 xu=uv+off*.45;inside=vec3(texture2D(X,xu+off*.18).r,texture2D(X,xu).g,texture2D(X,xu-off*.18).b);
  inside=inside*1.08+texture2D(P,xu).rgb*.22*(1.-dot(inside,vec3(.33)));
 }else{
  float lr=L(ru+off*.7),lg=L(ru),lb=L(ru-off*.7);
  float gx=L(ru+vec2(px.x,0.))-L(ru-vec2(px.x,0.)),gy=L(ru+vec2(0.,px.y))-L(ru-vec2(0.,px.y));
  float gx2=L(ru+vec2(px.x*3.,0.))-L(ru-vec2(px.x*3.,0.)),gy2=L(ru+vec2(0.,px.y*3.))-L(ru-vec2(0.,px.y*3.));
  float ed=clamp(length(vec2(gx,gy))*5.+length(vec2(gx2,gy2))*2.2,0.,1.);
  vec3 body=vec3(pow(lr,.75),pow(lg,.75),pow(lb,.75));
  float sil=smoothstep(.04,.2,lg);
  vec3 bone=vec3(.82,.92,1.)*pow(ed,1.3)*1.5;
  vec3 tint=vec3(1.,.5,.14)*body.g*.55+vec3(.05,.09,.14)*sil;
  float scan=.5+.5*sin(uv.y*420.+T*4.);
  inside=tint+bone+vec3(.5,.8,1.)*sil*scan*.05+vec3(body.r-body.g,0.,body.b-body.g)*.6;
  inside+=vec3(1.,.6,.25)*pow(n(ru*vec2(40.,26.)+T*.3),6.)*sil*.7;
 }
 {vec2 hu=uv+off*.5;vec4 hc=heart(hu);
  float bl=smoothstep(.55,.95,dot(inside,vec3(.33)));
  inside=mix(inside,hc.rgb*1.15+inside*.12,hc.a*(.98-.28*bl));
  vec2 d=vec2((hu.x-HX)*A,hu.y-HY);inside+=vec3(1.,.22,.06)*exp(-dot(d,d)/(HS*HS)*1.4)*(.1+.3*BV);}
 vec3 nrm=normalize(vec3(-g*.0045,1.));
 float spec=pow(max(dot(nrm,normalize(vec3(-.45,.55,.9))),0.),36.)*(1.-m*.6);
 float rim=smoothstep(.86,1.,f)*(1.-smoothstep(1.,1.45,f));
 vec3 c=mix(ph,inside,m)+vec3(1.,.66,.36)*rim*.75+vec3(1.,.93,.86)*spec*.9*smoothstep(.7,1.,f);
 gl_FragColor=vec4(c,1.);}`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = k => gl.getUniformLocation(pr, k);
    const uT = U('T'), uA = U('A'), uPx = U('px'), uPts = U('pts'), uHas = U('hasX');
    gl.uniform1i(U('P'), 0); gl.uniform1i(U('X'), 1);
    const tex = (unit, src) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src); };

    const pts = Array.from({ length: N }, () => ({ x: 0, y: 0, life: 0, grow: 0 }));
    const buf = new Float32Array(N * 3);
    let head = -1, inside = false, raf = 0, last = 0, t0 = performance.now(), vis = true, ready = false;

    function size() {
      const r = cv.getBoundingClientRect(); if (!r.height) return;
      const dpr = Math.min(devicePixelRatio || 1, 1.75);
      const hgt = Math.round(r.height * dpr), wid = Math.round(hgt * img.width / img.height || hgt * .805);
      if (cv.height !== hgt) { cv.height = hgt; cv.width = wid; }
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uPx, 1 / cv.width, 1 / cv.height); gl.uniform1f(uA, cv.width / cv.height);
    }
    function draw(now) {
      raf = 0; const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      let alive = false;
      pts.forEach((p, i) => {
        const held = inside && i === head;
        p.life = held ? 1 : Math.max(0, p.life - dt * (i === head ? .9 : 1.25));
        p.grow = Math.min(1, p.grow + dt * 4);
        const k = p.life * p.life * (3 - 2 * p.life) * (1 - Math.pow(1 - p.grow, 3));
        buf[i * 3] = p.x; buf[i * 3 + 1] = p.y; buf[i * 3 + 2] = k * (i === head ? 1 : .82);
        if (p.life > 0) alive = true;
      });
      const T = (now - t0) / 1000;
      gl.uniform3fv(uPts, buf); gl.uniform1f(uT, T);
      beat(T);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (alive && vis) raf = requestAnimationFrame(draw); else last = 0;
    }
    /* Heartbeat sound, in time with the drawn heart. Browsers keep audio
       muted until the visitor clicks, taps or presses a key once, so a small
       hint asks for that click while the glass is over the heart. */
    let ac = null, out = null, lastPh = 0, noise = null;
    const hint = document.createElement('button');
    hint.type = 'button'; hint.className = 'beat-hint';
    hint.textContent = matchMedia('(hover: none)').matches ? 'Tap to hear the heartbeat' : 'Click to hear the heartbeat';
    frame.append(hint);
    const unlock = () => {
      try {
        if (navigator.audioSession) navigator.audioSession.type = 'playback';
        if (!ac) {
          ac = new (window.AudioContext || window.webkitAudioContext)();
          const comp = ac.createDynamicsCompressor(); out = ac.createGain(); out.gain.value = .9;
          out.connect(comp).connect(ac.destination);
          noise = ac.createBuffer(1, ac.sampleRate * .08, ac.sampleRate);
          const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        }
        if (ac.state !== 'running') ac.resume();
      } catch (e) { ac = null; }
    };
    ['pointerdown', 'mousedown', 'touchstart', 'touchend', 'keydown', 'click'].forEach(ev => addEventListener(ev, unlock, { passive: true }));
    hint.addEventListener('click', () => { unlock(); hint.classList.remove('on'); });
    function thump(vol, f0) {
      const t = ac.currentTime + .01;
      const tone = (f, fe, dur, v, type) => {
        const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine';
        o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(fe, t + dur * .6);
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        o.connect(g).connect(out); o.start(t); o.stop(t + dur + .02);
      };
      tone(f0, f0 * .5, .28, vol);              /* chest-deep body */
      tone(f0 * 2.2, f0 * 1.1, .16, vol);  /* the part small speakers can play */
      tone(f0 * 4, f0 * 2, .07, vol * .25, 'triangle');
      const n = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain();
      n.buffer = noise; lp.type = 'lowpass'; lp.frequency.value = 700;
      g.gain.setValueAtTime(vol * .6, t); g.gain.exponentialRampToValueAtTime(.0001, t + .07);
      n.connect(lp).connect(g).connect(out); n.start(t);
    }
    function beat(T) {
      const ph = (T / .86) % 1, prev = lastPh; lastPh = ph;
      const A = cv.width / cv.height, hx = .63 * A, hy = .2;
      let f = 0;
      for (let i = 0; i < N; i++) { const z = buf[i * 3 + 2], dx = hx - buf[i * 3] * A, dy = hy - buf[i * 3 + 1]; f += z * z * .016 / (dx * dx + dy * dy + .0006); }
      const vol = Math.min(1, Math.max(0, (f - .8) / 1.2)) * .9;
      const live = ac && ac.state === 'running';
      if (vol > .02 && !live && !hint.classList.contains('on')) {
        const r = cv.getBoundingClientRect(), fr = frame.getBoundingClientRect();
        hint.style.left = (r.left - fr.left + hx / A * r.width) + 'px';
        hint.style.top = (r.top - fr.top + (1 - hy - .13) * r.height) + 'px';
        hint.classList.add('on');
      } else if ((vol <= .02 || live) && hint.classList.contains('on')) hint.classList.remove('on');
      if (!live || vol < .02) return;
      if (ph < prev) thump(vol, 78);
      else if (prev < .2 && ph >= .2) thump(vol * .7, 92);
    }
    const kick = () => { if (!raf && ready) raf = requestAnimationFrame(draw); };

    function at(cx, cy) {
      const r = cv.getBoundingClientRect();
      const x = (cx - r.left) / r.width, y = 1 - (cy - r.top) / r.height;
      inside = x > -.05 && x < 1.05 && y > -.05 && y < 1.05;
      if (!inside) return kick();
      const h = pts[head];
      if (!h || Math.hypot((x - h.x) * r.width / r.height, y - h.y) > .028) {
        head = (head + 1) % N; Object.assign(pts[head], { x, y, life: 1, grow: h && h.life > .3 ? .55 : 0 });
      } else { h.x += (x - h.x) * .5; h.y += (y - h.y) * .5; }
      kick();
    }
    frame.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') at(e.clientX, e.clientY); });
    frame.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') { inside = false; kick(); } });
    const tm = e => { const t = e.touches[0]; if (t) at(t.clientX, t.clientY); };
    frame.addEventListener('touchstart', tm, { passive: true });
    frame.addEventListener('touchmove', tm, { passive: true });
    frame.addEventListener('touchend', () => { inside = false; kick(); }, { passive: true });

    const load = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = s; });
    const start = () => {
      img.after(cv); size();
      Promise.all([img.decode ? img.decode().then(() => img) : load(img.currentSrc || img.src),
        img.dataset.xray ? load(img.dataset.xray).catch(() => null) : null]).then(([p, x]) => {
        tex(0, p); gl.uniform1f(uHas, x ? 1 : 0); if (x) tex(1, x); gl.activeTexture(gl.TEXTURE0);
        ready = true; draw(performance.now()); frame.classList.add('xray-on');
      }).catch(() => cv.remove());
    };
    if (img.complete) start(); else img.addEventListener('load', start, { once: true });
    addEventListener('resize', () => { if (ready) { size(); draw(performance.now()); } });
    new IntersectionObserver(([en]) => { vis = en.isIntersecting; if (vis) kick(); }).observe(frame);
    cv.addEventListener('webglcontextlost', () => { frame.classList.remove('xray-on'); cv.remove(); });
  }

  function marquee() {
    const ms = $$('[data-marquee]').map(el => {
      const track = $('.marquee-track', el);
      track.innerHTML += track.innerHTML;
      return { el, track, x: 0, w: track.scrollWidth / 2, speed: parseFloat(el.dataset.speed || '1'), on: false };
    });
    if (!ms.length || reduce || !('IntersectionObserver' in window)) return;
    let vel = 0, dir = -1, prevY = scrollY, prevT = performance.now(), raf = 0;
    const measure = () => ms.forEach(m => { m.w = m.track.scrollWidth / 2; });
    addEventListener('resize', measure, { passive: true });
    if (document.fonts) document.fonts.ready.then(measure);
    const loop = now => {
      const dt = Math.min(64, now - prevT); prevT = now;
      const dy = scrollY - prevY; prevY = scrollY;
      if (dy) dir = dy > 0 ? -1 : 1;
      vel += (dy - vel) * 0.12;
      const boost = Math.min(14, Math.abs(vel) * 0.5), skew = Math.max(-9, Math.min(9, -vel * 0.35));
      ms.forEach(m => {
        if (!m.on || !m.w) return;
        m.x += dir * (0.05 + boost * 0.05) * dt * m.speed;
        if (m.x <= -m.w) m.x += m.w; else if (m.x > 0) m.x -= m.w;
        m.track.style.setProperty('--mq', m.x.toFixed(1) + 'px');
        m.track.style.setProperty('--skew', skew.toFixed(2) + 'deg');
      });
      raf = ms.some(m => m.on) ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(es => {
      es.forEach(e => { const m = ms.find(q => q.el === e.target); if (m) m.on = e.isIntersecting; });
      if (!raf && ms.some(m => m.on)) { prevT = performance.now(); prevY = scrollY; raf = requestAnimationFrame(loop); }
    });
    ms.forEach(m => io.observe(m.el));
  }

  loader(); bokeh(); sparks(); pointerFx(); reveals(); fly(); hang(); sheet(); contact(); marquee(); globe(); xray();
})();
