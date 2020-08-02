/* eslint-disable no-bitwise */
import { IHasher } from './WASMInterface';
import createHMAC from './hmac';
import { getDigestHex, getUInt8Buffer, IDataType } from './util';

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

export async function pbkdf2(
  password: IDataType, salt: IDataType, iterations: number,
  hashLength: number, digest: Promise<IHasher>, outputType?: 'hex' | 'binary',
): Promise<Uint8Array | string> {
  if (!digest || !digest.then) {
    throw new Error('Invalid hash function is provided! Usage: pbkdf2("password", "salt", 1000, 32, createSHA1()).');
  }

  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error('Iterations should be a positive number');
  }

  if (!Number.isInteger(hashLength) || hashLength < 1) {
    throw new Error('Hash length should be a positive number');
  }

  if (outputType === undefined) {
    outputType = 'hex';
  }

  if (!['hex', 'binary'].includes(outputType)) {
    throw new Error(`Insupported output type ${outputType}. Valid values: ['hex', 'binary']`);
  }

  const hmac = await createHMAC(digest, password);
  return calculatePBKDF2(hmac, salt, iterations, hashLength, outputType);
}

export default pbkdf2;
