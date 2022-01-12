const fs = require('fs/promises')

const toml = require('toml')

const headers = {}

fs.readFile('./netlify.toml').then((data) => {
  toml.parse(data).headers.forEach((rule) => {
    headers[rule.for] = Object.entries(rule.values).map(([name, value]) => ({ name, value }))
  })
})

module.exports = function (req, res, next) {
  if (req.method === 'GET') {
    const resHeaders = headers[req.url]

    if (resHeaders) {
      resHeaders.forEach((header) => {
        res.setHeader(header.name, header.value)
      })
    }
  }

  next()
}
