// lib/withLogging.js
import { createRequestId, logRequest } from './logger';
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export function withLogging(handler) {
  return async function wrapped(request, ctx) {
    const requestId = createRequestId();
    const start = Date.now();
    const path = new URL(request.url).pathname;
    const method = request.method;

    try {
      const response = await handler(request, ctx);
      const durationMs = Date.now() - start;
      response.headers.set('x-request-id', requestId);
      logRequest({ requestId, method, path, status: response.status, durationMs });
      return response;
    } catch (error) {
      const durationMs = Date.now() - start;
      logRequest({ requestId, method, path, status: 500, durationMs, error });
      Sentry.captureException(error);
      const errResponse = NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 }
      );
      errResponse.headers.set('x-request-id', requestId);
      return errResponse;
    }
  };
}
