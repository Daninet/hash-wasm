import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';

let wasm: IWASMInterface = null;

export async function crc32 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    wasm = await WASMInterface('crc32', 4);
  }

  return wasm.hash(data);
}

export async function createCRC32() {
  if (!wasm) {
    wasm = await WASMInterface('crc32', 4);
    wasm.init();
  }

  return {
    init: wasm.init,
    update: wasm.update,
    digest: wasm.digest,
  };
};
