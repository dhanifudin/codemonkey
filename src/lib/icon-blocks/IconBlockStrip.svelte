<script lang="ts">
	import type { Block, BlockProgram } from '$lib/engine';
	import { appendBlock, containerExists, nextId, removeBlock, type ContainerPath } from './programOps';

	interface Props {
		allowedBlocks: Array<Block['type']>;
		disabled?: boolean;
		onChange?: (program: BlockProgram) => void;
	}

	let { allowedBlocks, disabled = false, onChange }: Props = $props();

	let program = $state<BlockProgram>([]);
	let activePath = $state<ContainerPath>([]);
	let pickingRepeatCount = $state(false);

	const ICON: Record<Block['type'], string> = {
		forward: '⬆️',
		turnLeft: '↺',
		turnRight: '↻',
		jump: '🦘',
		repeat: '🔁'
	};
	const LABEL: Record<Block['type'], string> = {
		forward: 'Forward',
		turnLeft: 'Turn left',
		turnRight: 'Turn right',
		jump: 'Jump',
		repeat: 'Repeat'
	};

	function emit() {
		onChange?.(program);
	}

	function addSimpleBlock(type: 'forward' | 'turnLeft' | 'turnRight' | 'jump') {
		if (disabled) return;
		program = appendBlock(program, activePath, { id: nextId(), type });
		emit();
	}

	function startRepeatPick() {
		if (disabled) return;
		pickingRepeatCount = true;
	}

	function confirmRepeat(count: number) {
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
		program = removeBlock(program, id);
		if (!containerExists(program, activePath)) activePath = [];
		emit();
	}

	function clearAll() {
		if (disabled) return;
		program = [];
		activePath = [];
		emit();
	}
</script>

{#snippet blockList(blocks: BlockProgram, path: ContainerPath)}
	<div class="block-row">
		{#each blocks as block (block.id)}
			{#if block.type === 'repeat'}
				<div class="loop-card">
					<button class="loop-header" onclick={() => deleteBlock(block.id)} aria-label="Delete repeat {block.count} loop">
						{ICON.repeat} ×{block.count}
					</button>
					{@render blockList(block.body, [...path, block.id])}
				</div>
			{:else}
				<button class="placed-block" onclick={() => deleteBlock(block.id)} aria-label="Delete {LABEL[block.type]} block">
					{ICON[block.type]}
				</button>
			{/if}
		{/each}
	</div>
{/snippet}

<div class="strip">
	<div class="palette" role="group" aria-label="Available blocks">
		{#if allowedBlocks.includes('forward')}
			<button class="palette-block" disabled={disabled} onclick={() => addSimpleBlock('forward')} aria-label={LABEL.forward}>
				{ICON.forward}
			</button>
		{/if}
		{#if allowedBlocks.includes('turnLeft')}
			<button class="palette-block" disabled={disabled} onclick={() => addSimpleBlock('turnLeft')} aria-label={LABEL.turnLeft}>
				{ICON.turnLeft}
			</button>
		{/if}
		{#if allowedBlocks.includes('turnRight')}
			<button class="palette-block" disabled={disabled} onclick={() => addSimpleBlock('turnRight')} aria-label={LABEL.turnRight}>
				{ICON.turnRight}
			</button>
		{/if}
		{#if allowedBlocks.includes('jump')}
			<button class="palette-block" disabled={disabled} onclick={() => addSimpleBlock('jump')} aria-label={LABEL.jump}>
				{ICON.jump}
			</button>
		{/if}
		{#if allowedBlocks.includes('repeat')}
			<button class="palette-block" disabled={disabled} onclick={startRepeatPick} aria-label={LABEL.repeat}>
				{ICON.repeat}
			</button>
		{/if}
		<button class="palette-block clear" disabled={disabled} onclick={clearAll} aria-label="Clear program">🗑️</button>
	</div>

	{#if pickingRepeatCount}
		<div class="count-picker" role="group" aria-label="Choose repeat count">
			{#each [2, 3, 4, 5, 6] as n (n)}
				<button class="count-choice" onclick={() => confirmRepeat(n)}>{n}</button>
			{/each}
		</div>
	{/if}

	{#if activePath.length > 0}
		<button class="step-out" onclick={stepOut}>⬅️ Done with loop</button>
	{/if}

	<div class="program-area" aria-label="Your program">
		{@render blockList(program, [])}
		{#if program.length === 0}
			<p class="empty-hint">Tap blocks above to build your program</p>
		{/if}
	</div>
</div>

<style>
	.strip {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}
	.palette,
	.count-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.palette-block,
	.placed-block,
	.count-choice,
	.loop-header,
	.step-out {
		min-width: 56px;
		min-height: 56px;
		font-size: 1.5rem;
		border-radius: 12px;
		border: 2px solid #14532d;
		background: #ffffff;
		cursor: pointer;
		touch-action: manipulation;
	}
	.palette-block {
		background: #dcfce7;
	}
	.palette-block:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.placed-block {
		background: #f0fdf4;
	}
	.loop-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem;
		border: 2px dashed #ca8a04;
		border-radius: 12px;
		background: #fefce8;
	}
	.loop-header {
		align-self: flex-start;
		background: #fde68a;
		font-size: 1rem;
		min-width: unset;
		min-height: 40px;
		padding: 0 0.75rem;
	}
	.block-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: flex-start;
	}
	.program-area {
		min-height: 80px;
		padding: 0.75rem;
		border-radius: 12px;
		background: #f8fafc;
		border: 2px solid #e2e8f0;
	}
	.empty-hint {
		margin: 0;
		color: #64748b;
		font-size: 0.95rem;
	}
	.count-choice {
		background: #fde68a;
	}
	.step-out {
		align-self: flex-start;
		background: #e0f2fe;
		min-height: 44px;
		padding: 0 1rem;
	}
</style>
