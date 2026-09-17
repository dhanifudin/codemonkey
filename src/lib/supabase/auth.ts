import { supabase } from './client';

/** Signs the kid in anonymously on first visit so progress can sync without
 * ever collecting an email or password (COPPA-safe). supabase-js persists
 * the session in localStorage, so returning visits reuse it automatically —
 * this only calls the network on a genuinely new device/browser. */
export async function ensureSession(): Promise<void> {
	const { data, error: getSessionError } = await supabase.auth.getSession();
	if (getSessionError) {
		console.error('Failed to read existing session', getSessionError);
	}
	if (data.session) return;

	const { error } = await supabase.auth.signInAnonymously();
	if (error) {
		// Progress sync degrades to the localStorage-only fallback in
		// progress.ts; the kid can still play without a session.
		console.error('Anonymous sign-in failed', error);
	}
}
