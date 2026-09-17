import type { ChallengeInput } from '../schema';

export const turningCorner: ChallengeInput = {
	slug: 'turning-corner',
	title: 'Turning the Corner',
	mode: 'icon',
	grid: { width: 3, height: 3 },
	entities: {
		playerStart: { x: 0, y: 0 },
		playerFacing: 'right',
		obstacles: [],
		collectibles: []
	},
	goal: { type: 'reachTile', target: { x: 2, y: 2 } },
	allowedBlocks: ['forward', 'turnLeft', 'turnRight'],
	starCriteria: { threeStars: { maxBlocks: 5 }, twoStars: { maxBlocks: 7 } },
	hints: ['You will need to turn to reach the banana.', 'Try: forward, forward, then turn right.']
};
