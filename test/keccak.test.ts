import { keccak, createKeccak } from '../lib';
/* global test, expect */

test('invalid parameters', async () => {
  await expect(keccak('', -1 as any)).rejects.toThrow();
  await expect(keccak('', 'a' as any)).rejects.toThrow();
  await expect(keccak('', 223 as any)).rejects.toThrow();
  await expect(keccak('', 0 as any)).rejects.toThrow();
  await expect(keccak('', null as any)).rejects.toThrow();

  await expect(createKeccak(-1 as any)).rejects.toThrow();
  await expect(createKeccak('a' as any)).rejects.toThrow();
  await expect(createKeccak(223 as any)).rejects.toThrow();
  await expect(createKeccak(0 as any)).rejects.toThrow();
  await expect(createKeccak(null as any)).rejects.toThrow();
});

test('default value for create constructor', async () => {
  const hash = await keccak('a', 512);
  const hasher = await createKeccak();
  hasher.init();
  hasher.update('a');
  expect(hasher.digest()).toBe(hash);
});
