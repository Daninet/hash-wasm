import { getUInt8Buffer, IDataType } from './util';
import { createBLAKE2b } from './blake2b';
import WASMInterface from './WASMInterface';
import wasmJson from '../wasm/argon2.wasm.json';

// result: i => 2852426eb498671a10f2a91185baec84
// result: d => 77ab7ab1e8b3a4c3610327502709b131
// result: id => f94aa50873d67fdd589d6774b87c0634

type UnboxPromise<T extends Promise<any>> = T extends Promise<infer U> ? U: never;
let wasm: UnboxPromise<ReturnType<typeof WASMInterface>> = null;

interface IArgon2Options {
  password: IDataType;
  salt: IDataType;
  iterations?: number;
  parallelism?: number;
  memorySize?: number;
  hashLength?: number;
  hashType?: 'i' | 'd' | 'id';
}

function int32LE(x: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setInt32(0, x, true);
  return new Uint8Array(buffer);
}

async function hashFunc(buf: Uint8Array, len: number): Promise<Uint8Array> {
  if (len <= 64) {
    const blake = await createBLAKE2b(len * 8);
    blake.init();
    blake.update(int32LE(len));
    blake.update(buf);
    return getUInt8Buffer(Buffer.from(blake.digest(), 'hex'));
  }

  const blake = await createBLAKE2b(512);
  const r = Math.ceil(len / 32) - 2;

  blake.init();
  blake.update(int32LE(len));
  blake.update(buf);
  const v = [
    Buffer.from(blake.digest(), 'hex'),
  ];
  // console.log('v', v);

  for (let i = 1; i < r; i++) {
    blake.init();
    blake.update(v[i - 1]);
    const hash = blake.digest();
    v[i] = Buffer.from(hash, 'hex');
  }

  const partialBytesNeeded = len - 32 * r;
  const blakeSmall = await createBLAKE2b(partialBytesNeeded * 8);
  blakeSmall.init();
  blakeSmall.update(v[r - 1]);
  v[r] = Buffer.from(blakeSmall.digest(), 'hex');

  const ret = new Uint8Array(len);
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < 32; j++) {
      ret[i * 32 + j] = v[i][j];
    }
  }
  for (let j = 0; j < partialBytesNeeded; j++) {
    ret[r * 32 + j] = v[r][j];
  }

  return new Uint8Array(ret);
}

function indexFunc(rand: bigint, q, g, p, k, slice, lane, i) {
  const rlane = Number(rand >> BigInt(32)) % p;
  let start;
  let max;

  if (k === 0) {
    start = 0;
    if (slice === 0 || lane === rlane) {
      max = slice * g + i;
    } else {
      max = slice * g;
    }
  } else {
    start = ((slice + 1) % 4) * g;
    if (lane === rlane) {
      max = 3 * g + i;
    } else {
      max = 3 * g;
    }
  }
  if (i === 0 || lane === rlane) {
    max -= 1;
  }

  let phi = rand & BigInt(0xFFFFFFFF);
  phi = phi * phi >> BigInt(32);
  phi = phi * BigInt(max) >> BigInt(32);
  const ri = Number((BigInt(start) + BigInt(max) - BigInt(1) - phi) % BigInt(q));

  const i0 = lane * q + slice * g + i;
  const j0 = rlane * q + ri;
  const rslice = 0;
  // console.log(`i = ${i0}(${lane}, ${slice}, ${i}) rand=${rand} max=${max} start=${start} phi=${phi} j=${j0}(${rlane}, ${rslice}, ${ri})`);

  return {
    rlane,
    rslice,
    ri,
  };
}

function blockFunc(z: Uint8Array, t: Uint8Array, a: Uint8Array, b: Uint8Array) {
  const data = new Uint8Array([...z, ...t, ...a, ...b]);
  const out = Buffer.from(wasm.calculate(data), 'hex');
  const outInt = getUInt8Buffer(out);
  z.set(outInt.subarray(0, 1024));
  t.set(outInt.subarray(1024, 2 * 1024));
  // a.set(outInt.subarray(2 * 1024, 3 * 1024));
  // b.set(outInt.subarray(3 * 1024, 4 * 1024));
}

// function printGo(x: Uint8Array) {
//   const hexBuf = Buffer.from(Buffer.from(x.buffer)).swap64().toString('hex');
//   let chunks = hexBuf.replace(/([0-9a-f]{16})/g, '$1 ').split(' ');
//   chunks = chunks.map(f => f.replace(/^[0]+/g, ''));
//   return chunks.join(' ');
// }

function getHashType(type: IArgon2Options['hashType']): number {
  if (type === 'd') {
    return 0;
  }
  if (type === 'i') {
    return 1;
  }
  return 2;
}

async function argon2Internal(options: IArgon2Options): Promise<string> {
  wasm = await WASMInterface(wasmJson, 2 * 1024);
  const { parallelism, iterations, hashLength } = options;
  const password = getUInt8Buffer(options.password);
  const salt = getUInt8Buffer(options.salt);
  const version = 0x13;
  const hashType = getHashType(options.hashType);
  let { memorySize } = options; // in KB

  if (memorySize < 8 * parallelism) {
    memorySize = 8 * parallelism;
  }

  const blake = await createBLAKE2b(512);
  blake.update(int32LE(parallelism));
  blake.update(int32LE(hashLength));
  blake.update(int32LE(memorySize));
  blake.update(int32LE(iterations));
  blake.update(int32LE(version));
  blake.update(int32LE(hashType));
  blake.update(int32LE(password.length));
  blake.update(password);
  blake.update(int32LE(salt.length));
  blake.update(salt);
  blake.update(int32LE(0)); // key length + key
  blake.update(int32LE(0)); // associatedData length + associatedData

  const H0 = Buffer.from(blake.digest(), 'hex');
  // console.log('H0', H0.toString('hex'));

  // const blockCount = Math.floor(memorySize / (4 * parallelism));
  // const columnCount = blockCount / parallelism; // q
  const q = memorySize / parallelism; // length of each lane
  const g = q / 4; // length of each segment

  // Allocate two-dimensional array of 1 KiB blocks (parallelism rows x columnCount columns)
  const B = new Array(memorySize).fill(0).map(
    () => new Uint8Array(1024),
  );

  for (let lane = 0; lane < parallelism; lane++) {
    const param0 = Uint8Array.from([...H0, ...int32LE(0), ...int32LE(lane)]);
    // console.log('param0', Buffer.from(param0.buffer));
    B[lane * q + 0] = await hashFunc(param0, 1024);
    const param1 = Uint8Array.from([...H0, ...int32LE(1), ...int32LE(lane)]);
    B[lane * q + 1] = await hashFunc(param1, 1024);
  }

  const btmp = new Uint8Array(1024);

  for (let k = 0; k < iterations; k++) {
    // console.log('after pass: ', k);
    for (let slice = 0; slice < 4; slice++) {
      for (let lane = 0; lane < parallelism; lane++) {
        let i = 0;
        if (k === 0 && slice === 0) {
          i = 2;
        }
        let j = lane * q + slice * g + i;
        for (;i < g; i++, j++) {
          let prev = j - 1;
          if (i === 0 && slice === 0) {
            prev = lane * q + q - 1;
          }
          const view = new DataView(B[prev].buffer);
          const rand = view.getBigUint64(0, true);
          const { rslice, rlane, ri } = indexFunc(rand, q, g, parallelism, k, slice, lane, i);
          const j0 = rlane * q + rslice * g + ri;

          // console.log('before bprev: ', printGo(B[prev]));
          // console.log('before B[j0]: ', printGo(B[j0]));
          blockFunc(B[j], btmp, B[prev], B[j0]);
          // console.log('after btmp: ', printGo(btmp));
          // console.log('after: ', printGo(B[j]));
          // if (k === 1 && j === 0) return null;
        }
      }
    }
    // for (let i = 0; i < B.length; i++) {
    //   console.log(`Block ${i}`, Buffer.from(B[i].buffer).readBigUInt64LE(0).toString(16));
    // }
  }

  for (let lane = 0; lane < parallelism - 1; lane++) {
    const column = B[lane * q + q - 1];
    for (let i = 0; i < column.length; i++) {
      B[memorySize - 1][i] ^= column[i];
    }
  }

  const C = new Uint8Array(1024);
  for (let i = 0; i < B[memorySize - 1].length; i++) {
    for (let j = 0; j < 8; j++) {
      C[i * 8 + j] = B[memorySize - 1][i * 8 + j];
    }
  }

  // console.log('Final hash', printGo(C));

  const res = await hashFunc(C, hashLength);
  const responseStr = Buffer.from(res.buffer, res.byteOffset, res.byteLength).toString('hex');
  // console.log('response', responseStr);
  return Promise.resolve(responseStr);
}

export const argon2 = async (options: IArgon2Options): Promise<string> => {
  return argon2Internal(options)
};

export default argon2;
