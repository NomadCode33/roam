//app/api/health/route.js
import { withLogging } from '@/lib/withLogging';

async function handler() {
  return Response.json({ status: 'ok' }, { status: 200 });
}

export const GET = withLogging(handler);