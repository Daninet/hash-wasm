/*
 * https://github.com/mygityf/cipher
 * SHA-256 algorithm as described at
 *
 *   http://csrc.nist.gov/cryptval/shs.html
 */

#include <emscripten.h>
#include <string.h>
#include <sys/types.h>

typedef unsigned int uint32;
struct SHA256_State {
  uint32 h[8];
  unsigned char block[64];
  int blkused;
  uint32 lenhi, lenlo;
};

struct SHA256_State sctx;
struct SHA256_State* state = &sctx;
unsigned char array[16 * 1024];

EMSCRIPTEN_KEEPALIVE
unsigned char* Hash_GetBuffer()
{
  return array;
}

#define ror(x,y) ( ((x) << (32-y)) | (((uint32)(x)) >> (y)) )
#define shr(x,y) ( (((uint32)(x)) >> (y)) )
#define Ch(x,y,z) ( ((x) & (y)) ^ (~(x) & (z)) )
#define Maj(x,y,z) ( ((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)) )
#define bigsigma0(x) ( ror((x),2) ^ ror((x),13) ^ ror((x),22) )
#define bigsigma1(x) ( ror((x),6) ^ ror((x),11) ^ ror((x),25) )
#define smallsigma0(x) ( ror((x),7) ^ ror((x),18) ^ shr((x),3) )
#define smallsigma1(x) ( ror((x),17) ^ ror((x),19) ^ shr((x),10) )

#define PUT_32BIT_MSB_FIRST(cp, value) ( \
  (cp)[0] = (unsigned char)((value) >> 24), \
  (cp)[1] = (unsigned char)((value) >> 16), \
  (cp)[2] = (unsigned char)((value) >> 8), \
  (cp)[3] = (unsigned char)(value) )

void SHA224_Core_Init(struct SHA256_State *s) {
  s->h[0] = 0xc1059ed8ul;
  s->h[1] = 0x367cd507ul;
  s->h[2] = 0x3070dd17ul;
  s->h[3] = 0xf70e5939ul;
  s->h[4] = 0xffc00b31ul;
  s->h[5] = 0x68581511ul;
  s->h[6] = 0x64f98fa7ul;
  s->h[7] = 0xbefa4fa4ul;
}

void SHA256_Core_Init(struct SHA256_State *s) {
  s->h[0] = 0x6a09e667;
  s->h[1] = 0xbb67ae85;
  s->h[2] = 0x3c6ef372;
  s->h[3] = 0xa54ff53a;
  s->h[4] = 0x510e527f;
  s->h[5] = 0x9b05688c;
  s->h[6] = 0x1f83d9ab;
  s->h[7] = 0x5be0cd19;
}

void SHA256_Block(struct SHA256_State *s, uint32 *block) {
  uint32 w[80];
  uint32 a,b,c,d,e,f,g,h;
  static const int k[] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  };

  int t;

  for (t = 0; t < 16; t++)
    w[t] = block[t];

  for (t = 16; t < 64; t++)
    w[t] = smallsigma1(w[t-2]) + w[t-7] + smallsigma0(w[t-15]) + w[t-16];

  a = s->h[0]; b = s->h[1]; c = s->h[2]; d = s->h[3];
  e = s->h[4]; f = s->h[5]; g = s->h[6]; h = s->h[7];

  for (t = 0; t < 64; t+=8) {
    uint32 t1, t2;

#define ROUND(j,a,b,c,d,e,f,g,h) \
    t1 = h + bigsigma1(e) + Ch(e,f,g) + k[j] + w[j]; \
    t2 = bigsigma0(a) + Maj(a,b,c); \
    d = d + t1; h = t1 + t2;

    ROUND(t+0, a,b,c,d,e,f,g,h);
    ROUND(t+1, h,a,b,c,d,e,f,g);
    ROUND(t+2, g,h,a,b,c,d,e,f);
    ROUND(t+3, f,g,h,a,b,c,d,e);
    ROUND(t+4, e,f,g,h,a,b,c,d);
    ROUND(t+5, d,e,f,g,h,a,b,c);
    ROUND(t+6, c,d,e,f,g,h,a,b);
    ROUND(t+7, b,c,d,e,f,g,h,a);
  }

  s->h[0] += a; s->h[1] += b; s->h[2] += c; s->h[3] += d;
  s->h[4] += e; s->h[5] += f; s->h[6] += g; s->h[7] += h;
}

/* ----------------------------------------------------------------------
 * Outer SHA256 algorithm: take an arbitrary length byte string,
 * convert it into 16-word blocks with the prescribed padding at
 * the end, and pass those blocks to the core SHA256 algorithm.
 */

#define BLKSIZE 64

EMSCRIPTEN_KEEPALIVE
void Hash_Init(unsigned long bits) {
  if (bits == 224) {
    SHA224_Core_Init(state);
  } else {
    SHA256_Core_Init(state);
  }
  state->blkused = 0;
  state->lenhi = state->lenlo = 0;
}

void SHA256_Bytes(const void *p, int len) {
  struct SHA256_State *s = state;
  unsigned char *q = (unsigned char *)p;
  uint32 wordblock[16];
  uint32 lenw = len;
  int i;

  /*
    * Update the length field.
    */
  s->lenlo += lenw;
  s->lenhi += (s->lenlo < lenw);

  if (s->blkused && s->blkused+len < BLKSIZE) {
    /*
      * Trivial case: just add to the block.
      */
    memcpy(s->block + s->blkused, q, len);
    s->blkused += len;
  } else {
    /*
      * We must complete and process at least one block.
      */
    while (s->blkused + len >= BLKSIZE) {
      memcpy(s->block + s->blkused, q, BLKSIZE - s->blkused);
      q += BLKSIZE - s->blkused;
      len -= BLKSIZE - s->blkused;
      /* Now process the block. Gather bytes big-endian into words */
      for (i = 0; i < 16; i++) {
        wordblock[i] =
          ( ((uint32)s->block[i*4+0]) << 24 ) |
          ( ((uint32)s->block[i*4+1]) << 16 ) |
          ( ((uint32)s->block[i*4+2]) <<  8 ) |
          ( ((uint32)s->block[i*4+3]) <<  0 );
      }
      SHA256_Block(s, wordblock);
      s->blkused = 0;
    }
    memcpy(s->block, q, len);
    s->blkused = len;
  }
}

EMSCRIPTEN_KEEPALIVE
void Hash_Update(u_int32_t len)
{
  const unsigned char *data = array;
  SHA256_Bytes(data, len);
}

EMSCRIPTEN_KEEPALIVE
void Hash_Final() {
  unsigned char *digest = array;
  struct SHA256_State *s = state;
  int i;
  int pad;
  unsigned char c[64];
  uint32 lenhi, lenlo;

  if (s->blkused >= 56)
    pad = 56 + 64 - s->blkused;
  else
    pad = 56 - s->blkused;

  lenhi = (s->lenhi << 3) | (s->lenlo >> (32-3));
  lenlo = (s->lenlo << 3);

  memset(c, 0, pad);
  c[0] = 0x80;
  SHA256_Bytes(&c, pad);

  c[0] = (lenhi >> 24) & 0xFF;
  c[1] = (lenhi >> 16) & 0xFF;
  c[2] = (lenhi >>  8) & 0xFF;
  c[3] = (lenhi >>  0) & 0xFF;
  c[4] = (lenlo >> 24) & 0xFF;
  c[5] = (lenlo >> 16) & 0xFF;
  c[6] = (lenlo >>  8) & 0xFF;
  c[7] = (lenlo >>  0) & 0xFF;

  SHA256_Bytes(&c, 8);

  for (i = 0; i < 8; i++) {
    digest[i*4+0] = (s->h[i] >> 24) & 0xFF;
    digest[i*4+1] = (s->h[i] >> 16) & 0xFF;
    digest[i*4+2] = (s->h[i] >>  8) & 0xFF;
    digest[i*4+3] = (s->h[i] >>  0) & 0xFF;
  }
}
