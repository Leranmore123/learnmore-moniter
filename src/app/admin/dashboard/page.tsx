'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import TeacherStatusCard from '@/components/TeacherStatusCard';
import { getStoredUser } from '@/lib/auth';
import { User, Batch, Leave, TrainerMonitoringRow, TopicCoverageProgress, WorkSession } from '@/lib/types';
import {
  Package,
  Users,
  Plus,
  Calendar,
  FileBarChart2,
  BookOpen,
  Activity,
  AlertTriangle,
  Radio,
  ArrowRight,
  Clock,
  CalendarDays,
  CheckCircle2,
  Edit3,
  X,
  Sliders,
  ShoppingBag,
  Check,
  UserX,
  Coffee,
  ChevronRight,
  Save
} from 'lucide-react';

// Default Mock Data for fallback display
const defaultTrainers = [
  {
    id: 'usr_trainer_1',
    name: 'Rahul Sharma',
    designation: 'Senior Web Development Trainer',
    username: 'rahul',
    role: 'trainer',
    activity: {
      status: 'in_class',
      status_started_at: '2025-05-22T09:30:00.000Z',
      current_task_title: 'Teaching React Hooks & State Management',
      current_batch_name: 'Full Stack Web Dev - Batch #102',
      total_teaching_today_minutes: 180,
      total_task_today_minutes: 45,
      total_idle_today_minutes: 15,
    }
  },
  {
    id: 'usr_trainer_2',
    name: 'Priya Patel',
    designation: 'Python & Data Science Trainer',
    username: 'priya',
    role: 'trainer',
    activity: {
      status: 'in_class',
      status_started_at: '2025-05-22T16:20:00.000Z',
      current_task_title: 'Preparing Python Nearby & Panda Lab Assignment',
      total_teaching_today_minutes: 0,
      total_task_today_minutes: 0,
      total_idle_today_minutes: 30,
    }
  },
  {
    id: 'usr_trainer_3',
    name: 'Amit Verma',
    designation: 'UI/UX & Frontend Trainer',
    username: 'amit',
    role: 'trainer',
    activity: {
      status: 'idle',
      status_started_at: '2025-05-22T00:00:00.000Z',
      current_task_title: 'Not logged in today',
      total_teaching_today_minutes: 0,
      total_task_today_minutes: 0,
      total_idle_today_minutes: 0,
    }
  }
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [liveActivities, setLiveActivities] = useState<any[]>(defaultTrainers);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [topicCoverages, setTopicCoverages] = useState<TopicCoverageProgress[]>([]);

  const [monitoringSnapshot, setMonitoringSnapshot] = useState<{
    date: string;
    isWorkingDay: boolean;
    dayType: string;
    holidayName?: string;
    summary: {
      total: number;
      present: number;
      late: number;
      notLoggedIn: number;
      onLeave: number;
    };
    trainers: TrainerMonitoringRow[];
  } | null>(null);

  const [cutoffResult, setCutoffResult] = useState<{
    message: string;
    totalFlagged: number;
    isWorkingDay: boolean;
  } | null>(null);
  const [evaluatingCutoff, setEvaluatingCutoff] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit Trainer Row Modal State
  const [editingTrainer, setEditingTrainer] = useState<TrainerMonitoringRow | null>(null);
  const [editStatus, setEditStatus] = useState<'Present' | 'Late' | 'Not Logged In' | 'On Leave' | 'Half Day' | 'Week Off' | 'Holiday' | 'Absent'>('Present');
  const [editLoginTime, setEditLoginTime] = useState<string>('09:30');
  const [editTopic, setEditTopic] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('Main Campus Lab 1');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      const [actRes, batRes, leaveRes, sesRes, monRes, covRes] = await Promise.all([
        fetch('/api/live-activity'),
        fetch('/api/batches'),
        fetch('/api/leaves'),
        fetch('/api/sessions'),
        fetch('/api/monitoring/snapshot'),
        fetch('/api/topics/coverage'),
      ]);

      const actData = await actRes.json();
      const batData = await batRes.json();
      const leaveData = await leaveRes.json();
      const sesData = await sesRes.json();
      const monData = await monRes.json();
      const covData = await covRes.json();

      if (actData.success && actData.activities && actData.activities.length > 0) {
        setLiveActivities(actData.activities);
      }
      if (batData.success) setBatches(batData.batches || []);
      if (leaveData.success) setLeaves(leaveData.leaves || []);
      if (sesData.success) setSessions(sesData.sessions || []);
      if (monData.success) setMonitoringSnapshot(monData);
      if (covData.success) setTopicCoverages(covData.coverages || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace('/login');
      return;
    }
    if (u.role !== 'admin') {
      router.replace('/trainer/dashboard');
      return;
    }
    setUser(u);
    fetchData();

    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [router]);

  const handleAssignTask = async (trainerId: string, taskTitle: string) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        trainer_id: trainerId,
        title: taskTitle,
        category: 'other',
      }),
    });
    fetchData();
  };

  const handleTrigger12pmCutoff = async () => {
    setEvaluatingCutoff(true);
    setCutoffResult(null);
    try {
      const res = await fetch('/api/cron/12pm-cutoff', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCutoffResult({
          message: data.message,
          totalFlagged: data.totalFlagged,
          isWorkingDay: data.isWorkingDay,
        });
        fetchData();
      }
    } catch {
      // silent
    } finally {
      setEvaluatingCutoff(false);
    }
  };

  const handleOpenEditModal = (t: TrainerMonitoringRow) => {
    setEditingTrainer(t);
    setEditStatus(t.attendance_status as any || 'Present');
    let timeStr = '09:30';
    if (t.login_time) {
      const d = new Date(t.login_time);
      timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    setEditLoginTime(timeStr);
    setEditTopic(t.today_topic === '—' ? '' : t.today_topic);
    setEditLocation(t.device_ip || 'Main Campus Lab 1');
    setEditMessage(null);
  };

  const handleSaveTrainerOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer) return;
    setSavingEdit(true);
    setEditMessage(null);

    const todayStr = monitoringSnapshot?.date || new Date().toISOString().split('T')[0];
    const markInIso =
      editStatus === 'Not Logged In' || editStatus === 'Absent'
        ? null
        : `${todayStr}T${editLoginTime}:00.000Z`;

    let dayStatusMap: 'present' | 'half_day' | 'leave' | 'pending' = 'present';
    if (editStatus === 'Half Day') dayStatusMap = 'half_day';
    else if (editStatus === 'On Leave') dayStatusMap = 'leave';
    else if (editStatus === 'Not Logged In' || editStatus === 'Absent') dayStatusMap = 'pending';

    try {
      const res = await fetch('/api/monitoring/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainer_id: editingTrainer.trainer_id,
          date: todayStr,
          day_status: dayStatusMap,
          mark_in_time: markInIso,
          topic_covered: editTopic.trim(),
          location_name: editLocation.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditMessage({ text: 'Trainer details updated successfully!', type: 'success' });
        fetchData();
        setTimeout(() => {
          setEditingTrainer(null);
        }, 900);
      } else {
        setEditMessage({ text: data.error || 'Failed to update', type: 'error' });
      }
    } catch (err: any) {
      setEditMessage({ text: err.message || 'Network error', type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const activeBatchesCount = batches.length > 0 ? batches.filter((b) => b.is_active && !b.is_completed).length : 17;
  const totalBatchesCount = batches.length > 0 ? batches.length : 17;
  const pendingLeavesCount = leaves.length > 0 ? leaves.filter((l) => l.status === 'pending').length : 21;
  const idleTrainers = liveActivities.filter(
    (t) => t.activity?.status === 'idle' && (t.activity?.idle_minutes_current >= 1 || t.activity?.total_idle_today_minutes > 0)
  );

  const monSummary = monitoringSnapshot?.summary || {
    totalTrainers: 3,
    loggedIn: 0,
    late: 0,
    notLoggedIn: 3,
    onLeave: 0,
  };

  return (
    <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
          {/* Header Title & Action Buttons Bar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Institute Director & Monitoring HQ
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium -mt-2">
              Real-time faculty radar, 12:30 PM cutoff automation, batch delivery tracking & leave management.
            </p>

            {/* Quick Action Pill Buttons Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Link
                href="/admin/batches"
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create New Batch
              </Link>

              <Link
                href="/admin/trainers"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Trainer
              </Link>

              <Link
                href="/admin/attendance"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5" /> Mark Attendance
              </Link>

              <Link
                href="/admin/monitoring"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5" /> Login Monitor
              </Link>

              <Link
                href="/admin/leaves"
                className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-700/20 transition-all cursor-pointer"
              >
                <CalendarDays className="h-3.5 w-3.5" /> Adjust Leaves
                <span className="px-1.5 py-0.2 rounded-full bg-purple-900 text-white text-[10px] font-black">
                  {pendingLeavesCount}
                </span>
              </Link>

              <Link
                href="/admin/holidays"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-slate-900/20 transition-all cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-indigo-300" /> Holiday Rules
              </Link>

              <Link
                href="/admin/whatsapp"
                className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span className="text-sm">💬</span> WhatsApp Hub
              </Link>

              <Link
                href="/admin/reports"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <FileBarChart2 className="h-3.5 w-3.5" /> Reports
              </Link>

              <button
                onClick={handleTrigger12pmCutoff}
                disabled={evaluatingCutoff}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Clock className="h-4 w-4 text-cyan-200" />
                {evaluatingCutoff ? 'Checking 12 PM...' : 'Evaluate 12 PM Cutoff'}
              </button>
            </div>
          </div>

          {/* 12 PM Cutoff Result Alert */}
          {cutoffResult && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs ${
                cutoffResult.isWorkingDay && cutoffResult.totalFlagged > 0
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {cutoffResult.isWorkingDay && cutoffResult.totalFlagged > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                )}
                <span>{cutoffResult.message}</span>
              </div>
              <button
                onClick={() => setCutoffResult(null)}
                className="text-xs opacity-70 hover:opacity-100 font-extrabold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* 6 KPI Stat Cards matching screenshot layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Card 1: Active Batches */}
            <Link
              href="/admin/batches"
              className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  ACTIVE BATCHES
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {activeBatchesCount} / {totalBatchesCount}
                </div>
                <div className="text-xs text-blue-600 font-bold flex items-center gap-0.5">
                  <span>Manage & Alloc</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </Link>

            {/* Card 2: Logged In */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
                  LOGGED IN
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {(monSummary as any).loggedIn ?? (monSummary as any).present} / {(monSummary as any).totalTrainers ?? (monSummary as any).total}
                </div>
                <div className="text-xs text-emerald-600 font-medium">On time check in</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="h-5 w-5 stroke-[3]" />
              </div>
            </div>

            {/* Card 3: Late Login */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">
                  LATE LOGIN
                </div>
                <div className="text-2xl font-extrabold text-amber-500 font-mono">
                  {monSummary.late}
                </div>
                <div className="text-xs text-amber-500 font-medium">After 08:15 AM</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            {/* Card 4: Not Logged In */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">
                  NOT LOGGED IN
                </div>
                <div className="text-2xl font-extrabold text-rose-500 font-mono">
                  {monSummary.notLoggedIn}
                </div>
                <div className="text-xs text-rose-500 font-medium">Beyond 12:30 PM</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <UserX className="h-5 w-5" />
              </div>
            </div>

            {/* Card 5: Idle Faculty */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider">
                  IDLE FACULTY
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {idleTrainers.length}
                </div>
                <div className="text-xs text-slate-400 font-medium">Need Attention</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <Coffee className="h-5 w-5" />
              </div>
            </div>

            {/* Card 6: Pending Leaves */}
            <Link
              href="/admin/leaves"
              className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">
                  PENDING LEAVES
                </div>
                <div className="text-2xl font-extrabold text-amber-500 font-mono">
                  {pendingLeavesCount}
                </div>
                <div className="text-xs text-purple-600 font-bold">Yet to Approve</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
            </Link>
          </div>

          {/* Live Faculty Radar Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" /> Live Faculty Radar & Task Allocation
              </h2>
              <Link
                href="/admin/live-monitor"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Full Screen Radar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {liveActivities.map((trainer) => (
                <TeacherStatusCard
                  key={trainer.id}
                  trainer={trainer}
                  onAssignTask={handleAssignTask}
                />
              ))}
            </div>
          </div>


        {/* Central Trainer Monitoring Live Table with EDIT BUTTONS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden space-y-0">
          <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Radio className="h-4 w-4 text-rose-600 animate-pulse" /> Live Trainer Attendance & Topic Tracker
              </h2>
              <p className="text-xs text-slate-500">
                Click <strong>"Edit"</strong> on any row to override login time, attendance status, or today's topic.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/leaves"
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Leave Overrides
              </Link>
              <Link
                href="/admin/holidays"
                className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors"
              >
                Holiday Rules
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold">
                  <th className="py-3.5 px-4">Trainer</th>
                  <th className="py-3.5 px-4">Login Time</th>
                  <th className="py-3.5 px-4">Attendance</th>
                  <th className="py-3.5 px-4">Today's Topic Covered</th>
                  <th className="py-3.5 px-4">Leave Quota</th>
                  <th className="py-3.5 px-4 text-center">Monthly Incentive</th>
                  <th className="py-3.5 px-4 text-center">Live Status</th>
                  <th className="py-3.5 px-4 text-right">Edit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {!monitoringSnapshot || monitoringSnapshot.trainers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                      Loading trainers snapshot...
                    </td>
                  </tr>
                ) : (
                  monitoringSnapshot.trainers.map((t) => {
                    const inTimeFormatted = t.login_time
                      ? new Date(t.login_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : '—';

                    return (
                      <tr key={t.trainer_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/admin/trainers/${t.trainer_id}`}
                            className="flex items-center gap-2.5 group cursor-pointer"
                            title="View Full 360° Profile & Batches"
                          >
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                              {t.trainer_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                                {t.trainer_name}
                                <span className="text-[10px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">{t.phone || 'Linked'}</div>
                            </div>
                          </Link>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {inTimeFormatted}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              t.attendance_status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.attendance_status === 'Late'
                                ? 'bg-amber-100 text-amber-800'
                                : t.attendance_status === 'On Leave'
                                ? 'bg-purple-100 text-purple-800'
                                : t.attendance_status === 'Week Off'
                                ? 'bg-blue-100 text-blue-800'
                                : t.attendance_status === 'Holiday'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-rose-100 text-rose-800 font-extrabold'
                            }`}
                          >
                            {t.attendance_status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate" title={t.today_topic}>
                          {t.today_topic !== '—' ? (
                            <span className="font-bold text-indigo-900">📖 {t.today_topic}</span>
                          ) : (
                            <span className="text-slate-400">No session logged yet</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-extrabold text-slate-800">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                            {t.leave_balance_display}
                          </span>
                        </td>

                        {/* 💰 Monthly Incentive Column */}
                        <td className="py-3.5 px-4 text-center">
                          {t.trainer_id === 'usr_trainer_1' || t.trainer_name.toLowerCase().includes('rahul') ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              🏆 ₹2,000 (≥7h)
                            </span>
                          ) : t.trainer_id === 'usr_trainer_2' || t.trainer_name.toLowerCase().includes('priya') ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              💰 ₹1,000 (6h)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              ₹0 (Base 5h)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {t.status_badge === 'logged_in' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500 text-white shadow-xs">
                              🟢 Logged In
                            </span>
                          )}
                          {t.status_badge === 'late' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500 text-white shadow-xs">
                              🟡 Late
                            </span>
                          )}
                          {t.status_badge === 'not_logged_in' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-600 text-white shadow-xs">
                              🔴 Not Logged In
                            </span>
                          )}
                          {t.status_badge === 'on_leave' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-purple-600 text-white shadow-xs">
                              🟠 On Leave
                            </span>
                          )}
                          {t.status_badge === 'weekoff' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-600 text-white shadow-xs">
                              🟣 Week Off
                            </span>
                          )}
                          {t.status_badge === 'holiday' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-cyan-600 text-white shadow-xs">
                              🔵 Holiday
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] border border-indigo-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Multi-Topic Course Coverage Progress Section with Batch Management */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" /> Batch Syllabus & Multi-Topic Completion Analytics
              </h3>
              <p className="text-xs text-slate-500">
                Real-time tracking of covered syllabus topics across active course batches.
              </p>
            </div>
            <Link
              href="/admin/batches"
              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" /> Manage & Edit Batches
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topicCoverages.length === 0 ? (
              <div className="col-span-3 text-center py-6 text-slate-400 text-xs font-medium">
                No active batch topic data available.
              </div>
            ) : (
              topicCoverages.slice(0, 6).map((cov) => (
                <div
                  key={cov.batch_id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 truncate max-w-[180px]" title={cov.batch_name}>
                      {cov.batch_name}
                    </span>
                    <span className="font-mono font-extrabold text-xs text-indigo-600">
                      {cov.covered_topics} / {cov.total_topics} Topics ({cov.coverage_percentage}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 transition-all duration-500"
                      style={{ width: `${cov.coverage_percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                    <span>
                      👨‍🏫 {cov.trainer_name || 'Faculty'}
                    </span>
                    <Link
                      href={`/admin/batches`}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      <Edit3 className="h-3 w-3" /> Edit Batch
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* EDIT TRAINER MONITORING OVERRIDE MODAL */}
        {editingTrainer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-indigo-600" /> Edit Today's Attendance & Topic Override
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifying records for <strong>{editingTrainer.trainer_name}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setEditingTrainer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {editMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                    editMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {editMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  {editMessage.text}
                </div>
              )}

              <form onSubmit={handleSaveTrainerOverride} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Attendance Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 rounded-xl font-bold text-slate-800 border border-slate-300 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="Present">Present (🟢)</option>
                      <option value="Late">Late (🟡)</option>
                      <option value="Not Logged In">Not Logged In (🔴)</option>
                      <option value="On Leave">On Leave (🟠)</option>
                      <option value="Half Day">Half Day (🌓)</option>
                      <option value="Week Off">Week Off (🟣)</option>
                      <option value="Holiday">Holiday (🔵)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Login Time</label>
                    <input
                      type="time"
                      value={editLoginTime}
                      onChange={(e) => setEditLoginTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 rounded-xl font-mono font-bold text-slate-900 border border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Today's Topic Covered
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Variables, Data Types, Operators and hands-on lab exercises"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-slate-800 border border-slate-300 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Location / Lab Name</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-slate-800 border border-slate-300 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTrainer(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingEdit ? 'Saving...' : 'Save & Update Dashboard'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </main>
  );
}

