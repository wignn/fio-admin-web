export type PlanId = 'free' | 'starter' | 'pro' | 'enterprise';

export interface AdminUser {
	id: string;
	email: string;
	name: string;
	plan: PlanId | string;
	is_active: boolean;
	email_verified: boolean;
	created_at: string;
	active_keys: number;
}

export interface AdminStats {
	total_users: number;
	active_users: number;
	total_api_keys: number;
	users_by_plan: Record<string, number>;
}

export interface Plan {
	id: PlanId | string;
	name: string;
	price_idr: number;
	requests_per_day: number;
	ws_connections: number;
	x_usernames_max: number;
	tv_symbols_max: number;
	news_history_days: number;
	rate_limit_per_min: number;
	can_scrape: boolean;
	can_custom_rss: boolean;
	is_active: boolean;
	sort_order: number;
}

export interface AdminIdentity {
	id: string;
	role?: string;
	plan?: string;
	user?: {
		id: string;
		email: string;
		name: string;
		plan: string;
	};
}

export interface HealthStatus {
	status: 'healthy' | 'unhealthy';
	service: string;
	latency_ms?: number;
	error?: string;
}

export interface FeedSourceStatus {
	name: string;
	url: string;
	rss_url: string;
	category: string;
	status: 'pending' | 'ok' | 'error' | 'blocked' | string;
	last_success_at: string | null;
	last_error_at: string | null;
	blocked_until: string | null;
	next_allowed_poll_at: string | null;
	consecutive_403: number;
	success_count: number;
	error_count: number;
	forbidden_count: number;
	parse_error_count: number;
	last_status: number | null;
	last_latency_ms: number | null;
}

export interface FeedSourceStatusResponse {
	items: FeedSourceStatus[];
	total: number;
}

export interface MarketPriceSnapshot {
	symbol: string;
	price: number;
	bid: number | null;
	ask: number | null;
	volume: number | null;
	source: string;
	asset_type: string;
	received_at: string | null;
}

export interface MarketPricesResponse {
	items: MarketPriceSnapshot[];
	total: number;
}

export interface MarketDataQualityItem {
	symbol: string;
	asset_type: string;
	latest_price: number;
	source: string;
	received_at: string | null;
	age_sec: number | null;
	ticks_5m: number;
	ticks_1h: number;
	unique_prices_1h: number;
	status: 'ok' | 'flat' | 'stale' | 'quiet' | 'unknown' | string;
}

export interface MarketDataQualityResponse {
	items: MarketDataQualityItem[];
	total: number;
	generated_at: string;
}

export interface MarketVolatilitySpike {
	symbol: string;
	asset_type: string;
	window: string;
	latest_price: number;
	baseline_price: number;
	move_pct: number;
	direction: 'up' | 'down' | string;
	severity: 'medium' | 'high' | string;
	threshold_pct: number;
	tick_count: number;
	latest_at: string;
}

export interface MarketVolatilitySpikesResponse {
	items: MarketVolatilitySpike[];
	total: number;
	window: string;
	generated_at: string;
}

export interface ForexFeedSource {
	id: string;
	name: string;
	slug: string;
	url: string;
	rss_url: string | null;
	category: string;
	poll_interval_sec: number;
	priority: number;
	is_active: boolean;
	last_success_at: string | null;
	last_error_at: string | null;
	blocked_until: string | null;
	success_count: number;
	error_count: number;
	forbidden_count: number;
	parse_error_count: number;
	last_status: number | null;
	last_latency_ms: number | null;
}

export interface FeedSourcePayload {
	name: string;
	url: string;
	rss_url: string;
	category?: string;
	poll_interval_sec?: number;
	priority?: number;
	is_active?: boolean;
}

export interface FeedSourceTestResult {
	ok: boolean;
	entries?: number;
	latency_ms?: number;
	error?: string;
}

export interface ApiErrorBody {
	error?: string;
	message?: string;
}
