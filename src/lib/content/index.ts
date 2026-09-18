export { courses, getCourse, findChallenge, nextInCourse } from './courses';
export type { CourseMeta, FoundChallenge, Ribbon, Difficulty, Theme } from './courses';

import { courses, findChallenge, nextInCourse } from './courses';
import type { Challenge } from '$lib/engine';

/** Course 1 (the original 7 turtle challenges), kept for the pre-courses
 * call sites and tests that only ever knew about one course. */
export const course: Challenge[] = courses[0].challenges;

export function getChallenge(slug: string): Challenge | undefined {
	return findChallenge(slug)?.challenge;
}

export function nextChallengeSlug(slug: string): string | undefined {
	return nextInCourse(slug);
}
