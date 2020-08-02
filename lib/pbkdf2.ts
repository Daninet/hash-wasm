/* eslint-disable no-bitwise */
import { IHasher } from './WASMInterface';
import createHMAC from './hmac';
import { IDataType } from './util';

function calculatePBKDF2(
  digest: IHasher, salt: IDataType, iterations: number, keyLength: number,
): string {
  const DK = new Uint8Array(keyLength);
  const block1 = new Uint8Array(salt.length + 4);
  const block1View = new DataView(block1.buffer);
  const saltBuffer = Buffer.from(salt);
  const saltUIntBuffer = new Uint8Array(
    saltBuffer.buffer, saltBuffer.byteOffset, saltBuffer.length,
  );
  block1.set(saltUIntBuffer);

  let destPos = 0;
  const hLen = digest.digestSize;
  const l = Math.ceil(keyLength / hLen);

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

    DK.set(T.subarray(0, keyLength - destPos), destPos);
    destPos += hLen;
  }

  return Buffer.from(DK).toString('hex');
}

export async function pbkdf2(
  password: IDataType, salt: IDataType, iterations: number,
  keyLength: number, digest: Promise<IHasher>,
): Promise<string> {
  if (!digest || !digest.then) {
    throw new Error('Invalid hash function is provided! Usage: pbkdf2("password", "salt", 1000, 32, createSHA1()).');
  }

  const hmac = await createHMAC(digest, password);
  return calculatePBKDF2(hmac, salt, iterations, keyLength);
}

export default pbkdf2;
