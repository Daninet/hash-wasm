import WASMInterface, { IWASMInterface, IHasher } from './WASMInterface';
import Mutex from './mutex';
import wasmJson from '../wasm/blake2b.wasm.json';
import lockedCreate from './lockedCreate';
import { getUInt8Buffer, IDataType } from './util';

const mutex = new Mutex();
let wasmCache: IWASMInterface = null;

function validateBits(bits: number) {
  if (!Number.isInteger(bits) || bits < 8 || bits > 512 || bits % 8 !== 0) {
    return new Error('Invalid variant! Valid values: 8, 16, ..., 512');
  }
  return null;
}

function getInitParam(outputBits, keyBits) {
  // eslint-disable-next-line no-bitwise
  return outputBits | (keyBits << 16);
}

export function blake2b(
  data: IDataType, bits = 512, key: IDataType = null,
): Promise<string> {
  if (validateBits(bits)) {
    return Promise.reject(validateBits(bits));
  }

  let keyBuffer = null;
  let initParam = bits;
  if (key !== null) {
    keyBuffer = getUInt8Buffer(key);
    if (keyBuffer.length > 64) {
      return Promise.reject(new Error('Max key length is 64 bytes'));
    }
    initParam = getInitParam(bits, keyBuffer.length);
  }

  const hashLength = bits / 8;

  if (wasmCache === null || wasmCache.hashLength !== hashLength) {
    return lockedCreate(mutex, wasmJson, hashLength)
      .then((wasm) => {
        wasmCache = wasm;
        if (initParam > 512) {
          wasmCache.writeMemory(keyBuffer);
        }
        return wasmCache.calculate(data, initParam);
      });
  }

  try {
    if (initParam > 512) {
      wasmCache.writeMemory(keyBuffer);
    }
    const hash = wasmCache.calculate(data, initParam);
    return Promise.resolve(hash);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createBLAKE2b(
  bits = 512, key: IDataType = null,
): Promise<IHasher> {
  if (validateBits(bits)) {
    return Promise.reject(validateBits(bits));
  }

  let keyBuffer = null;
  let initParam = bits;
  if (key !== null) {
    keyBuffer = getUInt8Buffer(key);
    if (keyBuffer.length > 64) {
      return Promise.reject(new Error('Max key length is 64 bytes'));
    }
    initParam = getInitParam(bits, keyBuffer.length);
  }

  const outputSize = bits / 8;

  return WASMInterface(wasmJson, outputSize).then((wasm) => {
    if (initParam > 512) {
      wasm.writeMemory(keyBuffer);
    }
    wasm.init(initParam);

    return {
      init: initParam > 512
        ? () => {
          wasm.writeMemory(keyBuffer);
          wasm.init(initParam);
        }
        : () => wasm.init(initParam),
      update: wasm.update,
      digest: () => wasm.digest(),
      blockSize: 1024,
      digestSize: outputSize,
    };
  });
}

export default blake2b;
