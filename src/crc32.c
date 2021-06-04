// //////////////////////////////////////////////////////////
// Crc32.cpp
// Copyright (c) 2011-2019 Stephan Brumme. All rights reserved.
// Slicing-by-16 contributed by Bulat Ziganshin
// Tableless bytewise CRC contributed by Hagai Gold
// see http://create.stephan-brumme.com/disclaimer.html
//
// Modified for hash-wasm by Dani Biró
//

#define WITH_BUFFER
#include "hash-wasm.h"

#define bswap_32(x) __builtin_bswap32(x)

uint32_t Crc32Lookup[8][256] = {0};

void init_lut() {
  for (int i = 0; i < 256; ++i) {
    uint32_t crc = i;
    for (int j = 0; j < 8; ++j) {
      crc = (crc >> 1) ^ (-(int32_t)(crc & 1) & 0xEDB88320);
    }
    Crc32Lookup[0][i] = crc;
  }

  for (uint32_t i = 1; i < 256; ++i) {
    uint32_t lv = Crc32Lookup[0][i];
    for (uint32_t j = 1; j < 8; ++j) {
      lv = (lv >> 8) ^ Crc32Lookup[0][lv & 255];
      Crc32Lookup[j][i] = lv;
    }
  }
}

uint32_t lut_initialized = 0;
uint32_t previousCrc32 = 0;

WASM_EXPORT
void Hash_Init() {
  if (lut_initialized == 0) {
    init_lut();
    lut_initialized = 1;
  }
  previousCrc32 = 0;
}

WASM_EXPORT
void Hash_Update(uint32_t length) {
  const uint8_t* data = main_buffer;

  uint32_t crc = ~previousCrc32; // same as previousCrc32 ^ 0xFFFFFFFF
  const uint32_t* current = (const uint32_t*)data;

  // process eight bytes at once (Slicing-by-8)
  while (length >= 8) {
    uint32_t one = *current++ ^ crc;
    uint32_t two = *current++;
    crc = Crc32Lookup[0][(two >> 24) & 0xFF] ^
          Crc32Lookup[1][(two >> 16) & 0xFF] ^
          Crc32Lookup[2][(two >> 8) & 0xFF] ^
          Crc32Lookup[3][two & 0xFF] ^
          Crc32Lookup[4][(one >> 24) & 0xFF] ^
          Crc32Lookup[5][(one >> 16) & 0xFF] ^
          Crc32Lookup[6][(one >> 8) & 0xFF] ^
          Crc32Lookup[7][one & 0xFF];

    length -= 8;
  }

  const uint8_t* currentChar = (const uint8_t*)current;

  // remaining 1 to 7 bytes (standard algorithm)
  while (length-- != 0) {
    crc = (crc >> 8) ^ Crc32Lookup[0][(crc & 0xFF) ^ *currentChar++];
  }

  previousCrc32 = ~crc; // same as crc ^ 0xFFFFFFFF
}

WASM_EXPORT
void Hash_Final() {
  ((uint32_t*)main_buffer)[0] = bswap_32(previousCrc32);
}

WASM_EXPORT
const uint32_t STATE_SIZE = sizeof(previousCrc32); 

WASM_EXPORT
uint8_t* Hash_GetState() {
  return (uint8_t*) &previousCrc32;
}

WASM_EXPORT
void Hash_Calculate(uint32_t length) {
  Hash_Init();
  Hash_Update(length);
  Hash_Final();
}
