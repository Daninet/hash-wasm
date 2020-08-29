import { WASMInterface, IWASMInterface, IHasher } from './WASMInterface';
import wasmJson from '../wasm/sha256.wasm.json';
import { IDataType } from './util';

let cachedInstance: IWASMInterface = null;

export function sha256(data: IDataType): string {
  if (cachedInstance === null) {
    cachedInstance = WASMInterface(wasmJson, 32);
  }

  const hash = cachedInstance.calculate(data, 256);
  return hash;
}

export function createSHA256(): IHasher {
  const wasm = WASMInterface(wasmJson, 32);
  wasm.init(256);
  const obj: IHasher = {
    init: () => { wasm.init(256); return obj; },
    update: (data) => { wasm.update(data); return obj; },
    digest: (outputType) => wasm.digest(outputType) as any,
    blockSize: 64,
    digestSize: 32,
  };
  return obj;
}
