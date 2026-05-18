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
  single: { label: '1인석', icon: '🪑', count: 16, minPeople: 1, maxPeople: 1 },
  triple: { label: '3인석', icon: '👨‍👩‍👧', count: 2,  minPeople: 2, maxPeople: 3 },
  quad:   { label: '4인석', icon: '👨‍👩‍👧‍👦', count: 2,  minPeople: 3, maxPeople: 4 },
};

const TIME_SLOTS = [
  { label: '8교시',     short: '8교시', range: '16:50 ~ 18:00', start: '16:50', end: '18:00' },
  { label: '야자 1교시', short: '야자1',  range: '19:00 ~ 20:20', start: '19:00', end: '20:20' },
  { label: '야자 2교시', short: '야자2',  range: '20:40 ~ 22:00', start: '20:40', end: '22:00' },
];

// ─────────────────────────────────────────────
//  예약 캐시 (불필요한 API 중복 호출 방지)
// ─────────────────────────────────────────────
let _reservationCache = null;

async function fetchReservations(forceRefresh = false) {
  if (_reservationCache && !forceRefresh) return _reservationCache;
  const res = await fetch('/api/reservations');
  if (!res.ok) throw new Error('서버 오류');
  _reservationCache = await res.json();
  return _reservationCache;
}

function invalidateCache() { _reservationCache = null; }

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
      <button class="settings-btn" onclick="openProfileModal()" title="개인정보 변경">⚙️</button>
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
//  개인정보 변경
// ─────────────────────────────────────────────

function openProfileModal() {
  if (!currentUser) return;
  document.getElementById('profileName').value      = currentUser.name;
  document.getElementById('profileCurrentPw').value = '';
  document.getElementById('profileNewPw').value     = '';
  document.getElementById('profileConfirmPw').value = '';
  document.getElementById('profileModal').style.display = 'flex';
}

function closeProfileModal() {
  document.getElementById('profileModal').style.display = 'none';
}

async function doChangeProfile() {
  if (!currentUser) return;
  const name      = document.getElementById('profileName').value.trim();
  const currentPw = document.getElementById('profileCurrentPw').value;
  const newPw     = document.getElementById('profileNewPw').value;
  const confirmPw = document.getElementById('profileConfirmPw').value;

  if (!name)      { alert('이름을 입력해주세요.'); return; }
  if (!currentPw) { alert('현재 비밀번호를 입력해주세요.'); return; }
  if (newPw && newPw.length < 4) { alert('새 비밀번호는 4자 이상 입력해주세요.'); return; }
  if (newPw && newPw !== confirmPw) { alert('새 비밀번호가 일치하지 않습니다.'); return; }

  try {
    const res  = await fetch('/api/change-profile', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ userId: currentUser.userId, currentPassword: currentPw, newPassword: newPw || null, name }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }

    saveSession({ userId: data.userId, name: data.name });
    updateUserInfo();
    closeProfileModal();
    loadHomeDashboard();
    alert('변경되었습니다.');
  } catch(e) { alert('서버에 연결할 수 없습니다.'); }
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

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;
  const todayDay   = now.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const MONTH_NAMES = ['','1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  // 날짜별 이벤트 매핑
  const dayEvents = {};
  ACADEMIC_SCHEDULE.forEach(e => {
    const parts = e.date.split('~');
    if (parts.length === 1) {
      const [m, d] = parts[0].split('/').map(Number);
      if (m === month) {
        if (!dayEvents[d]) dayEvents[d] = [];
        dayEvents[d].push(e);
      }
    } else {
      const [sm, sd] = parts[0].split('/').map(Number);
      const [em, ed] = parts[1].split('/').map(Number);
      const startYear = year;
      const endYear   = em < sm ? year + 1 : year;
      const startDate = new Date(startYear, sm - 1, sd);
      const endDate   = new Date(endYear,   em - 1, ed);
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month - 1, day);
        if (d >= startDate && d <= endDate) {
          if (!dayEvents[day]) dayEvents[day] = [];
          // 같은 이벤트 중복 방지
          if (!dayEvents[day].find(x => x.event === e.event)) dayEvents[day].push(e);
        }
      }
    }
  });

  // 첫째 날 요일 (월요일 기준 offset)
  const firstDow = new Date(year, month - 1, 1).getDay();
  const offset   = firstDow === 0 ? 6 : firstDow - 1;
  const DAY_LABELS = ['월','화','수','목','금','토','일'];

  let calHtml = `<div class="cal-grid">
    ${DAY_LABELS.map(l => `<div class="cal-day-label">${l}</div>`).join('')}`;

  // 이전달 날짜로 앞쪽 빈 칸 채우기
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  for (let i = 0; i < offset; i++) {
    const d = prevMonthDays - offset + 1 + i;
    const dow = i;
    let cls = 'cal-cell other-month';
    if (dow === 5) cls += ' sat';
    if (dow === 6) cls += ' sun';
    calHtml += `<div class="${cls}"><span class="cal-day-num">${d}</span></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dow    = (offset + day - 1) % 7;
    const isToday = day === todayDay;
    const events = dayEvents[day] || [];
    let cls = 'cal-cell';
    if (isToday) cls += ' today';
    if (dow === 5) cls += ' sat';
    if (dow === 6) cls += ' sun';

    calHtml += `<div class="${cls}">
      <span class="cal-day-num">${day}</span>
      ${events.map(e => `<span class="cal-event ${e.type}" title="${e.event}">${e.event}</span>`).join('')}
    </div>`;
  }

  // 다음달 날짜로 뒤쪽 빈 칸 채우기
  const totalCells = offset + daysInMonth;
  const trailing = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= trailing; i++) {
    const dow = (totalCells + i - 1) % 7;
    let cls = 'cal-cell other-month';
    if (dow === 5) cls += ' sat';
    if (dow === 6) cls += ' sun';
    calHtml += `<div class="${cls}"><span class="cal-day-num">${i}</span></div>`;
  }

  calHtml += `</div>`;

  card.innerHTML = `
    <div class="sch-month-header">
      <span class="sch-month-icon">📅</span>
      <span class="sch-month-title">${year}년 ${MONTH_NAMES[month]}</span>
    </div>
    ${calHtml}`;
}

async function loadHomeDashboard() {
  if (!currentUser) return;
  renderMonthSchedule();

  const card = document.getElementById('dashboardCard');
  if (!card) return;

  try {
    const all = (await fetchReservations()).filter(r => r.userId === currentUser.userId);

    const now     = new Date();
    const nowStr  = toDateStr(now);
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

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
let todayStr = toDateStr(new Date());
let viewDateStr = todayStr;
let weekOffset  = 0;

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

let selectedSlots = new Set(); // 선택된 시간대 인덱스 집합

function renderTimeSlots() {
  const container = document.getElementById('timeSlotBtns');
  if (!container) return;
  container.innerHTML = TIME_SLOTS.map((s, i) => `
    <button class="time-slot-btn${selectedSlots.has(i) ? ' selected' : ''}"
      onclick="selectTimeSlot(${i})">
      <span class="ts-label">${s.label}</span>
      <span class="ts-range">${s.range}</span>
    </button>`).join('');
}

function selectTimeSlot(idx) {
  if (selectedSlots.has(idx)) selectedSlots.delete(idx);
  else selectedSlots.add(idx);
  selectedSeatId = null;
  renderTimeSlots();
  renderSeatMap();
}

// ─────────────────────────────────────────────
//  예약 페이지 초기화
// ─────────────────────────────────────────────

let selectedSeatType = 'single';
let selectedSeatId   = null;
let selectedFloor    = '3';

function selectFloor(btn) {
  document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedFloor  = btn.dataset.floor;
  selectedSeatId = null;
  renderSeatMap();
}

function initReservePage() {
  todayStr        = toDateStr(new Date());
  viewDateStr     = todayStr;
  weekOffset      = 0;
  selectedSlots  = new Set([0]);
  selectedSeatId = null;

  // 학번 30600 이상이면 4층 기본, 미만이면 3층 기본
  const uid = parseInt(currentUser?.userId);
  selectedFloor = (!isNaN(uid) && uid >= 30600) ? '4' : '3';

  // 층 버튼 초기화
  document.querySelectorAll('.floor-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.floor === selectedFloor);
  });

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

  if (selectedSeatType !== 'single') {
    renderMemberFields();
  } else {
    const container = document.getElementById('memberIdsGroup');
    container.style.display = 'none';
    container.innerHTML = '';
  }
  renderSeatMap();
}

// 멤버 학번 입력 필드 렌더링 (인원수 선택 없이 바로 표시)
function renderMemberFields() {
  const container = document.getElementById('memberIdsGroup');
  const cfg = SEAT_CONFIG[selectedSeatType];

  container.innerHTML = `<div class="form-group member-ids-wrap">
    <label>멤버 학번 입력 <small>(${cfg.minPeople}인 이상)</small></label>
    ${Array.from({length: cfg.maxPeople}, (_, i) => {
      const isMe       = i === 0;
      const isRequired = i < cfg.minPeople;
      const suffix     = isMe ? ' (나)' : isRequired ? '' : ' (선택)';
      return `<div class="member-id-row">
        <span class="member-label">멤버 ${i + 1}${suffix}</span>
        <input type="number" class="member-id-input" id="memberId-${i}"
          placeholder="${isRequired ? '학번 입력' : '학번 입력 (선택)'}"
          ${isMe && currentUser ? `value="${currentUser.userId}" readonly` : ''} />
      </div>`;
    }).join('')}
  </div>`;
  container.style.display = 'block';
}

// ─────────────────────────────────────────────
//  좌석 배치도 렌더링
// ─────────────────────────────────────────────

async function renderSeatMap() {
  const map   = document.getElementById('seatMap');
  const guide = document.getElementById('seatSelectGuide');

  if (selectedSlots.size === 0) {
    guide.textContent = '시간대를 선택하세요. (여러 개 동시 선택 가능)';
    guide.style.display = 'block';
    map.innerHTML = ''; map.className = 'seat-map';
    return;
  }
  guide.style.display = 'none';

  // allReservedMap: 해당 날짜의 모든 예약 (시간 무관, 항상 표시)
  // conflictSeatIds: 선택된 시간대와 겹치는 좌석 (예약 불가)
  let allReservedMap = {};
  let conflictSeatIds = new Set();
  try {
    const all = await fetchReservations();
    all.forEach(r => {
      if (!r.cancelled && r.date === viewDateStr) {
        const matchedSlot = TIME_SLOTS.find(s => s.start === r.startTime && s.end === r.endTime);
        if (!matchedSlot) return;
        if (!allReservedMap[r.seatId]) allReservedMap[r.seatId] = [];
        allReservedMap[r.seatId].push({ userId: r.userId, memberIds: r.memberIds || [], slotLabel: matchedSlot.short });
        const inSelected = [...selectedSlots].some(i =>
          TIME_SLOTS[i].start === r.startTime && TIME_SLOTS[i].end === r.endTime
        );
        if (inSelected) conflictSeatIds.add(r.seatId);
      }
    });
  } catch(e) {
    guide.textContent = '서버에 연결할 수 없습니다.';
    guide.style.display = 'block'; return;
  }

  const isToday = viewDateStr === todayStr;

  // seatId 형식: '{floor}f-{type}-{num}'  예) '3f-single-1', '4f-quad-2'
  function seatBtn(seatId) {
    const parts = seatId.split('-');
    const type  = parts[1];   // 'single' | 'triple' | 'quad'
    const num   = parts[2];   // '1', '2', ...
    const cfg   = SEAT_CONFIG[type];
    const isActive    = type === selectedSeatType;
    const slots       = allReservedMap[seatId] || [];
    const hasAny      = slots.length > 0;
    const isConflict  = conflictSeatIds.has(seatId);
    const isSelected  = seatId === selectedSeatId;
    const isTable     = type !== 'single';

    let cls = 'seat-btn';
    if (isTable)            cls += ' table-seat';
    if (!isActive)          cls += ' other-type';
    else if (isConflict)    cls += ' reserved';
    else if (hasAny)        cls += ' reserved-other';
    else if (isSelected)    cls += ' selected';
    else                    cls += ' available';

    const clickable = isActive && !isConflict && isToday;

    let inner;
    if (hasAny) {
      inner = slots.map(slot =>
        `<div class="slot-info"><span class="slot-tag">${slot.slotLabel}</span></div>`
      ).join('');
    } else if (isTable) {
      inner = `<span class="seat-icon">${cfg.icon}</span><span>${cfg.label}</span>`;
    } else {
      inner = `<span>${num}번</span>`;
    }

    return `<button class="${cls}"
      ${clickable ? `onclick="selectSeat('${seatId}')"` : 'disabled'}
      title="${selectedFloor}층 ${cfg.label} ${num}번">
      ${inner}
    </button>`;
  }

  const f   = selectedFloor + 'f';
  let html  = '';

  // 그리드: 12열 (1-3: 단체석 영역, 4: 간격, 5-12: 개인석 영역), 5행 (1-2: 상단, 3: 간격, 4-5: 하단)
  const seats = [
    // ── 왼쪽 상단: QUAD-1 (가로형 단체석) ──
    { id: `${f}-quad-1`,    col: '1/4',   row: '1/3' },

    // ── 오른쪽 상단: 1인석 8개 한 줄 ──
    { id: `${f}-single-1`,  col: 5,       row: 1 },
    { id: `${f}-single-2`,  col: 6,       row: 1 },
    { id: `${f}-single-3`,  col: 7,       row: 1 },
    { id: `${f}-single-4`,  col: 8,       row: 1 },
    { id: `${f}-single-5`,  col: 9,       row: 1 },
    { id: `${f}-single-6`,  col: 10,      row: 1 },
    { id: `${f}-single-7`,  col: 11,      row: 1 },
    { id: `${f}-single-8`,  col: 12,      row: 1 },

    // ── 왼쪽 하단: QUAD-2 (가로형 단체석) ──
    { id: `${f}-quad-2`,    col: '1/4',   row: '4/6' },

    // ── 오른쪽 하단: 복합 배치 ──
    { id: `${f}-single-9`,  col: 5,       row: 4 },
    { id: `${f}-single-10`, col: 5,       row: 5 },
    { id: `${f}-single-11`, col: 8,       row: 4 },
    { id: `${f}-single-13`, col: 8,       row: 5 },
    { id: `${f}-single-12`, col: 9,       row: 4 },
    { id: `${f}-single-14`, col: 9,       row: 5 },
    { id: `${f}-single-15`, col: 12,      row: 4 },
    { id: `${f}-single-16`, col: 12,      row: 5 },
  ];

  seats.forEach(({ id, col, row }) => {
    html += `<div style="grid-column:${col};grid-row:${row}">${seatBtn(id)}</div>`;
  });

  // 가운데 장식용 사각형 (선택 불가 시각 요소)
  html += `<div class="deco-table" style="grid-column:6/8;grid-row:4/6"></div>`;
  html += `<div class="deco-table" style="grid-column:10/12;grid-row:4/6"></div>`;

  // 오른쪽 원형 3인석 좌석 (col 14)
  html += `<div class="circle-seat-wrap" style="grid-column:14;grid-row:1/3">${seatBtn(`${f}-triple-1`)}</div>`;
  html += `<div class="circle-seat-wrap" style="grid-column:14;grid-row:4/6">${seatBtn(`${f}-triple-2`)}</div>`;

  map.innerHTML = html;
  map.className = 'seat-map layout-grid';

  // 좌석 유형별 남은 좌석 수 업데이트
  ['single', 'triple', 'quad'].forEach(type => {
    const el = document.getElementById(`count-${type}`);
    if (!el) return;
    const total = SEAT_CONFIG[type].count;
    const floorPrefix = selectedFloor + 'f-';
    const conflictCount = [...conflictSeatIds].filter(id => id.startsWith(floorPrefix) && id.split('-')[1] === type).length;
    const available = total - conflictCount;
    el.textContent = selectedSlots.size > 0 ? `${available}/${total}석` : `${total}석`;
  });

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
  if (selectedSlots.size === 0) { alert('시간대를 선택해주세요.'); return; }

  if (selectedSeatType !== 'single') {
    const memberIds = collectMemberIds();
    if (!memberIds) return;
  }

  renderSeatMap();
  document.querySelector('.seat-map-wrap').scrollIntoView({ behavior:'smooth', block:'start' });
}

function collectMemberIds() {
  if (selectedSeatType === 'single') return [];
  const cfg = SEAT_CONFIG[selectedSeatType];
  const ids = [];
  for (let i = 0; i < cfg.maxPeople; i++) {
    const el = document.getElementById(`memberId-${i}`);
    if (!el) continue;
    const val = el.value.trim();
    if (!val) continue; // 선택 항목은 비워도 됨
    const num = parseInt(val);
    if (isNaN(num)) {
      alert(`멤버 ${i + 1}의 학번을 올바르게 입력해주세요.`); return null;
    }
    ids.push(String(num));
  }
  if (ids.length < cfg.minPeople) {
    alert(`${cfg.label}은 ${cfg.minPeople}인 이상 학번을 입력해주세요.`); return null;
  }
  if (new Set(ids).size !== ids.length) { alert('중복된 아이디가 있습니다.'); return null; }
  return ids;
}

async function confirmReservation() {
  if (!selectedSeatId)      { alert('좌석을 선택해주세요.'); return; }
  if (!currentUser)         { alert('로그인이 필요합니다.'); return; }
  if (selectedSlots.size === 0) { alert('시간대를 선택해주세요.'); return; }

  const cfg       = SEAT_CONFIG[selectedSeatType];
  const seatParts = selectedSeatId.split('-');
  const seatNum   = seatParts[2];
  let peopleCount = 1;
  let memberIds   = [];

  if (selectedSeatType !== 'single') {
    memberIds = collectMemberIds();
    if (!memberIds) return;
    peopleCount = memberIds.length;
  }

  const slotsArr = [...selectedSlots].sort().map(i => TIME_SLOTS[i]);
  const results  = [];

  for (const slot of slotsArr) {
    try {
      const res  = await fetch('/api/reservations', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          userId: currentUser.userId, name: currentUser.name,
          date: viewDateStr, startTime: slot.start, endTime: slot.end,
          seatType: selectedSeatType, seatTypeLabel: cfg.label,
          seatId: selectedSeatId, seatLabel: `${selectedFloor}층 ${seatNum}번`,
          peopleCount, memberIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 미가입 학번 오류는 즉시 중단
        if (data.type === 'unregistered') { alert(data.error); return; }
        results.push({ slot, ok: false, error: data.error || '실패' });
      }
      else         results.push({ slot, ok: true });
    } catch(e) {
      results.push({ slot, ok: false, error: '서버 연결 오류' });
    }
  }

  const ok   = results.filter(r => r.ok);
  const fail = results.filter(r => !r.ok);

  if (ok.length === 0) {
    alert(fail.map(r => `${r.slot.label}: ${r.error}`).join('\n'));
    renderSeatMap(); return;
  }

  const peopleText = selectedSeatType !== 'single'
    ? `<br/><strong>멤버</strong> ${memberIds.join(', ')}` : '';
  const failText = fail.length > 0
    ? `<br/><span style="color:var(--danger)">⚠️ 중복으로 실패: ${fail.map(r => r.slot.label).join(', ')}</span>` : '';

  document.getElementById('modalContent').innerHTML = `
    <strong>예약자</strong> ${currentUser.name} (${currentUser.userId})<br/>
    <strong>날짜</strong> ${formatDate(viewDateStr)}<br/>
    <strong>시간</strong> ${ok.map(r => r.slot.label).join(', ')}<br/>
    <strong>좌석</strong> ${selectedFloor}층 ${cfg.label} ${seatNum}번${peopleText}${failText}
  `;
  document.getElementById('modal').style.display = 'flex';
  selectedSeatId = null;
  invalidateCache();
  renderSeatMap();
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

// ─────────────────────────────────────────────
//  내 예약
// ─────────────────────────────────────────────

async function loadMyReservations() {
  if (!currentUser) return;
  const list = document.getElementById('reservationList');

  try {
    const reservations = (await fetchReservations()).filter(r => r.userId === currentUser.userId);

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
    invalidateCache();
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
    const all = await fetchReservations();
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
