import WASMInterface, { ITypedArray, IWASMInterface } from './WASMInterface';

let wasm: IWASMInterface = null;

export async function md4 (data: string | Buffer | ITypedArray): Promise<string> {
  if (!wasm) {
    wasm = await WASMInterface('md4', 16);
  }

  return wasm.hash(data);
}

export async function createMD4() {
  if (!wasm) {
    wasm = await WASMInterface('md4', 16);
    wasm.init();
  }

  return {
    init: wasm.init,
    update: wasm.update,
    digest: wasm.digest,
  };
};
