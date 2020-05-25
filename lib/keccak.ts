import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha3.wasm.json';
import lockedCreate from './lockedCreate';

type IValidBits = 224 | 256 | 384 | 512;
const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

function validateBits(bits: IValidBits) {
  if (![224, 256, 384, 512].includes(bits)) {
    return new Error('Invalid variant! Valid values: 224, 256, 384, 512');
  }

  return null;
}

export function keccak(
  data: string | Buffer | ITypedArray, bits: IValidBits = 512,
): Promise<string> {
  if (validateBits(bits)) {
    return Promise.reject(validateBits(bits));
  }

  if (wasmCache === null) {
    return lockedCreate(mutex, wasmJson, bits / 8)
      .then((wasm) => {
        wasmCache = wasm;
        return wasmCache.calculate(data, bits, 0x01);
      });
  }

  try {
    const hash = wasmCache.calculate(data, bits, 0x01);
    return Promise.resolve(hash);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createKeccak(bits: IValidBits = 512) {
  if (validateBits(bits)) {
    return Promise.reject(validateBits(bits));
  }

  return WASMInterface(wasmJson, bits / 8).then((wasm) => {
    wasm.init(bits);
    return {
      init: () => wasm.init(bits),
      update: wasm.update,
      digest: () => wasm.digest(0x01),
    };
  });
}

export default keccak;
