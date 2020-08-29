import WASMInterface, { IWASMInterface, IHasher } from './WASMInterface';
import wasmJson from '../wasm/sha1.wasm.json';
import { IDataType } from './util';

let cachedInstance: IWASMInterface = null;

export function sha1(data: IDataType): string {
  if (cachedInstance === null) {
    cachedInstance = WASMInterface(wasmJson, 20);
  }

  const hash = cachedInstance.calculate(data);
  return hash;
}

export function createSHA1(): IHasher {
  const wasm = WASMInterface(wasmJson, 20);
  wasm.init();
  const obj: IHasher = {
    init: () => { wasm.init(); return obj; },
    update: (data) => { wasm.update(data); return obj; },
    digest: (outputType) => wasm.digest(outputType) as any,
    blockSize: 64,
    digestSize: 20,
  };
  return obj;
}

export default sha1;
