import WASMInterface, { IWASMInterface, IHasher } from './WASMInterface';
import wasmJson from '../wasm/crc32.wasm.json';
import { IDataType } from './util';

let cachedInstance: IWASMInterface = null;

export function crc32(data: IDataType): string {
  if (cachedInstance === null) {
    cachedInstance = WASMInterface(wasmJson, 4);
  }

  const hash = cachedInstance.calculate(data);
  return hash;
}

export function createCRC32(): IHasher {
  const wasm = WASMInterface(wasmJson, 4);
  wasm.init();
  const obj: IHasher = {
    init: () => { wasm.init(); return obj; },
    update: (data) => { wasm.update(data); return obj; },
    digest: (outputType) => wasm.digest(outputType) as any,
    blockSize: 4,
    digestSize: 4,
  };
  return obj;
}

export default crc32;
