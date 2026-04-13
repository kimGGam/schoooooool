// ─────────────────────────────────────────────
//  학사일정 데이터
// ─────────────────────────────────────────────

const ACADEMIC_SCHEDULE = [
  { month: 3,  date: '3/2',       event: '입학식 · 시업식',                  type: 'normal'   },
  { month: 4,  date: '4/24',      event: '전국연합학력평가 (전학년)',           type: 'normal'   },
  { month: 4,  date: '4/28~5/1',  event: '1학기 중간고사',                   type: 'exam'     },
  { month: 5,  date: '5/6',       event: '체육대회',                         type: 'normal'   },
  { month: 5,  date: '5/22',      event: '학교축제',                         type: 'normal'   },
  { month: 6,  date: '6/4',       event: '전국연합학력평가 (3학년)',            type: 'normal'   },
  { month: 6,  date: '6/20',      event: '전국연합학력평가 (1·2학년)',          type: 'normal'   },
  { month: 6,  date: '6/29~7/3',  event: '1학기 기말고사',                   type: 'exam'     },
  { month: 7,  date: '7/15',      event: '학술나눔제 (3학년)',                 type: 'normal'   },
  { month: 7,  date: '7/20~8/17', event: '여름방학',                         type: 'vacation' },
  { month: 8,  date: '8/18',      event: '2학기 개학식',                     type: 'normal'   },
  { month: 9,  date: '9/2',       event: '전국연합학력평가 (전학년)',           type: 'normal'   },
  { month: 10, date: '10/12~15',  event: '2학기 중간고사',                   type: 'exam'     },
  { month: 10, date: '10/19~21',  event: '수학여행 (2학년) · 체험학습 (1학년)', type: 'normal'   },
  { month: 10, date: '10/20',     event: '전국연합학력평가 (3학년)',            type: 'normal'   },
  { month: 11, date: '11/19',     event: '대학수학능력시험',                   type: 'exam'     },
  { month: 12, date: '12/7~11',   event: '2학기 기말고사 (1·2학년)',           type: 'exam'     },
  { month: 12, date: '12/24',     event: '학술나눔제 (1·2학년)',               type: 'normal'   },
  { month: 12, date: '12/31~1/31',event: '겨울방학',                         type: 'vacation' },
  { month: 2,  date: '2/3',       event: '졸업식 · 종업식',                   type: 'normal'   },
];

// ─────────────────────────────────────────────
//  좌석 설정
// ─────────────────────────────────────────────

const SEAT_CONFIG = {
  single: { label: '1인석', icon: '🪑', count: 15, minPeople: 1, maxPeople: 1 },
  triple: { label: '3인석', icon: '👨‍👩‍👧', count: 2,  minPeople: 2, maxPeople: 3 },
  quad:   { label: '4인석', icon: '👨‍👩‍👧‍👦', count: 2,  minPeople: 3, maxPeople: 4 },
};

const TIME_SLOTS = [
  { label: '1교시', range: '16:50 ~ 18:00', start: '16:50', end: '18:00' },
  { label: '2교시', range: '19:00 ~ 20:20', start: '19:00', end: '20:20' },
  { label: '3교시', range: '20:40 ~ 22:00', start: '20:40', end: '22:00' },
];

// ─────────────────────────────────────────────
//  세션
// ─────────────────────────────────────────────

let currentUser = null;

function loadSession() {
  try { const s = localStorage.getItem('studycafe_user'); if (s) currentUser = JSON.parse(s); } catch(e) {}
}
function saveSession(u)  { currentUser = u; localStorage.setItem('studycafe_user', JSON.stringify(u)); }
function clearSession()  { currentUser = null; localStorage.removeItem('studycafe_user'); }

// ─────────────────────────────────────────────
//  로그인
// ─────────────────────────────────────────────

async function doLogin() {
  const userId   = document.getElementById('loginId').value.trim();
  const password = document.getElementById('loginPw').value;
  if (!userId || !password) { alert('아이디와 비밀번호를 입력해주세요.'); return; }

  try {
    const res  = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId, password }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }

    if (data.isFirstLogin) {
      document.getElementById('loginModal').style.display  = 'none';
      document.getElementById('setupUserId').textContent   = userId;
      document.getElementById('setupCurrentPw').value      = password;
      document.getElementById('setupModal').style.display  = 'flex';
    } else {
      saveSession({ userId: data.userId, name: data.name });
      document.getElementById('loginModal').style.display = 'none';
      updateUserInfo();
    }
  } catch(e) { alert('서버에 연결할 수 없습니다.'); }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginPw').addEventListener('keydown', e => { if (e.key==='Enter') doLogin(); });
  document.getElementById('setupConfirmPw').addEventListener('keydown', e => { if (e.key==='Enter') doSetupProfile(); });
});

async function doSetupProfile() {
  const userId = document.getElementById('setupUserId').textContent;
  const cur    = document.getElementById('setupCurrentPw').value;
  const nw     = document.getElementById('setupNewPw').value;
  const cf     = document.getElementById('setupConfirmPw').value;
  const name   = document.getElementById('setupName').value.trim();

  if (!name)         { alert('이름을 입력해주세요.'); return; }
  if (nw.length < 4) { alert('비밀번호는 4자 이상 입력해주세요.'); return; }
  if (nw !== cf)     { alert('비밀번호가 일치하지 않습니다.'); return; }

  try {
    const res  = await fetch('/api/setup-profile', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId, currentPassword: cur, newPassword: nw, name }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }

    saveSession({ userId: data.userId, name: data.name });
    document.getElementById('setupModal').style.display = 'none';
    updateUserInfo();
  } catch(e) { alert('서버에 연결할 수 없습니다.'); }
}

function logout() {
  clearSession();
  document.getElementById('loginId').value = '';
  document.getElementById('loginPw').value = '';
  document.getElementById('loginModal').style.display = 'flex';
  updateUserInfo();
}

function updateUserInfo() {
  const el = document.getElementById('userInfo');
  if (currentUser) {
    el.innerHTML = `<span class="user-name">${currentUser.name} <small>(${currentUser.userId})</small></span>
      <button class="logout-btn" onclick="logout()">로그아웃</button>`;
  } else {
    el.innerHTML = '';
  }
  const badge = document.getElementById('userBadge');
  if (badge && currentUser) {
    badge.innerHTML = `<div class="user-badge">👤 ${currentUser.name} <span>(${currentUser.userId})</span></div>`;
  }
}

// ─────────────────────────────────────────────
//  페이지 전환
// ─────────────────────────────────────────────

function showPage(name) {
  if (!currentUser) { document.getElementById('loginModal').style.display = 'flex'; return; }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const idx = { home:0, reserve:1, mypage:2, ranking:3 }[name];
  document.querySelectorAll('.nav-btn')[idx].classList.add('active');
  if (name === 'reserve') initReservePage();
  if (name === 'ranking') loadRanking();
  if (name === 'mypage')  loadMyReservations();
  if (name === 'home')    loadHomeDashboard();
}

// ─────────────────────────────────────────────
//  홈 대시보드
// ─────────────────────────────────────────────

function renderMonthSchedule() {
  const card = document.getElementById('scheduleMonthCard');
  if (!card) return;

  const month = new Date().getMonth() + 1;
  const monthNames = ['','1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const events = ACADEMIC_SCHEDULE.filter(e => e.month === month);

  card.innerHTML = `
    <div class="sch-month-header">
      <span class="sch-month-icon">📅</span>
      <span class="sch-month-title">${monthNames[month]} 학사일정</span>
    </div>
    ${events.length > 0
      ? `<ul class="schedule-list">
          ${events.map(e => `
            <li>
              <span class="sch-date${e.type === 'exam' ? ' exam' : e.type === 'vacation' ? ' vacation' : ''}">${e.date}</span>
              <span class="sch-event${e.type === 'exam' ? ' exam' : e.type === 'vacation' ? ' vacation' : ''}">${e.event}</span>
            </li>`).join('')}
        </ul>`
      : '<p class="sch-empty">이번 달 학사 일정이 없습니다.</p>'
    }`;
}

async function loadHomeDashboard() {
  if (!currentUser) return;
  renderMonthSchedule();

  const card = document.getElementById('dashboardCard');
  if (!card) return;

  try {
    const res = await fetch(`/api/reservations?userId=${encodeURIComponent(currentUser.userId)}`);
    const all = await res.json();

    const now     = new Date();
    const nowStr  = now.toISOString().split('T')[0];
    const nowTime = now.toTimeString().slice(0, 5);

    const done = all.filter(r => {
      if (r.cancelled) return false;
      if (r.date < nowStr) return true;
      if (r.date === nowStr && r.endTime <= nowTime) return true;
      return false;
    });

    const todayUpcoming = all.filter(r =>
      !r.cancelled && r.date === nowStr && r.endTime > nowTime
    );

    const slotMinutes = { '16:50': 70, '19:00': 80, '20:40': 80 };
    let totalMinutes = 0;
    done.forEach(r => { totalMinutes += slotMinutes[r.startTime] || 0; });
    const hours = Math.floor(totalMinutes / 60);
    const mins  = totalMinutes % 60;

    card.innerHTML = `
      <div class="dash-header">
        <div class="dash-avatar">👤</div>
        <div class="dash-user-info">
          <div class="dash-name">${currentUser.name}</div>
          <div class="dash-id">${currentUser.userId}</div>
        </div>
      </div>
      <div class="dash-stats">
        <div class="dash-stat">
          <div class="dash-stat-value">${hours}시간 ${mins}분</div>
          <div class="dash-stat-label">누적 공부 시간</div>
        </div>
        <div class="dash-stat">
          <div class="dash-stat-value">${done.length}회</div>
          <div class="dash-stat-label">완료 세션</div>
        </div>
      </div>
      <div class="dash-today">
        <div class="dash-today-title">오늘 예약</div>
        ${todayUpcoming.length > 0
          ? todayUpcoming.map(r => {
              const slot = TIME_SLOTS.find(s => s.start === r.startTime);
              return `<div class="dash-today-slot">${slot ? slot.label + ' ' + slot.range : r.startTime}</div>`;
            }).join('')
          : '<div class="dash-today-empty">오늘 예약이 없습니다</div>'
        }
      </div>
      <button class="btn-primary full-width" onclick="showPage('reserve')" style="margin-top:16px">+ 예약하기</button>`;
  } catch(e) {
    card.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:20px">서버에 연결할 수 없습니다.</p>';
  }
}

// ─────────────────────────────────────────────
//  주간 달력
// ─────────────────────────────────────────────

const todayStr = new Date().toISOString().split('T')[0];
let viewDateStr = todayStr;
let weekOffset  = 0;

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getMonday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}

function renderWeekView() {
  const mon = getMonday(todayStr);
  mon.setDate(mon.getDate() + weekOffset * 7);
  const sun = new Date(mon); sun.setDate(sun.getDate() + 6);

  document.getElementById('weekRange').textContent =
    `${mon.getMonth()+1}/${mon.getDate()} ~ ${sun.getMonth()+1}/${sun.getDate()}`;

  const labels = ['월','화','수','목','금','토','일'];
  document.getElementById('weekDays').innerHTML = Array.from({length:7}, (_,i) => {
    const d  = new Date(mon); d.setDate(d.getDate() + i);
    const ds = toDateStr(d);
    const isToday    = ds === todayStr;
    const isSelected = ds === viewDateStr;
    const isPast     = ds < todayStr;
    return `<button class="day-btn${isToday?' today':''}${isSelected?' selected':''}${isPast?' past':''}"
      onclick="selectDay('${ds}')" ${isPast?'disabled':''}>
      <span class="day-label">${labels[i]}</span>
      <span class="day-num">${d.getDate()}</span>
      ${isToday ? '<span class="today-badge">오늘</span>' : ''}
    </button>`;
  }).join('');
}

function selectDay(ds) {
  viewDateStr = ds; selectedSeatId = null;
  renderWeekView(); renderSeatMap();
  const isToday = ds === todayStr;
  document.getElementById('reserveActions').style.display  = isToday ? 'block' : 'none';
  document.getElementById('viewOnlyNotice').style.display  = isToday ? 'none'  : 'block';
  const btn = document.getElementById('confirmBtn');
  if (btn) btn.style.display = 'none';
}

function prevWeek() { weekOffset--; renderWeekView(); }
function nextWeek() { weekOffset++; renderWeekView(); }

// ─────────────────────────────────────────────
//  시간대 선택 (버튼)
// ─────────────────────────────────────────────

let selectedSlotIdx = null;

function renderTimeSlots() {
  const container = document.getElementById('timeSlotBtns');
  if (!container) return;
  container.innerHTML = TIME_SLOTS.map((s, i) => `
    <button class="time-slot-btn${selectedSlotIdx === i ? ' selected' : ''}"
      onclick="selectTimeSlot(${i})">
      <span class="ts-label">${s.label}</span>
      <span class="ts-range">${s.range}</span>
    </button>`).join('');
}

function selectTimeSlot(idx) {
  selectedSlotIdx = idx;
  selectedSeatId = null;
  renderTimeSlots();
  renderSeatMap();
}

function getSelectedSlot() {
  return selectedSlotIdx !== null ? TIME_SLOTS[selectedSlotIdx] : null;
}

// ─────────────────────────────────────────────
//  예약 페이지 초기화
// ─────────────────────────────────────────────

let selectedSeatType = 'single';
let selectedSeatId   = null;

function initReservePage() {
  viewDateStr     = todayStr;
  weekOffset      = 0;
  selectedSlotIdx = null;
  selectedSeatId  = null;

  renderWeekView();
  renderTimeSlots();
  updateUserInfo();
  renderSeatMap();

  document.getElementById('reserveActions').style.display = 'block';
  document.getElementById('viewOnlyNotice').style.display = 'none';
}

function selectSeatType(btn) {
  document.querySelectorAll('.seat-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedSeatType = btn.dataset.type;
  selectedSeatId   = null;
  document.getElementById('seatTypeLabel').textContent = `(${SEAT_CONFIG[selectedSeatType].label})`;

  const cfg = SEAT_CONFIG[selectedSeatType];
  const pg  = document.getElementById('peopleCountGroup');
  const pi  = document.getElementById('peopleCount');
  if (selectedSeatType !== 'single') {
    pg.style.display = 'block';
    pi.min = cfg.minPeople; pi.max = cfg.maxPeople;
    pi.placeholder = `${cfg.minPeople}~${cfg.maxPeople}명`;
    pi.value = '';
    document.getElementById('peopleCountLabel').textContent =
      `인원수 (${cfg.minPeople}~${cfg.maxPeople}명)`;
    document.getElementById('memberIdsGroup').style.display = 'none';
  } else {
    pg.style.display = 'none';
    pi.value = '';
    document.getElementById('memberIdsGroup').style.display = 'none';
  }
  renderSeatMap();
}

// 인원수 입력 시 멤버 아이디 필드 업데이트
function updateMemberFields() {
  const container = document.getElementById('memberIdsGroup');
  if (selectedSeatType === 'single') { container.style.display = 'none'; return; }

  const cfg   = SEAT_CONFIG[selectedSeatType];
  const count = parseInt(document.getElementById('peopleCount').value);
  if (!count || count < cfg.minPeople || count > cfg.maxPeople) {
    container.style.display = 'none'; return;
  }

  container.style.display = 'block';
  container.innerHTML = `<div class="form-group member-ids-wrap">
    <label>멤버 아이디 입력</label>
    ${Array.from({length: count}, (_, i) => {
      const isMe = i === 0;
      return `<div class="member-id-row">
        <span class="member-label">멤버 ${i+1}${isMe ? ' (나)' : ''}</span>
        <input type="number" class="member-id-input" id="memberId-${i}"
          min="10000" max="40000" placeholder="아이디 (10000~40000)"
          ${isMe && currentUser ? `value="${currentUser.userId}" readonly` : ''} />
      </div>`;
    }).join('')}
  </div>`;
}

// ─────────────────────────────────────────────
//  좌석 배치도 렌더링
// ─────────────────────────────────────────────

async function renderSeatMap() {
  const map   = document.getElementById('seatMap');
  const guide = document.getElementById('seatSelectGuide');
  const slot  = getSelectedSlot();

  if (!slot) {
    guide.textContent = '시간대를 선택하세요.';
    guide.style.display = 'block';
    map.innerHTML = ''; map.className = 'seat-map';
    return;
  }
  guide.style.display = 'none';

  // reservedMap: seatId → { userId, memberIds }
  let reservedMap = {};
  try {
    const res = await fetch('/api/reservations');
    const all = await res.json();
    all.forEach(r => {
      if (!r.cancelled && r.date === viewDateStr &&
          r.startTime === slot.start && r.endTime === slot.end) {
        reservedMap[r.seatId] = { userId: r.userId, memberIds: r.memberIds || [] };
      }
    });
  } catch(e) {
    guide.textContent = '서버에 연결할 수 없습니다.';
    guide.style.display = 'block'; return;
  }

  const isToday = viewDateStr === todayStr;

  function seatBtn(seatId, large = false) {
    const type   = seatId.split('-')[0];
    const num    = seatId.split('-')[1];
    const cfg    = SEAT_CONFIG[type];
    const isActive   = type === selectedSeatType;
    const data       = reservedMap[seatId];
    const isReserved = !!data;
    const isSelected = seatId === selectedSeatId;
    const isTable    = type !== 'single';

    let cls = 'seat-btn';
    if (large)       cls += ' large';
    if (isTable)     cls += ' table-seat';
    if (!isActive)   cls += ' other-type';
    else if (isReserved) cls += ' reserved';
    else if (isSelected) cls += ' selected';
    else             cls += ' available';

    const clickable = isActive && !isReserved && isToday;

    let inner;
    if (isReserved) {
      // 예약된 좌석에 아이디 표시
      const ids = data.memberIds.length > 0 ? data.memberIds : [data.userId];
      if (isTable) {
        inner = ids.map(id => `<span class="id-chip">${id}</span>`).join('');
      } else {
        inner = `<span class="reserved-id">${ids[0]}</span>`;
      }
    } else if (isTable) {
      inner = `<span class="seat-icon">${cfg.icon}</span><span>${cfg.label}</span>`;
    } else {
      inner = `<span>${num}번</span>`;
    }

    return `<button class="${cls}"
      ${clickable ? `onclick="selectSeat('${seatId}')"` : 'disabled'}
      title="${cfg.label} ${num}번">
      ${inner}
    </button>`;
  }

  let html = '';

  // 개별 배치 좌석
  const solo = [
    { id:'quad-1',   col:1,  row:1, large:false },
    { id:'single-1', col:2,  row:1, large:true  },
    { id:'single-2', col:3,  row:1, large:true  },
    { id:'single-3', col:4,  row:1, large:true  },
    { id:'single-4', col:5,  row:1, large:true  },
    { id:'single-5', col:6,  row:1, large:true  },
    { id:'single-6', col:7,  row:1, large:true  },
    { id:'single-7', col:8,  row:1, large:true  },
    { id:'triple-1', col:10, row:1, large:false },
    { id:'quad-2',   col:1,  row:3, large:false },
    { id:'triple-2', col:10, row:3, large:false },
  ];
  solo.forEach(({ id, col, row, large }) => {
    html += `<div style="grid-column:${col};grid-row:${row}">${seatBtn(id, large)}</div>`;
  });

  // 왼쪽 그룹 박스: 8,9,12,13
  html += `<div class="seat-group-box" style="grid-column:3/5;grid-row:2/4">
    ${seatBtn('single-8')}${seatBtn('single-9')}
    ${seatBtn('single-12')}${seatBtn('single-13')}
  </div>`;

  // 오른쪽 그룹 박스: 10,11,14,15
  html += `<div class="seat-group-box" style="grid-column:6/8;grid-row:2/4">
    ${seatBtn('single-10')}${seatBtn('single-11')}
    ${seatBtn('single-14')}${seatBtn('single-15')}
  </div>`;

  map.innerHTML = html;
  map.className = 'seat-map layout-grid';

  const confirmBtn = document.getElementById('confirmBtn');
  if (confirmBtn) confirmBtn.style.display = selectedSeatId ? 'block' : 'none';
}

function selectSeat(id) {
  selectedSeatId = (selectedSeatId === id) ? null : id;
  renderSeatMap();
  const btn = document.getElementById('confirmBtn');
  if (btn) btn.style.display = selectedSeatId ? 'block' : 'none';
}

// ─────────────────────────────────────────────
//  예약 확정
// ─────────────────────────────────────────────

function goToSeatSelect() {
  if (!currentUser) { alert('로그인이 필요합니다.'); return; }
  const slot = getSelectedSlot();
  if (!slot) { alert('시간대를 선택해주세요.'); return; }

  if (selectedSeatType !== 'single') {
    const cfg    = SEAT_CONFIG[selectedSeatType];
    const count  = parseInt(document.getElementById('peopleCount').value);
    if (!count || count < cfg.minPeople || count > cfg.maxPeople) {
      alert(`인원수를 ${cfg.minPeople}~${cfg.maxPeople}명으로 입력해주세요.`); return;
    }
    // 멤버 아이디 검증
    const memberIds = collectMemberIds();
    if (!memberIds) return;
  }

  renderSeatMap();
  document.querySelector('.seat-map-wrap').scrollIntoView({ behavior:'smooth', block:'start' });
}

function collectMemberIds() {
  if (selectedSeatType === 'single') return [];
  const count = parseInt(document.getElementById('peopleCount').value);
  const ids = [];
  for (let i = 0; i < count; i++) {
    const el  = document.getElementById(`memberId-${i}`);
    if (!el) { alert('멤버 아이디를 입력해주세요.'); return null; }
    const val = el.value.trim();
    const num = parseInt(val);
    if (!val || isNaN(num) || num < 10000 || num > 40000) {
      alert(`멤버 ${i+1}의 아이디를 올바르게 입력해주세요. (10000~40000)`); return null;
    }
    ids.push(String(num));
  }
  if (new Set(ids).size !== ids.length) { alert('중복된 아이디가 있습니다.'); return null; }
  return ids;
}

async function confirmReservation() {
  if (!selectedSeatId) { alert('좌석을 선택해주세요.'); return; }
  if (!currentUser)    { alert('로그인이 필요합니다.'); return; }
  const slot = getSelectedSlot();
  if (!slot) { alert('시간대를 선택해주세요.'); return; }

  const cfg     = SEAT_CONFIG[selectedSeatType];
  const seatNum = selectedSeatId.split('-')[1];
  let peopleCount = 1;
  let memberIds   = [];

  if (selectedSeatType !== 'single') {
    peopleCount = parseInt(document.getElementById('peopleCount').value);
    if (!peopleCount || peopleCount < cfg.minPeople || peopleCount > cfg.maxPeople) {
      alert(`인원수를 ${cfg.minPeople}~${cfg.maxPeople}명으로 입력해주세요.`); return;
    }
    memberIds = collectMemberIds();
    if (!memberIds) return;
  }

  try {
    const res = await fetch('/api/reservations', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        userId: currentUser.userId, name: currentUser.name,
        date: viewDateStr, startTime: slot.start, endTime: slot.end,
        seatType: selectedSeatType, seatTypeLabel: cfg.label,
        seatId: selectedSeatId, seatLabel: `${seatNum}번`,
        peopleCount, memberIds,
      }),
    });

    const data = await res.json();
    if (res.status === 409) { alert(data.error); renderSeatMap(); return; }
    if (!res.ok) { alert('예약에 실패했습니다.'); return; }

    const peopleText = selectedSeatType !== 'single'
      ? `<br/><strong>멤버</strong> ${memberIds.join(', ')}` : '';
    document.getElementById('modalContent').innerHTML = `
      <strong>예약자</strong> ${currentUser.name} (${currentUser.userId})<br/>
      <strong>날짜</strong> ${formatDate(viewDateStr)}<br/>
      <strong>시간</strong> ${slot.label} ${slot.range}<br/>
      <strong>좌석</strong> ${cfg.label} ${seatNum}번${peopleText}
    `;
    document.getElementById('modal').style.display = 'flex';
    selectedSeatId = null;
    renderSeatMap();
  } catch(e) { alert('서버에 연결할 수 없습니다.'); }
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

// ─────────────────────────────────────────────
//  내 예약
// ─────────────────────────────────────────────

async function loadMyReservations() {
  if (!currentUser) return;
  const list = document.getElementById('reservationList');

  try {
    const res = await fetch(`/api/reservations?userId=${encodeURIComponent(currentUser.userId)}`);
    const reservations = await res.json();

    if (reservations.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>예약 내역이 없습니다.</p></div>`;
      return;
    }

    reservations.sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
    const now = new Date().toTimeString().slice(0, 5);

    list.innerHTML = reservations.map(r => {
      const isUpcoming = !r.cancelled && (r.date > todayStr || (r.date === todayStr && r.endTime > now));
      const badgeClass = r.cancelled ? 'past' : (isUpcoming ? 'upcoming' : 'past');
      const badgeText  = r.cancelled ? '취소됨' : (isUpcoming ? '예정' : '이용 완료');
      const slotObj    = TIME_SLOTS.find(s => s.start === r.startTime);
      const slotLabel  = slotObj ? `${slotObj.label} (${slotObj.range})` : `${r.startTime}~${r.endTime}`;
      const members    = r.memberIds && r.memberIds.length > 0 ? `<span>👥 ${r.memberIds.join(', ')}</span>` : '';

      return `<div class="res-card" id="res-${r.id}">
        <div class="res-info">
          <h4>${SEAT_CONFIG[r.seatType]?.icon || ''} ${r.seatTypeLabel} ${r.seatLabel}</h4>
          <div class="res-meta">
            <span>📅 ${formatDate(r.date)}</span>
            <span>🕐 ${slotLabel}</span>
            ${members}
          </div>
        </div>
        <div class="res-actions">
          <span class="res-badge ${badgeClass}">${badgeText}</span>
          ${isUpcoming ? `<button class="btn-cancel" onclick="cancelReservation('${r.id}')">예약 취소</button>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>서버에 연결할 수 없습니다.</p></div>`;
  }
}

async function cancelReservation(id) {
  if (!confirm('예약을 취소하시겠습니까?')) return;
  try {
    const res = await fetch(`/api/reservations/${id}/cancel`, { method:'PATCH' });
    if (!res.ok) { alert('취소에 실패했습니다.'); return; }
    loadMyReservations();
  } catch(e) { alert('서버에 연결할 수 없습니다.'); }
}

// ─────────────────────────────────────────────
//  순위 페이지
// ─────────────────────────────────────────────

async function loadRanking() {
  const container = document.getElementById('rankingContent');
  container.innerHTML = '<p style="text-align:center;color:var(--gray-500);padding:40px">로딩 중...</p>';

  try {
    const res    = await fetch('/api/reservations');
    const all    = await res.json();
    const active = all.filter(r => !r.cancelled);

    const slotCounts = TIME_SLOTS.map((slot, i) => ({
      idx: i+1, start: slot.start, end: slot.end,
      count: active.filter(r => r.startTime === slot.start && r.endTime === slot.end).length,
    }));
    const maxSlot = Math.max(...slotCounts.map(s => s.count), 1);

    const userMap = {};
    active.forEach(r => {
      if (!userMap[r.userId]) userMap[r.userId] = { name: r.name, userId: r.userId, count: 0 };
      userMap[r.userId].count++;
    });
    const users  = Object.values(userMap).sort((a, b) => b.count - a.count).slice(0, 10);
    const medals = ['🥇','🥈','🥉'];

    container.innerHTML = `
      <div class="ranking-section">
        <h3>🕐 시간대별 인기 현황</h3>
        <div class="slot-stats">
          ${slotCounts.map(s => `
            <div class="slot-stat-card">
              <div class="slot-label">${s.idx}교시</div>
              <div class="slot-time">${s.start} ~ ${s.end}</div>
              <div class="slot-count">${s.count}건</div>
              <div class="slot-bar-wrap"><div class="slot-bar-fill" style="width:${Math.round(s.count/maxSlot*100)}%"></div></div>
            </div>`).join('')}
        </div>
      </div>
      <div class="ranking-section">
        <h3>🏆 스터디 왕 순위</h3>
        ${users.length === 0
          ? '<div class="empty-state"><div class="empty-icon">📊</div><p>아직 예약 내역이 없습니다.</p></div>'
          : `<div class="rank-list">${users.map((u,i) => `
              <div class="rank-item ${i<3?'top-rank':''}">
                <span class="rank-num">${medals[i]||(i+1)}</span>
                <span class="rank-name">${u.name} <small>(${u.userId})</small></span>
                <span class="rank-count">${u.count}회</span>
              </div>`).join('')}</div>`}
      </div>`;
  } catch(e) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>서버에 연결할 수 없습니다.</p></div>';
  }
}

// ─────────────────────────────────────────────
//  유틸
// ─────────────────────────────────────────────

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${dateStr} (${['일','월','화','수','목','금','토'][d.getDay()]})`;
}

// ─────────────────────────────────────────────
//  초기화
// ─────────────────────────────────────────────

loadSession();
updateUserInfo();
if (!currentUser) {
  document.getElementById('loginModal').style.display = 'flex';
} else {
  loadHomeDashboard();
}
