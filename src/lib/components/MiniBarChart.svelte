<script lang="ts">
	type Tone = 'blue' | 'green' | 'amber' | 'red' | 'neutral';

	let {
		items,
		maxValue,
		compact = false
	}: {
		items: Array<{ label: string; value: number; detail?: string; tone?: Tone }>;
		maxValue?: number;
		compact?: boolean;
	} = $props();

	const safeItems = $derived(items.filter((item) => Number.isFinite(item.value)));
	const scaleMax = $derived(Math.max(maxValue ?? 0, ...safeItems.map((item) => item.value), 1));
	const toneClass: Record<Tone, string> = {
		blue: 'from-accent to-cyan-300',
		green: 'from-green to-emerald-300',
		amber: 'from-amber to-yellow-200',
		red: 'from-red to-rose-300',
		neutral: 'from-text-dim to-border'
	};
</script>

<div class="space-y-3">
	{#each safeItems as item (item.label)}
		{@const pct = Math.max(3, Math.min(100, (item.value / scaleMax) * 100))}
		<div class="group">
			<div class="mb-1.5 flex items-center justify-between gap-3 text-xs">
				<span class="truncate font-bold text-text-muted">{item.label}</span>
				<span class="shrink-0 font-mono font-black text-text">{item.detail ?? item.value}</span>
			</div>
			<div class="h-{compact ? '2' : '3'} overflow-hidden rounded-full border border-border bg-surface-2 shadow-inner">
				<div
					class="h-full rounded-full bg-gradient-to-r {toneClass[item.tone ?? 'blue']} shadow-[0_0_18px_color-mix(in_srgb,var(--color-accent)_30%,transparent)] transition-all duration-500"
					style={`width: ${pct}%`}
				></div>
			</div>
		</div>
	{/each}
	{#if safeItems.length === 0}
		<div class="rounded-2xl border border-dashed border-border bg-surface-2/40 p-5 text-center text-sm font-semibold text-text-dim">
			No chart data available.
		</div>
	{/if}
</div>
