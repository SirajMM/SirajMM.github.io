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
    const count = $('#count'), line = $('#loader-line');
    const cols = $$('.col b', count);
    cols.forEach(b => { b.textContent = '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0'; b.style.lineHeight = '1'; });
    line.innerHTML = line.innerHTML.split(/<br\s*\/?>/i).map(l => l.trim().split(/\s+/).map(w => '<span>' + w + '</span>').join(' ')).join('<br>');
    $$('span', line).forEach((s, i) => s.style.setProperty('--w', i));
    let done = false, t0 = performance.now();
    const DUR = 2100;
    function finish() {
      if (done) return; done = true;
      el.classList.add('is-leaving');
      root.classList.remove('loading');
      setTimeout(() => { el.classList.remove('is-leaving'); el.style.display = 'none'; }, 1000);
      ['pointerdown', 'keydown'].forEach(e => removeEventListener(e, finish));
    }
    function tick(now) {
      if (done) return;
      const p = clamp((now - t0) / DUR, 0, 1), v = easeInOut(p) * 100;
      // each column rolls continuously; hundreds only turns at the very end
      const d = [v / 100, (v / 10) % 10, v % 10];
      d[0] = v >= 99 ? (v - 99) : 0; if (v >= 100) { d[0] = 1; d[1] = 0; d[2] = 0; }
      else { d[1] = Math.floor(d[1]) + (d[2] > 9 ? d[2] - 9 : 0); }
      cols.forEach((b, i) => { b.style.transform = 'translateY(' + (-d[i]) + 'em)'; });
      cols[0].parentNode.style.display = v < 99 ? 'none' : '';
      cols[1].parentNode.style.display = v < 10 ? 'none' : '';
      if (p < 1) return requestAnimationFrame(tick);
      setTimeout(() => { count.classList.add('is-out'); line.classList.add('is-in'); }, 260);
      setTimeout(finish, 2300);
    }
    requestAnimationFrame(tick);
    addEventListener('pointerdown', finish); addEventListener('keydown', finish);
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

  loader(); bokeh(); sparks(); pointerFx(); reveals(); fly(); hang(); sheet(); contact();
})();
