import { error } from '@sveltejs/kit';
import { findChallenge } from '$lib/content';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const found = findChallenge(params.slug);
	if (!found) error(404, `Unknown challenge: ${params.slug}`);
	return { challenge: found.challenge, course: found.course, levelNumber: found.index + 1 };
};
