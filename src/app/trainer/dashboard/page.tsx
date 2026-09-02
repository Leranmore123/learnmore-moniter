'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getStoredUser } from '@/lib/auth';
import { User, Batch, WorkSession } from '@/lib/types';
import {
  Camera,
  BookOpen,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Play,
  Share2,
  Video
} from 'lucide-react';

export default function TrainerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace('/login');
      return;
    }
    setUser(u);

    const fetchTrainerData = async () => {
      try {
        const [bRes, sRes] = await Promise.all([
          fetch(`/api/batches?trainer_id=${u.id}`),
          fetch(`/api/sessions`),
        ]);
        const bData = await bRes.json();
        const sData = await sRes.json();
        if (bData.success) {
          // Strictly filter batches for this trainer only
          const myBatches = (bData.batches || []).filter(
            (b: Batch) => b.trainer_id === u.id || b.trainer_name?.toLowerCase() === u.name?.toLowerCase()
          );
          setBatches(myBatches);
        }
        if (sData.success) {
          const mySessions = (sData.sessions || []).filter(
            (s: WorkSession) => s.trainer_id === u.id
          );
          setSessions(mySessions);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerData();
  }, [router]);

  return (
    <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white font-bold text-xs">
              👨‍🏫 Trainer Portal
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Trainer'}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Track lecture hours, submit syllabus updates to WhatsApp, and mark your daily selfie attendance.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/trainer/sessions/add"
              className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Work Session
            </Link>

            <Link
              href="/trainer/attendance"
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Camera className="h-4 w-4" /> Mark Attendance
            </Link>
          </div>
        </div>

        {/* 3 Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Assigned Batches
              </div>
              <div className="text-3xl font-extrabold text-slate-800">{batches.length}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
              📦
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Sessions Logged
              </div>
              <div className="text-3xl font-extrabold text-slate-800">{sessions.length}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
              📝
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Today Status
              </div>
              <div className="text-lg font-extrabold text-emerald-600 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="h-4 w-4" /> Checked In
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-2xl">
              📸
            </div>
          </div>
        </div>

        {/* Batches Overview Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" /> My Training Batches
            </h2>
            <Link
              href="/trainer/batches"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              View All Batches →
            </Link>
          </div>

          {batches.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="text-4xl">📦</div>
              <h3 className="text-base font-extrabold text-slate-800">No Batches Assigned Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You do not have any active batches assigned by the institute admin. Once a batch is assigned, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batches.map((batch) => {
                const used = batch.used_hours || 0;
                const total = batch.total_hours || 1;
                const remaining = Math.max(0, total - used);

                return (
                  <div
                    key={batch.id}
                    className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 space-y-3 flex flex-col justify-between hover:shadow-md transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                          {batch.batch_type || 'training'}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">On Track</span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 pt-1">{batch.name}</h3>
                      <p className="text-xs text-slate-400">
                        {batch.total_students || 18} Students • Started {batch.start_date || '2026-08-01'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-slate-600">
                        Used: <strong>{used}h</strong> / {total}h
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/trainer/live-class/${batch.id}`}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                          title="Start Live Video Class"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Live</span>
                        </Link>
                        <Link
                          href={`/trainer/sessions/add?batch=${batch.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                        >
                          + Log
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </main>
  );
}
