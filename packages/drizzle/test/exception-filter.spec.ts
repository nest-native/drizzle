import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { DrizzleExceptionFilter } from '../errors/drizzle-exception.filter';

// The filter's whole contract is: claim constraint violations, delegate
// everything else untouched. Both halves run through BaseExceptionFilter, so
// the assertions are about WHAT is handed to it, captured with a stub adapter.
function harness() {
  const replies: { body: unknown; status: number }[] = [];
  const adapter = {
    reply: (_res: unknown, body: unknown, status: number) => {
      replies.push({ body, status });
    },
    end: () => undefined,
    status: () => undefined,
    isHeadersSent: () => false,
    getRequestMethod: () => 'POST',
    getRequestUrl: () => '/members',
  };
  const response = {};
  const request = { url: '/members', method: 'POST' };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
    // BaseExceptionFilter reaches for the raw args, not just switchToHttp.
    getArgByIndex: (index: number) => (index === 0 ? request : response),
    getArgs: () => [request, response],
    getType: () => 'http',
  } as unknown as ArgumentsHost;
  return { adapter, host, replies };
}

describe('DrizzleExceptionFilter', () => {
  it('turns a unique violation into 409 without the caller writing try/catch', () => {
    const { adapter, host, replies } = harness();
    const filter = new DrizzleExceptionFilter(adapter as never);

    filter.catch(
      { message: 'Failed query', cause: { code: '23505', table: 'members' } },
      host,
    );

    assert.equal(replies.length, 1);
    assert.equal(replies[0].status, 409);
  });

  it('honours a custom message', () => {
    const { adapter, host, replies } = harness();
    const filter = new DrizzleExceptionFilter(adapter as never, {
      uniqueMessage: 'That email is taken.',
    });

    filter.catch({ code: '23505' }, host);

    assert.equal(replies[0].status, 409);
    assert.match(JSON.stringify(replies[0].body), /That email is taken\./);
  });

  it('maps the other constraint families to 400', () => {
    for (const code of ['23503', '23502', '23514']) {
      const { adapter, host, replies } = harness();
      new DrizzleExceptionFilter(adapter as never).catch({ code }, host);
      assert.equal(replies[0].status, 400, `code ${code}`);
    }
  });

  it('delegates non-database errors unchanged, so installing it is safe', () => {
    const { adapter, host, replies } = harness();
    const filter = new DrizzleExceptionFilter(adapter as never);

    // An HttpException Nest already knows how to render.
    filter.catch(new ConflictException('hand-thrown'), host);
    assert.equal(replies[0].status, 409);
    assert.match(JSON.stringify(replies[0].body), /hand-thrown/);

    // And something entirely unrelated still becomes a 500.
    const second = harness();
    new DrizzleExceptionFilter(second.adapter as never).catch(
      new Error('kaboom'),
      second.host,
    );
    assert.equal(second.replies[0].status, 500);
  });

  it('constructs without an adapter (the @UseFilters form)', () => {
    assert.doesNotThrow(() => new DrizzleExceptionFilter());
  });
});
