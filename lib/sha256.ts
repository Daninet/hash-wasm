import {
  WASMInterface,
  type IWASMInterface,
  type IHasher,
} from "./WASMInterface";
import Mutex from "./mutex";
import wasmJson from "../wasm/sha256.wasm.json";
import lockedCreate from "./lockedCreate";
import type { IDataType } from "./util";

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

/**
 * Calculates SHA-2 (SHA-256) hash
 * @param data Input data (string, Buffer or TypedArray)
 * @returns Computed hash as a hexadecimal string
 */
export function sha256(data: IDataType): Promise<string> {
  if (wasmCache === null) {
    return lockedCreate(mutex, wasmJson, 32).then((wasm) => {
      wasmCache = wasm;
      return wasmCache.calculate(data, 256);
    });
  }

  try {
    const hash = wasmCache.calculate(data, 256);
    return Promise.resolve(hash);
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Creates a new SHA-2 (SHA-256) hash instance
 */
export function createSHA256(): Promise<IHasher> {
  return WASMInterface(wasmJson, 32).then((wasm) => {
    wasm.init(256);
    const obj: IHasher = {
      init: () => {
        wasm.init(256);
        return obj;
      },
      update: (data) => {
        wasm.update(data);
        return obj;
      },
      digest: (outputType) => wasm.digest(outputType) as any,
      save: () => wasm.save(),
      load: (data) => {
        wasm.load(data);
        return obj;
      },
      blockSize: 64,
      digestSize: 32,
    };
    return obj;
  });
}
