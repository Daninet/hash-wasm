import { WASMInterface, IWASMInterface, IHasher } from './WASMInterface';
import wasmJson from '../wasm/sha3.wasm.json';
import { IDataType } from './util';

type IValidBits = 224 | 256 | 384 | 512;
let cachedInstance: IWASMInterface = null;

function validateBits(bits: IValidBits) {
  if (![224, 256, 384, 512].includes(bits)) {
    return new Error('Invalid variant! Valid values: 224, 256, 384, 512');
  }
  return null;
}

export function sha3(data: IDataType, bits: IValidBits = 512): string {
  if (validateBits(bits)) {
    throw validateBits(bits);
  }

  const hashLength = bits / 8;

  if (cachedInstance === null || cachedInstance.hashLength !== hashLength) {
    cachedInstance = WASMInterface(wasmJson, hashLength);
  }

  const hash = cachedInstance.calculate(data, bits, 0x06);
  return hash;
}

export function createSHA3(bits: IValidBits = 512): IHasher {
  if (validateBits(bits)) {
    throw validateBits(bits);
  }

  const outputSize = bits / 8;

  const wasm = WASMInterface(wasmJson, outputSize);
  wasm.init(bits);
  const obj: IHasher = {
    init: () => { wasm.init(bits); return obj; },
    update: (data) => { wasm.update(data); return obj; },
    digest: (outputType) => wasm.digest(outputType, 0x06) as any,
    blockSize: 200 - 2 * outputSize,
    digestSize: outputSize,
  };
  return obj;
}
