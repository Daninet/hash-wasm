import { argon2Verify, argon2d, argon2i, argon2id } from "../lib";
/* global test, expect */

const hash = async (
	password,
	salt,
	parallelism,
	iterations,
	memorySize,
	hashLength,
	outputType,
	hashType = null,
) => {
	let fn: typeof argon2d | typeof argon2id | typeof argon2i;
	if (hashType === "d") {
		fn = argon2d;
	} else if (hashType === "id") {
		fn = argon2id;
	} else if (hashType === "i") {
		fn = argon2i;
	} else {
		throw new Error("Unsupported function type");
	}

	return fn({
		password,
		salt,
		parallelism,
		iterations,
		memorySize,
		hashLength,
		outputType,
	});
};

const hashMultiple = async (...params: Parameters<typeof hash>) => {
	const parr = [
		[...params, "i"],
		[...params, "d"],
		[...params, "id"],
	];

	return Promise.all(parr.map((p) => hash(...(p as Parameters<typeof hash>))));
};

test("argon2d", async () => {
	expect(await hash("a", "abcdefgh", 1, 2, 16, 16, "hex", "d")).toBe(
		"77ab7ab1e8b3a4c3610327502709b131",
	);

	expect(await hash("text demo", "123456789", 7, 20, 56, 32, "hex", "d")).toBe(
		"4470e3dea5a56405b579940a0da1be1f0b93dde207abf29a97fa24ea80ec1ad7",
	);

	expect(await hash("text demo", "123456789", 2, 1, 32, 32, "hex", "d")).toBe(
		"e606633e6ce0148e7397c48fae9ce69e75c2dbb94fa87ac70b620d36855ca317",
	);

	expect(await hash("abc", "1234567812345678", 1, 1, 8, 4, "hex", "d")).toBe(
		"1fe14ab8",
	);

	expect(await hash("abc", "12345678", 3, 5, 31, 18, "hex", "d")).toBe(
		"1a4a99591876ae1f0fa0a664c15cb727377e",
	);
});

test("argon2id", async () => {
	expect(await hash("a", "abcdefgh", 1, 2, 16, 16, "hex", "id")).toBe(
		"f94aa50873d67fdd589d6774b87c0634",
	);

	expect(await hash("text demo", "123456789", 7, 20, 56, 32, "hex", "id")).toBe(
		"ec2f7a502b4bfe7dc758c4c5120c7420830d42efdc7a78971743649b30cafb15",
	);

	expect(await hash("text demo", "123456789", 2, 1, 64, 32, "hex", "id")).toBe(
		"b3f9d902f65bd329cf0810c78b19c746b6f46fbb8243647a8942ab83b6850d47",
	);

	expect(await hash("abc", "1234567812345678", 1, 1, 8, 4, "hex", "id")).toBe(
		"ffde3f6a",
	);

	expect(await hash("abc", "12345678", 3, 5, 31, 18, "hex", "id")).toBe(
		"4e37e561150881c66096b17bc6a326e37e87",
	);
});

test("argon2i", async () => {
	expect(await hash("a", "abcdefgh", 1, 2, 16, 16, "hex", "i")).toBe(
		"2852426eb498671a10f2a91185baec84",
	);

	expect(await hash("text demo", "123456789", 7, 20, 56, 32, "hex", "i")).toBe(
		"d8a577f24c319bfae90556a30851ac5e031c7f6e752fb6caf05471a26ce061bb",
	);

	expect(await hash("text demo", "123456789", 2, 1, 64, 32, "hex", "i")).toBe(
		"d88b0eafcd02b94b28f77246dda8c1a47533cfc7e6bd948edb5eca27fdbb7dc9",
	);

	expect(await hash("abc", "1234567812345678", 1, 1, 8, 4, "hex", "i")).toBe(
		"ced82c90",
	);

	expect(await hash("abc", "12345678", 3, 5, 31, 18, "hex", "i")).toBe(
		"c0efcdc71934adfa47d3e48cb82679899b21",
	);
});

test.each`
	hashFn      | secret          | memorySize | iterations | parallelism | expected
	${argon2i}  | ${"somesecret"} | ${64}      | ${1}       | ${1}        | ${"$argon2i$v=19$m=64,t=1,p=1$c29tZXNhbHQ$feIpCNM774/NRKH7kk05fPDR9AVmS1Ti"}
	${argon2d}  | ${"somesecret"} | ${64}      | ${1}       | ${1}        | ${"$argon2d$v=19$m=64,t=1,p=1$c29tZXNhbHQ$BC1zOS/31Hbq1XqrbUolSJD8lbGO5hYA"}
	${argon2id} | ${"somesecret"} | ${64}      | ${1}       | ${1}        | ${"$argon2id$v=19$m=64,t=1,p=1$c29tZXNhbHQ$RvwmOL1c3noOUb9Tb0PVAyFny0544DEN"}
	${argon2i}  | ${"somesecret"} | ${64}      | ${2}       | ${1}        | ${"$argon2i$v=19$m=64,t=2,p=1$c29tZXNhbHQ$TSUIZoltkBnapO9908hb/n6UtBg/NzWC"}
	${argon2d}  | ${"somesecret"} | ${64}      | ${2}       | ${1}        | ${"$argon2d$v=19$m=64,t=2,p=1$c29tZXNhbHQ$UwnJWSBvwsqUqSfQ3O8eAeM35RaF3qVV"}
	${argon2id} | ${"somesecret"} | ${64}      | ${2}       | ${1}        | ${"$argon2id$v=19$m=64,t=2,p=1$c29tZXNhbHQ$iOtAF9uLeVkqVavTbncWiTAX+a0RQ34k"}
`(
	"$hashFn.name with secret=$secret and m=$memorySize,t=$iterations,p=$parallelism",
	async ({ hashFn, expected, ...params }) => {
		expect(
			await hashFn({
				...params,
				password: "password",
				salt: "somesalt",
				hashLength: 24,
				outputType: "encoded",
			}),
		).toBe(expected);
	},
);

test.each`
	phcString                                                                     | secret
	${"$argon2i$v=19$m=64,t=1,p=1$c29tZXNhbHQ$feIpCNM774/NRKH7kk05fPDR9AVmS1Ti"}  | ${"somesecret"}
	${"$argon2d$v=19$m=64,t=1,p=1$c29tZXNhbHQ$BC1zOS/31Hbq1XqrbUolSJD8lbGO5hYA"}  | ${"somesecret"}
	${"$argon2id$v=19$m=64,t=1,p=1$c29tZXNhbHQ$RvwmOL1c3noOUb9Tb0PVAyFny0544DEN"} | ${"somesecret"}
	${"$argon2i$v=19$m=64,t=2,p=1$c29tZXNhbHQ$TSUIZoltkBnapO9908hb/n6UtBg/NzWC"}  | ${"somesecret"}
	${"$argon2d$v=19$m=64,t=2,p=1$c29tZXNhbHQ$UwnJWSBvwsqUqSfQ3O8eAeM35RaF3qVV"}  | ${"somesecret"}
	${"$argon2id$v=19$m=64,t=2,p=1$c29tZXNhbHQ$iOtAF9uLeVkqVavTbncWiTAX+a0RQ34k"} | ${"somesecret"}
`(
	'argon2Verify("$phcString") with secret=$secret',
	async ({ phcString, secret }) => {
		expect(
			await argon2Verify({
				password: "password",
				secret,
				hash: phcString,
			}),
		).toBe(true);
	},
);

test("others", async () => {
	expect(
		await hashMultiple("password", "somesalt", 1, 1, 64, 24, "hex"),
	).toMatchObject([
		"b9c401d1844a67d50eae3967dc28870b22e508092e861a37",
		"8727405fd07c32c78d64f547f24150d3f2e703a89f981a19",
		"655ad15eac652dc59f7170a7332bf49b8469be1fdb9c28bb",
	]);

	expect(
		await hashMultiple("password", "somesalt", 1, 2, 64, 24, "hex"),
	).toMatchObject([
		"8cf3d8f76a6617afe35fac48eb0b7433a9a670ca4a07ed64",
		"3be9ec79a69b75d3752acb59a1fbb8b295a46529c48fbb75",
		"068d62b26455936aa6ebe60060b0a65870dbfa3ddf8d41f7",
	]);

	expect(
		await hashMultiple("password", "somesalt", 2, 2, 64, 24, "hex"),
	).toMatchObject([
		"2089f3e78a799720f80af806553128f29b132cafe40d059f",
		"68e2462c98b8bc6bb60ec68db418ae2c9ed24fc6748a40e9",
		"350ac37222f436ccb5c0972f1ebd3bf6b958bf2071841362",
	]);

	expect(
		await hashMultiple("password", "somesalt", 2, 3, 256, 24, "hex"),
	).toMatchObject([
		"f5bbf5d4c3836af13193053155b73ec7476a6a2eb93fd5e6",
		"f4f0669218eaf3641f39cc97efb915721102f4b128211ef2",
		"4668d30ac4187e6878eedeacf0fd83c5a0a30db2cc16ef0b",
	]);

	expect(
		await hashMultiple("password", "somesalt", 4, 4, 4096, 24, "hex"),
	).toMatchObject([
		"a11f7b7f3f93f02ad4bddb59ab62d121e278369288a0d0e7",
		"935598181aa8dc2b720914aa6435ac8d3e3a4210c5b0fb2d",
		"145db9733a9f4ee43edf33c509be96b934d505a4efb33c5a",
	]);

	expect(
		await hashMultiple("password", "somesalt", 8, 4, 1024, 24, "hex"),
	).toMatchObject([
		"0cdd3956aa35e6b475a7b0c63488822f774f15b43f6e6e17",
		"83604fc2ad0589b9d055578f4d3cc55bc616df3578a896e9",
		"8dafa8e004f8ea96bf7c0f93eecf67a6047476143d15577f",
	]);

	expect(
		await hashMultiple("password", "somesalt", 3, 2, 64, 24, "hex"),
	).toMatchObject([
		"5cab452fe6b8479c8661def8cd703b611a3905a6d5477fe6",
		"22474a423bda2ccd36ec9afd5119e5c8949798cadf659f51",
		"4a15b31aec7c2590b87d1f520be7d96f56658172deaa3079",
	]);

	expect(
		await hashMultiple("password", "somesalt", 6, 3, 1024, 24, "hex"),
	).toMatchObject([
		"d236b29c2b2a09babee842b0dec6aa1e83ccbdea8023dced",
		"a3351b0319a53229152023d9206902f4ef59661cdca89481",
		"1640b932f4b60e272f5d2207b9a9c626ffa1bd88d2349016",
	]);

	expect(
		await hashMultiple("qwe", "somesalt123", 1, 1, 8, 7, "hex"),
	).toMatchObject(["688c5ac265ee78", "3af555cede3a50", "f7557d529ee588"]);

	expect(
		await hashMultiple("qwe", "somesalt123", 1, 1, 9, 7, "hex"),
	).toMatchObject(["774cf6adb35c48", "68e9964c622ea7", "aca65924f01fb9"]);

	expect(
		await hashMultiple("qwe", "somesalt123", 5, 7, 41, 15, "hex"),
	).toMatchObject([
		"b0e2e7a5ca0057aa65c0e7b0a77d03",
		"973b1c351d85311eec2aca0c2b05ec",
		"d53bb635cb701433b93c7d2e2765f3",
	]);

	expect(
		await hashMultiple("qwe", "somesalt123", 5, 7, 139, 15, "hex"),
	).toMatchObject([
		"ef0d9bb599133b5aae77072887f0dd",
		"9f4778f1620e755c20cf49e634211d",
		"83e98a638c268d32adaec43a09a85c",
	]);

	expect(
		await hashMultiple("qwe", "somesalt123", 1, 1, 32, 71, "hex"),
	).toMatchObject([
		"e89516925f17ba503ddf434ee9d95f74222afb51d215189f1ade81ef4b659a0bb1472f51b0d80afde4b255a29b8003aa63872eb56befdf0ea6a9686f781ea7fed679a31b8a9b64",
		"da947a6a055943ba464ebfceab7d7ae09641e6b36b91eed1e982d95791ae4d14b0c922d25f709c79a569dd71f18c14a64c209eef79cfff729286bb572d9a90f1967ea7f7e01d5d",
		"a48192b3a4aae0fb0d79483037e05d00e27dc53776cf3d1988f490a83d0963d0e066526a1b3236b9977f3f9a336b005add9ae036cf4f03e903efcdd3e136531055fc9541ee5133",
	]);
});

test("binary input", async () => {
	expect(
		await hashMultiple(
			Buffer.from([0]),
			Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
			5,
			17,
			53,
			16,
			"hex",
		),
	).toMatchObject([
		"e5b19d4a233d1d1c8454090d6ecaf5bc",
		"135fd6b89f6b06f3358f233e51b8f016",
		"0fe1ea9fd185d539eb8dedac2e1ffc3b",
	]);

	expect(
		await hashMultiple(
			Buffer.from([255, 255]),
			Buffer.from([255, 255, 255, 255, 255, 255, 255, 255]),
			5,
			17,
			53,
			16,
			"hex",
		),
	).toMatchObject([
		"5edb1b6e86311f3eb95bcb4d57c27947",
		"eb470fa05da18e5b3691febff0f326dc",
		"977f2647e42ee63b822984f22d22a23c",
	]);
});

test("encoded output", async () => {
	expect(
		await hashMultiple("qwe", "somesalt123", 5, 7, 139, 15, "encoded"),
	).toMatchObject([
		"$argon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
		"$argon2d$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$n0d48WIOdVwgz0nmNCEd",
		"$argon2id$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$g+mKY4wmjTKtrsQ6Cahc",
	]);

	expect(
		await hashMultiple("qwe", "somesalt1234", 5, 7, 139, 14, "encoded"),
	).toMatchObject([
		"$argon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM0$OjqEjKhIhkBJiOzuxF0",
		"$argon2d$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM0$1X4UBqWUQ7jTkDk0TJ0",
		"$argon2id$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM0$JGdE2OSkkRVj11OyKTY",
	]);

	expect(
		await hashMultiple("qwer", "somesalt12345", 1, 3, 15, 13, "encoded"),
	).toMatchObject([
		"$argon2i$v=19$m=15,t=3,p=1$c29tZXNhbHQxMjM0NQ$swV4i6hngm7sH6eJ+w",
		"$argon2d$v=19$m=15,t=3,p=1$c29tZXNhbHQxMjM0NQ$1JFQBXLo5kulbgktjA",
		"$argon2id$v=19$m=15,t=3,p=1$c29tZXNhbHQxMjM0NQ$1+hSMJUXYUFO9jVUnQ",
	]);
});

test("verifies encoded output", async () => {
	expect(
		await argon2Verify({
			password: "qwe",
			hash: "$argon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
		}),
	).toBe(true);
	expect(
		await argon2Verify({
			password: "qwer",
			hash: "$argon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
		}),
	).toBe(false);
	expect(
		await argon2Verify({
			password: "qwe",
			hash: "$argon2d$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$n0d48WIOdVwgz0nmNCEd",
		}),
	).toBe(true);
	expect(
		await argon2Verify({
			password: "qwer",
			hash: "$argon2d$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$n0d48WIOdVwgz0nmNCEd",
		}),
	).toBe(false);
	expect(
		await argon2Verify({
			password: "qwe",
			hash: "$argon2id$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$g+mKY4wmjTKtrsQ6Cahc",
		}),
	).toBe(true);
	expect(
		await argon2Verify({
			password: "qwer",
			hash: "$argon2id$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$g+mKY4wmjTKtrsQ6Cahc",
		}),
	).toBe(false);

	expect(
		await argon2Verify({
			password: "qwe",
			hash: "$argon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM0$OjqEjKhIhkBJiOzuxF0",
		}),
	).toBe(true);
	expect(
		await argon2Verify({
			password: "qwer",
			hash: "$argon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM0$OjqEjKhIhkBJiOzuxF0",
		}),
	).toBe(false);
	expect(
		await argon2Verify({
			password: "qwe",
			hash: "$argon2d$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM0$1X4UBqWUQ7jTkDk0TJ0",
		}),
	).toBe(true);
	expect(
		await argon2Verify({
			password: "qwer",
			hash: "$argon2d$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM0$1X4UBqWUQ7jTkDk0TJ0",
		}),
	).toBe(false);
	expect(
		await argon2Verify({
			password: "qwe",
			hash: "$argon2id$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM0$JGdE2OSkkRVj11OyKTY",
		}),
	).toBe(true);
	expect(
		await argon2Verify({
			password: "qwer",
			hash: "$argon2id$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM0$JGdE2OSkkRVj11OyKTY",
		}),
	).toBe(false);

	expect(
		await argon2Verify({
			password: "qwer",
			hash: "$argon2i$v=19$m=15,t=3,p=1$c29tZXNhbHQxMjM0NQ$swV4i6hngm7sH6eJ+w",
		}),
	).toBe(true);
	expect(
		await argon2Verify({
			password: "q",
			hash: "$argon2i$v=19$m=15,t=3,p=1$c29tZXNhbHQxMjM0NQ$swV4i6hngm7sH6eJ+w",
		}),
	).toBe(false);
	expect(
		await argon2Verify({
			password: "qwer",
			hash: "$argon2d$v=19$m=15,t=3,p=1$c29tZXNhbHQxMjM0NQ$1JFQBXLo5kulbgktjA",
		}),
	).toBe(true);
	expect(
		await argon2Verify({
			password: "q",
			hash: "$argon2d$v=19$m=15,t=3,p=1$c29tZXNhbHQxMjM0NQ$1JFQBXLo5kulbgktjA",
		}),
	).toBe(false);
	expect(
		await argon2Verify({
			password: "qwer",
			hash: "$argon2id$v=19$m=15,t=3,p=1$c29tZXNhbHQxMjM0NQ$1+hSMJUXYUFO9jVUnQ",
		}),
	).toBe(true);
	expect(
		await argon2Verify({
			password: "q",
			hash: "$argon2id$v=19$m=15,t=3,p=1$c29tZXNhbHQxMjM0NQ$1+hSMJUXYUFO9jVUnQ",
		}),
	).toBe(false);

	// parameter order is not important
	expect(
		await argon2Verify({
			password: "qwe",
			hash: "$argon2i$v=19$t=7,p=5,m=139$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
		}),
	).toBe(true);
	expect(
		await argon2Verify({
			password: "qwe",
			hash: "$argon2i$v=19$t=7,m=139,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
		}),
	).toBe(true);
	expect(
		await argon2Verify({
			password: "qwe",
			hash: "$argon2i$v=19$m=139,p=5,t=7$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
		}),
	).toBe(true);
});

test("binary output", async () => {
	expect(
		ArrayBuffer.isView(
			await hash("a", "abcdefgh", 1, 2, 16, 16, "binary", "d"),
		),
	).toBe(true);

	expect(
		await hashMultiple("qwe", "somesalt123", 5, 7, 41, 15, "binary"),
	).toMatchObject([
		new Uint8Array([
			0xb0, 0xe2, 0xe7, 0xa5, 0xca, 0x00, 0x57, 0xaa, 0x65, 0xc0, 0xe7, 0xb0,
			0xa7, 0x7d, 0x03,
		]),
		new Uint8Array([
			0x97, 0x3b, 0x1c, 0x35, 0x1d, 0x85, 0x31, 0x1e, 0xec, 0x2a, 0xca, 0x0c,
			0x2b, 0x05, 0xec,
		]),
		new Uint8Array([
			0xd5, 0x3b, 0xb6, 0x35, 0xcb, 0x70, 0x14, 0x33, 0xb9, 0x3c, 0x7d, 0x2e,
			0x27, 0x65, 0xf3,
		]),
	]);
});

test("longer calculations", async () => {
	expect(
		await hashMultiple("password", "somesalt123", 11, 27, 13921, 16, "hex"),
	).toMatchObject([
		"fd8a90f92f5370af8b7d9a69193cf49f",
		"0a624df8eb80045d1c580fa353697dbb",
		"68e4ead73a5087ec5a694427054ba527",
	]);

	expect(
		await hashMultiple("password", "somesalt123", 3, 4500, 99, 16, "hex"),
	).toMatchObject([
		"20b864a80f1de88c55102432df5869ff",
		"17a96f78d9a369d0d9141805d00f721d",
		"196c8a57ba814aa3ce26c65fece9706b",
	]);

	expect(
		await hashMultiple("password", "somesalt123", 3, 4500, 99, 16, "hex"),
	).toMatchObject([
		"20b864a80f1de88c55102432df5869ff",
		"17a96f78d9a369d0d9141805d00f721d",
		"196c8a57ba814aa3ce26c65fece9706b",
	]);

	expect(
		await hashMultiple("password", "somesalt123", 1, 2, 250000, 16, "hex"),
	).toMatchObject([
		"3f9db9d0e65d9c78d53620bdcdcb04e0",
		"67f09ac991e535f9a99f4d6c4ac80f32",
		"e4a286c82d343ab9d8f77af35c6aaf0b",
	]);
}, 30000);

test("Invalid parameters", async () => {
	const functions = [argon2i, argon2d, argon2id];

	for (const fn of functions) {
		await expect(fn("" as any)).rejects.toThrow();
		await expect(fn([] as any)).rejects.toThrow();
		await expect((fn as any)()).rejects.toThrow();
		const options: Parameters<typeof argon2i>[0] = {
			password: "p",
			salt: "salt1234",
			iterations: 1,
			parallelism: 8,
			memorySize: 1024,
			hashLength: 32,
		};

		await expect(fn(options)).resolves.not.toThrow();

		await expect(fn({ ...options, password: undefined })).rejects.toThrow();
		await expect(fn({ ...options, password: null })).rejects.toThrow();
		await expect(fn({ ...options, password: 1 as any })).rejects.toThrow();
		await expect(fn({ ...options, password: [] as any })).rejects.toThrow();
		await expect(
			fn({ ...options, password: Buffer.from([]) }),
		).rejects.toThrow();

		await expect(fn({ ...options, salt: undefined })).rejects.toThrow();
		await expect(fn({ ...options, salt: null })).rejects.toThrow();
		await expect(fn({ ...options, salt: "1234567" })).rejects.toThrow();
		await expect(fn({ ...options, salt: "" })).rejects.toThrow();
		await expect(
			fn({ ...options, salt: Buffer.from([1, 2, 3, 4, 5, 6, 7]) }),
		).rejects.toThrow();

		await expect(fn({ ...options, iterations: undefined })).rejects.toThrow();
		await expect(fn({ ...options, iterations: null })).rejects.toThrow();
		await expect(fn({ ...options, iterations: 0 })).rejects.toThrow();
		await expect(fn({ ...options, iterations: "" as any })).rejects.toThrow();
		await expect(fn({ ...options, iterations: "0" as any })).rejects.toThrow();

		await expect(fn({ ...options, parallelism: undefined })).rejects.toThrow();
		await expect(fn({ ...options, parallelism: null })).rejects.toThrow();
		await expect(fn({ ...options, parallelism: 0 })).rejects.toThrow();
		await expect(fn({ ...options, parallelism: "" as any })).rejects.toThrow();
		await expect(fn({ ...options, parallelism: "0" as any })).rejects.toThrow();

		await expect(fn({ ...options, hashLength: undefined })).rejects.toThrow();
		await expect(fn({ ...options, hashLength: null })).rejects.toThrow();
		await expect(fn({ ...options, hashLength: 3 })).rejects.toThrow();
		await expect(fn({ ...options, hashLength: "" as any })).rejects.toThrow();
		await expect(fn({ ...options, hashLength: "3" as any })).rejects.toThrow();

		await expect(fn({ ...options, memorySize: undefined })).rejects.toThrow();
		await expect(fn({ ...options, memorySize: null })).rejects.toThrow();
		await expect(fn({ ...options, memorySize: 7 })).rejects.toThrow();
		await expect(fn({ ...options, memorySize: "" as any })).rejects.toThrow();
		await expect(fn({ ...options, memorySize: "7" as any })).rejects.toThrow();
		await expect(
			fn({ ...options, parallelism: 2, memorySize: 15 }),
		).rejects.toThrow();
		await expect(
			fn({ ...options, parallelism: 5, memorySize: 39 }),
		).rejects.toThrow();

		await expect(fn({ ...options, outputType: null })).rejects.toThrow();
		await expect(fn({ ...options, outputType: "" as any })).rejects.toThrow();
		await expect(fn({ ...options, outputType: "x" as any })).rejects.toThrow();
		await expect(
			fn({ ...options, outputType: "idx" as any }),
		).rejects.toThrow();
	}
});

test("Invalid verify parameters", async () => {
	await expect(argon2Verify("" as any)).rejects.toThrow();
	await expect(argon2Verify([] as any)).rejects.toThrow();
	await expect((argon2Verify as any)()).rejects.toThrow();
	const options: Parameters<typeof argon2Verify>[0] = {
		password: "qwe",
		hash: "$argon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	};

	await expect(argon2Verify(options)).resolves.not.toThrow();

	await expect(
		argon2Verify({ ...options, password: undefined }),
	).rejects.toThrow();
	await expect(argon2Verify({ ...options, password: null })).rejects.toThrow();
	await expect(
		argon2Verify({ ...options, password: 1 as any }),
	).rejects.toThrow();
	await expect(
		argon2Verify({ ...options, password: [] as any }),
	).rejects.toThrow();
	await expect(
		argon2Verify({ ...options, password: Buffer.from([]) }),
	).rejects.toThrow();
	await expect(argon2Verify({ ...options, password: "" })).rejects.toThrow();

	const testHash = async (hashStr: string) => {
		await expect(argon2Verify({ ...options, hash: hashStr })).rejects.toThrow();
	};

	await testHash(undefined);
	await testHash(null);
	await testHash("");
	await testHash("123456789012345");
	await testHash(
		"$$argon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"argon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$brgon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon3i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2x$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2idx$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=18$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=0$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=0.23$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2iv=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19$m=139,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19$m=139,m=139,m=139$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19$m=01,t=01,p=01$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19$m=1,t=1,p=1$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19$m=139t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19$m=139,x=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19$m=139,t=7,p=0.0$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19$m=139,t=7,p=5c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19$m=139,t=7,p=5$c%29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM7w2btZkTO1qudwcoh/Dd",
	);
	await testHash(
		"$argon2i$v=19$m=139,t=7,p=5$c29tZXNhbHQxMjM$7w2btZkTO1qudwcoh/Dd%",
	);
});
