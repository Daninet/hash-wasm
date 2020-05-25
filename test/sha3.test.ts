import { sha3, createSHA3 } from '../lib';
/* global test, expect */

test('invalid parameters', async () => {
  await expect(sha3('', -1 as any)).rejects.toThrow();
  await expect(sha3('', 'a' as any)).rejects.toThrow();
  await expect(sha3('', 223 as any)).rejects.toThrow();
  await expect(sha3('', 0 as any)).rejects.toThrow();
  await expect(sha3('', null as any)).rejects.toThrow();

  await expect(createSHA3(-1 as any)).rejects.toThrow();
  await expect(createSHA3('a' as any)).rejects.toThrow();
  await expect(createSHA3(223 as any)).rejects.toThrow();
  await expect(createSHA3(0 as any)).rejects.toThrow();
  await expect(createSHA3(null as any)).rejects.toThrow();
});

test('default value for create constructor', async () => {
  const hash = await sha3('a', 512);
  const hasher = await createSHA3();
  hasher.init();
  hasher.update('a');
  expect(hasher.digest()).toBe(hash);
});
