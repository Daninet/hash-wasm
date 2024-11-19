import { blake3, createBLAKE3 } from "../lib";
/* global test, expect */

test("invalid parameters", async () => {
	await expect(blake3("", -1 as any)).rejects.toThrow();
	await expect(blake3("", "a" as any)).rejects.toThrow();
	await expect(blake3("", 223 as any)).rejects.toThrow();
	await expect(blake3("", 0 as any)).rejects.toThrow();
	await expect(blake3("", 127 as any)).rejects.toThrow();
	await expect(blake3("", 257 as any)).rejects.toThrow();
	await expect(blake3("", null as any)).rejects.toThrow();

	await expect(createBLAKE3(-1 as any)).rejects.toThrow();
	await expect(createBLAKE3("a" as any)).rejects.toThrow();
	await expect(createBLAKE3(223 as any)).rejects.toThrow();
	await expect(createBLAKE3(0 as any)).rejects.toThrow();
	await expect(createBLAKE3(127 as any)).rejects.toThrow();
	await expect(createBLAKE3(257 as any)).rejects.toThrow();
	await expect(createBLAKE3(null as any)).rejects.toThrow();
});

test("default value for create constructor", async () => {
	const hash = await blake3("a", 256);
	const hasher = await createBLAKE3();
	hasher.init();
	hasher.update("a");
	expect(hasher.digest()).toBe(hash);
});

test("it invalidates the cache when changing parameters", async () => {
	expect(await blake3("a", 64)).toBe("17762fddd969a453");
	expect(await blake3("a", 128)).toBe("17762fddd969a453925d65717ac3eea2");
	expect(await blake3("a")).toBe(
		"17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f",
	);

	let hash = await createBLAKE3(64);
	hash.update("a");
	expect(hash.digest()).toBe("17762fddd969a453");

	hash = await createBLAKE3(128);
	hash.update("a");
	expect(hash.digest()).toBe("17762fddd969a453925d65717ac3eea2");

	hash = await createBLAKE3();
	hash.update("a");
	expect(hash.digest()).toBe(
		"17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f",
	);
});

test("small digest size", async () => {
	expect(await blake3("abc", 8)).toBe("64");
	expect(await blake3("abc", 16)).toBe("6437");
	expect(await blake3("abc", 24)).toBe("6437b3");
	expect(await blake3("", 32)).toBe("af1349b9");

	let hash = await createBLAKE3(8);
	hash.update("abc");
	expect(hash.digest()).toBe("64");

	hash = await createBLAKE3(16);
	hash.update("abc");
	expect(hash.digest()).toBe("6437");

	hash = await createBLAKE3(24);
	hash.update("abc");
	expect(hash.digest()).toBe("6437b3");

	hash = await createBLAKE3(32);
	hash.update("");
	expect(hash.digest()).toBe("af1349b9");
});
