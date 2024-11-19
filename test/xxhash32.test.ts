import fs from "node:fs";
import { createXXHash32, xxhash32 as origXXHash32 } from "../lib";
import type { IDataType } from "../lib/util";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

const xxhash32 = async (data: IDataType) => origXXHash32(data, 0x6789abcd);

test("simple strings with 0 seed", async () => {
	expect(await origXXHash32("")).toBe("02cc5d05");
	expect(await origXXHash32("a")).toBe("550d7456");
	expect(await origXXHash32("a\x00")).toBe("19832f52");
	expect(await origXXHash32("abc")).toBe("32d153ff");
	expect(await origXXHash32("1234567890")).toBe("e8412d73");
});

test("simple strings", async () => {
	expect(await xxhash32("")).toBe("51c917a3");
	expect(await xxhash32("a")).toBe("88488ff7");
	expect(await xxhash32("1234567890")).toBe("e488df66");
	expect(await xxhash32("a\x00")).toBe("0e7c1075");
	expect(await xxhash32("abc")).toBe("344def81");
	expect(await xxhash32("message digest")).toBe("072766cd");
	expect(await xxhash32("abcdefghijklmnopqrstuvwxyz")).toBe("d4ea111e");
	expect(
		await xxhash32(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe("7768b3a0");
	expect(
		await xxhash32(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe("6273ef9a");
});

test("unicode strings", async () => {
	expect(await xxhash32("😊")).toBe("6dcaa4fe");
	expect(await xxhash32("😊a😊")).toBe("421b3b97");
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await xxhash32(file)).toBe("1807f963");
	expect(await xxhash32(file.toString())).toBe("1807f963");
});

test("Node.js buffers", async () => {
	expect(await xxhash32(Buffer.from([]))).toBe("51c917a3");
	expect(await xxhash32(Buffer.from(["a".charCodeAt(0)]))).toBe("88488ff7");
	expect(await xxhash32(Buffer.from([0]))).toBe("666de50d");
	expect(await xxhash32(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe("5fd527bb");
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await xxhash32(Buffer.from(arr))).toBe("7eebdfd4");
	const uint8 = new Uint8Array(arr);
	expect(await xxhash32(uint8)).toBe("7eebdfd4");
	expect(await xxhash32(new Uint16Array(uint8.buffer))).toBe("7eebdfd4");
	expect(await xxhash32(new Uint32Array(uint8.buffer))).toBe("7eebdfd4");
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await xxhash32(str)).toBe("ee6e5c97");
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await xxhash32(buf)).toBe("d8416dcc");
});

test("chunked", async () => {
	const hash = await createXXHash32();
	expect(hash.digest()).toBe("02cc5d05");
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe("a0155f6d");

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe("7bba26d1");
});

test("chunked increasing length", async () => {
	const hash = await createXXHash32(0x6789abcd);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await xxhash32(new Uint8Array(flatchunks));
		hash.init();
		for (const chunk of chunks) {
			hash.update(new Uint8Array(chunk));
		}
		expect(hash.digest("hex")).toBe(hashRef);
	};
	const maxLens = [1, 3, 27, 50, 57, 64, 91, 127, 256, 300];
	await Promise.all(maxLens.map((length) => test(length)));
});

test("interlaced shorthand", async () => {
	const [hashA, hashB] = await Promise.all([
		origXXHash32("a"),
		origXXHash32("abc"),
	]);
	expect(hashA).toBe("550d7456");
	expect(hashB).toBe("32d153ff");
});

test("interlaced create", async () => {
	const hashA = await createXXHash32();
	hashA.update("a");
	const hashB = await createXXHash32();
	hashB.update("abc");
	expect(hashA.digest()).toBe("550d7456");
	expect(hashB.digest()).toBe("32d153ff");
});

test("invalid parameters", async () => {
	await expect(origXXHash32("", -1)).rejects.toThrow();
	await expect(origXXHash32("", "a" as any)).rejects.toThrow();
	await expect(origXXHash32("", 0xffffffff + 1)).rejects.toThrow();
	await expect(origXXHash32("", 0.1)).rejects.toThrow();
	await expect(origXXHash32("", Number.NaN)).rejects.toThrow();

	await expect(createXXHash32(-1 as any)).rejects.toThrow();
	await expect(createXXHash32("a" as any)).rejects.toThrow();
	await expect(createXXHash32((0xffffffff + 1) as any)).rejects.toThrow();
	await expect(createXXHash32(0.1 as any)).rejects.toThrow();
	await expect(createXXHash32(Number.NaN as any)).rejects.toThrow();
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createXXHash32();

	for (const input of invalidInputs) {
		await expect(origXXHash32(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
