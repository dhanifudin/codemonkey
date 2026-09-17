import { error } from '@sveltejs/kit';
import { getChallenge } from '$lib/content';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const challenge = getChallenge(params.slug);
	if (!challenge) error(404, `Unknown challenge: ${params.slug}`);
	return { challenge };
};
