import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha512.wasm.json';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export async function sha384(data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasmCache) {
    const unlock = await mutex.lock();
    wasmCache = await WASMInterface(wasmJson, 48);
    unlock();
  }

  wasmCache.init(384);
  wasmCache.update(data);
  return wasmCache.digest();
}

export async function createSHA384() {
  const wasm = await WASMInterface(wasmJson, 48);
  wasm.init(384);

  return {
    init: () => wasm.init(384),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default sha384;
