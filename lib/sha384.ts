import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/sha512.wasm.json';

let wasm: IWASMInterface = null;

export async function sha384(data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 48);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init(384);
  wasm.update(data);
  return wasm.digest();
}

export async function createSHA384() {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 48);
    if (!wasm) wasm = tempWasm;
  }
  wasm.init();

  return {
    init: () => wasm.init(384),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default sha384;
