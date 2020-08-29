/* eslint-disable no-bitwise */
import { IHasher } from './WASMInterface';
import { createHMAC } from './hmac';
import { getDigestHex, getUInt8Buffer, IDataType } from './util';

export interface IPBKDF2Options {
  password: IDataType;
  salt: IDataType;
  iterations: number;
  hashLength: number;
  hashFunction: IHasher;
  outputType?: 'hex' | 'binary';
}

function calculatePBKDF2(
  digest: IHasher, salt: IDataType, iterations: number,
  hashLength: number, outputType?: 'hex' | 'binary',
): Uint8Array | string {
  const DK = new Uint8Array(hashLength);
  const block1 = new Uint8Array(salt.length + 4);
  const block1View = new DataView(block1.buffer);
  const saltBuffer = getUInt8Buffer(salt);
  const saltUIntBuffer = new Uint8Array(
    saltBuffer.buffer, saltBuffer.byteOffset, saltBuffer.length,
  );
  block1.set(saltUIntBuffer);

  let destPos = 0;
  const hLen = digest.digestSize;
  const l = Math.ceil(hashLength / hLen);

  let T: Uint8Array = null;
  let U: Uint8Array = null;

  for (let i = 1; i <= l; i++) {
    block1View.setUint32(salt.length, i);

    digest.init();
    digest.update(block1);
    T = digest.digest('binary');
    U = T.slice();

    for (let j = 1; j < iterations; j++) {
      digest.init();
      digest.update(U);
      U = digest.digest('binary');
      for (let k = 0; k < hLen; k++) {
        T[k] ^= U[k];
      }
    }

    DK.set(T.subarray(0, hashLength - destPos), destPos);
    destPos += hLen;
  }

  if (outputType === 'binary') {
    return DK;
  }

  const digestChars = new Uint8Array(hashLength * 2);
  return getDigestHex(digestChars, DK, hashLength);
}

const validateOptions = (options: IPBKDF2Options) => {
  if (!options || typeof options !== 'object') {
    throw new Error('Invalid options parameter. It requires an object.');
  }

  if (!options.hashFunction || !options.hashFunction.init || !options.hashFunction.digestSize) {
    throw new Error('Invalid hash function is provided! Usage: pbkdf2("password", "salt", 1000, 32, createSHA1()).');
  }

  if (!Number.isInteger(options.iterations) || options.iterations < 1) {
    throw new Error('Iterations should be a positive number');
  }

  if (!Number.isInteger(options.hashLength) || options.hashLength < 1) {
    throw new Error('Hash length should be a positive number');
  }

  if (options.outputType === undefined) {
    options.outputType = 'hex';
  }

  if (!['hex', 'binary'].includes(options.outputType)) {
    throw new Error(`Insupported output type ${options.outputType}. Valid values: ['hex', 'binary']`);
  }
};

export function pbkdf2(options: IPBKDF2Options): Uint8Array | string {
  validateOptions(options);

  const hmac = createHMAC(options.hashFunction, options.password);
  return calculatePBKDF2(
    hmac,
    options.salt,
    options.iterations,
    options.hashLength,
    options.outputType,
  );
}
