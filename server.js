const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// ── 스토리지: Vercel이면 Upstash Redis, 로컬이면 파일 ──
const isVercel = !!process.env.VERCEL;

let redis;
if (isVercel) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const fs = require('fs');
const DB_FILE    = path.join(__dirname, 'reservations.json');
const USERS_FILE = path.join(__dirname, 'users.json');

if (!isVercel) {
  if (!fs.existsSync(DB_FILE))    fs.writeFileSync(DB_FILE,    '[]');
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}');
}

async function readDB() {
  if (isVercel) return (await redis.get('reservations')) || [];
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
async function writeDB(d) {
  if (isVercel) { await redis.set('reservations', d); return; }
  fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2));
}
async function readUsers() {
  if (isVercel) return (await redis.get('users')) || {};
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}
async function writeUsers(d) {
  if (isVercel) { await redis.set('users', d); return; }
  fs.writeFileSync(USERS_FILE, JSON.stringify(d, null, 2));
}

// ── 로그인 ──
app.post('/api/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    const id = String(userId).trim();
    if (!id || isNaN(parseInt(id)))
      return res.status(400).json({ error: '학번을 올바르게 입력해주세요.' });

    const users = await readUsers();
    if (!users[id]) {
      if (password !== '0000')
        return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
      return res.json({ userId: id, isFirstLogin: true, name: '' });
    }
    if (users[id].password !== password)
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    return res.json({ userId: id, isFirstLogin: false, name: users[id].name });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ── 프로필 설정 ──
app.post('/api/setup-profile', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, name } = req.body;
    const id = String(userId);
    if (!newPassword || newPassword.length < 4)
      return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다.' });
    if (!name || !name.trim())
      return res.status(400).json({ error: '이름을 입력해주세요.' });

    const users = await readUsers();
    const expected = users[id] ? users[id].password : '0000';
    if (currentPassword !== expected)
      return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });

    users[id] = { password: newPassword, name: name.trim() };
    await writeUsers(users);
    return res.json({ userId: id, name: name.trim() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ── 프로필 변경 ──
app.post('/api/change-profile', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, name } = req.body;
    const id = String(userId);
    if (!name || !name.trim())
      return res.status(400).json({ error: '이름을 입력해주세요.' });

    const users = await readUsers();
    if (!users[id]) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    if (users[id].password !== currentPassword)
      return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
    if (newPassword && newPassword.length < 4)
      return res.status(400).json({ error: '새 비밀번호는 4자 이상이어야 합니다.' });

    users[id].name = name.trim();
    if (newPassword) users[id].password = newPassword;
    await writeUsers(users);
    return res.json({ userId: id, name: users[id].name });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ── 예약 조회 ──
app.get('/api/reservations', async (req, res) => {
  try {
    let list = await readDB();
    if (req.query.userId) list = list.filter(r => r.userId === req.query.userId);
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ── 예약 생성 ──
app.post('/api/reservations', async (req, res) => {
  try {
    const { userId, name, date, startTime, endTime, seatType, seatTypeLabel, seatId, seatLabel, peopleCount, memberIds } = req.body;
    if (!userId || !date || !startTime || !endTime || !seatId)
      return res.status(400).json({ error: '필수 항목 누락' });

    const [list, users] = await Promise.all([readDB(), readUsers()]);

    // 3/4인석: 멤버 학번이 가입된 계정인지 검증
    if (seatType === 'triple' || seatType === 'quad') {
      const ids = (memberIds && memberIds.length > 0) ? memberIds : [userId];
      for (const id of ids) {
        if (!users[id]) {
          return res.status(400).json({ error: `${id}는 가입되지 않은 학번입니다.`, type: 'unregistered', conflictId: id });
        }
      }
    }

    // 같은 좌석 + 같은 시간 → 중복 차단
    const seatConflict = list.find(r =>
      !r.cancelled && r.date === date && r.seatId === seatId &&
      r.startTime === startTime && r.endTime === endTime
    );
    if (seatConflict) return res.status(409).json({ error: '이미 예약된 좌석입니다.', type: 'seat' });

    // 같은 사람 + 같은 시간 → 중복 차단 (다른 시간대는 허용 = 연속 예약 가능)
    const allIds = (memberIds && memberIds.length > 0) ? memberIds : [userId];
    for (const id of allIds) {
      const userConflict = list.find(r => {
        if (r.cancelled || r.date !== date || r.startTime !== startTime || r.endTime !== endTime) return false;
        const existingIds = (r.memberIds && r.memberIds.length > 0) ? r.memberIds : [r.userId];
        return existingIds.includes(id);
      });
      if (userConflict) {
        return res.status(409).json({ error: `${id}는 이미 해당 시간에 예약이 있습니다.`, type: 'user', conflictId: id });
      }
    }

    const reservation = {
      id: Date.now().toString(),
      userId, name, date, startTime, endTime,
      seatType, seatTypeLabel, seatId, seatLabel, peopleCount,
      memberIds: memberIds || [],
      cancelled: false, createdAt: new Date().toISOString(),
    };
    list.push(reservation);
    await writeDB(list);
    res.status(201).json(reservation);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ── 예약 취소 ──
app.patch('/api/reservations/:id/cancel', async (req, res) => {
  try {
    const list = await readDB();
    const r = list.find(r => r.id === req.params.id);
    if (!r) return res.status(404).json({ error: '없음' });
    r.cancelled = true;
    await writeDB(list);
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  });
}
