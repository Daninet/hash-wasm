import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/sha1.wasm.json';

let wasm: IWASMInterface = null;

export async function sha1 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 20);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init();
  wasm.update(data);
  return wasm.digest();
}

export async function createSHA1() {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 20);
    if (!wasm) wasm = tempWasm;
  }
  wasm.init();

  return {
    init: () => wasm.init(),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
};

export default sha1;
