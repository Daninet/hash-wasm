import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha512.wasm.json';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export async function sha512(data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasmCache) {
    const unlock = await mutex.lock();
    wasmCache = await WASMInterface(wasmJson, 64);
    unlock();
  }

  wasmCache.init(512);
  wasmCache.update(data);
  return wasmCache.digest();
}

export async function createSHA512() {
  const wasm = await WASMInterface(wasmJson, 64);
  wasm.init(512);

  return {
    init: () => wasm.init(512),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default sha512;
