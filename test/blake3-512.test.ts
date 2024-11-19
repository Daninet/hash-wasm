import fs from "node:fs";
import { blake3, createBLAKE3 } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await blake3("", 512)).toBe(
		"af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262e00f03e7b69af26b7faaf09fcd333050338ddfe085b8cc869ca98b206c08243a",
	);
	expect(await blake3("a", 512)).toBe(
		"17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f992bfdc2cae59c82b0737ada9e969aa6e9a96f3b8ad48cf3b2c0942d35e4ff5e",
	);
	expect(await blake3("a\x00", 512)).toBe(
		"7eb5f2760c891ddc18f5a287558fc48767d7a5d5895c51c980a8b7380c26d5a4cb52c4c648b6976b5d0746f7cf3ff944bda09485e41da65a4e7e8d587be4bf87",
	);
	expect(await blake3("abc", 512)).toBe(
		"6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d851fb250ae7393f5d02813b65d521a0d492d9ba09cf7ce7f4cffd900f23374bf0b",
	);
	expect(await blake3("message digest", 512)).toBe(
		"7bc2a2eeb95ddbf9b7ecf6adcb76b453091c58dc43955e1d9482b1942f08d19b0447a7a2deca621550350063fafd727f660f108bb992d0905f0f35b966d84ff3",
	);
	expect(await blake3("abcdefghijklmnopqrstuvwxyz", 512)).toBe(
		"2468eec8894acfb4e4df3a51ea916ba115d48268287754290aae8e9e6228e85f29d5c0ccdcab1524708f03c8e85e1ddc24fdc3671fe72e93823d9371aff72959",
	);
	expect(
		await blake3(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			512,
		),
	).toBe(
		"8bee3200baa9f3a1acd279f049f914f110e730555ff15109bd59cdd73895e2399250cc8e1f9151722bd5ad6c691469eb54288f558ddb96661114883e5937ce29",
	);
	expect(
		await blake3(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			512,
		),
	).toBe(
		"f263acf51621980b9c8de5da4a17d314984e05abe4a21cc83a07fe3e1e366dd12fe87889ba47b2d7fe29877fb6225a0af559d1f737f11b4918ae315ff36f615d",
	);
});

test("unicode strings", async () => {
	expect(await blake3("😊", 512)).toBe(
		"faa78d58da769fc62a44e89515bf09fe36153d3fe23a61c90ad9c57e6d1517829a87de4742ef0130e886075fe30e811656213d2c19ac7b3dfdc893ca685fa1db",
	);
	expect(await blake3("😊a😊", 512)).toBe(
		"27e6e7d5a11061ae9db96495fcccc7aacb8813283dc1fa71b9ec77c26b5ea004ec125547455742ed28c777e139be17978b319e479be9afd369b405c64c822a0e",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await blake3(file, 512)).toBe(
		"be4126e031519962430d8bb718118b73864e8ea95fc35369915dbd8596e6c1e3db7bf7022367bc81f75bafdb2c1b3d6bb2c48d91f326c9c32d2bc92db372932c",
	);
	expect(await blake3(file.toString(), 512)).toBe(
		"be4126e031519962430d8bb718118b73864e8ea95fc35369915dbd8596e6c1e3db7bf7022367bc81f75bafdb2c1b3d6bb2c48d91f326c9c32d2bc92db372932c",
	);
});

test("Node.js buffers", async () => {
	expect(await blake3(Buffer.from([]), 512)).toBe(
		"af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262e00f03e7b69af26b7faaf09fcd333050338ddfe085b8cc869ca98b206c08243a",
	);
	expect(await blake3(Buffer.from(["a".charCodeAt(0)]), 512)).toBe(
		"17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f992bfdc2cae59c82b0737ada9e969aa6e9a96f3b8ad48cf3b2c0942d35e4ff5e",
	);
	expect(await blake3(Buffer.from([0]), 512)).toBe(
		"2d3adedff11b61f14c886e35afa036736dcd87a74d27b5c1510225d0f592e213c3a6cb8bf623e20cdb535f8d1a5ffb86342d9c0b64aca3bce1d31f60adfa137b",
	);
	expect(await blake3(Buffer.from([0, 1, 0, 0, 2, 0]), 512)).toBe(
		"cb6f972e4304cf55cb77a48a32874e2eee56c1374d656cbb5aeb4a11dfb8936b32f7f7a6914252fff0bfe68949c6d9283065438f5c6624d97778bf30fda28c43",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await blake3(Buffer.from(arr), 512)).toBe(
		"d9ffe50cd366354882a331be11390ba85d41295749b35de81dd07644c5df990f4b85a112e32bb82f242b6268cf0756a0b7c1f9a0b797b23b8e7bcb9aff9f2af8",
	);
	const uint8 = new Uint8Array(arr);
	expect(await blake3(uint8, 512)).toBe(
		"d9ffe50cd366354882a331be11390ba85d41295749b35de81dd07644c5df990f4b85a112e32bb82f242b6268cf0756a0b7c1f9a0b797b23b8e7bcb9aff9f2af8",
	);
	expect(await blake3(new Uint16Array(uint8.buffer), 512)).toBe(
		"d9ffe50cd366354882a331be11390ba85d41295749b35de81dd07644c5df990f4b85a112e32bb82f242b6268cf0756a0b7c1f9a0b797b23b8e7bcb9aff9f2af8",
	);
	expect(await blake3(new Uint32Array(uint8.buffer), 512)).toBe(
		"d9ffe50cd366354882a331be11390ba85d41295749b35de81dd07644c5df990f4b85a112e32bb82f242b6268cf0756a0b7c1f9a0b797b23b8e7bcb9aff9f2af8",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await blake3(str, 512)).toBe(
		"e7b1327a9b4d113a27fc6598606acfa73093c1164528e71ee070bbe171c6a29247d222dc92c0ff8284425f186fb016bfa00442842fb87705b5f9a116ea846153",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await blake3(buf, 512)).toBe(
		"8a169b52644b8adb93cf4cedd4172313f2d2b487f6b5b2d30f3fdadbd068b8881f4d634bbe8a9d9016ee7d6801969ce4e55dd6b93d7a66b29c66cd1c4c39f4b9",
	);
});

test("chunked", async () => {
	const hash = await createBLAKE3(512);
	expect(hash.digest()).toBe(
		"af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262e00f03e7b69af26b7faaf09fcd333050338ddfe085b8cc869ca98b206c08243a",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"52cb9fd85a9777e741a60b5b1cfca8d9c71980c4ec8a1b02489db449832138ae6247ca6bed93cb159da8a069b6a7316f4c6ab6e1d6435a99715e229a9807a423",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"4ce4e75a3083519d2e2e6f9b4fb85fb627b8e4aee71b399939170c18d22d8b472bd4c9c9e7760b4db9a837f84d5d33a76bd0a852bfcb37706d2705fb555caf4e",
	);
});

test("chunked increasing length", async () => {
	const hash = await createBLAKE3(512);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await blake3(new Uint8Array(flatchunks), 512);
		hash.init();
		for (const chunk of chunks) {
			hash.update(new Uint8Array(chunk));
		}
		expect(hash.digest("hex")).toBe(hashRef);
	};
	const maxLens = [1, 3, 27, 50, 57, 64, 91, 127, 512, 300];
	await Promise.all(maxLens.map((length) => test(length)));
});

test("interlaced shorthand", async () => {
	const [hashA, hashB] = await Promise.all([
		blake3("a", 512),
		blake3("abc", 512),
	]);
	expect(hashA).toBe(
		"17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f992bfdc2cae59c82b0737ada9e969aa6e9a96f3b8ad48cf3b2c0942d35e4ff5e",
	);
	expect(hashB).toBe(
		"6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d851fb250ae7393f5d02813b65d521a0d492d9ba09cf7ce7f4cffd900f23374bf0b",
	);
});

test("interlaced create", async () => {
	const hashA = await createBLAKE3(512);
	hashA.update("a");
	const hashB = await createBLAKE3(512);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f992bfdc2cae59c82b0737ada9e969aa6e9a96f3b8ad48cf3b2c0942d35e4ff5e",
	);
	expect(hashB.digest()).toBe(
		"6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d851fb250ae7393f5d02813b65d521a0d492d9ba09cf7ce7f4cffd900f23374bf0b",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createBLAKE3(512);

	for (const input of invalidInputs) {
		await expect(blake3(input as any, 512)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
