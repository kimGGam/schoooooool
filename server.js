const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE    = path.join(__dirname, 'reservations.json');
const USERS_FILE = path.join(__dirname, 'users.json');

if (!fs.existsSync(DB_FILE))    fs.writeFileSync(DB_FILE,    '[]');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}');

function readDB()     { return JSON.parse(fs.readFileSync(DB_FILE,    'utf-8')); }
function writeDB(d)   { fs.writeFileSync(DB_FILE,    JSON.stringify(d, null, 2)); }
function readUsers()  { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); }
function writeUsers(d){ fs.writeFileSync(USERS_FILE, JSON.stringify(d, null, 2)); }

app.use(express.json());
app.use(express.static(__dirname));

// ── 로그인 ──
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;
  const id = String(userId);
  const num = parseInt(id);
  if (isNaN(num) || num < 10000 || num > 40000)
    return res.status(400).json({ error: '아이디는 10000~40000 사이여야 합니다.' });

  const users = readUsers();
  if (!users[id]) {
    if (password !== '0000')
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    return res.json({ userId: id, isFirstLogin: true, name: '' });
  }
  if (users[id].password !== password)
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  return res.json({ userId: id, isFirstLogin: false, name: users[id].name });
});

// ── 프로필 설정 ──
app.post('/api/setup-profile', (req, res) => {
  const { userId, currentPassword, newPassword, name } = req.body;
  const id = String(userId);
  if (!newPassword || newPassword.length < 4)
    return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다.' });
  if (!name || !name.trim())
    return res.status(400).json({ error: '이름을 입력해주세요.' });

  const users = readUsers();
  const expected = users[id] ? users[id].password : '0000';
  if (currentPassword !== expected)
    return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });

  users[id] = { password: newPassword, name: name.trim() };
  writeUsers(users);
  return res.json({ userId: id, name: name.trim() });
});

// ── 예약 조회 ──
app.get('/api/reservations', (req, res) => {
  let list = readDB();
  if (req.query.userId) list = list.filter(r => r.userId === req.query.userId);
  res.json(list);
});

// ── 예약 생성 ──
app.post('/api/reservations', (req, res) => {
  const { userId, name, date, startTime, endTime, seatType, seatTypeLabel, seatId, seatLabel, peopleCount, memberIds } = req.body;
  if (!userId || !date || !startTime || !endTime || !seatId)
    return res.status(400).json({ error: '필수 항목 누락' });

  const list = readDB();

  // 좌석 중복 체크
  const seatConflict = list.find(r =>
    !r.cancelled && r.date === date && r.seatId === seatId &&
    r.startTime === startTime && r.endTime === endTime
  );
  if (seatConflict) return res.status(409).json({ error: '이미 예약된 좌석입니다.', type: 'seat' });

  // 사람 중복 체크 (멤버 포함)
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
  writeDB(list);
  res.status(201).json(reservation);
});

// ── 예약 취소 ──
app.patch('/api/reservations/:id/cancel', (req, res) => {
  const list = readDB();
  const r = list.find(r => r.id === req.params.id);
  if (!r) return res.status(404).json({ error: '없음' });
  r.cancelled = true;
  writeDB(list);
  res.json(r);
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  console.log(`   같은 네트워크: 내 IP:${PORT}`);
});
