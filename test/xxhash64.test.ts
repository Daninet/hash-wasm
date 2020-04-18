import fs from 'fs';
import { xxhash64 as origXXHash64, createXXHash64 } from '../lib';
import { ITypedArray } from '../lib/WASMInterface';
/* global test, expect */

const xxhash64 = async (
  data: string | Buffer | ITypedArray,
) => origXXHash64(data, 0x76543210, 0xFEDCBA98);

test('simple strings with 0 seed', async () => {
  expect(await origXXHash64('')).toBe('ef46db3751d8e999');
  expect(await origXXHash64('a')).toBe('d24ec4f1a98c6e5b');
  expect(await origXXHash64('a\x00')).toBe('e513e02c99167f96');
  expect(await origXXHash64('1234567890')).toBe('a9d4d4132eff23b6');
});

test('simple strings with FF seed', async () => {
  expect(await origXXHash64('', 0xFF)).toBe('9e62b0f79cb808b1');
  expect(await origXXHash64('a', 0xFF)).toBe('1b75a2c1d7296a6e');
  expect(await origXXHash64('1234567890', 0xFF)).toBe('d5d31d041a37c2dc');
});

test('simple strings with ABCD seed', async () => {
  expect(await origXXHash64('', 0xABCD)).toBe('3d89e126436f8492');
  expect(await origXXHash64('a', 0xABCD)).toBe('a5fc522601032b81');
  expect(await origXXHash64('1234567890', 0xABCD)).toBe('66c87a8ecb91fc42');
});

test('simple strings', async () => {
  expect(await xxhash64('')).toBe('7cc8df76db892f66');
  expect(await xxhash64('a')).toBe('a2edf0ddf102dc7c');
  expect(await xxhash64('1234567890')).toBe('f94181be0bfebdee');
  expect(await xxhash64('a\x00')).toBe('97da859b4235c982');
  expect(await xxhash64('abc')).toBe('cfe5aeff5d700cf0');
  expect(await xxhash64('message digest')).toBe('34e544f931aedad3');
  expect(await xxhash64('abcdefghijklmnopqrstuvwxyz')).toBe('e29687247e1c4485');
  expect(await xxhash64('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')).toBe('049475c1a02b2dab');
  expect(await xxhash64('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe('613eee248f22461c');
});

test('unicode strings', async () => {
  expect(await xxhash64('😊')).toBe('ee8b79a3b4160029');
  expect(await xxhash64('😊a😊')).toBe('4716c8e8fc67d58c');
  const file = fs.readFileSync('./test/utf8.txt');
  expect(await xxhash64(file)).toBe('3c1355b29cf54091');
  expect(await xxhash64(file.toString())).toBe('3c1355b29cf54091');
});

test('Node.js buffers', async () => {
  expect(await xxhash64(Buffer.from([]))).toBe('7cc8df76db892f66');
  expect(await xxhash64(Buffer.from(['a'.charCodeAt(0)]))).toBe('a2edf0ddf102dc7c');
  expect(await xxhash64(Buffer.from([0]))).toBe('8e7bbf7aeeebdf90');
  expect(await xxhash64(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe('6c8a0118af336c0d');
});

test('typed arrays', async () => {
  const arr = [0, 1, 2, 3, 4, 5, 255, 254];
  expect(await xxhash64(Buffer.from(arr))).toBe('d062be285bf8ebbb');
  const uint8 = new Uint8Array(arr);
  expect(await xxhash64(uint8)).toBe('d062be285bf8ebbb');
  expect(await xxhash64(new Uint16Array(uint8.buffer))).toBe('d062be285bf8ebbb');
  expect(await xxhash64(new Uint32Array(uint8.buffer))).toBe('d062be285bf8ebbb');
});

test('long strings', async () => {
  const SIZE = 5 * 1024 * 1024;
  const chunk = '012345678\x09';
  const str = (new Array(Math.floor(SIZE / chunk.length)).fill(chunk)).join('');
  expect(await xxhash64(str)).toBe('c72ccbbddc64d498');
});

test('long buffers', async () => {
  const SIZE = 5 * 1024 * 1024;
  const buf = Buffer.alloc(SIZE);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  expect(await xxhash64(buf)).toBe('165cc69fedee7be9');
});

test('chunked', async () => {
  const hash = await createXXHash64();
  expect(hash.digest()).toBe('ef46db3751d8e999');
  hash.init();
  hash.update('a');
  hash.update(new Uint8Array([0]));
  expect(hash.digest()).toBe('e513e02c99167f96');
});
