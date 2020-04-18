const MAX_HEAP = 16 * 1024;

export type ITypedArray = Uint8Array | Uint16Array | Uint32Array | ArrayBuffer;

type ThenArg<T> = T extends Promise<infer U> ? U :
  T extends ((...args: any[]) => Promise<infer V>) ? V :
  T;

export type IWASMInterface = ThenArg<ReturnType<typeof WASMInterface>>;

const wasmCache = new Map<string, Promise<WebAssembly.Instance>>();

async function WASMInterface (binary: any, hashLength: number) {
  let wasmInstance = null;
  let memoryView: Uint8Array = null;

  if (typeof WebAssembly === 'undefined') {
    throw new Error('WebAssembly is not supported in this environment!');
  }

  const getBinary = (): Uint8Array => {
    const buf = Buffer.from(binary.data, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
  }

  const writeMemory = (data: Uint32Array) => {
    memoryView.set(new Uint8Array(data.buffer));
  }

  const loadWASM = async () => {
    if (!wasmCache.has(binary.name)) {
      const promise = new Promise<WebAssembly.Instance>(async (resolve, reject) => {
        try {
          wasmInstance = (await WebAssembly.instantiate(getBinary())).instance;
          wasmInstance.exports._start();
          resolve(wasmInstance);
        } catch (err) {
          console.log('err', err);
          reject(err);
        }
      });
      wasmCache.set(binary.name, promise);
      wasmInstance = await promise;
    } else {
      wasmInstance = await wasmCache.get(binary.name);
    }
  }

  const setupInterface = async () => {
    if (!wasmInstance) {
      await loadWASM();
    }

    const arrayOffset: number = wasmInstance.exports.Hash_GetBuffer();
    const memoryBuffer = wasmInstance.exports.memory.buffer;
    memoryView = new Uint8Array(memoryBuffer, arrayOffset, MAX_HEAP);
  };

  const init = (bits: number = null) => {
    wasmInstance.exports.Hash_Init.apply(null, bits ? [bits] : []);
  }

  const updateUInt8Array = (data: Uint8Array): void => {
    let read = 0;
    while (read < data.length) {
      const chunk = data.subarray(read, read + MAX_HEAP);
      read += chunk.length;
      memoryView.set(chunk);
      wasmInstance.exports.Hash_Update(chunk.length);
    }
  }

  const update = (data: string | Buffer | ITypedArray) => {
    let uintBuffer = null;
  
    if (data instanceof String) {
      data = data.toString();
    }
  
    if (typeof data === 'string') {
      const buf = Buffer.from(data, 'utf8');
      uintBuffer = new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
    } else if (data instanceof Buffer) {
      uintBuffer = new Uint8Array(data.buffer, data.byteOffset, data.length);
    } else if (ArrayBuffer.isView(data)) {
      uintBuffer = new Uint8Array(data.buffer);
    } else {
      throw new Error('Invalid data type!');
    }
  
    updateUInt8Array(uintBuffer);
  }

  const digest = (padding: number = null): string => {
    wasmInstance.exports.Hash_Final.apply(null, padding ? [padding] : []);
    const result = memoryView.subarray(0, hashLength);
    return Buffer.from(result).toString('hex');
  }

  await setupInterface();

  return {
    writeMemory,
    init,
    update,
    digest,
  };
}

export default WASMInterface;
