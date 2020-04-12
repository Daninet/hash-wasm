/* sha3.c - an implementation of Secure Hash Algorithm 3 (Keccak).
 * based on the
 * The Keccak SHA-3 submission. Submission to NIST (Round 3), 2011
 * by Guido Bertoni, Joan Daemen, Michaël Peeters and Gilles Van Assche
 *
 * Copyright (c) 2013, Aleksey Kravchenko <rhash.admin@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE  INCLUDING ALL IMPLIED WARRANTIES OF  MERCHANTABILITY
 * AND FITNESS.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT,  OR CONSEQUENTIAL DAMAGES  OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE,  DATA OR PROFITS,  WHETHER IN AN ACTION OF CONTRACT,  NEGLIGENCE
 * OR OTHER TORTIOUS ACTION,  ARISING OUT OF  OR IN CONNECTION  WITH THE USE  OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

#include <string.h>
#include <sys/types.h>
#include <emscripten.h>

#define NumberOfRounds 24
#define sha3_max_permutation_size 25
#define sha3_max_rate_in_qwords 24

#define IS_ALIGNED_64(p) (0 == (7 & ((const char*)(p) - (const char*)0)))
#define I64(x) x##ULL
#define ROTL64(qword, n) ((qword) << (n) ^ ((qword) >> (64 - (n))))

struct SHA3_CTX
{
  /* 1600 bits algorithm hashing state */
  uint64_t hash[sha3_max_permutation_size];
  /* 1536-bit buffer for leftovers */
  uint64_t message[sha3_max_rate_in_qwords];
  /* count of bytes in the message[] buffer */
  unsigned rest;
  /* size of a message block processed at once */
  unsigned block_size;
};

struct SHA3_CTX sctx;
struct SHA3_CTX* ctx = &sctx;
uint8_t array[16 * 1024];

EMSCRIPTEN_KEEPALIVE
uint8_t* Hash_GetBuffer()
{
  return array;
}

/* SHA3 (Keccak) constants for 24 rounds */
static uint64_t keccak_round_constants[NumberOfRounds] = {
  I64(0x0000000000000001), I64(0x0000000000008082), I64(0x800000000000808A), I64(0x8000000080008000),
  I64(0x000000000000808B), I64(0x0000000080000001), I64(0x8000000080008081), I64(0x8000000000008009),
  I64(0x000000000000008A), I64(0x0000000000000088), I64(0x0000000080008009), I64(0x000000008000000A),
  I64(0x000000008000808B), I64(0x800000000000008B), I64(0x8000000000008089), I64(0x8000000000008003),
  I64(0x8000000000008002), I64(0x8000000000000080), I64(0x000000000000800A), I64(0x800000008000000A),
  I64(0x8000000080008081), I64(0x8000000000008080), I64(0x0000000080000001), I64(0x8000000080008008)
};

/* Initializing a sha3 context for given number of output bits */
EMSCRIPTEN_KEEPALIVE
void Hash_Init(uint32_t bits)
{
  /* NB: The Keccak capacity parameter = bits * 2 */
  uint32_t rate = 1600 - bits * 2;

  memset(ctx, 0, sizeof(struct SHA3_CTX));
  ctx->block_size = rate / 8;
}

#define XORED_A(i) A[(i)] ^ A[(i) + 5] ^ A[(i) + 10] ^ A[(i) + 15] ^ A[(i) + 20]
#define THETA_STEP(i) \
  A[(i)]      ^= D[(i)]; \
  A[(i) + 5]  ^= D[(i)]; \
  A[(i) + 10] ^= D[(i)]; \
  A[(i) + 15] ^= D[(i)]; \
  A[(i) + 20] ^= D[(i)] \

/* Keccak theta() transformation */
static void keccak_theta(uint64_t* A)
{
  uint64_t D[5];
  D[0] = ROTL64(XORED_A(1), 1) ^ XORED_A(4);
  D[1] = ROTL64(XORED_A(2), 1) ^ XORED_A(0);
  D[2] = ROTL64(XORED_A(3), 1) ^ XORED_A(1);
  D[3] = ROTL64(XORED_A(4), 1) ^ XORED_A(2);
  D[4] = ROTL64(XORED_A(0), 1) ^ XORED_A(3);
  THETA_STEP(0);
  THETA_STEP(1);
  THETA_STEP(2);
  THETA_STEP(3);
  THETA_STEP(4);
}

/* Keccak pi() transformation */
static void keccak_pi(uint64_t* A)
{
  uint64_t A1;
  A1 = A[1];
  A[ 1] = A[ 6];
  A[ 6] = A[ 9];
  A[ 9] = A[22];
  A[22] = A[14];
  A[14] = A[20];
  A[20] = A[ 2];
  A[ 2] = A[12];
  A[12] = A[13];
  A[13] = A[19];
  A[19] = A[23];
  A[23] = A[15];
  A[15] = A[ 4];
  A[ 4] = A[24];
  A[24] = A[21];
  A[21] = A[ 8];
  A[ 8] = A[16];
  A[16] = A[ 5];
  A[ 5] = A[ 3];
  A[ 3] = A[18];
  A[18] = A[17];
  A[17] = A[11];
  A[11] = A[ 7];
  A[ 7] = A[10];
  A[10] = A1;
  /* note: A[ 0] is left as is */
}

#define CHI_STEP(i) \
  A0 = A[0 + (i)]; \
  A1 = A[1 + (i)]; \
  A[0 + (i)] ^= ~A1 & A[2 + (i)]; \
  A[1 + (i)] ^= ~A[2 + (i)] & A[3 + (i)]; \
  A[2 + (i)] ^= ~A[3 + (i)] & A[4 + (i)]; \
  A[3 + (i)] ^= ~A[4 + (i)] & A0; \
  A[4 + (i)] ^= ~A0 & A1 \

/* Keccak chi() transformation */
static void keccak_chi(uint64_t* A)
{
  uint64_t A0, A1;
  CHI_STEP(0);
  CHI_STEP(5);
  CHI_STEP(10);
  CHI_STEP(15);
  CHI_STEP(20);
}

static void sha3_permutation(uint64_t* state)
{
  for (int round = 0; round < NumberOfRounds; round++) {
    keccak_theta(state);

    /* apply Keccak rho() transformation */
    state[ 1] = ROTL64(state[ 1],  1);
    state[ 2] = ROTL64(state[ 2], 62);
    state[ 3] = ROTL64(state[ 3], 28);
    state[ 4] = ROTL64(state[ 4], 27);
    state[ 5] = ROTL64(state[ 5], 36);
    state[ 6] = ROTL64(state[ 6], 44);
    state[ 7] = ROTL64(state[ 7],  6);
    state[ 8] = ROTL64(state[ 8], 55);
    state[ 9] = ROTL64(state[ 9], 20);
    state[10] = ROTL64(state[10],  3);
    state[11] = ROTL64(state[11], 10);
    state[12] = ROTL64(state[12], 43);
    state[13] = ROTL64(state[13], 25);
    state[14] = ROTL64(state[14], 39);
    state[15] = ROTL64(state[15], 41);
    state[16] = ROTL64(state[16], 45);
    state[17] = ROTL64(state[17], 15);
    state[18] = ROTL64(state[18], 21);
    state[19] = ROTL64(state[19],  8);
    state[20] = ROTL64(state[20], 18);
    state[21] = ROTL64(state[21],  2);
    state[22] = ROTL64(state[22], 61);
    state[23] = ROTL64(state[23], 56);
    state[24] = ROTL64(state[24], 14);

    keccak_pi(state);
    keccak_chi(state);

    /* apply iota(state, round) */
    *state ^= keccak_round_constants[round];
  }
}

/**
 * The core transformation. Process the specified block of data.
 *
 * @param hash the algorithm state
 * @param block the message block to process
 * @param block_size the size of the processed block in bytes
 */
static void sha3_process_block(uint64_t hash[25], const uint64_t* block, uint32_t block_size)
{
  /* expanded loop */
  hash[ 0] ^= block[0];
  hash[ 1] ^= block[1];
  hash[ 2] ^= block[2];
  hash[ 3] ^= block[3];
  hash[ 4] ^= block[4];
  hash[ 5] ^= block[5];
  hash[ 6] ^= block[6];
  hash[ 7] ^= block[7];
  hash[ 8] ^= block[8];
  /* if not sha3-512 */
  if (block_size > 72) {
    hash[ 9] ^= block[9];
    hash[10] ^= block[10];
    hash[11] ^= block[11];
    hash[12] ^= block[12];
    /* if not sha3-384 */
    if (block_size > 104) {
      hash[13] ^= block[13];
      hash[14] ^= block[14];
      hash[15] ^= block[15];
      hash[16] ^= block[16];
      /* if not sha3-256 */
      if (block_size > 136) {
        hash[17] ^= block[17];
#ifdef FULL_SHA3_FAMILY_SUPPORT
        /* if not sha3-224 */
        if (block_size > 144) {
          hash[18] ^= block[18];
          hash[19] ^= block[19];
          hash[20] ^= block[20];
          hash[21] ^= block[21];
          hash[22] ^= block[22];
          hash[23] ^= block[23];
          hash[24] ^= block[24];
        }
#endif
      }
    }
  }
  /* make a permutation of the hash */
  sha3_permutation(hash);
}

#define SHA3_FINALIZED 0x80000000

/**
 * Calculate message hash.
 * Can be called repeatedly with chunks of the message to be hashed.
 *
 * @param msg message chunk
 * @param size length of the message chunk
 */
EMSCRIPTEN_KEEPALIVE
void Hash_Update(uint32_t size)
{
  const uint8_t *msg = array;
  uint32_t index = (uint32_t)ctx->rest;
  uint32_t block_size = (uint32_t)ctx->block_size;

  if (ctx->rest & SHA3_FINALIZED) return; /* too late for additional input */
  ctx->rest = (unsigned)((ctx->rest + size) % block_size);

  /* fill partial block */
  if (index) {
    uint32_t left = block_size - index;
    memcpy((uint8_t*)ctx->message + index, msg, (size < left ? size : left));
    if (size < left) return;

    /* process partial block */
    sha3_process_block(ctx->hash, ctx->message, block_size);
    msg  += left;
    size -= left;
  }

  while (size >= block_size) {
    uint64_t* aligned_message_block;
    if (IS_ALIGNED_64(msg)) {
      /* the most common case is processing of an already aligned message
      without copying it */
      aligned_message_block = (uint64_t*)msg;
    } else {
      memcpy(ctx->message, msg, block_size);
      aligned_message_block = ctx->message;
    }

    sha3_process_block(ctx->hash, aligned_message_block, block_size);
    msg  += block_size;
    size -= block_size;
  }

  if (size) {
    memcpy(ctx->message, msg, size); /* save leftovers */
  }
}

/**
 * Store calculated hash into the given array.
 */
EMSCRIPTEN_KEEPALIVE
void Hash_Final(uint8_t padding)
{
  uint32_t digest_length = 100 - ctx->block_size / 2;
  const uint32_t block_size = ctx->block_size;

  if (!(ctx->rest & SHA3_FINALIZED)) {
    /* clear the rest of the data queue */
    memset((int8_t*)ctx->message + ctx->rest, 0, block_size - ctx->rest);
    ((int8_t*)ctx->message)[ctx->rest] |= padding;
    ((int8_t*)ctx->message)[block_size - 1] |= 0x80;

    /* process final block */
    sha3_process_block(ctx->hash, ctx->message, block_size);
    ctx->rest = SHA3_FINALIZED; /* mark context as finalized */
  }

  memcpy(array, ctx->hash, digest_length);
}
