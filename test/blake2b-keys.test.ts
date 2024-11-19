import { blake2b, createBLAKE2b } from "../lib";
/* global test, expect */

test("simple keys", async () => {
	expect(await blake2b("", 256, "")).toBe(
		"0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8",
	);
	expect(await blake2b("", 256, "this is the password")).toBe(
		"386435aaf3ba280ea9b3ebd7b42d9c5bbf63f23dbae9ab91553332a588fe337c",
	);
	expect(await blake2b("", 256, "this is the password123")).toBe(
		"27e55781cb30cd6b8f81c7eade5939d1d8752a79aa3dd63d16a186023a5b9252",
	);
	expect(await blake2b("a", 256, "this is the password")).toBe(
		"1e4287cf1a916ec4d54a4847774bb50371b20d867083881f8a7ce3f3b8b2c74a",
	);
	expect(await blake2b("abc", 256, "this is the password")).toBe(
		"5652f81b0858c71cae415dd2749b6a52a614e3207328cbfa806f40a7a36cf561",
	);

	const hash = await createBLAKE2b(256, "this is the password");
	hash.update("a");
	expect(hash.digest()).toBe(
		"1e4287cf1a916ec4d54a4847774bb50371b20d867083881f8a7ce3f3b8b2c74a",
	);
});

test("unicode keys", async () => {
	expect(await blake2b("a", 256, "😊")).toBe(
		"43a791ea899560fc25e3a18eaa11f85b640a6802e7c94b08ac51f0efe39806c9",
	);
	expect(await blake2b("😊a😊", 256, "😊a😊")).toBe(
		"0dcc9cd4672ad13d447a3f64399d20d5ac8b2c835746b570c1e3ff4d735dfc96",
	);
	expect(await blake2b("a", 512, "😊")).toBe(
		"662f46f559501f4fb780bba0a410c8a5bb58f646a02b1361aeb9f0c9c29dd3faf99db0abc6132d302e5e07cec147cc0359cf0c4568e6bfc6455fe12e3eed6d5b",
	);
	expect(await blake2b("😊a😊", 512, "😊a😊")).toBe(
		"5e644d389195eb2fa99227fbcde278f290d8a02c50202fa59b71a53d5d0810b03cfaff7e609b57daba9fecb8ab9beabf75f42ce263dfaaf0bd6bb84255dec16a",
	);
});

test("Node.js buffers", async () => {
	expect(await blake2b("a", 256, Buffer.from([]))).toBe(
		"8928aae63c84d87ea098564d1e03ad813f107add474e56aedd286349c0c03ea4",
	);
	expect(await blake2b("a", 256, Buffer.from(["a".charCodeAt(0)]))).toBe(
		"f5ae00102c0fc6fd2ca53a0c9b6a7f7ccddec83de24473609ac0c30af6a4b5f2",
	);
	const key = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7]);
	expect(await blake2b("a", 256, key)).toBe(
		"0f94022d7654f36fb4182dcba4fb893045ebdbbc0ffa55f1ed2c201d3ee1106e",
	);
});

test("typed arrays", async () => {
	const key = Buffer.from([
		0, 1, 2, 3, 4, 255, 254, 7, 0, 1, 254, 3, 4, 255, 0, 7,
	]);
	expect(await blake2b("a", 256, Buffer.from(key))).toBe(
		"3584ad664f76aaa768424a8a125d3052a9ea5bc90c18c06ffba60e980f2d9f3a",
	);
	const uint8 = new Uint8Array(key);
	expect(await blake2b("a", 256, uint8)).toBe(
		"3584ad664f76aaa768424a8a125d3052a9ea5bc90c18c06ffba60e980f2d9f3a",
	);
	expect(await blake2b("a", 256, new Uint16Array(uint8.buffer))).toBe(
		"3584ad664f76aaa768424a8a125d3052a9ea5bc90c18c06ffba60e980f2d9f3a",
	);
	expect(await blake2b("a", 256, new Uint32Array(uint8.buffer))).toBe(
		"3584ad664f76aaa768424a8a125d3052a9ea5bc90c18c06ffba60e980f2d9f3a",
	);
});

test("long syntax", async () => {
	const hash = await createBLAKE2b(256, "this is the password");
	hash.update("a");
	expect(hash.digest()).toBe(
		"1e4287cf1a916ec4d54a4847774bb50371b20d867083881f8a7ce3f3b8b2c74a",
	);
	hash.init();
	expect(hash.digest()).toBe(
		"386435aaf3ba280ea9b3ebd7b42d9c5bbf63f23dbae9ab91553332a588fe337c",
	);
	hash.init();
	hash.update("a");
	hash.update("b");
	hash.update("c");
	expect(hash.digest()).toBe(
		"5652f81b0858c71cae415dd2749b6a52a614e3207328cbfa806f40a7a36cf561",
	);
});

test("Invalid keys throw", async () => {
	const invalidKeys = [0, 1, Number(1), {}, []];

	for (const key of invalidKeys) {
		await expect(() => blake2b("a", 256, key as any)).toThrow();
		await expect(() => createBLAKE2b(256, key as any)).toThrow();
	}
});

test("Too long keys reject", async () => {
	const invalidKeys = [
		new Array(65).fill("x").join(""),
		Buffer.alloc(65),
		new Uint8Array(65),
		new Uint32Array(17),
		new Array(17).fill("😊").join(""),
	];

	for (const key of invalidKeys) {
		await expect(() => blake2b("a", 256, key as any)).rejects.toThrow();
		await expect(() => createBLAKE2b(256, key as any)).rejects.toThrow();
	}
});

test("small digest size", async () => {
	expect(await blake2b("abc", 8, "123")).toBe("f1");
	expect(await blake2b("abc", 16, "1")).toBe("872f");
	expect(await blake2b("abc", 24, "123")).toBe("ee2d74");
	expect(await blake2b("", 32, "123")).toBe("2c4839fc");
});
