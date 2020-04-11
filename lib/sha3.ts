import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/sha3.wasm.json';

type IValidBits = 224 | 256 | 384 | 512;
let wasm: IWASMInterface = null;

function validateBits (bits: IValidBits) {
  if (![224, 256, 384, 512].includes(bits)) {
    throw new Error('Invalid variant! Valid values: 224, 256, 384, 512');
  }
}

export async function sha3 (data: string | Buffer | ITypedArray, bits: IValidBits = 512): Promise<string> {
  validateBits(bits);

  if (!wasm) {
    wasm = await WASMInterface(wasmJson, bits / 8);
  }

  return wasm.hash(data, bits);
}

export async function createSHA3(bits: IValidBits = 512) {
  validateBits(bits);

  if (!wasm) {
    wasm = await WASMInterface(wasmJson, bits / 8);
    wasm.init();
  }

  return {
    init: () => wasm.init(bits),
    update: wasm.update,
    digest: wasm.digest,
  };
};

export default sha3;
