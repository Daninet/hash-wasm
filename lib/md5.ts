import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/md5.wasm.json';

let wasm: IWASMInterface = null;

export async function md5 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 16);
  }

  return wasm.hash(data);
}

export async function createMD5() {
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

export default md5;
