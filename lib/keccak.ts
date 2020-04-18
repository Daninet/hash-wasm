import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/sha3.wasm.json';

type IValidBits = 224 | 256 | 384 | 512;
let wasm: IWASMInterface = null;

function validateBits(bits: IValidBits) {
  if (![224, 256, 384, 512].includes(bits)) {
    throw new Error('Invalid variant! Valid values: 224, 256, 384, 512');
  }
}

export async function keccak(
  data: string | Buffer | ITypedArray, bits: IValidBits = 512,
): Promise<string> {
  validateBits(bits);

  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, bits / 8);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init(bits);
  wasm.update(data);
  return wasm.digest(0x01);
}

export async function createKeccak(bits: IValidBits = 512) {
  validateBits(bits);

  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, bits / 8);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init(bits);

  return {
    init: () => wasm.init(bits),
    update: wasm.update,
    digest: () => wasm.digest(0x01),
  };
}

export default keccak;
