/* global test, expect */
import {
	adler32,
	md4,
	md5,
	crc32,
	sha1,
	sha224,
	sha256,
	sha384,
	sha512,
	sha3,
	xxhash32,
	xxhash64,
	keccak,
} from "../lib";

test("Invalid inputs throw after", async () => {
	await expect(adler32(0 as any)).rejects.toThrow();
	await expect(md4(0 as any)).rejects.toThrow();
	await expect(md5(0 as any)).rejects.toThrow();
	await expect(crc32(0 as any)).rejects.toThrow();
	await expect(sha1(0 as any)).rejects.toThrow();
	await expect(sha224(0 as any)).rejects.toThrow();
	await expect(sha256(0 as any)).rejects.toThrow();
	await expect(sha384(0 as any)).rejects.toThrow();
	await expect(sha512(0 as any)).rejects.toThrow();
	await expect(sha3(0 as any)).rejects.toThrow();
	await expect(keccak(0 as any)).rejects.toThrow();
	await expect(xxhash32(0 as any)).rejects.toThrow();
	await expect(xxhash64(0 as any)).rejects.toThrow();
});
