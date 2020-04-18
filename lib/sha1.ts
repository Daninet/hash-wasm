import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha1.wasm.json';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export async function sha1(data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasmCache) {
    const unlock = await mutex.lock();
    wasmCache = await WASMInterface(wasmJson, 20);
    unlock();
  }

  wasmCache.init();
  wasmCache.update(data);
  return wasmCache.digest();
}

export async function createSHA1() {
  const wasm = await WASMInterface(wasmJson, 20);
  wasm.init();

  return {
    init: () => wasm.init(),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default sha1;
