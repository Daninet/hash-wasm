const MAIN_BUFFER_SIZE = 16 * 1024;
const mainBufferPtr = memory.data(MAIN_BUFFER_SIZE, 64);

export function Hash_GetBuffer(): usize {
  return mainBufferPtr;
}

let lo: u32;
let hi: u32;
let a: u32;
let b: u32;
let c: u32;
let d: u32;
const bufferPtr = memory.data(64, 64);
const blockPtr = memory.data(512, 64);

@inline
function STEP_F(a: u32, b: u32, c: u32, d: u32, x: u32, t: u32, s: u32): u32 {
  const F: u32 = d ^ (b & (c ^ d));
  a += F + x + t;
  a = rotl<u32>(a, s);
  a += b;
  return a;
}

@inline
function STEP_G(a: u32, b: u32, c: u32, d: u32, x: u32, t: u32, s: u32): u32 {
  const G: u32 = c ^ (d & (b ^ c));
  a += G + x + t;
  a = rotl<u32>(a, s);
  a += b;
  return a;
}

@inline
function STEP_H(a: u32, b: u32, c: u32, d: u32, x: u32, t: u32, s: u32): u32 {
  const H: u32 = (b ^ c) ^ d;
  a += H + x + t;
  a = rotl<u32>(a, s);
  a += b;
  return a;
}

@inline
function STEP_H2(a: u32, b: u32, c: u32, d: u32, x: u32, t: u32, s: u32): u32 {
  const H2: u32 = b ^ (c ^ d);
  a += H2 + x + t;
  a = rotl<u32>(a, s);
  a += b;
  return a;
}

@inline
function STEP_I(a: u32, b: u32, c: u32, d: u32, x: u32, t: u32, s: u32): u32 {
  const I: u32 = c ^ (b | ~d);
  a += I + x + t;
  a = rotl<u32>(a, s);
  a += b;
  return a;
}

function body(data: usize, size: u32): usize {
  let ptr: usize = data;
  let la: u32, lb: u32, lc: u32, ld: u32;
  let saved_a: u32, saved_b: u32, saved_c: u32, saved_d: u32;

  la = a;
  lb = b;
  lc = c;
  ld = d;

  do {
    saved_a = la;
    saved_b = lb;
    saved_c = lc;
    saved_d = ld;

    /* Round 1 */
    la = STEP_F(la, lb, lc, ld, load<u32>(ptr, 4 * 0), 0xd76aa478, 7);
    ld = STEP_F(ld, la, lb, lc, load<u32>(ptr, 4 * 1), 0xe8c7b756, 12);
    lc = STEP_F(lc, ld, la, lb, load<u32>(ptr, 4 * 2), 0x242070db, 17);
    lb = STEP_F(lb, lc, ld, la, load<u32>(ptr, 4 * 3), 0xc1bdceee, 22);
    la = STEP_F(la, lb, lc, ld, load<u32>(ptr, 4 * 4), 0xf57c0faf, 7);
    ld = STEP_F(ld, la, lb, lc, load<u32>(ptr, 4 * 5), 0x4787c62a, 12);
    lc = STEP_F(lc, ld, la, lb, load<u32>(ptr, 4 * 6), 0xa8304613, 17);
    lb = STEP_F(lb, lc, ld, la, load<u32>(ptr, 4 * 7), 0xfd469501, 22);
    la = STEP_F(la, lb, lc, ld, load<u32>(ptr, 4 * 8), 0x698098d8, 7);
    ld = STEP_F(ld, la, lb, lc, load<u32>(ptr, 4 * 9), 0x8b44f7af, 12);
    lc = STEP_F(lc, ld, la, lb, load<u32>(ptr, 4 * 10), 0xffff5bb1, 17);
    lb = STEP_F(lb, lc, ld, la, load<u32>(ptr, 4 * 11), 0x895cd7be, 22);
    la = STEP_F(la, lb, lc, ld, load<u32>(ptr, 4 * 12), 0x6b901122, 7);
    ld = STEP_F(ld, la, lb, lc, load<u32>(ptr, 4 * 13), 0xfd987193, 12);
    lc = STEP_F(lc, ld, la, lb, load<u32>(ptr, 4 * 14), 0xa679438e, 17);
    lb = STEP_F(lb, lc, ld, la, load<u32>(ptr, 4 * 15), 0x49b40821, 22);

    /* Round 2 */
    la = STEP_G(la, lb, lc, ld, load<u32>(ptr, 4 * 1), 0xf61e2562, 5)
    ld = STEP_G(ld, la, lb, lc, load<u32>(ptr, 4 * 6), 0xc040b340, 9)
    lc = STEP_G(lc, ld, la, lb, load<u32>(ptr, 4 * 11), 0x265e5a51, 14)
    lb = STEP_G(lb, lc, ld, la, load<u32>(ptr, 4 * 0), 0xe9b6c7aa, 20)
    la = STEP_G(la, lb, lc, ld, load<u32>(ptr, 4 * 5), 0xd62f105d, 5)
    ld = STEP_G(ld, la, lb, lc, load<u32>(ptr, 4 * 10), 0x02441453, 9)
    lc = STEP_G(lc, ld, la, lb, load<u32>(ptr, 4 * 15), 0xd8a1e681, 14)
    lb = STEP_G(lb, lc, ld, la, load<u32>(ptr, 4 * 4), 0xe7d3fbc8, 20)
    la = STEP_G(la, lb, lc, ld, load<u32>(ptr, 4 * 9), 0x21e1cde6, 5)
    ld = STEP_G(ld, la, lb, lc, load<u32>(ptr, 4 * 14), 0xc33707d6, 9)
    lc = STEP_G(lc, ld, la, lb, load<u32>(ptr, 4 * 3), 0xf4d50d87, 14)
    lb = STEP_G(lb, lc, ld, la, load<u32>(ptr, 4 * 8), 0x455a14ed, 20)
    la = STEP_G(la, lb, lc, ld, load<u32>(ptr, 4 * 13), 0xa9e3e905, 5)
    ld = STEP_G(ld, la, lb, lc, load<u32>(ptr, 4 * 2), 0xfcefa3f8, 9)
    lc = STEP_G(lc, ld, la, lb, load<u32>(ptr, 4 * 7), 0x676f02d9, 14)
    lb = STEP_G(lb, lc, ld, la, load<u32>(ptr, 4 * 12), 0x8d2a4c8a, 20)

    /* Round 3 */
    la = STEP_H(la, lb, lc, ld, load<u32>(ptr, 4 * 5), 0xfffa3942, 4)
    ld = STEP_H2(ld, la, lb, lc, load<u32>(ptr, 4 * 8), 0x8771f681, 11)
    lc = STEP_H(lc, ld, la, lb, load<u32>(ptr, 4 * 11), 0x6d9d6122, 16)
    lb = STEP_H2(lb, lc, ld, la, load<u32>(ptr, 4 * 14), 0xfde5380c, 23)
    la = STEP_H(la, lb, lc, ld, load<u32>(ptr, 4 * 1), 0xa4beea44, 4)
    ld = STEP_H2(ld, la, lb, lc, load<u32>(ptr, 4 * 4), 0x4bdecfa9, 11)
    lc = STEP_H(lc, ld, la, lb, load<u32>(ptr, 4 * 7), 0xf6bb4b60, 16)
    lb = STEP_H2(lb, lc, ld, la, load<u32>(ptr, 4 * 10), 0xbebfbc70, 23)
    la = STEP_H(la, lb, lc, ld, load<u32>(ptr, 4 * 13), 0x289b7ec6, 4)
    ld = STEP_H2(ld, la, lb, lc, load<u32>(ptr, 4 * 0), 0xeaa127fa, 11)
    lc = STEP_H(lc, ld, la, lb, load<u32>(ptr, 4 * 3), 0xd4ef3085, 16)
    lb = STEP_H2(lb, lc, ld, la, load<u32>(ptr, 4 * 6), 0x04881d05, 23)
    la = STEP_H(la, lb, lc, ld, load<u32>(ptr, 4 * 9), 0xd9d4d039, 4)
    ld = STEP_H2(ld, la, lb, lc, load<u32>(ptr, 4 * 12), 0xe6db99e5, 11)
    lc = STEP_H(lc, ld, la, lb, load<u32>(ptr, 4 * 15), 0x1fa27cf8, 16)
    lb = STEP_H2(lb, lc, ld, la, load<u32>(ptr, 4 * 2), 0xc4ac5665, 23)

    /* Round 4 */
    la = STEP_I(la, lb, lc, ld, load<u32>(ptr, 4 * 0), 0xf4292244, 6)
    ld = STEP_I(ld, la, lb, lc, load<u32>(ptr, 4 * 7), 0x432aff97, 10)
    lc = STEP_I(lc, ld, la, lb, load<u32>(ptr, 4 * 14), 0xab9423a7, 15)
    lb = STEP_I(lb, lc, ld, la, load<u32>(ptr, 4 * 5), 0xfc93a039, 21)
    la = STEP_I(la, lb, lc, ld, load<u32>(ptr, 4 * 12), 0x655b59c3, 6)
    ld = STEP_I(ld, la, lb, lc, load<u32>(ptr, 4 * 3), 0x8f0ccc92, 10)
    lc = STEP_I(lc, ld, la, lb, load<u32>(ptr, 4 * 10), 0xffeff47d, 15)
    lb = STEP_I(lb, lc, ld, la, load<u32>(ptr, 4 * 1), 0x85845dd1, 21)
    la = STEP_I(la, lb, lc, ld, load<u32>(ptr, 4 * 8), 0x6fa87e4f, 6)
    ld = STEP_I(ld, la, lb, lc, load<u32>(ptr, 4 * 15), 0xfe2ce6e0, 10)
    lc = STEP_I(lc, ld, la, lb, load<u32>(ptr, 4 * 6), 0xa3014314, 15)
    lb = STEP_I(lb, lc, ld, la, load<u32>(ptr, 4 * 13), 0x4e0811a1, 21)
    la = STEP_I(la, lb, lc, ld, load<u32>(ptr, 4 * 4), 0xf7537e82, 6)
    ld = STEP_I(ld, la, lb, lc, load<u32>(ptr, 4 * 11), 0xbd3af235, 10)
    lc = STEP_I(lc, ld, la, lb, load<u32>(ptr, 4 * 2), 0x2ad7d2bb, 15)
    lb = STEP_I(lb, lc, ld, la, load<u32>(ptr, 4 * 9), 0xeb86d391, 21)

    la += saved_a;
    lb += saved_b;
    lc += saved_c;
    ld += saved_d;

    ptr += 64;
  } while (size -= 64);

  a = la;
  b = lb;
  c = lc;
  d = ld;

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

@inline
function memcpy(dst: usize, src: usize, size: u32): void {
  while (size >= 8) {
    store<u64>(dst, load<u64>(src));
    src += 8;
    dst += 8;
    size -= 8;
  }
  while (size > 0) {
    store<u8>(dst, load<u8>(src));
    src++;
    dst++;
    size -= 1;
  }
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
      memcpy(bufferPtr + used, data, size);
      return;
    }

    memcpy(bufferPtr + used, data, available);
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

  memcpy(bufferPtr, data, size);
  // for (let i: u32 = 0; i < size; i++) {
  //   store<u8>(bufferPtr + i, load<u8>(data + i));
  // }
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
  store<u32>(bufferPtr + 56, lo);
  store<u32>(bufferPtr + 60, hi);

  body(bufferPtr, 64);

  store<u32>(result, a);
  store<u32>(result + 4, b);
  store<u32>(result + 8, c);
  store<u32>(result + 12, d);
}

export function Hash_Calculate(length: u32): void {
  Hash_Init();
  Hash_Update(length);
  Hash_Final();
}
