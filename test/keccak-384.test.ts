import fs from "node:fs";
import { createKeccak, keccak } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await keccak("", 384)).toBe(
		"2c23146a63a29acf99e73b88f8c24eaa7dc60aa771780ccc006afbfa8fe2479b2dd2b21362337441ac12b515911957ff",
	);
	expect(await keccak("a", 384)).toBe(
		"85e964c0843a7ee32e6b5889d50e130e6485cffc826a30167d1dc2b3a0cc79cba303501a1eeaba39915f13baab5abacf",
	);
	expect(await keccak("a\x00", 384)).toBe(
		"028bf394389395fe49cda14bee0b5b54333babd65a9861e57c882b9ec7d752800a0a9d7abba9fdfe1c0f7dbe17378bab",
	);
	expect(await keccak("abc", 384)).toBe(
		"f7df1165f033337be098e7d288ad6a2f74409d7a60b49c36642218de161b1f99f8c681e4afaf31a34db29fb763e3c28e",
	);
	expect(await keccak("message digest", 384)).toBe(
		"8a377db088c43e44040a2bfb26676704999d90527913cabff0a3484825daa54d3061e67da7d836a0805356962af310e8",
	);
	expect(await keccak("abcdefghijklmnopqrstuvwxyz", 384)).toBe(
		"c5a708ec2178d8c398461547435e482cee0d85de3d75ddbff54e6606a7e9f994f023a6033b2bf4c516a5f71fc7470d1a",
	);
	expect(
		await keccak(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			384,
		),
	).toBe(
		"7377c5707506575c26937f3df0d44a773f8c7452c074ee1725c1ab62f741f95059459d64caebf35a7c247fe28616cab6",
	);
	expect(
		await keccak(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			384,
		),
	).toBe(
		"fd6e89cbe3271545f94c3e6786803260f929c1589e3091afd58cf32ef53a4f29b69c1166cb2982e2cb65cf5eb903e669",
	);
});

test("unicode strings", async () => {
	expect(await keccak("😊", 384)).toBe(
		"f24d96a6c0f802152b15c9fbbd0077c23522bb71a83c52e32caab18f9ab00a8e3bdd676382fb86c3cdfde9557e4e8e82",
	);
	expect(await keccak("😊a😊", 384)).toBe(
		"835dffb934460594e795233054ea7ca2f718db8b27022e1ab5ad1ff9b80336e2c64f528360cf4e13f01d95015be26d70",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await keccak(file, 384)).toBe(
		"a8b6e92a2d7776b7c3225d4660bf118fd8f70f271f55ad0c7f67585e2fd7f538e8d5dba1f03caa6d96f08698ac5c5fd5",
	);
	expect(await keccak(file.toString(), 384)).toBe(
		"a8b6e92a2d7776b7c3225d4660bf118fd8f70f271f55ad0c7f67585e2fd7f538e8d5dba1f03caa6d96f08698ac5c5fd5",
	);
});

test("Node.js buffers", async () => {
	expect(await keccak(Buffer.from([]), 384)).toBe(
		"2c23146a63a29acf99e73b88f8c24eaa7dc60aa771780ccc006afbfa8fe2479b2dd2b21362337441ac12b515911957ff",
	);
	expect(await keccak(Buffer.from(["a".charCodeAt(0)]), 384)).toBe(
		"85e964c0843a7ee32e6b5889d50e130e6485cffc826a30167d1dc2b3a0cc79cba303501a1eeaba39915f13baab5abacf",
	);
	expect(await keccak(Buffer.from([0]), 384)).toBe(
		"9265ed0d889a1327114cffa6fa682dce051855e24f9393a3faa7e4791124c9db1abef28f95f677134edefc63b02066d9",
	);
	expect(await keccak(Buffer.from([0, 1, 0, 0, 2, 0]), 384)).toBe(
		"8782aed7e739a4ffe2911da2466400b92110b22a8afab7aba8cdc42c878aef0ef992a1b53986e0eba80867b16cc3bc5f",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await keccak(Buffer.from(arr), 384)).toBe(
		"1004ba56a3ba107e8351d349867075bb9e9a7692669ae051b3dfeba5533a5ace195f55de85d585006b046db1c43ad410",
	);
	const uint8 = new Uint8Array(arr);
	expect(await keccak(uint8, 384)).toBe(
		"1004ba56a3ba107e8351d349867075bb9e9a7692669ae051b3dfeba5533a5ace195f55de85d585006b046db1c43ad410",
	);
	expect(await keccak(new Uint16Array(uint8.buffer), 384)).toBe(
		"1004ba56a3ba107e8351d349867075bb9e9a7692669ae051b3dfeba5533a5ace195f55de85d585006b046db1c43ad410",
	);
	expect(await keccak(new Uint32Array(uint8.buffer), 384)).toBe(
		"1004ba56a3ba107e8351d349867075bb9e9a7692669ae051b3dfeba5533a5ace195f55de85d585006b046db1c43ad410",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await keccak(str, 384)).toBe(
		"0e7e468a7a63d81e3e351baf2fdb81d8a832271b22847bb8cc323bde1e600daf6cbbcd431d8ecb5ffb154d4b6d30fb60",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await keccak(buf, 384)).toBe(
		"590f148219ae72d6ed25476ae7ee2c469d21daeed95f54b8ce8c900a337a1d3e04304ac211731fe8b7953d9d208364aa",
	);
});

test("chunked", async () => {
	const hash = await createKeccak(384);
	expect(hash.digest()).toBe(
		"2c23146a63a29acf99e73b88f8c24eaa7dc60aa771780ccc006afbfa8fe2479b2dd2b21362337441ac12b515911957ff",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"d9d8ffd1d568f9a19921212df3febc9a587adbe1af58012e8d90ae4f3ff9d4b95e32c5066f4a3d9c103c4810101488e8",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"10c6bf791a765398288627f3b360c9e2f34790e9e7c7fff8ecfa82ca95f67bed0ca9627295665747f4000eda29a5b99b",
	);
});

test("chunked increasing length", async () => {
	const hash = await createKeccak(384);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await keccak(new Uint8Array(flatchunks), 384);
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
		keccak("a", 384),
		keccak("abc", 384),
	]);
	expect(hashA).toBe(
		"85e964c0843a7ee32e6b5889d50e130e6485cffc826a30167d1dc2b3a0cc79cba303501a1eeaba39915f13baab5abacf",
	);
	expect(hashB).toBe(
		"f7df1165f033337be098e7d288ad6a2f74409d7a60b49c36642218de161b1f99f8c681e4afaf31a34db29fb763e3c28e",
	);
});

test("interlaced create", async () => {
	const hashA = await createKeccak(384);
	hashA.update("a");
	const hashB = await createKeccak(384);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"85e964c0843a7ee32e6b5889d50e130e6485cffc826a30167d1dc2b3a0cc79cba303501a1eeaba39915f13baab5abacf",
	);
	expect(hashB.digest()).toBe(
		"f7df1165f033337be098e7d288ad6a2f74409d7a60b49c36642218de161b1f99f8c681e4afaf31a34db29fb763e3c28e",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createKeccak(384);

	for (const input of invalidInputs) {
		await expect(keccak(input as any, 384)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
