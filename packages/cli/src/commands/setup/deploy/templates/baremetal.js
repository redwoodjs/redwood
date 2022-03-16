export const ECOSYSTEM = `module.exports = {
  apps: [
    {
      name: 'serve',
      script: 'node_modules/.bin/rw',
      args: 'serve',
      instances: 'max',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
}`

export const DEPLOY = `# This file contains config for a baremetal deployment
#
# SSH connection options include:
#
# * host - the remote server hostname/IP
# * port - defaults to 22
# * username - required, the user you're connecting as
# * password - only set if you're not using key-based authentication
# * privateKey - local file path to a private key that will be sent with the connection request
# * passphrase - used if your private key has a passphrase
# * agentForward - set to \`true\` to forward the client machine's ssh credentials
#
# See https://redwoodjs.com/docs/deploy#baremetal-deploy for more info

[[servers]]
host = "server.com"
username = "user"
agentForward = true
sides = ["api","web"]
path = "/var/www/app"
processNames = ["serve"]

# If you have separate api and web servers:
#
# [[servers]]
# host = "api.server.com"
# user = "user"
# agentForward = true
# sides = ["api"]
# path = "/var/www/app"
# processNames = ["api"]
#
# [[servers]]
# host = "web.server.com"
# user = "user"
# agentForward = true
# sides = ["web"]
# path = "/var/www/app"
# migrate = false # only one server in a cluster needs to migrate
# processNames = ["web"]
`
