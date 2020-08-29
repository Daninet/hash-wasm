import fs from 'fs';
import { xxhash64 as origXXHash64, createXXHash64 } from '../lib';
import { IDataType } from '../lib/util';
/* global test, expect */

const xxhash64 = (data: IDataType) => origXXHash64(data, 0x76543210, 0xFEDCBA98);

test('simple strings with 0 seed', () => {
  expect(origXXHash64('')).toBe('ef46db3751d8e999');
  expect(origXXHash64('a')).toBe('d24ec4f1a98c6e5b');
  expect(origXXHash64('a\x00')).toBe('e513e02c99167f96');
  expect(origXXHash64('abc')).toBe('44bc2cf5ad770999');
  expect(origXXHash64('1234567890')).toBe('a9d4d4132eff23b6');
});

test('simple strings with FF seed', () => {
  expect(origXXHash64('', 0xFF)).toBe('9e62b0f79cb808b1');
  expect(origXXHash64('a', 0xFF)).toBe('1b75a2c1d7296a6e');
  expect(origXXHash64('1234567890', 0xFF)).toBe('d5d31d041a37c2dc');
});

test('simple strings with ABCD seed', () => {
  expect(origXXHash64('', 0xABCD)).toBe('3d89e126436f8492');
  expect(origXXHash64('a', 0xABCD)).toBe('a5fc522601032b81');
  expect(origXXHash64('1234567890', 0xABCD)).toBe('66c87a8ecb91fc42');
});

test('simple strings', () => {
  expect(xxhash64('')).toBe('7cc8df76db892f66');
  expect(xxhash64('a')).toBe('a2edf0ddf102dc7c');
  expect(xxhash64('1234567890')).toBe('f94181be0bfebdee');
  expect(xxhash64('a\x00')).toBe('97da859b4235c982');
  expect(xxhash64('abc')).toBe('cfe5aeff5d700cf0');
  expect(xxhash64('message digest')).toBe('34e544f931aedad3');
  expect(xxhash64('abcdefghijklmnopqrstuvwxyz')).toBe('e29687247e1c4485');
  expect(xxhash64('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')).toBe('049475c1a02b2dab');
  expect(xxhash64('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe('613eee248f22461c');
});

test('unicode strings', () => {
  expect(xxhash64('😊')).toBe('ee8b79a3b4160029');
  expect(xxhash64('😊a😊')).toBe('4716c8e8fc67d58c');
  const file = fs.readFileSync('./test/utf8.txt');
  expect(xxhash64(file)).toBe('3c1355b29cf54091');
  expect(xxhash64(file.toString())).toBe('3c1355b29cf54091');
});

test('Node.js buffers', () => {
  expect(xxhash64(Buffer.from([]))).toBe('7cc8df76db892f66');
  expect(xxhash64(Buffer.from(['a'.charCodeAt(0)]))).toBe('a2edf0ddf102dc7c');
  expect(xxhash64(Buffer.from([0]))).toBe('8e7bbf7aeeebdf90');
  expect(xxhash64(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe('6c8a0118af336c0d');
});

test('typed arrays', () => {
  const arr = [0, 1, 2, 3, 4, 5, 255, 254];
  expect(xxhash64(Buffer.from(arr))).toBe('d062be285bf8ebbb');
  const uint8 = new Uint8Array(arr);
  expect(xxhash64(uint8)).toBe('d062be285bf8ebbb');
  expect(xxhash64(new Uint16Array(uint8.buffer))).toBe('d062be285bf8ebbb');
  expect(xxhash64(new Uint32Array(uint8.buffer))).toBe('d062be285bf8ebbb');
});

test('long strings', () => {
  const SIZE = 5 * 1024 * 1024;
  const chunk = '012345678\x09';
  const str = (new Array(Math.floor(SIZE / chunk.length)).fill(chunk)).join('');
  expect(xxhash64(str)).toBe('c72ccbbddc64d498');
});

test('long buffers', () => {
  const SIZE = 5 * 1024 * 1024;
  const buf = Buffer.alloc(SIZE);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  expect(xxhash64(buf)).toBe('165cc69fedee7be9');
});

test('chunked', () => {
  const hash = createXXHash64();
  expect(hash.digest()).toBe('ef46db3751d8e999');
  hash.init();
  hash.update('a');
  hash.update(new Uint8Array([0]));
  hash.update('bc');
  hash.update(new Uint8Array([255, 254]));
  expect(hash.digest()).toBe('5617d4a984e0578d');

  hash.init();
  for (let i = 0; i < 1000; i++) {
    // eslint-disable-next-line no-bitwise
    hash.update(new Uint8Array([i & 0xFF]));
  }
  hash.update(Buffer.alloc(1000).fill(0xDF));
  expect(hash.digest()).toBe('19a8929a29c34fe8');
});

test('interlaced shorthand', async () => {
  const [hashA, hashB] = await Promise.all([
    origXXHash64('a'),
    origXXHash64('abc'),
  ]);
  expect(hashA).toBe('d24ec4f1a98c6e5b');
  expect(hashB).toBe('44bc2cf5ad770999');
});

test('interlaced create', () => {
  const hashA = createXXHash64();
  hashA.update('a');
  const hashB = createXXHash64();
  hashB.update('abc');
  expect(hashA.digest()).toBe('d24ec4f1a98c6e5b');
  expect(hashB.digest()).toBe('44bc2cf5ad770999');
});

test('invalid parameters', () => {
  expect(() => origXXHash64('', -1)).toThrow();
  expect(() => origXXHash64('', 'a' as any)).toThrow();
  expect(() => origXXHash64('', 0xFFFFFFFF + 1)).toThrow();
  expect(() => origXXHash64('', 0.1)).toThrow();
  expect(() => origXXHash64('', Number.NaN)).toThrow();

  expect(() => origXXHash64('', 0, -1)).toThrow();
  expect(() => origXXHash64('', 0, 'a' as any)).toThrow();
  expect(() => origXXHash64('', 0, 0xFFFFFFFF + 1)).toThrow();
  expect(() => origXXHash64('', 0, 0.1)).toThrow();
  expect(() => origXXHash64('', 0, Number.NaN)).toThrow();

  expect(() => createXXHash64(-1 as any)).toThrow();
  expect(() => createXXHash64('a' as any)).toThrow();
  expect(() => createXXHash64(0xFFFFFFFF + 1 as any)).toThrow();
  expect(() => createXXHash64(0.1 as any)).toThrow();
  expect(() => createXXHash64(Number.NaN as any)).toThrow();

  expect(() => createXXHash64(0, -1 as any)).toThrow();
  expect(() => createXXHash64(0, 'a' as any)).toThrow();
  expect(() => createXXHash64(0, 0xFFFFFFFF + 1 as any)).toThrow();
  expect(() => createXXHash64(0, 0.1 as any)).toThrow();
  expect(() => createXXHash64(0, Number.NaN as any)).toThrow();
});

test('Invalid inputs throw', () => {
  const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
  const hash = createXXHash64();

  invalidInputs.forEach((input: any) => {
    expect(() => origXXHash64(input)).toThrow();
    expect(() => hash.update(input)).toThrow();
  });
});
