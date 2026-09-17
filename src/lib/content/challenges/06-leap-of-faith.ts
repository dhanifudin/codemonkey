import type { ChallengeInput } from '../schema';

export const leapOfFaith: ChallengeInput = {
	slug: 'leap-of-faith',
	title: 'Leap of Faith',
	mode: 'icon',
	grid: { width: 5, height: 1 },
	entities: {
		playerStart: { x: 0, y: 0 },
		playerFacing: 'right',
		obstacles: [{ pos: { x: 2, y: 0 }, kind: 'pit' }],
		collectibles: []
	},
	goal: { type: 'reachTile', target: { x: 4, y: 0 } },
	allowedBlocks: ['forward', 'jump'],
	starCriteria: { threeStars: { maxBlocks: 3 }, twoStars: { maxBlocks: 5 } },
	hints: [
		'Walking straight into the pit will make the monkey fall!',
		'Get right next to the pit first, then jump over it.',
		'Try: forward, jump, forward.'
	]
};
