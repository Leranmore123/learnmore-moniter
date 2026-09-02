'use client';

import React, { useState, useEffect } from 'react';
import { getStoredUser } from '@/lib/auth';
import { User, TaskLog, TaskCategory } from '@/lib/types';
import {
  CheckSquare,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  HelpCircle,
  PhoneCall,
  FileText,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function TrainerTasksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<TaskLog[]>([]);
  const [activeTask, setActiveTask] = useState<TaskLog | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('doubt_solving');
  const [notes, setNotes] = useState('');

  const fetchTasks = async (userId: string) => {
    try {
      const res = await fetch(`/api/tasks?trainer_id=${userId}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
        const current = data.tasks.find((t: TaskLog) => !t.is_completed);
        setActiveTask(current || null);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    const u = getStoredUser();
    if (u) {
      setUser(u);
      fetchTasks(u.id);
    }
  }, []);

  // Timer loop for active task
  useEffect(() => {
    let timer: any = null;
    if (activeTask) {
      const startMs = new Date(activeTask.start_time).getTime();
      setElapsedSec(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));

      timer = setInterval(() => {
        setElapsedSec(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
      }, 1000);
    } else {
      setElapsedSec(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeTask]);

  const handleStartTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        trainer_id: user.id,
        title: title.trim(),
        category,
        notes,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setTitle('');
      setNotes('');
      fetchTasks(user.id);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', taskId }),
    });
    fetchTasks(user.id);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!user) return null;

  return (
    <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-blue-400" /> Non-Lecture Task Time-Blocker
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Start time-blocks during non-class hours for doubt clearing, paper evaluation, and student counseling to maintain 100% active utilization.
            </p>
          </div>

          {/* Active Task Stopwatch (if currently working) */}
          {activeTask ? (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border border-blue-500/40 shadow-xl shadow-blue-950/30 space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-400 pulse-green" />
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
                      ACTIVE TASK IN PROGRESS
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{activeTask.title}</h2>
                  <p className="text-xs text-slate-300 capitalize font-mono">
                    Category: {activeTask.category.replace('_', ' ')}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                    {formatTimer(elapsedSec)}
                  </div>
                  <button
                    onClick={() => handleCompleteTask(activeTask.id)}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Finish & Log
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Start New Task Form */
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Play className="h-4 w-4 text-emerald-400" /> Start a Free-Time Activity / Micro-Task
              </h3>

              <form onSubmit={handleStartTask} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1.5">Task Title / Activity Focus</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1-on-1 Doubt solving for Batch A students on Recursion"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="doubt_solving">Student Doubt Solving</option>
                      <option value="paper_checking">Test Paper Evaluation</option>
                      <option value="calling">Parent / Absentee Calling</option>
                      <option value="curriculum_planning">Curriculum & Notes Prep</option>
                      <option value="lab_assistance">Lab Practical Assistance</option>
                      <option value="other">Other Work</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Notes / Student Details (Optional)</label>
                  <input
                    type="text"
                    placeholder="Specific student names or topics..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                  >
                    <Play className="h-4 w-4" /> Start Stopwatch Timer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Completed Task History */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" /> Completed Tasks Log
            </h3>

            <div className="space-y-3">
              {tasks.filter((t) => t.is_completed).length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No completed task blocks logged today.
                </div>
              ) : (
                tasks
                  .filter((t) => t.is_completed)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{task.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-blue-500/20 text-blue-300">
                            {task.category.replace('_', ' ')}
                          </span>
                        </div>
                        {task.notes && <p className="text-slate-400 italic">"{task.notes}"</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-emerald-400">
                          {task.duration_minutes} mins
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(task.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
    </main>
  );
}
