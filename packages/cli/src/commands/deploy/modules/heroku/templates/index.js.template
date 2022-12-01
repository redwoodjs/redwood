// template[tags(heroku)]
/* eslint-disable */

const fs = require('fs')
const pm2 = require('pm2')

pm2.start(
  {
    name: 'redwood-template-app',
    node_args: '-r dotenv/config',
    script: './node_modules/.bin/redwood',
    args: `serve api`,
    env: {
      NODE_ENV: 'production',
    },
  },
  function (err) {
    if (err)
      return console.error(
        'Error while launching applications',
        err.stack || err
      )

    console.log('[+] PM2 Started!')

    if (process.env.DYNO) {
      console.log(`[+] Sending ready signal to NGINX`)
      fs.openSync('/tmp/app-initialized', 'w')
    }

    pm2.launchBus((err, bus) => {
      console.log('[PM2] log stream started')

      bus.on('log:out', function (packet) {
        console.log(`[${packet.process.name}] ${packet.data}`)
      })

      bus.on('log:err', function (packet) {
        console.error(`[App:${packet.process.name}][ERR!] ${packet.data}`)
      })
    })
  }
)
