'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Camera,
  Clock,
  FileBarChart2,
  CalendarDays,
  Calendar,
  MessageSquare,
  Radio,
  Shield,
  ChevronDown,
  GraduationCap,
  Video
} from 'lucide-react';
import WhatsAppBotModal from './WhatsAppBotModal';

export default function Navbar() {
  const pathname = usePathname();
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-2xs sticky top-0 z-30">
      {/* Primary Navigation Tabs */}
      <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        <Link
          href="/admin/dashboard"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            pathname === '/admin/dashboard'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
        </Link>

        <Link
          href="/admin/courses"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            pathname.startsWith('/admin/courses')
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5" /> Courses
        </Link>

        <Link
          href="/admin/batches"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            pathname.startsWith('/admin/batches')
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" /> Batches
        </Link>

        <Link
          href="/admin/lectures"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            pathname.startsWith('/admin/lectures')
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Video className="h-3.5 w-3.5" /> Live & Lectures
        </Link>

        <Link
          href="/admin/trainers"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            pathname === '/admin/trainers'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="h-3.5 w-3.5" /> Trainers
        </Link>

        <Link
          href="/admin/attendance"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            pathname === '/admin/attendance'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Camera className="h-3.5 w-3.5" /> Attendance
        </Link>

        <Link
          href="/admin/monitoring"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            pathname === '/admin/monitoring'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="h-3.5 w-3.5" /> Login Monitor
        </Link>

        <Link
          href="/admin/reports"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            pathname === '/admin/reports'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileBarChart2 className="h-3.5 w-3.5" /> Reports
        </Link>

        <Link
          href="/admin/leaves"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            pathname === '/admin/leaves'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" /> Leaves
        </Link>

        <Link
          href="/admin/holidays"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            pathname === '/admin/holidays'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" /> Holidays
        </Link>

        {/* WhatsApp Green Button */}
        <Link
          href="/admin/whatsapp"
          className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-extrabold text-xs flex items-center gap-1.5 border border-emerald-200/80 transition-all shrink-0 cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
        </Link>

        {/* Radar Pink Button */}
        <Link
          href="/admin/live-monitor"
          className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-xs flex items-center gap-1.5 border border-rose-200/80 transition-all shrink-0 cursor-pointer"
        >
          <Radio className="h-3.5 w-3.5 text-rose-500 animate-pulse" /> Radar
        </Link>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer">
          <Shield className="h-3.5 w-3.5 text-blue-600" />
          <span>Institute Admin</span>
          <ChevronDown className="h-3 w-3 text-blue-500" />
        </button>

        <div className="h-8 w-8 rounded-full bg-rose-500 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
          K
        </div>
      </div>

      <WhatsAppBotModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
      />
    </header>
  );
}

