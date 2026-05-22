<script lang="ts">
	let { plan }: { plan: string } = $props();

	const tone = $derived(
		plan === 'enterprise'
			? 'border-text/20 bg-text/10 text-text'
			: plan === 'pro'
				? 'border-accent/20 bg-accent/10 text-accent'
				: plan === 'starter'
					? 'border-green/20 bg-green/10 text-green'
					: 'border-border bg-surface-2 text-text-muted'
	);
</script>

<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize {tone}">
	{plan}
</span>
