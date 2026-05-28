import { env } from '$env/dynamic/private';
import { json, type RequestEvent } from '@sveltejs/kit';
import { CONTROL_PLANE_URL, CORE_REST_URL } from '$lib/config';

const SESSION_COOKIE = 'atlsd_admin_session';
const KEY_COOKIE = 'atlsd_admin_key';
const SESSION_VALUE = 'admin';

function apiKey(event?: RequestEvent) {
	return event?.cookies.get(KEY_COOKIE) || env.API_KEY || env.ADMIN_API_KEY || '';
}

function joinUrl(base: string, path: string) {
	return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function responseHeaders(response: Response) {
	const headers = new Headers(response.headers);
	for (const name of [
		'content-encoding',
		'content-length',
		'transfer-encoding',
		'connection',
		'keep-alive',
		'proxy-authenticate',
		'proxy-authorization',
		'te',
		'trailer',
		'upgrade'
	]) {
		headers.delete(name);
	}
	return headers;
}

export function hasAdminSession(event: RequestEvent) {
	return event.cookies.get(SESSION_COOKIE) === SESSION_VALUE;
}

function cookieOptions(event: RequestEvent) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'strict' as const,
		secure: event.url.protocol === 'https:',
		maxAge: 60 * 60 * 8
	};
}

export function setAdminSession(event: RequestEvent, key: string) {
	event.cookies.set(SESSION_COOKIE, SESSION_VALUE, cookieOptions(event));
	event.cookies.set(KEY_COOKIE, key, cookieOptions(event));
}

export function clearAdminSession(event: RequestEvent) {
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
	event.cookies.delete(KEY_COOKIE, { path: '/' });
}

export async function proxyBackend(event: RequestEvent, target: 'control' | 'core', path: string) {
	if (!hasAdminSession(event)) {
		return json({ error: 'Admin session required' }, { status: 401 });
	}

	const key = apiKey(event);
	if (!key) {
		return json({ error: 'Admin API key is not configured for this session' }, { status: 401 });
	}

	const url = new URL(joinUrl(target === 'control' ? CONTROL_PLANE_URL : CORE_REST_URL, path));
	url.search = event.url.search;

	const headers = new Headers(event.request.headers);
	headers.set('X-API-Key', key);
	headers.set('Accept-Encoding', 'identity');
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
		headers: responseHeaders(response)
	});
}

export async function verifyServerKey(key: string) {
	if (!key) return null;
	const response = await fetch(joinUrl(CONTROL_PLANE_URL, '/api/v1/auth/me'), {
		headers: { 'X-API-Key': key }
	});
	if (!response.ok) return null;
	return response.json();
}

export async function verifySessionKey(event: RequestEvent) {
	return verifyServerKey(apiKey(event));
}
