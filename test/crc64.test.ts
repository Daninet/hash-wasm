import fs from "node:fs";
import { crc64, createCRC64 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await crc64("")).toBe("0000000000000000");
	expect(await crc64("a")).toBe("330284772e652b05");
	expect(await crc64("1234567890")).toBe("b1cb31bbb4a2b2be");
	expect(await crc64("a\x00")).toBe("d7602ccdef615b2e");
	expect(await crc64("abc")).toBe("2cd8094a1a277627");
	expect(await crc64("message digest")).toBe("5dbcc956318a9b6f");
	expect(await crc64("abcdefghijklmnopqrstuvwxyz")).toBe("26967875751b122f");
	expect(
		await crc64(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe("0305bfe116b75626");
	expect(
		await crc64(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe("ae220a5d76b73ebd");
});

test("unicode strings", async () => {
	expect(await crc64("😊")).toBe("df73c949825718c3");
	expect(await crc64("😊a😊")).toBe("3faa139c31f8ef94");
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await crc64(file)).toBe("411adb4dceac4778");
	expect(await crc64(file.toString())).toBe("411adb4dceac4778");
});

test("Node.js buffers", async () => {
	expect(await crc64(Buffer.from([]))).toBe("0000000000000000");
	expect(await crc64(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"330284772e652b05",
	);
	expect(await crc64(Buffer.from([0]))).toBe("1fada17364673f59");
	expect(await crc64(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe("a4cbad973e91157a");
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await crc64(Buffer.from(arr))).toBe("09a40113c88f593d");
	const uint8 = new Uint8Array(arr);
	expect(await crc64(uint8)).toBe("09a40113c88f593d");
	expect(await crc64(new Uint16Array(uint8.buffer))).toBe("09a40113c88f593d");
	expect(await crc64(new Uint32Array(uint8.buffer))).toBe("09a40113c88f593d");
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await crc64(str)).toBe("78d1a62ea3dcc899");
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await crc64(buf)).toBe("902cccb9945d81c8");
});

test("chunked", async () => {
	const hash = await createCRC64();
	expect(hash.digest()).toBe("0000000000000000");
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe("4fbaccdf43bc3840");

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe("ca91869e58acdeee");
});

test("chunked increasing length", async () => {
	const hash = await createCRC64();
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await crc64(new Uint8Array(flatchunks));
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
	const [hashA, hashB] = await Promise.all([crc64("a"), crc64("abc")]);
	expect(hashA).toBe("330284772e652b05");
	expect(hashB).toBe("2cd8094a1a277627");
});

test("interlaced create", async () => {
	const hashA = await createCRC64();
	hashA.update("a");
	const hashB = await createCRC64();
	hashB.update("abc");
	expect(hashA.digest()).toBe("330284772e652b05");
	expect(hashB.digest()).toBe("2cd8094a1a277627");
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createCRC64();

	for (const input of invalidInputs) {
		await expect(crc64(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});

const ISO_POLY = "D800000000000000";

test("with iso poly", async () => {
	expect(await crc64("", ISO_POLY)).toBe("0000000000000000");
	expect(await crc64("abc", ISO_POLY)).toBe("3776c42000000000");
	expect(await crc64("1234567890", ISO_POLY)).toBe("43990956c775a410");

	const hash = await createCRC64(ISO_POLY);
	hash.update("abc");
	expect(hash.digest()).toBe("3776c42000000000");
	hash.init();
	hash.update("123");
	hash.update("4567890");
	expect(hash.digest()).toBe("43990956c775a410");
});
