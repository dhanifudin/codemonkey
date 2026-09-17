<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { ensureSession } from '$lib/supabase/auth';

	let { children } = $props();

	onMount(() => {
		ensureSession();
	});
</script>

<svelte:head>
	<link rel="icon" href={asset('/assets/app-icon.svg')} />
</svelte:head>

{@render children()}

<style>
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
