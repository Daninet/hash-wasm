import fs from "node:fs";
import { createXXHash3, xxhash3 as origXXHash3 } from "../lib";
import type { IDataType } from "../lib/util";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

const xxhash3 = async (data: IDataType) =>
	origXXHash3(data, 0x76543210, 0xfedcba98);

test("simple strings with 0 seed", async () => {
	expect(await origXXHash3("")).toBe("2d06800538d394c2");
	expect(await origXXHash3("a")).toBe("e6c632b61e964e1f");
	expect(await origXXHash3("a\x00")).toBe("0d78baac08237ddb");
	expect(await origXXHash3("abc")).toBe("78af5f94892f3950");
	expect(await origXXHash3("1234567890")).toBe("80048550fad2b420");
});

test("simple strings with FF seed", async () => {
	expect(await origXXHash3("", 0xff)).toBe("1dca9a93ff400151");
	expect(await origXXHash3("a", 0xff)).toBe("823451005b75c214");
	expect(await origXXHash3("1234567890", 0xff)).toBe("4c2fc6a4b09e110c");
});

test("simple strings with ABCD seed", async () => {
	expect(await origXXHash3("", 0xabcd)).toBe("fa8b77a43faf999f");
	expect(await origXXHash3("a", 0xabcd)).toBe("0ccd599d595f9d58");
	expect(await origXXHash3("1234567890", 0xabcd)).toBe("ad7b6f6a2e59e605");
});

test("different seeds give different response", async () => {
	expect(await origXXHash3("", 0xab)).not.toBe(await origXXHash3("", 0xac));
	expect(await origXXHash3("", 0xab)).not.toBe(
		await origXXHash3("", 0xab, 0x0c),
	);
	expect(await origXXHash3("", 0xab, 0x0d)).not.toBe(
		await origXXHash3("", 0xab, 0x0c),
	);
	expect(await origXXHash3("", 0, 0x0d)).not.toBe(
		await origXXHash3("", 0, 0x0c),
	);
	expect(await origXXHash3("", 0, 0)).not.toBe(await origXXHash3("", 1, 0));
	expect(await origXXHash3("", 0, 0)).not.toBe(await origXXHash3("", 0, 1));
	expect((await createXXHash3(1, 2)).init().update("").digest()).toBe(
		await origXXHash3("", 1, 2),
	);
	expect((await createXXHash3(1, 2)).init().update("").digest()).not.toBe(
		await origXXHash3("", 1, 3),
	);
	expect((await createXXHash3(0, 2)).init().update("").digest()).not.toBe(
		await origXXHash3("", 0, 1),
	);
	expect((await createXXHash3(1, 0)).init().update("").digest()).not.toBe(
		await origXXHash3("", 0, 0),
	);
});

test("simple strings", async () => {
	expect(await xxhash3("")).toBe("e2bda2b8c0a330da");
	expect(await xxhash3("a")).toBe("42901760fdc9d406");
	expect(await xxhash3("1234567890")).toBe("a7b90eacbf798783");
	expect(await xxhash3("a\x00")).toBe("8bee3ef85c9ae5d0");
	expect(await xxhash3("abc")).toBe("5c3c0696c616fa15");
	expect(await xxhash3("message digest")).toBe("d5b6febb78773d0a");
	expect(await xxhash3("abcdefghijklmnopqrstuvwxyz")).toBe("7c4e8d7b64b7f700");
	expect(
		await xxhash3(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe("30569891b862289b");
	expect(
		await xxhash3(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe("6e20719f479d9acb");
});

test("unicode strings", async () => {
	expect(await xxhash3("😊")).toBe("3e3dbbed63459c5f");
	expect(await xxhash3("😊a😊")).toBe("79b3bdb539ab5c92");
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await xxhash3(file)).toBe("aca6bbc548f4aa6b");
	expect(await xxhash3(file.toString())).toBe("aca6bbc548f4aa6b");
});

test("Node.js buffers", async () => {
	expect(await xxhash3(Buffer.from([]))).toBe("e2bda2b8c0a330da");
	expect(await xxhash3(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"42901760fdc9d406",
	);
	expect(await xxhash3(Buffer.from([0]))).toBe("76761c489ed890a3");
	expect(await xxhash3(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe(
		"7263b8ce0c0a4cd7",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await xxhash3(Buffer.from(arr))).toBe("eefc4cef77b1f015");
	const uint8 = new Uint8Array(arr);
	expect(await xxhash3(uint8)).toBe("eefc4cef77b1f015");
	expect(await xxhash3(new Uint16Array(uint8.buffer))).toBe("eefc4cef77b1f015");
	expect(await xxhash3(new Uint32Array(uint8.buffer))).toBe("eefc4cef77b1f015");
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await xxhash3(str)).toBe("4d027e04f529b605");
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await xxhash3(buf)).toBe("dca1cb10b10d07e1");
});

test("chunked", async () => {
	const hash = await createXXHash3();
	expect(hash.digest()).toBe("2d06800538d394c2");
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe("a6fc1f7c4d7b9969");

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe("c59bacb9b7840d6a");
});

test("chunked increasing length", async () => {
	const hash = await createXXHash3(0x76543210, 0xfedcba98);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await xxhash3(new Uint8Array(flatchunks));
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
		origXXHash3("a"),
		origXXHash3("abc"),
	]);
	expect(hashA).toBe("e6c632b61e964e1f");
	expect(hashB).toBe("78af5f94892f3950");
});

test("interlaced create", async () => {
	const hashA = await createXXHash3();
	hashA.update("a");
	const hashB = await createXXHash3();
	hashB.update("abc");
	expect(hashA.digest()).toBe("e6c632b61e964e1f");
	expect(hashB.digest()).toBe("78af5f94892f3950");
});

test("invalid parameters", async () => {
	await expect(origXXHash3("", -1)).rejects.toThrow();
	await expect(origXXHash3("", "a" as any)).rejects.toThrow();
	await expect(origXXHash3("", 0xffffffff + 1)).rejects.toThrow();
	await expect(origXXHash3("", 0.1)).rejects.toThrow();
	await expect(origXXHash3("", Number.NaN)).rejects.toThrow();

	await expect(origXXHash3("", 0, -1)).rejects.toThrow();
	await expect(origXXHash3("", 0, "a" as any)).rejects.toThrow();
	await expect(origXXHash3("", 0, 0xffffffff + 1)).rejects.toThrow();
	await expect(origXXHash3("", 0, 0.1)).rejects.toThrow();
	await expect(origXXHash3("", 0, Number.NaN)).rejects.toThrow();

	await expect(createXXHash3(-1 as any)).rejects.toThrow();
	await expect(createXXHash3("a" as any)).rejects.toThrow();
	await expect(createXXHash3((0xffffffff + 1) as any)).rejects.toThrow();
	await expect(createXXHash3(0.1 as any)).rejects.toThrow();
	await expect(createXXHash3(Number.NaN as any)).rejects.toThrow();

	await expect(createXXHash3(0, -1 as any)).rejects.toThrow();
	await expect(createXXHash3(0, "a" as any)).rejects.toThrow();
	await expect(createXXHash3(0, (0xffffffff + 1) as any)).rejects.toThrow();
	await expect(createXXHash3(0, 0.1 as any)).rejects.toThrow();
	await expect(createXXHash3(0, Number.NaN as any)).rejects.toThrow();
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createXXHash3();

	for (const input of invalidInputs) {
		await expect(origXXHash3(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
