import { describe, expect, it } from 'vitest';
import { courses } from './courses';
import { run } from '$lib/engine';
import { jrLoopsSolutions } from './challenges/jr-loops';
import { jrProceduresSolutions } from './challenges/jr-procedures';

const allSolutions: Record<string, import('$lib/engine').Program> = { ...jrLoopsSolutions, ...jrProceduresSolutions };

describe('every course parses to valid challenges', () => {
	for (const course of courses) {
		it(`${course.id} has no duplicate slugs`, () => {
			const slugs = course.challenges.map((c) => c.slug);
			expect(new Set(slugs).size).toBe(slugs.length);
		});
	}
});

describe('hand-authored Jr. levels are solvable with their known solution', () => {
	for (const course of courses) {
		for (const challenge of course.challenges) {
			const solution = allSolutions[challenge.slug];
			if (!solution) continue;

			it(`${challenge.slug} wins with 3 stars using its known solution`, () => {
				const result = run(challenge, solution);
				expect(result.outcome).toBe('win');
				expect(result.stars).toBe(3);
			});
		}
	}
});

describe('every Jr. level in these courses has a known solution', () => {
	const jrCourseIds = new Set(['jr-advanced-loops', 'jr-procedures']);
	for (const course of courses) {
		if (!jrCourseIds.has(course.id)) continue;
		for (const challenge of course.challenges) {
			it(`${challenge.slug} is covered by the solvability check`, () => {
				expect(allSolutions[challenge.slug]).toBeDefined();
			});
		}
	}
});
