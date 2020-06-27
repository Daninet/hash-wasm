import Mutex from './mutex';

const MAX_HEAP = 16 * 1024;
const wasmMutex = new Mutex();

export type ITypedArray = Uint8Array | Uint16Array | Uint32Array;

type ThenArg<T> = T extends Promise<infer U> ? U :
  T extends ((...args: any[]) => Promise<infer V>) ? V :
  T;

export type IHasher = {
  init: () => void;
  update: (data: string | ITypedArray | Buffer) => void;
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

  const getBinary = (): Uint8Array => {
    const buf = Buffer.from(binary.data, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
  };

  const writeMemory = (data: Uint32Array) => {
    memoryView.set(new Uint8Array(data.buffer));
  };

  const loadWASMPromise = wasmMutex.dispatch(async () => {
    if (!wasmModuleCache.has(binary.name)) {
      const promise = new Promise<WebAssembly.Module>((resolve, reject) => {
        WebAssembly.compile(getBinary()).then((module) => {
          resolve(module);
        }).catch((err) => {
          reject(err);
        });
      });

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
    if (bits) {
      wasmInstance.exports.Hash_Init(bits);
    } else {
      wasmInstance.exports.Hash_Init();
    }
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

  const getUInt8Buffer = (data: string | Buffer | ITypedArray): Uint8Array => {
    if (data instanceof String) {
      data = data.toString();
    }

    if (typeof data === 'string') {
      const buf = Buffer.from(data, 'utf8');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
    }

    if (data instanceof Buffer) {
      return new Uint8Array(data.buffer, data.byteOffset, data.length);
    }

    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer);
    }

    throw new Error('Invalid data type!');
  };

  const update = (data: string | Buffer | ITypedArray) => {
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
    if (padding) {
      wasmInstance.exports.Hash_Final(padding);
    } else {
      wasmInstance.exports.Hash_Final();
    }
    return getDigestHex();
  };

  const canSimplify = binary.name === 'xxhash64.wasm'
    ? () => false
    : (data: string | Buffer | ITypedArray) => {
      if (ArrayBuffer.isView(data)) {
        return data.byteLength < MAX_HEAP;
      }

      return data.length < MAX_HEAP;
    };

  // shorthand for (init + update + digest) for better performance
  const calculate = (
    data: string | Buffer | ITypedArray, initParam = null, digestParam = null,
  ): string => {
    if (!canSimplify(data)) {
      init(initParam);
      update(data);
      return digest(digestParam);
    }

    const Uint8Buffer = getUInt8Buffer(data);
    memoryView.set(Uint8Buffer);
    wasmInstance.exports.Hash_Calculate(Uint8Buffer.length, initParam, digestParam);
    return getDigestHex();
  };

  await setupInterface();

  return {
    writeMemory,
    init,
    update,
    digest,
    calculate,
  };
}

export type IWASMInterface = ThenArg<ReturnType<typeof WASMInterface>>;

export default WASMInterface;
