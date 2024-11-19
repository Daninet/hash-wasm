import fs from "node:fs";
import { createXXHash128, xxhash128 as origXXHash128 } from "../lib";
import type { IDataType } from "../lib/util";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

const xxhash128 = async (data: IDataType) =>
	origXXHash128(data, 0x76543210, 0xfedcba98);

test("simple strings with 0 seed", async () => {
	expect(await origXXHash128("")).toBe("99aa06d3014798d86001c324468d497f");
	expect(await origXXHash128("a")).toBe("a96faf705af16834e6c632b61e964e1f");
	expect(await origXXHash128("a\x00")).toBe("fe6c33c14011b5780d78baac08237ddb");
	expect(await origXXHash128("abc")).toBe("06b05ab6733a618578af5f94892f3950");
	expect(await origXXHash128("1234567890")).toBe(
		"82d9f70aeb974c48565e705734e91277",
	);
});

test("simple strings with FF seed", async () => {
	expect(await origXXHash128("", 0xff)).toBe(
		"cdffe4eccab82d80b8f58ddafc3701e9",
	);
	expect(await origXXHash128("a", 0xff)).toBe(
		"8d3a71916c1eba63823451005b75c214",
	);
	expect(await origXXHash128("1234567890", 0xff)).toBe(
		"fdeb6e88caea8b896ef69089eb03093d",
	);
});

test("simple strings with ABCD seed", async () => {
	expect(await origXXHash128("", 0xabcd)).toBe(
		"1bc0c8603f8f37eaef324444feed1c13",
	);
	expect(await origXXHash128("a", 0xabcd)).toBe(
		"4439c290759639040ccd599d595f9d58",
	);
	expect(await origXXHash128("1234567890", 0xabcd)).toBe(
		"8d8644c8806db1f7cd7e5e69c092dbe7",
	);
});

test("different seeds give different response", async () => {
	expect(await origXXHash128("", 0xab)).not.toBe(await origXXHash128("", 0xac));
	expect(await origXXHash128("", 0xab)).not.toBe(
		await origXXHash128("", 0xab, 0x0c),
	);
	expect(await origXXHash128("", 0xab, 0x0d)).not.toBe(
		await origXXHash128("", 0xab, 0x0c),
	);
	expect(await origXXHash128("", 0, 0x0d)).not.toBe(
		await origXXHash128("", 0, 0x0c),
	);
	expect(await origXXHash128("", 0, 0)).not.toBe(await origXXHash128("", 1, 0));
	expect(await origXXHash128("", 0, 0)).not.toBe(await origXXHash128("", 0, 1));
	expect((await createXXHash128(1, 2)).init().update("").digest()).toBe(
		await origXXHash128("", 1, 2),
	);
	expect((await createXXHash128(1, 2)).init().update("").digest()).not.toBe(
		await origXXHash128("", 1, 3),
	);
	expect((await createXXHash128(0, 2)).init().update("").digest()).not.toBe(
		await origXXHash128("", 0, 1),
	);
	expect((await createXXHash128(1, 0)).init().update("").digest()).not.toBe(
		await origXXHash128("", 0, 0),
	);
});

test("simple strings", async () => {
	expect(await xxhash128("")).toBe("258c3140e9acde456f0610acd4631b3d");
	expect(await xxhash128("a")).toBe("ec6c741ea572296c42901760fdc9d406");
	expect(await xxhash128("1234567890")).toBe(
		"50b0fcf3cf8a6a7b86b30e7917971068",
	);
	expect(await xxhash128("a\x00")).toBe("5a076edd8e1cb3608bee3ef85c9ae5d0");
	expect(await xxhash128("abc")).toBe("fffe4c37bd6f23955c3c0696c616fa15");
	expect(await xxhash128("message digest")).toBe(
		"762dad1152fca7505465f1ab077f3ab6",
	);
	expect(await xxhash128("abcdefghijklmnopqrstuvwxyz")).toBe(
		"972cd1cc9b1db75f7a359825199acf86",
	);
	expect(
		await xxhash128(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe("f5c371a7965b7c0173b0ae72b3936b6f");
	expect(
		await xxhash128(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe("4a852ab07607c14f6cbeb984312460bb");
});

test("unicode strings", async () => {
	expect(await xxhash128("😊")).toBe("1218a358d09001a4cf8449f0f7485464");
	expect(await xxhash128("😊a😊")).toBe("030e0000c817dd98ab1edeeb378a703a");
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await xxhash128(file)).toBe("52d2646c246d67bdaca6bbc548f4aa6b");
	expect(await xxhash128(file.toString())).toBe(
		"52d2646c246d67bdaca6bbc548f4aa6b",
	);
});

test("Node.js buffers", async () => {
	expect(await xxhash128(Buffer.from([]))).toBe(
		"258c3140e9acde456f0610acd4631b3d",
	);
	expect(await xxhash128(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"ec6c741ea572296c42901760fdc9d406",
	);
	expect(await xxhash128(Buffer.from([0]))).toBe(
		"a09afc61a0c767fe76761c489ed890a3",
	);
	expect(await xxhash128(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe(
		"9435bb9864f63027c1ba5284bd6915c3",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await xxhash128(Buffer.from(arr))).toBe(
		"ef12519ad92140e711a754d7b5a36cbd",
	);
	const uint8 = new Uint8Array(arr);
	expect(await xxhash128(uint8)).toBe("ef12519ad92140e711a754d7b5a36cbd");
	expect(await xxhash128(new Uint16Array(uint8.buffer))).toBe(
		"ef12519ad92140e711a754d7b5a36cbd",
	);
	expect(await xxhash128(new Uint32Array(uint8.buffer))).toBe(
		"ef12519ad92140e711a754d7b5a36cbd",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await xxhash128(str)).toBe("c1380ab9b0eee39e4d027e04f529b605");
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await xxhash128(buf)).toBe("c8f7dcec1a55dd40dca1cb10b10d07e1");
});

test("chunked", async () => {
	const hash = await createXXHash128();
	expect(hash.digest()).toBe("99aa06d3014798d86001c324468d497f");
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe("67efc4231140fbdf132156fd5c56489f");

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe("4854d6391b50e992c59bacb9b7840d6a");
});

test("chunked increasing length", async () => {
	const hash = await createXXHash128(0x76543210, 0xfedcba98);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await xxhash128(new Uint8Array(flatchunks));
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
		origXXHash128("a"),
		origXXHash128("abc"),
	]);
	expect(hashA).toBe("a96faf705af16834e6c632b61e964e1f");
	expect(hashB).toBe("06b05ab6733a618578af5f94892f3950");
});

test("interlaced create", async () => {
	const hashA = await createXXHash128();
	hashA.update("a");
	const hashB = await createXXHash128();
	hashB.update("abc");
	expect(hashA.digest()).toBe("a96faf705af16834e6c632b61e964e1f");
	expect(hashB.digest()).toBe("06b05ab6733a618578af5f94892f3950");
});

test("invalid parameters", async () => {
	await expect(origXXHash128("", -1)).rejects.toThrow();
	await expect(origXXHash128("", "a" as any)).rejects.toThrow();
	await expect(origXXHash128("", 0xffffffff + 1)).rejects.toThrow();
	await expect(origXXHash128("", 0.1)).rejects.toThrow();
	await expect(origXXHash128("", Number.NaN)).rejects.toThrow();

	await expect(origXXHash128("", 0, -1)).rejects.toThrow();
	await expect(origXXHash128("", 0, "a" as any)).rejects.toThrow();
	await expect(origXXHash128("", 0, 0xffffffff + 1)).rejects.toThrow();
	await expect(origXXHash128("", 0, 0.1)).rejects.toThrow();
	await expect(origXXHash128("", 0, Number.NaN)).rejects.toThrow();

	await expect(createXXHash128(-1 as any)).rejects.toThrow();
	await expect(createXXHash128("a" as any)).rejects.toThrow();
	await expect(createXXHash128((0xffffffff + 1) as any)).rejects.toThrow();
	await expect(createXXHash128(0.1 as any)).rejects.toThrow();
	await expect(createXXHash128(Number.NaN as any)).rejects.toThrow();

	await expect(createXXHash128(0, -1 as any)).rejects.toThrow();
	await expect(createXXHash128(0, "a" as any)).rejects.toThrow();
	await expect(createXXHash128(0, (0xffffffff + 1) as any)).rejects.toThrow();
	await expect(createXXHash128(0, 0.1 as any)).rejects.toThrow();
	await expect(createXXHash128(0, Number.NaN as any)).rejects.toThrow();
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createXXHash128();

	for (const input of invalidInputs) {
		await expect(origXXHash128(input as any)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
