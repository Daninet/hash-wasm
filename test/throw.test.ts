/* eslint-disable no-await-in-loop */
/* global test, expect */
import {
  md4, md5, crc32, sha1, sha224, sha256, sha384, sha512, sha3, xxhash32, xxhash64, keccak,
} from '../lib';

test('Invalid inputs throw after', () => {
  expect(() => md4(0 as any)).toThrow();
  expect(() => md5(0 as any)).toThrow();
  expect(() => crc32(0 as any)).toThrow();
  expect(() => sha1(0 as any)).toThrow();
  expect(() => sha224(0 as any)).toThrow();
  expect(() => sha256(0 as any)).toThrow();
  expect(() => sha384(0 as any)).toThrow();
  expect(() => sha512(0 as any)).toThrow();
  expect(() => sha3(0 as any)).toThrow();
  expect(() => keccak(0 as any)).toThrow();
  expect(() => xxhash32(0 as any)).toThrow();
  expect(() => xxhash64(0 as any)).toThrow();
});
