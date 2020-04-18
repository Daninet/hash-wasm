import { keccak } from '../lib';
/* global test, expect */

test('invalid parameters', async () => {
  await expect(keccak('', -1 as any)).rejects.toThrow();
  await expect(keccak('', 'a' as any)).rejects.toThrow();
  await expect(keccak('', 223 as any)).rejects.toThrow();
  await expect(keccak('', 0 as any)).rejects.toThrow();
  await expect(keccak('', null as any)).rejects.toThrow();
});
