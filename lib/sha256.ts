import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/sha256.wasm.json';

let wasm: IWASMInterface = null;

export async function sha256(data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 32);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init(256);
  wasm.update(data);
  return wasm.digest();
}

export async function createSHA256() {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 32);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init(256);

  return {
    init: () => wasm.init(256),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default sha256;
