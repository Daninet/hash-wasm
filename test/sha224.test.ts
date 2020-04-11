import fs from 'fs';
import { sha224 } from '../lib';
/* global test, expect */

test('simple strings', async () => {
  expect(await sha224('')).toBe('d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f');
  expect(await sha224('a')).toBe('abd37534c7d9a2efb9465de931cd7055ffdb8879563ae98078d6d6d5');
  expect(await sha224('a\x00')).toBe('3118199937a95dd0dd06a74ac0bf1517e958f08ae87ef9d7e89f139a');
  expect(await sha224('abc')).toBe('23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7');
  expect(await sha224('message digest')).toBe('2cb21c83ae2f004de7e81c3c7019cbcb65b71ab656b22d6d0c39b8eb');
  expect(await sha224('abcdefghijklmnopqrstuvwxyz')).toBe('45a5f72c39c5cff2522eb3429799e49e5f44b356ef926bcf390dccc2');
  expect(await sha224('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')).toBe('bff72b4fcb7d75e5632900ac5f90d219e05e97a7bde72e740db393d9');
  expect(await sha224('12345678901234567890123456789012345678901234567890123456789012345678901234567890')).toBe('b50aecbe4e9bb0b57bc5f3ae760a8e01db24f203fb3cdcd13148046e');
});

test('unicode strings', async () => {
  expect(await sha224('😊')).toBe('3058d42759034e0e967a45e7789a83e4e976433e5012d3b9271a7505');
  expect(await sha224('😊a😊')).toBe('d6374d14aa29eefb6ec21b0571298bacf0319e679a7530a7d9b52382');
  const file = fs.readFileSync('./test/utf8.txt');
  expect(await sha224(file)).toBe('370cb9d7fee91d456259ecca80e41ff1fc4754458274b96a628a4125');
  expect(await sha224(file.toString())).toBe('370cb9d7fee91d456259ecca80e41ff1fc4754458274b96a628a4125');
});

test('Node.js buffers', async () => {
  expect(await sha224(Buffer.from([]))).toBe('d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f');
  expect(await sha224(Buffer.from(['a'.charCodeAt(0)]))).toBe('abd37534c7d9a2efb9465de931cd7055ffdb8879563ae98078d6d6d5');
  expect(await sha224(Buffer.from([0]))).toBe('fff9292b4201617bdc4d3053fce02734166a683d7d858a7f5f59b073');
  expect(await sha224(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe('39e81cfa51ed85ac728e9307f8a43ac3ca9bdc30e50276dfa739f2d6');
});

test('typed arrays', async () => {
  const arr = [0, 1, 2, 3, 4, 5, 255, 254];
  expect(await sha224(Buffer.from(arr))).toBe('4974caee1155bb1f503f9cc9b1d74505952047c7adaa665d87244eac');
  const uint8 = new Uint8Array(arr);
  expect(await sha224(uint8)).toBe('4974caee1155bb1f503f9cc9b1d74505952047c7adaa665d87244eac');
  expect(await sha224(new Uint16Array(uint8.buffer))).toBe('4974caee1155bb1f503f9cc9b1d74505952047c7adaa665d87244eac');
  expect(await sha224(new Uint32Array(uint8.buffer))).toBe('4974caee1155bb1f503f9cc9b1d74505952047c7adaa665d87244eac');
});

test('long strings', async () => {
  const SIZE = 5 * 1024 * 1024;
  const chunk = '012345678\x09';
  const str = (new Array(Math.floor(SIZE / chunk.length)).fill(chunk)).join('');
  expect(await sha224(str)).toBe('0d5ac6c9c73fe16d5c4aeb6d25fa44936bd3e831d190fb74bd023dc2');
});

test('long buffers', async () => {
  const SIZE = 5 * 1024 * 1024;
  const buf = Buffer.alloc(SIZE);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  expect(await sha224(buf)).toBe('927c4d3dcc570b35d21a0e8043b808d967a8b30a7ba56633c6b36625');
});
