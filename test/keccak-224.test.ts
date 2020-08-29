import fs from 'fs';
import { keccak, createKeccak } from '../lib';
/* global test, expect */

test('simple strings', () => {
  expect(keccak('', 224)).toBe('f71837502ba8e10837bdd8d365adb85591895602fc552b48b7390abd');
  expect(keccak('a', 224)).toBe('7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308');
  expect(keccak('a\x00', 224)).toBe('1b914ebf869b542b9d8440e07ca1dfe5da48ebb1c563e928ded523c3');
  expect(keccak('abc', 224)).toBe('c30411768506ebe1c2871b1ee2e87d38df342317300a9b97a95ec6a8');
  expect(keccak('message digest', 224)).toBe('b53b2cd638f440fa49916036acdb22245673992fb1b1963b96fb9e93');
  expect(keccak('abcdefghijklmnopqrstuvwxyz', 224)).toBe('162bab64dc3ba594bd3b43fd8abec4aa03b36c2784cac53a58f9b076');
  expect(keccak('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 224)).toBe('4fb72d7b6b24bd1f5d4b8ef559fd9188eb66caa01bce34c621a05412');
  expect(keccak('12345678901234567890123456789012345678901234567890123456789012345678901234567890', 224)).toBe('744c1765a53043e186bc30bab07fa379b421cf0bca8224cb83e5d45b');
});

test('unicode strings', () => {
  expect(keccak('😊', 224)).toBe('628277f927690213af759bb3e6cd2024eed84309ed0a7d257c1084de');
  expect(keccak('😊a😊', 224)).toBe('dfac34043895a643f113fc21e138732d0566f32e98c046064820bf58');
  const file = fs.readFileSync('./test/utf8.txt');
  expect(keccak(file, 224)).toBe('2894459c0625dc97aa3db2de8ad9f67a8a0cea74c0a5208ed8b0664d');
  expect(keccak(file.toString(), 224)).toBe('2894459c0625dc97aa3db2de8ad9f67a8a0cea74c0a5208ed8b0664d');
});

test('Node.js buffers', () => {
  expect(keccak(Buffer.from([]), 224)).toBe('f71837502ba8e10837bdd8d365adb85591895602fc552b48b7390abd');
  expect(keccak(Buffer.from(['a'.charCodeAt(0)]), 224)).toBe('7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308');
  expect(keccak(Buffer.from([0]), 224)).toBe('b7e52d015afb9bb56c19955720964f1a68b1aba96a7a9454472927be');
  expect(keccak(Buffer.from([0, 1, 0, 0, 2, 0]), 224)).toBe('9de557901837e8bd646979a967629a506a2441778e61b4739446f127');
});

test('typed arrays', () => {
  const arr = [0, 1, 2, 3, 4, 5, 255, 254];
  expect(keccak(Buffer.from(arr), 224)).toBe('c542c73ed687f1ef438d6d7cd4f20c8415850a7095ff506776b0cae6');
  const uint8 = new Uint8Array(arr);
  expect(keccak(uint8, 224)).toBe('c542c73ed687f1ef438d6d7cd4f20c8415850a7095ff506776b0cae6');
  expect(keccak(new Uint16Array(uint8.buffer), 224)).toBe('c542c73ed687f1ef438d6d7cd4f20c8415850a7095ff506776b0cae6');
  expect(keccak(new Uint32Array(uint8.buffer), 224)).toBe('c542c73ed687f1ef438d6d7cd4f20c8415850a7095ff506776b0cae6');
});

test('long strings', () => {
  const SIZE = 5 * 1024 * 1024;
  const chunk = '012345678\x09';
  const str = (new Array(Math.floor(SIZE / chunk.length)).fill(chunk)).join('');
  expect(keccak(str, 224)).toBe('47408143f22f56758b0a99a861629bca80dcdc304bd5843c5049e76d');
});

test('long buffers', () => {
  const SIZE = 5 * 1024 * 1024;
  const buf = Buffer.alloc(SIZE);
  buf.fill('\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF');
  expect(keccak(buf, 224)).toBe('81eadc502f5e5969929e6b707990d98bd096f1aa084500b5ed6d3fab');
});

test('chunked', () => {
  const hash = createKeccak(224);
  expect(hash.digest()).toBe('f71837502ba8e10837bdd8d365adb85591895602fc552b48b7390abd');
  hash.init();
  hash.update('a');
  hash.update(new Uint8Array([0]));
  hash.update('bc');
  hash.update(new Uint8Array([255, 254]));
  expect(hash.digest()).toBe('9aaf1324c58e6b4f0dc4241e18ada1f773a652fbc1cf51b32682debe');

  hash.init();
  for (let i = 0; i < 1000; i++) {
    // eslint-disable-next-line no-bitwise
    hash.update(new Uint8Array([i & 0xFF]));
  }
  hash.update(Buffer.alloc(1000).fill(0xDF));
  expect(hash.digest()).toBe('8d2f1354ef279fd5bc9c70eba0eeac8f1b5d7dee386df39f5b7aaf7e');
});

test('interlaced shorthand', async () => {
  const [hashA, hashB] = await Promise.all([
    keccak('a', 224),
    keccak('abc', 224),
  ]);
  expect(hashA).toBe('7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308');
  expect(hashB).toBe('c30411768506ebe1c2871b1ee2e87d38df342317300a9b97a95ec6a8');
});

test('interlaced create', () => {
  const hashA = createKeccak(224);
  hashA.update('a');
  const hashB = createKeccak(224);
  hashB.update('abc');
  expect(hashA.digest()).toBe('7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308');
  expect(hashB.digest()).toBe('c30411768506ebe1c2871b1ee2e87d38df342317300a9b97a95ec6a8');
});

test('Invalid inputs throw', () => {
  const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
  const hash = createKeccak(224);

  invalidInputs.forEach((input: any) => {
    expect(() => keccak(input, 224)).toThrow();
    expect(() => hash.update(input)).toThrow();
  });
});
