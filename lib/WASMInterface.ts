import Mutex from './mutex';
import { decodeBase64, getUInt8Buffer, IDataType } from './util';

export const MAX_HEAP = 16 * 1024;
const wasmMutex = new Mutex();

type ThenArg<T> = T extends Promise<infer U> ? U :
  T extends ((...args: any[]) => Promise<infer V>) ? V :
  T;

export type IHasher = {
  init: () => void;
  update: (data: IDataType) => void;
  digest: () => string;
  blockSize: number;
  digestSize: number;
}

const wasmModuleCache = new Map<string, Promise<WebAssembly.Module>>();

async function WASMInterface(binary: any, hashLength: number) {
  let wasmInstance = null;
  let memoryView: Uint8Array = null;

  if (typeof WebAssembly === 'undefined') {
    throw new Error('WebAssembly is not supported in this environment!');
  }

  const writeMemory = (data: Uint8Array) => {
    memoryView.set(data);
  };

  const loadWASMPromise = wasmMutex.dispatch(async () => {
    if (!wasmModuleCache.has(binary.name)) {
      const asm = decodeBase64(binary.data);
      const promise = WebAssembly.compile(asm);

      wasmModuleCache.set(binary.name, promise);
    }

    const module = await wasmModuleCache.get(binary.name);
    wasmInstance = await WebAssembly.instantiate(module);

    // eslint-disable-next-line no-underscore-dangle
    wasmInstance.exports._start();
  });

  const setupInterface = async () => {
    if (!wasmInstance) {
      await loadWASMPromise;
    }

    const arrayOffset: number = wasmInstance.exports.Hash_GetBuffer();
    const memoryBuffer = wasmInstance.exports.memory.buffer;
    memoryView = new Uint8Array(memoryBuffer, arrayOffset, MAX_HEAP);
  };

  const init = (bits: number = null) => {
    wasmInstance.exports.Hash_Init(bits);
  };

  const updateUInt8Array = (data: Uint8Array): void => {
    let read = 0;
    while (read < data.length) {
      const chunk = data.subarray(read, read + MAX_HEAP);
      read += chunk.length;
      memoryView.set(chunk);
      wasmInstance.exports.Hash_Update(chunk.length);
    }
  };

  const update = (data: IDataType) => {
    const Uint8Buffer = getUInt8Buffer(data);
    updateUInt8Array(Uint8Buffer);
  };

  const digestChars = new Uint8Array(hashLength * 2);
  const alpha = 'a'.charCodeAt(0) - 10;
  const digit = '0'.charCodeAt(0);

  const getDigestHex = () => {
    let p = 0;
    /* eslint-disable no-bitwise,no-plusplus */
    for (let i = 0; i < hashLength; i++) {
      let nibble = memoryView[i] >>> 4;
      digestChars[p++] = nibble > 9 ? nibble + alpha : nibble + digit;
      nibble = memoryView[i] & 0xF;
      digestChars[p++] = nibble > 9 ? nibble + alpha : nibble + digit;
    }
    /* eslint-enable no-bitwise,no-plusplus */

    return String.fromCharCode.apply(null, digestChars);
  };

  const digest = (padding: number = null): string => {
    wasmInstance.exports.Hash_Final(padding);
    return getDigestHex();
  };

  const isDataShort = (data: IDataType) => {
    if (typeof data === 'string') {
      // worst case is 4 bytes / char
      return data.length < MAX_HEAP / 4;
    }

    return data.byteLength < MAX_HEAP;
  };

  let canSimplify:
    (data: IDataType, initParam?: number) => boolean = isDataShort;

  switch (binary.name) {
    case 'blake2b.wasm':
      // if there is a key at blake2b then cannot simplify
      canSimplify = (data, initParam) => initParam <= 512 && isDataShort(data);
      break;

    case 'xxhash64.wasm': // cannot simplify
      canSimplify = () => false;
      break;

    default:
      break;
  }

  // shorthand for (init + update + digest) for better performance
  const calculate = (
    data: IDataType, initParam = null, digestParam = null,
  ): string => {
    if (!canSimplify(data, initParam)) {
      init(initParam);
      update(data);
      return digest(digestParam);
    }

    const buffer = getUInt8Buffer(data);
    memoryView.set(buffer);
    wasmInstance.exports.Hash_Calculate(buffer.length, initParam, digestParam);
    return getDigestHex();
  };

  await setupInterface();

  return {
    writeMemory,
    init,
    update,
    digest,
    calculate,
    hashLength,
  };
}

export type IWASMInterface = ThenArg<ReturnType<typeof WASMInterface>>;

export default WASMInterface;
