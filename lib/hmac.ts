/* eslint-disable no-bitwise */
import { ITypedArray, IHasher } from './WASMInterface';

type IInput = string | Buffer | ITypedArray;

function calculateKeyBuffer(hasher: IHasher, key: IInput): Uint8Array {
  const { blockSize } = hasher;

  const buf = Buffer.from(key);

  if (buf.length > blockSize) {
    hasher.update(buf);
    const hashBuf = Buffer.from(hasher.digest(), 'hex');
    hasher.init();
    return new Uint8Array(hashBuf.buffer, hashBuf.byteOffset, hashBuf.length);
  }

  return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
}

function calculateHmac(hasher: IHasher, key: IInput): IHasher {
  hasher.init();

  const { blockSize } = hasher;
  const keyBuf = calculateKeyBuffer(hasher, key);

  const keyBuffer = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  keyBuffer.set(keyBuf);

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
      const h = hasher.digest();
      hasher.init();
      hasher.update(opad);
      hasher.update(Buffer.from(h, 'hex'));
      return hasher.digest();
    },

    blockSize: hasher.blockSize,
  };
}

export function createHMAC(hash: Promise<IHasher>, key: IInput): Promise<IHasher> {
  if (!hash || !hash.then) {
    throw new Error('Invalid hash function is provided! Usage: createHMAC(createMD5(), "key").');
  }

  return hash.then((hasher) => {
    if (!hasher.blockSize) {
      throw new Error('Invalid hash function is provided! Usage: createHMAC(createMD5(), "key").');
    }
    return calculateHmac(hasher, key);
  });
}

export default createHMAC;
