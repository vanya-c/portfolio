/**
 * Логика тарифов, интерактивной схемы зала, слотов времени и бронирования
 */
(function () {
  // Полная база залов и всех возможных тарифов (Будни / Выходные)
  const HALLS = {
    comfort: {
      name: 'Comfort Zone',
      spec: 'RTX 4060 Ti · 180 Гц · 30 мест',
      seatPrefix: 'ПК #',
      seatCount: 15,
      perRoom: false,
      btnStyle: 'btn-mc',
      weekday: { morn: 110, h1: 150, h2: 290, p3: 390, p5: 590, day: 650, night: 690, full: 1490 },
      weekend: { morn: 140, h1: 190, h2: 360, p3: 490, p5: 740, day: 820, night: 890, full: 1850 }
    },
    pro: {
      name: 'Cyber Pro 240Hz',
      spec: 'RTX 4070 Super · 240 Гц Zowie · 20 мест',
      seatPrefix: 'PRO #',
      seatCount: 15,
      perRoom: false,
      btnStyle: 'btn-cs',
      weekday: { morn: 160, h1: 220, h2: 420, p3: 580, p5: 860, day: 950, night: 990, full: 2150 },
      weekend: { morn: 200, h1: 270, h2: 520, p3: 720, p5: 1080, day: 1190, night: 1250, full: 2590 }
    },
    vip: {
      name: 'VIP OLED 360Hz',
      spec: 'RTX 4080 Super · QD-OLED 360 Гц · 10 мест',
      seatPrefix: 'VIP #',
      seatCount: 10,
      perRoom: false,
      btnStyle: 'btn-dota',
      weekday: { morn: 250, h1: 340, h2: 650, p3: 890, p5: 1350, day: 1490, night: 1590, full: 3390 },
      weekend: { morn: 310, h1: 410, h2: 790, p3: 1090, p5: 1650, day: 1790, night: 1950, full: 3990 }
    },
    bootcamp: {
      name: 'Bootcamp 5×5',
      spec: 'Закрытая комната 5 ПК RTX 4080 + TV 65"',
      seatPrefix: 'BOOTCAMP ',
      seatCount: 2,
      perRoom: true,
      roomNote: 'комната на 5 чел.',
      btnStyle: 'btn-cs',
      weekday: { morn: 790, h1: 1050, h2: 1990, p3: 2750, p5: 4150, day: 4590, night: 4890, full: 9900 },
      weekend: { morn: 950, h1: 1290, h2: 2450, p3: 3390, p5: 5100, day: 5590, night: 5990, full: 11900 }
    },
    duo: {
      name: 'Duo Private Room',
      spec: 'Комната для двоих · 2× RTX 4090 · 4K OLED',
      seatPrefix: 'DUO ROOM ',
      seatCount: 3,
      perRoom: true,
      roomNote: 'комната на 2 чел.',
      btnStyle: 'btn-gta',
      weekday: { morn: 420, h1: 560, h2: 1060, p3: 1450, p5: 2190, day: 2390, night: 2590, full: 5400 },
      weekend: { morn: 520, h1: 680, h2: 1290, p3: 1790, p5: 2690, day: 2890, night: 3190, full: 6500 }
    },
    ps5: {
      name: 'PS5 Pro & SimRacing',
      spec: 'TV 75" 4K (до 4 гостей) или кокпит Moza R12',
      seatPrefix: 'ЛОЖА / SIM #',
      seatCount: 6,
      perRoom: true,
      roomNote: 'ложа / кокпит',
      btnStyle: 'btn-gta',
      weekday: { morn: 290, h1: 390, h2: 740, p3: 990, p5: 1490, day: 1650, night: 1790, full: 3690 },
      weekend: { morn: 360, h1: 490, h2: 920, p3: 1250, p5: 1890, day: 2050, night: 2290, full: 4490 }
    }
  };

  const TARIFF_LABELS = {
    h1: '1 час',
    h2: '2 часа',
    p3: 'Пакет 3 часа',
    p5: 'Пакет 5 часов',
    day: 'Пакет «День» (6 ч)',
    night: 'Пакет «Ночь» (22:00–08:00)',
    full: 'Сутки 24 часа'
  };

  const PROMO_CODES = {
    FIRST: { pct: 20, title: 'Первый визит −20%' },
    STUDENT: { pct: 20, title: 'Студенческий −20%' },
    BDAY: { pct: 25, title: 'День рождения −25%' }
  };

  const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00', '00:00', '01:00',
    '02:00', '03:00'
  ];

  const STORAGE_KEY = 'aether_club_bookings_v2';

  let tableDayMode = 'weekday';
  let state = {
    hall: 'pro',
    date: '',
    time: '18:00',
    tariff: 'p3',
    seats: ['PRO #04']
  };

  const fmtRub = (n) => n.toLocaleString('ru-RU') + ' ₽';

  function getSavedBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveBookings(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // 1. Рендер большой таблицы всех тарифов
  function renderPriceTable() {
    const tbody = document.getElementById('priceTableBody');
    if (!tbody) return;
    tbody.innerHTML = Object.values(HALLS).map((h) => {
      const r = h[tableDayMode];
      return `
        <tr>
          <td class="zone-cell">
            <b>${h.name}</b>
            <small>${h.spec}</small>
          </td>
          <td class="price-val">${fmtRub(r.morn)}</td>
          <td class="price-val">${fmtRub(r.h1)}</td>
          <td class="price-val">${fmtRub(r.p3)}</td>
          <td class="price-val">${fmtRub(r.p5)}</td>
          <td class="price-val">${fmtRub(r.day)}</td>
          <td class="price-night">${fmtRub(r.night)}</td>
          <td class="price-val">${fmtRub(r.full)}</td>
        </tr>
      `;
    }).join('');
  }

  document.querySelectorAll('.switch-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      tableDayMode = btn.dataset.daymode;
      document.querySelectorAll('.switch-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderPriceTable();
    });
  });

  // 2. Определение буднего / выходного дня по выбранной дате
  function isWeekendDate(dateStr) {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    return day === 5 || day === 6 || day === 0; // Пт, Сб, Вс
  }

  // Детерминированная имитация частичной занятости + реальные брони пользователя
  function hashBusy(str, threshold) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 100) < threshold;
  }

  function renderHallSelector() {
    const box = document.getElementById('hallSelector');
    if (!box) return;
    box.innerHTML = '';
    Object.entries(HALLS).forEach(([key, h]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hall-pill' + (state.hall === key ? ' active' : '');
      const rateMode = isWeekendDate(state.date) ? 'weekend' : 'weekday';
      btn.innerHTML = `<b>${h.name}</b><small>от ${fmtRub(h[rateMode].morn)}/ч</small>`;
      btn.addEventListener('click', () => selectHall(key));
      box.appendChild(btn);
    });
  }

  function selectHall(key) {
    if (!HALLS[key]) return;
    state.hall = key;
    state.seats = [];
    renderHallSelector();
    renderTimeSlots();
    renderSeatMap();
    updateSummary();
  }

  function renderTimeSlots() {
    const grid = document.getElementById('timeGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // Для пакета «Ночь» рекомендуем вечерние слоты 22:00 / 23:00
    if (state.tariff === 'night' && state.time !== '22:00' && state.time !== '23:00') {
      state.time = '22:00';
    }
    if (state.tariff === 'day' && !['12:00', '13:00'].includes(state.time)) {
      state.time = '12:00';
    }

    let firstAvailable = null;

    TIME_SLOTS.forEach((slot) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'time-slot';
      btn.textContent = slot;

      let disabled = hashBusy(`slot_${state.hall}_${state.date}_${slot}`, 18);
      if (state.tariff === 'night' && !['21:00', '22:00', '23:00', '00:00'].includes(slot)) {
        disabled = true;
      }

      btn.disabled = disabled;
      if (!disabled && !firstAvailable) firstAvailable = slot;

      if (state.time === slot && !disabled) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        state.time = slot;
        state.seats = [];
        renderTimeSlots();
        renderSeatMap();
        updateSummary();
      });

      grid.appendChild(btn);
    });

    if ((!state.time || grid.querySelector('.time-slot.active') === null) && firstAvailable) {
      state.time = firstAvailable;
      Array.from(grid.children).forEach((b) => {
        if (b.textContent === state.time && !b.disabled) b.classList.add('active');
      });
    }
  }

  function renderSeatMap() {
    const map = document.getElementById('seatMap');
    const banner = document.getElementById('hallZoneBanner');
    if (!map) return;
    const h = HALLS[state.hall];
    banner.textContent = `${h.name.toUpperCase()} · ${h.spec.toUpperCase()}`;
    map.style.gridTemplateColumns = h.seatCount <= 3
      ? `repeat(${h.seatCount}, 1fr)`
      : h.seatCount <= 6
        ? 'repeat(3, 1fr)'
        : 'repeat(5, 1fr)';

    map.innerHTML = '';
    const saved = getSavedBookings();
    let firstFreeLabel = null;

    for (let i = 1; i <= h.seatCount; i++) {
      const num = h.seatCount < 10 && h.perRoom ? String(i) : String(i).padStart(2, '0');
      const label = `${h.seatPrefix}${num}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'seat-btn';

      const bookedByUser = saved.some((b) =>
        b.hall === state.hall && b.date === state.date && b.time === state.time && b.seats.includes(label)
      );
      const pseudoBusy = hashBusy(`seat_${state.hall}_${state.date}_${state.time}_${i}`, h.perRoom ? 22 : 28);
      const isBusy = bookedByUser || pseudoBusy;

      btn.disabled = isBusy;
      if (!isBusy && !firstFreeLabel) firstFreeLabel = label;

      const isSelected = state.seats.includes(label) && !isBusy;
      if (isSelected) btn.classList.add('selected');

      btn.innerHTML = `
        <span>${label}</span>
        <small>${isBusy ? 'Занято' : h.perRoom ? h.roomNote : 'Свободно'}</small>
      `;

      btn.addEventListener('click', () => {
        if (state.seats.includes(label)) {
          if (state.seats.length > 1) {
            state.seats = state.seats.filter((s) => s !== label);
          }
        } else {
          state.seats.push(label);
        }
        renderSeatMap();
        updateSummary();
      });

      map.appendChild(btn);
    }

    // Автоматически выбираем 1 свободное место, если список пуст
    state.seats = state.seats.filter((s) => {
      return Array.from(map.children).some((el) => !el.disabled && el.querySelector('span').textContent === s);
    });

    if (state.seats.length === 0 && firstFreeLabel) {
      state.seats = [firstFreeLabel];
      Array.from(map.children).forEach((el) => {
        if (el.querySelector('span').textContent === firstFreeLabel) el.classList.add('selected');
      });
    }

    const counter = document.getElementById('seatCounter');
    if (counter) {
      counter.textContent = `Выбрано: ${state.seats.length} ${state.seats.length === 1 ? 'место' : 'мест(а)'}`;
    }
  }

  function calculateTotal() {
    const h = HALLS[state.hall];
    const weekend = isWeekendDate(state.date);
    const rates = weekend ? h.weekend : h.weekday;

    // Если выбрано утреннее время (08:00–12:00) и 1 час — применяем утренний тариф!
    const morningHours = ['08:00', '09:00', '10:00', '11:00', '12:00'];
    let unitPrice = rates[state.tariff] || rates.p3;
    if (state.tariff === 'h1' && morningHours.includes(state.time)) {
      unitPrice = rates.morn;
    }

    const unitsCount = Math.max(1, state.seats.length);
    let baseSum = unitPrice * unitsCount;

    let addonsSum = 0;
    const addonNames = [];
    const devCheck = document.getElementById('optDevices');
    const comboCheck = document.getElementById('optCombo');
    if (devCheck && devCheck.checked) {
      addonsSum += 120 * unitsCount;
      addonNames.push('Про-девайсы');
    }
    if (comboCheck && comboCheck.checked) {
      addonsSum += 590;
      addonNames.push('Комбо «Ночной Раш»');
    }

    const codeRaw = (document.getElementById('promoInput')?.value || '').trim().toUpperCase();
    const promo = PROMO_CODES[codeRaw] || null;
    const discount = promo ? Math.round((baseSum * promo.pct) / 100) : 0;
    const finalSum = Math.max(0, baseSum - discount + addonsSum);

    return { weekend, baseSum, addonsSum, addonNames, promo, discount, finalSum };
  }

  function updateSummary() {
    const h = HALLS[state.hall];
    const calc = calculateTotal();

    const rateBadge = document.getElementById('rateBadge');
    if (rateBadge) {
      rateBadge.textContent = calc.weekend ? 'Тариф Пт–Вс' : 'Будний тариф Пн–Чт';
    }

    document.getElementById('sumHallName').textContent = h.name;
    document.getElementById('sumDateTime').textContent = state.date && state.time
      ? `${state.date.split('-').reverse().join('.')} в ${state.time}`
      : 'Выберите время';
    document.getElementById('sumTariff').textContent = TARIFF_LABELS[state.tariff] || '';
    document.getElementById('sumSeats').textContent = state.seats.length ? state.seats.join(', ') : 'Нет свободных';
    document.getElementById('sumAddons').textContent = calc.addonNames.length ? calc.addonNames.join(', ') : 'Нет';

    const discRow = document.getElementById('sumDiscountRow');
    if (calc.promo) {
      discRow.hidden = false;
      document.getElementById('sumDiscount').textContent = `−${fmtRub(calc.discount)} (${calc.promo.pct}%)`;
    } else {
      discRow.hidden = true;
    }

    document.getElementById('sumTotal').textContent = fmtRub(calc.finalSum);

    // Стилизуем кнопку подтверждения под выбранный зал/игру
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.className = `game-btn ${h.btnStyle} btn-large`;
    }
  }

  function renderMyBookings() {
    const box = document.getElementById('myBookingsList');
    const clearBtn = document.getElementById('clearBookingsBtn');
    if (!box) return;
    const list = getSavedBookings();
    clearBtn.hidden = list.length === 0;

    if (list.length === 0) {
      box.innerHTML = '<p class="empty-bookings">У вас пока нет активных записей. Выберите время и место слева.</p>';
      return;
    }

    box.innerHTML = list.map((b) => `
      <div class="booking-ticket">
        <div>
          <b>#${b.pin} · ${b.hallName} (${b.seats.join(', ')})</b>
          <span>${b.date.split('-').reverse().join('.')} в ${b.time} · ${b.tariffLabel} · ${fmtRub(b.total)}</span>
        </div>
        <button type="button" class="ticket-cancel" data-cancel="${b.id}">Отмена</button>
      </div>
    `).join('');

    box.querySelectorAll('[data-cancel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const updated = getSavedBookings().filter((x) => x.id !== btn.dataset.cancel);
        saveBookings(updated);
        renderMyBookings();
        renderSeatMap();
        updateSummary();
      });
    });
  }

  // Инициализация полей даты и событий
  const dateInput = document.getElementById('bookDate');
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  state.date = todayStr;

  if (dateInput) {
    dateInput.min = todayStr;
    dateInput.value = todayStr;
    dateInput.addEventListener('change', () => {
      state.date = dateInput.value || todayStr;
      renderHallSelector();
      renderTimeSlots();
      renderSeatMap();
      updateSummary();
    });
  }

  document.getElementById('bookTariff')?.addEventListener('change', (e) => {
    state.tariff = e.target.value;
    renderTimeSlots();
    renderSeatMap();
    updateSummary();
  });

  ['promoInput', 'optDevices', 'optCombo'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', updateSummary);
    document.getElementById(id)?.addEventListener('change', updateSummary);
  });

  // Кнопки выбора зала из карточек секции #halls
  document.querySelectorAll('.pick-hall').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectHall(btn.dataset.hall);
    });
  });

  // Навигация с бокового HUD и кнопок смены 3D-персонажей
  document.querySelectorAll('.hud-dot').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.goto);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      if (window.setClub3DScene) window.setClub3DScene(btn.dataset.sceneBtn, 1400);
    });
  });

  document.querySelectorAll('.scene-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window.setClub3DScene) window.setClub3DScene(btn.dataset.targetScene, 6000);
    });
  });

  document.getElementById('clearBookingsBtn')?.addEventListener('click', () => {
    saveBookings([]);
    renderMyBookings();
    renderSeatMap();
    updateSummary();
  });

  // Отправка формы записи
  document.getElementById('bookingForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fb = document.getElementById('formFeedback');
    if (!state.time || state.seats.length === 0) {
      fb.className = 'form-feedback err';
      fb.textContent = 'Пожалуйста, выберите доступное время и хотя бы одно свободное место.';
      return;
    }

    const name = document.getElementById('guestName').value.trim();
    const phone = document.getElementById('guestPhone').value.trim();
    const calc = calculateTotal();
    const pin = String(Math.floor(1000 + Math.random() * 9000));

    const record = {
      id: Date.now().toString(36),
      pin,
      hall: state.hall,
      hallName: HALLS[state.hall].name,
      date: state.date,
      time: state.time,
      tariff: state.tariff,
      tariffLabel: TARIFF_LABELS[state.tariff],
      seats: [...state.seats],
      name,
      phone,
      total: calc.finalSum
    };

    const all = getSavedBookings();
    all.unshift(record);
    saveBookings(all);

    fb.className = 'form-feedback ok';
    fb.textContent = `Бронь #${pin} подтверждена для ${name}! ${record.hallName} (${record.seats.join(', ')}), ${state.date.split('-').reverse().join('.')} в ${state.time}.`;

    state.seats = [];
    renderMyBookings();
    renderSeatMap();
    updateSummary();
  });

  // Стартовый рендер
  renderPriceTable();
  renderHallSelector();
  renderTimeSlots();
  renderSeatMap();
  renderMyBookings();
  updateSummary();
})();
