/* global test, expect */
import { decodeBase64, encodeBase64, getDecodeBase64Length } from "../lib/util";

test("encodes basic base64 strings", () => {
	expect(encodeBase64(Buffer.from(""))).toBe("");
	expect(encodeBase64(Buffer.from("f"))).toBe("Zg==");
	expect(encodeBase64(Buffer.from("fo"))).toBe("Zm8=");
	expect(encodeBase64(Buffer.from("foo"))).toBe("Zm9v");
	expect(encodeBase64(Buffer.from("foob"))).toBe("Zm9vYg==");
	expect(encodeBase64(Buffer.from("fooba"))).toBe("Zm9vYmE=");
	expect(encodeBase64(Buffer.from("foobar"))).toBe("Zm9vYmFy");

	expect(encodeBase64(Buffer.from(""), false)).toBe("");
	expect(encodeBase64(Buffer.from("f"), false)).toBe("Zg");
	expect(encodeBase64(Buffer.from("fo"), false)).toBe("Zm8");
	expect(encodeBase64(Buffer.from("foo"), false)).toBe("Zm9v");
	expect(encodeBase64(Buffer.from("foob"), false)).toBe("Zm9vYg");
	expect(encodeBase64(Buffer.from("fooba"), false)).toBe("Zm9vYmE");
	expect(encodeBase64(Buffer.from("foobar"), false)).toBe("Zm9vYmFy");
});

test("encodes binary base64", () => {
	for (let i = 800; i < 1050; i++) {
		let buf = Buffer.alloc(i, 0xff);
		expect(encodeBase64(buf)).toBe(buf.toString("base64"));
		buf = Buffer.alloc(i, 0x00);
		expect(encodeBase64(buf)).toBe(buf.toString("base64"));
		buf = Buffer.alloc(i, i % 256);
		expect(encodeBase64(buf)).toBe(buf.toString("base64"));
		buf = Buffer.alloc(i);
		for (let j = 0; j < i; j++) {
			buf[j] = j % 256;
		}
		expect(encodeBase64(buf)).toBe(buf.toString("base64"));
	}
});

const toHex = (a: Uint8Array): string => Buffer.from(a).toString("hex");

test("decodes basic base64 strings", () => {
	expect(toHex(decodeBase64(""))).toBe("");
	expect(toHex(decodeBase64("Zg=="))).toBe(Buffer.from("f").toString("hex"));
	expect(toHex(decodeBase64("Zg"))).toBe(Buffer.from("f").toString("hex"));
	expect(toHex(decodeBase64("Zm8="))).toBe(Buffer.from("fo").toString("hex"));
	expect(toHex(decodeBase64("Zm8"))).toBe(Buffer.from("fo").toString("hex"));
	expect(toHex(decodeBase64("Zm9v"))).toBe(Buffer.from("foo").toString("hex"));
	expect(toHex(decodeBase64("Zm9vYg=="))).toBe(
		Buffer.from("foob").toString("hex"),
	);
	expect(toHex(decodeBase64("Zm9vYg"))).toBe(
		Buffer.from("foob").toString("hex"),
	);
	expect(toHex(decodeBase64("Zm9vYmE="))).toBe(
		Buffer.from("fooba").toString("hex"),
	);
	expect(toHex(decodeBase64("Zm9vYmE"))).toBe(
		Buffer.from("fooba").toString("hex"),
	);
	expect(toHex(decodeBase64("Zm9vYmFy"))).toBe(
		Buffer.from("foobar").toString("hex"),
	);
});

test("decodes binary base64", () => {
	for (let i = 800; i < 1050; i++) {
		let buf = Buffer.alloc(i, 0xff);
		expect(toHex(decodeBase64(buf.toString("base64")))).toStrictEqual(
			buf.toString("hex"),
		);
		buf = Buffer.alloc(i, 0x00);
		expect(toHex(decodeBase64(buf.toString("base64")))).toStrictEqual(
			buf.toString("hex"),
		);
		buf = Buffer.alloc(i, i % 256);
		expect(toHex(decodeBase64(buf.toString("base64")))).toStrictEqual(
			buf.toString("hex"),
		);
		buf = Buffer.alloc(i);
		for (let j = 0; j < i; j++) {
			buf[j] = j % 256;
		}
		expect(toHex(decodeBase64(buf.toString("base64")))).toStrictEqual(
			buf.toString("hex"),
		);
	}
});

test("encode-decode", () => {
	for (let i = 800; i < 1050; i++) {
		let buf = Buffer.alloc(i, 0xff);
		expect(toHex(decodeBase64(encodeBase64(buf, false)))).toStrictEqual(
			buf.toString("hex"),
		);
		expect(toHex(decodeBase64(encodeBase64(buf, true)))).toStrictEqual(
			buf.toString("hex"),
		);
		buf = Buffer.alloc(i, 0x00);
		expect(toHex(decodeBase64(encodeBase64(buf, false)))).toStrictEqual(
			buf.toString("hex"),
		);
		expect(toHex(decodeBase64(encodeBase64(buf, true)))).toStrictEqual(
			buf.toString("hex"),
		);
		buf = Buffer.alloc(i, i % 256);
		expect(toHex(decodeBase64(encodeBase64(buf, false)))).toStrictEqual(
			buf.toString("hex"),
		);
		expect(toHex(decodeBase64(encodeBase64(buf, true)))).toStrictEqual(
			buf.toString("hex"),
		);
		buf = Buffer.alloc(i);
		for (let j = 0; j < i; j++) {
			buf[j] = j % 256;
		}
		expect(toHex(decodeBase64(encodeBase64(buf, false)))).toStrictEqual(
			buf.toString("hex"),
		);
		expect(toHex(decodeBase64(encodeBase64(buf, true)))).toStrictEqual(
			buf.toString("hex"),
		);
	}
});

test("decode length", () => {
	expect(getDecodeBase64Length("")).toBe(0);
	expect(getDecodeBase64Length("Zg==")).toBe(1);
	expect(getDecodeBase64Length("Zg")).toBe(1);
	expect(getDecodeBase64Length("Zm8=")).toBe(2);
	expect(getDecodeBase64Length("Zm8")).toBe(2);
	expect(getDecodeBase64Length("Zm9v")).toBe(3);
	expect(getDecodeBase64Length("Zm9vYg==")).toBe(4);
	expect(getDecodeBase64Length("Zm9vYg")).toBe(4);
	expect(getDecodeBase64Length("Zm9vYmE=")).toBe(5);
	expect(getDecodeBase64Length("Zm9vYmE")).toBe(5);
	expect(getDecodeBase64Length("Zm9vYmFy")).toBe(6);
});
