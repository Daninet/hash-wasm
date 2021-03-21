const MAIN_BUFFER_SIZE = 16 * 1024;
const mainBufferPtr = memory.data(MAIN_BUFFER_SIZE);

export function Hash_GetBuffer(): usize {
  return mainBufferPtr;
}

let lo: u32;
let hi: u32;
let a: u32;
let b: u32;
let c: u32;
let d: u32;
const bufferPtr = memory.data(64);
const blockPtr = memory.data(512);

@inline
function F(x: u32, y: u32, z: u32): u32 {
  return (z) ^ ((x) & ((y) ^ (z)));
}

@inline
function G(x: u32, y: u32, z: u32): u32 {
  return (y) ^ ((z) & ((x) ^ (y)));
}

@inline
function H(x: u32, y: u32, z: u32): u32 {
  return ((x) ^ (y)) ^ (z);
}

@inline
function H2(x: u32, y: u32, z: u32): u32 {
  return (x) ^ ((y) ^ (z));
}

@inline
function I(x: u32, y: u32, z: u32): u32 {
  return (y) ^ ((x) | ~(z));
}

@inline
function STEP_F(a: u32, b: u32, c: u32, d: u32, x: u32, t: u32, s: u32): u32 {
  a += F(b, c, d) + x + t;
  a = (a << s) | ((a & 0xffffffff) >> (32 - s));
  a += b;
  return a;
}

@inline
function STEP_G(a: u32, b: u32, c: u32, d: u32, x: u32, t: u32, s: u32): u32 {
  a += G(b, c, d) + x + t;
  a = (a << s) | ((a & 0xffffffff) >> (32 - s));
  a += b;
  return a;
}

@inline
function STEP_H(a: u32, b: u32, c: u32, d: u32, x: u32, t: u32, s: u32): u32 {
  a += H(b, c, d) + x + t;
  a = (a << s) | ((a & 0xffffffff) >> (32 - s));
  a += b;
  return a;
}

@inline
function STEP_H2(a: u32, b: u32, c: u32, d: u32, x: u32, t: u32, s: u32): u32 {
  a += H2(b, c, d) + x + t;
  a = (a << s) | ((a & 0xffffffff) >> (32 - s));
  a += b;
  return a;
}

@inline
function STEP_I(a: u32, b: u32, c: u32, d: u32, x: u32, t: u32, s: u32): u32 {
  a += I(b, c, d) + x + t;
  a = (a << s) | ((a & 0xffffffff) >> (32 - s));
  a += b;
  return a;
}

function body(data: usize, size: u32): usize {
  let ptr: usize = data;
  let saved_a: u32, saved_b: u32, saved_c: u32, saved_d: u32;

  do {
    saved_a = a;
    saved_b = b;
    saved_c = c;
    saved_d = d;

    /* Round 1 */
    a = STEP_F(a, b, c, d, load<u32>(ptr, 4 * 0), 0xd76aa478, 7);
    d = STEP_F(d, a, b, c, load<u32>(ptr, 4 * 1), 0xe8c7b756, 12);
    c = STEP_F(c, d, a, b, load<u32>(ptr, 4 * 2), 0x242070db, 17);
    b = STEP_F(b, c, d, a, load<u32>(ptr, 4 * 3), 0xc1bdceee, 22);
    a = STEP_F(a, b, c, d, load<u32>(ptr, 4 * 4), 0xf57c0faf, 7);
    d = STEP_F(d, a, b, c, load<u32>(ptr, 4 * 5), 0x4787c62a, 12);
    c = STEP_F(c, d, a, b, load<u32>(ptr, 4 * 6), 0xa8304613, 17);
    b = STEP_F(b, c, d, a, load<u32>(ptr, 4 * 7), 0xfd469501, 22);
    a = STEP_F(a, b, c, d, load<u32>(ptr, 4 * 8), 0x698098d8, 7);
    d = STEP_F(d, a, b, c, load<u32>(ptr, 4 * 9), 0x8b44f7af, 12);
    c = STEP_F(c, d, a, b, load<u32>(ptr, 4 * 10), 0xffff5bb1, 17);
    b = STEP_F(b, c, d, a, load<u32>(ptr, 4 * 11), 0x895cd7be, 22);
    a = STEP_F(a, b, c, d, load<u32>(ptr, 4 * 12), 0x6b901122, 7);
    d = STEP_F(d, a, b, c, load<u32>(ptr, 4 * 13), 0xfd987193, 12);
    c = STEP_F(c, d, a, b, load<u32>(ptr, 4 * 14), 0xa679438e, 17);
    b = STEP_F(b, c, d, a, load<u32>(ptr, 4 * 15), 0x49b40821, 22);

    /* Round 2 */
    a = STEP_G(a, b, c, d, load<u32>(ptr, 4 * 1), 0xf61e2562, 5)
    d = STEP_G(d, a, b, c, load<u32>(ptr, 4 * 6), 0xc040b340, 9)
    c = STEP_G(c, d, a, b, load<u32>(ptr, 4 * 11), 0x265e5a51, 14)
    b = STEP_G(b, c, d, a, load<u32>(ptr, 4 * 0), 0xe9b6c7aa, 20)
    a = STEP_G(a, b, c, d, load<u32>(ptr, 4 * 5), 0xd62f105d, 5)
    d = STEP_G(d, a, b, c, load<u32>(ptr, 4 * 10), 0x02441453, 9)
    c = STEP_G(c, d, a, b, load<u32>(ptr, 4 * 15), 0xd8a1e681, 14)
    b = STEP_G(b, c, d, a, load<u32>(ptr, 4 * 4), 0xe7d3fbc8, 20)
    a = STEP_G(a, b, c, d, load<u32>(ptr, 4 * 9), 0x21e1cde6, 5)
    d = STEP_G(d, a, b, c, load<u32>(ptr, 4 * 14), 0xc33707d6, 9)
    c = STEP_G(c, d, a, b, load<u32>(ptr, 4 * 3), 0xf4d50d87, 14)
    b = STEP_G(b, c, d, a, load<u32>(ptr, 4 * 8), 0x455a14ed, 20)
    a = STEP_G(a, b, c, d, load<u32>(ptr, 4 * 13), 0xa9e3e905, 5)
    d = STEP_G(d, a, b, c, load<u32>(ptr, 4 * 2), 0xfcefa3f8, 9)
    c = STEP_G(c, d, a, b, load<u32>(ptr, 4 * 7), 0x676f02d9, 14)
    b = STEP_G(b, c, d, a, load<u32>(ptr, 4 * 12), 0x8d2a4c8a, 20)

    /* Round 3 */
    a = STEP_H(a, b, c, d, load<u32>(ptr, 4 * 5), 0xfffa3942, 4)
    d = STEP_H2(d, a, b, c, load<u32>(ptr, 4 * 8), 0x8771f681, 11)
    c = STEP_H(c, d, a, b, load<u32>(ptr, 4 * 11), 0x6d9d6122, 16)
    b = STEP_H2(b, c, d, a, load<u32>(ptr, 4 * 14), 0xfde5380c, 23)
    a = STEP_H(a, b, c, d, load<u32>(ptr, 4 * 1), 0xa4beea44, 4)
    d = STEP_H2(d, a, b, c, load<u32>(ptr, 4 * 4), 0x4bdecfa9, 11)
    c = STEP_H(c, d, a, b, load<u32>(ptr, 4 * 7), 0xf6bb4b60, 16)
    b = STEP_H2(b, c, d, a, load<u32>(ptr, 4 * 10), 0xbebfbc70, 23)
    a = STEP_H(a, b, c, d, load<u32>(ptr, 4 * 13), 0x289b7ec6, 4)
    d = STEP_H2(d, a, b, c, load<u32>(ptr, 4 * 0), 0xeaa127fa, 11)
    c = STEP_H(c, d, a, b, load<u32>(ptr, 4 * 3), 0xd4ef3085, 16)
    b = STEP_H2(b, c, d, a, load<u32>(ptr, 4 * 6), 0x04881d05, 23)
    a = STEP_H(a, b, c, d, load<u32>(ptr, 4 * 9), 0xd9d4d039, 4)
    d = STEP_H2(d, a, b, c, load<u32>(ptr, 4 * 12), 0xe6db99e5, 11)
    c = STEP_H(c, d, a, b, load<u32>(ptr, 4 * 15), 0x1fa27cf8, 16)
    b = STEP_H2(b, c, d, a, load<u32>(ptr, 4 * 2), 0xc4ac5665, 23)

    /* Round 4 */
    a = STEP_I(a, b, c, d, load<u32>(ptr, 4 * 0), 0xf4292244, 6)
    d = STEP_I(d, a, b, c, load<u32>(ptr, 4 * 7), 0x432aff97, 10)
    c = STEP_I(c, d, a, b, load<u32>(ptr, 4 * 14), 0xab9423a7, 15)
    b = STEP_I(b, c, d, a, load<u32>(ptr, 4 * 5), 0xfc93a039, 21)
    a = STEP_I(a, b, c, d, load<u32>(ptr, 4 * 12), 0x655b59c3, 6)
    d = STEP_I(d, a, b, c, load<u32>(ptr, 4 * 3), 0x8f0ccc92, 10)
    c = STEP_I(c, d, a, b, load<u32>(ptr, 4 * 10), 0xffeff47d, 15)
    b = STEP_I(b, c, d, a, load<u32>(ptr, 4 * 1), 0x85845dd1, 21)
    a = STEP_I(a, b, c, d, load<u32>(ptr, 4 * 8), 0x6fa87e4f, 6)
    d = STEP_I(d, a, b, c, load<u32>(ptr, 4 * 15), 0xfe2ce6e0, 10)
    c = STEP_I(c, d, a, b, load<u32>(ptr, 4 * 6), 0xa3014314, 15)
    b = STEP_I(b, c, d, a, load<u32>(ptr, 4 * 13), 0x4e0811a1, 21)
    a = STEP_I(a, b, c, d, load<u32>(ptr, 4 * 4), 0xf7537e82, 6)
    d = STEP_I(d, a, b, c, load<u32>(ptr, 4 * 11), 0xbd3af235, 10)
    c = STEP_I(c, d, a, b, load<u32>(ptr, 4 * 2), 0x2ad7d2bb, 15)
    b = STEP_I(b, c, d, a, load<u32>(ptr, 4 * 9), 0xeb86d391, 21)

    a += saved_a;
    b += saved_b;
    c += saved_c;
    d += saved_d;

    ptr += 64;
  } while (size -= 64);

  return ptr;
}

export function Hash_Init(): void {
  a = 0x67452301;
  b = 0xefcdab89;
  c = 0x98badcfe;
  d = 0x10325476;

  lo = 0;
  hi = 0;
}

export function Hash_Update(size: u32): void {
  let data: usize = mainBufferPtr;
  let saved_lo: u32;
  let used: u32, available: u32;

  saved_lo = lo;
  lo = (saved_lo + size) & 0x1fffffff;
  if (lo < saved_lo) {
    hi++;
  }
  hi += size >> 29;

  used = saved_lo & 0x3f;

  if (used) {
    available = 64 - used;

    if (size < available) {
      for (let i: u32 = 0; i < size; i++) {
        store<u8>(bufferPtr + used + i, load<u8>(data + i));
      }
      return;
    }

    for (let i: u32 = 0; i < available; i++) {
      store<u8>(bufferPtr + used + i, load<u8>(data + i));
    }
    data += available;
    size -= available;
    body(bufferPtr, 64);
  }

  if (size >= 64) {
    let mask: u32 = 0x3f;
    mask = ~mask;
    data = body(data, size & mask);
    size &= 0x3f;
  }

  for (let i: u32 = 0; i < size; i++) {
    store<u8>(bufferPtr + i, load<u8>(data + i));
  }
}

@inline
function OUT(dst: usize, src: u32): void {
  store<u8>(dst, u8(src));
  store<u8>(dst, u8(src >> 8), 1);
  store<u8>(dst, u8(src >> 16), 2);
  store<u8>(dst, u8(src >> 24), 3);
}

export function Hash_Final(): void {
  const result: usize = mainBufferPtr;
  let used: i32, available: i32;

  used = lo & 0x3f;

  store<u8>(bufferPtr + used, 0x80);
  used++;

  available = 64 - used;

  if (available < 8) {
    for (let i: i32 = 0; i < available; i++) {
      store<u8>(bufferPtr + used + i, 0);
    }
    body(bufferPtr, 64);
    used = 0;
    available = 64;
  }

  for (let i: i32 = available - 9; i >= 0; i--) {
    store<u8>(bufferPtr + used + i, 0);
  }

  lo <<= 3;
  OUT(bufferPtr + 56, lo);
  OUT(bufferPtr + 60, hi);

  body(bufferPtr, 64);

  OUT(result, a);
  OUT(result + 4, b);
  OUT(result + 8, c);
  OUT(result + 12, d);
}

export function Hash_Calculate(length: u32): void {
  Hash_Init();
  Hash_Update(length);
  Hash_Final();
}
