import { WASMInterface, IWASMInterface, IHasher } from './WASMInterface';
import wasmJson from '../wasm/blake2b.wasm.json';
import { getUInt8Buffer, IDataType } from './util';

let cachedInstance: IWASMInterface = null;

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

export function blake2b(data: IDataType, bits = 512, key: IDataType = null): string {
  if (validateBits(bits)) {
    throw validateBits(bits);
  }

  let keyBuffer = null;
  let initParam = bits;
  if (key !== null) {
    keyBuffer = getUInt8Buffer(key);
    if (keyBuffer.length > 64) {
      throw new Error('Max key length is 64 bytes');
    }
    initParam = getInitParam(bits, keyBuffer.length);
  }

  const hashLength = bits / 8;

  if (cachedInstance === null || cachedInstance.hashLength !== hashLength) {
    cachedInstance = WASMInterface(wasmJson, hashLength);
  }

  if (initParam > 512) {
    cachedInstance.writeMemory(keyBuffer);
  }

  const hash = cachedInstance.calculate(data, initParam);
  return hash;
}

export function createBLAKE2b(bits = 512, key: IDataType = null): IHasher {
  if (validateBits(bits)) {
    throw validateBits(bits);
  }

  let keyBuffer = null;
  let initParam = bits;
  if (key !== null) {
    keyBuffer = getUInt8Buffer(key);
    if (keyBuffer.length > 64) {
      throw new Error('Max key length is 64 bytes');
    }
    initParam = getInitParam(bits, keyBuffer.length);
  }

  const outputSize = bits / 8;

  const wasm = WASMInterface(wasmJson, outputSize);
  if (initParam > 512) {
    wasm.writeMemory(keyBuffer);
  }
  wasm.init(initParam);

  const obj: IHasher = {
    init: initParam > 512
      ? () => {
        wasm.writeMemory(keyBuffer);
        wasm.init(initParam);
        return obj;
      }
      : () => {
        wasm.init(initParam);
        return obj;
      },
    update: (data) => { wasm.update(data); return obj; },
    digest: (outputType) => wasm.digest(outputType) as any,
    blockSize: 1024,
    digestSize: outputSize,
  };
  return obj;
}
