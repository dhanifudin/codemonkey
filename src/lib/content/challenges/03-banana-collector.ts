import type { ChallengeInput } from '../schema';

export const bananaCollector: ChallengeInput = {
	slug: 'banana-collector',
	title: 'Banana Collector',
	mode: 'icon',
	grid: { width: 4, height: 1 },
	entities: {
		playerStart: { x: 0, y: 0 },
		playerFacing: 'right',
		obstacles: [],
		collectibles: [
			{ id: 'b1', pos: { x: 1, y: 0 } },
			{ id: 'b2', pos: { x: 2, y: 0 } },
			{ id: 'b3', pos: { x: 3, y: 0 } }
		]
	},
	goal: { type: 'collectAll' },
	allowedBlocks: ['forward'],
	starCriteria: { threeStars: { maxBlocks: 3 }, twoStars: { maxBlocks: 5 } },
	hints: ['Walk forward to pick up every banana along the way.']
};
