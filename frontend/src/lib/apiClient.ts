import { supabase } from './supabase';

// For production on Vercel: empty string (calls /api/... on same domain)
// For local dev with Vercel CLI: http://localhost:3000
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    // Automatically append Supabase auth token if logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    // Construct full URL: either /api/endpoint or http://localhost:3000/api/endpoint
    const url = API_BASE ? `${API_BASE}/api${endpoint}` : `/api${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      return { data: null, error: result.error || 'API Request Failed' };
    }

    // Handle both { success: true, data: ... } and legacy raw response shapes
    const payload = Object.prototype.hasOwnProperty.call(result, 'data')
      ? result.data
      : result;

    return { data: payload as T, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: message };
  }
}
