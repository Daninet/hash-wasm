import fs from "node:fs";
import { createSHA3, sha3 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await sha3("", 256)).toBe(
		"a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
	);
	expect(await sha3("a", 256)).toBe(
		"80084bf2fba02475726feb2cab2d8215eab14bc6bdd8bfb2c8151257032ecd8b",
	);
	expect(await sha3("a\x00", 256)).toBe(
		"39fdad608c5b60008da2f12414441f5f664472792c8bc1567a9fbae617800604",
	);
	expect(await sha3("abc", 256)).toBe(
		"3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532",
	);
	expect(await sha3("message digest", 256)).toBe(
		"edcdb2069366e75243860c18c3a11465eca34bce6143d30c8665cefcfd32bffd",
	);
	expect(await sha3("abcdefghijklmnopqrstuvwxyz", 256)).toBe(
		"7cab2dc765e21b241dbc1c255ce620b29f527c6d5e7f5f843e56288f0d707521",
	);
	expect(
		await sha3(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			256,
		),
	).toBe("a79d6a9da47f04a3b9a9323ec9991f2105d4c78a7bc7beeb103855a7a11dfb9f");
	expect(
		await sha3(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			256,
		),
	).toBe("293e5ce4ce54ee71990ab06e511b7ccd62722b1beb414f5ff65c8274e0f5be1d");
});

test("unicode strings", async () => {
	expect(await sha3("😊", 256)).toBe(
		"bcc7f78f1b69f99a717f5d9bc259fc7590c263004d75b6fdfd8c36edf58cc699",
	);
	expect(await sha3("😊a😊", 256)).toBe(
		"37d9dee3d9b6934601f33ccf4d0416e00f6f0f4d81beb485f1c326843abf28c6",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await sha3(file, 256)).toBe(
		"545d6d9ee94baf98ee762951170c145bb36f44420cd9d0df458b2972fd810259",
	);
	expect(await sha3(file.toString(), 256)).toBe(
		"545d6d9ee94baf98ee762951170c145bb36f44420cd9d0df458b2972fd810259",
	);
});

test("Node.js buffers", async () => {
	expect(await sha3(Buffer.from([]), 256)).toBe(
		"a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
	);
	expect(await sha3(Buffer.from(["a".charCodeAt(0)]), 256)).toBe(
		"80084bf2fba02475726feb2cab2d8215eab14bc6bdd8bfb2c8151257032ecd8b",
	);
	expect(await sha3(Buffer.from([0]), 256)).toBe(
		"5d53469f20fef4f8eab52b88044ede69c77a6a68a60728609fc4a65ff531e7d0",
	);
	expect(await sha3(Buffer.from([0, 1, 0, 0, 2, 0]), 256)).toBe(
		"a42054373bef1a0875a9b25b3c92dca260099414c75ff1e903bd747e9bc76be5",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await sha3(Buffer.from(arr), 256)).toBe(
		"d9c0377dbded7714cc2e148a1b8af395ed441ccd04309c7bb5d54f77015a5662",
	);
	const uint8 = new Uint8Array(arr);
	expect(await sha3(uint8, 256)).toBe(
		"d9c0377dbded7714cc2e148a1b8af395ed441ccd04309c7bb5d54f77015a5662",
	);
	expect(await sha3(new Uint16Array(uint8.buffer), 256)).toBe(
		"d9c0377dbded7714cc2e148a1b8af395ed441ccd04309c7bb5d54f77015a5662",
	);
	expect(await sha3(new Uint32Array(uint8.buffer), 256)).toBe(
		"d9c0377dbded7714cc2e148a1b8af395ed441ccd04309c7bb5d54f77015a5662",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await sha3(str, 256)).toBe(
		"ab6edf38364a373f51e31b834f47ecb7ac5af7a0d10bb1fd213f9e4145f48885",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await sha3(buf, 256)).toBe(
		"5fcaad8772a4d9e0d378e364eda70aaef208c88962acee744e81d946c9ca0390",
	);
});

test("chunked", async () => {
	const hash = await createSHA3(256);
	expect(hash.digest()).toBe(
		"a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"b95fcce2ad9288a04c6c00f847b315c2337fdf59c2ae243bdce49a701e79bc4d",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"0cead56ef57accf5926eace3551767f86dcbde669ed4dab0eeff78c4f8d914b9",
	);
});

test("chunked increasing length", async () => {
	const hash = await createSHA3(256);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await sha3(new Uint8Array(flatchunks), 256);
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
	const [hashA, hashB] = await Promise.all([sha3("a", 256), sha3("abc", 256)]);
	expect(hashA).toBe(
		"80084bf2fba02475726feb2cab2d8215eab14bc6bdd8bfb2c8151257032ecd8b",
	);
	expect(hashB).toBe(
		"3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532",
	);
});

test("interlaced create", async () => {
	const hashA = await createSHA3(256);
	hashA.update("a");
	const hashB = await createSHA3(256);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"80084bf2fba02475726feb2cab2d8215eab14bc6bdd8bfb2c8151257032ecd8b",
	);
	expect(hashB.digest()).toBe(
		"3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createSHA3(256);

	for (const input of invalidInputs) {
		await expect(sha3(input as any, 256)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
