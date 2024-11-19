import { scrypt } from "../lib";
/* global test, expect */

const hash = async (
	password,
	salt,
	costFactor,
	blockSize,
	parallelism,
	hashLength,
	outputType,
) =>
	scrypt({
		password,
		salt,
		costFactor,
		blockSize,
		parallelism,
		hashLength,
		outputType,
	});

test("scrypt", async () => {
	expect(await hash("", "", 2, 1, 1, 16, "hex")).toBe(
		"fa76e020d54d9e8aa24023c6baecdd46",
	);

	expect(await hash("", "", 2, 1, 1, 16, undefined)).toBe(
		"fa76e020d54d9e8aa24023c6baecdd46",
	);

	expect(await hash("", "", 2, 1, 1, 16, "binary")).toMatchObject(
		new Uint8Array([
			0xfa, 0x76, 0xe0, 0x20, 0xd5, 0x4d, 0x9e, 0x8a, 0xa2, 0x40, 0x23, 0xc6,
			0xba, 0xec, 0xdd, 0x46,
		]),
	);

	expect(await hash("a", "abcdefgh", 128, 1, 1, 16, "hex")).toBe(
		"7a386084f8c60a04238de836c2d5dff1",
	);

	expect(await hash("text demo", "123456789", 8, 17, 15, 32, "hex")).toBe(
		"bcae071d6bb1389b462fe3135a0b6bbaf980028d0d035f688ce36a8b0b53c391",
	);

	expect(await hash("text demo", "123456789", 2, 1, 32, 32, "hex")).toBe(
		"3ab33fa8bdee86ecf66ce568ae19a57ca1339a2a41d92ca244f183b759c57f30",
	);

	expect(await hash("abc", "1234567812345678", 4, 3, 177, 4, "hex")).toBe(
		"f31520d2",
	);

	expect(await hash("abc", "12345678", 64, 27, 67, 17, "hex")).toBe(
		"6e018c6f21b5647b3ce0c1c65ea14961f4",
	);
});

test("scrypt official test vectors", async () => {
	expect(await hash("", "", 16, 1, 1, 64, "hex")).toBe(
		"77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906",
	);

	expect(await hash("password", "NaCl", 1024, 8, 16, 64, "hex")).toBe(
		"fdbabe1c9d3472007856e7190d01e9fe7c6ad7cbc8237830e77376634b3731622eaf30d92e22a3886ff109279d9830dac727afb94a83ee6d8360cbdfa2cc0640",
	);

	expect(
		await hash("pleaseletmein", "SodiumChloride", 16384, 8, 1, 64, "hex"),
	).toBe(
		"7023bdcb3afd7348461c06cd81fd38ebfda8fbba904f8e3ea9b543f6545da1f2d5432955613f0fcf62d49705242a9af9e61e85dc0d651e40dfcf017b45575887",
	);

	expect(
		await hash("pleaseletmein", "SodiumChloride", 1048576, 8, 1, 64, "hex"),
	).toBe(
		"2101cb9b6a511aaeaddbbe09cf70f881ec568d574a2ffd4dabe5ee9820adaa478e56fd8f4ba5d09ffa1c6d927c40f4c337304049e8a952fbcbf45c6fa77a41a4",
	);
});

test("scrypt binary", async () => {
	expect(await hash("\0", "\u0001", 16, 1, 1, 16, "hex")).toBe(
		"20e4dedae031ba96c1b1fe3e21b236fc",
	);

	expect(
		await hash(Buffer.from("\0"), Buffer.from("\u0001"), 16, 1, 1, 16, "hex"),
	).toBe("20e4dedae031ba96c1b1fe3e21b236fc");

	expect(await hash("\0\0\0\0\0", "\0\0\0\u0001", 16, 1, 1, 16, "hex")).toBe(
		"6fac8ee2ffdce78632fee3a5935d4f53",
	);

	expect(
		await hash(
			Buffer.from("\0\0\0\0\0"),
			Buffer.from("\0\0\0\u0001"),
			16,
			1,
			1,
			16,
			"hex",
		),
	).toBe("6fac8ee2ffdce78632fee3a5935d4f53");
});

test("invalid parameters", async () => {
	await expect(() => hash("", "", "", 1, 1, 16, "hex")).rejects.toThrow();
	await expect(() => hash("", "", 1, 1, 1, 16, "hex")).rejects.toThrow();
	await expect(() => hash("", "", 3, 1, 1, 16, "hex")).rejects.toThrow();
	await expect(() => hash("", "", 9, 1, 1, 16, "hex")).rejects.toThrow();
	await expect(() => hash("", "", 63, 1, 1, 16, "hex")).rejects.toThrow();
	await expect(() => hash("", "", 65, 1, 1, 16, "hex")).rejects.toThrow();
	await expect(() => hash("", "", 2, "", 1, 16, "hex")).rejects.toThrow();
	await expect(() => hash("", "", 2, 0, 1, 16, "hex")).rejects.toThrow();
	await expect(() => hash("", "", 2, 1, "", 16, "hex")).rejects.toThrow();
	await expect(() => hash("", "", 2, 1, 0, 16, "hex")).rejects.toThrow();
	await expect(() => hash("", "", 2, 1, 1, "", "hex")).rejects.toThrow();
	await expect(() => hash("", "", 2, 1, 1, 0, "hex")).rejects.toThrow();
	await expect(() => hash("", "", 2, 1, 1, 16, "binaryx")).rejects.toThrow();
	await expect(() => hash("", "", 2, 1, 1, 16, "")).rejects.toThrow();
	await expect(() => hash("", 1, 2, 1, 1, 16, "hex")).rejects.toThrow();
	await expect(() => hash(1, "", 2, 1, 1, 16, "hex")).rejects.toThrow();

	await expect(() => (scrypt as any)()).rejects.toThrow();
	await expect(() => (scrypt as any)([])).rejects.toThrow();
	await expect(() => (scrypt as any)({})).rejects.toThrow();
	await expect(() => (scrypt as any)(1)).rejects.toThrow();
});
