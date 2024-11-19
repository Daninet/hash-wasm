import fs from "node:fs";
import { adler32, createAdler32 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await adler32("")).toBe("00000001");
	expect(await adler32("a")).toBe("00620062");
	expect(await adler32("1234567890")).toBe("0b2c020e");
	expect(await adler32("a\x00")).toBe("00c40062");
	expect(await adler32("abc")).toBe("024d0127");
	expect(await adler32("message digest")).toBe("29750586");
	expect(await adler32("abcdefghijklmnopqrstuvwxyz")).toBe("90860b20");
	expect(
		await adler32(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe("8adb150c");
	expect(
		await adler32(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe("97b61069");
});

test("unicode strings", async () => {
	expect(await adler32("😊")).toBe("075b02b2");
	expect(await adler32("😊a😊")).toBe("1e1105c4");
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await adler32(file)).toBe("dd7a5843");
	expect(await adler32(file.toString())).toBe("dd7a5843");
});

test("Node.js buffers", async () => {
	expect(await adler32(Buffer.from([]))).toBe("00000001");
	expect(await adler32(Buffer.from(["a".charCodeAt(0)]))).toBe("00620062");
	expect(await adler32(Buffer.from([0]))).toBe("00010001");
	expect(await adler32(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe("000f0004");
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await adler32(Buffer.from(arr))).toBe("0345020d");
	const uint8 = new Uint8Array(arr);
	expect(await adler32(uint8)).toBe("0345020d");
	expect(await adler32(new Uint16Array(uint8.buffer))).toBe("0345020d");
	expect(await adler32(new Uint32Array(uint8.buffer))).toBe("0345020d");
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await adler32(str)).toBe("de04df99");
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await adler32(buf)).toBe("1b87ca64");
});

test("chunked", async () => {
	const hash = await createAdler32();
	expect(hash.digest()).toBe("00000001");
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe("07f90324");

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe("06904e90");
});

test("chunked increasing length", async () => {
	const hash = await createAdler32();
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await adler32(new Uint8Array(flatchunks));
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
	const [hashA, hashB] = await Promise.all([adler32("a"), adler32("abc")]);
	expect(hashA).toBe("00620062");
	expect(hashB).toBe("024d0127");
});

test("interlaced create", async () => {
	const hashA = await createAdler32();
	hashA.update("a");
	const hashB = await createAdler32();
	hashB.update("abc");
	expect(hashA.digest()).toBe("00620062");
	expect(hashB.digest()).toBe("024d0127");
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createAdler32();

	for (const input of invalidInputs) {
		await expect(adler32(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
