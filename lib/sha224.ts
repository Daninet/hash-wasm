import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha256.wasm.json';
import lockedCreate from './lockedCreate';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export function sha224(data: string | Buffer | ITypedArray): Promise<string> {
  if (wasmCache === null) {
    return lockedCreate(mutex, wasmJson, 28)
      .then((wasm) => {
        wasmCache = wasm;
        wasmCache.init(224);
        wasmCache.update(data);
        return wasmCache.digest();
      });
  }

  try {
    wasmCache.init(224);
    wasmCache.update(data);
    return Promise.resolve(wasmCache.digest());
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createSHA224() {
  return WASMInterface(wasmJson, 28).then((wasm) => {
    wasm.init(224);
    return {
      init: () => wasm.init(224),
      update: wasm.update,
      digest: () => wasm.digest(),
    };
  });
}

export default sha224;
