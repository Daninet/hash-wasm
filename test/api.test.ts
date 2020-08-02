/* eslint-disable no-await-in-loop */
/* global test, expect */
import * as api from '../lib';
import { IHasher } from '../lib/WASMInterface';

test('IHasherApi', async () => {
  const keys = Object.keys(api).filter((key) => key.startsWith('create'));
  expect(keys.length).toBe(15);

  const functions: IHasher[] = await Promise.all(
    keys.map(
      (key) => {
        switch (key) {
          case 'createHMAC':
            return api[key](api.createMD5(), 'x');
          default:
            return api[key]();
        }
      },
    ),
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const fn of functions) {
    expect(fn.blockSize).toBeGreaterThan(0);
    expect(fn.digestSize).toBeGreaterThan(0);

    const startValueHex = fn.digest();
    expect(typeof startValueHex).toBe('string');
    fn.init();
    expect(fn.digest()).toBe(startValueHex);
    fn.init();
    expect(fn.digest('hex')).toBe(startValueHex);

    fn.init();
    const startValueBinary = fn.digest('binary');
    expect(ArrayBuffer.isView(startValueBinary)).toBe(true);
    expect(startValueBinary.BYTES_PER_ELEMENT).toBe(1);
    expect(startValueBinary.length).toBe(startValueHex.length / 2);
    fn.init();
    expect(fn.digest('binary')).toStrictEqual(startValueBinary);

    const arr = new Array(2000).fill(0xFF).map((i) => i % 256);
    const buf = Buffer.from(arr);
    fn.init();
    fn.update(buf);
    const hash = fn.digest();

    let chain = fn.init();
    for (let i = 0; i < 2000; i++) {
      chain = chain.update(new Uint8Array([arr[i]]));
    }
    expect(chain.digest()).toBe(hash);
  }
});
