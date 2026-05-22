<script lang="ts">
	let { label = 'Loading data...' }: { label?: string } = $props();
</script>

<div class="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
	<div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent"></div>
	<p class="text-sm font-medium text-text-muted">{label}</p>
</div>
