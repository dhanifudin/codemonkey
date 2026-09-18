<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { ensureSession } from '$lib/supabase/auth';
	import { soundState, toggleMute } from '$lib/sound/mute.svelte';
	import IconButton from '$lib/ui/IconButton.svelte';
	import '$lib/ui/tokens.css';

	let { children } = $props();

	onMount(() => {
		ensureSession();
	});
</script>

<svelte:head>
	<link rel="icon" href={asset('/assets/app-icon.svg')} />
</svelte:head>

{@render children()}

<div class="global-mute">
	<IconButton
		icon={soundState.muted ? '/assets/icon-sound-off.svg' : '/assets/icon-sound-on.svg'}
		label={soundState.muted ? 'Unmute sound' : 'Mute sound'}
		onclick={toggleMute}
		size={40}
	/>
</div>

<style>
	.global-mute {
		position: fixed;
		top: 0.75rem;
		right: 0.75rem;
		z-index: 100;
	}
	:global(body) {
		margin: 0;
		background: linear-gradient(180deg, #f3fbf5 0%, #fdfbf0 100%);
		font-family:
			'Segoe UI',
			system-ui,
			-apple-system,
			sans-serif;
		color: #1f2937;
	}
</style>
