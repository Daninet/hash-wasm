import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/md4.wasm.json';

let wasm: IWASMInterface = null;

export async function md4 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 16);
  }

  return wasm.hash(data);
}

export async function createMD4() {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 16);
    wasm.init();
  }

  return {
    init: () => wasm.init(),
    update: wasm.update,
    digest: wasm.digest,
  };
};

export default md4;
