import WASMInterface, { IWASMInterface, IHasher } from './WASMInterface';
import wasmJson from '../wasm/xxhash64.wasm.json';
import { IDataType } from './util';

let cachedInstance: IWASMInterface = null;
const seedBuffer = new ArrayBuffer(8);

function validateSeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) {
    return new Error('Seed must be given as two valid 32-bit long unsigned integer (lo + high).');
  }
  return null;
}

function writeSeed(low: number, high: number) {
  // write in little-endian format
  const buffer = new DataView(seedBuffer);
  buffer.setUint32(0, low, true);
  buffer.setUint32(4, high, true);
}

export function xxhash64(data: IDataType, seedLow = 0, seedHigh = 0): string {
  if (validateSeed(seedLow)) {
    throw validateSeed(seedLow);
  }

  if (validateSeed(seedHigh)) {
    throw validateSeed(seedHigh);
  }

  if (cachedInstance === null) {
    cachedInstance = WASMInterface(wasmJson, 8);
  }

  writeSeed(seedLow, seedHigh);
  cachedInstance.writeMemory(new Uint8Array(seedBuffer));
  const hash = cachedInstance.calculate(data);
  return hash;
}

export function createXXHash64(seedLow = 0, seedHigh = 0): IHasher {
  if (validateSeed(seedLow)) {
    throw validateSeed(seedLow);
  }

  if (validateSeed(seedHigh)) {
    throw validateSeed(seedHigh);
  }

  const wasm = WASMInterface(wasmJson, 8);
  writeSeed(seedLow, seedHigh);
  wasm.writeMemory(new Uint8Array(seedBuffer));
  wasm.init();
  const obj: IHasher = {
    init: () => {
      wasm.writeMemory(new Uint8Array(seedBuffer));
      wasm.init();
      return obj;
    },
    update: (data) => { wasm.update(data); return obj; },
    digest: (outputType) => wasm.digest(outputType) as any,
    blockSize: 32,
    digestSize: 8,
  };
  return obj;
}

export default xxhash64;
