import { challengeSchema } from './schema';
import type { Challenge } from '$lib/engine';
import { firstSteps } from './challenges/01-first-steps';
import { turningCorner } from './challenges/02-turning-corner';
import { bananaCollector } from './challenges/03-banana-collector';
import { repeatPower } from './challenges/04-repeat-power';
import { squareLoop } from './challenges/05-square-loop';
import { leapOfFaith } from './challenges/06-leap-of-faith';
import { jumpAndCollect } from './challenges/07-jump-and-collect';
import { jrLoops } from './challenges/jr-loops';
import { jrProcedures } from './challenges/jr-procedures';

export type Ribbon = 'block-coding' | 'text-coding' | 'creativity';
export type Difficulty = 'novice' | 'beginner';
export type Theme = 'jungle-day' | 'jungle-night' | 'beach-day';

export interface CourseMeta {
	id: string;
	title: string;
	subtitle: string;
	ribbon: Ribbon;
	difficulty: Difficulty;
	theme: Theme;
	/** No content yet — shown on the dashboard as a padlocked "coming soon"
	 * card, and never resolvable via findChallenge/getCourse routes. */
	comingSoon?: boolean;
	challenges: Challenge[];
}

/** Validated at module load so a malformed challenge fails fast in dev, not
 * silently at runtime mid-lesson. Within a course, challenges are appended,
 * never inserted — this keeps slugs' node numbers and saved progress
 * stable. */
function build(raw: unknown[]): Challenge[] {
	return raw.map((c) => challengeSchema.parse(c) as Challenge);
}

export const courses: CourseMeta[] = [
	{
		id: 'sequencing-loops',
		title: 'Sequencing & Loops',
		subtitle: 'Forward, turns, jumps, and repeat',
		ribbon: 'block-coding',
		difficulty: 'novice',
		theme: 'jungle-day',
		challenges: build([firstSteps, turningCorner, bananaCollector, repeatPower, squareLoop, leapOfFaith, jumpAndCollect])
	},
	{
		id: 'jr-advanced-loops',
		title: 'CodeMonkey Jr.',
		subtitle: 'Advanced Loops',
		ribbon: 'block-coding',
		difficulty: 'novice',
		theme: 'jungle-night',
		challenges: build(jrLoops)
	},
	{
		id: 'jr-procedures',
		title: 'CodeMonkey Jr.',
		subtitle: 'Advanced Procedures',
		ribbon: 'block-coding',
		difficulty: 'novice',
		theme: 'beach-day',
		challenges: build(jrProcedures)
	},
	{
		id: 'beaver-achiever',
		title: 'Beaver Achiever',
		subtitle: 'Sequencing & Simple Loops',
		ribbon: 'block-coding',
		difficulty: 'beginner',
		theme: 'jungle-day',
		comingSoon: true,
		challenges: []
	}
];

export function getCourse(id: string): CourseMeta | undefined {
	return courses.find((c) => c.id === id);
}

export interface FoundChallenge {
	challenge: Challenge;
	course: CourseMeta;
	index: number;
}

export function findChallenge(slug: string): FoundChallenge | undefined {
	for (const course of courses) {
		const index = course.challenges.findIndex((c) => c.slug === slug);
		if (index >= 0) return { challenge: course.challenges[index], course, index };
	}
	return undefined;
}

export function nextInCourse(slug: string): string | undefined {
	const found = findChallenge(slug);
	if (!found) return undefined;
	return found.course.challenges[found.index + 1]?.slug;
}
