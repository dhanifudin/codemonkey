import type { ChallengeInput } from '../schema';

export const repeatPower: ChallengeInput = {
	slug: 'repeat-power',
	title: 'The Power of Repeat',
	mode: 'icon',
	grid: { width: 7, height: 1 },
	entities: {
		playerStart: { x: 0, y: 0 },
		playerFacing: 'right',
		obstacles: [],
		collectibles: []
	},
	goal: { type: 'reachTile', target: { x: 6, y: 0 } },
	allowedBlocks: ['forward', 'repeat'],
	starCriteria: { threeStars: { maxBlocks: 2 }, twoStars: { maxBlocks: 4 } },
	hints: [
		'That is a long way to walk with six separate blocks!',
		'Try dragging one forward block inside a repeat block set to 6.'
	]
};
