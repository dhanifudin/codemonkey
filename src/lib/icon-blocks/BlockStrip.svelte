<script lang="ts">
	import { asset } from '$app/paths';
	import type { Block, BlockProgram } from '$lib/engine';
	import { appendBlock, containerExists, nextId, removeBlock, type ContainerPath } from './programOps';
	import * as sfx from '$lib/sound/sfx';

	type SimpleType = Exclude<Block['type'], 'repeat'>;

	interface Props {
		allowedBlocks: Array<Block['type']>;
		/** Slot cap for the strip (courses 2/3). Omitted entirely for course
		 * 1's turtle levels, which keep their original uncapped programs —
		 * no dashed placeholders, no capacity limit, same visual language
		 * otherwise. */
		maxSlots?: number;
		disabled?: boolean;
		onChange?: (program: BlockProgram) => void;
	}

	let { allowedBlocks, maxSlots, disabled = false, onChange }: Props = $props();

	let program = $state<BlockProgram>([]);
	let activePath = $state<ContainerPath>([]);
	let pickingRepeatCount = $state(false);

	/** One icon family for every block across every course: the turtle
	 * blocks get purpose-drawn icons (icon-*.svg), the arrows blocks reuse
	 * the same directional glyphs the side-view levels already ship
	 * (arrow-*.svg) — both sets share the same stroke weight/color. */
	const ICON_ASSET: Record<SimpleType, string> = {
		forward: '/assets/icon-forward.svg',
		turnLeft: '/assets/icon-turn-left.svg',
		turnRight: '/assets/icon-turn-right.svg',
		jump: '/assets/icon-jump.svg',
		stepRight: '/assets/arrow-right.svg',
		stepLeft: '/assets/arrow-left.svg',
		stepUp: '/assets/arrow-up.svg',
		stepUpRight: '/assets/arrow-up-right.svg',
		stepUpLeft: '/assets/arrow-up-left.svg'
	};
	const LABEL: Record<SimpleType, string> = {
		forward: 'Forward',
		turnLeft: 'Turn left',
		turnRight: 'Turn right',
		jump: 'Jump',
		stepRight: 'Step right',
		stepLeft: 'Step left',
		stepUp: 'Step up',
		stepUpRight: 'Climb up-right',
		stepUpLeft: 'Climb up-left'
	};
	/** allowedBlocks is only ever the turtle family or the arrows family
	 * for a given challenge (schema-enforced) — order them so whichever
	 * family is active reads left-to-right in a sensible order. */
	const PALETTE_ORDER: SimpleType[] = [
		'stepLeft',
		'turnLeft',
		'stepRight',
		'forward',
		'stepUp',
		'jump',
		'stepUpLeft',
		'stepUpRight',
		'turnRight'
	];

	const topLevelCount = $derived(program.length);
	const slotsLeft = $derived(maxSlots !== undefined ? Math.max(0, maxSlots - topLevelCount) : 0);
	const atCapacity = $derived(maxSlots !== undefined && topLevelCount >= maxSlots && activePath.length === 0);
	const paletteTypes = $derived(PALETTE_ORDER.filter((t) => allowedBlocks.includes(t)));

	function emit() {
		onChange?.(program);
	}

	function addBlock(type: SimpleType) {
		if (disabled || atCapacity) return;
		sfx.place();
		program = appendBlock(program, activePath, { id: nextId(), type });
		emit();
	}

	function startRepeatPick() {
		if (disabled || atCapacity) return;
		pickingRepeatCount = true;
	}

	function confirmRepeat(count: number) {
		sfx.place();
		const id = nextId();
		program = appendBlock(program, activePath, { id, type: 'repeat', count, body: [] });
		activePath = [...activePath, id];
		pickingRepeatCount = false;
		emit();
	}

	function stepOut() {
		activePath = activePath.slice(0, -1);
	}

	function deleteBlock(id: string) {
		if (disabled) return;
		sfx.deleteBlock();
		program = removeBlock(program, id);
		if (!containerExists(program, activePath)) activePath = [];
		emit();
	}

	function clearAll() {
		if (disabled || program.length === 0) return;
		sfx.deleteBlock();
		program = [];
		activePath = [];
		emit();
	}
</script>

{#snippet blockPill(block: Block)}
	{#if block.type === 'repeat'}
		<button class="pill loop" onclick={() => deleteBlock(block.id)} aria-label="Delete repeat ×{block.count} loop">
			<span class="loop-badge">×{block.count}</span>
			{#each block.body as child (child.id)}
				<span class="nested">
					{@render blockPill(child)}
				</span>
			{/each}
		</button>
	{:else}
		<button class="pill" onclick={() => deleteBlock(block.id)} aria-label="Delete {LABEL[block.type as SimpleType]} block">
			<img src={asset(ICON_ASSET[block.type as SimpleType])} alt="" />
		</button>
	{/if}
{/snippet}

<div class="block-strip">
	<div class="slots" role="group" aria-label="Your program">
		{#each program as block (block.id)}
			{@render blockPill(block)}
		{/each}
		{#if maxSlots !== undefined}
			{#each { length: slotsLeft } as _, i (i)}
				<span class="slot-empty"></span>
			{/each}
		{/if}
		{#if program.length === 0 && maxSlots === undefined}
			<p class="empty-hint">Tap blocks below to build your program</p>
		{/if}
	</div>

	{#if activePath.length > 0}
		<button class="step-out" {disabled} onclick={stepOut}>⬅ Done with loop</button>
	{/if}

	<div class="palette" role="group" aria-label="Available blocks">
		{#each paletteTypes as type (type)}
			<button class="palette-block" disabled={disabled || atCapacity} onclick={() => addBlock(type)} aria-label={LABEL[type]}>
				<img src={asset(ICON_ASSET[type])} alt="" />
			</button>
		{/each}
		{#if allowedBlocks.includes('repeat')}
			<button class="palette-block" disabled={disabled || atCapacity} onclick={startRepeatPick} aria-label="Repeat">
				<img src={asset('/assets/icon-repeat.svg')} alt="" />
			</button>
		{/if}
		<button class="palette-block clear" disabled={disabled} onclick={clearAll} aria-label="Clear program">
			<img src={asset('/assets/icon-trash.svg')} alt="" />
		</button>
	</div>

	{#if pickingRepeatCount}
		<div class="count-picker" role="group" aria-label="Choose repeat count">
			{#each [2, 3, 4, 5, 6] as n (n)}
				<button class="count-choice" onclick={() => confirmRepeat(n)}>{n}</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.block-strip {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
	}
	.slots {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		min-height: 60px;
		padding: var(--space-2);
		border-radius: var(--radius-md);
		background: rgba(255, 255, 255, 0.85);
	}
	.empty-hint {
		margin: 0;
		color: var(--gray-500);
		font-size: 0.9rem;
	}
	.pill {
		min-width: 56px;
		min-height: 56px;
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		padding: 0 0.4rem;
		border-radius: var(--radius-md);
		border: 2px solid var(--green-900);
		background: #ffffff;
		cursor: pointer;
		touch-action: manipulation;
	}
	.pill img {
		width: 28px;
		height: 28px;
	}
	.pill.loop {
		background: var(--amber-100);
		border-color: var(--amber-700);
	}
	.loop-badge {
		font-weight: var(--fw-bold);
		font-size: 0.85rem;
		color: var(--amber-800);
	}
	.nested :global(.pill) {
		min-width: 36px;
		min-height: 36px;
	}
	.nested :global(.pill img) {
		width: 18px;
		height: 18px;
	}
	.slot-empty {
		width: 56px;
		height: 56px;
		border-radius: var(--radius-md);
		border: 2px dashed rgba(255, 255, 255, 0.7);
	}
	.step-out {
		align-self: flex-start;
		min-height: 40px;
		padding: 0 0.9rem;
		border-radius: var(--radius-sm);
		border: none;
		background: #e0f2fe;
		font-weight: var(--fw-semibold);
		cursor: pointer;
	}
	.palette,
	.count-picker {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.palette-block,
	.count-choice {
		min-width: 56px;
		min-height: 56px;
		border-radius: var(--radius-md);
		border: 2px solid var(--green-900);
		background: var(--green-100);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.3rem;
		touch-action: manipulation;
	}
	.palette-block img {
		width: 30px;
		height: 30px;
	}
	.palette-block:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.clear {
		background: var(--red-100);
	}
	.count-choice {
		background: var(--amber-100);
	}
</style>
