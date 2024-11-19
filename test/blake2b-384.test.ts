import fs from "node:fs";
import { blake2b, createBLAKE2b } from "../lib";
import { getVariableLengthChunks } from "./util";
/* global test, expect */

test("simple strings", async () => {
	expect(await blake2b("", 384)).toBe(
		"b32811423377f52d7862286ee1a72ee540524380fda1724a6f25d7978c6fd3244a6caf0498812673c5e05ef583825100",
	);
	expect(await blake2b("a", 384)).toBe(
		"7d40de16ff771d4595bf70cbda0c4ea0a066a6046fa73d34471cd4d93d827d7c94c29399c50de86983af1ec61d5dcef0",
	);
	expect(await blake2b("a\x00", 384)).toBe(
		"637fe31d1e955760ef31043d525d9321826a778ddbe82fcde45a9839424138096675e2f87e36b53ab223a7fd254198fd",
	);
	expect(await blake2b("abc", 384)).toBe(
		"6f56a82c8e7ef526dfe182eb5212f7db9df1317e57815dbda46083fc30f54ee6c66ba83be64b302d7cba6ce15bb556f4",
	);
	expect(await blake2b("message digest", 384)).toBe(
		"44c3965bd8f02ed299ad52ffb5bba7c448df242073c5520dc091a0cc55d024cdd51569c339d0bf2b6cd746708683a0ef",
	);
	expect(await blake2b("abcdefghijklmnopqrstuvwxyz", 384)).toBe(
		"5cad60ce23b9dc62eabdd149a16307ef916e0637506fa10cf8c688430da6c978a0cb7857fd138977bd281e8cfd5bfd1f",
	);
	expect(
		await blake2b(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			384,
		),
	).toBe(
		"b4975ee19a4f559e3d3497df0db1e5c6b79988b7d7e85c1f064ceaa72a418c484e4418b775c77af8d2651872547c8e9f",
	);
	expect(
		await blake2b(
			"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
			384,
		),
	).toBe(
		"1ce12d72189f06f1b95c16f4bf7e0685519bc1065eae2efd015a31db13bd123ea8f8bf83a8682ad29e3828a0a0af299c",
	);
});

test("unicode strings", async () => {
	expect(await blake2b("😊", 384)).toBe(
		"dc292f6e6b9405dbeabde6513a7570fc2709df8dcc30adc57a1167f8ae10dec92e4d3c2d715fe7b06a7dbe6e3e91cecc",
	);
	expect(await blake2b("😊a😊", 384)).toBe(
		"b2db65e4b6e29c75117501db5733f86c058adddb8bdef7922fb6d49294aa2bdd799b33ef561601c1fd3cfe8a39204227",
	);
	const file = fs.readFileSync("./test/utf8.txt");
	expect(await blake2b(file, 384)).toBe(
		"408f607ac376f7a85efa4039c99daa3b0db52ad5fa12a8cb1e2005f2acd3ab591a670710f67f489f1398066534869999",
	);
	expect(await blake2b(file.toString(), 384)).toBe(
		"408f607ac376f7a85efa4039c99daa3b0db52ad5fa12a8cb1e2005f2acd3ab591a670710f67f489f1398066534869999",
	);
});

test("Node.js buffers", async () => {
	expect(await blake2b(Buffer.from([]), 384)).toBe(
		"b32811423377f52d7862286ee1a72ee540524380fda1724a6f25d7978c6fd3244a6caf0498812673c5e05ef583825100",
	);
	expect(await blake2b(Buffer.from(["a".charCodeAt(0)]), 384)).toBe(
		"7d40de16ff771d4595bf70cbda0c4ea0a066a6046fa73d34471cd4d93d827d7c94c29399c50de86983af1ec61d5dcef0",
	);
	expect(await blake2b(Buffer.from([0]), 384)).toBe(
		"cc01088536f784f0bb769e41c4957b6d0cde1fcc8cf1d91fc477d4dd6e3fbfcd43d1698d146f348b2c36a339682bec3f",
	);
	expect(await blake2b(Buffer.from([0, 1, 0, 0, 2, 0]), 384)).toBe(
		"bed269bfb5af64afc2a08ba528e23a55140fcb754a9a58f7149d007d0ec249bbc888018fbb319c196368377eb5a8f5d8",
	);
});

test("typed arrays", async () => {
	const arr = [0, 1, 2, 3, 4, 5, 255, 254];
	expect(await blake2b(Buffer.from(arr), 384)).toBe(
		"35390ddf46f8804198bad6c3238c35ee20ddedaeee0cd2d93c90f27404b7667a39ecde17156933545aebca4528888e7c",
	);
	const uint8 = new Uint8Array(arr);
	expect(await blake2b(uint8, 384)).toBe(
		"35390ddf46f8804198bad6c3238c35ee20ddedaeee0cd2d93c90f27404b7667a39ecde17156933545aebca4528888e7c",
	);
	expect(await blake2b(new Uint16Array(uint8.buffer), 384)).toBe(
		"35390ddf46f8804198bad6c3238c35ee20ddedaeee0cd2d93c90f27404b7667a39ecde17156933545aebca4528888e7c",
	);
	expect(await blake2b(new Uint32Array(uint8.buffer), 384)).toBe(
		"35390ddf46f8804198bad6c3238c35ee20ddedaeee0cd2d93c90f27404b7667a39ecde17156933545aebca4528888e7c",
	);
});

test("long strings", async () => {
	const SIZE = 5 * 1024 * 1024;
	const chunk = "012345678\x09";
	const str = new Array(Math.floor(SIZE / chunk.length)).fill(chunk).join("");
	expect(await blake2b(str, 384)).toBe(
		"5a8f431fd46262fab56148351828eda90231100fd51fbbb98d615c5ec7c2ffca1c637d111ada50a6554450f4aa523267",
	);
});

test("long buffers", async () => {
	const SIZE = 5 * 1024 * 1024;
	const buf = Buffer.alloc(SIZE);
	buf.fill("\x00\x01\x02\x03\x04\x05\x06\x07\x08\xFF");
	expect(await blake2b(buf, 384)).toBe(
		"7523edb9d894a0758fa691947663dcaa5b7437d1ba48f0b18ad2bab1e92f2e9984706e952588a7d43a1fe039e99dbe1d",
	);
});

test("chunked", async () => {
	const hash = await createBLAKE2b(384);
	expect(hash.digest()).toBe(
		"b32811423377f52d7862286ee1a72ee540524380fda1724a6f25d7978c6fd3244a6caf0498812673c5e05ef583825100",
	);
	hash.init();
	hash.update("a");
	hash.update(new Uint8Array([0]));
	hash.update("bc");
	hash.update(new Uint8Array([255, 254]));
	expect(hash.digest()).toBe(
		"339f97607daa86638e867561264e659c8c9a3946c712407dacb1808c5a7c2cfe820aca5875fa75a569eb677a9bc27e7e",
	);

	hash.init();
	for (let i = 0; i < 1000; i++) {
		hash.update(new Uint8Array([i & 0xff]));
	}
	hash.update(Buffer.alloc(1000).fill(0xdf));
	expect(hash.digest()).toBe(
		"5e3511c944b500804059f31d390f6dc1673368e6f9e1e7ba050853c801361ab1a77d9a9d348fd643136c6a94a4675c57",
	);
});

test("chunked increasing length", async () => {
	const hash = await createBLAKE2b(384);
	const test = async (maxLen: number) => {
		const chunks = getVariableLengthChunks(maxLen);
		const flatchunks = chunks.reduce((acc, val) => acc.concat(val), []);
		const hashRef = await blake2b(new Uint8Array(flatchunks), 384);
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
		blake2b("a", 384),
		blake2b("abc", 384),
	]);
	expect(hashA).toBe(
		"7d40de16ff771d4595bf70cbda0c4ea0a066a6046fa73d34471cd4d93d827d7c94c29399c50de86983af1ec61d5dcef0",
	);
	expect(hashB).toBe(
		"6f56a82c8e7ef526dfe182eb5212f7db9df1317e57815dbda46083fc30f54ee6c66ba83be64b302d7cba6ce15bb556f4",
	);
});

test("interlaced create", async () => {
	const hashA = await createBLAKE2b(384);
	hashA.update("a");
	const hashB = await createBLAKE2b(384);
	hashB.update("abc");
	expect(hashA.digest()).toBe(
		"7d40de16ff771d4595bf70cbda0c4ea0a066a6046fa73d34471cd4d93d827d7c94c29399c50de86983af1ec61d5dcef0",
	);
	expect(hashB.digest()).toBe(
		"6f56a82c8e7ef526dfe182eb5212f7db9df1317e57815dbda46083fc30f54ee6c66ba83be64b302d7cba6ce15bb556f4",
	);
});

test("Invalid inputs throw", async () => {
	const invalidInputs = [0, 1, Number(1), {}, [], null, undefined];
	const hash = await createBLAKE2b(384);

	for (const input of invalidInputs) {
		await expect(blake2b(input as any, 384)).rejects.toThrow();
		expect(() => hash.update(input as any)).toThrow();
	}
});
