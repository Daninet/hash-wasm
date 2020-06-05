import WASMInterface, { ITypedArray, IWASMInterface, IHasher } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha512.wasm.json';
import lockedCreate from './lockedCreate';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export function sha384(data: string | Buffer | ITypedArray): Promise<string> {
  if (wasmCache === null) {
    return lockedCreate(mutex, wasmJson, 48)
      .then((wasm) => {
        wasmCache = wasm;
        return wasmCache.calculate(data, 384);
      });
  }

  try {
    const hash = wasmCache.calculate(data, 384);
    return Promise.resolve(hash);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createSHA384(): Promise<IHasher> {
  return WASMInterface(wasmJson, 48).then((wasm) => {
    wasm.init(384);
    return {
      init: () => wasm.init(384),
      update: wasm.update,
      digest: () => wasm.digest(),
      blockSize: 128,
    };
  });
}

export default sha384;
