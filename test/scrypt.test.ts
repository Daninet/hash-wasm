import { scrypt } from '../lib';
/* global test, expect */

const hash = async (
  password, salt, costFactor, blockSizeFactor, parallelizationFactor,
  hashLength, outputType,
) => scrypt({
  password,
  salt,
  costFactor,
  blockSizeFactor,
  parallelizationFactor,
  hashLength,
  outputType,
});

test('scrypt', async () => {
  expect(
    await hash('', '', 2, 1, 1, 16, 'hex'),
  ).toBe('fa76e020d54d9e8aa24023c6baecdd46');

  expect(
    await hash('a', 'abcdefgh', 128, 1, 1, 16, 'hex'),
  ).toBe('7a386084f8c60a04238de836c2d5dff1');

  expect(
    await hash('text demo', '123456789', 8, 17, 15, 32, 'hex'),
  ).toBe('bcae071d6bb1389b462fe3135a0b6bbaf980028d0d035f688ce36a8b0b53c391');

  expect(
    await hash('text demo', '123456789', 2, 1, 32, 32, 'hex'),
  ).toBe('3ab33fa8bdee86ecf66ce568ae19a57ca1339a2a41d92ca244f183b759c57f30');

  expect(
    await hash('abc', '1234567812345678', 4, 3, 177, 4, 'hex'),
  ).toBe('f31520d2');

  expect(
    await hash('abc', '12345678', 64, 27, 67, 17, 'hex'),
  ).toBe('6e018c6f21b5647b3ce0c1c65ea14961f4');
});
