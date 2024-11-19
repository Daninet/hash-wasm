import fs from "node:fs";
import { blake2b, createBLAKE2b } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await blake2b("")).toBe(
		"786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce",
	);
	expect(await blake2b("a")).toBe(
		"333fcb4ee1aa7c115355ec66ceac917c8bfd815bf7587d325aec1864edd24e34d5abe2c6b1b5ee3face62fed78dbef802f2a85cb91d455a8f5249d330853cb3c",
	);
	expect(await blake2b("a\x00")).toBe(
		"05970b95468b0b1941066ff189091493e73859ce41cde5ad08118e93ea1d81a57a144296a26a9fe7781481bde97b886725e36e30b305d8bd5cce1ae36bf1564a",
	);
	expect(await blake2b("abc")).toBe(
		"ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923",
	);
	expect(await blake2b("message digest")).toBe(
		"3c26ce487b1c0f062363afa3c675ebdbf5f4ef9bdc022cfbef91e3111cdc283840d8331fc30a8a0906cff4bcdbcd230c61aaec60fdfad457ed96b709a382359a",
	);
	expect(await blake2b("abcdefghijklmnopqrstuvwxyz")).toBe(
		"c68ede143e416eb7b4aaae0d8e48e55dd529eafed10b1df1a61416953a2b0a5666c761e7d412e6709e31ffe221b7a7a73908cb95a4d120b8b090a87d1fbedb4c",
	);
	expect(
		await blake2b(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		),
	).toBe(
		"99964802e5c25e703722905d3fb80046b6bca698ca9e2cc7e49b4fe1fa087c2edf0312dfbb275cf250a1e542fd5dc2edd313f9c491127c2e8c0c9b24168e2d50",
	);
	expect(
		await blake2b(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		),
	).toBe(
		"686f41ec5afff6e87e1f076f542aa466466ff5fbde162c48481ba48a748d842799f5b30f5b67fc684771b33b994206d05cc310f31914edd7b97e41860d77d282",
	);
});

test("unicode strings", async () => {
	expect(await blake2b("😊")).toBe(
		"0f0f5c4d71d40a3afb1adc2023d90ce3c8577868e9ff8295e5eb7b5a1c507d3b1ba8960dfc179a14eb4564219212c58656333d9a2cb001666bf86bcd51c09113",
	);
	expect(await blake2b("😊a😊")).toBe(
		"cd2c00a3486d9e2c4d05686393da2193d68f2c4dd0001960ec87ecb61f8f6dcdeceeeadd380461e710494f947ad1beb92c5b694efee5da9be3edead2413da57a",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await blake2b(file)).toBe(
		"b7274ef6ea0837ef07f93bf71f6b0fb4fd8b7d49b0dbd3cc4e75336b52041493d8791e36205c93ebaf881d4dbdd54244b6976541f9ee0aec10e8ccb0b9272b28",
	);
	expect(await blake2b(file.toString())).toBe(
		"b7274ef6ea0837ef07f93bf71f6b0fb4fd8b7d49b0dbd3cc4e75336b52041493d8791e36205c93ebaf881d4dbdd54244b6976541f9ee0aec10e8ccb0b9272b28",
	);
});

test("Node.js buffers", async () => {
	expect(await blake2b(Buffer.from([]))).toBe(
		"786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce",
	);
	expect(await blake2b(Buffer.from(["a".charCodeAt(0)]))).toBe(
		"333fcb4ee1aa7c115355ec66ceac917c8bfd815bf7587d325aec1864edd24e34d5abe2c6b1b5ee3face62fed78dbef802f2a85cb91d455a8f5249d330853cb3c",
	);
	expect(await blake2b(Buffer.from([0]))).toBe(
		"2fa3f686df876995167e7c2e5d74c4c7b6e48f8068fe0e44208344d480f7904c36963e44115fe3eb2a3ac8694c28bcb4f5a0f3276f2e79487d8219057a506e4b",
	);
	expect(await blake2b(Buffer.from([0, 1, 0, 0, 2, 0]))).toBe(
		"e6f83bddb20d243110603da7f246fedad9d6019848ace736570a332eab799a46d3caa1bd31660ab54e33974513adb09d65d3efc405f1b9633bd15f83334812fd",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await blake2b(Buffer.from(arr))).toBe(
		"e33f67074e4cddb9b218e1cc74c577fec910521b119252f48acc9b241386ecc9406abd8c5ed7325e58b96df3191a47ad7bec07529319a4816fc6f7aed606c87e",
	);
	const uint8 = new Uint8Array(arr);
	expect(await blake2b(uint8)).toBe(
		"e33f67074e4cddb9b218e1cc74c577fec910521b119252f48acc9b241386ecc9406abd8c5ed7325e58b96df3191a47ad7bec07529319a4816fc6f7aed606c87e",
	);
	expect(await blake2b(new Uint16Array(uint8.buffer))).toBe(
		"e33f67074e4cddb9b218e1cc74c577fec910521b119252f48acc9b241386ecc9406abd8c5ed7325e58b96df3191a47ad7bec07529319a4816fc6f7aed606c87e",
	);
	expect(await blake2b(new Uint32Array(uint8.buffer))).toBe(
		"e33f67074e4cddb9b218e1cc74c577fec910521b119252f48acc9b241386ecc9406abd8c5ed7325e58b96df3191a47ad7bec07529319a4816fc6f7aed606c87e",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await blake2b(str)).toBe(
		"0fc300387386370055ef6778eebdaea88ba88c22aae552c964c73fffa06f7d6190109d6421bc37c66d63fab639eac5733ea83a7268796a65521b1cac494b68aa",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await blake2b(buf)).toBe(
		"baba39301b7494cb48959b7ab29fc69a799f9cb4c1eee06d4285c42a1de8171d422e641c8bcdb28ccf8e0b69dad903f23da0172dd49079276fa913fe85902aa3",
	);
});

test("chunked", async () => {
	const hash = await createBLAKE2b(512);
	expect(hash.digest()).toBe(
		"786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"9da9818da0f4a637206cd337b98755d60917d41d4c9cff501669d641990d2e76677d856bfe9c56feb6ceddcf2da1292a165fc1eb4da807aee9e9b440dc8cea3a",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"8ade43a7d80893ad08d81d238b23b7be4600ee110215c400d6ef6ded68175ca40e075b12eea10e4ae190468c46795d136b3ce987a49505503a108567d57860a8",
	);
});

test("chunked increasing length", async () => {
	const hash = await createBLAKE2b(512);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await blake2b(new Uint8Array(flatchunks), 512);
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
		blake2b("a", 512),
		blake2b("abc", 512),
	]);
	expect(hashA).toBe(
		"333fcb4ee1aa7c115355ec66ceac917c8bfd815bf7587d325aec1864edd24e34d5abe2c6b1b5ee3face62fed78dbef802f2a85cb91d455a8f5249d330853cb3c",
	);
	expect(hashB).toBe(
		"ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923",
	);
});

test("interlaced create", async () => {
	const hashA = await createBLAKE2b(512);
	hashA.update("a");
	const hashB = await createBLAKE2b(512);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"333fcb4ee1aa7c115355ec66ceac917c8bfd815bf7587d325aec1864edd24e34d5abe2c6b1b5ee3face62fed78dbef802f2a85cb91d455a8f5249d330853cb3c",
	);
	expect(hashB.digest()).toBe(
		"ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createBLAKE2b(512);

	for (const input of invalidInputs) {
		await expect(blake2b(input as any, 512)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
