/* eslint-disable no-bitwise */
import { IHasher } from './WASMInterface';
import { writeHexToUInt8, ITypedArray } from './util';

type IInput = string | Buffer | ITypedArray;

function calculateKeyBuffer(hasher: IHasher, key: IInput): Uint8Array {
  const { blockSize } = hasher;

  const buf = Buffer.from(key);

  if (buf.length > blockSize) {
    hasher.update(buf);
    const uintArr = new Uint8Array(hasher.digestSize);
    writeHexToUInt8(uintArr, hasher.digest());
    hasher.init();
    return uintArr;
  }

  return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
}

function calculateHmac(hasher: IHasher, key: IInput): IHasher {
  hasher.init();

  const { blockSize, digestSize } = hasher;
  const keyBuf = calculateKeyBuffer(hasher, key);
  const keyBuffer = new Uint8Array(blockSize);
  keyBuffer.set(keyBuf);

  const h = new Uint8Array(digestSize);
  const opad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    const v = keyBuffer[i];
    opad[i] = v ^ 0x5C;
    keyBuffer[i] = v ^ 0x36;
  }

  hasher.update(keyBuffer);

  return {
    init: () => {
      hasher.init();
      hasher.update(keyBuffer);
    },

    update: (data: IInput) => {
      hasher.update(data);
    },

    digest: () => {
      writeHexToUInt8(h, hasher.digest());
      hasher.init();
      hasher.update(opad);
      hasher.update(h);
      return hasher.digest();
    },

    blockSize: hasher.blockSize,
    digestSize: hasher.digestSize,
  };
}

export function createHMAC(hash: Promise<IHasher>, key: IInput): Promise<IHasher> {
  if (!hash || !hash.then) {
    throw new Error('Invalid hash function is provided! Usage: createHMAC(createMD5(), "key").');
  }

  return hash.then((hasher) => calculateHmac(hasher, key));
}

export default createHMAC;
