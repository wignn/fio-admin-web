<script lang="ts">
	let {
		values,
		positive = true,
		label
	}: {
		values: number[];
		positive?: boolean;
		label?: string;
	} = $props();

	const width = 220;
	const height = 72;
	const cleanValues = $derived(values.filter((value) => Number.isFinite(value)));
	const min = $derived(Math.min(...cleanValues, 0));
	const max = $derived(Math.max(...cleanValues, 1));
	const range = $derived(Math.max(max - min, 1));
	const points = $derived(
		cleanValues
			.map((value, index) => {
				const x = cleanValues.length <= 1 ? width : (index / (cleanValues.length - 1)) * width;
				const y = height - ((value - min) / range) * (height - 8) - 4;
				return `${x.toFixed(2)},${y.toFixed(2)}`;
			})
			.join(' ')
	);
</script>

<div class="relative overflow-hidden rounded-2xl border border-border bg-surface-2/45 p-3">
	<div class="chart-grid absolute inset-0 opacity-45"></div>
	{#if label}<p class="relative mb-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">{label}</p>{/if}
	<svg viewBox={`0 0 ${width} ${height}`} class="relative h-20 w-full" preserveAspectRatio="none">
		<polyline points={`0,${height - 1} ${width},${height - 1}`} fill="none" stroke="currentColor" stroke-width="1" class="text-border" />
		{#if cleanValues.length > 1}
			<polyline points={points} fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class={positive ? 'text-green' : 'text-red'} />
		{:else}
			<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="fill-current text-xs font-bold text-text-dim">No trend</text>
		{/if}
	</svg>
</div>
