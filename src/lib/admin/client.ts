import { goto } from '$app/navigation';
import { CONTROL_PLANE_URL } from '$lib/config';
import { adminSession } from './session.svelte';
import type { AdminIdentity, ApiErrorBody, PlanId } from './types';

export class AdminApiError extends Error {
	constructor(
		message: string,
		public status: number
	) {
		super(message);
		this.name = 'AdminApiError';
	}
}

interface AdminFetchOptions extends RequestInit {
	apiKey?: string;
	skipAuthRedirect?: boolean;
	timeout?: number;
	retries?: number;
}

function urlFor(path: string) {
	return `${CONTROL_PLANE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseError(response: Response) {
	try {
		const body = (await response.json()) as ApiErrorBody;
		return body.error || body.message || `${response.status} ${response.statusText}`;
	} catch {
		return `${response.status} ${response.statusText}`;
	}
}

export async function adminFetch<T>(path: string, options: AdminFetchOptions = {}): Promise<T> {
	const { timeout = 15_000, retries = 1, ...fetchOptions } = options;
	const headers = new Headers(fetchOptions.headers);
	const key = fetchOptions.apiKey ?? adminSession.apiKey;

	if (key) headers.set('X-API-Key', key);
	if (fetchOptions.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

	let response: Response | null = null;
	let lastStatus = 0;
	for (let attempt = 0; attempt <= retries; attempt += 1) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeout);
		try {
			response = await fetch(urlFor(path), {
				...fetchOptions,
				headers,
				signal: controller.signal
			});
			lastStatus = response.status;
			if (![408, 429, 500, 502, 503, 504].includes(response.status) || attempt === retries) break;
		} catch (e) {
			if (attempt === retries) {
				if (e instanceof DOMException && e.name === 'AbortError') {
					throw new AdminApiError('Admin request timed out.', 408);
				}
				throw new AdminApiError('Cannot reach control-plane backend.', 0);
			}
		} finally {
			clearTimeout(timer);
		}
	}

	if (!response) {
		throw new AdminApiError('Cannot reach control-plane backend.', lastStatus);
	}

	adminSession.touch();

	if (response.status === 401 || response.status === 403) {
		if (!fetchOptions.skipAuthRedirect) {
			adminSession.clear(false);
			void goto('/login');
		}
		throw new AdminApiError('Admin key is invalid or not authorized.', response.status);
	}

	if (!response.ok) {
		throw new AdminApiError(await parseError(response), response.status);
	}

	if (response.status === 204) return undefined as T;
	return (await response.json()) as T;
}

export async function verifyAdminKey(key: string) {
	const identity = await adminFetch<AdminIdentity>('/api/v1/auth/me', {
		apiKey: key,
		skipAuthRedirect: true
	});
	if (identity.role !== 'admin') {
		throw new AdminApiError('This key is valid but does not have admin access.', 403);
	}
	return identity;
}

export async function loginAdmin(key: string) {
	const trimmed = key.trim();
	if (!trimmed) throw new AdminApiError('Admin API key is required.', 400);
	const identity = await verifyAdminKey(trimmed);
	adminSession.set(trimmed, identity);
	return identity;
}

export async function verifyStoredSession() {
	adminSession.load();
	if (!adminSession.apiKey) {
		adminSession.setReady(true);
		return false;
	}

	adminSession.setVerifying(true);
	try {
		const identity = await verifyAdminKey(adminSession.apiKey);
		adminSession.setIdentity(identity);
		adminSession.setReady(true);
		return true;
	} catch {
		adminSession.clear(false);
		return false;
	} finally {
		adminSession.setVerifying(false);
	}
}

export function fetchStats() {
	return adminFetch<{ total_users: number; active_users: number; total_api_keys: number; users_by_plan: Record<string, number> }>('/api/v1/admin/stats');
}

export function fetchUsers() {
	return adminFetch<{ users: import('./types').AdminUser[]; total: number }>('/api/v1/admin/users');
}

export function fetchPlans() {
	return adminFetch<{ plans: import('./types').Plan[] }>('/api/v1/plans');
}

export function updateUserPlan(userId: string, plan: PlanId | string) {
	return adminFetch<{ message: string; plan?: string }>(`/api/v1/admin/users/${userId}/plan`, {
		method: 'POST',
		body: JSON.stringify({ plan })
	});
}

export function toggleUser(userId: string) {
	return adminFetch<{ message: string; is_active: boolean }>(`/api/v1/admin/users/${userId}/toggle`, {
		method: 'POST'
	});
}
