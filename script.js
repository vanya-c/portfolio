(() => {
  const stage = document.getElementById('stage');
  const intro = document.getElementById('intro');
  const camera = document.getElementById('camera');
  const laptop = document.getElementById('laptop');
  const lid = document.getElementById('lid');
  const glowFloor = document.getElementById('glowFloor');
  const page = document.getElementById('page');
  const progressBar = document.getElementById('progress');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);
  const seg = (p, a, b) => ease(clamp((p - a) / (b - a), 0, 1));

  const m = {};
  let target = 0;
  let current = 0;

  function measure() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const narrow = vw < 800;
    const ratio = 1.6; // Всегда настоящие пропорции MacBook 16:10 (и на телефоне, и на ПК)
    const bRatio = narrow ? 0.022 : 0.012;

    // Видимый размер ноутбука в отдалённом состоянии (с аккуратными полями по бокам)
    const Wsmall = narrow ? vw * 0.88 : Math.min(vw * 0.52, vh * 0.68 * 1.6, 820);
    const Hsmall = Wsmall / ratio;

    // Полный нативный размер ноутбука, при котором стекло = 100% ширины окна (scale = 1, 0 апскейла)
    const gW = vw;
    const W = gW / (1 - 2 * bRatio);
    const b = (W - gW) / 2;
    const Hmac = W / ratio;
    const Hfull = Math.max(Hmac, vh + 2 * b);
    const gHfull = Hfull - 2 * b;
    const D = Hmac;
    const minScale = Wsmall / W;
    // Объёмная толщина корпуса и крышки MacBook
    const Tb = Math.max(narrow ? 18 : 22, Hmac * 0.038);
    const Tl = Math.max(narrow ? 8 : 10, Hmac * 0.017);

    Object.assign(m, { vw, vh, narrow, W, b, D, Hmac, Hfull, Hsmall, minScale });

    const s = laptop.style;
    s.setProperty('--W', W + 'px');
    s.setProperty('--H', Hmac + 'px');
    s.setProperty('--D', D + 'px');
    s.setProperty('--b', b + 'px');
    s.setProperty('--Tb', Tb + 'px');
    s.setProperty('--Tl', Tl + 'px');
    page.classList.toggle('narrow', narrow);

    m.contentH = page.offsetHeight;
    // Видимая высота экрана в полном зуме равна min(gHfull, vh)
    const visibleH = Math.min(gHfull, vh);
    m.topOffset = Math.max(0, (gHfull - vh) / 2);
    m.maxScroll = Math.max(0, m.contentH - visibleH);
  }

  function render(p) {
    const { D, Hmac, Hfull, Hsmall, minScale, narrow, topOffset, maxScroll } = m;

    // Симметричные и плавные фазы
    const open = seg(p, 0.02, 0.18);        // крышка открывается
    const zoomIn = seg(p, 0.18, 0.30);      // камера въезжает в экран
    const scroll = clamp((p - 0.30) / (0.72 - 0.30), 0, 1);
    const zoomOut = seg(p, 0.72, 0.84);     // камера плавно выезжает
    const closeT = seg(p, 0.84, 0.97);      // крышка плавно закрывается

    const zoom = zoomIn * (1 - zoomOut);
    const isFlat = zoom > 0.999;

    // На телефоне экран плавно раскрывается по высоте от 16:10 MacBook до высоты экрана при зуме
    const curH = lerp(Hmac, Hfull, zoom);
    laptop.style.setProperty('--H', curH + 'px');

    camera.classList.toggle('is-flat', isFlat);
    laptop.classList.toggle('is-flat', isFlat);

    if (isFlat) {
      // Полный зум: чистый 2D без 3D-матриц и апскейла -> идеальная резкость и кликабельные ссылки
      laptop.style.transform = 'none';
      lid.style.transform = 'none';
      glowFloor.style.opacity = '0';
    } else {
      // Угол крышки: 90° (полностью закрыт) -> -6° (открыт) -> 0° (в зуме) -> снова -6° -> 90° (полностью закрыт)
      const openAngle = lerp(90, -6, open);
      const closedAngle = lerp(openAngle, 90, closeT);
      const angle = lerp(closedAngle, 0, zoom);

      // Ракурс сверху вниз (отрицательный rotateX), чтобы чётко были видны крышка, клавиатура, тачпад и 3D-толщина
      const tiltOpen = lerp(-24, -18, open);
      const tilt = lerp(lerp(tiltOpen, -24, closeT), 0, zoom);

      // Минимальный зазор 1px при закрытии только против z-fighting
      const liftFactor = lerp(lerp(1, 0, open), 1, closeT);
      const lift = (liftFactor * 1) / minScale;
      lid.style.transform = `translate3d(0, ${-lift}px, ${-D}px) rotateX(${-angle}deg)`;

      // Камера: уменьшение от 1 к minScale (никогда не увеличивает растр выше 1:1)
      const s = lerp(minScale, 1, zoom);
      const shiftK = narrow ? 0.08 : 0.06;
      const shiftFactor = lerp(lerp(0.6, 0.25, open), 0.6, closeT);
      const baseShift = (1 - zoom) * Hsmall * shiftK * shiftFactor;
      const zPush = lerp(D * 0.35, D, zoom);

      laptop.style.transform =
        `translate3d(0, ${baseShift}px, 0) scale(${s}) rotateX(${tilt}deg) translateZ(${zPush}px)`;

      // Мягкое свечение экрана на клавиатуру только когда ноутбук открыт
      const screenLit = open * (1 - zoom) * (1 - closeT);
      glowFloor.style.opacity = String(screenLit * 0.28);
    }

    // Заголовок на старте
    intro.style.opacity = String(1 - seg(p, 0.04, 0.18));
    intro.style.transform = `translateY(${-seg(p, 0, 0.18) * 30}px)`;

    // Плавная прокрутка контента внутри экрана
    const y = topOffset - scroll * maxScroll;
    page.style.transform = `translate3d(0, ${y}px, 0)`;
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
    current = lerp(current, target, 0.12);
    if (Math.abs(current - target) < 0.0003) current = target;
    render(current);
    requestAnimationFrame(loop);
  }

  window.addEventListener('scroll', readProgress, { passive: true });
  window.addEventListener('resize', () => { measure(); readProgress(); });
  window.addEventListener('load', () => { measure(); readProgress(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { measure(); });
  }

  measure();
  readProgress();
  current = target;
  loop();
})();
