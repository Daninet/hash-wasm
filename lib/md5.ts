import WASMInterface, { IWASMInterface, IHasher } from './WASMInterface';
import wasmJson from '../wasm/md5.wasm.json';
import { IDataType } from './util';

let cachedInstance: IWASMInterface = null;

export function md5(data: IDataType): string {
  if (cachedInstance === null) {
    cachedInstance = WASMInterface(wasmJson, 16);
  }

  const hash = cachedInstance.calculate(data);
  return hash;
}

export function createMD5(): IHasher {
  const wasm = WASMInterface(wasmJson, 16);
  wasm.init();
  const obj: IHasher = {
    init: () => { wasm.init(); return obj; },
    update: (data) => { wasm.update(data); return obj; },
    digest: (outputType) => wasm.digest(outputType) as any,
    blockSize: 64,
    digestSize: 16,
  };
  return obj;
}

export default md5;
