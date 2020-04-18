import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/xxhash32.wasm.json';

let wasm: IWASMInterface = null;

function validateSeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) {
    throw new Error('Seed must be a valid 32-bit long unsigned integer.');
  }
}

export async function xxhash32(
  data: string | Buffer | ITypedArray, seed = 0,
): Promise<string> {
  validateSeed(seed);

  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 4);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init(seed);
  wasm.update(data);
  return wasm.digest();
}

export async function createXXHash32(seed = 0) {
  validateSeed(seed);

  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 4);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init(seed);

  return {
    init: () => wasm.init(seed),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default xxhash32;
