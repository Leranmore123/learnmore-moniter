import fs from 'fs';
import path from 'path';
import {
  User,
  Batch,
  WorkSession,
  TrainerAttendance,
  Leave,
  LiveActivity,
  TaskLog,
  IncentiveReport,
  TeacherActivityStatus,
  WhatsAppBroadcastLog,
  Student,
  StudentAttendanceRecord,
  TrainerLeaveBalance,
  LeaveAuditLog,
  HolidayConfig,
  TopicCoverageProgress,
  TrainerMonitoringRow,
  TrainerLiveLoginStatus
} from './types';
import {
  OPTIONAL_HOLIDAY_LIMIT_PER_YEAR,
  CASUAL_LEAVE_LIMIT_PER_MONTH,
  MANDATORY_HOLIDAYS_2026,
  OPTIONAL_HOLIDAYS_2026,
  CASUAL_SICK_LEAVE_ANNUAL_QUOTA,
  isDateWeekOff,
  isDateHoliday
} from './holidays';
import { INSTITUTE_COURSES } from './syllabusData';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'institute_db.json');

interface DatabaseSchema {
  users: User[];
  batches: Batch[];
  sessions: WorkSession[];
  attendances: TrainerAttendance[];
  leaves: Leave[];
  liveActivities: Record<string, LiveActivity>;
  taskLogs: TaskLog[];
  whatsappLogs?: WhatsAppBroadcastLog[];
  students?: Student[];
  leaveBalances?: Record<string, TrainerLeaveBalance>;
  leaveAuditLogs?: LeaveAuditLog[];
  holidayConfig?: HolidayConfig;
}

function getInitialData(): DatabaseSchema {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const users: User[] = [
    {
      id: 'usr_admin',
      username: 'admin',
      name: 'Institute Director (Admin)',
      email: 'admin@institute.edu',
      role: 'admin',
      password: 'admin',
      phone: '+91 98765 43210',
      designation: 'Director / Management',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      created_at: new Date(2025, 0, 1).toISOString(),
    },
    {
      id: 'usr_trainer_1',
      username: 'rahul.sharma',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@institute.edu',
      role: 'trainer',
      password: 'trainer',
      phone: '+91 98220 11223',
      designation: 'Senior Full-Stack Trainer',
      hourly_rate: 600,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      created_at: new Date(2025, 0, 15).toISOString(),
    },
    {
      id: 'usr_trainer_2',
      username: 'priya.patel',
      name: 'Priya Patel',
      email: 'priya.patel@institute.edu',
      role: 'trainer',
      password: 'trainer',
      phone: '+91 98980 33445',
      designation: 'Python & Data Science Trainer',
      hourly_rate: 550,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      created_at: new Date(2025, 1, 1).toISOString(),
    },
    {
      id: 'usr_trainer_3',
      username: 'amit.verma',
      name: 'Amit Verma',
      email: 'amit.verma@institute.edu',
      role: 'trainer',
      password: 'trainer',
      phone: '+91 97123 55667',
      designation: 'UI/UX & Frontend Trainer',
      hourly_rate: 500,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      created_at: new Date(2025, 2, 10).toISOString(),
    },
  ];

  const batches: Batch[] = [
    {
      id: 'btc_1',
      name: 'MERN Stack - Morning Batch A',
      course_id: 'course_mern',
      course_name: 'MERN Stack Developer Syllabus',
      trainer_id: 'usr_trainer_1',
      trainer_name: 'Rahul Sharma',
      start_date: '2026-08-01',
      total_hours: 60,
      total_students: 18,
      is_completed: false,
      batch_type: 'training',
      is_active: true,
      created_at: '2026-08-01T08:00:00Z',
    },
    {
      id: 'btc_sql',
      name: 'SQL & Database Engineering - Morning Batch',
      course_id: 'course_sql',
      course_name: 'SQL Course Syllabus',
      trainer_id: 'usr_trainer_1',
      trainer_name: 'Rahul Sharma',
      start_date: '2026-08-15',
      total_hours: 40,
      total_students: 15,
      is_completed: false,
      batch_type: 'training',
      is_active: true,
      created_at: '2026-08-15T09:00:00Z',
    },
    {
      id: 'btc_2',
      name: 'Next.js & React Mastery - Afternoon B',
      course_id: 'course_mern',
      course_name: 'MERN Stack Developer Syllabus',
      trainer_id: 'usr_trainer_1',
      trainer_name: 'Rahul Sharma',
      start_date: '2026-08-05',
      total_hours: 45,
      total_students: 14,
      is_completed: false,
      batch_type: 'training',
      is_active: true,
      created_at: '2026-08-05T09:00:00Z',
    },
    {
      id: 'btc_3',
      name: 'Python Data Science & ML - Morning Batch',
      course_id: 'course_datascience',
      course_name: 'Data Science & Machine Learning Syllabus',
      trainer_id: 'usr_trainer_2',
      trainer_name: 'Priya Patel',
      start_date: '2026-08-02',
      total_hours: 80,
      total_students: 22,
      is_completed: false,
      batch_type: 'training',
      is_active: true,
      created_at: '2026-08-02T08:30:00Z',
    },
    {
      id: 'btc_4',
      name: 'Student Doubt Solving & Lab Session',
      trainer_id: 'usr_trainer_2',
      trainer_name: 'Priya Patel',
      start_date: '2026-08-10',
      total_hours: 30,
      total_students: 35,
      is_completed: false,
      batch_type: 'other',
      is_active: true,
      created_at: '2026-08-10T10:00:00Z',
    },
    {
      id: 'btc_5',
      name: 'Power BI & Tableau - Business Analytics',
      course_id: 'course_powerbi',
      course_name: 'Power BI Course Syllabus',
      trainer_id: 'usr_trainer_3',
      trainer_name: 'Amit Verma',
      start_date: '2026-08-08',
      total_hours: 45,
      total_students: 12,
      is_completed: false,
      batch_type: 'training',
      is_active: true,
      created_at: '2026-08-08T11:00:00Z',
    },
  ];

  const sessions: WorkSession[] = [
    {
      id: 'ses_1',
      trainer_id: 'usr_trainer_1',
      trainer_name: 'Rahul Sharma',
      batch_id: 'btc_1',
      batch_name: 'MERN Stack - Morning Batch A',
      session_date: todayStr,
      hours_taken: 2,
      description: 'MongoDB Aggregations and Indexing hands-on practice',
      created_at: `${todayStr}T09:30:00Z`,
    },
    {
      id: 'ses_2',
      trainer_id: 'usr_trainer_2',
      trainer_name: 'Priya Patel',
      batch_id: 'btc_3',
      batch_name: 'Python Data Science & ML - Morning Batch',
      session_date: todayStr,
      hours_taken: 2,
      description: 'Pandas DataFrame data cleaning & exploratory data analysis',
      created_at: `${todayStr}T10:00:00Z`,
    },
  ];

  const attendances: TrainerAttendance[] = [
    {
      id: `att_${todayStr}_usr_trainer_1`,
      trainer_id: 'usr_trainer_1',
      trainer_name: 'Rahul Sharma',
      date: todayStr,
      mark_in_time: `${todayStr}T08:55:12+05:30`,
      mark_out_time: null,
      working_duration: '03:15:00',
      latitude: '23.0225',
      longitude: '72.5714',
      location_name: 'Institute Main Lab - Ahmedabad, Gujarat',
      photo_in: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      day_status: 'present',
      created_at: `${todayStr}T08:55:12Z`,
    },
    {
      id: `att_${todayStr}_usr_trainer_2`,
      trainer_id: 'usr_trainer_2',
      trainer_name: 'Priya Patel',
      date: todayStr,
      mark_in_time: `${todayStr}T09:02:45+05:30`,
      mark_out_time: null,
      working_duration: '02:40:00',
      latitude: '23.0230',
      longitude: '72.5720',
      location_name: 'Institute Branch Lab 2 - Ahmedabad, Gujarat',
      photo_in: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      day_status: 'present',
      created_at: `${todayStr}T09:02:45Z`,
    },
    {
      id: `att_${todayStr}_usr_trainer_3`,
      trainer_id: 'usr_trainer_3',
      trainer_name: 'Amit Verma',
      date: todayStr,
      mark_in_time: null,
      mark_out_time: null,
      working_duration: null,
      day_status: 'pending',
      created_at: `${todayStr}T00:00:00Z`,
    },
  ];

  const leaves: Leave[] = [
    {
      id: 'lv_1',
      trainer_id: 'usr_trainer_3',
      trainer_name: 'Amit Verma',
      leave_type: 'sick',
      start_date: todayStr,
      end_date: todayStr,
      reason: 'Fever and cold, taking medical rest today.',
      status: 'pending',
      created_at: `${todayStr}T08:00:00Z`,
    },
    {
      id: 'lv_2',
      trainer_id: 'usr_trainer_1',
      trainer_name: 'Rahul Sharma',
      leave_type: 'optional_holiday',
      start_date: '2026-08-28',
      end_date: '2026-08-28',
      reason: 'Raksha Bandhan festival',
      status: 'approved',
      admin_notes: 'Approved by Director',
      created_at: '2026-08-15T10:00:00Z',
    },
  ];

  const liveActivities: Record<string, LiveActivity> = {
    usr_trainer_1: {
      trainer_id: 'usr_trainer_1',
      trainer_name: 'Rahul Sharma',
      status: 'in_class',
      current_batch_id: 'btc_1',
      current_batch_name: 'MERN Stack - Morning Batch A',
      current_task_title: 'Teaching React Hooks & State Management',
      status_started_at: new Date(now.getTime() - 25 * 60000).toISOString(),
      last_heartbeat_at: now.toISOString(),
      idle_minutes_current: 0,
      total_idle_today_minutes: 4,
      total_teaching_today_minutes: 120,
      total_task_today_minutes: 45,
      is_logged_in: true,
    },
    usr_trainer_2: {
      trainer_id: 'usr_trainer_2',
      trainer_name: 'Priya Patel',
      status: 'idle',
      current_task_title: 'No active lecture or assigned task',
      status_started_at: new Date(now.getTime() - 8 * 60000).toISOString(),
      last_heartbeat_at: new Date(now.getTime() - 8 * 60000).toISOString(),
      idle_minutes_current: 8,
      total_idle_today_minutes: 22,
      total_teaching_today_minutes: 90,
      total_task_today_minutes: 30,
      is_logged_in: true,
    },
    usr_trainer_3: {
      trainer_id: 'usr_trainer_3',
      trainer_name: 'Amit Verma',
      status: 'break',
      current_task_title: 'Applied for Sick Leave today',
      status_started_at: `${todayStr}T08:00:00Z`,
      last_heartbeat_at: `${todayStr}T08:00:00Z`,
      idle_minutes_current: 0,
      total_idle_today_minutes: 0,
      total_teaching_today_minutes: 0,
      total_task_today_minutes: 0,
      is_logged_in: false,
    },
  };

  const taskLogs: TaskLog[] = [
    {
      id: 'tsk_1',
      trainer_id: 'usr_trainer_1',
      trainer_name: 'Rahul Sharma',
      title: 'Weekly Test Paper Checking - React Basics',
      category: 'paper_checking',
      start_time: `${todayStr}T11:00:00+05:30`,
      end_time: `${todayStr}T11:45:00+05:30`,
      duration_minutes: 45,
      notes: 'Checked 18 student submissions and gave code review comments.',
      is_completed: true,
      created_at: `${todayStr}T11:00:00Z`,
    },
    {
      id: 'tsk_2',
      trainer_id: 'usr_trainer_2',
      trainer_name: 'Priya Patel',
      title: '1-on-1 Student Doubt Solving - Python Loops',
      category: 'doubt_solving',
      start_time: `${todayStr}T11:15:00+05:30`,
      end_time: `${todayStr}T11:45:00+05:30`,
      duration_minutes: 30,
      notes: 'Cleared doubts for 3 weak students from Batch B.',
      is_completed: true,
      created_at: `${todayStr}T11:15:00Z`,
    },
  ];

  return {
    users,
    batches,
    sessions,
    attendances,
    leaves,
    liveActivities,
    taskLogs,
  };
}

export class DB {
  private static memoryDB: DatabaseSchema | null = null;

  private static ensureDB(): DatabaseSchema {
    if (this.memoryDB) return this.memoryDB;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        } catch {
          // Read-only filesystem
        }
      }
      if (!fs.existsSync(DB_FILE)) {
        const initData = getInitialData();
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(initData, null, 2), 'utf-8');
        } catch {
          // Read-only filesystem
        }
        this.memoryDB = initData;
        return initData;
      }
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      this.memoryDB = parsed;
      return parsed;
    } catch {
      const initData = getInitialData();
      this.memoryDB = initData;
      return initData;
    }
  }

  private static saveDB(data: DatabaseSchema): void {
    this.memoryDB = data;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        } catch {
          // Read-only filesystem
        }
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Read-only filesystem (e.g. Vercel / Netlify)
    }
  }

  // --- Users ---
  static getUsers(): User[] {
    const data = this.ensureDB();
    return data.users;
  }

  static getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  static getUserByUsername(username: string): User | undefined {
    return this.getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  static createUser(user: Omit<User, 'id' | 'created_at'>): User {
    const data = this.ensureDB();
    const newUser: User = {
      ...user,
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };
    data.users.push(newUser);
    this.saveDB(data);
    return newUser;
  }

  static updateUser(id: string, updates: Partial<User>): User | null {
    const data = this.ensureDB();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    this.saveDB(data);
    return data.users[idx];
  }

  static deleteUser(id: string): boolean {
    const data = this.ensureDB();
    const initialLen = data.users.length;
    data.users = data.users.filter((u) => u.id !== id);
    if (data.users.length !== initialLen) {
      this.saveDB(data);
      return true;
    }
    return false;
  }

  // --- Batches ---
  static getBatches(): Batch[] {
    const data = this.ensureDB();
    return data.batches.map((b) => this.enrichBatch(b, data.sessions));
  }

  static getBatchById(id: string): Batch | undefined {
    const data = this.ensureDB();
    const batch = data.batches.find((b) => b.id === id);
    return batch ? this.enrichBatch(batch, data.sessions) : undefined;
  }

  private static enrichBatch(batch: Batch, allSessions: WorkSession[]): Batch {
    const batchSessions = allSessions.filter((s) => s.batch_id === batch.id);
    const used_hours = batchSessions.reduce((acc, s) => acc + (s.hours_taken || 0), 0);
    const remaining_hours = Math.max(0, batch.total_hours - used_hours);
    const delay_hours = batch.is_completed ? 0 : Math.max(0, used_hours - batch.total_hours);
    const status_label = batch.is_completed ? 'completed' : delay_hours > 0 ? 'delay' : 'ontime';

    return {
      ...batch,
      used_hours,
      remaining_hours,
      delay_hours,
      status_label,
    };
  }

  static createBatch(batch: Omit<Batch, 'id' | 'created_at'>): Batch {
    const data = this.ensureDB();
    const newBatch: Batch = {
      ...batch,
      id: `btc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
      is_completed: false,
    };
    data.batches.push(newBatch);
    this.saveDB(data);
    return this.enrichBatch(newBatch, data.sessions);
  }

  static updateBatch(id: string, updates: Partial<Batch>): Batch | null {
    const data = this.ensureDB();
    const idx = data.batches.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    data.batches[idx] = { ...data.batches[idx], ...updates };
    this.saveDB(data);
    return this.enrichBatch(data.batches[idx], data.sessions);
  }

  static deleteBatch(id: string): boolean {
    const data = this.ensureDB();
    data.batches = data.batches.filter((b) => b.id !== id);
    data.sessions = data.sessions.filter((s) => s.batch_id !== id);
    this.saveDB(data);
    return true;
  }

  // --- Work Sessions ---
  static getSessions(): WorkSession[] {
    return this.ensureDB().sessions;
  }

  static createSession(session: Omit<WorkSession, 'id' | 'created_at'>): WorkSession {
    const data = this.ensureDB();
    const newSession: WorkSession = {
      ...session,
      id: `ses_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };
    data.sessions.push(newSession);
    this.saveDB(data);
    return newSession;
  }

  static deleteSession(id: string): boolean {
    const data = this.ensureDB();
    data.sessions = data.sessions.filter((s) => s.id !== id);
    this.saveDB(data);
    return true;
  }

  // --- Students & Batch Enrollment ---
  static getStudentsByBatchId(batchId: string): Student[] {
    const data = this.ensureDB();
    if (data.students && data.students.length > 0) {
      const filtered = data.students.filter((s) => s.batch_id === batchId);
      if (filtered.length > 0) return filtered;
    }

    const batch = this.getBatchById(batchId);
    const batchName = batch?.name || 'Batch';

    // Generate standard students for this batch if not already in DB
    const studentNames = [
      { name: 'Rahul Patel', phone: '+91 98981 12345' },
      { name: 'Sneha Shah', phone: '+91 98250 23456' },
      { name: 'Priya Mehta', phone: '+91 97140 34567' },
      { name: 'Amit Trivedi', phone: '+91 98790 45678' },
      { name: 'Neha Joshi', phone: '+91 94280 56789' },
      { name: 'Hardik Parmar', phone: '+91 99090 67890' },
      { name: 'Pooja Varma', phone: '+91 98240 78901' },
      { name: 'Vikas Solanki', phone: '+91 97230 89012' },
      { name: 'Anjali Desai', phone: '+91 98980 90123' },
      { name: 'Karan Dave', phone: '+91 98765 01234' },
      { name: 'Bhavin Rana', phone: '+91 94270 12345' },
      { name: 'Riya Rathod', phone: '+91 99040 23456' },
    ];

    const generatedStudents: Student[] = studentNames.map((s, idx) => ({
      id: `std_${batchId}_${idx + 1}`,
      name: s.name,
      phone: s.phone,
      email: `${s.name.toLowerCase().replace(' ', '.')}@gmail.com`,
      batch_id: batchId,
      batch_name: batchName,
      enrollment_date: '2026-08-01',
    }));

    if (!data.students) data.students = [];
    data.students.push(...generatedStudents);
    this.saveDB(data);

    return generatedStudents;
  }

  static createStudentsForBatch(
    batchId: string,
    batchName: string,
    studentList: { name: string; phone?: string; email?: string }[]
  ): Student[] {
    const data = this.ensureDB();
    if (!data.students) data.students = [];

    // Filter out old students for this batch
    data.students = data.students.filter((s) => s.batch_id !== batchId);

    const newStudents: Student[] = studentList
      .filter((s) => s.name && s.name.trim().length > 0)
      .map((s, idx) => ({
        id: `std_${batchId}_${Date.now()}_${idx + 1}`,
        name: s.name.trim(),
        phone: s.phone?.trim() || '+91 98000 00000',
        email: s.email?.trim() || `${s.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        batch_id: batchId,
        batch_name: batchName,
        enrollment_date: new Date().toISOString().split('T')[0],
      }));

    data.students.push(...newStudents);
    this.saveDB(data);
    return newStudents;
  }

  static getAllStudents(): Student[] {
    const data = this.ensureDB();
    if (!data.students || data.students.length === 0) {
      const all: Student[] = [];
      data.batches.forEach((b) => {
        all.push(...this.getStudentsByBatchId(b.id));
      });
      return all;
    }
    return data.students;
  }

  // --- Attendance ---
  static getAttendances(): TrainerAttendance[] {
    return this.ensureDB().attendances;
  }

  static getTodayAttendance(trainer_id: string, dateStr?: string): TrainerAttendance | undefined {
    const data = this.ensureDB();
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    return data.attendances.find((a) => a.trainer_id === trainer_id && a.date === targetDate);
  }

  static markIn(params: {
    trainer_id: string;
    trainer_name: string;
    photo_in?: string;
    latitude?: string;
    longitude?: string;
    location_name?: string;
  }): TrainerAttendance {
    const data = this.ensureDB();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const markInTimeStr = now.toISOString();

    const existingIdx = data.attendances.findIndex(
      (a) => a.trainer_id === params.trainer_id && a.date === todayStr
    );

    let record: TrainerAttendance;
    if (existingIdx >= 0) {
      record = {
        ...data.attendances[existingIdx],
        mark_in_time: markInTimeStr,
        photo_in: params.photo_in || data.attendances[existingIdx].photo_in,
        latitude: params.latitude || data.attendances[existingIdx].latitude,
        longitude: params.longitude || data.attendances[existingIdx].longitude,
        location_name: params.location_name || data.attendances[existingIdx].location_name,
        day_status: 'present',
      };
      data.attendances[existingIdx] = record;
    } else {
      record = {
        id: `att_${todayStr}_${params.trainer_id}`,
        trainer_id: params.trainer_id,
        trainer_name: params.trainer_name,
        date: todayStr,
        mark_in_time: markInTimeStr,
        mark_out_time: null,
        photo_in: params.photo_in || null,
        photo_out: null,
        latitude: params.latitude || null,
        longitude: params.longitude || null,
        location_name: params.location_name || 'Institute Lab',
        day_status: 'present',
        created_at: markInTimeStr,
      };
      data.attendances.push(record);
    }

    // Update Live Activity
    if (!data.liveActivities[params.trainer_id]) {
      data.liveActivities[params.trainer_id] = {
        trainer_id: params.trainer_id,
        trainer_name: params.trainer_name,
        status: 'working_task',
        current_task_title: 'Just Checked In - Ready for class/task',
        status_started_at: markInTimeStr,
        last_heartbeat_at: markInTimeStr,
        idle_minutes_current: 0,
        total_idle_today_minutes: 0,
        total_teaching_today_minutes: 0,
        total_task_today_minutes: 0,
        is_logged_in: true,
      };
    } else {
      data.liveActivities[params.trainer_id].is_logged_in = true;
      data.liveActivities[params.trainer_id].status = 'working_task';
      data.liveActivities[params.trainer_id].status_started_at = markInTimeStr;
    }

    this.saveDB(data);
    return record;
  }

  static markOut(params: {
    trainer_id: string;
    photo_out?: string;
    latitude?: string;
    longitude?: string;
    location_name?: string;
  }): TrainerAttendance | null {
    const data = this.ensureDB();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const idx = data.attendances.findIndex(
      (a) => a.trainer_id === params.trainer_id && a.date === todayStr
    );

    if (idx === -1) return null;

    const existing = data.attendances[idx];
    const markOutTimeStr = now.toISOString();

    let durationStr = '00:00:00';
    let isHalfDay = false;
    if (existing.mark_in_time) {
      const inTime = new Date(existing.mark_in_time).getTime();
      const diffMs = now.getTime() - inTime;
      const totalSec = Math.max(0, Math.floor(diffMs / 1000));
      const totalMins = Math.floor(totalSec / 60);
      const hours = Math.floor(totalSec / 3600).toString().padStart(2, '0');
      const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
      const secs = (totalSec % 60).toString().padStart(2, '0');
      durationStr = `${hours}:${mins}:${secs}`;

      // 5-Hour Cutoff: If logout before 5 hours (300 mins), mark automatically as Leave
      if (totalMins < 300) {
        isHalfDay = true;
      }
    }

    data.attendances[idx] = {
      ...existing,
      mark_out_time: markOutTimeStr,
      working_duration: durationStr,
      day_status: isHalfDay ? 'leave' : 'present',
      photo_out: params.photo_out || existing.photo_out,
      latitude: params.latitude || existing.latitude,
      longitude: params.longitude || existing.longitude,
      location_name: params.location_name || existing.location_name,
    };

    if (data.liveActivities[params.trainer_id]) {
      data.liveActivities[params.trainer_id].is_logged_in = false;
      data.liveActivities[params.trainer_id].status = 'break';
      data.liveActivities[params.trainer_id].current_task_title = 'Marked Out for the day';
    }

    this.saveDB(data);
    return data.attendances[idx];
  }

  // --- Leaves ---
  static getLeaves(): Leave[] {
    return this.ensureDB().leaves;
  }

  static applyLeave(leave: Omit<Leave, 'id' | 'status' | 'created_at'>): { success: boolean; message: string; leave?: Leave } {
    const data = this.ensureDB();
    const trainerLeaves = data.leaves.filter((l) => l.trainer_id === leave.trainer_id && l.status !== 'rejected');

    // Business Logic: Casual leave limit 1/month
    if (leave.leave_type === 'casual') {
      const leaveMonth = new Date(leave.start_date).getMonth();
      const leaveYear = new Date(leave.start_date).getFullYear();
      const countInMonth = trainerLeaves.filter((l) => {
        if (l.leave_type !== 'casual') return false;
        const d = new Date(l.start_date);
        return d.getMonth() === leaveMonth && d.getFullYear() === leaveYear;
      }).length;

      if (countInMonth >= CASUAL_LEAVE_LIMIT_PER_MONTH) {
        return {
          success: false,
          message: `Casual leave limit reached (${CASUAL_LEAVE_LIMIT_PER_MONTH} per month). Please select another leave type.`,
        };
      }
    }

    // Business Logic: Optional holiday limit 5/year
    if (leave.leave_type === 'optional_holiday') {
      const leaveYear = new Date(leave.start_date).getFullYear();
      const countInYear = trainerLeaves.filter((l) => {
        if (l.leave_type !== 'optional_holiday') return false;
        return new Date(l.start_date).getFullYear() === leaveYear;
      }).length;

      if (countInYear >= OPTIONAL_HOLIDAY_LIMIT_PER_YEAR) {
        return {
          success: false,
          message: `Optional holiday limit reached (${OPTIONAL_HOLIDAY_LIMIT_PER_YEAR} per year).`,
        };
      }
    }

    const newLeave: Leave = {
      ...leave,
      id: `lv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    data.leaves.push(newLeave);
    this.saveDB(data);
    return { success: true, message: 'Leave application submitted successfully!', leave: newLeave };
  }

  static updateLeaveStatus(id: string, status: 'approved' | 'rejected', admin_notes?: string): Leave | null {
    const data = this.ensureDB();
    const idx = data.leaves.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    data.leaves[idx].status = status;
    if (admin_notes) data.leaves[idx].admin_notes = admin_notes;
    this.saveDB(data);
    return data.leaves[idx];
  }

  static updateLeave(id: string, updates: Partial<Leave>): Leave | null {
    return this.updateLeaveStatus(id, (updates.status as 'approved' | 'rejected') || 'approved', updates.admin_notes);
  }

  // --- Real-time 1-Minute Live Activity & Idle Tracking ---
  static getLiveActivities(): Record<string, LiveActivity> {
    const data = this.ensureDB();
    const now = new Date().getTime();

    // Auto-calculate exact idle minutes for all active trainers
    Object.values(data.liveActivities).forEach((act) => {
      if (act.status === 'idle') {
        const started = new Date(act.status_started_at).getTime();
        const mins = Math.max(0, Math.floor((now - started) / 60000));
        act.idle_minutes_current = mins;
      } else {
        act.idle_minutes_current = 0;
      }
    });

    return data.liveActivities;
  }

  static updateTeacherActivity(params: {
    trainer_id: string;
    trainer_name?: string;
    status: TeacherActivityStatus;
    current_task_title?: string;
    current_batch_id?: string;
    current_batch_name?: string;
  }): LiveActivity {
    const data = this.ensureDB();
    const now = new Date();
    const nowStr = now.toISOString();

    const current = data.liveActivities[params.trainer_id] || {
      trainer_id: params.trainer_id,
      trainer_name: params.trainer_name || 'Trainer',
      status: 'working_task',
      current_task_title: 'Active',
      status_started_at: nowStr,
      last_heartbeat_at: nowStr,
      idle_minutes_current: 0,
      total_idle_today_minutes: 0,
      total_teaching_today_minutes: 0,
      total_task_today_minutes: 0,
      is_logged_in: true,
    };

    // Calculate previous state time delta
    const prevStarted = new Date(current.status_started_at).getTime();
    const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - prevStarted) / 60000));

    if (current.status === 'idle') {
      current.total_idle_today_minutes += elapsedMinutes;
    } else if (current.status === 'in_class') {
      current.total_teaching_today_minutes += elapsedMinutes;
    } else if (current.status === 'working_task') {
      current.total_task_today_minutes += elapsedMinutes;
    }

    current.status = params.status;
    current.current_task_title = params.current_task_title || (params.status === 'idle' ? 'No active assignment' : 'Working');
    current.current_batch_id = params.current_batch_id;
    current.current_batch_name = params.current_batch_name;
    current.status_started_at = nowStr;
    current.last_heartbeat_at = nowStr;
    current.idle_minutes_current = params.status === 'idle' ? 0 : 0;

    data.liveActivities[params.trainer_id] = current;
    this.saveDB(data);
    return current;
  }

  static pingHeartbeat(trainer_id: string): void {
    const data = this.ensureDB();
    if (data.liveActivities[trainer_id]) {
      data.liveActivities[trainer_id].last_heartbeat_at = new Date().toISOString();
      this.saveDB(data);
    }
  }

  // --- Task Logs ---
  static getTaskLogs(trainer_id?: string): TaskLog[] {
    const data = this.ensureDB();
    if (trainer_id) {
      return data.taskLogs.filter((t) => t.trainer_id === trainer_id);
    }
    return data.taskLogs;
  }

  static startTask(task: {
    trainer_id: string;
    trainer_name: string;
    title: string;
    category: any;
    notes?: string;
  }): TaskLog {
    const data = this.ensureDB();
    const now = new Date();
    const newTask: TaskLog = {
      id: `tsk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      trainer_id: task.trainer_id,
      trainer_name: task.trainer_name,
      title: task.title,
      category: task.category,
      start_time: now.toISOString(),
      end_time: null,
      duration_minutes: 0,
      notes: task.notes || '',
      is_completed: false,
      created_at: now.toISOString(),
    };
    data.taskLogs.unshift(newTask);

    // Switch status to working_task
    this.updateTeacherActivity({
      trainer_id: task.trainer_id,
      trainer_name: task.trainer_name,
      status: 'working_task',
      current_task_title: task.title,
    });

    this.saveDB(data);
    return newTask;
  }

  static completeTask(taskId: string): TaskLog | null {
    const data = this.ensureDB();
    const idx = data.taskLogs.findIndex((t) => t.id === taskId);
    if (idx === -1) return null;

    const task = data.taskLogs[idx];
    const now = new Date();
    const start = new Date(task.start_time).getTime();
    const durationMins = Math.max(1, Math.floor((now.getTime() - start) / 60000));

    task.end_time = now.toISOString();
    task.duration_minutes = durationMins;
    task.is_completed = true;

    // Switch status to idle after task completion so teacher picks next task
    this.updateTeacherActivity({
      trainer_id: task.trainer_id,
      status: 'idle',
      current_task_title: `Finished: ${task.title}. Ready for next task.`,
    });

    this.saveDB(data);
    return task;
  }

  // --- Reports & Incentive Engine ---
  static getIncentiveReport(month: number, year: number): IncentiveReport[] {
    const data = this.ensureDB();
    const trainers = data.users.filter((u) => u.role === 'trainer');

    // Calculate working days in month (excluding Sundays)
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      if (dayOfWeek !== 0) workingDays++;
    }

    return trainers.map((trainer) => {
      // Present days count
      const presentCount = data.attendances.filter((att) => {
        if (att.trainer_id !== trainer.id) return false;
        const d = new Date(att.date);
        return (
          d.getMonth() + 1 === month &&
          d.getFullYear() === year &&
          att.day_status === 'present'
        );
      }).length;

      const attendancePercent = workingDays > 0 ? (presentCount / workingDays) * 100 : 0;
      const isEligible = attendancePercent >= 90;

      // Batches started this month
      const monthBatches = data.batches.filter((b) => {
        if (b.trainer_id !== trainer.id) return false;
        const d = new Date(b.start_date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });

      const batchCount = monthBatches.length;
      const extraBatches = Math.max(0, batchCount - 5);
      const batchBonus = isEligible ? extraBatches * 1000 : 0;

      // Class vs Other hours
      const trainerSessions = data.sessions.filter((s) => {
        if (s.trainer_id !== trainer.id) return false;
        const d = new Date(s.session_date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });

      let totalClassHours = 0;
      let totalOtherHours = 0;
      trainerSessions.forEach((s) => {
        const batch = data.batches.find((b) => b.id === s.batch_id);
        if (batch?.batch_type === 'other') {
          totalOtherHours += s.hours_taken;
        } else {
          totalClassHours += s.hours_taken;
        }
      });

      const liveAct = data.liveActivities[trainer.id];
      const totalIdleMins = liveAct ? liveAct.total_idle_today_minutes : 0;

      return {
        trainer_id: trainer.id,
        trainer_name: trainer.name,
        month,
        year,
        total_working_days: workingDays,
        present_days: presentCount,
        attendance_percent: Number(attendancePercent.toFixed(1)),
        is_attendance_eligible: isEligible,
        batch_count: batchCount,
        extra_batches: extraBatches,
        batch_bonus: batchBonus,
        total_incentive: batchBonus,
        total_class_hours: totalClassHours,
        total_other_hours: totalOtherHours,
        total_idle_minutes: totalIdleMins,
      };
    });
  }

  // --- WhatsApp Broadcast Logs ---
  static getWhatsAppLogs(): WhatsAppBroadcastLog[] {
    const data = this.ensureDB();
    return data.whatsappLogs || [];
  }

  static addWhatsAppLog(log: WhatsAppBroadcastLog): WhatsAppBroadcastLog {
    const data = this.ensureDB();
    if (!data.whatsappLogs) data.whatsappLogs = [];
    data.whatsappLogs.unshift(log);
    // keep maximum 100 logs
    if (data.whatsappLogs.length > 100) {
      data.whatsappLogs = data.whatsappLogs.slice(0, 100);
    }
    this.saveDB(data);
    return log;
  }

  // --- Holiday & Week-Off Configuration ---
  static getHolidayConfig(): HolidayConfig {
    const data = this.ensureDB();
    if (!data.holidayConfig) {
      data.holidayConfig = {
        mandatory_holidays: MANDATORY_HOLIDAYS_2026,
        optional_holidays: OPTIONAL_HOLIDAYS_2026,
        week_off_pattern: 'sunday',
      };
      this.saveDB(data);
    }
    return data.holidayConfig;
  }

  static updateHolidayConfig(config: Partial<HolidayConfig>): HolidayConfig {
    const data = this.ensureDB();
    data.holidayConfig = {
      ...this.getHolidayConfig(),
      ...config,
    };
    this.saveDB(data);
    return data.holidayConfig;
  }

  // --- Trainer Leave Balances & Admin Audits ---
  static getTrainerLeaveBalance(trainerId: string): TrainerLeaveBalance {
    const data = this.ensureDB();
    if (!data.leaveBalances) data.leaveBalances = {};

    const trainer = data.users.find((u) => u.id === trainerId);
    const trainerName = trainer?.name || 'Trainer';

    if (!data.leaveBalances[trainerId]) {
      // Calculate used leaves from approved records
      const trainerLeaves = (data.leaves || []).filter(
        (l) => l.trainer_id === trainerId && l.status === 'approved'
      );
      const casualSickUsed = trainerLeaves.filter(
        (l) => l.leave_type === 'casual' || l.leave_type === 'sick' || l.leave_type === 'emergency'
      ).length;
      const optionalUsed = trainerLeaves.filter(
        (l) => l.leave_type === 'optional_holiday'
      ).length;

      data.leaveBalances[trainerId] = {
        trainer_id: trainerId,
        trainer_name: trainerName,
        casual_sick_quota: CASUAL_SICK_LEAVE_ANNUAL_QUOTA, // default 12
        casual_sick_used: casualSickUsed,
        optional_holiday_quota: OPTIONAL_HOLIDAY_LIMIT_PER_YEAR, // default 5
        optional_holiday_used: optionalUsed,
        mandatory_holiday_count: 5,
      };
      this.saveDB(data);
    }

    return data.leaveBalances[trainerId];
  }

  static getAllTrainerLeaveBalances(): TrainerLeaveBalance[] {
    const data = this.ensureDB();
    const trainers = data.users.filter((u) => u.role === 'trainer');
    return trainers.map((t) => this.getTrainerLeaveBalance(t.id));
  }

  static adjustTrainerLeaveBalance(params: {
    trainer_id: string;
    admin_name: string;
    leave_type: 'casual_sick' | 'optional_holiday';
    new_balance: number;
    reason: string;
  }): { success: boolean; balance?: TrainerLeaveBalance; auditLog?: LeaveAuditLog; error?: string } {
    const data = this.ensureDB();
    const currentBalance = this.getTrainerLeaveBalance(params.trainer_id);

    const oldVal =
      params.leave_type === 'casual_sick'
        ? currentBalance.casual_sick_quota
        : currentBalance.optional_holiday_quota;

    const diff = params.new_balance - oldVal;

    if (params.leave_type === 'casual_sick') {
      currentBalance.casual_sick_quota = params.new_balance;
    } else {
      currentBalance.optional_holiday_quota = params.new_balance;
    }

    data.leaveBalances = data.leaveBalances || {};
    data.leaveBalances[params.trainer_id] = currentBalance;

    // Create Audit Log
    const audit: LeaveAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trainer_id: params.trainer_id,
      trainer_name: currentBalance.trainer_name,
      admin_name: params.admin_name || 'Admin',
      leave_type: params.leave_type === 'casual_sick' ? 'Casual/Sick Leave' : 'Optional Holiday',
      old_balance: oldVal,
      new_balance: params.new_balance,
      adjustment: diff,
      reason: params.reason || 'Administrative adjustment',
      created_at: new Date().toISOString(),
    };

    if (!data.leaveAuditLogs) data.leaveAuditLogs = [];
    data.leaveAuditLogs.unshift(audit);

    this.saveDB(data);
    return { success: true, balance: currentBalance, auditLog: audit };
  }

  static getLeaveAuditLogs(): LeaveAuditLog[] {
    const data = this.ensureDB();
    return data.leaveAuditLogs || [];
  }

  // --- Multi-Topic Coverage Tracking & Analytics ---
  static getBatchTopicCoverage(batchId: string): TopicCoverageProgress | null {
    const data = this.ensureDB();
    const batch = data.batches.find((b) => b.id === batchId);
    if (!batch) return null;

    // Find course in syllabusData
    const course = INSTITUTE_COURSES.find((c) => c.id === batch.course_id);
    let totalTopics = 0;
    if (course) {
      course.modules.forEach((m) => {
        totalTopics += m.topics.length;
      });
    }
    if (totalTopics === 0) totalTopics = 20; // fallback

    // Collect all covered topics across all sessions for this batch
    const batchSessions = (data.sessions || []).filter((s) => s.batch_id === batchId);
    const coveredTopicsMap = new Map<string, { session_date: string; trainer_name: string }>();

    batchSessions.forEach((s) => {
      const topics = s.selected_topics || (s.description ? [s.description] : []);
      topics.forEach((t) => {
        if (!coveredTopicsMap.has(t)) {
          coveredTopicsMap.set(t, {
            session_date: s.session_date,
            trainer_name: s.trainer_name || 'Trainer',
          });
        }
      });
    });

    const coveredTopicsList = Array.from(coveredTopicsMap.entries()).map(([topic, meta]) => ({
      topic,
      session_date: meta.session_date,
      trainer_name: meta.trainer_name,
    }));

    const coveredCount = coveredTopicsList.length;
    const coveragePercent = Math.min(100, Math.round((coveredCount / totalTopics) * 100));

    return {
      course_id: batch.course_id || 'course_custom',
      course_name: batch.course_name || batch.name,
      batch_id: batch.id,
      batch_name: batch.name,
      trainer_id: batch.trainer_id,
      trainer_name: batch.trainer_name,
      total_topics: totalTopics,
      covered_topics: coveredCount,
      coverage_percentage: coveragePercent,
      covered_topics_list: coveredTopicsList,
    };
  }

  static getAllTopicCoverage(): TopicCoverageProgress[] {
    const data = this.ensureDB();
    const results: TopicCoverageProgress[] = [];
    data.batches.forEach((b) => {
      if (b.is_active) {
        const cov = this.getBatchTopicCoverage(b.id);
        if (cov) results.push(cov);
      }
    });
    return results;
  }

  // --- Central Trainer Monitoring Snapshot & 12 PM Automation ---
  static getTrainerMonitoringSnapshot(targetDate?: string): {
    date: string;
    isWorkingDay: boolean;
    dayType: 'working_day' | 'week_off' | 'mandatory_holiday' | 'optional_holiday';
    holidayName?: string;
    summary: {
      totalTrainers: number;
      loggedIn: number;
      late: number;
      notLoggedIn: number;
      onLeave: number;
    };
    trainers: TrainerMonitoringRow[];
  } {
    const data = this.ensureDB();
    const dateStr = targetDate || new Date().toISOString().split('T')[0];
    const holidayCfg = this.getHolidayConfig();

    const mandatoryList = Array.isArray(holidayCfg?.mandatory_holidays)
      ? holidayCfg.mandatory_holidays
      : MANDATORY_HOLIDAYS_2026;
    const optionalList = Array.isArray(holidayCfg?.optional_holidays)
      ? holidayCfg.optional_holidays
      : OPTIONAL_HOLIDAYS_2026;

    const isWeekOffToday = isDateWeekOff(dateStr, holidayCfg?.week_off_pattern || 'sunday');
    const holidayToday = isDateHoliday(dateStr, [...mandatoryList, ...optionalList]);

    let dayType: 'working_day' | 'week_off' | 'mandatory_holiday' | 'optional_holiday' = 'working_day';
    if (isWeekOffToday) dayType = 'week_off';
    else if (holidayToday) {
      dayType = holidayToday.type === 'mandatory' ? 'mandatory_holiday' : 'optional_holiday';
    }

    const isWorkingDay = dayType === 'working_day';
    const activeTrainers = data.users.filter((u) => u.role === 'trainer');

    let countLoggedIn = 0;
    let countLate = 0;
    let countNotLoggedIn = 0;
    let countOnLeave = 0;

    const rows: TrainerMonitoringRow[] = activeTrainers.map((trainer) => {
      // Find today's attendance record
      const att = (data.attendances || []).find(
        (a) => a.trainer_id === trainer.id && a.date === dateStr
      );

      // Find approved leave for today
      const leaveToday = (data.leaves || []).find((l) => {
        if (l.trainer_id !== trainer.id || l.status !== 'approved') return false;
        return dateStr >= l.start_date && dateStr <= l.end_date;
      });

      // Find latest session topic for today
      const sessionToday = (data.sessions || []).find(
        (s) => s.trainer_id === trainer.id && s.session_date === dateStr
      );
      const todayTopic =
        sessionToday?.selected_topics?.join(', ') ||
        sessionToday?.module_name ||
        sessionToday?.description ||
        '—';

      const leaveBal = this.getTrainerLeaveBalance(trainer.id);
      const leaveDisplay = `${leaveBal.casual_sick_quota - leaveBal.casual_sick_used}/${leaveBal.casual_sick_quota}`;

      let loginTime: string | null = null;
      let logoutTime: string | null = null;
      let statusBadge: TrainerLiveLoginStatus = 'not_logged_in';
      let attendanceStatus: 'Present' | 'Late' | 'Half Day' | 'Not Logged In' | 'On Leave' | 'Week Off' | 'Holiday' | 'Absent' =
        'Not Logged In';

      if (att && att.mark_in_time) {
        loginTime = att.mark_in_time;
        logoutTime = att.mark_out_time || null;

        const inDate = new Date(att.mark_in_time);
        const inHour = inDate.getHours();
        const inMinute = inDate.getMinutes();

        // 5-Hour Cutoff: If logout before 5 hours -> Leave
        let isLeaveUnder5h = att.day_status === 'leave';
        if (!isLeaveUnder5h && att.mark_in_time && att.mark_out_time) {
          const diffMins = (new Date(att.mark_out_time).getTime() - new Date(att.mark_in_time).getTime()) / 60000;
          if (diffMins < 300) {
            isLeaveUnder5h = true;
          }
        }

        if (isLeaveUnder5h) {
          statusBadge = 'on_leave';
          attendanceStatus = 'On Leave';
          countOnLeave++;
        } else if (inHour > 10 || (inHour === 10 && inMinute > 15)) {
          statusBadge = 'late';
          attendanceStatus = 'Late';
          countLate++;
        } else {
          statusBadge = 'logged_in';
          attendanceStatus = 'Present';
          countLoggedIn++;
        }
      } else if (leaveToday) {
        statusBadge = 'on_leave';
        attendanceStatus = 'On Leave';
        countOnLeave++;
      } else if (isWeekOffToday) {
        statusBadge = 'weekoff';
        attendanceStatus = 'Week Off';
      } else if (holidayToday) {
        statusBadge = 'holiday';
        attendanceStatus = 'Holiday';
      } else {
        statusBadge = 'not_logged_in';
        attendanceStatus = 'Not Logged In';
        countNotLoggedIn++;
      }

      return {
        trainer_id: trainer.id,
        trainer_name: trainer.name,
        phone: trainer.phone,
        avatar: trainer.avatar,
        login_time: loginTime,
        logout_time: logoutTime,
        attendance_status: attendanceStatus,
        today_topic: todayTopic,
        leave_balance_display: leaveDisplay,
        status_badge: statusBadge,
        device_ip: att?.location_name || 'Campus / Web IP',
      };
    });

    return {
      date: dateStr,
      isWorkingDay,
      dayType,
      holidayName: holidayToday?.name,
      summary: {
        totalTrainers: activeTrainers.length,
        loggedIn: countLoggedIn,
        late: countLate,
        notLoggedIn: countNotLoggedIn,
        onLeave: countOnLeave,
      },
      trainers: rows,
    };
  }

  // --- Automated 12:00 PM Non-Login Absence Evaluation ---
  static run12pmCutoffCheck(targetDate?: string): {
    isWorkingDay: boolean;
    dayType: string;
    unloggedTrainers: TrainerMonitoringRow[];
    totalFlagged: number;
    emailWorkflowTriggered: boolean;
    timestamp: string;
  } {
    const snapshot = this.getTrainerMonitoringSnapshot(targetDate);

    // If today is a Holiday or Week-off, do NOT flag absences or trigger emails!
    if (!snapshot.isWorkingDay) {
      return {
        isWorkingDay: false,
        dayType: snapshot.dayType,
        unloggedTrainers: [],
        totalFlagged: 0,
        emailWorkflowTriggered: false,
        timestamp: new Date().toISOString(),
      };
    }

    // Filter trainers who are strictly 'not_logged_in' (i.e. neither checked in nor on approved leave)
    const unlogged = snapshot.trainers.filter(
      (t) => t.status_badge === 'not_logged_in'
    );

    return {
      isWorkingDay: true,
      dayType: snapshot.dayType,
      unloggedTrainers: unlogged,
      totalFlagged: unlogged.length,
      emailWorkflowTriggered: unlogged.length > 0,
      timestamp: new Date().toISOString(),
    };
  }

  // --- Admin Live Dashboard Direct Override ---
  static adminOverrideTrainerDay(params: {
    trainer_id: string;
    date: string;
    day_status?: 'present' | 'half_day' | 'leave' | 'pending';
    mark_in_time?: string | null;
    mark_out_time?: string | null;
    topic_covered?: string;
    location_name?: string;
  }): boolean {
    const data = this.ensureDB();
    const trainer = data.users.find((u) => u.id === params.trainer_id);
    if (!trainer) return false;

    const attIdx = data.attendances.findIndex(
      (a) => a.trainer_id === params.trainer_id && a.date === params.date
    );

    if (attIdx >= 0) {
      data.attendances[attIdx] = {
        ...data.attendances[attIdx],
        day_status: params.day_status || data.attendances[attIdx].day_status,
        mark_in_time: params.mark_in_time !== undefined ? params.mark_in_time : data.attendances[attIdx].mark_in_time,
        mark_out_time: params.mark_out_time !== undefined ? params.mark_out_time : data.attendances[attIdx].mark_out_time,
        location_name: params.location_name || data.attendances[attIdx].location_name,
      };
    } else {
      data.attendances.push({
        id: `att_${params.date}_${params.trainer_id}`,
        trainer_id: params.trainer_id,
        trainer_name: trainer.name,
        date: params.date,
        mark_in_time: params.mark_in_time || `${params.date}T09:30:00.000Z`,
        mark_out_time: params.mark_out_time || null,
        day_status: params.day_status || 'present',
        location_name: params.location_name || 'Campus Lab (Admin Override)',
        created_at: new Date().toISOString(),
      });
    }

    // If topic is edited, update today's session or create one
    if (params.topic_covered !== undefined) {
      const sesIdx = data.sessions.findIndex(
        (s) => s.trainer_id === params.trainer_id && s.session_date === params.date
      );
      if (sesIdx >= 0) {
        data.sessions[sesIdx].description = params.topic_covered;
      } else if (params.topic_covered.trim()) {
        const batch = data.batches.find((b) => b.trainer_id === params.trainer_id) || data.batches[0];
        data.sessions.push({
          id: `ses_${Date.now()}_override`,
          batch_id: batch?.id || 'btc_1',
          batch_name: batch?.name || 'General Batch',
          trainer_id: params.trainer_id,
          trainer_name: trainer.name,
          session_date: params.date,
          hours_taken: 2,
          description: params.topic_covered,
          created_at: new Date().toISOString(),
        });
      }
    }

    this.saveDB(data);
    return true;
  }

  // --- Comprehensive 360° Trainer Profile Aggregator ---
  static getTrainerFullProfile(trainerId: string) {
    const data = this.ensureDB();
    const trainer = data.users.find((u) => u.id === trainerId);
    if (!trainer) return null;

    // Batches with topic coverage calculations
    const batches = data.batches
      .filter((b) => b.trainer_id === trainerId)
      .map((b) => {
        const coverage = this.getBatchTopicCoverage(b.id);
        return {
          ...b,
          coverage,
        };
      });

    // Attendances
    const attendances = data.attendances
      .filter((a) => a.trainer_id === trainerId || (trainerId === 'usr_trainer_1' && a.trainer_id === 'usr_rahul'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Leaves
    const leaves = data.leaves
      .filter((l) => l.trainer_id === trainerId || (trainerId === 'usr_trainer_1' && l.trainer_id === 'usr_rahul'))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Leave Balance Quota
    const leaveBalance = this.getTrainerLeaveBalance(trainerId);

    // Audit logs for leave changes
    const auditLogs = (data.leaveAuditLogs || [])
      .filter((l) => l.trainer_id === trainerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Historical Work Sessions & Multi-Topic Reports
    const sessions = data.sessions
      .filter((s) => s.trainer_id === trainerId || (trainerId === 'usr_trainer_1' && s.trainer_id === 'usr_rahul'))
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

    // Live Activity Radar State
    const liveActivity = data.liveActivities[trainerId] || null;

    return {
      trainer,
      batches,
      attendances,
      leaves,
      leaveBalance,
      auditLogs,
      sessions,
      liveActivity,
    };
  }
}

