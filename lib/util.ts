/* eslint-disable import/prefer-default-export */
/* eslint-disable no-bitwise */

function getGlobal() {
  if (typeof globalThis !== 'undefined') return globalThis;
  // eslint-disable-next-line no-restricted-globals
  if (typeof self !== 'undefined') return self;
  if (typeof window !== 'undefined') return window;
  // eslint-disable-next-line no-use-before-define
  if (typeof global !== 'undefined') return global;
  throw new Error('unable to locate global object');
}

const globalObject = getGlobal();
const nodeBuffer = (globalObject as NodeJS.Global).Buffer ?? null;
const textEncoder = globalObject.TextEncoder ? new globalObject.TextEncoder() : null;

export type ITypedArray = Uint8Array | Uint16Array | Uint32Array;
export type IDataType = string | Buffer | ITypedArray;

function hexCharCodesToInt(a: number, b: number): number {
  return (
    ((a & 0xF) + ((a >> 6) | ((a >> 3) & 0x8))) << 4
  ) | (
    (b & 0xF) + ((b >> 6) | ((b >> 3) & 0x8))
  );
}

export function writeHexToUInt8(buf: Uint8Array, str: string) {
  const size = str.length >> 1;
  for (let i = 0; i < size; i++) {
    const index = i << 1;
    buf[i] = hexCharCodesToInt(str.charCodeAt(index), str.charCodeAt(index + 1));
  }
}

export const getUInt8Buffer = nodeBuffer !== null
  ? (data: IDataType): Uint8Array => {
    if (typeof data === 'string') {
      const buf = nodeBuffer.from(data, 'utf8');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
    }

    if (nodeBuffer.isBuffer(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.length);
    }

    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer);
    }

    throw new Error('Invalid data type!');
  }
  : (data: IDataType): Uint8Array => {
    if (typeof data === 'string') {
      return textEncoder.encode(data);
    }

    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer);
    }

    throw new Error('Invalid data type!');
  };

const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const base64Lookup = new Uint8Array(256);
for (let i = 0; i < base64Chars.length; i++) {
  base64Lookup[base64Chars.charCodeAt(i)] = i;
}

export function decodeBase64(data: string): Uint8Array {
  let bufferLength = data.length * 0.75;
  const len = data.length;

  if (data[len - 1] === '=') {
    bufferLength -= 1;
    if (data[len - 2] === '=') {
      bufferLength -= 1;
    }
  }

  const bytes = new Uint8Array(bufferLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = base64Lookup[data.charCodeAt(i)];
    const encoded2 = base64Lookup[data.charCodeAt(i + 1)];
    const encoded3 = base64Lookup[data.charCodeAt(i + 2)];
    const encoded4 = base64Lookup[data.charCodeAt(i + 3)];

    bytes[p] = (encoded1 << 2) | (encoded2 >> 4);
    p += 1;
    bytes[p] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    p += 1;
    bytes[p] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    p += 1;
  }

  return bytes;
}
