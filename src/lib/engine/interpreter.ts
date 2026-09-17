import type { Block, BlockProgram, Challenge, Command, Direction, RunResult, Vec2 } from './types';

const TURN_LEFT: Record<Direction, Direction> = { up: 'left', left: 'down', down: 'right', right: 'up' };
const TURN_RIGHT: Record<Direction, Direction> = { up: 'right', right: 'down', down: 'left', left: 'up' };
const STEP_DELTA: Record<Direction, Vec2> = {
	up: { x: 0, y: -1 },
	down: { x: 0, y: 1 },
	left: { x: -1, y: 0 },
	right: { x: 1, y: 0 }
};

/** Total block executions allowed before we abort as a runaway/infinite loop. */
const STEP_BUDGET = 1000;

class StepLimitError extends Error {}
class BlockedError extends Error {}
class FellError extends Error {}

interface RunState {
	pos: Vec2;
	facing: Direction;
	remainingCollectibles: Set<string>;
	commands: Command[];
	steps: number;
}

function inBounds(pos: Vec2, challenge: Challenge): boolean {
	return pos.x >= 0 && pos.y >= 0 && pos.x < challenge.grid.width && pos.y < challenge.grid.height;
}

function obstacleAt(pos: Vec2, challenge: Challenge): 'rock' | 'pit' | undefined {
	return challenge.entities.obstacles.find((o) => o.pos.x === pos.x && o.pos.y === pos.y)?.kind;
}

function collectibleAt(pos: Vec2, state: RunState, challenge: Challenge): string | undefined {
	return challenge.entities.collectibles.find(
		(c) => c.pos.x === pos.x && c.pos.y === pos.y && state.remainingCollectibles.has(c.id)
	)?.id;
}

function goalMet(state: RunState, challenge: Challenge): boolean {
	if (challenge.goal.type === 'collectAll') return state.remainingCollectibles.size === 0;
	return state.pos.x === challenge.goal.target.x && state.pos.y === challenge.goal.target.y;
}

function tryCollect(pos: Vec2, state: RunState, challenge: Challenge, blockId: string): void {
	const itemId = collectibleAt(pos, state, challenge);
	if (itemId) {
		state.remainingCollectibles.delete(itemId);
		state.commands.push({ type: 'collect', itemId, at: pos, blockId });
	}
}

function execBlock(block: Block, state: RunState, challenge: Challenge): void {
	state.steps += 1;
	if (state.steps > STEP_BUDGET) throw new StepLimitError();

	switch (block.type) {
		case 'forward': {
			const delta = STEP_DELTA[state.facing];
			const next: Vec2 = { x: state.pos.x + delta.x, y: state.pos.y + delta.y };
			const kind = inBounds(next, challenge) ? obstacleAt(next, challenge) : undefined;
			if (!inBounds(next, challenge) || kind === 'rock') {
				state.commands.push({ type: 'blocked', at: state.pos, facing: state.facing, blockId: block.id });
				throw new BlockedError();
			}
			if (kind === 'pit') {
				state.commands.push({ type: 'fall', at: next, blockId: block.id });
				throw new FellError();
			}
			const from = state.pos;
			state.pos = next;
			state.commands.push({ type: 'move', from, to: next, facing: state.facing, blockId: block.id });
			tryCollect(next, state, challenge, block.id);
			return;
		}
		case 'jump': {
			const delta = STEP_DELTA[state.facing];
			const over: Vec2 = { x: state.pos.x + delta.x, y: state.pos.y + delta.y };
			const land: Vec2 = { x: state.pos.x + delta.x * 2, y: state.pos.y + delta.y * 2 };
			// `over` is always in-bounds whenever `land` is, since it's the
			// midpoint of two axis-aligned steps from an in-bounds start —
			// no separate bounds check needed for it.
			const landKind = inBounds(land, challenge) ? obstacleAt(land, challenge) : undefined;
			if (!inBounds(land, challenge) || landKind === 'rock') {
				state.commands.push({ type: 'blocked', at: state.pos, facing: state.facing, blockId: block.id });
				throw new BlockedError();
			}
			if (landKind === 'pit') {
				state.commands.push({ type: 'fall', at: land, blockId: block.id });
				throw new FellError();
			}
			const from = state.pos;
			state.pos = land;
			state.commands.push({ type: 'jump', from, over, to: land, facing: state.facing, blockId: block.id });
			// Only the landing tile can be collected from — jumping flies
			// over whatever is on the skipped tile, uncollected.
			tryCollect(land, state, challenge, block.id);
			return;
		}
		case 'turnLeft': {
			const to = TURN_LEFT[state.facing];
			state.commands.push({ type: 'turn', from: state.facing, to, blockId: block.id });
			state.facing = to;
			return;
		}
		case 'turnRight': {
			const to = TURN_RIGHT[state.facing];
			state.commands.push({ type: 'turn', from: state.facing, to, blockId: block.id });
			state.facing = to;
			return;
		}
		case 'repeat': {
			for (let i = 0; i < block.count; i++) {
				for (const child of block.body) execBlock(child, state, challenge);
			}
			return;
		}
	}
}

/** Counts blocks as placed in the program (loop bodies count once, not per
 * iteration) — this is what star criteria are measured against, matching
 * "solve in N blocks or fewer" rather than runtime step count. */
export function countBlocks(program: BlockProgram): number {
	let n = 0;
	for (const block of program) {
		n += 1;
		if (block.type === 'repeat') n += countBlocks(block.body);
	}
	return n;
}

function starsFor(challenge: Challenge, blocksUsed: number): RunResult['stars'] {
	if (blocksUsed <= challenge.starCriteria.threeStars.maxBlocks) return 3;
	if (blocksUsed <= challenge.starCriteria.twoStars.maxBlocks) return 2;
	return 1;
}

export function run(challenge: Challenge, program: BlockProgram): RunResult {
	const state: RunState = {
		pos: { ...challenge.entities.playerStart },
		facing: challenge.entities.playerFacing,
		remainingCollectibles: new Set(challenge.entities.collectibles.map((c) => c.id)),
		commands: [],
		steps: 0
	};
	const blocksUsed = countBlocks(program);

	try {
		for (const block of program) execBlock(block, state, challenge);
	} catch (err) {
		if (err instanceof BlockedError) {
			state.commands.push({ type: 'lose', reason: 'blocked' });
			return { commands: state.commands, outcome: 'lose', reason: 'blocked', blocksUsed, stars: 0 };
		}
		if (err instanceof StepLimitError) {
			state.commands.push({ type: 'lose', reason: 'step-limit' });
			return { commands: state.commands, outcome: 'lose', reason: 'step-limit', blocksUsed, stars: 0 };
		}
		if (err instanceof FellError) {
			state.commands.push({ type: 'lose', reason: 'fell' });
			return { commands: state.commands, outcome: 'lose', reason: 'fell', blocksUsed, stars: 0 };
		}
		throw err;
	}

	if (goalMet(state, challenge)) {
		state.commands.push({ type: 'win' });
		return { commands: state.commands, outcome: 'win', blocksUsed, stars: starsFor(challenge, blocksUsed) };
	}

	state.commands.push({ type: 'lose', reason: 'incomplete' });
	return { commands: state.commands, outcome: 'lose', reason: 'incomplete', blocksUsed, stars: 0 };
}
