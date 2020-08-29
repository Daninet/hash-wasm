import fs from 'fs';
import { xxhash32 as origXXHash32, createXXHash32 } from '../lib';
import { IDataType } from '../lib/util';
/* global test, expect */

const xxhash32 = (data: IDataType) => origXXHash32(data, 0x6789ABCD);

test('simple strings with 0 seed', () => {
  expect(origXXHash32('')).toBe('02cc5d05');
  expect(origXXHash32('a')).toBe('550d7456');
  expect(origXXHash32('a\x00')).toBe('19832f52');
  expect(origXXHash32('abc')).toBe('32d153ff');
  expect(origXXHash32('1234567890')).toBe('e8412d73');
});

test('simple strings', () => {
  expect(xxhash32('')).toBe('51c917a3');
  expect(xxhash32('a')).toBe('88488ff7');
  expect(xxhash32('1234567890')).toBe('e488df66');
  expect(xxhash32('a\x00')).toBe('0e7c1075');
  expect(xxhash32('abc')).toBe('344def81');
  expect(xxhash32('message digest')).toBe('072766cd');
  expect(xxhash32('abcdefghijklmnopqrstuvwxyz')).toBe('d4ea111e');
  expect(xxhash32('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')).toBe('7768b3a0');
  expect(xxhash32('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe('6273ef9a');
});

test('unicode strings', () => {
  expect(xxhash32('😊')).toBe('6dcaa4fe');
  expect(xxhash32('😊a😊')).toBe('421b3b97');
  const file = fs.readFileSync('./test/utf8.txt');
  expect(xxhash32(file)).toBe('1807f963');
  expect(xxhash32(file.toString())).toBe('1807f963');
});

test('Node.js buffers', () => {
  expect(xxhash32(Buffer.from([]))).toBe('51c917a3');
  expect(xxhash32(Buffer.from(['a'.charCodeAt(0)]))).toBe('88488ff7');
  expect(xxhash32(Buffer.from([0]))).toBe('666de50d');
  expect(xxhash32(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe('5fd527bb');
});

test('typed arrays', () => {
  const arr = [0, 1, 2, 3, 4, 5, 255, 254];
  expect(xxhash32(Buffer.from(arr))).toBe('7eebdfd4');
  const uint8 = new Uint8Array(arr);
  expect(xxhash32(uint8)).toBe('7eebdfd4');
  expect(xxhash32(new Uint16Array(uint8.buffer))).toBe('7eebdfd4');
  expect(xxhash32(new Uint32Array(uint8.buffer))).toBe('7eebdfd4');
});

test('long strings', () => {
  const SIZE = 5 * 1024 * 1024;
  const chunk = '012345678\x09';
  const str = (new Array(Math.floor(SIZE / chunk.length)).fill(chunk)).join('');
  expect(xxhash32(str)).toBe('ee6e5c97');
});

test('long buffers', () => {
  const SIZE = 5 * 1024 * 1024;
  const buf = Buffer.alloc(SIZE);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  expect(xxhash32(buf)).toBe('d8416dcc');
});

test('chunked', () => {
  const hash = createXXHash32();
  expect(hash.digest()).toBe('02cc5d05');
  hash.init();
  hash.update('a');
  hash.update(new Uint8Array([0]));
  hash.update('bc');
  hash.update(new Uint8Array([255, 254]));
  expect(hash.digest()).toBe('a0155f6d');

  hash.init();
  for (let i = 0; i < 1000; i++) {
    // eslint-disable-next-line no-bitwise
    hash.update(new Uint8Array([i & 0xFF]));
  }
  hash.update(Buffer.alloc(1000).fill(0xDF));
  expect(hash.digest()).toBe('7bba26d1');
});

test('interlaced shorthand', async () => {
  const [hashA, hashB] = await Promise.all([
    origXXHash32('a'),
    origXXHash32('abc'),
  ]);
  expect(hashA).toBe('550d7456');
  expect(hashB).toBe('32d153ff');
});

test('interlaced create', () => {
  const hashA = createXXHash32();
  hashA.update('a');
  const hashB = createXXHash32();
  hashB.update('abc');
  expect(hashA.digest()).toBe('550d7456');
  expect(hashB.digest()).toBe('32d153ff');
});

test('invalid parameters', () => {
  expect(() => origXXHash32('', -1)).toThrow();
  expect(() => origXXHash32('', 'a' as any)).toThrow();
  expect(() => origXXHash32('', 0xFFFFFFFF + 1)).toThrow();
  expect(() => origXXHash32('', 0.1)).toThrow();
  expect(() => origXXHash32('', Number.NaN)).toThrow();

  expect(() => createXXHash32(-1 as any)).toThrow();
  expect(() => createXXHash32('a' as any)).toThrow();
  expect(() => createXXHash32(0xFFFFFFFF + 1 as any)).toThrow();
  expect(() => createXXHash32(0.1 as any)).toThrow();
  expect(() => createXXHash32(Number.NaN as any)).toThrow();
});

test('Invalid inputs throw', () => {
  const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
  const hash = createXXHash32();

  invalidInputs.forEach((input: any) => {
    expect(() => origXXHash32(input)).toThrow();
    expect(() => hash.update(input)).toThrow();
  });
});
