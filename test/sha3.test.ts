import { sha3 } from '../lib';
/* global test, expect */

test('invalid parameters', async () => {
  await expect(sha3('', -1 as any)).rejects.toThrow();
  await expect(sha3('', 'a' as any)).rejects.toThrow();
  await expect(sha3('', 223 as any)).rejects.toThrow();
  await expect(sha3('', 0 as any)).rejects.toThrow();
  await expect(sha3('', null as any)).rejects.toThrow();
});
