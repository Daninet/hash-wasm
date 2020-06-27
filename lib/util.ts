/* eslint-disable import/prefer-default-export */
/* eslint-disable no-bitwise */

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
