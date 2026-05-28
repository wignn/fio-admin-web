<script lang="ts">
	let {
		label,
		value,
		state = 'live'
	}: {
		label: string;
		value: string;
		state?: 'live' | 'warn' | 'off';
	} = $props();

	const dotClass = {
		live: 'bg-green shadow-green/50',
		warn: 'bg-amber shadow-amber/50',
		off: 'bg-red shadow-red/50'
	};
</script>

<div class="min-w-0 rounded-2xl border border-border bg-surface/70 px-3 py-2 shadow-sm backdrop-blur">
	<div class="flex items-center gap-2">
		<span class="h-2 w-2 shrink-0 rounded-full {dotClass[state]} shadow-[0_0_12px_currentColor]"></span>
		<span class="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-text-dim">{label}</span>
	</div>
	<p class="mt-1 max-w-48 truncate font-mono text-[11px] font-bold text-text-muted" title={value}>{value}</p>
</div>
