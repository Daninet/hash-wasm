import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';

let wasm: IWASMInterface = null;

export async function md5 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    wasm = await WASMInterface('md5', 16);
  }

  return wasm.hash(data);
}

export async function createMD5() {
  if (!wasm) {
    wasm = await WASMInterface('md5', 16);
    wasm.init();
  }

  return {
    init: wasm.init,
    update: wasm.update,
    digest: wasm.digest,
  };
};
