'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearStoredUser, getStoredUser } from '@/lib/auth';
import { User } from '@/lib/types';
import {
  LayoutDashboard,
  BookOpen,
  Camera,
  PlusCircle,
  CheckSquare,
  CalendarDays,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function TrainerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const handleLogout = async () => {
    clearStoredUser();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // silent
    }
    window.location.href = '/login';
  };

  const links = [
    { href: '/trainer/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/trainer/batches', label: 'My Batches', icon: BookOpen },
    { href: '/trainer/attendance', label: 'Mark Attendance', icon: Camera },
    { href: '/trainer/sessions/add', label: 'Log Work Session', icon: PlusCircle },
    { href: '/trainer/tasks', label: 'Tasks & Syllabus', icon: CheckSquare },
    { href: '/trainer/leaves', label: 'My Leaves', icon: CalendarDays },
  ];

  const userName = currentUser?.name || 'Kanzariya Pratik';
  const userRole = 'Faculty Trainer';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div className="lg:hidden w-full bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-sm">
            LT
          </div>
          <span className="font-extrabold text-sm text-slate-900 tracking-tight">Learnmore Trainer</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          aria-label="Toggle Navigation"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="w-72 max-w-[80vw] h-full bg-white p-5 flex flex-col justify-between shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-md">
                    LT
                  </div>
                  <div className="font-extrabold text-sm text-slate-900">
                    Learnmore <span className="text-blue-600">Trainer</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {links.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 truncate">{userName}</div>
                  <div className="text-[10px] text-slate-500">{userRole}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200/60 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-60 shrink-0 hidden lg:flex flex-col bg-white border-r border-slate-200/80 h-screen sticky top-0 p-4 justify-between overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-2 py-3 mb-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-md">
              LT
            </div>
            <div className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">
              Learnmore <br />
              <span className="text-blue-600 font-bold text-xs">Trainer Portal</span>
            </div>
          </div>

          {/* Sidebar Nav Links */}
          <nav className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {links.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout at Bottom */}
        <div className="pt-3 border-t border-slate-100 space-y-2 shrink-0">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-xs text-slate-900 truncate">{userName}</div>
                <div className="text-[10px] text-slate-500 font-semibold truncate">{userRole}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200/60 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="h-4 w-4 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
