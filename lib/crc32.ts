import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';
import wasmJson from '../wasm/crc32.wasm.json';

let wasm: IWASMInterface = null;

export async function crc32 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 4);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init();
  wasm.update(data);
  return wasm.digest();
}

export async function createCRC32() {
  if (!wasm) {
    const tempWasm = await WASMInterface(wasmJson, 4);
    if (!wasm) wasm = tempWasm;
  }

  wasm.init();

  return {
    init: () => wasm.init(),
    update: wasm.update,
    digest: () => wasm.digest(),
  };
};

export default crc32;
