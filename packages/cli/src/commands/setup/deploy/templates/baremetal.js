export const ECOSYSTEM = `module.exports = {
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
}`

export const DEPLOY = `# This file contains config for a baremetal deployment, see http://redwoodjs.com/docs/deploy#baremetal-deploy

[[servers]]
connect = "user@server.com"
sides = ["api", "web"]

# If you have separate api and web servers, you can configure each separately:
#
# [[servers]]
# connect = "user@api.server.com"
# sides = ["api"]
#
# [[servers]]
# connect = "user@web.server.com"
# sides = ["web"]
# migrate = false
`
