/* global test, expect */
import {
	adler32,
	blake2b,
	blake3,
	crc32,
	createMD4,
	keccak,
	md4,
	md5,
	ripemd160,
	sha1,
	sha3,
	sha256,
	sha384,
	xxhash32,
	xxhash64,
} from "../lib";
import { MAX_HEAP } from "../lib/WASMInterface";
import { hexStringEqualsUInt8 } from "../lib/util";

test("Sync cycle multiple algorithms", async () => {
	for (let i = 0; i < 100; i++) {
		expect(await adler32("a")).toBe("00620062");
		expect(await blake2b("a")).toBe(
			"333fcb4ee1aa7c115355ec66ceac917c8bfd815bf7587d325aec1864edd24e34d5abe2c6b1b5ee3face62fed78dbef802f2a85cb91d455a8f5249d330853cb3c",
		);
		expect(await blake3("a")).toBe(
			"17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f",
		);
		expect(await crc32("a")).toBe("e8b7be43");
		expect(await md4("a")).toBe("bde52cb31de33e46245e05fbdbd6fb24");
		expect(await md5("a")).toBe("0cc175b9c0f1b6a831c399e269772661");
		expect(await ripemd160("a")).toBe(
			"0bdc9d2d256b3ee9daae347be6f4dc835a467ffe",
		);
		expect(await sha1("a")).toBe("86f7e437faa5a7fce15d1ddcb9eaeaea377667b8");
		expect(await sha256("a")).toBe(
			"ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
		);
		expect(await sha384("a")).toBe(
			"54a59b9f22b0b80880d8427e548b7c23abd873486e1f035dce9cd697e85175033caa88e6d57bc35efae0b5afd3145f31",
		);
		expect(await sha3("a", 224)).toBe(
			"9e86ff69557ca95f405f081269685b38e3a819b309ee942f482b6a8b",
		);
		expect(await keccak("a", 224)).toBe(
			"7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308",
		);
		expect(await xxhash32("a", 0x6789abcd)).toBe("88488ff7");
		expect(await xxhash64("a")).toBe("d24ec4f1a98c6e5b");
	}
});

test("converting slices from typedarrays", async () => {
	const buffer = new ArrayBuffer(256);
	const intBuf = new Uint8Array(buffer);
	for (let i = 0; i < intBuf.length; i++) {
		intBuf[i] = i;
	}

	const int32Slice = new Uint32Array(buffer, 16, 4);
	const int16Slice = new Uint16Array(buffer, 16, 4 * 2);
	const int8Slice = new Uint8Array(buffer, 16, 4 * 4);

	expect(await md4(int32Slice)).toBe(await md4(int16Slice));
	expect(await md4(int32Slice)).toBe(await md4(int8Slice));
});

test("unicode string length handling", async () => {
	const utf8 = ["a", "ѱ", "彁", "𠜎"];
	const md4Instance = await createMD4();

	for (let j = 0; j < 4; j++) {
		let str = "";
		for (let i = 0; i < MAX_HEAP + 10; i++) {
			str += utf8[j];
			const ok = await md4(Buffer.from(str));
			expect(await md4(str)).toBe(ok);
			md4Instance.init();
			md4Instance.update(str);
			expect(md4Instance.digest()).toBe(ok);
		}
	}
});

test("hexStringEqualsUInt8()", async () => {
	expect(hexStringEqualsUInt8("", new Uint8Array([]))).toBe(true);
	expect(hexStringEqualsUInt8("", new Uint8Array([0]))).toBe(false);
	expect(hexStringEqualsUInt8("AB", new Uint8Array([0xab]))).toBe(true);
	expect(hexStringEqualsUInt8("ABCD", new Uint8Array([0xab, 0xcd]))).toBe(true);
	expect(hexStringEqualsUInt8("ABCD", new Uint8Array([0xab]))).toBe(false);
	expect(hexStringEqualsUInt8("ABCD", new Uint8Array([0x1b, 0xcd]))).toBe(
		false,
	);
	expect(hexStringEqualsUInt8("ABCD", new Uint8Array([0xab, 0x0d]))).toBe(
		false,
	);
	expect(hexStringEqualsUInt8("ABCD", new Uint8Array([0xab, 0xc0]))).toBe(
		false,
	);
	expect(
		hexStringEqualsUInt8("123456", new Uint8Array([0x12, 0x34, 0x56])),
	).toBe(true);
	expect(
		hexStringEqualsUInt8("123456", new Uint8Array([0x12, 0x34, 0x66])),
	).toBe(false);
});
