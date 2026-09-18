import type { Block, BlockProgram, Challenge, Command, Direction, Program, RunResult, Trigger, Vec2 } from './types';

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
	/** Indices into challenge.sensors that have already run their
	 * procedure — each sensor fires at most once per run. */
	firedSensors: Set<number>;
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

/** The row (y, counted from the top like the rest of the grid) a monkey
 * standing in column `x` rests on, derived from the terrain heightmap
 * rather than tracked separately — this keeps position always consistent
 * with the world even if a level's playerStart is off by a row. Returns
 * undefined when the column is a gap (terrain height 0) or out of bounds. */
function standRow(x: number, challenge: Challenge): number | undefined {
	const terrain = challenge.terrain;
	if (!terrain || x < 0 || x >= terrain.length) return undefined;
	const height = terrain[x];
	if (height <= 0) return undefined;
	return challenge.grid.height - height - 1;
}

/** Runs the (possibly empty) procedure attached to whichever sensor sits in
 * the monkey's current column, if it hasn't already fired this run. */
function checkSensor(state: RunState, challenge: Challenge, program: Program): void {
	const sensors = challenge.sensors ?? [];
	const idx = sensors.findIndex((s, i) => s.x === state.pos.x && !state.firedSensors.has(i));
	if (idx === -1) return;
	state.firedSensors.add(idx);
	const trigger: Trigger = sensors[idx].trigger;
	const body = program.procedures?.[trigger] ?? [];
	state.commands.push({ type: 'procEnter', trigger });
	for (const block of body) execBlock(block, state, challenge, program);
	state.commands.push({ type: 'procExit', trigger });
}

/** Absolute horizontal step (stepRight/stepLeft): walks onto an
 * equal-or-lower ledge, blocked by a taller one, falls if the column ahead
 * is a gap. */
function execStepHorizontal(dx: 1 | -1, block: Block, state: RunState, challenge: Challenge, program: Program): void {
	const nx = state.pos.x + dx;
	const facing: Direction = dx > 0 ? 'right' : 'left';
	const terrain = challenge.terrain ?? [];
	const curHeight = terrain[state.pos.x] ?? 0;
	const targetHeight = terrain[nx] ?? 0;

	if (nx < 0 || nx >= challenge.grid.width) {
		state.commands.push({ type: 'blocked', at: state.pos, facing, blockId: block.id });
		throw new BlockedError();
	}
	if (targetHeight === 0) {
		state.commands.push({ type: 'fall', at: { x: nx, y: state.pos.y }, blockId: block.id });
		throw new FellError();
	}
	if (targetHeight > curHeight) {
		state.commands.push({ type: 'blocked', at: state.pos, facing, blockId: block.id });
		throw new BlockedError();
	}

	const from = state.pos;
	const to: Vec2 = { x: nx, y: standRow(nx, challenge)! };
	state.pos = to;
	state.facing = facing;
	state.commands.push({ type: 'move', from, to, facing, blockId: block.id });
	tryCollect(to, state, challenge, block.id);
	checkSensor(state, challenge, program);
}

/** Diagonal climb (stepUpRight/stepUpLeft): only succeeds onto a ledge
 * exactly one block taller — anything else is blocked. */
function execStepClimb(dx: 1 | -1, block: Block, state: RunState, challenge: Challenge, program: Program): void {
	const nx = state.pos.x + dx;
	const facing: Direction = dx > 0 ? 'right' : 'left';
	const terrain = challenge.terrain ?? [];
	const curHeight = terrain[state.pos.x] ?? 0;
	const targetHeight = nx < 0 || nx >= challenge.grid.width ? -1 : (terrain[nx] ?? 0);

	if (targetHeight !== curHeight + 1) {
		state.commands.push({ type: 'blocked', at: state.pos, facing, blockId: block.id });
		throw new BlockedError();
	}

	const from = state.pos;
	const to: Vec2 = { x: nx, y: standRow(nx, challenge)! };
	state.pos = to;
	state.facing = facing;
	state.commands.push({ type: 'move', from, to, facing, blockId: block.id });
	tryCollect(to, state, challenge, block.id);
	checkSensor(state, challenge, program);
}

/** Vertical hop in place (stepUp) — used to reach a banana hanging one row
 * above a brick ledge. Never fails; the monkey lands back where it stood. */
function execStepUp(block: Block, state: RunState, challenge: Challenge): void {
	const apex: Vec2 = { x: state.pos.x, y: state.pos.y - 1 };
	state.commands.push({ type: 'jumpUp', at: apex, blockId: block.id });
	tryCollect(apex, state, challenge, block.id);
}

function execBlock(block: Block, state: RunState, challenge: Challenge, program: Program): void {
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
		case 'stepRight':
			return execStepHorizontal(1, block, state, challenge, program);
		case 'stepLeft':
			return execStepHorizontal(-1, block, state, challenge, program);
		case 'stepUpRight':
			return execStepClimb(1, block, state, challenge, program);
		case 'stepUpLeft':
			return execStepClimb(-1, block, state, challenge, program);
		case 'stepUp':
			return execStepUp(block, state, challenge);
		case 'repeat': {
			for (let i = 0; i < block.count; i++) {
				for (const child of block.body) execBlock(child, state, challenge, program);
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

/** Total blocks placed across the main strip and every procedure strip —
 * a level with procedures counts them all toward star criteria. */
function totalBlocksUsed(program: Program): number {
	let n = countBlocks(program.main);
	for (const body of Object.values(program.procedures ?? {})) {
		if (body) n += countBlocks(body);
	}
	return n;
}

function starsFor(challenge: Challenge, blocksUsed: number): RunResult['stars'] {
	if (blocksUsed <= challenge.starCriteria.threeStars.maxBlocks) return 3;
	if (blocksUsed <= challenge.starCriteria.twoStars.maxBlocks) return 2;
	return 1;
}

function normalizeProgram(input: BlockProgram | Program): Program {
	return Array.isArray(input) ? { main: input } : input;
}

export function run(challenge: Challenge, input: BlockProgram | Program): RunResult {
	const program = normalizeProgram(input);
	const state: RunState = {
		pos: { ...challenge.entities.playerStart },
		facing: challenge.entities.playerFacing,
		remainingCollectibles: new Set(challenge.entities.collectibles.map((c) => c.id)),
		commands: [],
		steps: 0,
		firedSensors: new Set()
	};
	const blocksUsed = totalBlocksUsed(program);

	try {
		for (const block of program.main) execBlock(block, state, challenge, program);
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
