/* eslint-disable import/prefer-default-export */
/* eslint-disable no-bitwise */

export type ITypedArray = Uint8Array | Uint16Array | Uint32Array;

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

export function getUInt8Buffer(data: string | Buffer | ITypedArray): Uint8Array {
  if (data instanceof String) {
    data = data.toString();
  }

  if (typeof data === 'string') {
    const buf = Buffer.from(data, 'utf8');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
  }

  if (data instanceof Buffer) {
    return new Uint8Array(data.buffer, data.byteOffset, data.length);
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer);
  }

  throw new Error('Invalid data type!');
}
