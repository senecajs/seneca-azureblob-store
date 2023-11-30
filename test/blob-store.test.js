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

//const describe = lab.describe
//const it = lab.it

const Plugin = require('..')
const test_opts = {
  name: 'blob-store'
}

lab.before(async function () {
  test_opts.options = {
    blob: {
      mode: 'local',
      endpoint: 'http://127.0.0.1:10000/devstoreaccount1'
    }
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
        mode: 'local'
      },
    })

  await s0.ready()
  console.log(s0.version)
})

Shared.test.init(lab, test_opts)


lab.describe('keyvalue', () => {
  let s0 = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use(Plugin, {
      blob: {
        mode: 'local'
      },
    })
    
  lab.before(() => s0.ready())
  
  Shared.test.keyvalue(lab, { seneca: s0, ent0: 'ent0' })
})
