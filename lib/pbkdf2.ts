/* eslint-disable no-bitwise */
import { IHasher } from './WASMInterface';
import createHMAC from './hmac';
import { writeHexToUInt8, IDataType } from './util';

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

  const T = new Uint8Array(hLen);
  const U = new Uint8Array(hLen);

  for (let i = 1; i <= l; i++) {
    block1View.setUint32(salt.length, i);

    digest.init();
    digest.update(block1);
    writeHexToUInt8(T, digest.digest());
    U.set(T);

    for (let j = 1; j < iterations; j++) {
      digest.init();
      digest.update(U);
      writeHexToUInt8(U, digest.digest());
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
