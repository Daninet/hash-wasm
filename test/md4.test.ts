import fs from 'fs';
import { md4, createMD4 } from '../lib';
/* global test, expect */

test('simple strings', async () => {
  expect(await md4('')).toBe('31d6cfe0d16ae931b73c59d7e0c089c0');
  expect(await md4('a')).toBe('bde52cb31de33e46245e05fbdbd6fb24');
  expect(await md4('a\x00')).toBe('186cb09181e2c2ecaac768c47c729904');
  expect(await md4('abc')).toBe('a448017aaf21d8525fc10ae87aa6729d');
  expect(await md4('message digest')).toBe('d9130a8164549fe818874806e1c7014b');
  expect(await md4('abcdefghijklmnopqrstuvwxyz')).toBe('d79e1c308aa5bbcdeea8ed63df412da9');
  expect(await md4('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')).toBe('043f8582f241db351ce627e153e7f0e4');
  expect(await md4('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe('e33b4ddc9c38f2199c3e7b164fcc0536');
});

test('unicode strings', async () => {
  expect(await md4('😊')).toBe('69948427129e5504f67e51ce22b4486b');
  expect(await md4('😊a😊')).toBe('6b9f614e8987bc2ed0c2015007408e2c');
  const file = fs.readFileSync('./test/utf8.txt');
  expect(await md4(file)).toBe('fa160f6eaa81606f3b7ed273ee9123e3');
  expect(await md4(file.toString())).toBe('fa160f6eaa81606f3b7ed273ee9123e3');
});

test('Node.js buffers', async () => {
  expect(await md4(Buffer.from([]))).toBe('31d6cfe0d16ae931b73c59d7e0c089c0');
  expect(await md4(Buffer.from(['a'.charCodeAt(0)]))).toBe('bde52cb31de33e46245e05fbdbd6fb24');
  expect(await md4(Buffer.from([0]))).toBe('47c61a0fa8738ba77308a8a600f88e4b');
  expect(await md4(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe('a322bcc3d130ed59fcc5d445f3db6074');
});

test('typed arrays', async () => {
  const arr = [0, 1, 2, 3, 4, 5, 255, 254];
  expect(await md4(Buffer.from(arr))).toBe('e2a641653e013acd2da864e6ed8e816e');
  const uint8 = new Uint8Array(arr);
  expect(await md4(uint8)).toBe('e2a641653e013acd2da864e6ed8e816e');
  expect(await md4(new Uint16Array(uint8.buffer))).toBe('e2a641653e013acd2da864e6ed8e816e');
  expect(await md4(new Uint32Array(uint8.buffer))).toBe('e2a641653e013acd2da864e6ed8e816e');
});

test('long strings', async () => {
  const SIZE = 5 * 1024 * 1024;
  const chunk = '012345678\x09';
  const str = (new Array(Math.floor(SIZE / chunk.length)).fill(chunk)).join('');
  expect(await md4(str)).toBe('8a91d073c046b98a0e7c4a45fc617be8');
});

test('long buffers', async () => {
  const SIZE = 5 * 1024 * 1024;
  const buf = Buffer.alloc(SIZE);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  expect(await md4(buf)).toBe('249f0de16d9c9498cb6810a51489d8e0');
});

test('chunked', async () => {
  const hash = await createMD4();
  expect(hash.digest()).toBe('31d6cfe0d16ae931b73c59d7e0c089c0');
  hash.init();
  hash.update('a');
  hash.update(new Uint8Array([0]));
  expect(hash.digest()).toBe('186cb09181e2c2ecaac768c47c729904');
});

test('interlaced shorthand', async () => {
  const [hashA, hashB] = await Promise.all([
    md4('a'),
    md4('abc'),
  ]);
  expect(hashA).toBe('bde52cb31de33e46245e05fbdbd6fb24');
  expect(hashB).toBe('a448017aaf21d8525fc10ae87aa6729d');
});

test('interlaced create', async () => {
  const hashA = await createMD4();
  hashA.update('a');
  const hashB = await createMD4();
  hashB.update('abc');
  expect(hashA.digest()).toBe('bde52cb31de33e46245e05fbdbd6fb24');
  expect(hashB.digest()).toBe('a448017aaf21d8525fc10ae87aa6729d');
});
