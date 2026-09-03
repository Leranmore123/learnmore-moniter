import path from 'path';
import fs from 'fs';

// Database file path
const DB_DIR = path.join(process.cwd(), 'data');
const SQLITE_FILE = path.join(DB_DIR, 'institute.sqlite');
const JSON_FILE = path.join(DB_DIR, 'institute_db.json');

let sqliteDbInstance: any = null;

export function getSqliteDb(): any {
  if (sqliteDbInstance) return sqliteDbInstance;

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    // Attempt to load better-sqlite3
    const Database = require('better-sqlite3');
    sqliteDbInstance = new Database(SQLITE_FILE);
    sqliteDbInstance.pragma('journal_mode = WAL');

    initSqliteTables(sqliteDbInstance);
    return sqliteDbInstance;
  } catch (err: any) {
    console.warn('⚠️ SQLite better-sqlite3 not available, fallback active:', err.message);
    return null;
  }
}

function initSqliteTables(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      name TEXT,
      email TEXT,
      role TEXT,
      password TEXT,
      phone TEXT,
      designation TEXT,
      hourly_rate REAL DEFAULT 0,
      avatar TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      name TEXT,
      course_name TEXT,
      trainer_id TEXT,
      trainer_name TEXT,
      start_date TEXT,
      total_hours REAL DEFAULT 0,
      total_students INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      batch_type TEXT DEFAULT 'training',
      is_active INTEGER DEFAULT 1,
      classroom TEXT,
      whatsapp_group_id TEXT,
      whatsapp_group_name TEXT,
      whatsapp_group_link TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT,
      batch_id TEXT,
      batch_name TEXT,
      enrollment_date TEXT
    );

    CREATE TABLE IF NOT EXISTS attendances (
      id TEXT PRIMARY KEY,
      trainer_id TEXT,
      trainer_name TEXT,
      date TEXT,
      mark_in_time TEXT,
      mark_out_time TEXT,
      working_duration TEXT,
      latitude TEXT,
      longitude TEXT,
      location_name TEXT,
      photo_in TEXT,
      photo_out TEXT,
      day_status TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      trainer_id TEXT,
      trainer_name TEXT,
      batch_id TEXT,
      batch_name TEXT,
      session_date TEXT,
      hours_taken REAL DEFAULT 0,
      description TEXT,
      selected_topics TEXT,
      students_attendance TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id TEXT PRIMARY KEY,
      trainer_id TEXT,
      trainer_name TEXT,
      leave_type TEXT,
      start_date TEXT,
      end_date TEXT,
      reason TEXT,
      status TEXT,
      applied_at TEXT,
      admin_remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS whatsapp_logs (
      id TEXT PRIMARY KEY,
      batch_id TEXT,
      batch_name TEXT,
      trainer_name TEXT,
      group_name TEXT,
      message_preview TEXT,
      status TEXT,
      sent_at TEXT
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id TEXT PRIMARY KEY,
      name TEXT,
      date TEXT,
      type TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS syllabus (
      id TEXT PRIMARY KEY,
      course_name TEXT,
      total_hours REAL DEFAULT 0,
      modules TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      trainer_id TEXT,
      trainer_name TEXT,
      title TEXT,
      category TEXT,
      start_time TEXT,
      end_time TEXT,
      duration_minutes INTEGER DEFAULT 0,
      notes TEXT,
      is_completed INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Migrate initial data from JSON if SQLite tables are empty
  try {
    const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get()?.cnt || 0;
    if (userCount === 0 && fs.existsSync(JSON_FILE)) {
      console.log('🔄 Migrating initial data from JSON to SQLite database...');
      const raw = fs.readFileSync(JSON_FILE, 'utf-8');
      const data = JSON.parse(raw);

      if (data.users && Array.isArray(data.users)) {
        const insertUser = db.prepare(`
          INSERT OR REPLACE INTO users (id, username, name, email, role, password, phone, designation, hourly_rate, avatar, created_at)
          VALUES (@id, @username, @name, @email, @role, @password, @phone, @designation, @hourly_rate, @avatar, @created_at)
        `);
        const insertMany = db.transaction((users: any[]) => {
          for (const u of users) {
            insertUser.run({
              id: u.id,
              username: u.username || u.name,
              name: u.name,
              email: u.email || '',
              role: u.role || 'trainer',
              password: u.password || '123456',
              phone: u.phone || '',
              designation: u.designation || '',
              hourly_rate: u.hourly_rate || 0,
              avatar: u.avatar || '',
              created_at: u.created_at || new Date().toISOString(),
            });
          }
        });
        insertMany(data.users);
      }

      if (data.batches && Array.isArray(data.batches)) {
        const insertBatch = db.prepare(`
          INSERT OR REPLACE INTO batches (id, name, course_name, trainer_id, trainer_name, start_date, total_hours, total_students, is_completed, batch_type, is_active, classroom, whatsapp_group_id, whatsapp_group_name, whatsapp_group_link, created_at)
          VALUES (@id, @name, @course_name, @trainer_id, @trainer_name, @start_date, @total_hours, @total_students, @is_completed, @batch_type, @is_active, @classroom, @whatsapp_group_id, @whatsapp_group_name, @whatsapp_group_link, @created_at)
        `);
        const insertManyBatches = db.transaction((batches: any[]) => {
          for (const b of batches) {
            insertBatch.run({
              id: b.id,
              name: b.name,
              course_name: b.course_name || '',
              trainer_id: b.trainer_id || '',
              trainer_name: b.trainer_name || '',
              start_date: b.start_date || '',
              total_hours: b.total_hours || 0,
              total_students: b.total_students || 0,
              is_completed: b.is_completed ? 1 : 0,
              batch_type: b.batch_type || 'training',
              is_active: b.is_active !== false ? 1 : 0,
              classroom: b.classroom || '',
              whatsapp_group_id: b.whatsapp_group_id || '',
              whatsapp_group_name: b.whatsapp_group_name || '',
              whatsapp_group_link: b.whatsapp_group_link || '',
              created_at: b.created_at || new Date().toISOString(),
            });
          }
        });
        insertManyBatches(data.batches);
      }

      if (data.attendances && Array.isArray(data.attendances)) {
        const insertAtt = db.prepare(`
          INSERT OR REPLACE INTO attendances (id, trainer_id, trainer_name, date, mark_in_time, mark_out_time, working_duration, latitude, longitude, location_name, photo_in, photo_out, day_status, created_at)
          VALUES (@id, @trainer_id, @trainer_name, @date, @mark_in_time, @mark_out_time, @working_duration, @latitude, @longitude, @location_name, @photo_in, @photo_out, @day_status, @created_at)
        `);
        const insertManyAtt = db.transaction((atts: any[]) => {
          for (const a of atts) {
            insertAtt.run({
              id: a.id,
              trainer_id: a.trainer_id,
              trainer_name: a.trainer_name || '',
              date: a.date,
              mark_in_time: a.mark_in_time || null,
              mark_out_time: a.mark_out_time || null,
              working_duration: a.working_duration || '',
              latitude: a.latitude ? String(a.latitude) : '',
              longitude: a.longitude ? String(a.longitude) : '',
              location_name: a.location_name || '',
              photo_in: a.photo_in || '',
              photo_out: a.photo_out || '',
              day_status: a.day_status || 'present',
              created_at: a.created_at || new Date().toISOString(),
            });
          }
        });
        insertManyAtt(data.attendances);
      }

      console.log('✅ SQLite Initial Migration Completed Successfully!');
    }
  } catch (err: any) {
    console.error('Migration note:', err.message);
  }
}
