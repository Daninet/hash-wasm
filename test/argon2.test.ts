import { argon2 } from '../lib';
/* global test, expect */

const hash = async (password, salt, parallelism, iterations, memorySize, hashLength, hashType) => argon2({
  password,
  salt,
  parallelism,
  iterations,
  memorySize,
  hashLength,
  hashType,
});

const hashMultiple = async (...params: Parameters<typeof hash>) => {
  params.pop();
  const parr = [
    [...params, 'i'],
    [...params, 'd'],
    [...params, 'id'],
  ];

  return Promise.all(parr.map((p) => hash(...p as Parameters<typeof hash>)));
};

test('argon2d', async () => {
  expect(
    await hash('a', 'abcdefgh', 1, 2, 16, 16, 'd'),
  ).toBe('77ab7ab1e8b3a4c3610327502709b131');

  expect(
    await hash('text demo', '123456789', 7, 20, 56, 32, 'd'),
  ).toBe('4470e3dea5a56405b579940a0da1be1f0b93dde207abf29a97fa24ea80ec1ad7');

  expect(
    await hash('text demo', '123456789', 2, 1, 32, 32, 'd'),
  ).toBe('e606633e6ce0148e7397c48fae9ce69e75c2dbb94fa87ac70b620d36855ca317');

  expect(
    await hash('abc', '1234567812345678', 1, 1, 8, 4, 'd'),
  ).toBe('1fe14ab8');

  expect(
    await hash('abc', '12345678', 3, 5, 31, 18, 'd'),
  ).toBe('1a4a99591876ae1f0fa0a664c15cb727377e');
});

test('argon2id', async () => {
  expect(
    await hash('a', 'abcdefgh', 1, 2, 16, 16, 'id'),
  ).toBe('f94aa50873d67fdd589d6774b87c0634');

  expect(
    await hash('text demo', '123456789', 7, 20, 56, 32, 'id'),
  ).toBe('ec2f7a502b4bfe7dc758c4c5120c7420830d42efdc7a78971743649b30cafb15');

  expect(
    await hash('text demo', '123456789', 2, 1, 64, 32, 'id'),
  ).toBe('b3f9d902f65bd329cf0810c78b19c746b6f46fbb8243647a8942ab83b6850d47');

  expect(
    await hash('abc', '1234567812345678', 1, 1, 8, 4, 'id'),
  ).toBe('ffde3f6a');

  expect(
    await hash('abc', '12345678', 3, 5, 31, 18, 'id'),
  ).toBe('4e37e561150881c66096b17bc6a326e37e87');
});

test('argon2i', async () => {
  expect(
    await hash('a', 'abcdefgh', 1, 2, 16, 16, 'i'),
  ).toBe('2852426eb498671a10f2a91185baec84');

  expect(
    await hash('text demo', '123456789', 7, 20, 56, 32, 'i'),
  ).toBe('d8a577f24c319bfae90556a30851ac5e031c7f6e752fb6caf05471a26ce061bb');

  expect(
    await hash('text demo', '123456789', 2, 1, 64, 32, 'i'),
  ).toBe('d88b0eafcd02b94b28f77246dda8c1a47533cfc7e6bd948edb5eca27fdbb7dc9');

  expect(
    await hash('abc', '1234567812345678', 1, 1, 8, 4, 'i'),
  ).toBe('ced82c90');

  expect(
    await hash('abc', '12345678', 3, 5, 31, 18, 'i'),
  ).toBe('c0efcdc71934adfa47d3e48cb82679899b21');
});

test('others', async () => {
  expect(
    await hashMultiple('password', 'somesalt', 1, 1, 64, 24, 'i'),
  ).toMatchObject([
    'b9c401d1844a67d50eae3967dc28870b22e508092e861a37',
    '8727405fd07c32c78d64f547f24150d3f2e703a89f981a19',
    '655ad15eac652dc59f7170a7332bf49b8469be1fdb9c28bb',
  ]);

  expect(
    await hashMultiple('password', 'somesalt', 1, 2, 64, 24, 'i'),
  ).toMatchObject([
    '8cf3d8f76a6617afe35fac48eb0b7433a9a670ca4a07ed64',
    '3be9ec79a69b75d3752acb59a1fbb8b295a46529c48fbb75',
    '068d62b26455936aa6ebe60060b0a65870dbfa3ddf8d41f7',
  ]);

  expect(
    await hashMultiple('password', 'somesalt', 2, 2, 64, 24, 'i'),
  ).toMatchObject([
    '2089f3e78a799720f80af806553128f29b132cafe40d059f',
    '68e2462c98b8bc6bb60ec68db418ae2c9ed24fc6748a40e9',
    '350ac37222f436ccb5c0972f1ebd3bf6b958bf2071841362',
  ]);

  expect(
    await hashMultiple('password', 'somesalt', 2, 3, 256, 24, 'i'),
  ).toMatchObject([
    'f5bbf5d4c3836af13193053155b73ec7476a6a2eb93fd5e6',
    'f4f0669218eaf3641f39cc97efb915721102f4b128211ef2',
    '4668d30ac4187e6878eedeacf0fd83c5a0a30db2cc16ef0b',
  ]);

  expect(
    await hashMultiple('password', 'somesalt', 4, 4, 4096, 24, 'i'),
  ).toMatchObject([
    'a11f7b7f3f93f02ad4bddb59ab62d121e278369288a0d0e7',
    '935598181aa8dc2b720914aa6435ac8d3e3a4210c5b0fb2d',
    '145db9733a9f4ee43edf33c509be96b934d505a4efb33c5a',
  ]);

  expect(
    await hashMultiple('password', 'somesalt', 8, 4, 1024, 24, 'i'),
  ).toMatchObject([
    '0cdd3956aa35e6b475a7b0c63488822f774f15b43f6e6e17',
    '83604fc2ad0589b9d055578f4d3cc55bc616df3578a896e9',
    '8dafa8e004f8ea96bf7c0f93eecf67a6047476143d15577f',
  ]);

  expect(
    await hashMultiple('password', 'somesalt', 3, 2, 64, 24, 'i'),
  ).toMatchObject([
    '5cab452fe6b8479c8661def8cd703b611a3905a6d5477fe6',
    '22474a423bda2ccd36ec9afd5119e5c8949798cadf659f51',
    '4a15b31aec7c2590b87d1f520be7d96f56658172deaa3079',
  ]);

  expect(
    await hashMultiple('password', 'somesalt', 6, 3, 1024, 24, 'i'),
  ).toMatchObject([
    'd236b29c2b2a09babee842b0dec6aa1e83ccbdea8023dced',
    'a3351b0319a53229152023d9206902f4ef59661cdca89481',
    '1640b932f4b60e272f5d2207b9a9c626ffa1bd88d2349016',
  ]);

  expect(
    await hashMultiple('qwe', 'somesalt123', 1, 1, 8, 7, 'i'),
  ).toMatchObject([
    '688c5ac265ee78',
    '3af555cede3a50',
    'f7557d529ee588',
  ]);

  expect(
    await hashMultiple('qwe', 'somesalt123', 1, 1, 9, 7, 'i'),
  ).toMatchObject([
    '774cf6adb35c48',
    '68e9964c622ea7',
    'aca65924f01fb9',
  ]);

  expect(
    await hashMultiple('qwe', 'somesalt123', 5, 7, 41, 15, 'i'),
  ).toMatchObject([
    'b0e2e7a5ca0057aa65c0e7b0a77d03',
    '973b1c351d85311eec2aca0c2b05ec',
    'd53bb635cb701433b93c7d2e2765f3',
  ]);

  expect(
    await hashMultiple('qwe', 'somesalt123', 5, 7, 139, 15, 'i'),
  ).toMatchObject([
    'ef0d9bb599133b5aae77072887f0dd',
    '9f4778f1620e755c20cf49e634211d',
    '83e98a638c268d32adaec43a09a85c',
  ]);
});

test('binary input', async () => {
  expect(
    await hashMultiple(Buffer.from([0]), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]), 5, 17, 53, 16, 'i'),
  ).toMatchObject([
    'e5b19d4a233d1d1c8454090d6ecaf5bc',
    '135fd6b89f6b06f3358f233e51b8f016',
    '0fe1ea9fd185d539eb8dedac2e1ffc3b',
  ]);

  expect(
    await hashMultiple(Buffer.from([255, 255]), Buffer.from([255, 255, 255, 255, 255, 255, 255, 255]), 5, 17, 53, 16, 'i'),
  ).toMatchObject([
    '5edb1b6e86311f3eb95bcb4d57c27947',
    'eb470fa05da18e5b3691febff0f326dc',
    '977f2647e42ee63b822984f22d22a23c',
  ]);
});

test('longer calculations', async () => {
  expect(
    await hashMultiple('password', 'somesalt123', 11, 27, 13921, 16, 'i'),
  ).toMatchObject([
    'fd8a90f92f5370af8b7d9a69193cf49f',
    '0a624df8eb80045d1c580fa353697dbb',
    '68e4ead73a5087ec5a694427054ba527',
  ]);

  expect(
    await hashMultiple('password', 'somesalt123', 3, 4500, 99, 16, 'i'),
  ).toMatchObject([
    '20b864a80f1de88c55102432df5869ff',
    '17a96f78d9a369d0d9141805d00f721d',
    '196c8a57ba814aa3ce26c65fece9706b',
  ]);

  expect(
    await hashMultiple('password', 'somesalt123', 3, 4500, 99, 16, 'i'),
  ).toMatchObject([
    '20b864a80f1de88c55102432df5869ff',
    '17a96f78d9a369d0d9141805d00f721d',
    '196c8a57ba814aa3ce26c65fece9706b',
  ]);

  expect(
    await hashMultiple('password', 'somesalt123', 1, 2, 250000, 16, 'i'),
  ).toMatchObject([
    '3f9db9d0e65d9c78d53620bdcdcb04e0',
    '67f09ac991e535f9a99f4d6c4ac80f32',
    'e4a286c82d343ab9d8f77af35c6aaf0b',
  ]);
});
