import WASMInterface, { IWASMInterface, IHasher } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/md5.wasm.json';
import lockedCreate from './lockedCreate';
import { IDataType } from './util';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

export function md5(data: IDataType): Promise<string> {
  if (wasmCache === null) {
    return lockedCreate(mutex, wasmJson, 16)
      .then((wasm) => {
        wasmCache = wasm;
        return wasmCache.calculate(data);
      });
  }

  try {
    const hash = wasmCache.calculate(data);
    return Promise.resolve(hash);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createMD5(): Promise<IHasher> {
  return WASMInterface(wasmJson, 16).then((wasm) => {
    wasm.init();
    return {
      init: () => wasm.init(),
      update: wasm.update,
      digest: (outputType) => wasm.digest(outputType) as any,
      blockSize: 64,
      digestSize: 16,
    };
  });
}

export default md5;
