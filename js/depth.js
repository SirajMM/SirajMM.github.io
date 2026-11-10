/* 3D layer: globe, device body, screenshot depth, footer terrain.
   No library. Everything here is decorative and switches off cleanly. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const css = (n, f) => (getComputedStyle(root).getPropertyValue(n) || '').trim() || f;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const LAND = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4P+AAAAAAAAAAAAAAAD9P//ABYAAAYAAAAAAABa8f/+AAAACACwAAAAAAcrMB/+AAAAgH/dBAAAYABy/g/wAAAADf///+Ax////64/gAB/z/f/////I////6weBgDv///////+B///+DAMAAPf//////9cAIP/+DoAACLf/////+BgAgH//j8AACGf/////4DAAAB//7+AAFv///////CAAAAf//wAAB////////AAAAAf//wAAB/9f////8AAAAAf//gAAF38f////5AAAAAf/+AAAHB7////9gAAAAAf/+AAAHCX////8iAAAAAP/8AAAD4A////8MAAAAAH/4AAAH+Z////8QAAAAAB8IAAAP//9///+AAAAAAA8AAAAf//+P//8AAAAAAAYEAAAf//fx//wAAAAAAAcggAAf//Pg8egAAAAAAAHgAAAf//vA4fCAAAAAAAAwAAA///8AYHAAAAAAAAARwAAf//+AYBAAAAAAAAAD8AAP//+AAABAAAAAAAAD/gAEP/8AAIMAAAAAAAAD/gAAH/4AAG4AAAAAAAAH/4AAH/wAACaoAAAAAAAH/+AAD/gAACCHAAAAAAAH//AAD/gAAAwDgAAAAAAD//AAB/wAAAAAAAIAAAAB/+AAD/yAAAAZAAAAAAAA/+AAD/mAAAB/AAAAAAAAf+AAD/EAAAD/gAAAAAAAf8AAB/MAAAP/wAAAAAAA/wAAB+AAAAP/4AAAAAAA/wAAB+AAAAP/4AAAAAAA/gAAA8AAAAH/4AAAAAAA/AAAAgAAAAEDwAAAAAAB+AAAAAAAAAABwCAAAAAB4AAAAAAAAAAAACAAAAAAwAAAAAAAAAAAAEAAAAABwAAAAAAAAAAAAIAAAAABgAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAHwD///AAAAAAAA8AAADD/+/////AAAAAH04AA//////////wAD///9gAP//////////ABj///+gcP//////////AAH////53///////////g////////////////////////////////////////';

  // Run a draw loop only while its element is on screen and the tab is visible.
  function whileVisible(el, frame, still) {
    let on = false, raf = 0, last = 0;
    const tick = (t) => { raf = 0; if (!on) return; frame(t, Math.min(50, t - (last || t))); last = t; raf = requestAnimationFrame(tick); };
    const set = (v) => { on = v && !document.hidden; if (on && !raf && !reduce.matches) { last = 0; raf = requestAnimationFrame(tick); } };
    if (reduce.matches) { still(); return; }
    let seen = false;
    new IntersectionObserver((es) => { seen = es[0].isIntersecting; set(seen); }, { rootMargin: '120px' }).observe(el);
    document.addEventListener('visibilitychange', () => set(seen));
  }
  function fit(cv) {
    const d = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    return { d, w, h };
  }

  /* ---------- Globe ---------- */
  (function globe() {
    const cv = $('#globe'); if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
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
    const paper = '236,230,214', foilHex = css('--foil', '#D9B45B');
    const fr = parseInt(foilHex.slice(1, 3), 16), fg = parseInt(foilHex.slice(3, 5), 16), fb = parseInt(foilHex.slice(5, 7), 16), foil = `${fr},${fg},${fb}`;

    function draw(time) {
      const { d, w, h } = fit(cv); if (!w) return;
      ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.4;
      const cr = Math.cos(rot), sr = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
      const tf = (x, y, z) => { const x1 = x * cr + z * sr, z1 = -x * sr + z * cr; return [x1, y * ct - z1 * st, y * st + z1 * ct]; };
      // body
      const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
      g.addColorStop(0, 'rgba(40,92,96,.55)'); g.addColorStop(1, 'rgba(10,28,30,.2)');
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
    if (reduce.matches) window.addEventListener('resize', () => draw(0));

    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, rot, tilt, lx: e.clientX, lt: e.timeStamp }; vel = 0; try { cv.setPointerCapture(e.pointerId); } catch (_) {} cv.classList.add('is-grabbing'); });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      rot = drag.rot + (e.clientX - drag.x) * 0.006; tilt = clamp(drag.tilt + (e.clientY - drag.y) * 0.004, -0.9, 0.9);
      const dt = Math.max(1, e.timeStamp - drag.lt); vel = clamp((e.clientX - drag.lx) * 0.006 / dt, -0.004, 0.004); drag.lx = e.clientX; drag.lt = e.timeStamp;
      if (reduce.matches) draw(0);
    });
    const up = () => { drag = null; cv.classList.remove('is-grabbing'); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    root.classList.add('has-globe');
  })();

  /* ---------- Device body: stacked plates give the hero phone a real edge ---------- */
  (function body3d() {
    const device = $('#device'); if (!device || reduce.matches) return;
    if (!CSS.supports('transform-style', 'preserve-3d')) return;
    for (let i = 1; i <= 9; i++) { const e = document.createElement('i'); e.className = 'device-edge'; e.style.setProperty('--z', i); e.setAttribute('aria-hidden', 'true'); device.prepend(e); }
    device.classList.add('is-3d');
  })();

  /* ---------- Screenshots swing in through depth as they scroll into view ---------- */
  (function depthIn() {
    const els = $$('.fan, .duo'); if (!els.length || reduce.matches) return;
    els.forEach((el) => el.classList.add('is-depth'));
    let q = false;
    const run = () => {
      q = false; const vh = window.innerHeight;
      els.forEach((el) => {
        const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
        const p = clamp((vh - r.top) / (vh * 0.85)), e = 1 - Math.pow(1 - p, 3);
        el.style.setProperty('--fd', e.toFixed(3));
      });
    };
    const ask = () => { if (!q) { q = true; requestAnimationFrame(run); } };
    window.addEventListener('scroll', ask, { passive: true }); window.addEventListener('resize', ask); run();
  })();

  /* ---------- Footer terrain: ridgelines in perspective, nearer rows hide farther ones ---------- */
  (function terrain() {
    const cv = $('#terrain'); if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const ROWS = 30, COLS = 90, bg = css('--ink-deep', '#0A1C1E');
    let mx = 0.5;
    const n = (x, y, t) => Math.sin(x * 1.7 + t) * 0.5 + Math.sin(x * 3.1 - y * 1.3 + t * 0.7) * 0.3 + Math.sin(y * 2.2 + x * 0.6 - t * 1.1) * 0.35 + Math.sin(x * 6.3 + y * 4.1 + t * 1.6) * 0.08;
    function draw(time) {
      const { d, w, h } = fit(cv); if (!w) return;
      ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
      const t = time / 2600, hz = h * 0.2;
      for (let r = 0; r < ROWS; r++) {
        const k = r / (ROWS - 1), y0 = hz + (h - hz) * Math.pow(k, 1.9), sc = 0.42 + k * 1.1, amp = h * (0.04 + k * 0.17);
        ctx.beginPath();
        for (let c = 0; c <= COLS; c++) {
          const u = c / COLS, x = w / 2 + (u - 0.5) * w * 1.7 * sc;
          const bump = Math.exp(-Math.pow((u - mx) * 4.2, 2)) * 0.55;
          const y = y0 - (n(u * 7 * sc, k * 6 - t * 0.9, t) * 0.5 + 0.5 + bump) * amp;
          c ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = `rgba(236,230,214,${(0.05 + k * 0.3).toFixed(3)})`; ctx.lineWidth = 0.6 + k * 0.7; ctx.stroke();
        ctx.lineTo(w * 2, h + 2); ctx.lineTo(-w, h + 2); ctx.closePath(); ctx.fillStyle = bg; ctx.fill();
      }
    }
    whileVisible(cv, (t) => draw(t), () => draw(0));
    if (fine.matches) window.addEventListener('pointermove', (e) => { mx += (e.clientX / window.innerWidth - mx) * 0.08; }, { passive: true });
    root.classList.add('has-terrain');
  })();
})();
