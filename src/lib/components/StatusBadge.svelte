<script lang="ts">
	let { tone = 'neutral', label }: { tone?: 'green' | 'red' | 'amber' | 'blue' | 'neutral'; label: string } = $props();

	const classes = {
		green: 'border-green/20 bg-green/10 text-green',
		red: 'border-red/20 bg-red/10 text-red',
		amber: 'border-amber/25 bg-amber/10 text-amber',
		blue: 'border-accent/20 bg-accent/10 text-accent',
		neutral: 'border-border bg-surface-2 text-text-muted'
	};
</script>

<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold {classes[tone]}">
	{label}
</span>
