// This is the config that PM2 wants by default
// It is abstracted here for future extension
// https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: `APP_NAME-api`,
      script: 'node_modules/.bin/rw',
      args: 'serve api',
      wait_ready: true,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
