<script lang="ts">
	type Tone = 'blue' | 'green' | 'amber' | 'red' | 'neutral';

	let {
		label,
		value,
		total,
		help,
		tone = 'blue'
	}: {
		label: string;
		value: number;
		total: number;
		help?: string;
		tone?: Tone;
	} = $props();

	const radius = 42;
	const circumference = 2 * Math.PI * radius;
	const ratio = $derived(total > 0 ? Math.max(0, Math.min(1, value / total)) : 0);
	const offset = $derived(circumference * (1 - ratio));
	const percent = $derived(Math.round(ratio * 100));
	const toneClass: Record<Tone, string> = {
		blue: 'text-accent',
		green: 'text-green',
		amber: 'text-amber',
		red: 'text-red',
		neutral: 'text-text-dim'
	};
</script>

<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
	<div class="absolute inset-0 chart-grid opacity-45"></div>
	<div class="relative flex items-center gap-5">
		<div class="relative h-28 w-28 shrink-0">
			<svg viewBox="0 0 112 112" class="h-full w-full -rotate-90">
				<circle cx="56" cy="56" r={radius} fill="none" stroke="currentColor" stroke-width="11" class="text-surface-2" />
				<circle
					cx="56"
					cy="56"
					r={radius}
					fill="none"
					stroke="currentColor"
					stroke-width="11"
					stroke-linecap="round"
					stroke-dasharray={circumference}
					stroke-dashoffset={offset}
					class={toneClass[tone]}
				/>
			</svg>
			<div class="absolute inset-0 flex flex-col items-center justify-center">
				<span class="font-mono text-2xl font-black text-text">{percent}%</span>
				<span class="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-dim">{value}/{total}</span>
			</div>
		</div>
		<div class="min-w-0">
			<p class="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-text-dim">Ratio</p>
			<p class="mt-2 text-lg font-black text-text">{label}</p>
			{#if help}<p class="mt-2 text-sm leading-relaxed text-text-muted">{help}</p>{/if}
		</div>
	</div>
</div>
