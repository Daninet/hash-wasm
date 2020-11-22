import Mutex from './mutex';
import {
  decodeBase64, getDigestHex, getUInt8Buffer, IDataType,
} from './util';

export const MAX_HEAP = 16 * 1024;
const wasmMutex = new Mutex();

type ThenArg<T> = T extends Promise<infer U> ? U :
  T extends ((...args: any[]) => Promise<infer V>) ? V :
  T;

export type IHasher = {
  /**
   * Initializes hash state to default value
   */
  init: () => IHasher;
  /**
   * Updates the hash content with the given data
   */
  update: (data: IDataType) => IHasher;
  /**
   * Calculates the hash of all of the data passed to be hashed with hash.update().
   * Defaults to hexadecimal string
   * @param outputType If outputType is "binary", it returns Uint8Array. Otherwise it
   *                   returns hexadecimal string
   */
  digest: {
    (outputType: 'binary'): Uint8Array;
    (outputType?: 'hex'): string;
  };
  /**
   * Block size in bytes
   */
  blockSize: number;
  /**
   * Digest size in bytes
   */
  digestSize: number;
}

const wasmModuleCache = new Map<string, Promise<WebAssembly.Module>>();

export async function WASMInterface(binary: any, hashLength: number) {
  let wasmInstance = null;
  let memoryView: Uint8Array = null;
  let initialized = false;

  if (typeof WebAssembly === 'undefined') {
    throw new Error('WebAssembly is not supported in this environment!');
  }

  const writeMemory = (data: Uint8Array, offset = 0) => {
    memoryView.set(data, offset);
  };

  const getMemory = () => memoryView;
  const getExports = () => wasmInstance.exports;

  const setMemorySize = (totalSize: number) => {
    wasmInstance.exports.Hash_SetMemorySize(totalSize);
    const arrayOffset: number = wasmInstance.exports.Hash_GetBuffer();
    const memoryBuffer = wasmInstance.exports.memory.buffer;
    memoryView = new Uint8Array(memoryBuffer, arrayOffset, totalSize);
  };

  const loadWASMPromise = wasmMutex.dispatch(async () => {
    if (!wasmModuleCache.has(binary.name)) {
      const asm = decodeBase64(binary.data);
      const promise = WebAssembly.compile(asm);

      wasmModuleCache.set(binary.name, promise);
    }

    const module = await wasmModuleCache.get(binary.name);
    wasmInstance = await WebAssembly.instantiate(module, {
      // env: {
      //   emscripten_memcpy_big: (dest, src, num) => {
      //     const memoryBuffer = wasmInstance.exports.memory.buffer;
      //     const memView = new Uint8Array(memoryBuffer, 0);
      //     memView.set(memView.subarray(src, src + num), dest);
      //   },
      //   print_memory: (offset, len) => {
      //     const memoryBuffer = wasmInstance.exports.memory.buffer;
      //     const memView = new Uint8Array(memoryBuffer, 0);
      //     console.log('print_int32', memView.subarray(offset, offset + len));
      //   },
      // },
    });

    // wasmInstance.exports._start();
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
    initialized = true;
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
    if (!initialized) {
      throw new Error('update() called before init()');
    }
    const Uint8Buffer = getUInt8Buffer(data);
    updateUInt8Array(Uint8Buffer);
  };

  const digestChars = new Uint8Array(hashLength * 2);

  const digest = (outputType: 'hex' | 'binary', padding: number = null): Uint8Array | string => {
    if (!initialized) {
      throw new Error('digest() called before init()');
    }
    initialized = false;

    wasmInstance.exports.Hash_Final(padding);

    if (outputType === 'binary') {
      // the data is copied to allow GC of the original memory object
      return memoryView.slice(0, hashLength);
    }

    return getDigestHex(digestChars, memoryView, hashLength);
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
    case 'argon2.wasm':
    case 'scrypt.wasm':
      canSimplify = () => true;
      break;

    case 'blake2b.wasm':
    case 'blake2s.wasm':
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
      return digest('hex', digestParam) as string;
    }

    const buffer = getUInt8Buffer(data);
    memoryView.set(buffer);
    wasmInstance.exports.Hash_Calculate(buffer.length, initParam, digestParam);

    return getDigestHex(digestChars, memoryView, hashLength);
  };

  await setupInterface();

  return {
    getMemory,
    writeMemory,
    getExports,
    setMemorySize,
    init,
    update,
    digest,
    calculate,
    hashLength,
  };
}

export type IWASMInterface = ThenArg<ReturnType<typeof WASMInterface>>;
