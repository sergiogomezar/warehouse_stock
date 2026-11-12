import { Turnover, turnoverSchema } from './turnover.js';

describe('turnoverSchema', () => {
  it.each(['HIGH', 'MEDIUM', 'LOW'])('accepts %s', (value) => {
    expect(turnoverSchema.parse(value)).toBe(value as Turnover);
  });

  it.each(['VERY_HIGH', 'FAST', 'high', '', 1, null])('rejects %j', (value) => {
    expect(turnoverSchema.safeParse(value).success).toBe(false);
  });
});
