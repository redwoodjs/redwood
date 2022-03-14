module.exports = {
  apps: [
    {
      name: 'api',
      script: 'node_modules/.bin/rw',
      args: 'serve api',
      instances: 'max',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
    },
    {
      name: 'web',
      script: 'node_modules/.bin/rw',
      args: 'serve web',
      instances: 'max',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
}
