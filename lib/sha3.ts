import WASMInterface, { IWASMInterface, IHasher } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha3.wasm.json';
import lockedCreate from './lockedCreate';
import { IDataType } from './util';

type IValidBits = 224 | 256 | 384 | 512;
const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

function validateBits(bits: IValidBits) {
  if (![224, 256, 384, 512].includes(bits)) {
    return new Error('Invalid variant! Valid values: 224, 256, 384, 512');
  }
  return null;
}

export function sha3(
  data: IDataType, bits: IValidBits = 512,
): Promise<string> {
  if (validateBits(bits)) {
    return Promise.reject(validateBits(bits));
  }

  const hashLength = bits / 8;

  if (wasmCache === null || wasmCache.hashLength !== hashLength) {
    return lockedCreate(mutex, wasmJson, hashLength)
      .then((wasm) => {
        wasmCache = wasm;
        return wasmCache.calculate(data, bits, 0x06);
      });
  }

  try {
    const hash = wasmCache.calculate(data, bits, 0x06);
    return Promise.resolve(hash);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createSHA3(bits: IValidBits = 512): Promise<IHasher> {
  if (validateBits(bits)) {
    return Promise.reject(validateBits(bits));
  }

  const outputSize = bits / 8;

  return WASMInterface(wasmJson, outputSize).then((wasm) => {
    wasm.init(bits);
    return {
      init: () => wasm.init(bits),
      update: wasm.update,
      digest: () => wasm.digest(0x06),
      blockSize: 200 - 2 * outputSize,
      digestSize: outputSize,
    };
  });
}

export default sha3;
