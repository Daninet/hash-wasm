/* eslint-disable no-restricted-globals */
/* eslint-disable no-await-in-loop */
/* global test, expect */

beforeEach(() => {
  jest.resetModules();
});

test('Throws when WebAssembly is unavailable', async () => {
  const { md5 } = jest.requireActual('../lib');

  const WASM = globalThis.WebAssembly;
  globalThis.WebAssembly = undefined;

  await expect(() => md5('a')).rejects.toThrow();
  globalThis.WebAssembly = WASM;
});

const NodeBuffer = (globalThis as any).Buffer;

class TextEncoderMock {
  // eslint-disable-next-line class-methods-use-this
  encode(str) {
    const buf = NodeBuffer.from(str);
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
  }
}

test('Simulate browsers', async () => {
  const global = globalThis;
  ((globalThis as any).TextEncoder as any) = TextEncoderMock;
  ((globalThis as any).Buffer as any) = undefined;
  delete (globalThis as any).Buffer;
  (globalThis as any) = undefined;

  const { md5 } = jest.requireActual('../lib');
  expect(await md5('a')).toBe('0cc175b9c0f1b6a831c399e269772661');
  expect(await md5(new Uint8Array([0]))).toBe('93b885adfe0da089cdf634904fd59f71');
  expect(() => md5(1)).rejects.toThrow();

  (globalThis as any) = global;
});

test('Use global self', async () => {
  const global = globalThis;
  (globalThis as any).self = global;
  (globalThis as any) = undefined;

  const { md5 } = jest.requireActual('../lib');
  expect(await md5('a')).toBe('0cc175b9c0f1b6a831c399e269772661');

  (globalThis as any) = global;
});

test('Delete global self', async () => {
  const global = globalThis;
  delete globalThis.self;
  (globalThis as any) = undefined;

  const { md5 } = jest.requireActual('../lib');
  expect(await md5('a')).toBe('0cc175b9c0f1b6a831c399e269772661');

  (globalThis as any) = global;
});

test('Use global window', async () => {
  const global = globalThis;
  (globalThis as any).window = global;
  (globalThis as any) = undefined;

  const { md5 } = jest.requireActual('../lib');
  expect(await md5('a')).toBe('0cc175b9c0f1b6a831c399e269772661');

  (globalThis as any) = global;
});

test('Delete global self + window', async () => {
  const global = globalThis;
  delete globalThis.window;
  (globalThis as any) = undefined;

  const { md5 } = jest.requireActual('../lib');
  expect(await md5('a')).toBe('0cc175b9c0f1b6a831c399e269772661');

  (globalThis as any) = global;
});
