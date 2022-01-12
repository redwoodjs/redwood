const fs = require('fs/promises')

const toml = require('toml')

const redirects = {}

fs.readFile('./netlify.toml').then((data) => {
  toml.parse(data).redirects.forEach((rule) => {
    const from = rule.from
    redirects[from] = {
      to: rule.to,
      status: rule.status,
    }
  })
})

module.exports = function (req, res, next) {
  if (req.method === 'GET') {
    const rule = redirects[req.url]

    if (rule) {
      res.writeHead(rule.status || 301, { Location: rule.to })
      res.end()
      return
    }
  }

  next()
}
