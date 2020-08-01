/* eslint-disable no-restricted-syntax */
import crypto from 'crypto';
import {
  createSHA512,
  pbkdf2,
} from '../lib';

/* global test, expect */

function getNodePBKDF2(password, salt, iterations, keyLength) {
  const buf = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha512');
  return buf.toString('hex');
}

async function getWasmPBKDF2(password, salt, iterations, keyLength) {
  const hash = await pbkdf2(password, salt, iterations, keyLength, createSHA512());
  return hash;
}

test('invalid parameters', async () => {
  expect(() => pbkdf2('pwd', 'salt', 1, 1, '' as any)).rejects.toThrow();
  expect(() => pbkdf2('pwd', 'salt', 1, 1, (() => '') as any)).rejects.toThrow();
  const hasher = await createSHA512();
  expect(() => pbkdf2('pwd', 'salt', 1, 1, hasher as any)).rejects.toThrow();
});

test('simple test', async () => {
  expect(
    await getWasmPBKDF2('password', 'salt', 500, 50),
  ).toBe(getNodePBKDF2('password', 'salt', 500, 50));
});

test('various key lengths', async () => {
  expect(
    await getWasmPBKDF2('password', 'salt', 500, 1),
  ).toBe(getNodePBKDF2('password', 'salt', 500, 1));

  expect(
    await getWasmPBKDF2('password', 'salt', 500, 0),
  ).toBe(getNodePBKDF2('password', 'salt', 500, 0));

  expect(
    await getWasmPBKDF2('password', 'salt', 500, 600),
  ).toBe(getNodePBKDF2('password', 'salt', 500, 600));
});

test('various iteration counts', async () => {
  expect(
    await getWasmPBKDF2('password', 'salt', 1, 32),
  ).toBe(getNodePBKDF2('password', 'salt', 1, 32));

  expect(
    await getWasmPBKDF2('password', 'salt', 2, 32),
  ).toBe(getNodePBKDF2('password', 'salt', 2, 32));

  expect(
    await getWasmPBKDF2('password', 'salt', 100, 32),
  ).toBe(getNodePBKDF2('password', 'salt', 100, 32));

  expect(
    await getWasmPBKDF2('password', 'salt', 1000, 32),
  ).toBe(getNodePBKDF2('password', 'salt', 1000, 32));

  expect(
    await getWasmPBKDF2('password', 'salt', 10000, 32),
  ).toBe(getNodePBKDF2('password', 'salt', 10000, 32));
});

test('various salt types', async () => {
  expect(
    await getWasmPBKDF2('password', 's', 10, 32),
  ).toBe(getNodePBKDF2('password', 's', 10, 32));

  expect(
    await getWasmPBKDF2('password', '', 10, 32),
  ).toBe(getNodePBKDF2('password', '', 10, 32));

  expect(
    await getWasmPBKDF2('password', new Uint8Array(0), 10, 32),
  ).toBe(getNodePBKDF2('password', new Uint8Array(0), 10, 32));

  expect(
    await getWasmPBKDF2('password', new Uint8Array(1), 10, 32),
  ).toBe(getNodePBKDF2('password', new Uint8Array(1), 10, 32));

  expect(
    await getWasmPBKDF2('password', new Array(1024).fill('s').join(''), 10, 32),
  ).toBe(getNodePBKDF2('password', new Array(1024).fill('s').join(''), 10, 32));

  expect(
    await getWasmPBKDF2('password', Buffer.from([0]), 10, 32),
  ).toBe(getNodePBKDF2('password', Buffer.from([0]), 10, 32));
});

test('various password types', async () => {
  expect(
    await getWasmPBKDF2('', 'salt', 10, 32),
  ).toBe(getNodePBKDF2('', 'salt', 10, 32));

  expect(
    await getWasmPBKDF2('p', 'salt', 10, 32),
  ).toBe(getNodePBKDF2('p', 'salt', 10, 32));

  expect(
    await getWasmPBKDF2(new Uint8Array(0), 'salt', 10, 32),
  ).toBe(getNodePBKDF2(new Uint8Array(0), 'salt', 10, 32));

  expect(
    await getWasmPBKDF2(new Uint8Array(1), 'salt', 10, 32),
  ).toBe(getNodePBKDF2(new Uint8Array(1), 'salt', 10, 32));

  expect(
    await getWasmPBKDF2(new Array(1024).fill('p').join(''), 'salt', 10, 32),
  ).toBe(getNodePBKDF2(new Array(1024).fill('p').join(''), 'salt', 10, 32));

  expect(
    await getWasmPBKDF2(Buffer.from([0]), 'salt', 10, 32),
  ).toBe(getNodePBKDF2(Buffer.from([0]), 'salt', 10, 32));
});
