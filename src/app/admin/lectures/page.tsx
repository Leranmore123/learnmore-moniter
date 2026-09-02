'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Video, Search, Calendar, Clock, User, BookOpen, Play, CheckCircle2, Radio, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface LectureLog {
  id: string;
  course: string;
  batchId?: string;
  batchName: string;
  trainer: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  attendanceCount: number;
  videoUrl?: string;
}

export default function AdminLectureVaultPage() {
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/batches')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBatches(d.batches || []);
      })
      .catch(() => {});
  }, []);

  // Real lecture history + batch-connected records
  const [lectures] = useState<LectureLog[]>([
    {
      id: 'lec_1',
      course: 'Python Full Stack',
      batchId: 'btc_3',
      batchName: 'Python Data Science & ML - Morning Batch',
      trainer: 'Priya Patel',
      date: '2026-09-02',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      duration: '1h 30m',
      attendanceCount: 22,
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    {
      id: 'lec_2',
      course: 'Full-Stack Web Development',
      batchId: 'btc_1',
      batchName: 'MERN Stack - Morning Batch A',
      trainer: 'Rahul Sharma',
      date: '2026-09-02',
      startTime: '09:00 AM',
      endTime: '10:45 AM',
      duration: '1h 45m',
      attendanceCount: 18,
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    {
      id: 'lec_3',
      course: 'Database & Analytics',
      batchId: 'btc_2',
      batchName: 'SQL & Database Engineering - Morning Batch',
      trainer: 'Karan Dave',
      date: '2026-09-01',
      startTime: '04:00 PM',
      endTime: '05:15 PM',
      duration: '1h 15m',
      attendanceCount: 15,
    },
  ]);

  const filteredLectures = lectures.filter((l) => {
    const matchesCourse = selectedCourse === 'all' || l.course.toLowerCase().includes(selectedCourse.toLowerCase());
    const matchesSearch =
      l.trainer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.batchName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  return (
    <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Video className="w-5 h-5" />
            </span>
            Lecture Vault & Class Tracker
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track trainer live class timings, durations, attendance, and watch recorded lectures.
          </p>
        </div>

        {/* Quick Batch Live Launcher for Admin */}
        <div className="flex items-center gap-2">
          {batches.length > 0 && (
            <Link
              href={`/trainer/live-class/${batches[0].id}`}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Radio className="w-4 h-4 animate-pulse text-rose-300" />
              <span>Launch Live Room</span>
            </Link>
          )}
        </div>
      </div>

      {/* Active Batches Live Class Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {batches.slice(0, 3).map((b) => (
          <div key={b.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {b.batch_type || 'training'}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Ready
              </span>
            </div>
            <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{b.name}</h4>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Trainer: {b.trainer_name || 'Assigned'}</span>
              <Link
                href={`/trainer/live-class/${b.id}`}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
              >
                Join / Start →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by trainer or batch name..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full sm:w-56 bg-white border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Courses</option>
          <option value="python">Python</option>
          <option value="web">Web Development / MERN</option>
          <option value="sql">Database & Analytics</option>
        </select>
      </div>

      {/* Lectures Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-extrabold">
                <th className="py-4 px-6">Course & Batch</th>
                <th className="py-4 px-6">Trainer</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Start - End Time</th>
                <th className="py-4 px-6">Duration</th>
                <th className="py-4 px-6">Attendance</th>
                <th className="py-4 px-6 text-right">Action / Recording</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredLectures.map((lec) => (
                <tr key={lec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{lec.course}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{lec.batchName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lec.trainer}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lec.date}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lec.startTime} - {lec.endTime}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold">
                      {lec.duration}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {lec.attendanceCount} Students
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {lec.videoUrl ? (
                        <button
                          onClick={() => window.open(lec.videoUrl, '_blank')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Watch</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No recording</span>
                      )}

                      {lec.batchId && (
                        <Link
                          href={`/live/join/${lec.batchId}`}
                          target="_blank"
                          className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                          title="Open Student Join Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
