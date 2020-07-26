/*
  BLAKE2 reference source code package - reference C implementations
  Copyright 2012, Samuel Neves <sneves@dei.uc.pt>.  You may use this under the
  terms of the CC0, the OpenSSL Licence, or the Apache Public License 2.0, at
  your option.  The terms of these licenses can be found at:
  - CC0 1.0 Universal : http://creativecommons.org/publicdomain/zero/1.0
  - OpenSSL license   : https://www.openssl.org/source/license.html
  - Apache 2.0        : http://www.apache.org/licenses/LICENSE-2.0

  More information about the BLAKE2 hash function can be found at
  https://blake2.net.

  Modified for hash-wasm by Dani Biró
*/

#include <stdint.h>
#include <string.h>
#include <stdio.h>
#include <emscripten.h>

uint8_t array[16 * 1024];

EMSCRIPTEN_KEEPALIVE
uint8_t* Hash_GetBuffer()
{
  return array;
}

#define ROTATE(x, n) (((x) >> (n)) | ((x) << (64-(n))))

static __inline__ uint64_t rotr64( const uint64_t w, const unsigned c )
{
  return ( w >> c ) | ( w << ( 64 - c ) );
}

#define G(a,b,c,d)                                       \
  do {                                                   \
    a = a + b + 2 * (a & 0xFFFFFFFF) * (b & 0xFFFFFFFF); \
    d = rotr64(d ^ a, 32);                               \
    c = c + d + 2 * (c & 0xFFFFFFFF) * (d & 0xFFFFFFFF); \
    b = rotr64(b ^ c, 24);                               \
    a = a + b + 2 * (a & 0xFFFFFFFF) * (b & 0xFFFFFFFF); \
    d = rotr64(d ^ a, 16);                               \
    c = c + d + 2 * (c & 0xFFFFFFFF) * (d & 0xFFFFFFFF); \
    b = rotr64(b ^ c, 63);                               \
  } while(0)

void _P(
  uint64_t *a0, uint64_t *a1, uint64_t *a2, uint64_t *a3,
  uint64_t *a4, uint64_t *a5, uint64_t *a6, uint64_t *a7,
  uint64_t *a8, uint64_t *a9, uint64_t *a10, uint64_t *a11,
  uint64_t *a12, uint64_t *a13, uint64_t *a14, uint64_t *a15
) {
  G(*a0,*a4,*a8,*a12);
  G(*a1,*a5,*a9,*a13);
  G(*a2,*a6,*a10,*a14);
  G(*a3,*a7,*a11,*a15);
  G(*a0,*a5,*a10,*a15);
  G(*a1,*a6,*a11,*a12);
  G(*a2,*a7,*a8,*a13);
  G(*a3,*a4,*a9,*a14);
}

void block() {
  uint64_t *z = (uint64_t*)array;
  uint64_t *t = (uint64_t*)(array + 1024);
  uint64_t *a = (uint64_t*)(array + 1024 * 2);
  uint64_t *b = (uint64_t*)(array + 1024 * 3);

  for (int i = 0; i<128; i++) {
    t[i] = a[i] ^ b[i];
  }

  for (int i = 0; i<128; i+=16) {
    _P(&t[i], &t[i+1], &t[i+2], &t[i+3], &t[i+4], &t[i+5], &t[i+6], &t[i+7], &t[i+8], &t[i+9], &t[i+10], &t[i+11], &t[i+12], &t[i+13], &t[i+14], &t[i+15]);
  }

  _P(&t[0], &t[1], &t[16], &t[17], &t[32], &t[33], &t[48], &t[49], &t[64], &t[65], &t[80], &t[81], &t[96], &t[97], &t[112], &t[113]);
  _P(&t[2], &t[3], &t[18], &t[19], &t[34], &t[35], &t[50], &t[51], &t[66], &t[67], &t[82], &t[83], &t[98], &t[99], &t[114], &t[115]);
  _P(&t[4], &t[5], &t[20], &t[21], &t[36], &t[37], &t[52], &t[53], &t[68], &t[69], &t[84], &t[85], &t[100], &t[101], &t[116], &t[117]);
  _P(&t[6], &t[7], &t[22], &t[23], &t[38], &t[39], &t[54], &t[55], &t[70], &t[71], &t[86], &t[87], &t[102], &t[103], &t[118], &t[119]);
  _P(&t[8], &t[9], &t[24], &t[25], &t[40], &t[41], &t[56], &t[57], &t[72], &t[73], &t[88], &t[89], &t[104], &t[105], &t[120], &t[121]);
  _P(&t[10], &t[11], &t[26], &t[27], &t[42], &t[43], &t[58], &t[59], &t[74], &t[75], &t[90], &t[91], &t[106], &t[107], &t[122], &t[123]);
  _P(&t[12], &t[13], &t[28], &t[29], &t[44], &t[45], &t[60], &t[61], &t[76], &t[77], &t[92], &t[93], &t[108], &t[109], &t[124], &t[125]);
  _P(&t[14], &t[15], &t[30], &t[31], &t[46], &t[47], &t[62], &t[63], &t[78], &t[79], &t[94], &t[95], &t[110], &t[111], &t[126], &t[127]);

  for (int i = 0; i<128; i++) {
    z[i] ^= a[i] ^ b[i] ^ t[i];
  }
}

EMSCRIPTEN_KEEPALIVE
void Hash_Calculate()
{
  block();
}
