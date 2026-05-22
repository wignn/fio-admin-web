<script lang="ts">
	let {
		label,
		value,
		help,
		icon: Icon
	}: {
		label: string;
		value: string | number;
		help?: string;
		icon?: any;
	} = $props();
</script>

<div class="rounded-xl border border-border bg-surface p-5 shadow-sm">
	<div class="flex items-start justify-between gap-4">
		<div>
			<p class="text-sm font-medium text-text-muted">{label}</p>
			<p class="mt-2 text-3xl font-bold tracking-tight text-text">{value}</p>
			{#if help}
				<p class="mt-2 text-xs text-text-dim">{help}</p>
			{/if}
		</div>
		{#if Icon}
			<div class="rounded-lg border border-border bg-surface-2 p-2 text-accent">
				<Icon class="h-5 w-5" />
			</div>
		{/if}
	</div>
</div>
