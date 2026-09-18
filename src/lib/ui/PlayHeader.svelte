<script lang="ts">
	import IconButton from './IconButton.svelte';
	import * as sfx from '$lib/sound/sfx';

	interface Props {
		backHref: string;
		levelBadge: string;
		title: string;
		instruction: string;
	}

	let { backHref, levelBadge, title, instruction }: Props = $props();
</script>

<div class="play-header">
	<div class="top-row">
		<IconButton icon="/assets/icon-map.svg" label="Back to course map" href={backHref} onclick={() => sfx.nav()} />
		<span class="level-badge">{levelBadge}</span>
	</div>
	<h1>{title}</h1>
	<p class="instruction">{instruction}</p>
</div>

<style>
	.play-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-3) var(--space-4) 0;
	}
	.top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.level-badge {
		font-weight: var(--fw-black);
		font-size: 1.05rem;
		color: var(--green-900);
		background: #ffffff;
		border-radius: var(--radius-sm);
		padding: 0.2rem 0.7rem;
		border: 2px solid var(--green-900);
	}
	h1 {
		margin: 0;
		color: var(--green-900);
		font-size: 1.15rem;
		text-align: center;
	}
	.instruction {
		margin: 0;
		font-size: 0.95rem;
		color: var(--green-900);
		font-weight: var(--fw-semibold);
		text-align: center;
		opacity: 0.85;
	}
</style>
