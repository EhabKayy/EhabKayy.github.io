(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = innerWidth, H = innerHeight;
  var mouse = { x: W * 0.7, y: H * 0.2, tx: W * 0.7, ty: H * 0.2, active: false };

  function setVars() {
    root.style.setProperty('--mx', mouse.x + 'px');
    root.style.setProperty('--my', mouse.y + 'px');
    root.style.setProperty('--px', ((mouse.x / W) - 0.5) * -60 + 'px');
    root.style.setProperty('--py', ((mouse.y / H) - 0.5) * -40 + 'px');
  }
  addEventListener('pointermove', function (e) { mouse.tx = e.clientX; mouse.ty = e.clientY; mouse.active = true; }, { passive: true });
  addEventListener('pointerleave', function () { mouse.active = false; });
  document.addEventListener('mouseleave', function () { mouse.active = false; });

  var cv = document.getElementById('embers');
  var ctx = cv.getContext('2d');
  var dpr = Math.min(devicePixelRatio || 1, 2);
  var parts = [], rings = [];
  var COLORS = ['233,183,47', '255,241,184', '194,22,63'];

  function resize() {
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(110, (W * H) / 14000));
    while (parts.length < n) parts.push(spawn(true));
    parts.length = n;
  }
  function spawn(anywhere, x, y, burst) {
    var a = Math.random() * Math.PI * 2, sp = burst ? 2 + Math.random() * 5 : 0;
    return {
      x: x != null ? x : Math.random() * W,
      y: y != null ? y : (anywhere ? Math.random() * H : H + 10),
      vx: burst ? Math.cos(a) * sp : (Math.random() - 0.5) * 0.3,
      vy: burst ? Math.sin(a) * sp : -(0.15 + Math.random() * 0.55),
      r: 0.6 + Math.random() * 1.8,
      c: COLORS[Math.random() < 0.18 ? 2 : Math.random() < 0.3 ? 1 : 0],
      life: burst ? 1 : 0, glow: 0, tw: Math.random() * 6.28
    };
  }

  addEventListener('pointerdown', function (e) {
    if (reduce) return;
    if (!enabled || e.target.closest('a, button')) return;
    rings.push({ x: e.clientX, y: e.clientY, r: 0, a: 1 });
    for (var i = 0; i < 26; i++) { var p = spawn(false, e.clientX, e.clientY, true); parts.push(p); }
  });

  var running = false, enabled = false;
  document.addEventListener('visibilitychange', function () { var was = running; running = enabled && !document.hidden; if (running && !was) requestAnimationFrame(tick); });

  function tick() {
    if (!running || !enabled) return;
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    setVars();

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    var R = 150;
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (mouse.active && d < R) {
        var f = (1 - d / R);
        p.vx += (dx / d) * f * 0.6 + (-dy / d) * f * 0.25;  /* push away + swirl */
        p.vy += (dy / d) * f * 0.6 + (dx / d) * f * 0.25;
        p.glow = Math.min(1, p.glow + f * 0.25);
        if (d < R * 0.8) {
          ctx.strokeStyle = 'rgba(' + p.c + ',' + (f * 0.35) + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      p.glow *= 0.96;
      p.vx *= 0.95; p.vy = p.vy * 0.95 + (p.life ? 0.02 : -0.012);
      p.x += p.vx; p.y += p.vy; p.tw += 0.05;
      if (p.life) { p.life -= 0.012; if (p.life <= 0) { parts.splice(i, 1); continue; } }
      else if (p.y < -10 || p.x < -20 || p.x > W + 20) { parts[i] = spawn(false); continue; }

      var alpha = (p.life || 0.45 + Math.sin(p.tw) * 0.25) + p.glow * 0.5;
      var rad = p.r * (1 + p.glow * 1.6);
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 4);
      g.addColorStop(0, 'rgba(' + p.c + ',' + Math.min(1, alpha) + ')');
      g.addColorStop(1, 'rgba(' + p.c + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, rad * 4, 0, 6.283); ctx.fill();
    }
    for (var j = rings.length - 1; j >= 0; j--) {
      var r = rings[j]; r.r += 9; r.a *= 0.93;
      ctx.strokeStyle = 'rgba(233,183,47,' + r.a + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = 'rgba(194,22,63,' + r.a * 0.7 + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r * 0.7, 0, 6.283); ctx.stroke();
      if (r.a < 0.02) rings.splice(j, 1);
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(tick);
  }

  addEventListener('resize', resize);
  resize();
  if (reduce) {
    addEventListener('pointermove', function (e) { if (!enabled) return; mouse.x = e.clientX; mouse.y = e.clientY; setVars(); }, { passive: true });
  }

  /* skin toggle: formal by default */
  var goldSheet = document.getElementById('gold-css');
  var btn = document.getElementById('skin');
  var label = document.getElementById('skin-label');
  function setSkin(on) {
    enabled = on;
    goldSheet.media = on ? 'all' : 'not all';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    label.textContent = on ? 'Formal mode' : 'Gold mode';
    if (on) {
      resize(); setVars();
      if (!reduce && !running) { running = !document.hidden; if (running) requestAnimationFrame(tick); }
      if (!reduce) {
        var b = btn.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        rings.push({ x: cx, y: cy, r: 0, a: 1 });
        for (var i = 0; i < 40; i++) parts.push(spawn(false, cx, cy, true));
      }
    } else {
      running = false; ctx.clearRect(0, 0, W, H);
    }
  }
  function remember(on) { try { sessionStorage.setItem('skin', on ? 'gold' : 'formal'); } catch (e) {} }
  function recall() { try { return sessionStorage.getItem('skin') === 'gold'; } catch (e) { return false; } }
  btn.addEventListener('click', function () { setSkin(!enabled); remember(enabled); });
  setSkin(recall());
})();
