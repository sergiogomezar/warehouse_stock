import { validate } from './env.js';

describe('validate (env)', () => {
  it('accepts a postgres DATABASE_URL and defaults PORT', () => {
    const env = validate({
      DATABASE_URL: 'postgres://u:p@localhost:5432/db',
    });
    expect(env).toEqual({
      DATABASE_URL: 'postgres://u:p@localhost:5432/db',
      PORT: 3000,
    });
  });

  it('fails with a message naming DATABASE_URL when it is missing', () => {
    expect(() => validate({})).toThrow(/DATABASE_URL/);
  });

  it('rejects a non-postgres URL', () => {
    expect(() => validate({ DATABASE_URL: 'mysql://localhost/db' })).toThrow(
      /DATABASE_URL/,
    );
  });
});
