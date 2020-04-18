import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/xxhash64.wasm.json';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;
const seedBuffer = new ArrayBuffer(8);

function validateSeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) {
    throw new Error('Seed must be given as two valid 32-bit long unsigned integer (lo + high).');
  }
}

function writeSeed(low: number, high: number) {
  // write in little-endian format
  const buffer = new DataView(seedBuffer);
  buffer.setUint32(0, low, true);
  buffer.setUint32(4, high, true);
}

export async function xxhash64(
  data: string | Buffer | ITypedArray, seedLow = 0, seedHigh = 0,
): Promise<string> {
  validateSeed(seedLow);
  validateSeed(seedHigh);

  if (!wasmCache) {
    const unlock = await mutex.lock();
    wasmCache = await WASMInterface(wasmJson, 8);
    unlock();
  }

  writeSeed(seedLow, seedHigh);
  wasmCache.writeMemory(new Uint32Array(seedBuffer));
  wasmCache.init();
  wasmCache.update(data);
  return wasmCache.digest();
}

export async function createXXHash64(seedLow = 0, seedHigh = 0) {
  validateSeed(seedLow);
  validateSeed(seedHigh);

  const wasm = await WASMInterface(wasmJson, 8);
  writeSeed(seedLow, seedHigh);

  wasm.writeMemory(new Uint32Array(seedBuffer));
  wasm.init();

  return {
    init: () => {
      wasm.writeMemory(new Uint32Array(seedBuffer));
      wasm.init();
    },
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default xxhash64;
