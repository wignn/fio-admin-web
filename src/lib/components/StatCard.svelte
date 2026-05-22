<script lang="ts">
	let {
		label,
		value,
		help,
		trend,
		tone = 'blue',
		icon: Icon
	}: {
		label: string;
		value: string | number;
		help?: string;
		trend?: string;
		tone?: 'blue' | 'green' | 'amber' | 'red' | 'neutral';
		icon?: any;
	} = $props();

	const toneClass = {
		blue: 'from-accent/15 text-accent ring-accent/15',
		green: 'from-green/15 text-green ring-green/15',
		amber: 'from-amber/15 text-amber ring-amber/15',
		red: 'from-red/15 text-red ring-red/15',
		neutral: 'from-text/10 text-text-muted ring-border'
	};
</script>

<div class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-lg hover:shadow-accent/5">
	<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition group-hover:opacity-100"></div>
	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0">
			<p class="text-sm font-semibold text-text-muted">{label}</p>
			<p class="mt-2 truncate text-3xl font-black tracking-tight text-text">{value}</p>
			<div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
				{#if trend}
					<span class="rounded-full border border-border bg-surface-2 px-2 py-1 font-bold text-text">{trend}</span>
				{/if}
				{#if help}
					<span class="text-text-dim">{help}</span>
				{/if}
			</div>
		</div>
		{#if Icon}
			<div class="rounded-xl bg-gradient-to-br {toneClass[tone]} to-transparent p-3 ring-1">
				<Icon class="h-5 w-5" />
			</div>
		{/if}
	</div>
</div>
