import { challengeSchema } from './schema';
import type { Challenge } from '$lib/engine';
import { firstSteps } from './challenges/01-first-steps';
import { turningCorner } from './challenges/02-turning-corner';
import { bananaCollector } from './challenges/03-banana-collector';
import { repeatPower } from './challenges/04-repeat-power';
import { squareLoop } from './challenges/05-square-loop';
import { leapOfFaith } from './challenges/06-leap-of-faith';
import { jumpAndCollect } from './challenges/07-jump-and-collect';

/** Validated at module load so a malformed challenge fails fast in dev,
 * not silently at runtime mid-lesson. New challenges are appended, never
 * inserted — this keeps existing slugs' course-map numbers and any saved
 * progress stable. */
const raw = [firstSteps, turningCorner, bananaCollector, repeatPower, squareLoop, leapOfFaith, jumpAndCollect];

export const course: Challenge[] = raw.map((c) => challengeSchema.parse(c) as Challenge);

export function getChallenge(slug: string): Challenge | undefined {
	return course.find((c) => c.slug === slug);
}

export function nextChallengeSlug(slug: string): string | undefined {
	const i = course.findIndex((c) => c.slug === slug);
	return i >= 0 ? course[i + 1]?.slug : undefined;
}
