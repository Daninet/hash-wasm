/* global test, expect */
import {
	blake2b,
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

function getMemoryUsage() {
	const usage = process.memoryUsage().heapUsed;

	const i = ~~(Math.log2(usage) / 10);
	return `${(usage / 1024 ** i).toFixed(2)}${"KMGTPEZY"[i - 1] || ""}B`;
}

test("Async cycle multiple algorithms", async () => {
	console.log("Before", getMemoryUsage());

	const promises = [];
	for (let i = 0; i < 250; i++) {
		promises.push(blake2b("a"));
		promises.push(md4("a"));
		promises.push(md5("a"));
		promises.push(sha1("a"));
		promises.push(sha256("a"));
		promises.push(sha384("a"));
		promises.push(sha3("a", 224));
		promises.push(keccak("a", 224));
		promises.push(ripemd160("a"));
		promises.push(xxhash32("a", 0x6789abcd));
		promises.push(xxhash64("a"));
	}

	const res = await Promise.all(promises);
	for (let i = 0; i < 250 * 8; i += 11) {
		expect(res[i + 0]).toBe(
			"333fcb4ee1aa7c115355ec66ceac917c8bfd815bf7587d325aec1864edd24e34d5abe2c6b1b5ee3face62fed78dbef802f2a85cb91d455a8f5249d330853cb3c",
		);
		expect(res[i + 1]).toBe("bde52cb31de33e46245e05fbdbd6fb24");
		expect(res[i + 2]).toBe("0cc175b9c0f1b6a831c399e269772661");
		expect(res[i + 3]).toBe("86f7e437faa5a7fce15d1ddcb9eaeaea377667b8");
		expect(res[i + 4]).toBe(
			"ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
		);
		expect(res[i + 5]).toBe(
			"54a59b9f22b0b80880d8427e548b7c23abd873486e1f035dce9cd697e85175033caa88e6d57bc35efae0b5afd3145f31",
		);
		expect(res[i + 6]).toBe(
			"9e86ff69557ca95f405f081269685b38e3a819b309ee942f482b6a8b",
		);
		expect(res[i + 7]).toBe(
			"7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308",
		);
		expect(res[i + 8]).toBe("0bdc9d2d256b3ee9daae347be6f4dc835a467ffe");
		expect(res[i + 9]).toBe("88488ff7");
		expect(res[i + 10]).toBe("d24ec4f1a98c6e5b");
	}

	console.log("After", getMemoryUsage());
});
