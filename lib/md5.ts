import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/md5.wasm.json';

let wasm: IWASMInterface = null;

export async function md5(data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 16);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init();
  wasm.update(data);
  return wasm.digest();
}

export async function createMD5() {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 16);
    if (!wasm) wasm = tempWasm;
  }
  wasm.init();

  return {
    init: () => wasm.init(),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
}

export default md5;
