const processEnvComputed = require('./process-env-computed')

module.exports = {
  meta: {
    name: 'process-env-computed',
    version: '0.0.1',
  },
  rules: {
    'process-env-computed': processEnvComputed,
  },
}
