import { z } from 'zod';

const vec2 = z.object({ x: z.number().int(), y: z.number().int() });
const direction = z.enum(['up', 'right', 'down', 'left']);
const trigger = z.enum(['blue-triangle', 'green-circle', 'red-square']);
const blockType = z.enum([
	'forward',
	'turnLeft',
	'turnRight',
	'jump',
	'repeat',
	'stepRight',
	'stepLeft',
	'stepUp',
	'stepUpRight',
	'stepUpLeft'
]);
const obstacle = z.object({ pos: vec2, kind: z.enum(['rock', 'pit']) });

const ARROW_BLOCKS = new Set(['stepRight', 'stepLeft', 'stepUp', 'stepUpRight', 'stepUpLeft']);
const TURTLE_BLOCKS = new Set(['forward', 'turnLeft', 'turnRight', 'jump']);

export const challengeSchema = z
	.object({
		slug: z.string().min(1),
		title: z.string().min(1),
		mode: z.enum(['icon', 'blockly']),
		audioInstructionUrl: z.string().optional(),
		/** Top-down turtle grid (the original 7 challenges) vs. a side-view
		 * platformer rendered from a per-column terrain heightmap. */
		view: z.enum(['top', 'side']).default('top'),
		/** "turtle" is relative forward/turn; "arrows" is absolute
		 * left/right/up/diagonal steps used by the Jr.-style side-view
		 * levels. A challenge only ever allows blocks from one family. */
		movement: z.enum(['turtle', 'arrows']).default('turtle'),
		grid: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
		/** Required when view === 'side': solid-block height of each column
		 * (index = x), 0 meaning a gap/pit the monkey falls through. */
		terrain: z.array(z.number().int().min(0)).optional(),
		entities: z.object({
			playerStart: vec2,
			playerFacing: direction,
			obstacles: z.array(obstacle),
			collectibles: z.array(z.object({ id: z.string(), pos: vec2 }))
		}),
		/** Colored sensors placed in a side-view level; stepping onto a
		 * sensor's column runs the matching procedure once. */
		sensors: z.array(z.object({ x: z.number().int(), trigger })).default([]),
		/** Declares which triggers have an author-editable procedure strip
		 * and how many slots it holds. */
		procedures: z.array(z.object({ trigger, maxSlots: z.number().int().positive() })).default([]),
		goal: z.discriminatedUnion('type', [
			z.object({ type: z.literal('collectAll') }),
			z.object({ type: z.literal('reachTile'), target: vec2 })
		]),
		allowedBlocks: z.array(blockType).min(1),
		/** Slot count for the main program strip (Jr.-style UI). */
		maxSlots: z.number().int().positive().default(10),
		starCriteria: z.object({
			twoStars: z.object({ maxBlocks: z.number().int().positive() }),
			threeStars: z.object({ maxBlocks: z.number().int().positive() })
		}),
		hints: z.array(z.string())
	})
	.superRefine((c, ctx) => {
		const hasArrow = c.allowedBlocks.some((b) => ARROW_BLOCKS.has(b));
		const hasTurtle = c.allowedBlocks.some((b) => TURTLE_BLOCKS.has(b));
		if (c.movement === 'arrows' && hasTurtle) {
			ctx.addIssue({ code: 'custom', message: 'arrows-movement challenges cannot allow turtle blocks' });
		}
		if (c.movement === 'turtle' && hasArrow) {
			ctx.addIssue({ code: 'custom', message: 'turtle-movement challenges cannot allow arrow blocks' });
		}
		if (c.view === 'side') {
			if (!c.terrain) {
				ctx.addIssue({ code: 'custom', message: 'side-view challenges require terrain' });
			} else if (c.terrain.length !== c.grid.width) {
				ctx.addIssue({ code: 'custom', message: 'terrain length must equal grid.width' });
			}
		}
		for (const sensor of c.sensors) {
			if (sensor.x < 0 || sensor.x >= c.grid.width) {
				ctx.addIssue({ code: 'custom', message: `sensor x=${sensor.x} is out of bounds` });
			}
		}
	});

/** The authoring shape: fields with a zod `.default()` (view, movement,
 * sensors, procedures, maxSlots) are optional here and filled in at parse
 * time, so existing challenge files don't need to spell them out. */
export type ChallengeInput = z.input<typeof challengeSchema>;
