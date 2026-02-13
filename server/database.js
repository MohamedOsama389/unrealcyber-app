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
    private_access INTEGER DEFAULT 0,
    display_name TEXT,
    avatar_url TEXT,
    avatar_id TEXT,
    avatar_version INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    last_activity_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Migration to ensure password column exists (for old DBs)
`);

// Migration to ensure password column exists (for old DBs)
try { db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT 'unreal_cyber_default'"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN display_name TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN private_access INTEGER DEFAULT 0"); } catch (e) { }

db.exec(`

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
    resources TEXT,
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

  CREATE TABLE IF NOT EXISTS public_telegram_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS telegram_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    website_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(website_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS telegram_login_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
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

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT 0,
    type TEXT CHECK(type IN ('personal', 'general')) DEFAULT 'personal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS todo_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER,
    user_id INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(todo_id) REFERENCES todos(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(todo_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS labs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_link TEXT,
    drive_link TEXT,
    file_id TEXT,
    video_link TEXT,
    extra_files TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS track_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    type TEXT CHECK(type IN ('video', 'quiz', 'lab', 'text')) NOT NULL,
    content_id TEXT, 
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(track_id) REFERENCES tracks(id)
  );

  CREATE TABLE IF NOT EXISTS track_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    step_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('locked', 'unlocked', 'completed')) DEFAULT 'locked',
    completed_at TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(step_id) REFERENCES track_steps(id),
    UNIQUE(user_id, step_id)
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    questions_json TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    quiz_id INTEGER,
    score INTEGER,
    passed BOOLEAN,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
  );
`);

// MIGRATIONS: Add missing columns if they don't exist
const ensureColumn = (tableName, columnName, definition) => {
  try {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    console.log(`[Migration] Added column ${columnName} to ${tableName}.`);
  } catch (e) {
    if (e.message.includes('duplicate column name')) {
      // Column already exists, ignore
    } else {
      console.error(`Migration error on ${tableName}.${columnName}:`, e.message);
    }
  }
};

ensureColumn('users', 'avatar_id', 'TEXT');
ensureColumn('users', 'avatar_version', 'INTEGER DEFAULT 0');
ensureColumn('users', 'streak_count', 'INTEGER DEFAULT 0');
ensureColumn('users', 'last_activity_date', 'TEXT');
ensureColumn('users', 'display_name', 'TEXT');
ensureColumn('users', 'avatar_url', 'TEXT');
ensureColumn('users', 'private_access', 'INTEGER DEFAULT 0');

ensureColumn('tasks', 'notes', 'TEXT');

// Labs enhancements
ensureColumn('labs', 'video_link', 'TEXT');
ensureColumn('labs', 'extra_files', 'TEXT'); // JSON array of supporting files { id, name, webViewLink }
ensureColumn('videos', 'folder_id', 'TEXT');
ensureColumn('videos', 'resources', 'TEXT');
ensureColumn('files', 'folder_id', 'TEXT');

// Seed Admin using PREPARED STATEMENTS to avoid syntax errors with special chars
const seedAdmin = () => {
  try {
    const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('Lloyed');
    if (!adminUser) {
      console.log("Seeding Admin User...");
      const hash = bcrypt.hashSync('root@14112009', 10);
      db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('Lloyed', hash, 'admin');
      console.log("Admin seeded.");
    }
  } catch (err) {
    console.error("Seeding error (Admin might already exist):", err.message);
  }
};

seedAdmin();

module.exports = db;
