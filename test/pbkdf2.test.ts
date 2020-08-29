/* eslint-disable no-restricted-syntax */
import crypto from 'crypto';
import {
  createSHA512,
  pbkdf2,
} from '../lib';

/* global test, expect */

function getNodePBKDF2(password, salt, iterations, keyLength, outputType?: string) {
  const buf = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha512');
  return outputType === 'binary'
    ? new Uint8Array(buf.buffer, buf.byteOffset, buf.length)
    : buf.toString('hex');
}

function getWasmPBKDF2(password, salt, iterations, keyLength, outputType?: 'hex' | 'binary') {
  const hash = pbkdf2(password, salt, iterations, keyLength, createSHA512(), outputType);
  return hash;
}

test('invalid parameters', () => {
  expect(() => pbkdf2('pwd', 'salt', 1, 1, '' as any)).toThrow();
  expect(() => pbkdf2('pwd', 'salt', 1, 1, (() => '') as any)).toThrow();
  expect(() => pbkdf2('pwd', 'salt', 1, 1, {} as any)).toThrow();
  expect(() => pbkdf2('pwd', 'salt', 1, 0, createSHA512())).toThrow();
  expect(() => pbkdf2('pwd', 'salt', 0, 1, createSHA512())).toThrow();
  expect(() => pbkdf2('pwd', 'salt', 1, 1, createSHA512(), null)).toThrow();
  expect(() => pbkdf2('pwd', 'salt', 1, 1, createSHA512(), '' as any)).toThrow();
  expect(() => pbkdf2('pwd', 'salt', 1, 1, createSHA512(), 'x' as any)).toThrow();
});

test('simple test', () => {
  expect(
    getWasmPBKDF2('password', 'salt', 500, 50),
  ).toBe(getNodePBKDF2('password', 'salt', 500, 50));
});

test('various key lengths', () => {
  expect(
    getWasmPBKDF2('password', 'salt', 500, 1),
  ).toBe(getNodePBKDF2('password', 'salt', 500, 1));

  expect(
    getWasmPBKDF2('password', 'salt', 500, 2),
  ).toBe(getNodePBKDF2('password', 'salt', 500, 2));

  expect(
    getWasmPBKDF2('password', 'salt', 500, 600),
  ).toBe(getNodePBKDF2('password', 'salt', 500, 600));
});

test('various iteration counts', () => {
  expect(
    getWasmPBKDF2('password', 'salt', 1, 32),
  ).toBe(getNodePBKDF2('password', 'salt', 1, 32));

  expect(
    getWasmPBKDF2('password', 'salt', 2, 32),
  ).toBe(getNodePBKDF2('password', 'salt', 2, 32));

  expect(
    getWasmPBKDF2('password', 'salt', 100, 32),
  ).toBe(getNodePBKDF2('password', 'salt', 100, 32));

  expect(
    getWasmPBKDF2('password', 'salt', 1000, 32),
  ).toBe(getNodePBKDF2('password', 'salt', 1000, 32));

  expect(
    getWasmPBKDF2('password', 'salt', 10000, 32),
  ).toBe(getNodePBKDF2('password', 'salt', 10000, 32));
});

test('various salt types', () => {
  expect(
    getWasmPBKDF2('password', 's', 10, 32),
  ).toBe(getNodePBKDF2('password', 's', 10, 32));

  expect(
    getWasmPBKDF2('password', '', 10, 32),
  ).toBe(getNodePBKDF2('password', '', 10, 32));

  expect(
    getWasmPBKDF2('password', new Uint8Array(0), 10, 32),
  ).toBe(getNodePBKDF2('password', new Uint8Array(0), 10, 32));

  expect(
    getWasmPBKDF2('password', new Uint8Array(1), 10, 32),
  ).toBe(getNodePBKDF2('password', new Uint8Array(1), 10, 32));

  expect(
    getWasmPBKDF2('password', new Array(1024).fill('s').join(''), 10, 32),
  ).toBe(getNodePBKDF2('password', new Array(1024).fill('s').join(''), 10, 32));

  expect(
    getWasmPBKDF2('password', Buffer.from([0]), 10, 32),
  ).toBe(getNodePBKDF2('password', Buffer.from([0]), 10, 32));
});

test('various password types', () => {
  expect(
    getWasmPBKDF2('', 'salt', 10, 32),
  ).toBe(getNodePBKDF2('', 'salt', 10, 32));

  expect(
    getWasmPBKDF2('p', 'salt', 10, 32),
  ).toBe(getNodePBKDF2('p', 'salt', 10, 32));

  expect(
    getWasmPBKDF2(new Uint8Array(0), 'salt', 10, 32),
  ).toBe(getNodePBKDF2(new Uint8Array(0), 'salt', 10, 32));

  expect(
    getWasmPBKDF2(new Uint8Array(1), 'salt', 10, 32),
  ).toBe(getNodePBKDF2(new Uint8Array(1), 'salt', 10, 32));

  expect(
    getWasmPBKDF2(new Array(1024).fill('p').join(''), 'salt', 10, 32),
  ).toBe(getNodePBKDF2(new Array(1024).fill('p').join(''), 'salt', 10, 32));

  expect(
    getWasmPBKDF2(Buffer.from([0]), 'salt', 10, 32),
  ).toBe(getNodePBKDF2(Buffer.from([0]), 'salt', 10, 32));
});

test('test binary output format', () => {
  expect(
    ArrayBuffer.isView(
      getWasmPBKDF2('123', 'salt', 2, 10, 'binary'),
    ),
  ).toBe(true);

  expect(
    getWasmPBKDF2('password', 'salt', 123, 57, 'binary'),
  ).toStrictEqual(getNodePBKDF2('password', 'salt', 123, 57, 'binary'));
});
