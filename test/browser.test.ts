/* eslint-disable no-restricted-globals */
/* eslint-disable no-await-in-loop */
/* global test, expect */

beforeEach(() => {
  jest.resetModules();
});

test('Throws when WebAssembly is unavailable', () => {
  const { md5 } = jest.requireActual('../lib');

  const WASM = globalThis.WebAssembly;
  globalThis.WebAssembly = undefined;

  expect(() => md5('a')).toThrow();
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

test('Simulate browsers', () => {
  const global = globalThis;
  ((globalThis as any).TextEncoder as any) = TextEncoderMock;
  ((globalThis as any).Buffer as any) = undefined;
  delete (globalThis as any).Buffer;
  (globalThis as any) = undefined;

  const { md5 } = jest.requireActual('../lib');
  expect(md5('a')).toBe('0cc175b9c0f1b6a831c399e269772661');
  expect(md5(new Uint8Array([0]))).toBe('93b885adfe0da089cdf634904fd59f71');
  expect(() => md5(1)).toThrow();

  (globalThis as any) = global;
});

test('Delete global self', () => {
  const global = globalThis;
  delete globalThis.self;
  (globalThis as any) = undefined;

  const { md5 } = jest.requireActual('../lib');
  expect(md5('a')).toBe('0cc175b9c0f1b6a831c399e269772661');

  (globalThis as any) = global;
});

test('Delete global self + window', () => {
  const global = globalThis;
  delete globalThis.window;
  (globalThis as any) = undefined;

  const { md5 } = jest.requireActual('../lib');
  expect(md5('a')).toBe('0cc175b9c0f1b6a831c399e269772661');

  (globalThis as any) = global;
});
