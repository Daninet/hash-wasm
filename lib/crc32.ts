import {
  WASMInterface,
  type IWASMInterface,
  type IHasher,
} from "./WASMInterface";
import Mutex from "./mutex";
import wasmJson from "../wasm/crc32.wasm.json";
import lockedCreate from "./lockedCreate";
import type { IDataType } from "./util";

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

/**
 * Calculates CRC-32 hash
 * @param data Input data (string, Buffer or TypedArray)
 * @returns Computed hash as a hexadecimal string
 */
export function crc32(data: IDataType): Promise<string> {
  if (wasmCache === null) {
    return lockedCreate(mutex, wasmJson, 4).then((wasm) => {
      wasmCache = wasm;
      return wasmCache.calculate(data, 0xedb88320);
    });
  }

  try {
    const hash = wasmCache.calculate(data, 0xedb88320);
    return Promise.resolve(hash);
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Creates a new CRC-32 hash instance
 */
export function createCRC32(): Promise<IHasher> {
  return WASMInterface(wasmJson, 4).then((wasm) => {
    wasm.init(0xedb88320);
    const obj: IHasher = {
      init: () => {
        wasm.init(0xedb88320);
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
      blockSize: 4,
      digestSize: 4,
    };
    return obj;
  });
}
