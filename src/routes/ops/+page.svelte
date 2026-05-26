<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import {
		Activity,
		AlertTriangle,
		CheckCircle2,
		Clock,
		DatabaseZap,
		RadioTower,
		RefreshCw,
		Rss,
		Server
	} from 'lucide-svelte';
	import {
		fetchCoreHealth,
		fetchFeedSourceStatus,
		fetchMarketDataQuality,
		fetchMarketPrices,
		fetchMarketVolatilitySpikes
	} from '$lib/admin/client';
	import type {
		FeedSourceStatus,
		HealthStatus,
		MarketDataQualityItem,
		MarketPriceSnapshot,
		MarketVolatilitySpike
	} from '$lib/admin/types';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingBlock from '$lib/components/LoadingBlock.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	type FreshnessState = 'live' | 'stale' | 'closed' | 'unknown';

	let coreHealth = $state<HealthStatus | null>(null);
	let feeds = $state<FeedSourceStatus[]>([]);
	let prices = $state<MarketPriceSnapshot[]>([]);
	let quality = $state<MarketDataQualityItem[]>([]);
	let spikes = $state<MarketVolatilitySpike[]>([]);
	let loading = $state(true);
	let error = $state('');
	let lastLoaded = $state<Date | null>(null);

	const feedOk = $derived(feeds.filter((feed) => feed.status === 'ok').length);
	const feedAttention = $derived(
		feeds.filter((feed) => feed.status === 'error' || feed.status === 'blocked').length
	);
	const qualityAttention = $derived(quality.filter((item) => item.status !== 'ok').length);
	const sortedFeeds = $derived(
		[...feeds].sort(
			(a, b) => statusRank(a.status) - statusRank(b.status) || a.name.localeCompare(b.name)
		)
	);
	const sortedPrices = $derived(
		[...prices].sort(
			(a, b) => symbolRank(a.symbol) - symbolRank(b.symbol) || a.symbol.localeCompare(b.symbol)
		)
	);
	const sortedQuality = $derived(
		[...quality].sort(
			(a, b) =>
				qualityRank(a.status) - qualityRank(b.status) ||
				symbolRank(a.symbol) - symbolRank(b.symbol) ||
				a.symbol.localeCompare(b.symbol)
		)
	);
	const sortedSpikes = $derived(
		[...spikes].sort(
			(a, b) =>
				spikeRank(a.severity) - spikeRank(b.severity) || Math.abs(b.move_pct) - Math.abs(a.move_pct)
		)
	);

	const primarySymbols = ['XAUUSD', 'EURUSD', 'USDJPY', 'DXY', 'SPX', 'BTCUSDT', 'ETHUSDT'];

	function statusRank(status: string) {
		if (status === 'blocked') return 0;
		if (status === 'error') return 1;
		if (status === 'pending') return 2;
		return 3;
	}

	function symbolRank(symbol: string) {
		const index = primarySymbols.indexOf(symbol.toUpperCase());
		return index === -1 ? 999 : index;
	}

	function qualityRank(status: string) {
		if (status === 'stale') return 0;
		if (status === 'flat') return 1;
		if (status === 'quiet') return 2;
		if (status === 'unknown') return 3;
		return 4;
	}

	function spikeRank(severity: string) {
		return severity === 'high' ? 0 : 1;
	}

	function toneForStatus(status: string): 'green' | 'amber' | 'red' | 'neutral' {
		if (status === 'ok') return 'green';
		if (status === 'blocked' || status === 'error' || status === 'stale') return 'red';
		if (status === 'pending' || status === 'flat' || status === 'quiet') return 'amber';
		return 'neutral';
	}

	function toneForSpike(severity: string): 'green' | 'amber' | 'red' | 'neutral' {
		return severity === 'high' ? 'red' : 'amber';
	}

	function formatNumber(value: number | null | undefined) {
		if (value == null) return '—';
		return value.toLocaleString(undefined, { maximumFractionDigits: 5 });
	}

	function formatTime(value: string | null | undefined) {
		if (!value) return '—';
		return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(value)
		);
	}

	function formatAge(seconds: number | null | undefined) {
		if (seconds == null) return 'unknown';
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.round(seconds / 60);
		if (minutes < 60) return `${minutes}m`;
		return `${Math.round(minutes / 60)}h`;
	}

	function formatMove(value: number) {
		return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
	}

	function relativeTime(value: string | null | undefined) {
		if (!value) return 'never';
		const diffMs = Date.now() - new Date(value).getTime();
		const absMs = Math.abs(diffMs);
		const minutes = Math.round(absMs / 60_000);
		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ${diffMs >= 0 ? 'ago' : 'from now'}`;
		const hours = Math.round(minutes / 60);
		if (hours < 48) return `${hours}h ${diffMs >= 0 ? 'ago' : 'from now'}`;
		const days = Math.round(hours / 24);
		return `${days}d ${diffMs >= 0 ? 'ago' : 'from now'}`;
	}

	function priceTimestamp(price: MarketPriceSnapshot) {
		if (price.received_at) {
			const parsed = Date.parse(price.received_at);
			if (!Number.isNaN(parsed)) return parsed;
		}
		return 0;
	}

	function freshnessFor(price: MarketPriceSnapshot): {
		state: FreshnessState;
		label: string;
		tone: 'green' | 'amber' | 'red' | 'neutral';
	} {
		if (!price.price || price.price <= 0)
			return { state: 'unknown', label: 'NO DATA', tone: 'neutral' };
		const ts = priceTimestamp(price);
		if (!ts) return { state: 'unknown', label: 'NO DATA', tone: 'neutral' };
		const session = price.session;
		const ageMs = Date.now() - ts;
		const isCrypto = price.symbol.toUpperCase().endsWith('USDT') || price.asset_type === 'crypto';
		const freshMs = isCrypto ? 15 * 60_000 : 5 * 60_000;
		if (session?.is_open && ageMs <= freshMs) return { state: 'live', label: 'LIVE', tone: 'green' };
		if (session && !session.is_open)
			return { state: 'closed', label: session.state === 'break' ? 'BREAK' : 'CLOSED', tone: 'neutral' };
		if (ageMs <= freshMs) return { state: 'live', label: 'LIVE', tone: 'green' };
		return { state: 'stale', label: isCrypto ? 'FEED LAG' : 'STALE', tone: 'amber' };
	}

	async function load() {
		loading = true;
		error = '';
		try {
			const [healthRes, feedRes, priceRes, qualityRes, spikeRes] = await Promise.all([
				fetchCoreHealth(),
				fetchFeedSourceStatus(),
				fetchMarketPrices(),
				fetchMarketDataQuality(),
				fetchMarketVolatilitySpikes('5m')
			]);
			coreHealth = healthRes;
			feeds = feedRes.items;
			prices = priceRes.items;
			quality = qualityRes.items;
			spikes = spikeRes.items;
			lastLoaded = new Date();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load ops dashboard.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void load();
	});
</script>

<div class="animate-fade-in space-y-6">
	<div
		class="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm md:p-8"
	>
		<div class="bg-grid absolute inset-0 opacity-40"></div>
		<div class="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl"></div>
		<div class="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<div
					class="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-bold text-accent"
				>
					<RadioTower class="h-3.5 w-3.5" /> Live operations
				</div>
				<h1 class="mt-4 text-4xl font-black tracking-tight text-text md:text-5xl">
					Operations Center
				</h1>
				<p class="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
					Monitor feed health, core readiness, and live market data freshness from one operational
					console.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				{#if lastLoaded}
					<span
						class="rounded-full border border-border bg-surface/80 px-3 py-2 text-xs font-semibold text-text-muted"
						>Updated {lastLoaded.toLocaleTimeString('id-ID')}</span
					>
				{/if}
				<button
					class="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-glow disabled:opacity-60"
					onclick={load}
					disabled={loading}
				>
					<RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
					{loading ? 'Refreshing...' : 'Refresh ops'}
				</button>
			</div>
		</div>
	</div>

	{#if loading}
		<LoadingBlock />
	{:else if error}
		<EmptyState title="Operations unavailable" description={error} />
	{:else}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<StatCard
				label="Core health"
				value={coreHealth?.status === 'healthy' ? 'Healthy' : 'Attention'}
				help={coreHealth?.latency_ms ? `${coreHealth.latency_ms}ms latency` : 'REST health probe'}
				trend={coreHealth?.status ?? 'unknown'}
				icon={Server}
				tone={coreHealth?.status === 'healthy' ? 'green' : 'red'}
			/>
			<StatCard
				label="Feed health"
				value={`${feedOk}/${feeds.length}`}
				help="RSS sources reporting ok"
				trend={feedAttention > 0 ? `${feedAttention} attention` : 'All clear'}
				icon={Rss}
				tone={feedAttention > 0 ? 'amber' : 'green'}
			/>
			<StatCard
				label="Market quality"
				value={`${quality.length - qualityAttention}/${quality.length}`}
				help="Symbols with healthy tick flow"
				trend={qualityAttention > 0 ? `${qualityAttention} attention` : 'All clear'}
				icon={DatabaseZap}
				tone={qualityAttention > 0 ? 'amber' : 'green'}
			/>
			<StatCard
				label="Volatility spikes"
				value={spikes.length}
				help="5m threshold breaches"
				trend={spikes.length > 0 ? 'Active' : 'None'}
				icon={AlertTriangle}
				tone={spikes.length > 0 ? 'red' : 'green'}
			/>
		</div>

		<div class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
			<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 class="text-xl font-black text-text">Feed Health Center</h2>
						<p class="mt-1 text-sm text-text-muted">
							Runtime RSS source state from the core collector.
						</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<a
							href={resolve('/ops/feeds')}
							class="rounded-xl border border-border px-3 py-2 text-xs font-bold text-text-muted transition hover:bg-surface-2 hover:text-text"
							>Manage sources</a
						>
						<StatusBadge
							tone={feedAttention === 0 ? 'green' : 'amber'}
							label={`${feedOk}/${feeds.length} ok`}
						/>
					</div>
				</div>

				<div class="mt-5 overflow-hidden rounded-2xl border border-border">
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-border text-sm">
							<thead
								class="bg-surface-2/70 text-left text-xs font-bold tracking-wide text-text-dim uppercase"
							>
								<tr>
									<th class="px-4 py-3">Source</th>
									<th class="px-4 py-3">Status</th>
									<th class="px-4 py-3">HTTP</th>
									<th class="px-4 py-3">Success/Error</th>
									<th class="px-4 py-3">Last success</th>
									<th class="px-4 py-3">Next poll</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each sortedFeeds as feed (feed.name)}
									<tr class="bg-surface hover:bg-surface-2/50">
										<td class="px-4 py-3">
											<p class="font-bold text-text">{feed.name}</p>
											<p class="mt-1 text-xs text-text-dim">{feed.category}</p>
										</td>
										<td class="px-4 py-3"
											><StatusBadge tone={toneForStatus(feed.status)} label={feed.status} /></td
										>
										<td class="px-4 py-3 font-mono text-xs text-text-muted"
											>{feed.last_status ?? '—'} · {feed.last_latency_ms
												? `${feed.last_latency_ms}ms`
												: '—'}</td
										>
										<td class="px-4 py-3 font-mono text-xs text-text-muted"
											>{feed.success_count}/{feed.error_count} · 403:{feed.forbidden_count} · parse:{feed.parse_error_count}</td
										>
										<td
											class="px-4 py-3 text-xs text-text-muted"
											title={formatTime(feed.last_success_at)}
											>{relativeTime(feed.last_success_at)}</td
										>
										<td
											class="px-4 py-3 text-xs text-text-muted"
											title={formatTime(feed.blocked_until ?? feed.next_allowed_poll_at)}
											>{feed.blocked_until
												? `blocked ${relativeTime(feed.blocked_until)}`
												: relativeTime(feed.next_allowed_poll_at)}</td
										>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="flex items-start justify-between gap-3">
					<div>
						<h2 class="text-xl font-black text-text">Market Data Monitor</h2>
						<p class="mt-1 text-sm text-text-muted">
							Latest market cache snapshot and freshness classification.
						</p>
					</div>
					<DatabaseZap class="h-5 w-5 text-accent" />
				</div>

				<div class="mt-5 space-y-3">
					{#each sortedPrices as price (price.symbol)}
						{@const freshness = freshnessFor(price)}
						<div class="rounded-2xl border border-border bg-surface-2/45 p-4">
							<div class="flex items-start justify-between gap-3">
								<div>
									<div class="flex items-center gap-2">
										<p class="font-mono text-sm font-black text-text">{price.symbol}</p>
										<StatusBadge tone={freshness.tone} label={freshness.label} />
									</div>
									<p class="mt-1 text-xs tracking-wide text-text-dim uppercase">
										{price.asset_type || 'unknown'} · {price.source || 'market_data'}
									</p>
								</div>
								<p class="font-mono text-base font-black text-text">{formatNumber(price.price)}</p>
							</div>
							<div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
								<span
									><Clock class="mr-1 inline h-3.5 w-3.5" />{relativeTime(price.received_at)}</span
								>
								<span>bid {formatNumber(price.bid)}</span>
								<span>ask {formatNumber(price.ask)}</span>
							</div>
						</div>
					{/each}
					{#if prices.length === 0}
						<div
							class="rounded-2xl border border-border bg-surface-2/50 p-6 text-center text-sm font-semibold text-text-muted"
						>
							No market prices in the current snapshot.
						</div>
					{/if}
				</div>
			</section>
		</div>

		<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<h2 class="text-xl font-black text-text">Market Data Quality</h2>
			<div class="mt-4 rounded-2xl border border-border bg-surface-2/45 p-4">
				<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{#each sortedQuality as item (item.symbol)}
						<div class="rounded-2xl border border-border bg-surface p-4">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="font-mono text-sm font-black text-text">{item.symbol}</p>
									<p class="mt-1 text-xs tracking-wide text-text-dim uppercase">
										{item.asset_type || 'unknown'} · {item.source || 'market_data'}
									</p>
								</div>
								<StatusBadge tone={toneForStatus(item.status)} label={item.status} />
							</div>
							<div class="mt-3 grid grid-cols-2 gap-2 text-xs text-text-muted">
								<span>age <b class="font-mono text-text">{formatAge(item.age_sec)}</b></span>
								<span>ticks 5m <b class="font-mono text-text">{item.ticks_5m}</b></span>
								<span>ticks 1h <b class="font-mono text-text">{item.ticks_1h}</b></span>
								<span>unique <b class="font-mono text-text">{item.unique_prices_1h}</b></span>
							</div>
							<p class="mt-3 font-mono text-sm font-bold text-text">
								{formatNumber(item.latest_price)}
							</p>
						</div>
					{/each}
				</div>
				{#if quality.length === 0}
					<div
						class="rounded-2xl border border-border bg-surface p-6 text-center text-sm font-semibold text-text-muted"
					>
						No market quality rows are available yet.
					</div>
				{/if}
			</div>
		</section>

		<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<h2 class="text-xl font-black text-text">Volatility Spikes</h2>
			<div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{#each sortedSpikes as spike (`${spike.symbol}-${spike.window}`)}
					<div class="rounded-2xl border border-border bg-surface-2/45 p-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="font-mono text-sm font-black text-text">{spike.symbol}</p>
								<p class="mt-1 text-xs tracking-wide text-text-dim uppercase">
									{spike.asset_type || 'unknown'} · {spike.direction}
								</p>
							</div>
							<StatusBadge tone={toneForSpike(spike.severity)} label={spike.severity} />
						</div>
						<p
							class="mt-3 font-mono text-lg font-black {spike.direction === 'up'
								? 'text-green'
								: 'text-red'}"
						>
							{formatMove(spike.move_pct)}
						</p>
						<div class="mt-3 grid grid-cols-2 gap-2 text-xs text-text-muted">
							<span
								>latest <b class="font-mono text-text">{formatNumber(spike.latest_price)}</b></span
							>
							<span
								>baseline <b class="font-mono text-text">{formatNumber(spike.baseline_price)}</b
								></span
							>
							<span>ticks <b class="font-mono text-text">{spike.tick_count}</b></span>
							<span
								>threshold <b class="font-mono text-text">{spike.threshold_pct.toFixed(2)}%</b
								></span
							>
						</div>
						<p class="mt-3 text-xs text-text-muted" title={formatTime(spike.latest_at)}>
							seen {relativeTime(spike.latest_at)}
						</p>
					</div>
				{/each}
				{#if spikes.length === 0}
					<div
						class="rounded-2xl border border-border bg-surface-2/50 p-6 text-center md:col-span-2 xl:col-span-3"
					>
						<CheckCircle2 class="mx-auto h-5 w-5 text-green" />
						<p class="mt-3 text-sm font-bold text-text">No active volatility spikes</p>
						<p class="mt-1 text-xs text-text-muted">
							No symbol is currently breaching the 5-minute movement threshold.
						</p>
					</div>
				{/if}
			</div>
		</section>

		<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<h2 class="text-xl font-black text-text">Operational notes</h2>
			<div class="mt-4 grid gap-3 md:grid-cols-3">
				<div class="rounded-2xl border border-border bg-surface-2/50 p-4">
					<CheckCircle2 class="h-4 w-4 text-green" />
					<p class="mt-3 text-sm font-bold text-text">Read-only v1</p>
					<p class="mt-1 text-xs text-text-muted">
						This dashboard observes core state but does not trigger pipeline actions.
					</p>
				</div>
				<div class="rounded-2xl border border-border bg-surface-2/50 p-4">
					<Activity class="h-4 w-4 text-accent" />
					<p class="mt-3 text-sm font-bold text-text">Client freshness</p>
					<p class="mt-1 text-xs text-text-muted">
						Market labels use the session state returned by the core market API.
					</p>
				</div>
				<div class="rounded-2xl border border-border bg-surface-2/50 p-4">
					<AlertTriangle class="h-4 w-4 text-amber" />
					<p class="mt-3 text-sm font-bold text-text">Feed state resets</p>
					<p class="mt-1 text-xs text-text-muted">
						RSS source counters are runtime memory and reset when core restarts.
					</p>
				</div>
			</div>
		</section>
	{/if}
</div>
