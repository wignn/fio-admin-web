import { json } from '@sveltejs/kit';
import { setAdminSession, verifyServerKey } from '$lib/server/admin-proxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const body = (await event.request.json().catch(() => ({}))) as { apiKey?: unknown };
	const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
	if (!apiKey) {
		return json({ error: 'Admin API key is required.' }, { status: 400 });
	}

	const identity = await verifyServerKey(apiKey);
	if (!identity) {
		return json({ error: 'Admin API key is invalid or not authorized.' }, { status: 403 });
	}
	if (identity.role !== 'admin') {
		return json({ error: 'This API key does not have admin access.' }, { status: 403 });
	}
	setAdminSession(event, apiKey);
	return json(identity);
};
