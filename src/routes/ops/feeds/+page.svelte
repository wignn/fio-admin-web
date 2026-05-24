<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft, CheckCircle2, FlaskConical, Pencil, Plus, Power, RefreshCw, Rss, Save, X } from 'lucide-svelte';
	import { createForexFeedSource, fetchForexFeedSources, testForexFeedSource, toggleForexFeedSource, updateForexFeedSource } from '$lib/admin/client';
	import type { FeedSourcePayload, FeedSourceTestResult, ForexFeedSource } from '$lib/admin/types';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingBlock from '$lib/components/LoadingBlock.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let sources = $state<ForexFeedSource[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let testing = $state(false);
	let error = $state('');
	let query = $state('');
	let editingId = $state<string | null>(null);
	let testResult = $state<FeedSourceTestResult | null>(null);
	let form = $state<FeedSourcePayload>(emptyForm());

	const activeSources = $derived(sources.filter((source) => source.is_active).length);
	const failingSources = $derived(sources.filter((source) => source.last_error_at && (!source.last_success_at || new Date(source.last_error_at) > new Date(source.last_success_at))).length);
	const centralBanks = $derived(sources.filter((source) => source.category === 'central_bank').length);
	const filteredSources = $derived(
		sources.filter((source) => {
			const haystack = `${source.name} ${source.category} ${source.url} ${source.rss_url ?? ''}`.toLowerCase();
			return haystack.includes(query.trim().toLowerCase());
		})
	);

	function emptyForm(): FeedSourcePayload {
		return {
			name: '',
			url: '',
			rss_url: '',
			category: 'forex',
			poll_interval_sec: 45,
			priority: 100,
			is_active: true
		};
	}

	function relativeTime(value: string | null | undefined) {
		if (!value) return 'never';
		const diffMs = Date.now() - new Date(value).getTime();
		const minutes = Math.round(Math.abs(diffMs) / 60_000);
		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.round(minutes / 60);
		if (hours < 48) return `${hours}h ago`;
		return `${Math.round(hours / 24)}d ago`;
	}

	function sourceStatus(source: ForexFeedSource): { label: string; tone: 'green' | 'amber' | 'red' | 'neutral' } {
		if (!source.is_active) return { label: 'disabled', tone: 'neutral' };
		if (source.blocked_until && new Date(source.blocked_until) > new Date()) return { label: 'blocked', tone: 'red' };
		if (source.last_error_at && (!source.last_success_at || new Date(source.last_error_at) > new Date(source.last_success_at))) return { label: 'error', tone: 'red' };
		if (source.last_success_at) return { label: 'ok', tone: 'green' };
		return { label: 'pending', tone: 'amber' };
	}

	function editSource(source: ForexFeedSource) {
		editingId = source.id;
		testResult = null;
		form = {
			name: source.name,
			url: source.url,
			rss_url: source.rss_url ?? '',
			category: source.category,
			poll_interval_sec: source.poll_interval_sec,
			priority: source.priority,
			is_active: source.is_active
		};
	}

	function resetForm() {
		editingId = null;
		testResult = null;
		form = emptyForm();
	}

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await fetchForexFeedSources();
			sources = res.items;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load feed sources.';
		} finally {
			loading = false;
		}
	}

	async function save() {
		saving = true;
		error = '';
		try {
			const result = editingId ? await updateForexFeedSource(editingId, form) : await createForexFeedSource(form);
			if (result.error) throw new Error(result.error);
			resetForm();
			await load();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save source.';
		} finally {
			saving = false;
		}
	}

	async function toggle(source: ForexFeedSource) {
		saving = true;
		error = '';
		try {
			const result = await toggleForexFeedSource(source.id);
			if (result.error) throw new Error(result.error);
			await load();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to toggle source.';
		} finally {
			saving = false;
		}
	}

	async function testCurrentSource() {
		testing = true;
		testResult = null;
		try {
			testResult = await testForexFeedSource(form);
		} catch (e) {
			testResult = { ok: false, error: e instanceof Error ? e.message : 'Test failed' };
		} finally {
			testing = false;
		}
	}

	onMount(() => {
		void load();
	});
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm md:flex-row md:items-end md:justify-between md:p-8">
		<div>
			<a href="/ops" class="inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent-glow"><ArrowLeft class="h-4 w-4" /> Back to Ops</a>
			<h1 class="mt-4 text-4xl font-black tracking-tight text-text md:text-5xl">Feed Sources</h1>
			<p class="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">Manage RSS sources used by the forex news pipeline without editing code or redeploying.</p>
		</div>
		<button class="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-glow disabled:opacity-60" onclick={load} disabled={loading}>
			<RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" /> Refresh
		</button>
	</div>

	{#if loading}
		<LoadingBlock />
	{:else if error}
		<EmptyState title="Feed sources unavailable" description={error} />
	{:else}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<StatCard label="Total sources" value={sources.length} help="Managed RSS records" icon={Rss} />
			<StatCard label="Active sources" value={activeSources} help="Used by the pipeline" icon={Power} tone="green" />
			<StatCard label="Attention" value={failingSources} help="Latest error newer than success" icon={FlaskConical} tone={failingSources > 0 ? 'red' : 'green'} />
			<StatCard label="Central banks" value={centralBanks} help="Official monetary-policy feeds" icon={CheckCircle2} tone="amber" />
		</div>

		<div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
			<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="flex items-center justify-between gap-3">
					<div>
						<h2 class="text-xl font-black text-text">{editingId ? 'Edit source' : 'Add source'}</h2>
						<p class="mt-1 text-sm text-text-muted">Test a feed before saving it to the pipeline.</p>
					</div>
					{#if editingId}<button class="rounded-xl border border-border px-3 py-2 text-sm font-bold text-text-muted hover:bg-surface-2" onclick={resetForm}><X class="h-4 w-4" /></button>{/if}
				</div>

				<div class="mt-5 space-y-4">
					<label class="block text-sm font-bold text-text">Name<input bind:value={form.name} class="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent" placeholder="Example: Bank of Japan" /></label>
					<label class="block text-sm font-bold text-text">Website URL<input bind:value={form.url} class="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent" placeholder="https://example.com" /></label>
					<label class="block text-sm font-bold text-text">RSS URL<input bind:value={form.rss_url} class="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent" placeholder="https://example.com/feed.xml" /></label>
					<div class="grid gap-3 sm:grid-cols-3">
						<label class="block text-sm font-bold text-text">Category<select bind:value={form.category} class="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-3 py-3 text-sm outline-none focus:border-accent"><option value="forex">forex</option><option value="economic">economic</option><option value="macro">macro</option><option value="central_bank">central_bank</option></select></label>
						<label class="block text-sm font-bold text-text">Poll sec<input bind:value={form.poll_interval_sec} type="number" min="15" class="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-3 py-3 text-sm outline-none focus:border-accent" /></label>
						<label class="block text-sm font-bold text-text">Priority<input bind:value={form.priority} type="number" class="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-3 py-3 text-sm outline-none focus:border-accent" /></label>
					</div>
					<label class="flex items-center gap-2 text-sm font-bold text-text"><input bind:checked={form.is_active} type="checkbox" class="h-4 w-4" /> Active</label>
					<div class="flex flex-wrap gap-2">
						<button class="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-bold text-text-muted hover:bg-surface-2 disabled:opacity-60" onclick={testCurrentSource} disabled={testing}><FlaskConical class="h-4 w-4" /> {testing ? 'Testing...' : 'Test feed'}</button>
						<button class="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60" onclick={save} disabled={saving}><Save class="h-4 w-4" /> {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create source'}</button>
					</div>
					{#if testResult}
						<div class="rounded-2xl border {testResult.ok ? 'border-green/20 bg-green/10 text-green' : 'border-red/20 bg-red/10 text-red'} p-4 text-sm font-bold">
							{testResult.ok ? `Feed OK · ${testResult.entries ?? 0} entries · ${testResult.latency_ms ?? 0}ms` : testResult.error ?? 'Feed test failed'}
						</div>
					{/if}
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 class="text-xl font-black text-text">Managed sources</h2>
						<p class="mt-1 text-sm text-text-muted">Enable, disable, and tune feed polling.</p>
					</div>
					<input bind:value={query} class="rounded-2xl border border-border bg-surface-2 px-4 py-2 text-sm outline-none focus:border-accent" placeholder="Search sources" />
				</div>

				<div class="mt-5 space-y-3">
					{#each filteredSources as source}
						{@const status = sourceStatus(source)}
						<div class="rounded-2xl border border-border bg-surface-2/45 p-4">
							<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
								<div class="min-w-0">
									<div class="flex flex-wrap items-center gap-2"><p class="font-bold text-text">{source.name}</p><StatusBadge tone={status.tone} label={status.label} /><StatusBadge tone={source.is_active ? 'green' : 'neutral'} label={source.is_active ? 'active' : 'disabled'} /></div>
									<p class="mt-1 truncate text-xs text-text-muted">{source.rss_url}</p>
									<p class="mt-2 text-xs text-text-dim">{source.category} · poll {source.poll_interval_sec}s · priority {source.priority}</p>
								</div>
								<div class="flex shrink-0 gap-2">
									<button class="rounded-xl border border-border px-3 py-2 text-text-muted hover:bg-surface" onclick={() => editSource(source)}><Pencil class="h-4 w-4" /></button>
									<button class="rounded-xl border border-border px-3 py-2 text-text-muted hover:bg-surface" onclick={() => toggle(source)} disabled={saving}><Power class="h-4 w-4" /></button>
								</div>
							</div>
							<div class="mt-3 flex flex-wrap gap-3 text-xs text-text-muted">
								<span>HTTP {source.last_status ?? '—'} · {source.last_latency_ms ? `${source.last_latency_ms}ms` : '—'}</span>
								<span>success/error {source.success_count}/{source.error_count}</span>
								<span>403 {source.forbidden_count}</span>
								<span>parse {source.parse_error_count}</span>
								<span>last success {relativeTime(source.last_success_at)}</span>
							</div>
						</div>
					{/each}
					{#if filteredSources.length === 0}
						<div class="rounded-2xl border border-border bg-surface-2/50 p-6 text-center text-sm font-semibold text-text-muted">No feed sources match your search.</div>
					{/if}
				</div>
			</section>
		</div>
	{/if}
</div>
