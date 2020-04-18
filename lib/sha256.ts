import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha256.wasm.json';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export async function sha256(data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasmCache) {
    const unlock = await mutex.lock();
    wasmCache = await WASMInterface(wasmJson, 32);
    unlock();
  }

  wasmCache.init(256);
  wasmCache.update(data);
  return wasmCache.digest();
}

export async function createSHA256() {
  const wasm = await WASMInterface(wasmJson, 32);
  wasm.init(256);

  return {
    init: () => wasm.init(256),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default sha256;
