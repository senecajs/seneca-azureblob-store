const Seneca = require('seneca')

run()

async function run() {
  let s0 = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use('..', {
      blob: {
        mode: 'local',
      },
    })

  await s0.ready()
  console.log(s0.version)
}
