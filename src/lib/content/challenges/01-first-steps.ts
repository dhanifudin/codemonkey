import type { ChallengeInput } from '../schema';

export const firstSteps: ChallengeInput = {
	slug: 'first-steps',
	title: 'First Steps',
	mode: 'icon',
	grid: { width: 4, height: 3 },
	entities: {
		playerStart: { x: 0, y: 1 },
		playerFacing: 'right',
		obstacles: [],
		collectibles: []
	},
	goal: { type: 'reachTile', target: { x: 3, y: 1 } },
	allowedBlocks: ['forward'],
	starCriteria: { threeStars: { maxBlocks: 3 }, twoStars: { maxBlocks: 5 } },
	hints: ['Tap the forward block to move the monkey one step.', 'How many steps to reach the banana stand?']
};
