import type { ChallengeInput } from '../schema';
import type { Program } from '$lib/engine';
import { above, loop, seq, tile } from './jr-helpers';

/** "CodeMonkey Jr. — Advanced Loops": 15 side-view levels using the
 * absolute arrows movement model (stepRight/stepLeft/stepUp/stepUpRight/
 * stepUpLeft) instead of turtle forward/turn. Each level's terrain is a
 * per-column height array; standRow/ledgeAbove in jr-helpers derive tile
 * positions from it so the numbers below only have to describe the shape
 * of the ground, not pixel math. */

function level(
	n: number,
	title: string,
	terrain: number[],
	opts: {
		bananasAt?: number[];
		goal?: 'collectAll';
		allowedBlocks: ChallengeInput['allowedBlocks'];
		threeStars: number;
		twoStars: number;
		hints: string[];
	}
): ChallengeInput {
	const bananas = (opts.bananasAt ?? []).map((x, i) => ({ id: `b${i}`, pos: above(x, terrain[x]) }));
	return {
		slug: `jr-loops-${String(n).padStart(2, '0')}`,
		title,
		mode: 'icon',
		view: 'side',
		movement: 'arrows',
		grid: { width: terrain.length, height: 5 },
		terrain,
		entities: {
			playerStart: tile(0, terrain[0]),
			playerFacing: 'right',
			obstacles: [],
			collectibles: bananas
		},
		goal: opts.goal === 'collectAll' ? { type: 'collectAll' } : { type: 'reachTile', target: tile(terrain.length - 1, terrain[terrain.length - 1]) },
		allowedBlocks: opts.allowedBlocks,
		maxSlots: 10,
		starCriteria: { threeStars: { maxBlocks: opts.threeStars }, twoStars: { maxBlocks: opts.twoStars } },
		hints: opts.hints
	};
}

export const jrLoops: ChallengeInput[] = [
	level(1, 'Sunrise Steps', [2, 2, 2, 2], {
		allowedBlocks: ['stepRight'],
		threeStars: 3,
		twoStars: 4,
		hints: ['Tap the right arrow to take a step.', 'The path is flat — just keep stepping right to the chest.']
	}),
	level(2, 'Downhill', [3, 2, 1, 1], {
		allowedBlocks: ['stepRight'],
		threeStars: 3,
		twoStars: 4,
		hints: ['Stepping onto a lower block is safe — the monkey hops right down.']
	}),
	level(3, 'First Climb', [1, 2, 3, 3], {
		allowedBlocks: ['stepRight', 'stepUpRight'],
		threeStars: 3,
		twoStars: 5,
		hints: ['A plain step only works on flat or lower ground.', 'Use the diagonal arrow to climb up one block.']
	}),
	level(4, 'Up and Over', [1, 2, 1, 2, 1], {
		allowedBlocks: ['stepRight', 'stepUpRight'],
		threeStars: 4,
		twoStars: 6,
		hints: ['Climb up with the diagonal arrow, then step down with the plain arrow.']
	}),
	level(5, 'Loop Runway', [2, 2, 2, 2, 2, 2, 2], {
		allowedBlocks: ['stepRight', 'repeat'],
		threeStars: 2,
		twoStars: 6,
		hints: ['That is a lot of the same step in a row…', 'Try a repeat block instead of six separate steps.']
	}),
	level(6, 'Snack Stop', [2, 2, 2], {
		bananasAt: [1],
		goal: 'collectAll',
		allowedBlocks: ['stepRight', 'stepUp'],
		threeStars: 2,
		twoStars: 4,
		hints: ['The banana is hanging above the path.', 'Step up to grab it without leaving your spot.']
	}),
	level(7, 'Two Snacks', [2, 2, 2, 2], {
		bananasAt: [1, 3],
		goal: 'collectAll',
		allowedBlocks: ['stepRight', 'stepUp'],
		threeStars: 5,
		twoStars: 7,
		hints: ['There are two bananas this time — one part way, one at the end.']
	}),
	level(8, 'Climb and Collect', [1, 2, 3], {
		bananasAt: [2],
		goal: 'collectAll',
		allowedBlocks: ['stepRight', 'stepUpRight', 'stepUp'],
		threeStars: 3,
		twoStars: 5,
		hints: ['Climb all the way up, then step up once more for the banana.']
	}),
	level(9, 'Loop the Climb', [1, 2, 1, 2, 1, 2, 1], {
		allowedBlocks: ['stepRight', 'stepUpRight', 'repeat'],
		threeStars: 3,
		twoStars: 6,
		hints: ['Climb, then step down — that pair repeats the whole way.', 'Put both blocks inside one repeat.']
	}),
	level(10, 'Double Snack Loop', [2, 2, 2, 2, 2, 2], {
		bananasAt: [1, 2, 3, 4, 5],
		goal: 'collectAll',
		allowedBlocks: ['stepRight', 'stepUp', 'repeat'],
		threeStars: 3,
		twoStars: 10,
		hints: ['Step, then step up for a banana — that pair repeats five times.']
	}),
	level(11, 'Zig Zag Climb', [1, 2, 3, 4, 3, 2, 1], {
		allowedBlocks: ['stepRight', 'stepUpRight'],
		threeStars: 6,
		twoStars: 8,
		hints: ['Climb all the way to the top first, then walk back down the other side.']
	}),
	level(12, 'Tower Loop', [1, 2, 3, 4, 4, 4, 4], {
		allowedBlocks: ['stepRight', 'stepUpRight', 'repeat'],
		threeStars: 5,
		twoStars: 8,
		hints: ['Climb to the top of the tower, then loop across the flat roof.']
	}),
	level(13, 'Marathon', new Array(11).fill(2), {
		allowedBlocks: ['stepRight', 'repeat'],
		threeStars: 2,
		twoStars: 10,
		hints: ['A long flat road — one repeat block covers the whole thing.']
	}),
	level(14, 'Plateau Snacks', [1, 2, 2, 2, 2, 3], {
		bananasAt: [2, 3],
		goal: 'collectAll',
		allowedBlocks: ['stepRight', 'stepUpRight', 'stepUp', 'repeat'],
		threeStars: 6,
		twoStars: 9,
		hints: ['Climb up, grab two bananas on the plateau, then climb again at the end.', 'The middle part repeats.']
	}),
	level(15, 'Summit Run', [1, 2, 3, 3, 3, 3, 2, 1, 1], {
		bananasAt: [4, 5],
		allowedBlocks: ['stepRight', 'stepUpRight', 'stepUp', 'repeat'],
		threeStars: 9,
		twoStars: 12,
		hints: ['Climb to the summit, collect both bananas, then head all the way back down.']
	})
];

export const jrLoopsSolutions: Record<string, Program> = {
	'jr-loops-01': { main: seq('stepRight', 'stepRight', 'stepRight') },
	'jr-loops-02': { main: seq('stepRight', 'stepRight', 'stepRight') },
	'jr-loops-03': { main: seq('stepUpRight', 'stepUpRight', 'stepRight') },
	'jr-loops-04': { main: seq('stepUpRight', 'stepRight', 'stepUpRight', 'stepRight') },
	'jr-loops-05': { main: [loop(6, 'stepRight')] },
	'jr-loops-06': { main: seq('stepRight', 'stepUp') },
	'jr-loops-07': { main: seq('stepRight', 'stepUp', 'stepRight', 'stepRight', 'stepUp') },
	'jr-loops-08': { main: seq('stepUpRight', 'stepUpRight', 'stepUp') },
	'jr-loops-09': { main: [loop(3, 'stepUpRight', 'stepRight')] },
	'jr-loops-10': { main: [loop(5, 'stepRight', 'stepUp')] },
	'jr-loops-11': { main: seq('stepUpRight', 'stepUpRight', 'stepUpRight', 'stepRight', 'stepRight', 'stepRight') },
	'jr-loops-12': { main: [...seq('stepUpRight', 'stepUpRight', 'stepUpRight'), loop(3, 'stepRight')] },
	'jr-loops-13': { main: [loop(10, 'stepRight')] },
	'jr-loops-14': {
		main: [seq('stepUpRight')[0], loop(2, 'stepRight', 'stepUp'), seq('stepRight')[0], seq('stepUpRight')[0]]
	},
	'jr-loops-15': {
		main: [
			...seq('stepUpRight', 'stepUpRight', 'stepRight', 'stepRight', 'stepUp', 'stepRight', 'stepUp'),
			loop(3, 'stepRight')
		]
	}
};
