import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/xxhash32.wasm.json';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

function validateSeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) {
    throw new Error('Seed must be a valid 32-bit long unsigned integer.');
  }
}

export async function xxhash32(
  data: string | Buffer | ITypedArray, seed = 0,
): Promise<string> {
  validateSeed(seed);

  if (!wasmCache) {
    const unlock = await mutex.lock();
    wasmCache = await WASMInterface(wasmJson, 4);
    unlock();
  }

  wasmCache.init(seed);
  wasmCache.update(data);
  return wasmCache.digest();
}

export async function createXXHash32(seed = 0) {
  validateSeed(seed);

  const wasm = await WASMInterface(wasmJson, 4);
  wasm.init(seed);

  return {
    init: () => wasm.init(seed),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default xxhash32;
