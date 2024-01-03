/* MIT License, Copyright (c) 2023, Richard Rodger and other contributors. */
'use strict'

const LOCAL = 'true' !== process.env.SENECA_TEST_LIVE_BLOB_STORE

const Fs = require('fs')

const Seneca = require('seneca')
const Shared = require('seneca-store-test')

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const local_blob_shared = require('./local_blob_shared')

//const describe = lab.describe
//const it = lab.it

const deep = Seneca.util.deep

const Plugin = require('..')

const test_opts = {
  name: 'blob-store',
}

lab.before(async function () {
  test_opts.options = {
    blob: {
      mode: 'local',
      endpoint: 'http://127.0.0.1:10000/devstoreaccount1',
    },
    ...local_blob_shared
  }

  // test_opts.seneca = Seneca({ require })
  test_opts.seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
})

lab.test('happy', async function () {
  let s0 = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use(Plugin, {
      blob: {
        mode: 'local',
      },
      ...local_blob_shared
    })

  await s0.ready()
  console.log(s0.version)
})

Shared.test.init(lab, test_opts)
Shared.test.keyvalue(lab, test_opts)

const local_opts = {
  name: 'blob-store',
  options: {
    local: {
      active: true,
      folder: __dirname + '/blobfiles/data',
      suffixMode: 'genid',
    },
    ...local_blob_shared
  },
}

lab.before(async function () {
  local_opts.seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
})

Shared.test.init(lab, local_opts)
Shared.test.keyvalue(lab, local_opts)

lab.test('jsonl-blob', async function () {
  let options = Seneca.util.deep(test_opts.options, {
    ent: {
      '-/optent/color': { jsonl: 'parts' },
      '-/directive/color': { jsonl: 'parts' },
    },
  })

  let s0 = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use(Plugin, options)

  let color0 = await s0.entity('optent/color').save$({
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  expect(color0).includes({
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  let color0r = await s0.entity('optent/color').load$(color0.id)
  expect(color0r).includes({
    id: color0.id,
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  let color1 = await s0.entity('directive/color').save$({
    directive$: { jsonl$: 'parts' },
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  expect(color1).includes({
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  let color1r = await s0.entity('directive/color').load$({
    id: color1.id,
    jsonl$: 'parts',
  })
  expect(color1r).includes({
    id: color1.id,
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })
})

lab.test('jsonl-blob-customid', async function () {
  const s0 = makeSeneca(
    deep(test_opts.options, {
      folder: '',
      ent: {
        '-/optent/color': { jsonl: 'parts' },
      },
    })
  )

  let color2 = await s0.entity('optent/color').save$({
    id$: 'color2',
    parts: [{ val: 40 }, { val: 80 }, { val: 120 }],
  })
  expect(color2.id).equal('color2')
  let color2r = await s0.entity('optent/color').load$(color2.id)
  expect(color2r).includes({
    id: color2.id,
    parts: [{ val: 40 }, { val: 80 }, { val: 120 }],
  })
})

lab.test('jsonl-local-basic', async function () {
  let options = Seneca.util.deep(test_opts.options, {
    ent: {
      '-/optent/color': { jsonl: 'parts' },
      '-/directive/color': { jsonl: 'parts' },
    },
    local: {
      active: true,
      folder: __dirname + '/blobfiles/data',
      suffixMode: 'genid',
    },
  })

  let s0 = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use(Plugin, options)

  let color0 = await s0.entity('optent/color').save$({
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  expect(color0).includes({
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  let color0r = await s0.entity('optent/color').load$(color0.id)
  expect(color0r).includes({
    id: color0.id,
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  let color1 = await s0.entity('directive/color').save$({
    directive$: { jsonl$: 'parts' },
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  expect(color1).includes({
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  let color1r = await s0.entity('directive/color').load$({
    id: color1.id,
    jsonl$: 'parts',
  })
  expect(color1r).includes({
    id: color1.id,
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })
})

lab.test('bin-blob-basic', async function () {
  let options = Seneca.util.deep(test_opts.options, {
    ent: {
      '-/optent/planet': { bin: 'map' },
      '-/directive/planet': { bin: 'map' },
    },
  })

  let s0 = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use(Plugin, options)

  let planet0 = await s0.entity('optent/planet').save$({
    map: Buffer.from([1, 2, 3]),
  })

  expect(planet0).includes({
    map: Buffer.from([1, 2, 3]),
  })

  let planet0r = await s0.entity('optent/planet').load$(planet0.id)
  expect(planet0r).includes({
    id: planet0.id,
    map: Buffer.from([1, 2, 3]),
  })

  let planet1 = await s0.entity('directive/planet').save$({
    directive$: { bin$: 'map' },
    map: Buffer.from([1, 2, 3]),
  })

  expect(planet1).includes({
    map: Buffer.from([1, 2, 3]),
  })

  let planet1r = await s0.entity('directive/planet').load$({
    id: planet1.id,
    bin$: 'map',
  })
  expect(planet1r).includes({
    id: planet1.id,
    map: Buffer.from([1, 2, 3]),
  })
})

lab.test('bin-local-basic', async function () {
  let options = Seneca.util.deep(test_opts.options, {
    ent: {
      '-/optent/planet': { bin: 'map' },
      '-/directive/planet': { bin: 'map' },
    },
    local: {
      active: true,
      folder: __dirname + '/blobfiles/data',
      suffixMode: 'genid',
    },
  })

  let s0 = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use(Plugin, options)

  let planet0 = await s0.entity('optent/planet').save$({
    map: Buffer.from([1, 2, 3]),
  })

  expect(planet0).includes({
    map: Buffer.from([1, 2, 3]),
  })

  let planet0r = await s0.entity('optent/planet').load$(planet0.id)
  expect(planet0r).includes({
    id: planet0.id,
    map: Buffer.from([1, 2, 3]),
  })

  let planet1 = await s0.entity('directive/planet').save$({
    directive$: { bin$: 'map' },
    map: Buffer.from([1, 2, 3]),
  })

  expect(planet1).includes({
    map: Buffer.from([1, 2, 3]),
  })

  let planet1r = await s0.entity('directive/planet').load$({
    id: planet1.id,
    bin$: 'map',
  })
  expect(planet1r).includes({
    id: planet1.id,
    map: Buffer.from([1, 2, 3]),
  })
})

lab.test('bin-local-customid', async function () {
  let s0 = makeSeneca(
    deep(test_opts.options, {
      folder: '',
      ent: {
        '-/optent/planet': { bin: 'map' },
      },
      local: {
        active: true,
        folder: __dirname + '/blobfiles/data',
        suffixMode: 'genid',
      },
    })
  )

  let planet0 = await s0.entity('optent/planet').save$({
    id$: 'planet0',
    map: Buffer.from([1, 2, 3]),
  })

  expect(planet0.id).equals('planet0')

  let planet0r = await s0.entity('optent/planet').load$(planet0.id)
  expect(planet0r).includes({
    id: planet0.id,
    map: Buffer.from([1, 2, 3]),
  })
})

function makeSeneca(blobopts) {
  return Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use(Plugin, blobopts)
}
