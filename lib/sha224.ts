import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha256.wasm.json';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export async function sha224(data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasmCache) {
    const unlock = await mutex.lock();
    wasmCache = await WASMInterface(wasmJson, 28);
    unlock();
  }

  wasmCache.init(224);
  wasmCache.update(data);
  return wasmCache.digest();
}

export async function createSHA224() {
  const wasm = await WASMInterface(wasmJson, 28);
  wasm.init(224);

  return {
    init: () => wasm.init(224),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default sha224;
