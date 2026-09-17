import type { Block, BlockProgram } from '$lib/engine';

let counter = 0;
/** Sequential, not random — deterministic ids make unit tests and replay
 * debugging easy, and we never need global uniqueness beyond one program. */
export function nextId(): string {
	counter += 1;
	return `b${counter}`;
}

export type ContainerPath = string[]; // sequence of repeat-block ids, root = []

function findContainer(program: BlockProgram, path: ContainerPath): BlockProgram | undefined {
	if (path.length === 0) return program;
	const [head, ...rest] = path;
	const block = program.find((b) => b.id === head);
	if (!block || block.type !== 'repeat') return undefined;
	return findContainer(block.body, rest);
}

/** Returns a new program with `block` appended into the container at `path`. */
export function appendBlock(program: BlockProgram, path: ContainerPath, block: Block): BlockProgram {
	if (path.length === 0) return [...program, block];
	const [head, ...rest] = path;
	return program.map((b) => {
		if (b.id !== head || b.type !== 'repeat') return b;
		return { ...b, body: appendBlock(b.body, rest, block) };
	});
}

/** Returns a new program with the block matching `id` removed, wherever it
 * is nested. */
export function removeBlock(program: BlockProgram, id: string): BlockProgram {
	return program
		.filter((b) => b.id !== id)
		.map((b) => (b.type === 'repeat' ? { ...b, body: removeBlock(b.body, id) } : b));
}

export function containerExists(program: BlockProgram, path: ContainerPath): boolean {
	return findContainer(program, path) !== undefined;
}
