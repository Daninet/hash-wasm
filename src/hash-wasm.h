#include <stdint.h>

#ifdef _MSC_VER
#define WASM_EXPORT
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
