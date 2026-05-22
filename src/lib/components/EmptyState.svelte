<script lang="ts">
	let { title, description }: { title: string; description: string } = $props();
</script>

<div class="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
	<h3 class="text-base font-semibold text-text">{title}</h3>
	<p class="mx-auto mt-2 max-w-md text-sm text-text-muted">{description}</p>
</div>
