const STORAGE_KEY = 'codemonkey:sound-muted';

function readInitial(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) === '1';
	} catch {
		return false;
	}
}

/** Reactive, app-wide mute flag. A plain exported `let` can't be reactive
 * across modules in Svelte 5 — an object with a `$state` field can, so
 * every importer sees the same live value. */
export const soundState = $state({ muted: readInitial() });

export function toggleMute(): void {
	soundState.muted = !soundState.muted;
	try {
		localStorage.setItem(STORAGE_KEY, soundState.muted ? '1' : '0');
	} catch {
		// Private browsing / blocked storage — mute still works for the
		// session, it just won't be remembered next visit.
	}
}
