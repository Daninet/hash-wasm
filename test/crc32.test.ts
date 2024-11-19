import fs from "node:fs";
import { crc32, createCRC32 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await crc32("")).toBe("00000000");
	expect(await crc32("a")).toBe("e8b7be43");
	expect(await crc32("1234567890")).toBe("261daee5");
	expect(await crc32("a\x00")).toBe("3d3f4819");
	expect(await crc32("abc")).toBe("352441c2");
	expect(await crc32("message digest")).toBe("20159d7f");
	expect(await crc32("abcdefghijklmnopqrstuvwxyz")).toBe("4c2750bd");
	expect(
		await crc32(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe("1fc2e6d2");
	expect(
		await crc32(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe("7ca94a72");
});

test("unicode strings", async () => {
	expect(await crc32("😊")).toBe("e5985c5a");
	expect(await crc32("😊a😊")).toBe("85dda337");
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await crc32(file)).toBe("15694f02");
	expect(await crc32(file.toString())).toBe("15694f02");
});

test("Node.js buffers", async () => {
	expect(await crc32(Buffer.from([]))).toBe("00000000");
	expect(await crc32(Buffer.from(["a".charCodeAt(0)]))).toBe("e8b7be43");
	expect(await crc32(Buffer.from([0]))).toBe("d202ef8d");
	expect(await crc32(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe("be94ea91");
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await crc32(Buffer.from(arr))).toBe("89b578d3");
	const uint8 = new Uint8Array(arr);
	expect(await crc32(uint8)).toBe("89b578d3");
	expect(await crc32(new Uint16Array(uint8.buffer))).toBe("89b578d3");
	expect(await crc32(new Uint32Array(uint8.buffer))).toBe("89b578d3");
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await crc32(str)).toBe("5d7c1b96");
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await crc32(buf)).toBe("8717a175");
});

test("chunked", async () => {
	const hash = await createCRC32();
	expect(hash.digest()).toBe("00000000");
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe("60f515c4");

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe("f683f7e3");
});

test("chunked increasing length", async () => {
	const hash = await createCRC32();
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await crc32(new Uint8Array(flatchunks));
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
	const [hashA, hashB] = await Promise.all([crc32("a"), crc32("abc")]);
	expect(hashA).toBe("e8b7be43");
	expect(hashB).toBe("352441c2");
});

test("interlaced create", async () => {
	const hashA = await createCRC32();
	hashA.update("a");
	const hashB = await createCRC32();
	hashB.update("abc");
	expect(hashA.digest()).toBe("e8b7be43");
	expect(hashB.digest()).toBe("352441c2");
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createCRC32();

	for (const input of invalidInputs) {
		await expect(crc32(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
