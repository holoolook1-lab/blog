import { NextResponse } from 'next/server';

export type ApiError = { error: string; detail?: any };

export function ok(payload: any = { ok: true }, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

export function fail(error: string, status = 400, detail?: any) {
  const body: ApiError = { error };
  if (detail !== undefined) body.detail = detail;
  return NextResponse.json(body, { status });
}

export const badRequest = (error = 'bad_request', detail?: any) => fail(error, 400, detail);
export const unauthorized = (detail?: any) => fail('unauthorized', 401, detail);
export const forbidden = (detail?: any) => fail('forbidden', 403, detail);
export const notFound = (detail?: any) => fail('not_found', 404, detail);
export const serverError = (error = 'server_error', detail?: any) => fail(error, 500, detail);

