import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/crc32.wasm.json';

let wasm: IWASMInterface = null;

export async function crc32 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 4);
  }

  wasm.init();
  wasm.update(data);
  return wasm.digest();
}

export async function createCRC32() {
  if (!wasm) {
    wasm = await WASMInterface(wasmJson, 4);
    wasm.init();
  }

  return {
    init: () => wasm.init(),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
};

export default crc32;
