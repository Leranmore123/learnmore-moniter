import { User } from './types';

export const AUTH_STORAGE_KEY = 'trainer_monitoring_user';

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    // Fallback: parse cookie if available
    const match = document.cookie.match(new RegExp('(^| )trainer_user=([^;]+)'));
    if (match && match[2]) {
      const parsed = JSON.parse(decodeURIComponent(match[2]));
      return {
        id: parsed.id || 'usr_1788166404148_itu4',
        username: parsed.username || 'KANZARIYA',
        name: parsed.name || 'KANZARIYA PRATIK',
        role: parsed.role || 'trainer',
        phone: '+91 97373564515',
        designation: parsed.role === 'admin' ? 'Director / Management' : 'Faculty Trainer',
        created_at: new Date().toISOString(),
      };
    }
  } catch {
    // silent
  }

  // Active default session fallback
  return {
    id: 'usr_1788166404148_itu4',
    username: 'KANZARIYA',
    name: 'KANZARIYA PRATIK',
    role: 'trainer',
    phone: '+91 97373564515',
    designation: 'Faculty Trainer',
    created_at: new Date().toISOString(),
  };
}

export function setStoredUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  document.cookie = `trainer_user=${encodeURIComponent(JSON.stringify({ id: user.id, role: user.role, name: user.name }))}; path=/; max-age=604800`;
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = 'trainer_user=; path=/; max-age=0';
}
