🎓 Exam Planning and Seat Allocation System

![Node.js](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue?logo=mysql)
![HTML5](https://img.shields.io/badge/Frontend-HTML%2C%20CSS%2C%20JS-orange?logo=html5)
![License](https://img.shields.io/badge/License-MIT-brightgreen)

> A complete web-based platform for managing college exam planning, seat assignments, and exam scheduling efficiently for all branches and semesters.

🏫 Overview

The Exam Planning and Seat Allocation System simplifies the process of creating exam timetables, allocating rooms, and assigning seats to students — all from an interactive **Admin Dashboard**.  
Students can log in to view their **exam schedules**, **seat numbers**, and **notifications** in real-time.

🌍 Live Demo
[View Deployed App](https://exam-project-goar5rn57-umarfaruqvercel-projects.vercel.app ))

🚀 Features

👨‍💼 Admin Dashboard
- Create & manage courses, rooms, and exams.
- Semester-wise course management for all branches.
- Schedule exams with date & time for each course.
- Assign seats easily — supports mixing semesters in the same room.
- Upload student lists via Excel/CSV.
- Export seat assignments to Excel for offline record keeping.
- Clean, responsive, and user-friendly interface.

🎓 Student Dashboard
- View personalized =exam schedule and seat details.
- Access room, date, time and seat number.
- Stay updated via the notification system.

🧱 Project Structure

exam_planning/
├── server.js                # Express backend (API + routes)
├── app.js                   # Frontend logic and API interactions
├── db.sql                   # MySQL schema (database setup)
├── index.html               # Admin dashboard
├── student.html             # Student dashboard
├── styles.css               # Stylesheet for both dashboards
├── package.json             # Project dependencies
└── uploads/                 # Excel uploads folder (auto-created)

🗄️ Database Schema (MySQL)

Database: `exam_planning`

| Table | Description |
|-------|--------------|
| `users` | Stores admin and student data (id, name, role, branch, semester, USN) |
| `courses` | Course information linked to branch & semester |
| `exams` | Exam schedule (course_id, date, start_time, end_time) |
| `rooms` | Exam rooms and capacities |
| `seat_assignments` | Seat mapping for each student and exam |
| `notifications` | Student messages and updates |


⚙️ Installation & Setup

1️⃣ Prerequisites
- [Node.js](https://nodejs.org/en/download/) (v16+)
- [MySQL](https://www.mysql.com/downloads/)
- npm (comes with Node.js)

2️⃣ Clone and Install
bash
git clone https://github.com/yourusername/exam-planning-system.git
cd exam-planning-system
npm install

3️⃣ Setup Database

Run this SQL script inside MySQL or phpMyAdmin:

sql
SOURCE db.sql;

This creates the database `exam_planning` and all required tables.


4️⃣ Configure Database Credentials

Edit your `server.js` file:

js
const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'exam_planning'
});

5️⃣ Run the Server

bash
node server.js

Server will start on
👉 `http://localhost:3000`

6️⃣ Open the App

Admin Dashboard: `index.html`
Student Dashboard: `student.html`

Make sure your `app.js` file uses the correct API endpoint (default: `http://localhost:3000`).

📄 Usage Flow

👨‍💼 Admin

1. Add Courses by branch and semester.
2. Schedule Exams with course, date, and time.
3. Add Rooms and define capacities.
4. Upload Students list from Excel/CSV.
5. Assign Seats → choose exam and mix semesters if needed.
6. Export seat assignment list to Excel.

🎓 Student

1. Enter USN to load details.
2. View exam schedule, date, room, and seat.
3. See notifications (if enabled).

🧩 Tech Stack

| Layer             | Technology                    |
| ----------------- | ----------------------------- |
| **Frontend**      | HTML5, CSS3, JavaScript       |
| **Backend**       | Node.js, Express.js           |
| **Database**      | MySQL                         |
| **File Handling** | Multer + XLSX                 |
| **Styling**       | Responsive, modern CSS layout |
| **Export**        | XLSX (Excel download)         |

📦 Dependencies

json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.9.3",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "multer": "^1.4.5-lts.1",
    "xlsx": "^0.18.5"
  }
}

🧠 Future Enhancements

* ✅ Role-based authentication (Admin / Student login system)
* ✅ Automated conflict detection while scheduling exams
* ✅ Smart seat allocation algorithm
* ✅ Dynamic notifications and live status updates
* ✅ Drag-and-drop seat planner UI for admins

🧑‍💻 Author

👨‍💻 Developer: [Umarfaruq](https://github.com/umarfaruq-21)
📚 Project: "Exam Planning and Seat Allocation System"
💻 Tech Stack: Node.js, Express, MySQL, HTML, CSS, JS
🗓️ Year: 2025

