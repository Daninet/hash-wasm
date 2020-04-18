import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/sha3.wasm.json';

type IValidBits = 224 | 256 | 384 | 512;
const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

function validateBits(bits: IValidBits) {
  if (![224, 256, 384, 512].includes(bits)) {
    throw new Error('Invalid variant! Valid values: 224, 256, 384, 512');
  }
}

export async function keccak(
  data: string | Buffer | ITypedArray, bits: IValidBits = 512,
): Promise<string> {
  validateBits(bits);

  if (!wasmCache) {
    const unlock = await mutex.lock();
    wasmCache = await WASMInterface(wasmJson, bits / 8);
    unlock();
  }

  wasmCache.init(bits);
  wasmCache.update(data);
  return wasmCache.digest(0x01);
}

export async function createKeccak(bits: IValidBits = 512) {
  validateBits(bits);

  const wasm = await WASMInterface(wasmJson, bits / 8);
  wasm.init(bits);

  return {
    init: () => wasm.init(bits),
    update: wasm.update,
    digest: () => wasm.digest(0x01),
  };
}

export default keccak;
