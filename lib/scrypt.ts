import {
  getDigestHex, getUInt8Buffer, IDataType, writeHexToUInt8,
} from './util';
import { WASMInterface } from './WASMInterface';
import wasmJson from '../wasm/scrypt.wasm.json';
import { pbkdf2 } from './pbkdf2';
import { createSHA256 } from './sha256';

export interface ScryptOptions {
  password: IDataType;
  salt: IDataType;
  costFactor: number;
  blockSizeFactor: number;
  parallelizationFactor: number;
  hashLength: number;
  outputType?: 'hex' | 'binary' | 'encoded';
}

// function encodeResult(salt: Uint8Array, options: ScryptOptions, res: Uint8Array): string {
//   const parameters = [
//     `m=${options.memorySize}`,
//     `t=${options.iterations}`,
//     `p=${options.parallelism}`,
//   ].join(',');

//   return `$argon2${options.hashType}$v=19$${parameters}$${encodeBase64(salt, false)}$${encodeBase64(res, false)}`;
// }

// const uint32View = new DataView(new ArrayBuffer(4));
// function int32LE(x: number): Uint8Array {
//   uint32View.setInt32(0, x, true);
//   return new Uint8Array(uint32View.buffer);
// }

async function scryptInternal(options: ScryptOptions): Promise<string | Uint8Array> {
  const {
    costFactor, blockSizeFactor, parallelizationFactor, hashLength,
  } = options;
  const SHA256Hasher = createSHA256();

  const blockData = await pbkdf2({
    password: options.password,
    salt: options.salt,
    iterations: 1,
    hashLength: 128 * blockSizeFactor * parallelizationFactor,
    hashFunction: SHA256Hasher,
    outputType: 'binary',
  }) as Uint8Array;

  const scryptInterface = await WASMInterface(wasmJson, 0);

  // last block is for storing the temporary vectors
  const VSize = 128 * blockSizeFactor * costFactor;
  const XYSize = 256 * blockSizeFactor;
  scryptInterface.setMemorySize(blockData.length + VSize + XYSize);
  scryptInterface.writeMemory(blockData, 0);

  // mix blocks
  scryptInterface.getExports().scrypt(blockSizeFactor, costFactor, parallelizationFactor);

  const expensiveSalt =
    scryptInterface.getMemory().subarray(0, 128 * blockSizeFactor * parallelizationFactor);

  const outputData = await pbkdf2({
    password: options.password,
    salt: expensiveSalt,
    iterations: 1,
    hashLength,
    hashFunction: SHA256Hasher,
    outputType: 'binary',
  }) as Uint8Array;

  if (options.outputType === 'hex') {
    const digestChars = new Uint8Array(hashLength * 2);
    return getDigestHex(digestChars, outputData, hashLength);
  }

  // if (options.outputType === 'encoded') {
  //   return encodeResult(salt, options, res);
  // }

  // return binary format
  return outputData;
}

const validateOptions = (options: ScryptOptions) => {
  if (!options || typeof options !== 'object') {
    throw new Error('Invalid options parameter. It requires an object.');
  }

  if (options.outputType === undefined) {
    options.outputType = 'hex';
  }

  if (!['hex', 'binary', 'encoded'].includes(options.outputType)) {
    throw new Error(`Insupported output type ${options.outputType}. Valid values: ['hex', 'binary', 'encoded']`);
  }
};

export const scrypt = async (options: ScryptOptions): Promise<string | Uint8Array> => {
  validateOptions(options);

  return scryptInternal(options);
};
