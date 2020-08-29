/* eslint-disable no-bitwise */
import { IHasher } from './WASMInterface';
import { getUInt8Buffer, IDataType } from './util';

function calculateKeyBuffer(hasher: IHasher, key: IDataType): Uint8Array {
  const { blockSize } = hasher;

  const buf = getUInt8Buffer(key);

  if (buf.length > blockSize) {
    hasher.update(buf);
    const uintArr = hasher.digest('binary');
    hasher.init();
    return uintArr;
  }

  return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
}

function calculateHmac(hasher: IHasher, key: IDataType): IHasher {
  hasher.init();

  const { blockSize } = hasher;
  const keyBuf = calculateKeyBuffer(hasher, key);
  const keyBuffer = new Uint8Array(blockSize);
  keyBuffer.set(keyBuf);

  const opad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    const v = keyBuffer[i];
    opad[i] = v ^ 0x5C;
    keyBuffer[i] = v ^ 0x36;
  }

  hasher.update(keyBuffer);

  const obj: IHasher = {
    init: () => {
      hasher.init();
      hasher.update(keyBuffer);
      return obj;
    },

    update: (data: IDataType) => {
      hasher.update(data);
      return obj;
    },
    digest: ((outputType) => {
      const uintArr = hasher.digest('binary');
      hasher.init();
      hasher.update(opad);
      hasher.update(uintArr);
      return hasher.digest(outputType);
    }) as any,

    blockSize: hasher.blockSize,
    digestSize: hasher.digestSize,
  };
  return obj;
}

export function createHMAC(hasher: IHasher, key: IDataType): IHasher {
  if (!hasher || !hasher.init || !hasher.digestSize) {
    throw new Error('Invalid hash function is provided! Usage: createHMAC(createMD5(), "key").');
  }

  return calculateHmac(hasher, key);
}

export default createHMAC;
