export type Direction = 'up' | 'right' | 'down' | 'left';

export interface Vec2 {
	x: number;
	y: number;
}

/** A block program is a sequence of blocks. Shared AST for icon-mode and
 * (later) Blockly-generated programs — the interpreter doesn't care which
 * editor produced it. */
export type Block =
	| { id: string; type: 'forward' }
	| { id: string; type: 'turnLeft' }
	| { id: string; type: 'turnRight' }
	| { id: string; type: 'jump' }
	| { id: string; type: 'repeat'; count: number; body: Block[] };

export type BlockProgram = Block[];

export interface Challenge {
	slug: string;
	title: string;
	mode: 'icon' | 'blockly';
	audioInstructionUrl?: string;
	grid: {
		width: number;
		height: number;
	};
	entities: {
		playerStart: Vec2;
		playerFacing: Direction;
		/** "rock" blocks movement outright — route around it. "pit" only
		 * blocks a plain walk-in (forward into it falls); jumping over one
		 * is the whole point of the jump block. */
		obstacles: { pos: Vec2; kind: 'rock' | 'pit' }[];
		collectibles: { id: string; pos: Vec2 }[];
	};
	goal:
		| { type: 'collectAll' }
		| { type: 'reachTile'; target: Vec2 };
	allowedBlocks: Array<Block['type']>;
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
	| { type: 'blocked'; at: Vec2; facing: Direction; blockId: string }
	| { type: 'fall'; at: Vec2; blockId: string }
	| { type: 'turn'; from: Direction; to: Direction; blockId: string }
	| { type: 'collect'; itemId: string; at: Vec2; blockId: string }
	| { type: 'win' }
	| { type: 'lose'; reason: 'blocked' | 'step-limit' | 'incomplete' | 'fell' };

export interface RunResult {
	commands: Command[];
	outcome: 'win' | 'lose';
	reason?: 'blocked' | 'step-limit' | 'incomplete' | 'fell';
	blocksUsed: number;
	stars: 0 | 1 | 2 | 3;
}
