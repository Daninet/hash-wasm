import { argon2 } from '../lib';
/* global test, expect */

test('argon2d', async () => {
  expect(await argon2({
    password: 'a',
    salt: 'abcdefgh',
    parallelism: 1,
    iterations: 2,
    memorySize: 16,
    hashLength: 16,
    hashType: 'd',
  })).toBe('77ab7ab1e8b3a4c3610327502709b131');

  expect(await argon2({
    password: 'text demo',
    salt: '123456789',
    parallelism: 1,
    iterations: 20,
    memorySize: 32,
    hashLength: 32,
    hashType: 'd',
  })).toBe('499a9487ba62e3a2733b140579499befb00c30a9331145c8324e1a409fed5c3a');
});
