<script lang="ts">
	import type { RunResult } from '$lib/engine';
	import * as sfx from '$lib/sound/sfx';

	interface Props {
		result: RunResult;
		movement: 'turtle' | 'arrows';
		hasNext: boolean;
		onNext: () => void;
		onRetry: () => void;
	}

	let { result, movement, hasNext, onNext, onRetry }: Props = $props();

	const LOSE_COPY: Record<'turtle' | 'arrows', Record<NonNullable<RunResult['reason']>, string>> = {
		turtle: {
			blocked: 'Oops, the monkey bumped into something. Try again!',
			fell: 'Oh no, the monkey fell in a pit! Try jumping over it.',
			'step-limit': 'That program runs forever — check your repeat block.',
			incomplete: "Almost! The monkey didn't reach the goal yet."
		},
		arrows: {
			blocked: 'Oops, the monkey got stuck. Try again!',
			fell: 'Oh no, the monkey fell! Watch out for gaps.',
			'step-limit': 'That program runs forever — check your repeat block.',
			incomplete: "Almost! The monkey didn't finish yet."
		}
	};

	let lastAnnounced: RunResult | undefined;
	$effect(() => {
		if (result === lastAnnounced) return;
		lastAnnounced = result;
		if (result.outcome === 'win') sfx.win();
		else sfx.lose();
	});
</script>

<div class="result-overlay" class:win={result.outcome === 'win'} class:lose={result.outcome === 'lose'}>
	{#if result.outcome === 'win'}
		<p class="message">You did it! {'⭐'.repeat(result.stars)}</p>
		<button class="cta" onclick={onNext}>{hasNext ? 'Next level →' : 'Back to map'}</button>
	{:else}
		<p class="message">{LOSE_COPY[movement][result.reason ?? 'incomplete']}</p>
		<button class="cta" onclick={onRetry}>Try again</button>
	{/if}
</div>

<style>
	.result-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		background: rgba(0, 0, 0, 0.55);
		color: white;
		font-size: 1.25rem;
		text-align: center;
		border-radius: inherit;
		padding: var(--space-4);
	}
	.message {
		margin: 0;
	}
	.cta {
		min-height: 48px;
		padding: 0 var(--space-5);
		border-radius: var(--radius-md);
		border: none;
		background: var(--green-600);
		color: white;
		font-weight: var(--fw-bold);
		cursor: pointer;
	}
</style>
