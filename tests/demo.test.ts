import assert from 'node:assert/strict';
import test from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import { PUBLIC_DEMO_BLOCKED_PATHS, isPublicDemo, publicDemoGuard } from '../server/demo.ts';

function run(method: string) {
  let nextCalled = false;
  let status = 200;
  let body: unknown;
  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  } as unknown as Response;
  publicDemoGuard({ method } as Request, res, (() => {
    nextCalled = true;
  }) as NextFunction);
  return { nextCalled, status, body };
}

test('public demo mode needs both CLOUD_MODE and PUBLIC_DEMO', () => {
  assert.equal(isPublicDemo({ CLOUD_MODE: 'true', PUBLIC_DEMO: 'true' }), true);
  assert.equal(isPublicDemo({ CLOUD_MODE: 'true' }), false);
  assert.equal(isPublicDemo({ PUBLIC_DEMO: 'true' }), false);
  assert.equal(isPublicDemo({}), false);
});

test('public demo guard lets read-only requests through', () => {
  for (const method of ['GET', 'HEAD']) {
    const result = run(method);
    assert.equal(result.nextCalled, true);
    assert.equal(result.status, 200);
  }
});

test('public demo guard blocks every side-effecting request', () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const result = run(method);
    assert.equal(result.nextCalled, false);
    assert.equal(result.status, 403);
    assert.match(String((result.body as { error: string }).error), /public demo/);
  }
});

test('calls, secrets and messaging integrations are all protected', () => {
  for (const path of ['/api/calls', '/api/secrets', '/api/telegram', '/api/omni']) {
    assert.ok(
      PUBLIC_DEMO_BLOCKED_PATHS.includes(path as (typeof PUBLIC_DEMO_BLOCKED_PATHS)[number]),
    );
  }
});
