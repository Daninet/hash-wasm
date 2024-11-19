import fs from "node:fs";
import { blake2s, createBLAKE2s } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await blake2s("", 256)).toBe(
		"69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9",
	);
	expect(await blake2s("a", 256)).toBe(
		"4a0d129873403037c2cd9b9048203687f6233fb6738956e0349bd4320fec3e90",
	);
	expect(await blake2s("a\x00", 256)).toBe(
		"ccf69953dbc8db243e506bb559f512cadc5c78ff8414a68891d06e9c22be6a4a",
	);
	expect(await blake2s("abc", 256)).toBe(
		"508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982",
	);
	expect(await blake2s("message digest", 256)).toBe(
		"fa10ab775acf89b7d3c8a6e823d586f6b67bdbac4ce207fe145b7d3ac25cd28c",
	);
	expect(await blake2s("abcdefghijklmnopqrstuvwxyz", 256)).toBe(
		"bdf88eb1f86a0cdf0e840ba88fa118508369df186c7355b4b16cf79fa2710a12",
	);
	expect(
		await blake2s(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			256,
		),
	).toBe("c75439ea17e1de6fa4510c335dc3d3f343e6f9e1ce2773e25b4174f1df8b119b");
	expect(
		await blake2s(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			256,
		),
	).toBe("fdaedb290a0d5af9870864fec2e090200989dc9cd53a3c092129e8535e8b4f66");
});

test("unicode strings", async () => {
	expect(await blake2s("😊", 256)).toBe(
		"4365acf20b7a8ad6373b396b8db10eb244b26a634b2f4c96ce9d87a9322012b1",
	);
	expect(await blake2s("😊a😊", 256)).toBe(
		"3ef82992ee992cdae00e7ef1d7a3b993f190220357c17087a5cb927c5117f323",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await blake2s(file, 256)).toBe(
		"b6932e13aaecb5fe41fea27190052627ae5dbf41ca1d88abddb16d02b71a434d",
	);
	expect(await blake2s(file.toString(), 256)).toBe(
		"b6932e13aaecb5fe41fea27190052627ae5dbf41ca1d88abddb16d02b71a434d",
	);
});

test("Node.js buffers", async () => {
	expect(await blake2s(Buffer.from([]), 256)).toBe(
		"69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9",
	);
	expect(await blake2s(Buffer.from(["a".charCodeAt(0)]), 256)).toBe(
		"4a0d129873403037c2cd9b9048203687f6233fb6738956e0349bd4320fec3e90",
	);
	expect(await blake2s(Buffer.from([0]), 256)).toBe(
		"e34d74dbaf4ff4c6abd871cc220451d2ea2648846c7757fbaac82fe51ad64bea",
	);
	expect(await blake2s(Buffer.from([0, 1, 0, 0, 2, 0]), 256)).toBe(
		"0019097d5ed0d33cd96c9ff7043dde07affeb95db37c6e6bc1e29ab42136f356",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await blake2s(Buffer.from(arr), 256)).toBe(
		"ee86879fd51bb4754d07e8f5c127b9feca43770760d8b6024ac3dc5c8d90f91e",
	);
	const uint8 = new Uint8Array(arr);
	expect(await blake2s(uint8, 256)).toBe(
		"ee86879fd51bb4754d07e8f5c127b9feca43770760d8b6024ac3dc5c8d90f91e",
	);
	expect(await blake2s(new Uint16Array(uint8.buffer), 256)).toBe(
		"ee86879fd51bb4754d07e8f5c127b9feca43770760d8b6024ac3dc5c8d90f91e",
	);
	expect(await blake2s(new Uint32Array(uint8.buffer), 256)).toBe(
		"ee86879fd51bb4754d07e8f5c127b9feca43770760d8b6024ac3dc5c8d90f91e",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await blake2s(str, 256)).toBe(
		"a2ca125c9ea3ab6dd0d72c0844d6f8a3e0a028e37da1b13575ac7de2ef4c7c6c",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await blake2s(buf, 256)).toBe(
		"b998ce32f66baf22c3250f9934c735ba57055afeea88c0bc6e1928df461bec8d",
	);
});

test("chunked", async () => {
	const hash = await createBLAKE2s(256);
	expect(hash.digest()).toBe(
		"69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"c824d9920c5038550128be6c465b33433bb9c60f182d6d9c117a3c32e24a1067",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"9687c1d39748492a7ea4913ea8b2ac4e27569825493203197f3c7d21bf1df21b",
	);
});

test("chunked increasing length", async () => {
	const hash = await createBLAKE2s(256);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await blake2s(new Uint8Array(flatchunks), 256);
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
		blake2s("a", 256),
		blake2s("abc", 256),
	]);
	expect(hashA).toBe(
		"4a0d129873403037c2cd9b9048203687f6233fb6738956e0349bd4320fec3e90",
	);
	expect(hashB).toBe(
		"508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982",
	);
});

test("interlaced create", async () => {
	const hashA = await createBLAKE2s(256);
	hashA.update("a");
	const hashB = await createBLAKE2s(256);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"4a0d129873403037c2cd9b9048203687f6233fb6738956e0349bd4320fec3e90",
	);
	expect(hashB.digest()).toBe(
		"508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createBLAKE2s(256);

	for (const input of invalidInputs) {
		await expect(blake2s(input as any, 256)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
