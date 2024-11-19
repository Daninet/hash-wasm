/* global test, expect */

beforeEach(() => {
	jest.resetModules();
});

afterEach(() => {
	jest.restoreAllMocks();
});

test("Throws when WebAssembly is unavailable", async () => {
	const { md5 } = jest.requireActual("../lib");

	const WASM = globalThis.WebAssembly;
	(globalThis.WebAssembly as any) = undefined;

	await expect(() => md5("a")).rejects.toThrow();
	globalThis.WebAssembly = WASM;
});

const NodeBuffer = (globalThis as any).Buffer;

class TextEncoderMock {
	encode(str) {
		const buf = NodeBuffer.from(str);
		return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
	}
}

test("Simulate browsers", async () => {
	const originalBuffer = globalThis.Buffer;
	((globalThis as any).Buffer as any) = undefined;
	const originalTextEncoder = globalThis.TextEncoder;
	((globalThis as any).TextEncoder as any) = TextEncoderMock;

	const { md5 } = jest.requireActual("../lib");
	expect(await md5("a")).toBe("0cc175b9c0f1b6a831c399e269772661");
	expect(await md5(new Uint8Array([0]))).toBe(
		"93b885adfe0da089cdf634904fd59f71",
	);
	expect(() => md5(1)).rejects.toThrow();

	globalThis.TextEncoder = originalTextEncoder;
	globalThis.Buffer = originalBuffer;
});

test("Use global self", async () => {
	const global = globalThis;
	(globalThis as any).self = global;

	const { md5 } = jest.requireActual("../lib");
	expect(await md5("a")).toBe("0cc175b9c0f1b6a831c399e269772661");
});

test("Delete global self", async () => {
	const originalSelf = globalThis.self;
	(globalThis.self as any) = undefined;

	const { md5 } = jest.requireActual("../lib");
	expect(await md5("a")).toBe("0cc175b9c0f1b6a831c399e269772661");

	globalThis.self = originalSelf;
});

test("Use global window", async () => {
	const originalWindow = globalThis.window;
	(globalThis.window as any) = undefined;

	const { md5 } = jest.requireActual("../lib");
	expect(await md5("a")).toBe("0cc175b9c0f1b6a831c399e269772661");

	globalThis.window = originalWindow;
});

test("Delete global self + window", async () => {
	const originalWindow = globalThis.window;
	(globalThis.window as any) = undefined;

	const { md5 } = jest.requireActual("../lib");
	expect(await md5("a")).toBe("0cc175b9c0f1b6a831c399e269772661");

	globalThis.window = originalWindow;
});
