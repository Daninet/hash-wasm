import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/sha256.wasm.json';

let wasm: IWASMInterface = null;

export async function sha256 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 32);
  }

  return wasm.hash(data, 256);
}

export async function createSHA256() {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 32);
    wasm.init();
  }

  return {
    init: () => wasm.init(256),
    update: wasm.update,
    digest: wasm.digest,
  };
};

export default sha256;
