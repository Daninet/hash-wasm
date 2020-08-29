import { WASMInterface, IWASMInterface, IHasher } from './WASMInterface';
import wasmJson from '../wasm/sha512.wasm.json';
import { IDataType } from './util';

let cachedInstance: IWASMInterface = null;

export function sha512(data: IDataType): string {
  if (cachedInstance === null) {
    cachedInstance = WASMInterface(wasmJson, 64);
  }

  const hash = cachedInstance.calculate(data, 512);
  return hash;
}

export function createSHA512(): IHasher {
  const wasm = WASMInterface(wasmJson, 64);
  wasm.init(512);
  const obj: IHasher = {
    init: () => { wasm.init(512); return obj; },
    update: (data) => { wasm.update(data); return obj; },
    digest: (outputType) => wasm.digest(outputType) as any,
    blockSize: 128,
    digestSize: 64,
  };
  return obj;
}
