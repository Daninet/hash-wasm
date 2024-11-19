import fs from "node:fs";
import { blake2b, createBLAKE2b } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await blake2b("", 256)).toBe(
		"0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8",
	);
	expect(await blake2b("a", 256)).toBe(
		"8928aae63c84d87ea098564d1e03ad813f107add474e56aedd286349c0c03ea4",
	);
	expect(await blake2b("a\x00", 256)).toBe(
		"d2373b17cd8a8e19e39f52fa4905a274f93805fbb8bb4c7f3cb4b2cd6708ec8a",
	);
	expect(await blake2b("abc", 256)).toBe(
		"bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319",
	);
	expect(await blake2b("message digest", 256)).toBe(
		"31a65b562925c6ffefdafa0ad830f4e33eff148856c2b4754de273814adf8b85",
	);
	expect(await blake2b("abcdefghijklmnopqrstuvwxyz", 256)).toBe(
		"117ad6b940f5e8292c007d9c7e7350cd33cf85b5887e8da71c7957830f536e7c",
	);
	expect(
		await blake2b(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			256,
		),
	).toBe("63f74bf0df57c4fd10f949edbe1cb7f6e374ecab882616381d6d999fda748b93");
	expect(
		await blake2b(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			256,
		),
	).toBe("a4705bbca1ae2e7a5d184a403a15f36c31c7e567adeae33f0f3e2f3ca9958198");
});

test("unicode strings", async () => {
	expect(await blake2b("😊", 256)).toBe(
		"a9079be0df26517abd0e38380ebb8ee53d50d1047cc33adab400ed39e8cd3306",
	);
	expect(await blake2b("😊a😊", 256)).toBe(
		"e32bffd4136ffe96f32c13bc1cb6d137607eba1de7c079a6bcb31e5873622495",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await blake2b(file, 256)).toBe(
		"2fe441dea729c45ef6c8b03acd77cdffc255b34dd4db8a2efb5ca3312522d425",
	);
	expect(await blake2b(file.toString(), 256)).toBe(
		"2fe441dea729c45ef6c8b03acd77cdffc255b34dd4db8a2efb5ca3312522d425",
	);
});

test("Node.js buffers", async () => {
	expect(await blake2b(Buffer.from([]), 256)).toBe(
		"0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8",
	);
	expect(await blake2b(Buffer.from(["a".charCodeAt(0)]), 256)).toBe(
		"8928aae63c84d87ea098564d1e03ad813f107add474e56aedd286349c0c03ea4",
	);
	expect(await blake2b(Buffer.from([0]), 256)).toBe(
		"03170a2e7597b7b7e3d84c05391d139a62b157e78786d8c082f29dcf4c111314",
	);
	expect(await blake2b(Buffer.from([0, 1, 0, 0, 2, 0]), 256)).toBe(
		"5672f9dd9ce2a45c22d5b998266e5bd788a0ad3aebe6e360196ab509cd2a5296",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await blake2b(Buffer.from(arr), 256)).toBe(
		"ba29acfa4a1c2276239bd60381b932818c7db44c69b6e76febe1b16ee478af35",
	);
	const uint8 = new Uint8Array(arr);
	expect(await blake2b(uint8, 256)).toBe(
		"ba29acfa4a1c2276239bd60381b932818c7db44c69b6e76febe1b16ee478af35",
	);
	expect(await blake2b(new Uint16Array(uint8.buffer), 256)).toBe(
		"ba29acfa4a1c2276239bd60381b932818c7db44c69b6e76febe1b16ee478af35",
	);
	expect(await blake2b(new Uint32Array(uint8.buffer), 256)).toBe(
		"ba29acfa4a1c2276239bd60381b932818c7db44c69b6e76febe1b16ee478af35",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await blake2b(str, 256)).toBe(
		"32267a3e613491b353577205f7d782a45ab1ab223efc9f33159abd3ce3846061",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await blake2b(buf, 256)).toBe(
		"9a4d4032072e60c9274eb3bc6511a71863dcfcd651ea87bf3a636ecf91f9e00f",
	);
});

test("chunked", async () => {
	const hash = await createBLAKE2b(256);
	expect(hash.digest()).toBe(
		"0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"b897b2e9034275975e29eb29782464424b8ba0eb3e5dc972a7f2c6f7d99a9465",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"17be6be2fd2461c9c2168d2fc529e733e5a6e9252306c1b0a73b9ac639d3c4e6",
	);
});

test("chunked increasing length", async () => {
	const hash = await createBLAKE2b(256);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await blake2b(new Uint8Array(flatchunks), 256);
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
		blake2b("a", 256),
		blake2b("abc", 256),
	]);
	expect(hashA).toBe(
		"8928aae63c84d87ea098564d1e03ad813f107add474e56aedd286349c0c03ea4",
	);
	expect(hashB).toBe(
		"bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319",
	);
});

test("interlaced create", async () => {
	const hashA = await createBLAKE2b(256);
	hashA.update("a");
	const hashB = await createBLAKE2b(256);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"8928aae63c84d87ea098564d1e03ad813f107add474e56aedd286349c0c03ea4",
	);
	expect(hashB.digest()).toBe(
		"bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createBLAKE2b(256);

	for (const input of invalidInputs) {
		await expect(blake2b(input as any, 256)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
