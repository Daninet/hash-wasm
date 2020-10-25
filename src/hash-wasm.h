#include <stdint.h>

#define NULL 0

#ifdef _MSC_VER
#define WASM_EXPORT
#define __inline__
#else
#define WASM_EXPORT __attribute__((visibility("default")))
#endif

#ifdef WITH_BUFFER

#define MAIN_BUFFER_SIZE 16 * 1024
uint8_t main_buffer[MAIN_BUFFER_SIZE];

WASM_EXPORT
uint8_t *Hash_GetBuffer() {
  return main_buffer;
}

#endif

// Sometimes LLVM emits these functions during the optimization step
// even with -nostdlib -fno-builtin flags
void* memcpy(void* dst, const void* src, uint32_t cnt) {
  uint8_t *destination = dst;
  const uint8_t *source = src;
  while (cnt) {
    *(destination++)= *(source++);
    --cnt;
  }
  return dst;
}

void* memset(void* dst, const uint8_t value, uint32_t cnt) {
  uint8_t *p = dst;
  while(cnt--) {
    *p++ = value;
  }
  return dst;
}
