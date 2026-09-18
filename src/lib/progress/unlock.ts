import type { CourseMeta } from '$lib/content/courses';

export type ProgressMap = Record<string, number>; // challenge slug -> stars (0-3)

/** Frontier unlock: the first level of a course is always open; every
 * later level needs at least 1 star on the one before it. Pure and
 * Supabase-free so it's trivial to unit test and reuse from both the
 * roadmap and the dashboard. */
export function isUnlocked(course: CourseMeta, index: number, progress: ProgressMap): boolean {
	if (course.comingSoon) return false;
	if (index <= 0) return true;
	const prev = course.challenges[index - 1];
	if (!prev) return false;
	return (progress[prev.slug] ?? 0) > 0;
}

export function coursePercent(course: CourseMeta, progress: ProgressMap): number {
	if (course.challenges.length === 0) return 0;
	const completed = course.challenges.filter((c) => (progress[c.slug] ?? 0) > 0).length;
	return Math.round((completed / course.challenges.length) * 100);
}

/** The level a "Continue coding" button should jump to: the first one not
 * yet solved, or the last level once the whole course is complete. */
export function firstIncomplete(course: CourseMeta, progress: ProgressMap): string | undefined {
	const next = course.challenges.find((c) => (progress[c.slug] ?? 0) === 0);
	return (next ?? course.challenges[course.challenges.length - 1])?.slug;
}
