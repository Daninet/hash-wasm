import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha1.wasm.json';
import lockedCreate from './lockedCreate';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export function sha1(data: string | Buffer | ITypedArray): Promise<string> {
  if (wasmCache === null) {
    return lockedCreate(mutex, wasmJson, 20)
      .then((wasm) => {
        wasmCache = wasm;
        wasmCache.init();
        wasmCache.update(data);
        return wasmCache.digest();
      });
  }

  try {
    wasmCache.init();
    wasmCache.update(data);
    return Promise.resolve(wasmCache.digest());
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createSHA1() {
  return WASMInterface(wasmJson, 20).then((wasm) => {
    wasm.init();
    return {
      init: () => wasm.init(),
      update: wasm.update,
      digest: () => wasm.digest(),
    };
  });
}

export default sha1;
