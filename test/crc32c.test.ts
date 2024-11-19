import fs from "fs";
import { crc32c, createCRC32C } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
  expect(await crc32c("")).toBe("00000000");
  expect(await crc32c("a")).toBe("c1d04330");
  expect(await crc32c("1234567890")).toBe("f3dbd4fe");
  expect(await crc32c("a\x00")).toBe("625fcaa3");
  expect(await crc32c("abc")).toBe("364b3fb7");
  expect(await crc32c("message digest")).toBe("02bd79d0");
  expect(await crc32c("abcdefghijklmnopqrstuvwxyz")).toBe("9ee6ef25");
  expect(
    await crc32c(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    )
  ).toBe("a245d57d");
  expect(
    await crc32c(
      "12345678901234567890123456789012345678901234567890123456789012345678901234567890"
    )
  ).toBe("477a6781");
});

test("unicode strings", async () => {
  expect(await crc32c("😊")).toBe("8802f34c");
  expect(await crc32c("😊a😊")).toBe("0f51707f");
  const file = fs.readFileSync("./test/utf8.txt");
  expect(await crc32c(file)).toBe("96665a41");
  expect(await crc32c(file.toString())).toBe("96665a41");
});

test("Node.js buffers", async () => {
  expect(await crc32c(Buffer.from([]))).toBe("00000000");
  expect(await crc32c(Buffer.from(["a".charCodeAt(0)]))).toBe("c1d04330");
  expect(await crc32c(Buffer.from([0]))).toBe("527d5351");
  expect(await crc32c(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe("487e23c8");
});

test("typed arrays", async () => {
  const arr = [0, 1, 2, 3, 4, 5, 255, 254];
  expect(await crc32c(Buffer.from(arr))).toBe("cbdc7d33");
  const uint8 = new Uint8Array(arr);
  expect(await crc32c(uint8)).toBe("cbdc7d33");
  expect(await crc32c(new Uint16Array(uint8.buffer))).toBe("cbdc7d33");
  expect(await crc32c(new Uint32Array(uint8.buffer))).toBe("cbdc7d33");
});

test("long strings", async () => {
  const SIZE = 5 * 1024 * 1024;
  const chunk = "012345678\x09";
  const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
  expect(await crc32c(str)).toBe("8546928c");
});

test("long buffers", async () => {
  const SIZE = 5 * 1024 * 1024;
  const buf = Buffer.alloc(SIZE);
  buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
  expect(await crc32c(buf)).toBe("1acced17");
});

test("chunked", async () => {
  const hash = await createCRC32C();
  expect(hash.digest()).toBe("00000000");
  hash.init();
  hash.update("a");
  hash.update(new Uint8Array([0]));
  hash.update("bc");
  hash.update(new Uint8Array([255, 254]));
  expect(hash.digest()).toBe("c0f47d77");

  hash.init();
  for (let i = 0; i < 1000; i++) {
    hash.update(new Uint8Array([i & 0xff]));
  }
  hash.update(Buffer.alloc(1000).fill(0xdf));
  expect(hash.digest()).toBe("b9c3c58a");
});

test("chunked increasing length", async () => {
  const hash = await createCRC32C();
  const test = async (maxLen: number) => {
    const chunks = getVariableLengthChunks(maxLen);
    const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
    const hashRef = await crc32c(new Uint8Array(flatchunks));
    hash.init();
    chunks.forEach((chunk) => hash.update(new Uint8Array(chunk)));
    expect(hash.digest("hex")).toBe(hashRef);
  };
  const maxLens = [1, 3, 27, 50, 57, 64, 91, 127, 256, 300];
  await Promise.all(maxLens.map((length) => test(length)));
});

test("interlaced shorthand", async () => {
  const [hashA, hashB] = await Promise.all([crc32c("a"), crc32c("abc")]);
  expect(hashA).toBe("c1d04330");
  expect(hashB).toBe("364b3fb7");
});

test("interlaced create", async () => {
  const hashA = await createCRC32C();
  hashA.update("a");
  const hashB = await createCRC32C();
  hashB.update("abc");
  expect(hashA.digest()).toBe("c1d04330");
  expect(hashB.digest()).toBe("364b3fb7");
});

test("Invalid inputs throw", async () => {
  const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
  const hash = await createCRC32C();

  invalidInputs.forEach(async (input: any) => {
    await expect(crc32c(input)).rejects.toThrow();
    expect(() => hash.update(input)).toThrow();
  });
});
