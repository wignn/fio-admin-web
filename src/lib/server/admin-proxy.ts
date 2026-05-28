import { env } from '$env/dynamic/private';
import { json, type RequestEvent } from '@sveltejs/kit';
import { CONTROL_PLANE_URL, CORE_REST_URL } from '$lib/config';

const SESSION_COOKIE = 'atlsd_admin_session';
const SESSION_VALUE = 'admin';

function apiKey() {
	return env.API_KEY || env.ADMIN_API_KEY || '';
}

function joinUrl(base: string, path: string) {
	return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function hasAdminSession(event: RequestEvent) {
	return event.cookies.get(SESSION_COOKIE) === SESSION_VALUE;
}

export function setAdminSession(event: RequestEvent) {
	event.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: event.url.protocol === 'https:',
		maxAge: 60 * 60 * 8
	});
}

export function clearAdminSession(event: RequestEvent) {
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function proxyBackend(event: RequestEvent, target: 'control' | 'core', path: string) {
	if (!hasAdminSession(event)) {
		return json({ error: 'Admin session required' }, { status: 401 });
	}

	const key = apiKey();
	if (!key) {
		return json({ error: 'Server API key is not configured' }, { status: 500 });
	}

	const url = new URL(joinUrl(target === 'control' ? CONTROL_PLANE_URL : CORE_REST_URL, path));
	url.search = event.url.search;

	const headers = new Headers(event.request.headers);
	headers.set('X-API-Key', key);
	headers.delete('host');
	headers.delete('cookie');

	const response = await fetch(url, {
		method: event.request.method,
		headers,
		body: event.request.method === 'GET' || event.request.method === 'HEAD' ? undefined : event.request.body,
		duplex: 'half'
	} as RequestInit & { duplex: 'half' });

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
}

export async function verifyServerKey() {
	const key = apiKey();
	if (!key) return null;
	const response = await fetch(joinUrl(CONTROL_PLANE_URL, '/api/v1/auth/me'), {
		headers: { 'X-API-Key': key }
	});
	if (!response.ok) return null;
	return response.json();
}
