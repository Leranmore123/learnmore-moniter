'use client';

import React, { useState } from 'react';
import { User, LiveActivity } from '@/lib/types';
import {
  Clock,
  BookOpen,
  Coffee,
  Activity,
  UserCheck
} from 'lucide-react';

interface TeacherStatusCardProps {
  trainer: User & { activity: LiveActivity };
  onAssignTask?: (trainerId: string, taskTitle: string) => void;
}

export default function TeacherStatusCard({ trainer, onAssignTask }: TeacherStatusCardProps) {
  const [taskInput, setTaskInput] = useState('');
  const [showAssign, setShowAssign] = useState(false);

  const act = trainer.activity || {};
  const isIdle = act.status === 'idle';
  const isInClass = act.status === 'in_class';
  const isWorkingTask = act.status === 'working_task';
  const isOnBreak = act.status === 'break' || isIdle;

  const startTimeStr = act.status_started_at
    ? new Date(act.status_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    : '00:00';

  const teachingMin = act.total_teaching_today_minutes || 0;
  const taskMin = act.total_task_today_minutes || 0;
  const breakMin = act.total_idle_today_minutes || 0;
  const totalMin = teachingMin + taskMin;

  // Custom mock initial photo avatar matching reference design
  const getAvatarUrl = (name: string) => {
    if (name.toLowerCase().includes('rahul')) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
    if (name.toLowerCase().includes('priya')) return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80';
    if (name.toLowerCase().includes('amit')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
    return trainer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${trainer.username}`;
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all space-y-4">
      {/* Top row: Avatar + Name + Status Pill */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={getAvatarUrl(trainer.name)}
              alt={trainer.name}
              className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-xs"
            />
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{trainer.name}</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{trainer.designation || 'Faculty Trainer'}</p>
          </div>
        </div>

        {/* Status Pill Badge */}
        {isInClass ? (
          <div className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1.5 shrink-0">
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>ON CLASS</span>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5 shrink-0">
            <Coffee className="h-3.5 w-3.5 text-amber-500" />
            <span>ON BREAK</span>
          </div>
        )}
      </div>

      {/* Dark Focus Box */}
      <div className="p-4 rounded-2xl bg-[#1e293b] text-white space-y-2.5 shadow-inner">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Current Focus</span>
          <span className="flex items-center gap-1 font-mono">
            <Clock className="h-3 w-3 text-slate-400" />
            Started {startTimeStr}
          </span>
        </div>

        <div className="text-xs font-bold text-slate-100 leading-snug">
          {act.current_task_title || (isInClass ? 'Preparing Python Nearby & Panda Lab Assignment' : 'Nested Out for the day')}
        </div>
      </div>

      {/* 3 Stat Counter Boxes */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-[#334155] text-center space-y-1">
          <div className="text-[9px] font-extrabold uppercase text-slate-300 tracking-wider">TEACHING TIME</div>
          <div className="text-xs font-mono font-bold text-emerald-400">
            {Math.floor(teachingMin / 60)}h {teachingMin % 60}m
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#334155] text-center space-y-1">
          <div className="text-[9px] font-extrabold uppercase text-slate-300 tracking-wider">BREAK TIME</div>
          <div className="text-xs font-mono font-bold text-emerald-400">
            {Math.floor(breakMin / 60)}h {breakMin % 60}m
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#334155] text-center space-y-1">
          <div className="text-[9px] font-extrabold uppercase text-slate-300 tracking-wider">TOTAL TIME</div>
          <div className="text-xs font-mono font-bold text-slate-100">
            {totalMin}m
          </div>
        </div>
      </div>
    </div>
  );
}

