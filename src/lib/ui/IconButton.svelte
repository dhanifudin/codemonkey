<script lang="ts">
	import { asset } from '$app/paths';

	interface Props {
		icon: string;
		label: string;
		href?: string;
		onclick?: () => void;
		disabled?: boolean;
		size?: number;
	}

	let { icon, label, href, onclick, disabled = false, size = 44 }: Props = $props();
</script>

{#if href}
	<a class="icon-btn" {href} {onclick} aria-label={label} style="width:{size}px; height:{size}px;">
		<img src={asset(icon)} alt="" />
	</a>
{:else}
	<button class="icon-btn" aria-label={label} {disabled} {onclick} style="width:{size}px; height:{size}px;">
		<img src={asset(icon)} alt="" />
	</button>
{/if}

<style>
	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: 50%;
		background: #ffffff;
		border: 2px solid var(--green-900);
		cursor: pointer;
		text-decoration: none;
		padding: 0;
	}
	.icon-btn img {
		width: 55%;
		height: 55%;
	}
	.icon-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
