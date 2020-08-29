import WASMInterface, { IWASMInterface, IHasher } from './WASMInterface';
import wasmJson from '../wasm/xxhash32.wasm.json';
import { IDataType } from './util';

let cachedInstance: IWASMInterface = null;

function validateSeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) {
    return new Error('Seed must be a valid 32-bit long unsigned integer.');
  }
  return null;
}

export function xxhash32(data: IDataType, seed = 0): string {
  if (validateSeed(seed)) {
    throw validateSeed(seed);
  }

  if (cachedInstance === null) {
    cachedInstance = WASMInterface(wasmJson, 4);
  }

  const hash = cachedInstance.calculate(data, seed);
  return hash;
}

export function createXXHash32(seed = 0): IHasher {
  if (validateSeed(seed)) {
    throw validateSeed(seed);
  }

  const wasm = WASMInterface(wasmJson, 4);
  wasm.init(seed);
  const obj: IHasher = {
    init: () => { wasm.init(seed); return obj; },
    update: (data) => { wasm.update(data); return obj; },
    digest: (outputType) => wasm.digest(outputType) as any,
    blockSize: 16,
    digestSize: 4,
  };
  return obj;
}

export default xxhash32;
