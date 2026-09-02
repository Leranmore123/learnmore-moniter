'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Leave, User, TrainerLeaveBalance, LeaveAuditLog } from '@/lib/types';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Filter as FilterIcon,
  X,
  Sliders,
  History,
  ShieldCheck,
  Plus,
  AlertCircle
} from 'lucide-react';

export default function AdminLeavesPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'balances' | 'audits'>('requests');
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [balances, setBalances] = useState<TrainerLeaveBalance[]>([]);
  const [auditLogs, setAuditLogs] = useState<LeaveAuditLog[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [trainerFilter, setTrainerFilter] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ status: 'all', trainer: 'all' });

  // Adjustment Modal
  const [adjustingTrainer, setAdjustingTrainer] = useState<TrainerLeaveBalance | null>(null);
  const [adjustLeaveType, setAdjustLeaveType] = useState<'casual_sick' | 'optional_holiday'>('casual_sick');
  const [newBalanceValue, setNewBalanceValue] = useState<number>(12);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustMsg, setAdjustMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchLeavesData = async () => {
    try {
      const [lRes, uRes, bRes] = await Promise.all([
        fetch('/api/leaves'),
        fetch('/api/users?role=trainer'),
        fetch('/api/leaves/adjust'),
      ]);
      const lData = await lRes.json();
      const uData = await uRes.json();
      const bData = await bRes.json();
      if (lData.success) setLeaves(lData.leaves || []);
      if (uData.success) setTrainers(uData.users || []);
      if (bData.success) {
        setBalances(bData.balances || []);
        setAuditLogs(bData.auditLogs || []);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchLeavesData();
  }, []);

  const handleDecision = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    await fetch('/api/leaves', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchLeavesData();
  };

  const handleOpenAdjustModal = (b: TrainerLeaveBalance) => {
    setAdjustingTrainer(b);
    setAdjustLeaveType('casual_sick');
    setNewBalanceValue(b.casual_sick_quota);
    setAdjustReason('');
    setAdjustMsg(null);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingTrainer) return;
    setAdjustLoading(true);
    setAdjustMsg(null);

    try {
      const res = await fetch('/api/leaves/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainer_id: adjustingTrainer.trainer_id,
          admin_name: 'Director (Admin)',
          leave_type: adjustLeaveType,
          new_balance: newBalanceValue,
          reason: adjustReason || 'Administrative quota override',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdjustMsg({ text: data.message || 'Leave quota adjusted successfully!', type: 'success' });
        fetchLeavesData();
        setTimeout(() => {
          setAdjustingTrainer(null);
        }, 1200);
      } else {
        setAdjustMsg({ text: data.error || 'Failed to adjust balance', type: 'error' });
      }
    } catch (err: any) {
      setAdjustMsg({ text: err.message || 'Network error', type: 'error' });
    } finally {
      setAdjustLoading(false);
    }
  };

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length;

  const filteredLeaves = leaves.filter((leave) => {
    if (appliedFilters.status !== 'all' && leave.status !== appliedFilters.status) return false;
    if (appliedFilters.trainer !== 'all' && leave.trainer_id !== appliedFilters.trainer) return false;
    return true;
  });

  return (
    <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <CalendarDays className="h-7 w-7 text-indigo-600" /> Leave Management & Admin Override
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Review leave requests, adjust trainer quotas (12 Casual / 5 Optional), and inspect complete audit trails.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-2xl">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📥 Leave Requests ({pendingCount} Pending)
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'balances'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚖️ Quotas & Balances
            </button>
            <button
              onClick={() => setActiveTab('audits')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'audits'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛡️ Audit Logs ({auditLogs.length})
            </button>
          </div>
        </div>

        {/* TAB 1: LEAVE REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Top Summary Pills */}
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Pending: <strong className="text-slate-900">{pendingCount}</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Approved: <strong className="text-slate-900">{approvedCount}</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Rejected: <strong className="text-slate-900">{rejectedCount}</strong>
              </span>
            </div>

            {/* Leave Requests Table */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold">
                      <th className="py-3.5 px-4">Trainer</th>
                      <th className="py-3.5 px-4">Leave Type</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4">Reason</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredLeaves.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                          No leave applications found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLeaves.map((leave) => (
                        <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            👨‍🏫 {leave.trainer_name || 'Trainer'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-mono">
                              {leave.leave_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 font-bold">
                            📅 {leave.start_date === leave.end_date ? leave.start_date : `${leave.start_date} to ${leave.end_date}`}
                          </td>
                          <td className="py-3 px-4 text-slate-600 italic max-w-xs truncate">
                            "{leave.reason}"
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                leave.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : leave.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  leave.status === 'approved'
                                    ? 'bg-emerald-500'
                                    : leave.status === 'rejected'
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              {leave.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            {leave.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleDecision(leave.id, 'approved')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleDecision(leave.id, 'rejected')}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUOTAS & BALANCES (ADMIN OVERRIDE) */}
        {activeTab === 'balances' && (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl text-xs text-indigo-900 font-medium">
              💡 <strong>Admin Leave Override:</strong> You have full permission to manually increase or decrease trainer leave balances (e.g. from 12 → 10 or 10 → 12). Every adjustment is recorded in the immutable audit log below.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {balances.map((b) => (
                <div key={b.trainer_id} className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      👨‍🏫 {b.trainer_name}
                    </h3>
                    <button
                      onClick={() => handleOpenAdjustModal(b)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sliders className="h-3.5 w-3.5" /> Adjust Balance
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                      <span className="font-semibold text-slate-600">Casual / Sick Leave Quota:</span>
                      <span className="font-mono font-extrabold text-slate-900">
                        {b.casual_sick_quota - b.casual_sick_used} / {b.casual_sick_quota} Available
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-amber-50/40 rounded-xl border border-amber-200/60">
                      <span className="font-semibold text-amber-900">Optional Holidays:</span>
                      <span className="font-mono font-extrabold text-amber-800">
                        {b.optional_holiday_quota - b.optional_holiday_used} / {b.optional_holiday_quota} Available
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-emerald-50/40 rounded-xl border border-emerald-200/60">
                      <span className="font-semibold text-emerald-900">Mandatory Holidays:</span>
                      <span className="font-mono font-extrabold text-emerald-800">5 / 5 Entitled</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'audits' && (
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600" /> Immutable Leave Adjustment Audit Trail
              </h3>
              <span className="text-[11px] font-bold text-slate-500">Every manual override is permanently logged</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold">
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Trainer</th>
                    <th className="py-3.5 px-4">Leave Type</th>
                    <th className="py-3.5 px-4">Balance Change</th>
                    <th className="py-3.5 px-4">Reason / Notes</th>
                    <th className="py-3.5 px-4">Modified By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                        No manual leave modifications recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {new Date(log.created_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          👨‍🏫 {log.trainer_name}
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-700">
                          {log.leave_type}
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-slate-800">
                          {log.old_balance} → <span className="text-indigo-600 font-black">{log.new_balance}</span> ({log.adjustment > 0 ? `+${log.adjustment}` : log.adjustment})
                        </td>
                        <td className="py-3 px-4 text-slate-600 italic">
                          "{log.reason}"
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-700">
                          🛡️ {log.admin_name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADJUST LEAVE MODAL */}
        {adjustingTrainer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-600" /> Adjust Leave Balance
                </h3>
                <button
                  onClick={() => setAdjustingTrainer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {adjustMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                    adjustMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {adjustMsg.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  {adjustMsg.text}
                </div>
              )}

              <form onSubmit={handleSaveAdjustment} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Trainer</label>
                  <input
                    type="text"
                    disabled
                    value={adjustingTrainer.trainer_name}
                    className="w-full p-2.5 bg-slate-100 rounded-xl font-bold text-slate-800 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Leave Category</label>
                  <select
                    value={adjustLeaveType}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      setAdjustLeaveType(type);
                      setNewBalanceValue(
                        type === 'casual_sick'
                          ? adjustingTrainer.casual_sick_quota
                          : adjustingTrainer.optional_holiday_quota
                      );
                    }}
                    className="w-full p-2.5 bg-slate-50 rounded-xl font-bold text-slate-800 border border-slate-300 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="casual_sick">Casual / Sick Leave Quota (Default 12)</option>
                    <option value="optional_holiday">Optional Holiday Quota (Default 5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    New Quota Balance (e.g. 12 → 10, or 10 → 12)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={50}
                    value={newBalanceValue}
                    onChange={(e) => setNewBalanceValue(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 rounded-xl font-mono font-extrabold text-base text-slate-900 border border-slate-300 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Mandatory Reason for Audit Log
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Management granted 2 extra leaves for overtime or deducted unapproved absence."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-slate-800 border border-slate-300 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustingTrainer(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjustLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    {adjustLoading ? 'Saving...' : 'Confirm & Log Audit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </main>
  );
}
