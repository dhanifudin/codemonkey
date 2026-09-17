import { describe, expect, it } from 'vitest';
import { countBlocks, run } from './interpreter';
import type { Block, Challenge } from './types';

function b(type: 'forward' | 'turnLeft' | 'turnRight' | 'jump'): Block {
	return { id: `${type}-${Math.random()}`, type };
}
function repeatOf(count: number, body: Block[]): Block {
	return { id: `repeat-${Math.random()}`, type: 'repeat', count, body };
}

const straightLine: Challenge = {
	slug: 'straight-line',
	title: 'Straight Line',
	mode: 'icon',
	grid: { width: 4, height: 1 },
	entities: {
		playerStart: { x: 0, y: 0 },
		playerFacing: 'right',
		obstacles: [],
		collectibles: []
	},
	goal: { type: 'reachTile', target: { x: 3, y: 0 } },
	allowedBlocks: ['forward', 'repeat'],
	starCriteria: { threeStars: { maxBlocks: 3 }, twoStars: { maxBlocks: 5 } },
	hints: []
};

const cornerWithObstacle: Challenge = {
	slug: 'corner',
	title: 'Corner',
	mode: 'icon',
	grid: { width: 3, height: 3 },
	entities: {
		playerStart: { x: 0, y: 0 },
		playerFacing: 'right',
		obstacles: [{ pos: { x: 2, y: 0 }, kind: 'rock' }],
		collectibles: []
	},
	goal: { type: 'reachTile', target: { x: 2, y: 2 } },
	allowedBlocks: ['forward', 'turnLeft', 'turnRight'],
	starCriteria: { threeStars: { maxBlocks: 5 }, twoStars: { maxBlocks: 7 } },
	hints: []
};

const collectAllChallenge: Challenge = {
	slug: 'collect',
	title: 'Collect',
	mode: 'icon',
	grid: { width: 3, height: 1 },
	entities: {
		playerStart: { x: 0, y: 0 },
		playerFacing: 'right',
		obstacles: [],
		collectibles: [
			{ id: 'g1', pos: { x: 1, y: 0 } },
			{ id: 'g2', pos: { x: 2, y: 0 } }
		]
	},
	goal: { type: 'collectAll' },
	allowedBlocks: ['forward'],
	starCriteria: { threeStars: { maxBlocks: 2 }, twoStars: { maxBlocks: 4 } },
	hints: []
};

const pitCorridor: Challenge = {
	slug: 'pit-corridor',
	title: 'Pit Corridor',
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
	hints: []
};

const jumpOntoRockChallenge: Challenge = {
	slug: 'jump-onto-rock',
	title: 'Jump Onto Rock',
	mode: 'icon',
	grid: { width: 5, height: 1 },
	entities: {
		playerStart: { x: 0, y: 0 },
		playerFacing: 'right',
		obstacles: [{ pos: { x: 2, y: 0 }, kind: 'rock' }],
		collectibles: []
	},
	goal: { type: 'reachTile', target: { x: 4, y: 0 } },
	allowedBlocks: ['forward', 'jump'],
	starCriteria: { threeStars: { maxBlocks: 3 }, twoStars: { maxBlocks: 5 } },
	hints: []
};

const doublePitChallenge: Challenge = {
	slug: 'double-pit',
	title: 'Double Pit',
	mode: 'icon',
	grid: { width: 5, height: 1 },
	entities: {
		playerStart: { x: 1, y: 0 },
		playerFacing: 'right',
		obstacles: [
			{ pos: { x: 2, y: 0 }, kind: 'pit' },
			{ pos: { x: 3, y: 0 }, kind: 'pit' }
		],
		collectibles: []
	},
	goal: { type: 'reachTile', target: { x: 4, y: 0 } },
	allowedBlocks: ['jump'],
	starCriteria: { threeStars: { maxBlocks: 1 }, twoStars: { maxBlocks: 2 } },
	hints: []
};

const edgeJumpChallenge: Challenge = {
	slug: 'edge-jump',
	title: 'Edge Jump',
	mode: 'icon',
	grid: { width: 3, height: 1 },
	entities: {
		playerStart: { x: 1, y: 0 },
		playerFacing: 'right',
		obstacles: [],
		collectibles: []
	},
	goal: { type: 'reachTile', target: { x: 2, y: 0 } },
	allowedBlocks: ['jump'],
	starCriteria: { threeStars: { maxBlocks: 1 }, twoStars: { maxBlocks: 2 } },
	hints: []
};

const jumpAndCollectFixture: Challenge = {
	slug: 'jump-and-collect-fixture',
	title: 'Jump and Collect Fixture',
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
	hints: []
};

describe('countBlocks', () => {
	it('counts top-level blocks', () => {
		expect(countBlocks([b('forward'), b('forward')])).toBe(2);
	});
	it('counts a repeat block itself plus its body once (not per iteration)', () => {
		expect(countBlocks([repeatOf(6, [b('forward')])])).toBe(2);
	});
	it('counts jump like any other simple block', () => {
		expect(countBlocks([b('jump')])).toBe(1);
	});
});

describe('run — movement and win', () => {
	it('wins when reaching the target tile with the exact block count for 3 stars', () => {
		const result = run(straightLine, [b('forward'), b('forward'), b('forward')]);
		expect(result.outcome).toBe('win');
		expect(result.blocksUsed).toBe(3);
		expect(result.stars).toBe(3);
	});

	it('awards fewer stars for a correct but longer solution', () => {
		const program = [repeatOf(3, [b('forward')])]; // 2 blocks, still <= threeStars.maxBlocks(3)
		const result = run(straightLine, program);
		expect(result.outcome).toBe('win');
		expect(result.stars).toBe(3);
	});

	it('reports incomplete when the program ends short of the goal', () => {
		const result = run(straightLine, [b('forward')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('incomplete');
		expect(result.stars).toBe(0);
	});

	it('stops and reports blocked when walking into an obstacle', () => {
		const result = run(cornerWithObstacle, [b('forward'), b('forward'), b('forward')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('blocked');
		const lastCommand = result.commands.at(-1);
		expect(lastCommand).toEqual({ type: 'lose', reason: 'blocked' });
	});

	it('turns correctly to route around an obstacle', () => {
		// Obstacle sits at (2,0), so the route must detour down and back
		// right rather than going straight across row 0.
		const program = [
			b('forward'),
			b('turnRight'),
			b('forward'),
			b('forward'),
			b('turnLeft'),
			b('forward')
		];
		const result = run(cornerWithObstacle, program);
		expect(result.outcome).toBe('win');
	});

	it('treats the grid boundary as blocked, not out of bounds silently', () => {
		const result = run(straightLine, [b('forward'), b('forward'), b('forward'), b('forward')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('blocked');
	});
});

describe('run — collectibles', () => {
	it('wins collectAll once every collectible is picked up', () => {
		const result = run(collectAllChallenge, [b('forward'), b('forward')]);
		expect(result.outcome).toBe('win');
		const collects = result.commands.filter((c) => c.type === 'collect');
		expect(collects).toHaveLength(2);
	});

	it('does not win collectAll while a collectible remains unreached', () => {
		const result = run(collectAllChallenge, [b('forward')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('incomplete');
	});
});

describe('run — jump and pits', () => {
	it('clears a pit with a jump, winning', () => {
		const result = run(pitCorridor, [b('forward'), b('jump'), b('forward')]);
		expect(result.outcome).toBe('win');
		const jumpCommand = result.commands.find((c) => c.type === 'jump');
		expect(jumpCommand).toMatchObject({ from: { x: 1, y: 0 }, over: { x: 2, y: 0 }, to: { x: 3, y: 0 } });
	});

	it('falls when walking forward into a pit instead of jumping', () => {
		const result = run(pitCorridor, [b('forward'), b('forward')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('fell');
		const lastCommand = result.commands.at(-1);
		expect(lastCommand).toEqual({ type: 'lose', reason: 'fell' });
		const fallCommand = result.commands.find((c) => c.type === 'fall');
		expect(fallCommand).toMatchObject({ at: { x: 2, y: 0 } });
	});

	it('is blocked when a jump would land on a rock', () => {
		const result = run(jumpOntoRockChallenge, [b('jump')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('blocked');
	});

	it('falls when a jump would land on another pit', () => {
		const result = run(doublePitChallenge, [b('jump')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('fell');
	});

	it('is blocked when a jump would land off the edge of the grid', () => {
		const result = run(edgeJumpChallenge, [b('jump')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('blocked');
	});

	it('flies over a collectible on the skipped tile uncollected, but still collects on landing', () => {
		// First jump skips the banana at x=1 (lands on empty x=2); second
		// jump skips the pit at x=3 and lands on the banana at x=4.
		const result = run(jumpAndCollectFixture, [b('jump'), b('jump')]);
		const collects = result.commands.filter((c) => c.type === 'collect');
		expect(collects).toEqual([expect.objectContaining({ itemId: 'b2' })]);
		// b1 was never collected, so collectAll is still unmet.
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('incomplete');
	});

	it('collects a banana reached by walking forward onto it, unlike jumping over it', () => {
		const result = run(jumpAndCollectFixture, [b('forward'), b('forward'), b('jump')]);
		expect(result.outcome).toBe('win');
		const collects = result.commands.filter((c) => c.type === 'collect');
		expect(collects.map((c) => (c.type === 'collect' ? c.itemId : undefined))).toEqual(['b1', 'b2']);
	});
});

describe('run — infinite loop guard', () => {
	it('aborts with step-limit instead of hanging on a runaway repeat', () => {
		const program = [repeatOf(1000, [b('turnLeft')])];
		const result = run(straightLine, program);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('step-limit');
	});
});
