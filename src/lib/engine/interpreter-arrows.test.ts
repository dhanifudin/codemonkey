import { describe, expect, it } from 'vitest';
import { run } from './interpreter';
import type { Block, Challenge, Program, Trigger } from './types';

function b(type: Exclude<Block['type'], 'repeat'>): Block {
	return { id: `${type}-${Math.random()}`, type } as Block;
}
function repeatOf(count: number, body: Block[]): Block {
	return { id: `repeat-${Math.random()}`, type: 'repeat', count, body };
}

/** height=5 rows (y=0 top .. y=4 bottom). terrain[x] blocks stacked from
 * the bottom; standRow(x) = 5 - terrain[x] - 1. */
function sideChallenge(overrides: Partial<Challenge> = {}): Challenge {
	const terrain = overrides.terrain ?? [2, 2, 2];
	return {
		slug: 'side-test',
		title: 'Side Test',
		mode: 'icon',
		view: 'side',
		movement: 'arrows',
		grid: { width: terrain.length, height: 5 },
		terrain,
		entities: {
			playerStart: { x: 0, y: 5 - terrain[0] - 1 },
			playerFacing: 'right',
			obstacles: [],
			collectibles: []
		},
		goal: { type: 'reachTile', target: { x: terrain.length - 1, y: 5 - terrain[terrain.length - 1] - 1 } },
		allowedBlocks: ['stepRight', 'stepLeft', 'stepUp', 'stepUpRight', 'stepUpLeft', 'repeat'],
		starCriteria: { threeStars: { maxBlocks: 3 }, twoStars: { maxBlocks: 5 } },
		hints: [],
		...overrides
	};
}

describe('arrows movement — walking', () => {
	it('walks right across equal-height ground and wins', () => {
		const challenge = sideChallenge({ terrain: [2, 2, 2] });
		const result = run(challenge, [b('stepRight'), b('stepRight')]);
		expect(result.outcome).toBe('win');
		expect(result.stars).toBe(3);
	});

	it('walks left back across equal-height ground', () => {
		const challenge = sideChallenge({
			terrain: [2, 2, 2],
			entities: { playerStart: { x: 2, y: 2 }, playerFacing: 'left', obstacles: [], collectibles: [] },
			goal: { type: 'reachTile', target: { x: 0, y: 2 } }
		});
		const result = run(challenge, [b('stepLeft'), b('stepLeft')]);
		expect(result.outcome).toBe('win');
	});

	it('hops safely down onto a lower ledge', () => {
		// col0 height 3 (stand row 1), col1 height 1 (stand row 3): a big
		// but survivable drop since there IS a floor.
		const challenge = sideChallenge({ terrain: [3, 1] });
		const result = run(challenge, [b('stepRight')]);
		expect(result.outcome).toBe('win');
		const move = result.commands.find((c) => c.type === 'move');
		expect(move).toMatchObject({ type: 'move', to: { x: 1, y: 3 } });
	});

	it('falls when stepping into a gap column (terrain height 0)', () => {
		const challenge = sideChallenge({ terrain: [2, 0, 2] });
		const result = run(challenge, [b('stepRight')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('fell');
		expect(result.commands.some((c) => c.type === 'fall')).toBe(true);
	});

	it('is blocked walking into a taller column without climbing', () => {
		const challenge = sideChallenge({ terrain: [2, 4] });
		const result = run(challenge, [b('stepRight')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('blocked');
	});

	it('is blocked walking off the left/right edge of the grid', () => {
		const challenge = sideChallenge({ terrain: [2, 2] });
		const result = run(challenge, [b('stepLeft')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('blocked');
	});
});

describe('arrows movement — climbing', () => {
	it('climbs diagonally onto a ledge exactly one block taller', () => {
		const challenge = sideChallenge({
			terrain: [2, 3],
			goal: { type: 'reachTile', target: { x: 1, y: 1 } }
		});
		const result = run(challenge, [b('stepUpRight')]);
		expect(result.outcome).toBe('win');
	});

	it('is blocked climbing onto a ledge two blocks taller', () => {
		const challenge = sideChallenge({ terrain: [2, 4] });
		const result = run(challenge, [b('stepUpRight')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('blocked');
	});

	it('is blocked climbing onto flat ground (no height gain)', () => {
		const challenge = sideChallenge({ terrain: [2, 2] });
		const result = run(challenge, [b('stepUpRight')]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('blocked');
	});

	it('stepUpLeft mirrors stepUpRight', () => {
		const challenge = sideChallenge({
			terrain: [3, 2],
			entities: { playerStart: { x: 1, y: 2 }, playerFacing: 'left', obstacles: [], collectibles: [] },
			goal: { type: 'reachTile', target: { x: 0, y: 1 } }
		});
		const result = run(challenge, [b('stepUpLeft')]);
		expect(result.outcome).toBe('win');
	});
});

describe('arrows movement — stepUp collects without moving', () => {
	it('collects a banana one row above and lands back in place', () => {
		const challenge = sideChallenge({
			terrain: [2, 2],
			entities: {
				playerStart: { x: 0, y: 2 },
				playerFacing: 'right',
				obstacles: [],
				collectibles: [{ id: 'banana', pos: { x: 0, y: 1 } }]
			},
			goal: { type: 'collectAll' }
		});
		const result = run(challenge, [b('stepUp')]);
		expect(result.outcome).toBe('win');
		expect(result.commands.some((c) => c.type === 'jumpUp')).toBe(true);
		expect(result.commands.some((c) => c.type === 'collect')).toBe(true);
	});

	it('works fine repeated in a loop', () => {
		const challenge = sideChallenge({ terrain: [2, 2, 2] });
		const result = run(challenge, [repeatOf(2, [b('stepUp')]), b('stepRight'), b('stepRight')]);
		expect(result.outcome).toBe('win');
		expect(result.blocksUsed).toBe(2 + 2); // repeat(1) + body(1) + 2 stepRight
	});
});

describe('procedures via sensors', () => {
	function procChallenge(trigger: Trigger, sensorX = 1): Challenge {
		return sideChallenge({
			terrain: [2, 2, 2],
			sensors: [{ x: sensorX, trigger }],
			procedures: [{ trigger, maxSlots: 4 }],
			entities: {
				playerStart: { x: 0, y: 2 },
				playerFacing: 'right',
				obstacles: [],
				collectibles: [{ id: 'banana', pos: { x: 2, y: 2 } }]
			},
			goal: { type: 'collectAll' }
		});
	}

	it('runs the matching procedure when the monkey enters the sensor column', () => {
		const challenge = procChallenge('blue-triangle');
		const program: Program = {
			main: [b('stepRight'), b('stepRight')],
			procedures: { 'blue-triangle': [b('stepUp')] }
		};
		const result = run(challenge, program);
		const types = result.commands.map((c) => c.type);
		expect(types).toContain('procEnter');
		expect(types).toContain('procExit');
		expect(types).toContain('jumpUp');
		// procEnter/Exit must bracket the jumpUp from the procedure body.
		const enterAt = types.indexOf('procEnter');
		const exitAt = types.indexOf('procExit');
		const jumpAt = types.indexOf('jumpUp');
		expect(jumpAt).toBeGreaterThan(enterAt);
		expect(jumpAt).toBeLessThan(exitAt);
	});

	it('fires a sensor only once even if revisited', () => {
		const challenge = procChallenge('green-circle');
		const program: Program = {
			main: [b('stepRight'), b('stepLeft'), b('stepRight'), b('stepRight')],
			procedures: { 'green-circle': [b('stepUp')] }
		};
		const result = run(challenge, program);
		const enters = result.commands.filter((c) => c.type === 'procEnter');
		expect(enters).toHaveLength(1);
	});

	it('a plain BlockProgram (no procedures) still runs on a level with sensors', () => {
		const challenge = procChallenge('red-square');
		const result = run(challenge, [b('stepRight'), b('stepRight')]);
		expect(result.outcome).toBe('win');
		expect(result.commands.some((c) => c.type === 'procEnter')).toBe(true);
	});

	it('counts procedure-body blocks toward blocksUsed and stars', () => {
		const challenge = procChallenge('blue-triangle');
		const program: Program = {
			main: [b('stepRight'), b('stepRight')],
			procedures: { 'blue-triangle': [b('stepUp'), b('stepUp')] }
		};
		const result = run(challenge, program);
		expect(result.blocksUsed).toBe(4);
	});

	it('a failing procedure body loses the run', () => {
		const challenge = procChallenge('blue-triangle');
		const program: Program = {
			main: [b('stepRight'), b('stepRight')],
			procedures: { 'blue-triangle': [b('stepLeft'), b('stepLeft')] } // walks off the left edge
		};
		const result = run(challenge, program);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('blocked');
	});
});

describe('arrows — step budget still guards runaway loops', () => {
	it('aborts with step-limit on an infinite-feeling repeat', () => {
		const challenge = sideChallenge({ terrain: new Array(50).fill(2) });
		const result = run(challenge, [repeatOf(600, [b('stepRight'), b('stepLeft')])]);
		expect(result.outcome).toBe('lose');
		expect(result.reason).toBe('step-limit');
	});
});
