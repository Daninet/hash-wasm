import WASMInterface, { ITypedArray, IWASMInterface, IHasher } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/xxhash32.wasm.json';
import lockedCreate from './lockedCreate';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

function validateSeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) {
    return new Error('Seed must be a valid 32-bit long unsigned integer.');
  }
  return null;
}

export function xxhash32(
  data: string | Buffer | ITypedArray, seed = 0,
): Promise<string> {
  if (validateSeed(seed)) {
    return Promise.reject(validateSeed(seed));
  }

  if (wasmCache === null) {
    return lockedCreate(mutex, wasmJson, 4)
      .then((wasm) => {
        wasmCache = wasm;
        return wasmCache.calculate(data, seed);
      });
  }

  try {
    const hash = wasmCache.calculate(data, seed);
    return Promise.resolve(hash);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createXXHash32(seed = 0): Promise<IHasher> {
  if (validateSeed(seed)) {
    return Promise.reject(validateSeed(seed));
  }

  return WASMInterface(wasmJson, 4).then((wasm) => {
    wasm.init(seed);
    return {
      init: () => wasm.init(seed),
      update: wasm.update,
      digest: () => wasm.digest(),
      blockSize: 16,
      digestSize: 4,
    };
  });
}

export default xxhash32;
