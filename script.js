(() => {
  const stage = document.getElementById('stage');
  const intro = document.getElementById('intro');
  const laptop = document.getElementById('laptop');
  const lid = document.getElementById('lid');
  const glowFloor = document.getElementById('glowFloor');
  const page = document.getElementById('page');
  const progressBar = document.getElementById('progress');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);
  const seg = (p, a, b) => ease(clamp((p - a) / (b - a), 0, 1));

  const m = {};      // размеры
  let target = 0;    // целевой прогресс
  let current = 0;   // сглаженный прогресс
  let raf = 0;

  function measure() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const narrow = vw < 800;
    const ratio = narrow ? 0.62 : 1.6;        // соотношение сторон экрана
    const W = narrow ? vw * 0.8 : Math.min(vw * 0.6, vh * 0.78 * 1.6, 980);
    const H = W / ratio;
    const b = Math.max(6, W * (narrow ? 0.022 : 0.012));
    const D = H * 0.98;
    const gW = W - 2 * b;
    const gH = H - 2 * b;
    const Vw = narrow ? 520 : 1280;
    const k = gW / Vw;
    // масштаб, при котором экран заполняет окно
    const full = vw / gW;

    Object.assign(m, { vw, vh, narrow, W, H, b, D, gW, gH, Vw, k, full });

    const s = laptop.style;
    s.setProperty('--W', W + 'px');
    s.setProperty('--H', H + 'px');
    s.setProperty('--D', D + 'px');
    s.setProperty('--b', b + 'px');
    page.style.setProperty('--Vw', Vw + 'px');
    page.classList.toggle('narrow', narrow);

    m.contentH = page.offsetHeight * k;
    m.maxScroll = Math.max(0, m.contentH - gH);
  }

  function render(p) {
    const { W, H, D, k, full, narrow } = m;

    // Фазы
    const open = seg(p, 0.02, 0.2);        // крышка открывается
    const zoomIn = seg(p, 0.2, 0.34);      // камера въезжает в экран
    const scroll = clamp((p - 0.34) / (0.76 - 0.34), 0, 1);
    const zoomOut = seg(p, 0.76, 0.87);    // камера выезжает
    const closeT = seg(p, 0.87, 0.98);     // крышка плавно закрывается

    const zoom = zoomIn * (1 - zoomOut);

    // Угол крышки: 84° (чуть приоткрыта) -> -6° (откинута) -> 0° при зуме -> снова 84° при закрытии
    const openAngle = lerp(84, -6, open);
    const closedAngle = lerp(openAngle, 84, closeT);
    const angle = lerp(closedAngle, 0, zoom);
    const tiltBase = lerp(16, 13, open);
    const tilt = lerp(lerp(tiltBase, 16, closeT), 0, zoom);

    // Крышка (шарнир сзади; пока закрыта — чуть приподнята над основанием)
    const lift = Math.max(1 - open, closeT) * 2;
    lid.style.transform = `translate3d(0, ${-lift}px, ${-D}px) rotateX(${-angle}deg)`;

    // Камера
    const s = lerp(1, full, zoom);
    const shiftK = narrow ? 0.1 : 0.2;
    const baseShift = (1 - zoom) * H * shiftK * Math.max(1 - 0.5 * open, closeT);
    laptop.style.transform =
      `translate3d(0, ${baseShift}px, 0) scale(${s}) rotateX(${tilt}deg) translateZ(${D}px)`;

    // Свечение из щели у почти закрытого ноутбука (в начале и при закрытии)
    const ajar = Math.max(1 - open * 1.4, 0);
    const closing = closeT * closeT;
    glowFloor.style.opacity = String(Math.min(1, ajar * 0.9 + open * (1 - zoom) * 0.25 * (1 - closeT)) * (1 - closing * 0.9));

    // Подпись на старте
    intro.style.opacity = String(1 - seg(p, 0.05, 0.2));
    intro.style.transform = `translateY(${-seg(p, 0, 0.2) * 30}px)`;

    // Прокрутка контента внутри экрана
    page.style.transform = `translateY(${-scroll * m.maxScroll}px) scale(${k})`;
  }

  function readProgress() {
    const rect = stage.getBoundingClientRect();
    const total = stage.offsetHeight - window.innerHeight;
    target = clamp(-rect.top / total, 0, 1);

    const doc = document.documentElement;
    const full = doc.scrollHeight - window.innerHeight;
    progressBar.style.width = (full > 0 ? (window.scrollY / full) * 100 : 0) + '%';
  }

  function loop() {
    current = lerp(current, target, 0.14);
    if (Math.abs(current - target) < 0.0004) current = target;
    render(current);
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener('scroll', readProgress, { passive: true });
  window.addEventListener('resize', () => { measure(); readProgress(); });

  // пересчёт высоты контента после загрузки шрифтов и картинок
  window.addEventListener('load', () => { measure(); readProgress(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); });

  measure();
  readProgress();
  current = target;
  loop();
})();
