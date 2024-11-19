import { blake2b, createBLAKE2b } from "../lib";
/* global test, expect */

test("invalid parameters", async () => {
	await expect(blake2b("", -1 as any)).rejects.toThrow();
	await expect(blake2b("", "a" as any)).rejects.toThrow();
	await expect(blake2b("", 223 as any)).rejects.toThrow();
	await expect(blake2b("", 0 as any)).rejects.toThrow();
	await expect(blake2b("", 127 as any)).rejects.toThrow();
	await expect(blake2b("", 513 as any)).rejects.toThrow();
	await expect(blake2b("", null as any)).rejects.toThrow();
	await expect(blake2b("", 1024 as any)).rejects.toThrow();

	await expect(createBLAKE2b(-1 as any)).rejects.toThrow();
	await expect(createBLAKE2b("a" as any)).rejects.toThrow();
	await expect(createBLAKE2b(223 as any)).rejects.toThrow();
	await expect(createBLAKE2b(0 as any)).rejects.toThrow();
	await expect(createBLAKE2b(127 as any)).rejects.toThrow();
	await expect(createBLAKE2b(513 as any)).rejects.toThrow();
	await expect(createBLAKE2b(null as any)).rejects.toThrow();
	await expect(createBLAKE2b(1024 as any)).rejects.toThrow();
});

test("default value for create constructor", async () => {
	const hash = await blake2b("a", 512);
	const hasher = await createBLAKE2b();
	hasher.init();
	hasher.update("a");
	expect(hasher.digest()).toBe(hash);
});

test("it invalidates the cache when changing parameters", async () => {
	expect(await blake2b("a", 128)).toBe("27c35e6e9373877f29e562464e46497e");
	expect(await blake2b("a", 256)).toBe(
		"8928aae63c84d87ea098564d1e03ad813f107add474e56aedd286349c0c03ea4",
	);
	expect(await blake2b("a", 384)).toBe(
		"7d40de16ff771d4595bf70cbda0c4ea0a066a6046fa73d34471cd4d93d827d7c94c29399c50de86983af1ec61d5dcef0",
	);
	expect(await blake2b("a")).toBe(
		"333fcb4ee1aa7c115355ec66ceac917c8bfd815bf7587d325aec1864edd24e34d5abe2c6b1b5ee3face62fed78dbef802f2a85cb91d455a8f5249d330853cb3c",
	);

	let hash = await createBLAKE2b(128);
	hash.update("a");
	expect(hash.digest()).toBe("27c35e6e9373877f29e562464e46497e");

	hash = await createBLAKE2b(256);
	hash.update("a");
	expect(hash.digest()).toBe(
		"8928aae63c84d87ea098564d1e03ad813f107add474e56aedd286349c0c03ea4",
	);

	hash = await createBLAKE2b(384);
	hash.update("a");
	expect(hash.digest()).toBe(
		"7d40de16ff771d4595bf70cbda0c4ea0a066a6046fa73d34471cd4d93d827d7c94c29399c50de86983af1ec61d5dcef0",
	);

	hash = await createBLAKE2b();
	hash.update("a");
	expect(hash.digest()).toBe(
		"333fcb4ee1aa7c115355ec66ceac917c8bfd815bf7587d325aec1864edd24e34d5abe2c6b1b5ee3face62fed78dbef802f2a85cb91d455a8f5249d330853cb3c",
	);
});

test("small digest size", async () => {
	expect(await blake2b("abc", 8)).toBe("6b");
	expect(await blake2b("abc", 16)).toBe("ae1e");
	expect(await blake2b("abc", 24)).toBe("8c45ed");
	expect(await blake2b("", 32)).toBe("1271cf25");

	let hash = await createBLAKE2b(8);
	hash.update("abc");
	expect(hash.digest()).toBe("6b");

	hash = await createBLAKE2b(16);
	hash.update("abc");
	expect(hash.digest()).toBe("ae1e");

	hash = await createBLAKE2b(24);
	hash.update("abc");
	expect(hash.digest()).toBe("8c45ed");

	hash = await createBLAKE2b(32);
	hash.update("");
	expect(hash.digest()).toBe("1271cf25");
});
