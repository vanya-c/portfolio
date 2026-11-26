/**
 * 3D-фоновая сцена клуба AETHER CYBER LOUNGE
 * 4 узнаваемых 3D-артефакта игр с мягким неоновым свечением:
 *   1. CS:GO     — 3D-нож Керамбит (Karambit) с неоновой кромкой + голограмма C4
 *   2. Minecraft — 3D Кристалл Края (End Crystal) с вращающимися кубами и алмазами
 *   3. Dota 2    — 3D Аегис бессмертия (Aegis of the Immortal) с рубиновым ядром
 *   4. GTA VI    — Закатный неон Vice City со спорткаром, ретро-солнцем и пальмой
 */
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const SCENE_ORDER = ['cs', 'mc', 'dota', 'gta'];

  let targetIndex = 0;
  let smoothIndex = 0;
  let manualOverrideUntil = 0;
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('pointermove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function setActiveTheme(sceneKey) {
    if (document.body.dataset.scene !== sceneKey) {
      document.body.dataset.scene = sceneKey;
    }
  }

  function computeScrollScene() {
    if (Date.now() < manualOverrideUntil) return;
    const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / docHeight));
    targetIndex = ratio * (SCENE_ORDER.length - 1);
    setActiveTheme(SCENE_ORDER[Math.round(targetIndex)]);
  }

  window.addEventListener('scroll', computeScrollScene, { passive: true });

  window.setClub3DScene = function (sceneKey, lockMs = 5000) {
    const idx = SCENE_ORDER.indexOf(sceneKey);
    if (idx === -1) return;
    manualOverrideUntil = Date.now() + lockMs;
    targetIndex = idx;
    setActiveTheme(sceneKey);
  };

  // =========================================================================
  // Аппаратный 3D-рендер на Three.js
  // =========================================================================
  function initThreeJS() {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);

    function updateCameraFrame() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.position.set(w > 900 ? -1.4 : 0, 0.25, w > 900 ? 8.6 : 10.2);
      camera.lookAt(w > 900 ? 0.65 : 0, 0, 0);
      camera.updateProjectionMatrix();
    }
    updateCameraFrame();
    window.addEventListener('resize', updateCameraFrame);

    // Мягкое студийно-неоновое освещение
    scene.add(new THREE.HemisphereLight(0xdce6ff, 0x161422, 1.1));

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xe7a64b, 3.2, 20);
    rimLight.position.set(-2.5, 2.2, 2.5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x5da9ff, 2.0, 18);
    fillLight.position.set(4.5, -1.5, 3.0);
    scene.add(fillLight);

    // Хелпер для отслеживания материалов при плавном fade-in/out
    function trackMaterial(list, mat, baseOpacity = 1) {
      mat.transparent = true;
      mat.userData.baseOpacity = baseOpacity;
      list.push(mat);
      return mat;
    }

    // -----------------------------------------------------------------------
    // 1. CS:GO — 3D-нож КЕРАМБИТ (Karambit) + тактические HUD-кольца
    // -----------------------------------------------------------------------
    function buildCSArtifact() {
      const root = new THREE.Group();
      const spin = new THREE.Group();
      const mats = [];

      // Изогнутый клинок-коготь Керамбита
      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(0.05, 0.15);
      bladeShape.bezierCurveTo(0.85, 0.55, 1.68, 0.18, 1.98, -0.78);
      bladeShape.bezierCurveTo(1.52, -0.25, 0.92, -0.14, 0.08, -0.26);
      bladeShape.closePath();

      const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
        depth: 0.08,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.03,
        bevelSegments: 3,
        curveSegments: 24
      });
      bladeGeom.center();

      const bladeMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0xd9a03b,
        emissive: 0x5c3608,
        emissiveIntensity: 0.45,
        metalness: 0.92,
        roughness: 0.18
      }), 0.96);

      const bladeMesh = new THREE.Mesh(bladeGeom, bladeMat);
      bladeMesh.position.set(0.75, 0.12, 0);
      spin.add(bladeMesh);

      // Неоновая острая кромка клинка
      const edgeMat = trackMaterial(mats, new THREE.LineBasicMaterial({
        color: 0xffc45c
      }), 0.85);
      const bladeEdges = new THREE.LineSegments(new THREE.EdgesGeometry(bladeGeom, 22), edgeMat);
      bladeEdges.position.copy(bladeMesh.position);
      spin.add(bladeEdges);

      // Анатомическая изогнутая рукоять
      const handleShape = new THREE.Shape();
      handleShape.moveTo(0.18, 0.22);
      handleShape.bezierCurveTo(-0.42, 0.24, -0.98, -0.15, -1.28, -0.68);
      handleShape.lineTo(-0.96, -0.88);
      handleShape.bezierCurveTo(-0.68, -0.45, -0.26, -0.18, 0.14, -0.2);
      handleShape.closePath();

      const handleGeom = new THREE.ExtrudeGeometry(handleShape, {
        depth: 0.16,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.03,
        bevelSegments: 2,
        curveSegments: 20
      });
      handleGeom.center();

      const handleMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0x1d212b,
        metalness: 0.45,
        roughness: 0.55
      }), 0.96);

      const handleMesh = new THREE.Mesh(handleGeom, handleMat);
      handleMesh.position.set(-0.62, -0.12, 0);
      spin.add(handleMesh);

      // Фирменное кольцо Керамбита на конце рукояти
      const fingerRingMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0xe8ab48,
        emissive: 0x70440c,
        emissiveIntensity: 0.5,
        metalness: 0.88,
        roughness: 0.22
      }), 0.96);
      const fingerRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.068, 16, 36), fingerRingMat);
      fingerRing.position.set(-1.38, -0.76, 0);
      spin.add(fingerRing);

      // Декоративные винты на рукояти
      [-0.25, -0.65, -1.0].forEach((xPos, i) => {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.26, 12), fingerRingMat);
        pin.rotation.x = Math.PI / 2;
        pin.position.set(xPos, 0.04 - i * 0.2, 0);
        spin.add(pin);
      });

      // Наклон ножа для эффектного ракурса
      spin.rotation.z = 0.28;
      root.add(spin);

      // Голографические тактические кольца вокруг ножа
      const hudGroup = new THREE.Group();
      const ring1Mat = trackMaterial(mats, new THREE.MeshBasicMaterial({
        color: 0xf0b24d,
        side: THREE.DoubleSide
      }), 0.34);
      const ring1 = new THREE.Mesh(new THREE.RingGeometry(2.05, 2.09, 64), ring1Mat);
      hudGroup.add(ring1);

      const ring2Mat = trackMaterial(mats, new THREE.MeshBasicMaterial({
        color: 0x6ba2e0,
        side: THREE.DoubleSide
      }), 0.26);
      const ring2 = new THREE.Mesh(new THREE.RingGeometry(2.36, 2.385, 64, 1, 0, Math.PI * 1.45), ring2Mat);
      hudGroup.add(ring2);

      // Мини-голограмма таймера C4 на орбите
      const c4Group = new THREE.Group();
      const c4Mat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0x353c48,
        emissive: 0x1c222b,
        metalness: 0.5,
        roughness: 0.4
      }), 0.88);
      const c4Body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.16), c4Mat);
      c4Group.add(c4Body);
      const c4LedMat = trackMaterial(mats, new THREE.MeshBasicMaterial({ color: 0xff3b30 }), 0.95);
      const c4Led = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), c4LedMat);
      c4Led.position.set(0.11, 0.05, 0.09);
      c4Group.add(c4Led);
      c4Group.position.set(-1.65, 1.35, 0.35);
      hudGroup.add(c4Group);

      root.add(hudGroup);

      return {
        key: 'cs',
        accent: 0xe7a64b,
        rim: 0x5d8fc7,
        root,
        mats,
        update(t) {
          spin.rotation.y = t * 0.55 + mouseX * 0.45;
          spin.rotation.x = Math.sin(t * 0.9) * 0.14 + mouseY * 0.2;
          hudGroup.rotation.z = -t * 0.18;
          hudGroup.rotation.y = Math.sin(t * 0.4) * 0.22;
          c4Group.rotation.y = t * 0.9;
          c4LedMat.color.setHex(Math.sin(t * 7) > 0 ? 0xff453a : 0x591210);
        }
      };
    }

    // -----------------------------------------------------------------------
    // 2. MINECRAFT — КРИСТАЛЛ КРАЯ (End Crystal) + парящие алмазные кубы
    // -----------------------------------------------------------------------
    function buildMinecraftArtifact() {
      const root = new THREE.Group();
      const mats = [];

      // Основание из тёмного бедрока и обсидиана
      const baseMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0x262235,
        roughness: 0.72,
        metalness: 0.25
      }), 0.96);
      const baseBlock = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.34, 1.75), baseMat);
      baseBlock.position.y = -1.78;
      root.add(baseBlock);

      const baseTrimMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0x52d67c,
        emissive: 0x268a46,
        emissiveIntensity: 0.85,
        roughness: 0.3
      }), 0.92);
      const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.12, 1.32), baseTrimMat);
      baseTrim.position.y = -1.56;
      root.add(baseTrim);

      // Парящее ядро Кристалла Края (октаэдр с неоновым свечением)
      const crystalGroup = new THREE.Group();
      crystalGroup.position.y = 0.15;

      const coreMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0xf46cff,
        emissive: 0xb632e0,
        emissiveIntensity: 1.15,
        roughness: 0.15,
        metalness: 0.35
      }), 0.96);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.66, 0), coreMat);
      crystalGroup.add(core);

      // Внутренний вращающийся стеклянный куб-рамка
      const glassMat1 = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0x70f5ff,
        emissive: 0x228999,
        emissiveIntensity: 0.35,
        roughness: 0.1,
        metalness: 0.2
      }), 0.22);
      const innerCubeGeom = new THREE.BoxGeometry(1.42, 1.42, 1.42);
      const innerCube = new THREE.Mesh(innerCubeGeom, glassMat1);
      const innerWireMat = trackMaterial(mats, new THREE.LineBasicMaterial({ color: 0x7df9ff }), 0.9);
      innerCube.add(new THREE.LineSegments(new THREE.EdgesGeometry(innerCubeGeom), innerWireMat));
      crystalGroup.add(innerCube);

      // Внешний вращающийся стеклянный куб-рамка
      const glassMat2 = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0x63c777,
        emissive: 0x1d7033,
        emissiveIntensity: 0.3,
        roughness: 0.1,
        metalness: 0.2
      }), 0.16);
      const outerCubeGeom = new THREE.BoxGeometry(1.96, 1.96, 1.96);
      const outerCube = new THREE.Mesh(outerCubeGeom, glassMat2);
      const outerWireMat = trackMaterial(mats, new THREE.LineBasicMaterial({ color: 0x7ff098 }), 0.82);
      outerCube.add(new THREE.LineSegments(new THREE.EdgesGeometry(outerCubeGeom), outerWireMat));
      crystalGroup.add(outerCube);

      root.add(crystalGroup);

      // 4 парящих алмазных и изумрудных мини-блока на орбите
      const satellites = [];
      const satColors = [
        [0x5ef2ff, 0x1a8f9e],
        [0x63e884, 0x1b7a34],
        [0x5ef2ff, 0x1a8f9e],
        [0xd86eff, 0x762199]
      ];
      satColors.forEach(([col, em], idx) => {
        const g = new THREE.BoxGeometry(0.36, 0.36, 0.36);
        const m = trackMaterial(mats, new THREE.MeshStandardMaterial({
          color: col,
          emissive: em,
          emissiveIntensity: 0.75,
          roughness: 0.25,
          metalness: 0.3
        }), 0.92);
        const mesh = new THREE.Mesh(g, m);
        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(g),
          trackMaterial(mats, new THREE.LineBasicMaterial({ color: 0xffffff }), 0.45)
        );
        mesh.add(edge);
        mesh.userData.phase = (idx * Math.PI) / 2;
        root.add(mesh);
        satellites.push(mesh);
      });

      return {
        key: 'mc',
        accent: 0x63c777,
        rim: 0x52e5f0,
        root,
        mats,
        update(t) {
          crystalGroup.position.y = 0.18 + Math.sin(t * 1.8) * 0.16;
          core.rotation.y = t * 1.2;
          core.rotation.x = t * 0.6;
          innerCube.rotation.x = t * 0.55 + mouseY * 0.3;
          innerCube.rotation.y = -t * 0.75 + mouseX * 0.35;
          outerCube.rotation.y = t * 0.42 + mouseX * 0.25;
          outerCube.rotation.z = t * 0.34;
          baseBlock.rotation.y = t * 0.2;
          baseTrim.rotation.y = t * 0.2;

          satellites.forEach((s) => {
            const ang = t * 0.65 + s.userData.phase;
            s.position.set(Math.cos(ang) * 2.15, 0.2 + Math.sin(t * 1.5 + s.userData.phase) * 0.55, Math.sin(ang) * 1.35);
            s.rotation.x = t * 0.8 + s.userData.phase;
            s.rotation.y = t * 1.1;
          });
        }
      };
    }

    // -----------------------------------------------------------------------
    // 3. DOTA 2 — АЕГИС БЕССМЕРТИЯ (Aegis of the Immortal) + парящие руны
    // -----------------------------------------------------------------------
    function buildDotaArtifact() {
      const root = new THREE.Group();
      const shield = new THREE.Group();
      const mats = [];

      const goldMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0xdcb25c,
        emissive: 0x573b0c,
        emissiveIntensity: 0.42,
        metalness: 0.88,
        roughness: 0.24
      }), 0.96);

      const bronzeMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0x3a2024,
        emissive: 0x1f0a0c,
        emissiveIntensity: 0.35,
        metalness: 0.65,
        roughness: 0.42
      }), 0.96);

      const rubyMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0xff5a45,
        emissive: 0xd4261a,
        emissiveIntensity: 1.2,
        metalness: 0.3,
        roughness: 0.14
      }), 0.98);

      // Основа круглого щита Аегиса
      const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.48, 0.2, 48), bronzeMat);
      disk.rotation.x = Math.PI / 2;
      shield.add(disk);

      // Внешний массивный золотой обод
      const outerRim = new THREE.Mesh(new THREE.TorusGeometry(1.58, 0.13, 18, 56), goldMat);
      shield.add(outerRim);

      // Внутреннее золотое кольцо
      const innerRim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 14, 42), goldMat);
      innerRim.position.z = 0.09;
      shield.add(innerRim);

      // 8 рельефных золотых лучей-гребней по периметру Аегиса
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, 0.12), goldMat);
        spoke.position.set(Math.cos(ang) * 1.24, Math.sin(ang) * 1.24, 0.08);
        spoke.rotation.z = ang - Math.PI / 2;
        shield.add(spoke);

        const stud = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), rubyMat);
        stud.position.set(Math.cos(ang) * 1.58, Math.sin(ang) * 1.58, 0.12);
        shield.add(stud);
      }

      // Центральный рубиновый камень бессмертия
      const centerGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), rubyMat);
      centerGem.scale.set(0.9, 1.22, 0.6);
      centerGem.position.z = 0.22;
      shield.add(centerGem);

      // Стилизованные золотые крылья по бокам щита
      [-1, 1].forEach((dir) => {
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0.35);
        wingShape.bezierCurveTo(dir * 0.6, 0.85, dir * 1.15, 0.55, dir * 1.28, 0.05);
        wingShape.bezierCurveTo(dir * 0.85, -0.1, dir * 0.45, -0.32, 0, -0.45);
        wingShape.closePath();

        const wingGeom = new THREE.ExtrudeGeometry(wingShape, {
          depth: 0.07,
          bevelEnabled: true,
          bevelThickness: 0.025,
          bevelSize: 0.02,
          bevelSegments: 2
        });
        const wing = new THREE.Mesh(wingGeom, goldMat);
        wing.position.set(dir * 1.45, 0.05, -0.05);
        shield.add(wing);
      });

      root.add(shield);

      // Парящие руны (Double Damage, Haste, Regeneration) вокруг Аегиса
      const runes = [];
      [0x4eb8ff, 0xff5a45, 0x52e07a].forEach((col, i) => {
        const rMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.95,
          roughness: 0.2
        }), 0.9);
        const rMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), rMat);
        rMesh.scale.set(0.85, 1.35, 0.85);
        rMesh.userData.phase = (i * Math.PI * 2) / 3;
        root.add(rMesh);
        runes.push(rMesh);
      });

      return {
        key: 'dota',
        accent: 0xe06b5f,
        rim: 0xdcb25c,
        root,
        mats,
        update(t) {
          shield.rotation.y = Math.sin(t * 0.65) * 0.45 + mouseX * 0.4;
          shield.rotation.x = Math.sin(t * 0.45) * 0.1 + mouseY * 0.18;
          centerGem.rotation.y = t * 1.1;

          runes.forEach((r) => {
            const ang = t * 0.85 + r.userData.phase;
            r.position.set(Math.cos(ang) * 2.15, Math.sin(ang * 1.2) * 0.95, Math.sin(ang) * 1.15);
            r.rotation.y = t * 1.4;
          });
        }
      };
    }

    // -----------------------------------------------------------------------
    // 4. GTA VI — ЗАКАТНЫЙ НЕОН VICE CITY: Ретро-солнце + 3D Спорткар + Пальма
    // -----------------------------------------------------------------------
    function buildGTAArtifact() {
      const root = new THREE.Group();
      const stage = new THREE.Group();
      const mats = [];

      // 1) Ретро-закатное полосатое солнце Vice City на заднем плане
      const sunGroup = new THREE.Group();
      sunGroup.position.set(0.25, 0.65, -1.25);
      const sunColors = [0xffcf5c, 0xffa04d, 0xff7072, 0xf75296, 0xd442b8];
      for (let i = 0; i < 5; i++) {
        const y = 0.85 - i * 0.42;
        const r = Math.max(0.55, 1.42 - Math.abs(y - 0.1) * 0.45);
        const barH = 0.34 - i * 0.032;
        const sMat = trackMaterial(mats, new THREE.MeshBasicMaterial({
          color: sunColors[i]
        }), 0.88);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(r * 2.1, barH, 0.06), sMat);
        bar.position.y = y;
        sunGroup.add(bar);
      }
      stage.add(sunGroup);

      // 2) Круглый неоновый подиум-сетка Ocean Drive
      const gridRingMat = trackMaterial(mats, new THREE.MeshBasicMaterial({
        color: 0xf471a8,
        side: THREE.DoubleSide
      }), 0.48);
      const gridRing = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.02, 64), gridRingMat);
      gridRing.rotation.x = Math.PI / 2;
      gridRing.position.y = -1.18;
      stage.add(gridRing);

      const gridBaseMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0x1b1529,
        roughness: 0.45,
        metalness: 0.6
      }), 0.82);
      const gridBase = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 2.02, 0.08, 48), gridBaseMat);
      gridBase.position.y = -1.23;
      stage.add(gridBase);

      // 3) Стилизованный 3D-спорткар Vice (клиновидный профиль суперкара)
      const car = new THREE.Group();
      car.position.set(0.25, -0.78, 0.32);
      car.rotation.y = -0.35;

      const bodyShape = new THREE.Shape();
      bodyShape.moveTo(-1.35, 0.05);
      bodyShape.lineTo(-1.28, 0.36);
      bodyShape.lineTo(-0.62, 0.46);
      bodyShape.lineTo(-0.18, 0.78);
      bodyShape.lineTo(0.56, 0.78);
      bodyShape.lineTo(1.12, 0.44);
      bodyShape.lineTo(1.38, 0.28);
      bodyShape.lineTo(1.36, 0.04);
      bodyShape.closePath();

      const carGeom = new THREE.ExtrudeGeometry(bodyShape, {
        depth: 1.04,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.06,
        bevelSegments: 3
      });
      carGeom.center();

      const carMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0x261d3a,
        emissive: 0x3b1336,
        emissiveIntensity: 0.45,
        metalness: 0.85,
        roughness: 0.18
      }), 0.96);
      const carMesh = new THREE.Mesh(carGeom, carMat);
      car.add(carMesh);

      // Неоновая обводка контура спорткара
      const carNeon = new THREE.LineSegments(
        new THREE.EdgesGeometry(carGeom, 24),
        trackMaterial(mats, new THREE.LineBasicMaterial({ color: 0xff6bb5 }), 0.72)
      );
      car.add(carNeon);

      // Передние бирюзовые фары и задний красный стоп-бар
      const headMat = trackMaterial(mats, new THREE.MeshBasicMaterial({ color: 0x52f2ff }), 0.98);
      const headL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.28), headMat);
      headL.position.set(1.38, -0.05, 0.34);
      const headR = headL.clone();
      headR.position.z = -0.34;
      car.add(headL, headR);

      const tailMat = trackMaterial(mats, new THREE.MeshBasicMaterial({ color: 0xff3b6b }), 0.98);
      const tailBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, 0.96), tailMat);
      tailBar.position.set(-1.38, 0.02, 0);
      car.add(tailBar);

      // Неоновая подсветка под днищем
      const underMat = trackMaterial(mats, new THREE.MeshBasicMaterial({ color: 0x45e3ff }), 0.55);
      const underglow = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.98), underMat);
      underglow.position.y = -0.36;
      car.add(underglow);

      // 4 колеса с неоновыми ободами
      const tireMat = trackMaterial(mats, new THREE.MeshStandardMaterial({ color: 0x121218, roughness: 0.7 }), 0.96);
      const rimNeonMat = trackMaterial(mats, new THREE.MeshBasicMaterial({ color: 0xff77b7 }), 0.9);
      [[-0.82, 0.55], [0.82, 0.55], [-0.82, -0.55], [0.82, -0.55]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.18, 20), tireMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wx, -0.25, wz);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 20), rimNeonMat);
        rim.position.set(wx, -0.25, wz + (wz > 0 ? 0.095 : -0.095));
        car.add(wheel, rim);
      });

      stage.add(car);

      // 4) Изогнутая 3D-неоновая пальма Vice City слева от авто
      const palm = new THREE.Group();
      palm.position.set(-1.25, -1.18, -0.28);

      const trunkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.18, 0.95, 0.05),
        new THREE.Vector3(-0.04, 1.95, 0.12),
        new THREE.Vector3(0.28, 2.72, 0.16)
      ]);
      const trunkMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
        color: 0x3b234a,
        emissive: 0x5c1a48,
        emissiveIntensity: 0.4,
        roughness: 0.5
      }), 0.96);
      const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 20, 0.11, 10, false), trunkMat);
      palm.add(trunk);

      const crownPos = new THREE.Vector3(0.28, 2.72, 0.16);
      const leafColors = [0x3be0b8, 0xff6bb5, 0xffa64d, 0x45e3ff, 0xff6bb5, 0x3be0b8];
      leafColors.forEach((col, i) => {
        const ang = (i / leafColors.length) * Math.PI * 2;
        const leafCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.cos(ang) * 0.65, 0.32, Math.sin(ang) * 0.65),
          new THREE.Vector3(Math.cos(ang) * 1.25, -0.12, Math.sin(ang) * 1.25)
        ]);
        const lMat = trackMaterial(mats, new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.55,
          roughness: 0.3
        }), 0.92);
        const leaf = new THREE.Mesh(new THREE.TubeGeometry(leafCurve, 12, 0.065, 6, false), lMat);
        leaf.position.copy(crownPos);
        palm.add(leaf);
      });

      stage.add(palm);
      root.add(stage);

      return {
        key: 'gta',
        accent: 0xf471a8,
        rim: 0xff9d52,
        root,
        mats,
        update(t) {
          stage.rotation.y = -0.18 + Math.sin(t * 0.5) * 0.24 + mouseX * 0.32;
          stage.rotation.x = mouseY * 0.1;
          car.position.y = -0.78 + Math.sin(t * 2.1) * 0.04;
        }
      };
    }

    const artifacts = [
      buildCSArtifact(),
      buildMinecraftArtifact(),
      buildDotaArtifact(),
      buildGTAArtifact()
    ];

    artifacts.forEach((a) => scene.add(a.root));

    // Мягкие парящие частицы-пылинки
    const pCount = 75;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 18;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.28 });
    const particles = new THREE.Points(pGeom, pMat);
    scene.add(particles);

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      smoothIndex += (targetIndex - smoothIndex) * 0.065;

      const isWide = window.innerWidth > 900;
      const anchorX = isWide ? 1.55 : 0;

      artifacts.forEach((art, idx) => {
        const dist = idx - smoothIndex;
        const absDist = Math.abs(dist);
        const vis = Math.max(0, 1 - absDist * 1.18);

        art.root.visible = vis > 0.01;
        if (!art.root.visible) return;

        art.root.position.x = anchorX + dist * 1.35 + mouseX * 0.18;
        art.root.position.y = -dist * 2.2 + Math.sin(t * 1.35 + idx) * 0.08 - mouseY * 0.12;
        art.root.position.z = -absDist * 2.8;

        const scale = (isWide ? 0.94 : 0.78) * (0.74 + vis * 0.26);
        art.root.scale.setScalar(scale);

        art.update(t);

        art.mats.forEach((m) => {
          m.opacity = (m.userData.baseOpacity ?? 1) * vis;
        });

        if (vis > 0.55) {
          rimLight.color.setHex(art.accent);
          fillLight.color.setHex(art.rim);
        }
      });

      particles.rotation.y = t * 0.025;
      renderer.render(scene, camera);
    }

    computeScrollScene();
    animate();
  }

  // =========================================================================
  // Автономный векторно-неоновый 2D-фолбэк (если Three.js не загрузился)
  // =========================================================================
  function initFallbackCanvas() {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function drawLoop(ms) {
      requestAnimationFrame(drawLoop);
      const t = ms * 0.001;
      smoothIndex += (targetIndex - smoothIndex) * 0.07;
      ctx.clearRect(0, 0, w, h);

      const cx = w > 900 ? w * 0.74 : w * 0.5;
      const cy = h * 0.52;
      const colors = ['#e7a64b', '#63c777', '#e06b5f', '#f471a8'];
      const labels = ['KARAMBIT', 'END CRYSTAL', 'AEGIS', 'VICE NEON'];

      SCENE_ORDER.forEach((_, idx) => {
        const dist = idx - smoothIndex;
        const vis = Math.max(0, 1 - Math.abs(dist) * 1.2);
        if (vis <= 0.02) return;

        ctx.save();
        ctx.translate(cx + dist * 90, cy - dist * 120 + Math.sin(t * 1.6 + idx) * 10);
        ctx.globalAlpha = vis * 0.75;
        ctx.strokeStyle = colors[idx];
        ctx.lineWidth = 2.5;
        ctx.shadowColor = colors[idx];
        ctx.shadowBlur = 24;

        ctx.beginPath();
        ctx.arc(0, 0, 125 + Math.sin(t + idx) * 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.rotate(t * 0.35);
        ctx.strokeRect(-72, -72, 144, 144);
        ctx.rotate(-t * 0.35);

        ctx.fillStyle = colors[idx];
        ctx.font = '700 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[idx], 0, 165);
        ctx.restore();
      });
    }

    computeScrollScene();
    requestAnimationFrame(drawLoop);
  }

  if (window.THREE) {
    try {
      initThreeJS();
    } catch (e) {
      initFallbackCanvas();
    }
  } else {
    initFallbackCanvas();
  }
})();
