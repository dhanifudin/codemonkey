import { describe, expect, it } from 'vitest';
import { coursePercent, firstIncomplete, isUnlocked } from './unlock';
import type { CourseMeta } from '$lib/content/courses';
import type { Challenge } from '$lib/engine';

function challenge(slug: string): Challenge {
	return {
		slug,
		title: slug,
		mode: 'icon',
		grid: { width: 1, height: 1 },
		entities: { playerStart: { x: 0, y: 0 }, playerFacing: 'right', obstacles: [], collectibles: [] },
		goal: { type: 'reachTile', target: { x: 0, y: 0 } },
		allowedBlocks: ['forward'],
		starCriteria: { twoStars: { maxBlocks: 1 }, threeStars: { maxBlocks: 1 } },
		hints: []
	};
}

function course(overrides: Partial<CourseMeta> = {}): CourseMeta {
	return {
		id: 'c',
		title: 'Course',
		subtitle: '',
		ribbon: 'block-coding',
		difficulty: 'novice',
		theme: 'jungle-day',
		challenges: [challenge('a'), challenge('b'), challenge('c')],
		...overrides
	};
}

describe('isUnlocked', () => {
	it('always unlocks the first level', () => {
		expect(isUnlocked(course(), 0, {})).toBe(true);
	});

	it('locks a level whose predecessor has no stars', () => {
		expect(isUnlocked(course(), 1, {})).toBe(false);
	});

	it('unlocks a level once its predecessor has at least 1 star', () => {
		expect(isUnlocked(course(), 1, { a: 1 })).toBe(true);
	});

	it('a coming-soon course is never unlocked, even at index 0', () => {
		expect(isUnlocked(course({ comingSoon: true }), 0, {})).toBe(false);
	});
});

describe('coursePercent', () => {
	it('is 0 for an empty course', () => {
		expect(coursePercent(course({ challenges: [] }), {})).toBe(0);
	});

	it('rounds completed/total to a percentage', () => {
		expect(coursePercent(course(), { a: 1 })).toBe(33);
		expect(coursePercent(course(), { a: 1, b: 2 })).toBe(67);
		expect(coursePercent(course(), { a: 1, b: 1, c: 1 })).toBe(100);
	});
});

describe('firstIncomplete', () => {
	it('returns the first level with no stars', () => {
		expect(firstIncomplete(course(), { a: 1 })).toBe('b');
	});

	it('returns the first level of a fresh course', () => {
		expect(firstIncomplete(course(), {})).toBe('a');
	});

	it('returns the last level once everything is solved', () => {
		expect(firstIncomplete(course(), { a: 1, b: 1, c: 1 })).toBe('c');
	});
});
