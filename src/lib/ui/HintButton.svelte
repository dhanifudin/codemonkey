<script lang="ts">
	import IconButton from './IconButton.svelte';
	import * as sfx from '$lib/sound/sfx';

	interface Props {
		hints: string[];
		disabled?: boolean;
	}

	let { hints, disabled = false }: Props = $props();

	let hintIndex = $state(0);
	let showHints = $state(false);

	function reveal() {
		sfx.nav();
		showHints = true;
		hintIndex = Math.min(hintIndex + 1, hints.length - 1);
	}
</script>

<div class="hint-wrap">
	<IconButton icon="/assets/icon-hint.svg" label="Show a hint" onclick={reveal} disabled={disabled || hints.length === 0} />
	{#if showHints}
		<p class="hint-text">{hints[hintIndex]}</p>
	{/if}
</div>

<style>
	.hint-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}
	.hint-text {
		margin: 0;
		max-width: 22rem;
		background: var(--amber-50);
		border: 2px solid var(--amber-100);
		border-radius: var(--radius-sm);
		padding: var(--space-3);
		color: var(--green-900);
		font-size: 0.9rem;
		text-align: center;
	}
</style>
