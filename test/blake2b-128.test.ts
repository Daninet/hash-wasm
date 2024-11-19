import fs from "node:fs";
import { blake2b, createBLAKE2b } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await blake2b("", 128)).toBe("cae66941d9efbd404e4d88758ea67670");
	expect(await blake2b("a", 128)).toBe("27c35e6e9373877f29e562464e46497e");
	expect(await blake2b("a\x00", 128)).toBe("396660e76c84bb7786f979f10b58fa79");
	expect(await blake2b("abc", 128)).toBe("cf4ab791c62b8d2b2109c90275287816");
	expect(await blake2b("message digest", 128)).toBe(
		"a235c121347fdd24feffe048dbe68ccc",
	);
	expect(await blake2b("abcdefghijklmnopqrstuvwxyz", 128)).toBe(
		"82a82a043c4946fa81b9a598a3e8d35b",
	);
	expect(
		await blake2b(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			128,
		),
	).toBe("38d187cd913684abd1d08f63337bdde1");
	expect(
		await blake2b(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			128,
		),
	).toBe("3242cc3901ffad79cb164104a9486881");
});

test("unicode strings", async () => {
	expect(await blake2b("😊", 128)).toBe("ad99432ec7a06269504c35cb14d308b6");
	expect(await blake2b("😊a😊", 128)).toBe("9f3f9baef29c626fa205069b1729c46d");
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await blake2b(file, 128)).toBe("bfa7e10f39f0120c640b0c09122a13b2");
	expect(await blake2b(file.toString(), 128)).toBe(
		"bfa7e10f39f0120c640b0c09122a13b2",
	);
});

test("Node.js buffers", async () => {
	expect(await blake2b(Buffer.from([]), 128)).toBe(
		"cae66941d9efbd404e4d88758ea67670",
	);
	expect(await blake2b(Buffer.from(["a".charCodeAt(0)]), 128)).toBe(
		"27c35e6e9373877f29e562464e46497e",
	);
	expect(await blake2b(Buffer.from([0]), 128)).toBe(
		"7025e075d5e2f6cde3cc051a31f07660",
	);
	expect(await blake2b(Buffer.from([0, 1, 0, 0, 2, 0]), 128)).toBe(
		"05b74966098218dd7a4e538981ac2984",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await blake2b(Buffer.from(arr), 128)).toBe(
		"9533446a2d7e4ebd36f196ab18ff5040",
	);
	const uint8 = new Uint8Array(arr);
	expect(await blake2b(uint8, 128)).toBe("9533446a2d7e4ebd36f196ab18ff5040");
	expect(await blake2b(new Uint16Array(uint8.buffer), 128)).toBe(
		"9533446a2d7e4ebd36f196ab18ff5040",
	);
	expect(await blake2b(new Uint32Array(uint8.buffer), 128)).toBe(
		"9533446a2d7e4ebd36f196ab18ff5040",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await blake2b(str, 128)).toBe("b403f117a7480ac5d6e2c95a36f297c6");
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await blake2b(buf, 128)).toBe("2ac5ecb59ea724a158e3fc27ea995d9a");
});

test("chunked", async () => {
	const hash = await createBLAKE2b(128);
	expect(hash.digest()).toBe("cae66941d9efbd404e4d88758ea67670");
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe("2c11b76032e1a69a2fbb51f97a0cd38b");

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe("7bf7eefed052e81f351589df83c8cde2");
});

test("chunked increasing length", async () => {
	const hash = await createBLAKE2b(128);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await blake2b(new Uint8Array(flatchunks), 128);
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
		blake2b("a", 128),
		blake2b("abc", 128),
	]);
	expect(hashA).toBe("27c35e6e9373877f29e562464e46497e");
	expect(hashB).toBe("cf4ab791c62b8d2b2109c90275287816");
});

test("interlaced create", async () => {
	const hashA = await createBLAKE2b(128);
	hashA.update("a");
	const hashB = await createBLAKE2b(128);
	hashB.update("abc");
	expect(hashA.digest()).toBe("27c35e6e9373877f29e562464e46497e");
	expect(hashB.digest()).toBe("cf4ab791c62b8d2b2109c90275287816");
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createBLAKE2b(128);

	for (const input of invalidInputs) {
		await expect(blake2b(input as any, 128)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
