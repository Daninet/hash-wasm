import { bcrypt, bcryptVerify } from "../lib";
/* global test, expect */

const hash = async (password, salt, costFactor, outputType) =>
	bcrypt({
		password,
		salt,
		costFactor,
		version: "2a",
		outputType,
	});

test("bcrypt", async () => {
	expect(await hash("a", "1234567890123456", 6, undefined)).toBe(
		"$2a$06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);

	expect(await hash("a", "1234567890123456", 6, "encoded")).toBe(
		"$2a$06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);

	expect(await hash("a", "1234567890123456", 6, "binary")).toMatchObject(
		new Uint8Array([
			89, 45, 160, 112, 36, 170, 113, 95, 224, 104, 80, 78, 242, 76, 208, 153,
			188, 181, 195, 1, 17, 71, 36, 103,
		]),
	);

	expect(await hash("a", "1234567890123456", 6, "hex")).toBe(
		"592da07024aa715fe068504ef24cd099bcb5c30111472467",
	);

	expect(
		await hash(
			[...new Array(72)].fill("a").join(""),
			"1234567890123456",
			6,
			"encoded",
		),
	).toBe("$2a$06$KRGxLBS0Lxe3KBCwKxOzLe.4hc7YvwS6eP.S.wxQssxSXlL.HBbCK");

	expect(
		await hash(
			[...new Array(72)].fill("a").join(""),
			"1234567890123456",
			6,
			"binary",
		),
	).toMatchObject(
		new Uint8Array([
			3, 168, 222, 245, 172, 114, 83, 200, 17, 1, 64, 50, 205, 43, 174, 205, 70,
			103, 52, 2, 67, 116, 67, 172,
		]),
	);

	expect(
		await hash(
			[...new Array(72)].fill("a").join(""),
			"1234567890123456",
			6,
			"hex",
		),
	).toBe("03a8def5ac7253c811014032cd2baecd46673402437443ac");
});

test("bcrypt self-test", async () => {
	const pass = "8b \xd0\xc1\xd2\xcf\xcc\xd8";
	const salt = Buffer.from([
		113, 215, 159, 130, 24, 163, 146, 89, 167, 162, 154, 171, 178, 219, 175,
		195,
	]);

	expect(await hash(pass, salt, 4, "encoded")).toBe(
		"$2a$04$abcdefghijklmnopqrstuupykUmEpWFIodLTMbMX8aLgIbIjXE2ye",
	);

	expect(await hash(pass, salt, 5, "encoded")).toBe(
		"$2a$05$abcdefghijklmnopqrstuuBBVy3wTnmAwUGHhsQHECk9dvWK.8Kaa",
	);

	expect(await hash(pass, salt, 6, "encoded")).toBe(
		"$2a$06$abcdefghijklmnopqrstuuzwLuAZdPqTLZf34qmCGDt1OORDMmDcC",
	);

	expect(await hash(pass, salt, 14, "encoded")).toBe(
		"$2a$14$abcdefghijklmnopqrstuuEKD8s8kkQZnOwmJAaMXPDP.L249l7n6",
	);
});

test("bcrypt bundled tests", async () => {
	expect(
		await hash(
			"U*U",
			Buffer.from([16, 65, 4, 16, 65, 4, 16, 65, 4, 16, 65, 4, 16, 65, 4, 16]),
			5,
			"encoded",
		),
	).toBe("$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW");

	expect(
		await hash(
			"U*U*",
			Buffer.from([16, 65, 4, 16, 65, 4, 16, 65, 4, 16, 65, 4, 16, 65, 4, 16]),
			5,
			"encoded",
		),
	).toBe("$2a$05$CCCCCCCCCCCCCCCCCCCCC.VGOzA784oUp/Z0DY336zx7pLYAy0lwK");

	expect(
		await hash(
			"U*U*U",
			Buffer.from([
				101, 150, 89, 101, 150, 89, 101, 150, 89, 101, 150, 89, 101, 150, 89,
				101,
			]),
			5,
			"encoded",
		),
	).toBe("$2a$05$XXXXXXXXXXXXXXXXXXXXXOAcXxm9kjPGEMsLznoKqmqw7tc8WCx4a");

	expect(
		await hash(
			"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
			Buffer.from([
				113, 215, 159, 130, 24, 163, 146, 89, 167, 162, 154, 171, 178, 219, 175,
				195,
			]),
			5,
			"encoded",
		),
	).toBe("$2a$05$abcdefghijklmnopqrstuu5s2v8.iXieOjg/.AySBTTZIIVFJeBui");

	const salt = Buffer.from([
		5, 3, 0, 133, 213, 237, 76, 23, 107, 42, 195, 203, 238, 71, 41, 28,
	]);
	expect(await hash(Buffer.from([0xff, 0xff, 0xa3]), salt, 5, "encoded")).toBe(
		"$2a$05$/OK.fbVrR/bpIqNJ5ianF.nqd1wy.pTMdcvrRWxyiGL2eMz.2a85.",
	);

	expect(await hash(Buffer.from([0xa3]), salt, 5, "encoded")).toBe(
		"$2a$05$/OK.fbVrR/bpIqNJ5ianF.Sa7shbm4.OzKpvFnX1pQLmQW96oUlCq",
	);

	expect(await hash(Buffer.from([0xa3]), salt, 5, "encoded")).toBe(
		"$2a$05$/OK.fbVrR/bpIqNJ5ianF.Sa7shbm4.OzKpvFnX1pQLmQW96oUlCq",
	);

	expect(await hash(Buffer.from([0xa3]), salt, 5, "encoded")).toBe(
		"$2a$05$/OK.fbVrR/bpIqNJ5ianF.Sa7shbm4.OzKpvFnX1pQLmQW96oUlCq",
	);

	expect(
		await hash(
			Buffer.from([
				0xff, 0xa3, 0x33, 0x34, 0xff, 0xff, 0xff, 0xa3, 0x33, 0x34, 0x35,
			]),
			salt,
			5,
			"encoded",
		),
	).toBe("$2a$05$/OK.fbVrR/bpIqNJ5ianF.ZC1JEJ8Z4gPfpe1JOr/oyPXTWl9EFd.");

	expect(
		await hash(Buffer.from([0xff, 0xa3, 0x33, 0x34, 0x35]), salt, 5, "encoded"),
	).toBe("$2a$05$/OK.fbVrR/bpIqNJ5ianF.nRht2l/HRhr6zmCp9vYUvvsqynflf9e");

	expect(await hash(Buffer.from([0xa3, 0x61, 0x62]), salt, 5, "encoded")).toBe(
		"$2a$05$/OK.fbVrR/bpIqNJ5ianF.6IflQkJytoRVc1yuaNtHfiuq.FRlSIS",
	);

	expect(await hash(Buffer.alloc(72, 0xaa), salt, 5, "encoded")).toBe(
		"$2a$05$/OK.fbVrR/bpIqNJ5ianF.swQOIzjOiJ9GHEPuhEkvqrUyvWhEMx6",
	);

	expect(
		await hash(Buffer.alloc(72, Buffer.from([0xaa, 0x55])), salt, 5, "encoded"),
	).toBe("$2a$05$/OK.fbVrR/bpIqNJ5ianF.R9xrDjiycxMbQE2bp.vgqlYpW5wx2yy");

	expect(
		await hash(
			Buffer.alloc(72, Buffer.from([0x55, 0xaa, 0xff])),
			salt,
			5,
			"encoded",
		),
	).toBe("$2a$05$/OK.fbVrR/bpIqNJ5ianF.9tQZzcJfm3uj2NvJ/n5xkhpqLrMpWCe");
});

test("bcrypt verify bundled tests", async () => {
	expect(
		await bcryptVerify({
			hash: "$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW",
			password: "U*U",
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2a$05$CCCCCCCCCCCCCCCCCCCCC.VGOzA784oUp/Z0DY336zx7pLYAy0lwK",
			password: "U*U*",
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2a$05$XXXXXXXXXXXXXXXXXXXXXOAcXxm9kjPGEMsLznoKqmqw7tc8WCx4a",
			password: "U*U*U",
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2a$05$abcdefghijklmnopqrstuu5s2v8.iXieOjg/.AySBTTZIIVFJeBui",
			password:
				"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2x$05$/OK.fbVrR/bpIqNJ5ianF.CE5elHaaO4EbggVDjb8P19RukzXSM3e",
			password: Buffer.from([0xa3]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2x$05$/OK.fbVrR/bpIqNJ5ianF.CE5elHaaO4EbggVDjb8P19RukzXSM3e",
			password: Buffer.from([0xff, 0xff, 0xa3]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2y$05$/OK.fbVrR/bpIqNJ5ianF.CE5elHaaO4EbggVDjb8P19RukzXSM3e",
			password: Buffer.from([0xff, 0xff, 0xa3]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2a$05$/OK.fbVrR/bpIqNJ5ianF.nqd1wy.pTMdcvrRWxyiGL2eMz.2a85.",
			password: Buffer.from([0xff, 0xff, 0xa3]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2b$05$/OK.fbVrR/bpIqNJ5ianF.CE5elHaaO4EbggVDjb8P19RukzXSM3e",
			password: Buffer.from([0xff, 0xff, 0xa3]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2y$05$/OK.fbVrR/bpIqNJ5ianF.Sa7shbm4.OzKpvFnX1pQLmQW96oUlCq",
			password: Buffer.from([0xa3]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2a$05$/OK.fbVrR/bpIqNJ5ianF.Sa7shbm4.OzKpvFnX1pQLmQW96oUlCq",
			password: Buffer.from([0xa3]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2b$05$/OK.fbVrR/bpIqNJ5ianF.Sa7shbm4.OzKpvFnX1pQLmQW96oUlCq",
			password: Buffer.from([0xa3]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2x$05$/OK.fbVrR/bpIqNJ5ianF.o./n25XVfn6oAPaUvHe.Csk4zRfsYPi",
			password: Buffer.from([0x31, 0xa3, 0x33, 0x34, 0x35]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2x$05$/OK.fbVrR/bpIqNJ5ianF.o./n25XVfn6oAPaUvHe.Csk4zRfsYPi",
			password: Buffer.from([0xff, 0xa3, 0x33, 0x34, 0x35]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2x$05$/OK.fbVrR/bpIqNJ5ianF.o./n25XVfn6oAPaUvHe.Csk4zRfsYPi",
			password: Buffer.from([
				0xff, 0xa3, 0x33, 0x34, 0xff, 0xff, 0xff, 0xa3, 0x33, 0x34, 0x35,
			]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2y$05$/OK.fbVrR/bpIqNJ5ianF.o./n25XVfn6oAPaUvHe.Csk4zRfsYPi",
			password: Buffer.from([
				0xff, 0xa3, 0x33, 0x34, 0xff, 0xff, 0xff, 0xa3, 0x33, 0x34, 0x35,
			]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2a$05$/OK.fbVrR/bpIqNJ5ianF.ZC1JEJ8Z4gPfpe1JOr/oyPXTWl9EFd.",
			password: Buffer.from([
				0xff, 0xa3, 0x33, 0x34, 0xff, 0xff, 0xff, 0xa3, 0x33, 0x34, 0x35,
			]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2y$05$/OK.fbVrR/bpIqNJ5ianF.nRht2l/HRhr6zmCp9vYUvvsqynflf9e",
			password: Buffer.from([0xff, 0xa3, 0x33, 0x34, 0x35]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2a$05$/OK.fbVrR/bpIqNJ5ianF.nRht2l/HRhr6zmCp9vYUvvsqynflf9e",
			password: Buffer.from([0xff, 0xa3, 0x33, 0x34, 0x35]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2a$05$/OK.fbVrR/bpIqNJ5ianF.6IflQkJytoRVc1yuaNtHfiuq.FRlSIS",
			password: Buffer.from([0xa3, 0x61, 0x62]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2x$05$/OK.fbVrR/bpIqNJ5ianF.6IflQkJytoRVc1yuaNtHfiuq.FRlSIS",
			password: Buffer.from([0xa3, 0x61, 0x62]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2y$05$/OK.fbVrR/bpIqNJ5ianF.6IflQkJytoRVc1yuaNtHfiuq.FRlSIS",
			password: Buffer.from([0xa3, 0x61, 0x62]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2x$05$6bNw2HLQYeqHYyBfLMsv/OiwqTymGIGzFsA4hOTWebfehXHNprcAS",
			password: Buffer.from([0xd1, 0x91]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2x$05$6bNw2HLQYeqHYyBfLMsv/O9LIGgn8OMzuDoHfof8AQimSGfcSWxnS",
			password: Buffer.from([0xd0, 0xc1, 0xd2, 0xcf, 0xcc, 0xd8]),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2a$05$/OK.fbVrR/bpIqNJ5ianF.swQOIzjOiJ9GHEPuhEkvqrUyvWhEMx6",
			password: Buffer.alloc(72, 0xaa),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2a$05$/OK.fbVrR/bpIqNJ5ianF.R9xrDjiycxMbQE2bp.vgqlYpW5wx2yy",
			password: Buffer.alloc(72, Buffer.from([0xaa, 0x55])),
		}),
	).toBe(true);

	expect(
		await bcryptVerify({
			hash: "$2a$05$/OK.fbVrR/bpIqNJ5ianF.9tQZzcJfm3uj2NvJ/n5xkhpqLrMpWCe",
			password: Buffer.alloc(72, Buffer.from([0x55, 0xaa, 0xff])),
		}),
	).toBe(true);
});

test("bcrypt verify bundled tests", async () => {
	const original =
		"$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW";
	for (let i = 7; i < 60; i++) {
		const newHash = `${original.substring(0, i)}a${original.substring(i + 1)}`;
		expect(
			await bcryptVerify({
				hash: newHash,
				password: "U*U",
			}),
		).toBe(false);
	}
});

test("Invalid bcrypt parameters", async () => {
	await expect(bcrypt("" as any)).rejects.toThrow();
	await expect(bcrypt([] as any)).rejects.toThrow();
	await expect((bcrypt as any)()).rejects.toThrow();
	const options: Parameters<typeof bcrypt>[0] = {
		password: "p",
		salt: "1234567890123456",
		costFactor: 4,
		outputType: "encoded",
	};

	await expect(bcrypt(options)).resolves.not.toThrow();

	await expect(bcrypt({ ...options, password: undefined })).rejects.toThrow();
	await expect(bcrypt({ ...options, password: null })).rejects.toThrow();
	await expect(bcrypt({ ...options, password: 1 as any })).rejects.toThrow();
	await expect(bcrypt({ ...options, password: [] as any })).rejects.toThrow();
	await expect(
		bcrypt({ ...options, password: Buffer.from([]) }),
	).rejects.toThrow();
	await expect(bcrypt({ ...options, password: "" })).rejects.toThrow();
	await expect(
		bcrypt({ ...options, password: Buffer.alloc(73) }),
	).rejects.toThrow();
	await expect(
		bcrypt({
			...options,
			password: [...Array(73)].fill("a").join("").toString(),
		}),
	).rejects.toThrow();

	await expect(bcrypt({ ...options, salt: undefined })).rejects.toThrow();
	await expect(bcrypt({ ...options, salt: null })).rejects.toThrow();
	await expect(
		bcrypt({ ...options, salt: "123456789012345" }),
	).rejects.toThrow();
	await expect(
		bcrypt({ ...options, salt: "12345678901234567" }),
	).rejects.toThrow();
	await expect(bcrypt({ ...options, salt: "" })).rejects.toThrow();
	await expect(
		bcrypt({ ...options, salt: Buffer.from([1, 2, 3, 4, 5, 6, 7]) }),
	).rejects.toThrow();

	await expect(bcrypt({ ...options, costFactor: undefined })).rejects.toThrow();
	await expect(bcrypt({ ...options, costFactor: null })).rejects.toThrow();
	await expect(bcrypt({ ...options, costFactor: 0 })).rejects.toThrow();
	await expect(bcrypt({ ...options, costFactor: "" as any })).rejects.toThrow();
	await expect(
		bcrypt({ ...options, costFactor: "0" as any }),
	).rejects.toThrow();
	await expect(bcrypt({ ...options, costFactor: 3 })).rejects.toThrow();
	await expect(bcrypt({ ...options, costFactor: 32 })).rejects.toThrow();

	await expect(bcrypt({ ...options, outputType: null })).rejects.toThrow();
	await expect(bcrypt({ ...options, outputType: "" as any })).rejects.toThrow();
	await expect(
		bcrypt({ ...options, outputType: "x" as any }),
	).rejects.toThrow();
	await expect(
		bcrypt({ ...options, outputType: "idx" as any }),
	).rejects.toThrow();
});

test("Invalid bcrypt verify parameters", async () => {
	await expect(bcryptVerify("" as any)).rejects.toThrow();
	await expect(bcryptVerify([] as any)).rejects.toThrow();
	await expect((bcryptVerify as any)()).rejects.toThrow();
	const options: Parameters<typeof bcryptVerify>[0] = {
		password: "a",
		hash: "$2a$06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	};

	await expect(bcryptVerify(options)).resolves.not.toThrow();

	await expect(
		bcryptVerify({ ...options, password: undefined }),
	).rejects.toThrow();
	await expect(bcryptVerify({ ...options, password: null })).rejects.toThrow();
	await expect(
		bcryptVerify({ ...options, password: 1 as any }),
	).rejects.toThrow();
	await expect(
		bcryptVerify({ ...options, password: [] as any }),
	).rejects.toThrow();
	await expect(
		bcryptVerify({ ...options, password: Buffer.from([]) }),
	).rejects.toThrow();
	await expect(bcryptVerify({ ...options, password: "" })).rejects.toThrow();
	await expect(
		bcryptVerify({ ...options, password: Buffer.alloc(73) }),
	).rejects.toThrow();
	await expect(
		bcryptVerify({
			...options,
			password: [...Array(73)].fill("a").join("").toString(),
		}),
	).rejects.toThrow();

	const testHash = async (hashStr: string) => {
		await expect(bcryptVerify({ ...options, hash: hashStr })).rejects.toThrow();
	};

	await testHash(undefined);
	await testHash(null);
	await testHash("");
	await testHash("123456789012345");
	await testHash(
		"@2a$06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);
	await testHash(
		"$1a$06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);
	await testHash(
		"$2c$06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);
	await testHash(
		"$2z$06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);
	await testHash(
		"$22$06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);
	await testHash(
		"$2a@06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);
	await testHash(
		"$2a$03$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);
	await testHash(
		"$2a$00$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);
	await testHash(
		"$2a$32$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);
	await testHash(
		"$2a$06@KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);
	await testHash(
		"$2a$06$@RGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO",
	);
	await testHash(
		"$2a$06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPw@",
	);
	await testHash(
		"$2a$06$KRGxLBS0Lxe3KBCwKxOzLeUQ0eaAQoaT9eYD/M6ixOkZwzuuCPPwO2",
	);
});
