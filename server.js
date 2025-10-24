const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'exam_planning'
};

async function getDbConnection() {
  return await mysql.createConnection(dbConfig);
}

// -------------------- COURSES --------------------
app.get('/courses', async (req, res) => {
  const { branch, semester } = req.query;
  const db = await getDbConnection();
  let sql = "SELECT * FROM courses WHERE 1";
  const params = [];
  if (branch) { sql += " AND branch=?"; params.push(branch); }
  if (semester) { sql += " AND semester=?"; params.push(Number(semester)); }
  sql += " ORDER BY branch, semester, code";
  const [rows] = await db.query(sql, params);
  res.json(rows);
  db.end();
});

app.post('/courses', async (req, res) => {
  const { name, code, branch, semester } = req.body;
  if (!name || !code || !branch || !semester)
    return res.status(400).json({ error: 'All fields required' });
  const db = await getDbConnection();
  const [result] = await db.query(
    'INSERT INTO courses (name, code, branch, semester) VALUES (?, ?, ?, ?)',
    [name, code, branch, Number(semester)]
  );
  res.json({ id: result.insertId, name, code, branch, semester });
  db.end();
});

// -------------------- EXAMS --------------------
app.get('/exams', async (req, res) => {
  const db = await getDbConnection();
  const [rows] = await db.query(
    `SELECT e.id, c.name AS course_name, c.branch, c.semester, e.exam_date, e.start_time, e.end_time
     FROM exams e JOIN courses c ON e.course_id=c.id ORDER BY e.exam_date, c.branch`
  );
  res.json(rows);
  db.end();
});

app.post('/exams', async (req, res) => {
  const { course_id, exam_date, start_time, end_time } = req.body;
  if (!course_id || !exam_date || !start_time || !end_time)
    return res.status(400).json({ error: 'All fields required' });
  const db = await getDbConnection();
  const [result] = await db.query(
    'INSERT INTO exams (course_id, exam_date, start_time, end_time) VALUES (?, ?, ?, ?)',
    [course_id, exam_date, start_time, end_time]
  );
  res.json({ id: result.insertId, course_id, exam_date, start_time, end_time });
  db.end();
});

// -------------------- STUDENTS --------------------
app.get('/students', async (req, res) => {
  const { branch, semester, odd_even } = req.query;
  const db = await getDbConnection();
  let sql = "SELECT id, name, usn, branch, semester FROM users WHERE role='student'";
  const params = [];
  if (branch) { sql += " AND branch=?"; params.push(branch); }
  if (semester) { sql += " AND semester=?"; params.push(Number(semester)); }
  if (odd_even) {
    if (odd_even.toLowerCase() === 'odd') sql += " AND semester % 2 = 1";
    else if (odd_even.toLowerCase() === 'even') sql += " AND semester % 2 = 0";
  }
  sql += " ORDER BY branch, semester, usn";
  const [rows] = await db.query(sql, params);
  res.json(rows);
  db.end();
});

// -------------------- ROOMS --------------------
app.post('/rooms', async (req, res) => {
  const { name, capacity } = req.body;
  if (!name || !capacity) return res.status(400).json({ error: 'All fields required' });
  const db = await getDbConnection();
  const [result] = await db.query('INSERT INTO rooms (name, capacity) VALUES (?, ?)', [name, Number(capacity)]);
  res.json({ id: result.insertId, name, capacity });
  db.end();
});

app.get('/rooms', async (req, res) => {
  const db = await getDbConnection();
  const [rows] = await db.query('SELECT * FROM rooms ORDER BY capacity DESC');
  res.json(rows);
  db.end();
});

// -------------------- SMART AUTO SEAT ALLOCATION --------------------
app.post('/auto-allocate', async (req, res) => {
  const { exam_id } = req.body;
  if (!exam_id) return res.status(400).json({ error: 'Exam ID required' });
  const db = await getDbConnection();

  try {
    const [[course]] = await db.query(
      `SELECT c.branch, c.semester, c.name AS course_name FROM exams e 
       JOIN courses c ON e.course_id = c.id WHERE e.id = ?`,
      [exam_id]
    );

    if (!course) return res.status(404).json({ error: 'Exam not found' });

    const [students] = await db.query(
      `SELECT id, name, usn, branch, semester 
       FROM users WHERE role='student' AND semester = ? ORDER BY branch, usn`,
      [course.semester]
    );

    if (!students.length) return res.status(400).json({ error: 'No students found for that semester' });

    const [rooms] = await db.query('SELECT * FROM rooms ORDER BY capacity DESC');
    if (!rooms.length) return res.status(400).json({ error: 'No rooms available' });

    let roomIndex = 0;
    let seatNumber = 1;
    const roomMix = {};

    for (let student of students) {
      const room = rooms[roomIndex];
      if (!roomMix[room.id]) roomMix[room.id] = new Set();
      roomMix[room.id].add(student.branch);

      if (roomMix[room.id].size > 2) {
        roomIndex++;
        seatNumber = 1;
        if (roomIndex >= rooms.length) throw new Error('Not enough rooms for 2-branch mix rule');
        roomMix[rooms[roomIndex].id] = new Set([student.branch]);
      }

      await db.query(
        'INSERT INTO seat_assignments (exam_id, room_id, seat_number, student_id) VALUES (?, ?, ?, ?)',
        [exam_id, room.id, seatNumber, student.id]
      );

      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [student.id, `Seat assigned for ${course.course_name}: Room ${room.name}, Seat ${seatNumber}`]
      );

      seatNumber++;
      if (seatNumber > room.capacity) {
        roomIndex++;
        seatNumber = 1;
        if (roomIndex >= rooms.length)
          throw new Error('Not enough room capacity to allocate all students');
      }
    }

    res.json({ message: '✅ Smart seat allocation done successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    db.end();
  }
});

// -------------------- EXPORT SEAT PLAN --------------------
app.get('/export-seats', async (req, res) => {
  const { exam_id } = req.query;
  if (!exam_id) return res.status(400).json({ error: 'Exam ID required' });
  const db = await getDbConnection();

  try {
    const [rows] = await db.query(
      `SELECT u.name AS student_name, u.usn, u.branch, u.semester,
              c.name AS course_name, e.exam_date, e.start_time, e.end_time,
              r.name AS room_name, sa.seat_number
       FROM seat_assignments sa
       JOIN users u ON sa.student_id = u.id
       JOIN exams e ON sa.exam_id = e.id
       JOIN courses c ON e.course_id = c.id
       JOIN rooms r ON sa.room_id = r.id
       WHERE e.id = ?
       ORDER BY r.name, sa.seat_number`,
      [exam_id]
    );

    if (!rows.length) return res.status(404).json({ error: 'No seat data found' });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SeatPlan');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="seat_plan.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Error exporting seat plan' });
  } finally {
    db.end();
  }
});

// -------------------- NOTIFICATIONS --------------------
app.get('/notifications/:user_id', async (req, res) => {
  const db = await getDbConnection();
  const { user_id } = req.params;
  const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
  res.json(rows);
  db.end();
});

// -------------------- STUDENT SEAT ASSIGNMENTS --------------------
app.get('/seat-assignments/:student_id', async (req, res) => {
  const { student_id } = req.params;
  const db = await getDbConnection();
  const [rows] = await db.query(
    `SELECT sa.seat_number, r.name AS room_name, e.exam_date, e.start_time, e.end_time, c.name AS course_name
     FROM seat_assignments sa
     JOIN rooms r ON sa.room_id = r.id
     JOIN exams e ON sa.exam_id = e.id
     JOIN courses c ON e.course_id = c.id
     WHERE sa.student_id = ?`,
    [student_id]
  );
  res.json(rows);
  db.end();
});

// -------------------- STUDENT BULK UPLOAD --------------------
const upload = multer({ dest: 'uploads/' });
app.post('/upload-students', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filePath = req.file.path;
  let data = [];

  try {
    const workbook = XLSX.readFile(filePath);
    data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  } catch (err) {
    console.error('Excel read error:', err);
    return res.status(400).json({ error: 'Invalid Excel file' });
  }

  if (!data.length) return res.status(400).json({ error: 'Empty or invalid file' });

  const db = await getDbConnection();
  let inserted = 0, skipped = 0;

  try {
    for (let row of data) {
      const { name, usn, password, branch, semester } = row;
      if (!name || !usn || !password || !branch || !semester) {
        skipped++;
        continue;
      }
      try {
        await db.query(
          'INSERT IGNORE INTO users (name, usn, password, role, branch, semester) VALUES (?, ?, ?, ?, ?, ?)',
          [name, usn, password, 'student', branch, Number(semester)]
        );
        inserted++;
      } catch {
        skipped++;
      }
    }

    res.json({ message: `Upload complete: ${inserted} inserted, ${skipped} skipped.` });
  } finally {
    db.end();
    fs.unlinkSync(filePath);
  }
});

// -------------------- FRONTEND --------------------
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/student.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'student.html')));

// -------------------- START SERVER --------------------
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
