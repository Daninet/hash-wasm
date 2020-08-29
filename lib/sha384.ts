import WASMInterface, { IWASMInterface, IHasher } from './WASMInterface';
import wasmJson from '../wasm/sha512.wasm.json';
import { IDataType } from './util';

let cachedInstance: IWASMInterface = null;

export function sha384(data: IDataType): string {
  if (cachedInstance === null) {
    cachedInstance = WASMInterface(wasmJson, 48);
  }

  const hash = cachedInstance.calculate(data, 384);
  return hash;
}

export function createSHA384(): IHasher {
  const wasm = WASMInterface(wasmJson, 48);
  wasm.init(384);
  const obj: IHasher = {
    init: () => { wasm.init(384); return obj; },
    update: (data) => { wasm.update(data); return obj; },
    digest: (outputType) => wasm.digest(outputType) as any,
    blockSize: 128,
    digestSize: 48,
  };
  return obj;
}

export default sha384;
