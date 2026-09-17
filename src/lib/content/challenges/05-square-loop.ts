import type { ChallengeInput } from '../schema';

export const squareLoop: ChallengeInput = {
	slug: 'square-loop',
	title: 'Square Loop',
	mode: 'icon',
	grid: { width: 3, height: 3 },
	entities: {
		playerStart: { x: 0, y: 0 },
		playerFacing: 'right',
		obstacles: [],
		collectibles: [
			{ id: 'b1', pos: { x: 2, y: 0 } },
			{ id: 'b2', pos: { x: 2, y: 2 } },
			{ id: 'b3', pos: { x: 0, y: 2 } }
		]
	},
	goal: { type: 'collectAll' },
	allowedBlocks: ['forward', 'turnRight', 'repeat'],
	starCriteria: { threeStars: { maxBlocks: 4 }, twoStars: { maxBlocks: 8 } },
	hints: [
		'Walking the whole square by hand takes a lot of blocks.',
		'A repeat of 4 that goes forward, forward, turn right walks the whole loop.'
	]
};
