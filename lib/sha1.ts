import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/sha1.wasm.json';

let wasm: IWASMInterface = null;

export async function sha1 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 20);
  }

  return wasm.hash(data);
}

export async function createSHA1() {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 20);
    wasm.init();
  }

  return {
    init: wasm.init,
    update: wasm.update,
    digest: wasm.digest,
  };
};

export default sha1;
