import WASMInterface, { IWASMInterface, IHasher } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha256.wasm.json';
import lockedCreate from './lockedCreate';
import { ITypedArray } from './util';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export function sha256(data: string | Buffer | ITypedArray): Promise<string> {
  if (wasmCache === null) {
    return lockedCreate(mutex, wasmJson, 32)
      .then((wasm) => {
        wasmCache = wasm;
        return wasmCache.calculate(data, 256);
      });
  }

  try {
    const hash = wasmCache.calculate(data, 256);
    return Promise.resolve(hash);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createSHA256(): Promise<IHasher> {
  return WASMInterface(wasmJson, 32).then((wasm) => {
    wasm.init(256);
    return {
      init: () => wasm.init(256),
      update: wasm.update,
      digest: () => wasm.digest(),
      blockSize: 64,
      digestSize: 32,
    };
  });
}

export default sha256;
