const MAX_HEAP = 16 * 1024;

export type ITypedArray = Uint8Array | Uint16Array | Uint32Array | ArrayBuffer;

type ThenArg<T> = T extends Promise<infer U> ? U :
  T extends ((...args: any[]) => Promise<infer V>) ? V :
  T;

export type IWASMInterface = ThenArg<ReturnType<typeof WASMInterface>>;

async function WASMInterface (binary: any, hashLength: number) {
  let wasmInstance = null;
  let arrayOffset: number = -1;
  let memoryView: Uint8Array = null;

  const getBinary = async (): Promise<Uint8Array> => {
    const buf = Buffer.from(binary.data, 'base64');
    return Promise.resolve(new Uint8Array(buf.buffer, buf.byteOffset, buf.length));
  } 

  const loadWASM = async () => {
    let binary = await getBinary();
    wasmInstance = (await WebAssembly.instantiate(binary)).instance;
    wasmInstance.exports._start();
    arrayOffset = wasmInstance.exports.Hash_GetBuffer();
    const memoryBuffer = wasmInstance.exports.memory.buffer;
    memoryView = new Uint8Array(memoryBuffer, arrayOffset, MAX_HEAP);
  }

  const init = (bits: number = null) => {
    if (bits) {
      wasmInstance.exports.Hash_Init(bits);
    } else {
      wasmInstance.exports.Hash_Init();
    }
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

  const digest = (): string => {
    wasmInstance.exports.Hash_Final();
    const result = memoryView.subarray(0, hashLength);
    return Buffer.from(result).toString('hex');
  }

  const hash = (data: string | Buffer | ITypedArray, bits: number = null): string => {
    init(bits);
    update(data);
    return digest();
  }

  await loadWASM();

  return {
    init,
    update,
    digest,
    hash,
  };
}

export default WASMInterface;
