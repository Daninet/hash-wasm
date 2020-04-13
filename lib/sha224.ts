import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/sha256.wasm.json';

let wasm: IWASMInterface = null;

export async function sha224 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 28);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init(224);
  wasm.update(data);
  return wasm.digest();
}

export async function createSHA224() {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 28);
    if (!wasm) wasm = tempWasm;
  }
  wasm.init();

  return {
    init: () => wasm.init(224),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
};

export default sha224;
