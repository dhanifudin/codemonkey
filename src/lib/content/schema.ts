import { z } from 'zod';

const vec2 = z.object({ x: z.number().int(), y: z.number().int() });
const direction = z.enum(['up', 'right', 'down', 'left']);
const blockType = z.enum(['forward', 'turnLeft', 'turnRight', 'jump', 'repeat']);
const obstacle = z.object({ pos: vec2, kind: z.enum(['rock', 'pit']) });

export const challengeSchema = z.object({
	slug: z.string().min(1),
	title: z.string().min(1),
	mode: z.enum(['icon', 'blockly']),
	audioInstructionUrl: z.string().optional(),
	grid: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
	entities: z.object({
		playerStart: vec2,
		playerFacing: direction,
		obstacles: z.array(obstacle),
		collectibles: z.array(z.object({ id: z.string(), pos: vec2 }))
	}),
	goal: z.discriminatedUnion('type', [
		z.object({ type: z.literal('collectAll') }),
		z.object({ type: z.literal('reachTile'), target: vec2 })
	]),
	allowedBlocks: z.array(blockType).min(1),
	starCriteria: z.object({
		twoStars: z.object({ maxBlocks: z.number().int().positive() }),
		threeStars: z.object({ maxBlocks: z.number().int().positive() })
	}),
	hints: z.array(z.string())
});

export type ChallengeInput = z.infer<typeof challengeSchema>;
