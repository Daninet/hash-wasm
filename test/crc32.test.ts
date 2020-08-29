import fs from 'fs';
import { crc32, createCRC32 } from '../lib';
/* global test, expect */

test('simple strings', () => {
  expect(crc32('')).toBe('00000000');
  expect(crc32('a')).toBe('e8b7be43');
  expect(crc32('1234567890')).toBe('261daee5');
  expect(crc32('a\x00')).toBe('3d3f4819');
  expect(crc32('abc')).toBe('352441c2');
  expect(crc32('message digest')).toBe('20159d7f');
  expect(crc32('abcdefghijklmnopqrstuvwxyz')).toBe('4c2750bd');
  expect(crc32('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')).toBe('1fc2e6d2');
  expect(crc32('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe('7ca94a72');
});

test('unicode strings', () => {
  expect(crc32('😊')).toBe('e5985c5a');
  expect(crc32('😊a😊')).toBe('85dda337');
  const file = fs.readFileSync('./test/utf8.txt');
  expect(crc32(file)).toBe('15694f02');
  expect(crc32(file.toString())).toBe('15694f02');
});

test('Node.js buffers', () => {
  expect(crc32(Buffer.from([]))).toBe('00000000');
  expect(crc32(Buffer.from(['a'.charCodeAt(0)]))).toBe('e8b7be43');
  expect(crc32(Buffer.from([0]))).toBe('d202ef8d');
  expect(crc32(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe('be94ea91');
});

test('typed arrays', () => {
  const arr = [0, 1, 2, 3, 4, 5, 255, 254];
  expect(crc32(Buffer.from(arr))).toBe('89b578d3');
  const uint8 = new Uint8Array(arr);
  expect(crc32(uint8)).toBe('89b578d3');
  expect(crc32(new Uint16Array(uint8.buffer))).toBe('89b578d3');
  expect(crc32(new Uint32Array(uint8.buffer))).toBe('89b578d3');
});

test('long strings', () => {
  const SIZE = 5 * 1024 * 1024;
  const chunk = '012345678\x09';
  const str = (new Array(Math.floor(SIZE / chunk.length)).fill(chunk)).join('');
  expect(crc32(str)).toBe('5d7c1b96');
});

test('long buffers', () => {
  const SIZE = 5 * 1024 * 1024;
  const buf = Buffer.alloc(SIZE);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  expect(crc32(buf)).toBe('8717a175');
});

test('chunked', () => {
  const hash = createCRC32();
  expect(hash.digest()).toBe('00000000');
  hash.init();
  hash.update('a');
  hash.update(new Uint8Array([0]));
  hash.update('bc');
  hash.update(new Uint8Array([255, 254]));
  expect(hash.digest()).toBe('60f515c4');

  hash.init();
  for (let i = 0; i < 1000; i++) {
    // eslint-disable-next-line no-bitwise
    hash.update(new Uint8Array([i & 0xFF]));
  }
  hash.update(Buffer.alloc(1000).fill(0xDF));
  expect(hash.digest()).toBe('f683f7e3');
});

test('interlaced shorthand', async () => {
  const [hashA, hashB] = await Promise.all([
    crc32('a'),
    crc32('abc'),
  ]);
  expect(hashA).toBe('e8b7be43');
  expect(hashB).toBe('352441c2');
});

test('interlaced create', () => {
  const hashA = createCRC32();
  hashA.update('a');
  const hashB = createCRC32();
  hashB.update('abc');
  expect(hashA.digest()).toBe('e8b7be43');
  expect(hashB.digest()).toBe('352441c2');
});

test('Invalid inputs throw', () => {
  const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
  const hash = createCRC32();

  invalidInputs.forEach((input: any) => {
    expect(() => crc32(input)).toThrow();
    expect(() => hash.update(input)).toThrow();
  });
});
