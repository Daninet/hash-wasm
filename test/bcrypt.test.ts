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
  expect(
    await hash('a', '1234567890123456', 6, 'encoded'),
  ).toBe('$2a$06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO');

  expect(
    await hash([...new Array(72)].fill('a').join(''), '1234567890123456', 6, 'encoded'),
  ).toBe('$2a$06$KRGxLBS0Lxe3KBCwKxOzLe.4hc7YvwS6eP.S.wxQssxSXlL.HBbCK');
});
