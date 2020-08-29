import { WASMInterface, IWASMInterface, IHasher } from './WASMInterface';
import wasmJson from '../wasm/sha256.wasm.json';
import { IDataType } from './util';

let cachedInstance: IWASMInterface = null;

export function sha224(data: IDataType): string {
  if (cachedInstance === null) {
    cachedInstance = WASMInterface(wasmJson, 28);
  }

  const hash = cachedInstance.calculate(data, 224);
  return hash;
}

export function createSHA224(): IHasher {
  const wasm = WASMInterface(wasmJson, 28);
  wasm.init(224);
  const obj: IHasher = {
    init: () => { wasm.init(224); return obj; },
    update: (data) => { wasm.update(data); return obj; },
    digest: (outputType) => wasm.digest(outputType) as any,
    blockSize: 64,
    digestSize: 28,
  };
  return obj;
}
