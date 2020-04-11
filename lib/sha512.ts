import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/sha512.wasm.json';

let wasm: IWASMInterface = null;

export async function sha512 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 64);
  }

  return wasm.hash(data);
}

export async function createSHA512() {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 64);
    wasm.init();
  }

  return {
    init: () => wasm.init(),
    update: wasm.update,
    digest: wasm.digest,
  };
};

export default sha512;
