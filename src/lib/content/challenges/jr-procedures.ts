import type { ChallengeInput } from '../schema';
import type { Program, Trigger } from '$lib/engine';
import { above, loop, seq, tile } from './jr-helpers';

/** "CodeMonkey Jr. — Advanced Procedures": stepping onto a colored sensor
 * runs that trigger's own procedure strip once, then the main program
 * continues from wherever it left off. Every level's main strip only
 * handles getting from start to finish; each procedure strip grabs the
 * banana that sensor is guarding. */

interface Sensor {
	x: number;
	trigger: Trigger;
	terrainHeight: number;
}

function level(
	n: number,
	title: string,
	terrain: number[],
	sensors: Sensor[],
	opts: { allowedBlocks: ChallengeInput['allowedBlocks']; threeStars: number; twoStars: number; hints: string[] }
): ChallengeInput {
	return {
		slug: `jr-proc-${String(n).padStart(2, '0')}`,
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
			collectibles: sensors.map((s, i) => ({ id: `b${i}`, pos: above(s.x, s.terrainHeight) }))
		},
		sensors: sensors.map((s) => ({ x: s.x, trigger: s.trigger })),
		procedures: sensors.map((s) => ({ trigger: s.trigger, maxSlots: 4 })),
		goal: { type: 'collectAll' },
		allowedBlocks: opts.allowedBlocks,
		maxSlots: 10,
		starCriteria: { threeStars: { maxBlocks: opts.threeStars }, twoStars: { maxBlocks: opts.twoStars } },
		hints: opts.hints
	};
}

export const jrProcedures: ChallengeInput[] = [
	level(
		1,
		'One Sensor',
		[2, 2, 2, 2, 2],
		[{ x: 2, trigger: 'blue-triangle', terrainHeight: 2 }],
		{
			allowedBlocks: ['stepRight', 'stepUp'],
			threeStars: 5,
			twoStars: 7,
			hints: [
				'Walk the main path all the way to the chest.',
				'The blue sensor has its own strip — put a step-up block there to grab its banana.'
			]
		}
	),
	level(
		2,
		'Two Sensors',
		[2, 2, 2, 2, 2, 2],
		[
			{ x: 2, trigger: 'blue-triangle', terrainHeight: 2 },
			{ x: 4, trigger: 'green-circle', terrainHeight: 2 }
		],
		{
			allowedBlocks: ['stepRight', 'stepUp'],
			threeStars: 7,
			twoStars: 9,
			hints: ['Each sensor gets its own procedure — fill in both strips with a step-up block.']
		}
	),
	level(
		3,
		'Climb and Trigger',
		[2, 2, 3, 3],
		[
			{ x: 1, trigger: 'green-circle', terrainHeight: 2 },
			{ x: 3, trigger: 'red-square', terrainHeight: 3 }
		],
		{
			allowedBlocks: ['stepRight', 'stepUpRight', 'stepUp'],
			threeStars: 5,
			twoStars: 7,
			hints: ['The main path climbs once in the middle — the sensors just need a step-up each.']
		}
	),
	level(
		4,
		'Loop Past Three',
		[2, 2, 2, 2, 2, 2, 2],
		[
			{ x: 1, trigger: 'blue-triangle', terrainHeight: 2 },
			{ x: 3, trigger: 'green-circle', terrainHeight: 2 },
			{ x: 5, trigger: 'red-square', terrainHeight: 2 }
		],
		{
			allowedBlocks: ['stepRight', 'stepUp', 'repeat'],
			threeStars: 5,
			twoStars: 8,
			hints: ['A single loop can walk the whole main path — the sensors still fire as you pass them.']
		}
	),
	level(
		5,
		'Summit Sensors',
		[1, 2, 2, 3, 3, 3, 4],
		[
			{ x: 2, trigger: 'blue-triangle', terrainHeight: 2 },
			{ x: 4, trigger: 'green-circle', terrainHeight: 3 },
			{ x: 5, trigger: 'red-square', terrainHeight: 3 }
		],
		{
			allowedBlocks: ['stepRight', 'stepUpRight', 'stepUp'],
			threeStars: 9,
			twoStars: 12,
			hints: ['Climb, cross the middle plateau past all three sensors, then climb once more to the top.']
		}
	)
];

export const jrProceduresSolutions: Record<string, Program> = {
	'jr-proc-01': {
		main: seq('stepRight', 'stepRight', 'stepRight', 'stepRight'),
		procedures: { 'blue-triangle': seq('stepUp') }
	},
	'jr-proc-02': {
		main: seq('stepRight', 'stepRight', 'stepRight', 'stepRight', 'stepRight'),
		procedures: { 'blue-triangle': seq('stepUp'), 'green-circle': seq('stepUp') }
	},
	'jr-proc-03': {
		main: seq('stepRight', 'stepUpRight', 'stepRight'),
		procedures: { 'green-circle': seq('stepUp'), 'red-square': seq('stepUp') }
	},
	'jr-proc-04': {
		main: [loop(6, 'stepRight')],
		procedures: { 'blue-triangle': seq('stepUp'), 'green-circle': seq('stepUp'), 'red-square': seq('stepUp') }
	},
	'jr-proc-05': {
		main: seq('stepUpRight', 'stepRight', 'stepUpRight', 'stepRight', 'stepRight', 'stepUpRight'),
		procedures: {
			'blue-triangle': seq('stepUp'),
			'green-circle': seq('stepUp'),
			'red-square': seq('stepUp')
		}
	}
};
