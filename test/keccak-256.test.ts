import fs from 'fs';
import { keccak, createKeccak } from '../lib';
/* global test, expect */

test('simple strings', async () => {
  expect(await keccak('', 256)).toBe('c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
  expect(await keccak('a', 256)).toBe('3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb');
  expect(await keccak('a\x00', 256)).toBe('a3fe1181ce8d13858f6f383445749f49a3ae8b0cab89823918bab81153ca4300');
  expect(await keccak('abc', 256)).toBe('4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45');
  expect(await keccak('message digest', 256)).toBe('856ab8a3ad0f6168a4d0ba8d77487243f3655db6fc5b0e1669bc05b1287e0147');
  expect(await keccak('abcdefghijklmnopqrstuvwxyz', 256)).toBe('9230175b13981da14d2f3334f321eb78fa0473133f6da3de896feb22fb258936');
  expect(await keccak('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 256)).toBe('6e61c013aef4c6765389ffcd406dd72e7e061991f4a3a8018190db86bd21ebb4');
  expect(await keccak('12345678901234567890123456789012345678901234567890123456789012345678901234567890', 256)).toBe('1523a0cd0e7e1faaba17e1c12210fabc49fa99a7abc061e3d6c978eef4f748c4');
});

test('unicode strings', async () => {
  expect(await keccak('😊', 256)).toBe('a5fd7cf8826b0e14098a7b495c37a9c206532a1f4f3e82001c922b07bcfb4d88');
  expect(await keccak('😊a😊', 256)).toBe('cfee4c8c1b0ba8acd2c90471b724cff39baa3443a01d4d17ddb6c9e6843be585');
  const file = fs.readFileSync('./test/utf8.txt');
  expect(await keccak(file, 256)).toBe('0aca7f79fdfbe39035a3610e41d5917eb2474d294818af39135a7b03c611432f');
  expect(await keccak(file.toString(), 256)).toBe('0aca7f79fdfbe39035a3610e41d5917eb2474d294818af39135a7b03c611432f');
});

test('Node.js buffers', async () => {
  expect(await keccak(Buffer.from([]), 256)).toBe('c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
  expect(await keccak(Buffer.from(['a'.charCodeAt(0)]), 256)).toBe('3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb');
  expect(await keccak(Buffer.from([0]), 256)).toBe('bc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a');
  expect(await keccak(Buffer.from([0, 1, 0, 0, 2, 0]), 256)).toBe('6ad2337e77c25f54dade52cc51aeccc6d575f8c1a53ced089306c4321b7b7eb3');
});

test('typed arrays', async () => {
  const arr = [0, 1, 2, 3, 4, 5, 255, 254];
  expect(await keccak(Buffer.from(arr), 256)).toBe('69d2527f39674f4e468e2e5bcbac833e1b4691f181b9194f2a2ffe4b7bd7fef5');
  const uint8 = new Uint8Array(arr);
  expect(await keccak(uint8, 256)).toBe('69d2527f39674f4e468e2e5bcbac833e1b4691f181b9194f2a2ffe4b7bd7fef5');
  expect(await keccak(new Uint16Array(uint8.buffer), 256)).toBe('69d2527f39674f4e468e2e5bcbac833e1b4691f181b9194f2a2ffe4b7bd7fef5');
  expect(await keccak(new Uint32Array(uint8.buffer), 256)).toBe('69d2527f39674f4e468e2e5bcbac833e1b4691f181b9194f2a2ffe4b7bd7fef5');
});

test('long strings', async () => {
  const SIZE = 5 * 1024 * 1024;
  const chunk = '012345678\x09';
  const str = (new Array(Math.floor(SIZE / chunk.length)).fill(chunk)).join('');
  expect(await keccak(str, 256)).toBe('8d9ac77e86d3f0dec6520b7d47bd072bdb684c852a7dd297ad8d5f2d3013d65f');
});

test('long buffers', async () => {
  const SIZE = 5 * 1024 * 1024;
  const buf = Buffer.alloc(SIZE);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  expect(await keccak(buf, 256)).toBe('ee2baea5067d74104d62c153ea178dfbfeef70a800a74e333d81ed4c1bb828ff');
});

test('chunked', async () => {
  const hash = await createKeccak(256);
  expect(hash.digest()).toBe('c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
  hash.init();
  hash.update('a');
  hash.update(new Uint8Array([0]));
  expect(hash.digest()).toBe('a3fe1181ce8d13858f6f383445749f49a3ae8b0cab89823918bab81153ca4300');
});
