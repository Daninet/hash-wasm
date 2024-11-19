import crypto from "node:crypto";
import { createSHA512, pbkdf2 } from "../lib";

/* global test, expect */

function getNodePBKDF2(
	password,
	salt,
	iterations,
	keyLength,
	outputType?: string,
) {
	const buf = crypto.pbkdf2Sync(
		password,
		salt,
		iterations,
		keyLength,
		"sha512",
	);
	return outputType === "binary"
		? new Uint8Array(buf.buffer, buf.byteOffset, buf.length)
		: buf.toString("hex");
}

async function getWasmPBKDF2(
	password,
	salt,
	iterations,
	keyLength,
	outputType?: "hex" | "binary",
) {
	const hash = await pbkdf2({
		password,
		salt,
		iterations,
		hashLength: keyLength,
		hashFunction: createSHA512(),
		outputType,
	});

	return hash;
}

test("invalid parameters", () => {
	expect(() => getWasmPBKDF2("pwd", "salt", 1, 1, "" as any)).rejects.toThrow();
	expect(() =>
		getWasmPBKDF2("pwd", "salt", 1, 1, (() => "") as any),
	).rejects.toThrow();
	expect(() => getWasmPBKDF2("pwd", "salt", 1, 1, {} as any)).rejects.toThrow();
	expect(() => getWasmPBKDF2("pwd", "salt", 1, 0)).rejects.toThrow();
	expect(() => getWasmPBKDF2("pwd", "salt", 0, 1)).rejects.toThrow();
	expect(() => getWasmPBKDF2("pwd", "salt", 1, 1, null)).rejects.toThrow();
	expect(() => getWasmPBKDF2("pwd", "salt", 1, 1, "" as any)).rejects.toThrow();
	expect(() =>
		getWasmPBKDF2("pwd", "salt", 1, 1, "x" as any),
	).rejects.toThrow();

	expect(() => (pbkdf2 as any)()).rejects.toThrow();
	expect(() => (pbkdf2 as any)(() => {})).rejects.toThrow();
	expect(() => (pbkdf2 as any)([])).rejects.toThrow();

	expect(() =>
		pbkdf2({
			password: "x",
			salt: "y",
			iterations: 1,
			hashLength: 32,
			hashFunction: null,
		}),
	).rejects.toThrow();

	expect(() =>
		pbkdf2({
			password: "x",
			salt: "y",
			iterations: 1,
			hashLength: 32,
			hashFunction: pbkdf2 as any,
		}),
	).rejects.toThrow();

	expect(() =>
		pbkdf2({
			password: "x",
			salt: "y",
			iterations: 1,
			hashLength: 32,
			hashFunction: createSHA512 as any,
		}),
	).rejects.toThrow();
});

test("simple test", async () => {
	expect(await getWasmPBKDF2("password", "salt", 500, 50)).toBe(
		getNodePBKDF2("password", "salt", 500, 50),
	);
});

test("various key lengths", async () => {
	expect(await getWasmPBKDF2("password", "salt", 500, 1)).toBe(
		getNodePBKDF2("password", "salt", 500, 1),
	);

	expect(await getWasmPBKDF2("password", "salt", 500, 2)).toBe(
		getNodePBKDF2("password", "salt", 500, 2),
	);

	expect(await getWasmPBKDF2("password", "salt", 500, 600)).toBe(
		getNodePBKDF2("password", "salt", 500, 600),
	);
});

test("various iteration counts", async () => {
	expect(await getWasmPBKDF2("password", "salt", 1, 32)).toBe(
		getNodePBKDF2("password", "salt", 1, 32),
	);

	expect(await getWasmPBKDF2("password", "salt", 2, 32)).toBe(
		getNodePBKDF2("password", "salt", 2, 32),
	);

	expect(await getWasmPBKDF2("password", "salt", 100, 32)).toBe(
		getNodePBKDF2("password", "salt", 100, 32),
	);

	expect(await getWasmPBKDF2("password", "salt", 1000, 32)).toBe(
		getNodePBKDF2("password", "salt", 1000, 32),
	);

	expect(await getWasmPBKDF2("password", "salt", 10000, 32)).toBe(
		getNodePBKDF2("password", "salt", 10000, 32),
	);
});

test("various salt types", async () => {
	expect(await getWasmPBKDF2("password", "s", 10, 32)).toBe(
		getNodePBKDF2("password", "s", 10, 32),
	);

	expect(await getWasmPBKDF2("password", "", 10, 32)).toBe(
		getNodePBKDF2("password", "", 10, 32),
	);

	expect(await getWasmPBKDF2("password", new Uint8Array(0), 10, 32)).toBe(
		getNodePBKDF2("password", new Uint8Array(0), 10, 32),
	);

	expect(await getWasmPBKDF2("password", new Uint8Array(1), 10, 32)).toBe(
		getNodePBKDF2("password", new Uint8Array(1), 10, 32),
	);

	expect(
		await getWasmPBKDF2("password", new Array(1024).fill("s").join(""), 10, 32),
	).toBe(getNodePBKDF2("password", new Array(1024).fill("s").join(""), 10, 32));

	expect(await getWasmPBKDF2("password", Buffer.from([0]), 10, 32)).toBe(
		getNodePBKDF2("password", Buffer.from([0]), 10, 32),
	);
});

test("various password types", async () => {
	expect(await getWasmPBKDF2("", "salt", 10, 32)).toBe(
		getNodePBKDF2("", "salt", 10, 32),
	);

	expect(await getWasmPBKDF2("p", "salt", 10, 32)).toBe(
		getNodePBKDF2("p", "salt", 10, 32),
	);

	expect(await getWasmPBKDF2(new Uint8Array(0), "salt", 10, 32)).toBe(
		getNodePBKDF2(new Uint8Array(0), "salt", 10, 32),
	);

	expect(await getWasmPBKDF2(new Uint8Array(1), "salt", 10, 32)).toBe(
		getNodePBKDF2(new Uint8Array(1), "salt", 10, 32),
	);

	expect(
		await getWasmPBKDF2(new Array(1024).fill("p").join(""), "salt", 10, 32),
	).toBe(getNodePBKDF2(new Array(1024).fill("p").join(""), "salt", 10, 32));

	expect(await getWasmPBKDF2(Buffer.from([0]), "salt", 10, 32)).toBe(
		getNodePBKDF2(Buffer.from([0]), "salt", 10, 32),
	);
});

test("test binary output format", async () => {
	expect(
		ArrayBuffer.isView(await getWasmPBKDF2("123", "salt", 2, 10, "binary")),
	).toBe(true);

	expect(
		await getWasmPBKDF2("password", "salt", 123, 57, "binary"),
	).toStrictEqual(getNodePBKDF2("password", "salt", 123, 57, "binary"));
});
