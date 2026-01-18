const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const path = require('path');
const db = new Database(path.join(__dirname, '../database.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'student')) DEFAULT 'student',
    avatar_id TEXT,
    avatar_version INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    last_activity_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link TEXT,
    is_active BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    drive_link TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS student_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    student_id INTEGER,
    upload_link TEXT,
    notes TEXT,
    rating INTEGER,
    admin_notes TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id),
    FOREIGN KEY(student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    drive_link TEXT NOT NULL,
    folder_id TEXT,
    is_featured BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    drive_link TEXT NOT NULL,
    folder_id TEXT,
    is_featured BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    ip TEXT,
    type TEXT,
    username TEXT,
    password TEXT,
    status TEXT DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS folders_meta (
    id TEXT PRIMARY KEY,
    name TEXT,
    is_featured BOOLEAN DEFAULT 0,
    parent_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    options TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vote_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vote_id INTEGER,
    user_id INTEGER,
    option_index INTEGER,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vote_id) REFERENCES votes(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(vote_id, user_id)
  );
`);

// Seed Admin using PREPARED STATEMENTS to avoid syntax errors with special chars
const seedAdmin = () => {
  const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('Lloyed');
  if (!adminUser) {
    console.log("Seeding Admin User...");
    const hash = bcrypt.hashSync('root@14112009', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('Lloyed', hash, 'admin');
    console.log("Admin seeded.");
  }
};

seedAdmin();

module.exports = db;
