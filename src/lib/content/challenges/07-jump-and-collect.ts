import type { ChallengeInput } from '../schema';

export const jumpAndCollect: ChallengeInput = {
	slug: 'jump-and-collect',
	title: 'Jump and Collect',
	mode: 'icon',
	grid: { width: 5, height: 1 },
	entities: {
		playerStart: { x: 0, y: 0 },
		playerFacing: 'right',
		obstacles: [{ pos: { x: 3, y: 0 }, kind: 'pit' }],
		collectibles: [
			{ id: 'b1', pos: { x: 1, y: 0 } },
			{ id: 'b2', pos: { x: 4, y: 0 } }
		]
	},
	goal: { type: 'collectAll' },
	allowedBlocks: ['forward', 'jump'],
	starCriteria: { threeStars: { maxBlocks: 3 }, twoStars: { maxBlocks: 5 } },
	hints: [
		'Walk over a banana to pick it up — but jumping flies right over it!',
		'If you jump right away you will skip the first banana.',
		'Try: forward, forward, then jump over the pit to land on the last banana.'
	]
};
