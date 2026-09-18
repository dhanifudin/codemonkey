import { supabase } from './client';
import type { BlockProgram, Program, RunResult } from '$lib/engine';

const LOCAL_KEY = 'codemonkey:progress-fallback';

type ProgressMap = Record<string, number>; // challenge slug -> stars (0-3)

function readLocalFallback(): ProgressMap {
	try {
		return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}');
	} catch {
		return {};
	}
}

function writeLocalFallback(map: ProgressMap): void {
	localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
}

/** Records the result of a run. Writes to localStorage first so the course
 * map always reflects the kid's progress even if the network call below
 * fails or they're offline — the Supabase write is best-effort on top. */
export async function saveProgress(slug: string, result: RunResult, program: BlockProgram | Program): Promise<void> {
	const local = readLocalFallback();
	local[slug] = Math.max(local[slug] ?? 0, result.stars);
	writeLocalFallback(local);

	const { data: userData } = await supabase.auth.getUser();
	const userId = userData.user?.id;
	if (!userId) return;

	const { data: existing, error: readError } = await supabase
		.from('progress')
		.select('stars, attempts')
		.eq('challenge_slug', slug)
		.maybeSingle();
	if (readError) {
		console.error('saveProgress: failed to read existing row', readError);
		return;
	}

	const { error } = await supabase.from('progress').upsert({
		user_id: userId,
		challenge_slug: slug,
		stars: Math.max(existing?.stars ?? 0, result.stars),
		attempts: (existing?.attempts ?? 0) + 1,
		best_solution: program,
		completed_at: result.outcome === 'win' ? new Date().toISOString() : null
	});
	if (error) console.error('saveProgress: upsert failed', error);
}

/** Loads stars per challenge for the course map. Remote data (once a
 * session exists) is merged over the local fallback rather than replacing
 * it, so a save that never made it to the network isn't lost from view. */
export async function loadProgress(): Promise<ProgressMap> {
	const local = readLocalFallback();

	const { data: userData } = await supabase.auth.getUser();
	const userId = userData.user?.id;
	if (!userId) return local;

	const { data, error } = await supabase.from('progress').select('challenge_slug, stars');
	if (error || !data) return local;

	const merged: ProgressMap = { ...local };
	for (const row of data) {
		merged[row.challenge_slug] = Math.max(merged[row.challenge_slug] ?? 0, row.stars);
	}
	return merged;
}
