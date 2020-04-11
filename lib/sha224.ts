import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/sha256.wasm.json';

let wasm: IWASMInterface = null;

export async function sha224 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 28);
  }

  return wasm.hash(data, 224);
}

export async function createSHA224() {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 28);
    wasm.init();
  }

  return {
    init: () => wasm.init(224),
    update: wasm.update,
    digest: wasm.digest,
  };
};

export default sha224;
