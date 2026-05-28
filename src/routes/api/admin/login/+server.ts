import { json } from '@sveltejs/kit';
import { setAdminSession, verifyServerKey } from '$lib/server/admin-proxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const identity = await verifyServerKey();
	if (!identity) {
		return json({ error: 'Server API key is invalid or not configured.' }, { status: 403 });
	}
	if (identity.role !== 'admin') {
		return json({ error: 'Configured API key does not have admin access.' }, { status: 403 });
	}
	setAdminSession(event);
	return json(identity);
};
