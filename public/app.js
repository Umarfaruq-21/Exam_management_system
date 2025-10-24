const API_URL = 'http://localhost:3000';

// ----------------- LOAD DATA FUNCTIONS -----------------

// Load courses with branch + semester filters
async function loadCourses(branch = '', semester = '') {
  let url = `${API_URL}/courses`;
  const params = [];
  if (branch) params.push(`branch=${branch}`);
  if (semester) params.push(`semester=${semester}`);
  if (params.length) url += '?' + params.join('&');

  const res = await fetch(url);
  const courses = await res.json();
  const coursesList = document.getElementById('coursesList');
  const examCourse = document.getElementById('examCourse');
  const assignExam = document.getElementById('assignExam');

  coursesList.innerHTML = '';
  examCourse.innerHTML = '';
  assignExam.innerHTML = '';

  courses.forEach(c => {
    const li = document.createElement('li');
    li.textContent = `${c.name} (${c.code}) - ${c.branch} Sem ${c.semester}`;
    coursesList.appendChild(li);

    const option1 = document.createElement('option');
    option1.value = c.id; 
    option1.textContent = `${c.name} (${c.branch} Sem ${c.semester})`;
    examCourse?.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = c.id;
    option2.textContent = `${c.name} (${c.branch} Sem ${c.semester})`;
    assignExam?.appendChild(option2);
  });
}

// Load exams
async function loadExams() {
  const res = await fetch(`${API_URL}/exams`);
  const exams = await res.json();
  const examsList = document.getElementById('examsList');
  const assignExam = document.getElementById('assignExam');

  examsList.innerHTML = '';
  assignExam.innerHTML = '';

  exams.forEach(e => {
    const li = document.createElement('li');
    li.textContent = `${e.course_name} - ${e.exam_date} (${e.start_time} to ${e.end_time})`;
    examsList.appendChild(li);

    const option = document.createElement('option');
    option.value = e.id;
    option.textContent = `${e.course_name} - ${e.exam_date}`;
    assignExam?.appendChild(option);
  });
}

// Load rooms
async function loadRooms() {
  const res = await fetch(`${API_URL}/rooms`);
  const rooms = await res.json();
  const roomsList = document.getElementById('roomsList');
  roomsList.innerHTML = '';
  rooms.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${r.name} (Capacity: ${r.capacity})`;
    roomsList.appendChild(li);
  });
}

// Load students with filters
async function loadStudents(branch = '', semester = '', odd_even = '') {
  let url = `${API_URL}/students`;
  const params = [];
  if (branch) params.push(`branch=${branch}`);
  if (semester) params.push(`semester=${semester}`);
  if (odd_even) params.push(`odd_even=${odd_even}`);
  if (params.length) url += '?' + params.join('&');

  const res = await fetch(url);
  const students = await res.json();
  const ul = document.getElementById('studentsList');
  ul.innerHTML = '';
  students.forEach(s => {
    const li = document.createElement('li');
    li.textContent = `${s.usn} - ${s.name} (${s.branch} Sem ${s.semester})`;
    ul.appendChild(li);
  });
}

// ----------------- EVENT LISTENERS -----------------

// Panel buttons navigation
document.querySelectorAll('.panel-btn').forEach(panel => {
  panel.addEventListener('click', async () => {
    const targetId = panel.getAttribute('data-target');
    document.querySelectorAll('.dashboard-section').forEach(sec => sec.style.display = 'none');
    const section = document.getElementById(targetId);
    if(section) section.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch(targetId) {
      case 'coursesSection': loadCourses(); break;
      case 'examsSection': loadCourses(); loadExams(); break;
      case 'roomsSection': loadRooms(); break;
      case 'seatAssignSection': loadExams(); break;
      case 'studentsSection': loadStudents(); break;
    }
  });
});

// Add course
document.getElementById('courseForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('courseName').value;
  const code = document.getElementById('courseCode').value;
  const branch = document.getElementById('courseBranch').value;
  const semester = document.getElementById('courseSemester').value;

  await fetch(`${API_URL}/courses`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({name, code, branch, semester})
  });

  e.target.reset();
  loadCourses();
});

// Add exam
document.getElementById('examForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const course_id = document.getElementById('examCourse').value;
  const exam_date = document.getElementById('examDate').value;
  const start_time = document.getElementById('startTime').value;
  const end_time = document.getElementById('endTime').value;

  await fetch(`${API_URL}/exams`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({course_id, exam_date, start_time, end_time})
  });

  e.target.reset();
  loadExams();
});

// Add room
document.getElementById('roomForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('roomName').value;
  const capacity = document.getElementById('roomCapacity').value;

  await fetch(`${API_URL}/rooms`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({name, capacity})
  });

  e.target.reset();
  loadRooms();
});

// Assign seats
document.getElementById('assignSeatsBtn')?.addEventListener('click', async () => {
  const exam_id = document.getElementById('assignExam').value;
  if (!exam_id) return alert('Select an exam');

  try {
    const res = await fetch(`${API_URL}/auto-allocate`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ exam_id })
    });
    const data = await res.json();
    if (res.ok) alert(data.message);
    else alert(data.error);
  } catch (err) {
    console.error(err);
    alert('Seat assignment failed');
  }
});

// Export seating plan
document.getElementById('exportBtn')?.addEventListener('click', async () => {
  const exam_id = document.getElementById('assignExam').value;
  if (!exam_id) return alert('Select an exam');

  window.open(`${API_URL}/export-seats?exam_id=${exam_id}`, '_blank');
});

// Filter students
document.getElementById('filterStudents')?.addEventListener('click', (e) => {
  e.preventDefault();
  const branch = document.getElementById('studentBranch').value;
  const sem = document.getElementById('studentSemester').value;
  const odd_even = document.getElementById('studentOddEven')?.value || '';
  loadStudents(branch, sem, odd_even);
});

// Upload students
document.getElementById('uploadStudentsForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const fileInput = document.getElementById('studentsFile');
  if (!fileInput.files.length) return alert('Select a file');

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    const res = await fetch(`${API_URL}/upload-students`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok) alert(data.message);
    else alert(data.error || 'Upload failed');
    fileInput.value = '';
    loadStudents();
  } catch (err) {
    console.error(err);
    alert('Server error during upload');
  }
});
