import { env } from '$env/dynamic/public';

export const CONTROL_PLANE_URL = env.PUBLIC_CONTROL_PLANE_URL || 'http://localhost:8081';
export const CORE_REST_URL = env.PUBLIC_CORE_REST_URL || 'http://localhost:8090';
export const REALTIME_URL = env.PUBLIC_REALTIME_URL || 'ws://localhost:8090/ws';
