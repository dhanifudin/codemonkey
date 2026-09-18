import type { Block, Vec2 } from '$lib/engine';

/** All Jr.-style side-view levels in this app share one grid height, which
 * keeps the row math for terrain/bananas/goals a single small formula
 * instead of a per-level constant to get wrong. */
export const GRID_HEIGHT = 5;

/** The row (y, from the top) a monkey standing on a column of this terrain
 * height rests on — mirrors `standRow` in the interpreter. */
export function standRow(height: number): number {
	return GRID_HEIGHT - height - 1;
}

/** The row a banana hangs at when it sits one block above a ledge of this
 * height, collected via the `stepUp` block. */
export function ledgeAbove(height: number): number {
	return standRow(height) - 1;
}

export function tile(x: number, height: number): Vec2 {
	return { x, y: standRow(height) };
}

export function above(x: number, height: number): Vec2 {
	return { x, y: ledgeAbove(height) };
}

type SimpleType = Exclude<Block['type'], 'repeat'>;

let uid = 0;
/** Deterministic, unique ids for the hand-authored "known solution" blocks
 * used by the solvability test — separate counter from the editor's
 * `programOps.nextId` since these are fixtures, not user-edited state. */
function nb(type: SimpleType): Block {
	uid += 1;
	return { id: `sol-${uid}`, type } as Block;
}

export function seq(...types: SimpleType[]): Block[] {
	return types.map(nb);
}

export function loop(count: number, ...types: SimpleType[]): Block {
	uid += 1;
	return { id: `sol-${uid}`, type: 'repeat', count, body: types.map(nb) };
}
