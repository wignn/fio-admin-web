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

export interface ApiErrorBody {
	error?: string;
	message?: string;
}
