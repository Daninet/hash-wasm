import { keccak, createKeccak } from '../lib';
/* global test, expect */

test('invalid parameters', () => {
  expect(() => keccak('', -1 as any)).toThrow();
  expect(() => keccak('', 'a' as any)).toThrow();
  expect(() => keccak('', 223 as any)).toThrow();
  expect(() => keccak('', 0 as any)).toThrow();
  expect(() => keccak('', null as any)).toThrow();

  expect(() => createKeccak(-1 as any)).toThrow();
  expect(() => createKeccak('a' as any)).toThrow();
  expect(() => createKeccak(223 as any)).toThrow();
  expect(() => createKeccak(0 as any)).toThrow();
  expect(() => createKeccak(null as any)).toThrow();
});

test('default value for create constructor', () => {
  const hash = keccak('a', 512);
  const hasher = createKeccak();
  hasher.init();
  hasher.update('a');
  expect(hasher.digest()).toBe(hash);
});

test('it invalidates the cache when changing parameters', () => {
  expect(keccak('a', 224)).toBe('7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308');
  expect(keccak('a', 256)).toBe('3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb');
  expect(keccak('a', 384)).toBe('85e964c0843a7ee32e6b5889d50e130e6485cffc826a30167d1dc2b3a0cc79cba303501a1eeaba39915f13baab5abacf');
  expect(keccak('a')).toBe('9c46dbec5d03f74352cc4a4da354b4e9796887eeb66ac292617692e765dbe400352559b16229f97b27614b51dbfbbb14613f2c10350435a8feaf53f73ba01c7c');

  let hash = createKeccak(224);
  hash.update('a');
  expect(hash.digest()).toBe('7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308');

  hash = createKeccak(256);
  hash.update('a');
  expect(hash.digest()).toBe('3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb');

  hash = createKeccak(384);
  hash.update('a');
  expect(hash.digest()).toBe('85e964c0843a7ee32e6b5889d50e130e6485cffc826a30167d1dc2b3a0cc79cba303501a1eeaba39915f13baab5abacf');

  hash = createKeccak();
  hash.update('a');
  expect(hash.digest()).toBe('9c46dbec5d03f74352cc4a4da354b4e9796887eeb66ac292617692e765dbe400352559b16229f97b27614b51dbfbbb14613f2c10350435a8feaf53f73ba01c7c');
});
