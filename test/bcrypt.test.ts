import { bcrypt } from '../lib';
/* global test, expect */

const hash = async (
  password, salt, costFactor, outputType,
) => bcrypt({
  password,
  salt,
  costFactor,
  version: '2a',
  outputType,
});

test('bcrypt', async () => {
  // expect(
  //   await hash('a', '1234567890123456', 6, 'hex'),
  // ).toBe('fa76e020d54d9e8aa24023c6baecdd46');

  expect(
    await hash([...new Array(72)].fill('a').join(''), '1234567890123456', 6, 'hex'),
  ).toBe('fa76e020d54d9e8aa24023c6baecdd46');
});
