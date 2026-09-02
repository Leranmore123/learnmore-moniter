'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setStoredUser } from '@/lib/auth';
import { User as UserIcon, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setError('Username and password are required.');
      return;
    }

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: cleanUsername,
          email: cleanUsername,
          password,
        }),
      });

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        setError(
          data?.error?.message ||
          data?.message ||
          'Invalid username or password.'
        );
        return;
      }

      if (!data?.user) {
        setError(
          'Login successful, but user information was not received.'
        );
        return;
      }

      setStoredUser(data.user);

      if (data.user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/trainer/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);

      setError(
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f1f5f9] p-4 selection:bg-blue-600 selection:text-white">

      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-200/30 blur-[140px] pointer-events-none" />

      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-200/30 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">

        <div className="rounded-3xl p-6 sm:p-10 bg-white shadow-2xl shadow-slate-200/80 border border-slate-200/80 space-y-6">

          <div className="text-center space-y-3 pb-2 border-b border-slate-100">

            <div className="inline-flex p-2 items-center justify-center">
              <img
                src="/logo.png"
                alt="Learnmore Technologies"
                className="h-16 sm:h-20 w-auto object-contain"
              />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Learnmore Technologies
              </h1>

              <p className="text-xs text-slate-500 font-medium pt-1">
                Sign in to your portal
              </p>
            </div>

          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Login fields - no native form submission */}
          <div className="space-y-4">

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>

              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />

                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your username (e.g. admin)"
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />

                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

          </div>

          <div className="pt-1 text-center">
            <p className="text-[11px] text-slate-400 font-semibold">
              🔒 Official & Secure Portal • Learnmore Technologies
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}