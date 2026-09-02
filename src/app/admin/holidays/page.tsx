'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Holiday, HolidayConfig } from '@/lib/types';
import {
  CalendarDays,
  Calendar,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';

export default function AdminHolidaysPage() {
  const [config, setConfig] = useState<HolidayConfig>({
    mandatory_holidays: [],
    optional_holidays: [],
    week_off_pattern: 'sunday',
  });
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Holiday Input state
  const [newMandatory, setNewMandatory] = useState<{ name: string; date: string }>({ name: '', date: '' });
  const [newOptional, setNewOptional] = useState<{ name: string; date: string }>({ name: '', date: '' });

  const fetchHolidayConfig = async () => {
    try {
      const res = await fetch('/api/holidays');
      const data = await res.json();
      if (data.success) {
        setConfig(data.holidayConfig);
        setSchedule(data.monthlySchedule);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidayConfig();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: 'Holiday & Week-Off rules saved successfully!', type: 'success' });
        fetchHolidayConfig();
      } else {
        setMessage({ text: data.error || 'Failed to save', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addMandatoryHoliday = () => {
    if (!newMandatory.name || !newMandatory.date) return;
    setConfig((prev) => ({
      ...prev,
      mandatory_holidays: [
        ...prev.mandatory_holidays,
        { name: newMandatory.name, date: newMandatory.date, type: 'mandatory' },
      ],
    }));
    setNewMandatory({ name: '', date: '' });
  };

  const removeMandatoryHoliday = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      mandatory_holidays: prev.mandatory_holidays.filter((_, i) => i !== index),
    }));
  };

  const addOptionalHoliday = () => {
    if (!newOptional.name || !newOptional.date) return;
    setConfig((prev) => ({
      ...prev,
      optional_holidays: [
        ...prev.optional_holidays,
        { name: newOptional.name, date: newOptional.date, type: 'optional' },
      ],
    }));
    setNewOptional({ name: '', date: '' });
  };

  const removeOptionalHoliday = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      optional_holidays: prev.optional_holidays.filter((_, i) => i !== index),
    }));
  };

  return (
    <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <CalendarDays className="h-7 w-7 text-indigo-600" /> Holiday & Week-Off Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Configure 5 Mandatory Holidays, 5 Optional Festival Days, and Monthly Week-Off Rules.
            </p>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-xs ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Current Month Working Days Calculation Card */}
        {schedule && (
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" /> Current Month Schedule ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
              </h2>
              <span className="text-[11px] font-bold text-slate-500">Auto-Calculated Engine</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[11px] font-bold text-slate-500">Total Calendar Days</div>
                <div className="text-xl font-extrabold text-slate-800 font-mono mt-1">{schedule.totalDays} Days</div>
              </div>
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                <div className="text-[11px] font-bold text-indigo-700">Week-Off Days</div>
                <div className="text-xl font-extrabold text-indigo-900 font-mono mt-1">{schedule.weekOffDays} Days</div>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                <div className="text-[11px] font-bold text-amber-700">Mandatory Holidays</div>
                <div className="text-xl font-extrabold text-amber-900 font-mono mt-1">{schedule.mandatoryHolidayDays} Days</div>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-700">Net Working Days</div>
                <div className="text-xl font-extrabold text-emerald-900 font-mono mt-1">{schedule.netWorkingDays} Days</div>
              </div>
            </div>
          </div>
        )}

        {/* Week-Off Rule Configuration */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            ⚙️ Organization Week-Off Policy
          </h2>
          <p className="text-xs text-slate-500">
            Week-off days are automatically excluded from absence calculations, 12 PM non-login alerts, and leave deductions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'sunday', title: 'Sunday Only', desc: 'Every Sunday is a weekly off (Default)' },
              { id: 'sat_sun', title: 'Saturday & Sunday', desc: '5-day working week' },
              { id: 'alternate_sat_sun', title: 'Sunday + 2nd/4th Sat', desc: 'All Sundays + 2nd & 4th Saturdays' },
            ].map((rule) => (
              <label
                key={rule.id}
                onClick={() => setConfig((prev) => ({ ...prev, week_off_pattern: rule.id as any }))}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  config.week_off_pattern === rule.id
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-extrabold text-xs text-slate-900">{rule.title}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{rule.desc}</div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-600">
                  {config.week_off_pattern === rule.id ? '✓ Active Policy' : 'Select'}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 5 Mandatory Holidays & 5 Optional Holidays Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mandatory Holidays */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                🏛️ Mandatory Holidays ({config.mandatory_holidays.length} Configured)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
                Compulsory
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {config.mandatory_holidays.map((h, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                >
                  <div>
                    <span className="text-slate-900 font-bold">{h.name}</span>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">📅 {h.date}</div>
                  </div>
                  <button
                    onClick={() => removeMandatoryHoliday(index)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Mandatory */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-700">Add Mandatory Holiday</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Holiday Name (e.g. Republic Day)"
                  value={newMandatory.name}
                  onChange={(e) => setNewMandatory((p) => ({ ...p, name: e.target.value }))}
                  className="p-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-slate-50"
                />
                <input
                  type="date"
                  value={newMandatory.date}
                  onChange={(e) => setNewMandatory((p) => ({ ...p, date: e.target.value }))}
                  className="p-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-slate-50"
                />
              </div>
              <button
                type="button"
                onClick={addMandatoryHoliday}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Mandatory Holiday
              </button>
            </div>
          </div>

          {/* Optional Holidays */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                ✨ Optional Holidays ({config.optional_holidays.length} Configured)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                Festival Pool
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {config.optional_holidays.map((h, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/40 border border-amber-200 text-xs font-semibold"
                >
                  <div>
                    <span className="text-slate-900 font-bold">{h.name}</span>
                    <div className="text-[11px] font-mono text-amber-700 mt-0.5">📅 {h.date}</div>
                  </div>
                  <button
                    onClick={() => removeOptionalHoliday(index)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Optional */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-700">Add Optional Festival Holiday</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Festival Name (e.g. Holi)"
                  value={newOptional.name}
                  onChange={(e) => setNewOptional((p) => ({ ...p, name: e.target.value }))}
                  className="p-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-slate-50"
                />
                <input
                  type="date"
                  value={newOptional.date}
                  onChange={(e) => setNewOptional((p) => ({ ...p, date: e.target.value }))}
                  className="p-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-slate-50"
                />
              </div>
              <button
                type="button"
                onClick={addOptionalHoliday}
                className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Optional Holiday
              </button>
            </div>
          </div>
        </div>
    </main>
  );
}
