import fs from 'fs';
import { sha1, createSHA1 } from '../lib';
/* global test, expect */

test('simple strings', async () => {
  expect(await sha1('')).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  expect(await sha1('a')).toBe('86f7e437faa5a7fce15d1ddcb9eaeaea377667b8');
  expect(await sha1('a\x00')).toBe('0a04b971b03da607ce6c455184037b660ca89f78');
  expect(await sha1('abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  expect(await sha1('message digest')).toBe('c12252ceda8be8994d5fa0290a47231c1d16aae3');
  expect(await sha1('abcdefghijklmnopqrstuvwxyz')).toBe('32d10c7b8cf96570ca04ce37f2a19d84240d3a89');
  expect(await sha1('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')).toBe('761c457bf73b14d27e9e9265c46f4b4dda11f940');
  expect(await sha1('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe('50abf5706a150990a08b2c5ea40fa0e585554732');
});

test('unicode strings', async () => {
  expect(await sha1('😊')).toBe('8a7a73f2b2e726f0f8b86120e69d147b7f598b1c');
  expect(await sha1('😊a😊')).toBe('f96d1f1782d2eed29b67ea3e9f5c44168d310983');
  const file = fs.readFileSync('./test/utf8.txt');
  expect(await sha1(file)).toBe('5e07b0786796c0c0fcece4150042bce68e91856d');
  expect(await sha1(file.toString())).toBe('5e07b0786796c0c0fcece4150042bce68e91856d');
});

test('Node.js buffers', async () => {
  expect(await sha1(Buffer.from([]))).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  expect(await sha1(Buffer.from(['a'.charCodeAt(0)]))).toBe('86f7e437faa5a7fce15d1ddcb9eaeaea377667b8');
  expect(await sha1(Buffer.from([0]))).toBe('5ba93c9db0cff93f52b521d7420e43f6eda2784f');
  expect(await sha1(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe('26693987b06935cd70b41982061b761dd64d08a0');
});

test('typed arrays', async () => {
  const arr = [0, 1, 2, 3, 4, 5, 255, 254];
  expect(await sha1(Buffer.from(arr))).toBe('ef473cc975f136d3eefe22d51cbfcadb31369beb');
  const uint8 = new Uint8Array(arr);
  expect(await sha1(uint8)).toBe('ef473cc975f136d3eefe22d51cbfcadb31369beb');
  expect(await sha1(new Uint16Array(uint8.buffer))).toBe('ef473cc975f136d3eefe22d51cbfcadb31369beb');
  expect(await sha1(new Uint32Array(uint8.buffer))).toBe('ef473cc975f136d3eefe22d51cbfcadb31369beb');
});

test('long strings', async () => {
  const SIZE = 5 * 1024 * 1024;
  const chunk = '012345678\x09';
  const str = (new Array(Math.floor(SIZE / chunk.length)).fill(chunk)).join('');
  expect(await sha1(str)).toBe('1a86b6d5cebe7d1ff044842ceddf6c5e69a01f81');
});

test('long buffers', async () => {
  const SIZE = 5 * 1024 * 1024;
  const buf = Buffer.alloc(SIZE);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  expect(await sha1(buf)).toBe('6677c7445dd30888d61009461afe79df58d7721b');
});

test('chunked', async () => {
  const hash = await createSHA1();
  expect(hash.digest()).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  hash.init();
  hash.update('a');
  hash.update(new Uint8Array([0]));
  expect(hash.digest()).toBe('0a04b971b03da607ce6c455184037b660ca89f78');
});
