import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/crc32.wasm.json';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export async function crc32(data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasmCache) {
    const unlock = await mutex.lock();
    wasmCache = await WASMInterface(wasmJson, 4);
    unlock();
  }

  wasmCache.init();
  wasmCache.update(data);
  return wasmCache.digest();
}

export async function createCRC32() {
  const wasm = await WASMInterface(wasmJson, 4);
  wasm.init();

  return {
    init: () => wasm.init(),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default crc32;
