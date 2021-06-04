import { WASMInterface, IWASMInterface, IHasher } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sm3.wasm.json';
import lockedCreate from './lockedCreate';
import { IDataType } from './util';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

/**
 * Calculates SM3 hash
 * @param data Input data (string, Buffer or TypedArray)
 * @returns Computed hash as a hexadecimal string
 */
export function sm3(data: IDataType): Promise<string> {
  if (wasmCache === null) {
    return lockedCreate(mutex, wasmJson, 32)
      .then((wasm) => {
        wasmCache = wasm;
        return wasmCache.calculate(data);
      });
  }

  try {
    const hash = wasmCache.calculate(data);
    return Promise.resolve(hash);
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Creates a new SM3 hash instance
 */
export function createSM3(): Promise<IHasher> {
  return WASMInterface(wasmJson, 32).then((wasm) => {
    wasm.init();
    const obj: IHasher = {
      init: () => { wasm.init(); return obj; },
      update: (data) => { wasm.update(data); return obj; },
      digest: (outputType) => wasm.digest(outputType) as any,
      save: () => wasm.save(),
      load: (data) => { wasm.load(data); return obj; },
      blockSize: 64,
      digestSize: 32,
    };
    return obj;
  });
}
