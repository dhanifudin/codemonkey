import { error } from '@sveltejs/kit';
import { getCourse } from '$lib/content';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const course = getCourse(params.courseId);
	if (!course || course.comingSoon) error(404, `Unknown course: ${params.courseId}`);
	return { course };
};
