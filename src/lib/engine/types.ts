export type Direction = 'up' | 'right' | 'down' | 'left';

export interface Vec2 {
	x: number;
	y: number;
}

export type Trigger = 'blue-triangle' | 'green-circle' | 'red-square';

/** A block program is a sequence of blocks. Shared AST for icon-mode and
 * (later) Blockly-generated programs — the interpreter doesn't care which
 * editor produced it.
 *
 * The turtle blocks (forward/turn/jump) and the arrows blocks (step*) are
 * two separate movement vocabularies — a challenge's `movement` field picks
 * exactly one family via `allowedBlocks`, never both. */
export type Block =
	| { id: string; type: 'forward' }
	| { id: string; type: 'turnLeft' }
	| { id: string; type: 'turnRight' }
	| { id: string; type: 'jump' }
	| { id: string; type: 'repeat'; count: number; body: Block[] }
	| { id: string; type: 'stepRight' }
	| { id: string; type: 'stepLeft' }
	| { id: string; type: 'stepUp' }
	| { id: string; type: 'stepUpRight' }
	| { id: string; type: 'stepUpLeft' };

export type BlockProgram = Block[];

/** What a player submits to `run()`. Turtle levels (and legacy call sites)
 * pass a bare `BlockProgram`; levels with sensors pass a `Program` with a
 * main strip plus one strip per procedure trigger the level declares. */
export interface Program {
	main: BlockProgram;
	procedures?: Partial<Record<Trigger, BlockProgram>>;
}

export interface Challenge {
	slug: string;
	title: string;
	mode: 'icon' | 'blockly';
	audioInstructionUrl?: string;
	/** Top-down turtle grid vs. side-view platformer. Defaults to 'top' for
	 * the original challenges, which predate this field. */
	view?: 'top' | 'side';
	/** 'turtle' (relative forward/turn, default) vs 'arrows' (absolute
	 * left/right/up/diagonal steps). */
	movement?: 'turtle' | 'arrows';
	grid: {
		width: number;
		height: number;
	};
	/** Side-view only: solid-block height of each column (index = x), 0 = a
	 * gap the monkey falls through. */
	terrain?: number[];
	entities: {
		playerStart: Vec2;
		playerFacing: Direction;
		/** "rock" blocks movement outright — route around it. "pit" only
		 * blocks a plain walk-in (forward into it falls); jumping over one
		 * is the whole point of the jump block. */
		obstacles: { pos: Vec2; kind: 'rock' | 'pit' }[];
		collectibles: { id: string; pos: Vec2 }[];
	};
	/** Side-view only: colored sensors that run their matching procedure
	 * once, the first time the monkey's column reaches them. */
	sensors?: { x: number; trigger: Trigger }[];
	/** Side-view only: declares which triggers have an editable procedure
	 * strip and how many slots it holds. */
	procedures?: { trigger: Trigger; maxSlots: number }[];
	goal:
		| { type: 'collectAll' }
		| { type: 'reachTile'; target: Vec2 };
	allowedBlocks: Array<Block['type']>;
	/** Slot count for the main program strip in the Jr.-style UI. */
	maxSlots?: number;
	starCriteria: {
		/** Solving at all always earns 1 star. */
		twoStars: { maxBlocks: number };
		threeStars: { maxBlocks: number };
	};
	hints: string[];
}

/** One unit of animation/output the game layer plays back. */
export type Command =
	| { type: 'move'; from: Vec2; to: Vec2; facing: Direction; blockId: string }
	| { type: 'jump'; from: Vec2; over: Vec2; to: Vec2; facing: Direction; blockId: string }
	/** Side-view vertical hop in place (the `stepUp` block) — arcs up and
	 * back down without changing column. */
	| { type: 'jumpUp'; at: Vec2; blockId: string }
	| { type: 'blocked'; at: Vec2; facing: Direction; blockId: string }
	| { type: 'fall'; at: Vec2; blockId: string }
	| { type: 'turn'; from: Direction; to: Direction; blockId: string }
	| { type: 'collect'; itemId: string; at: Vec2; blockId: string }
	/** Side-view sensor handoff, bracketing the procedure's own commands so
	 * the renderer can flash the sensor light. */
	| { type: 'procEnter'; trigger: Trigger }
	| { type: 'procExit'; trigger: Trigger }
	| { type: 'win' }
	| { type: 'lose'; reason: 'blocked' | 'step-limit' | 'incomplete' | 'fell' };

export interface RunResult {
	commands: Command[];
	outcome: 'win' | 'lose';
	reason?: 'blocked' | 'step-limit' | 'incomplete' | 'fell';
	blocksUsed: number;
	stars: 0 | 1 | 2 | 3;
}
