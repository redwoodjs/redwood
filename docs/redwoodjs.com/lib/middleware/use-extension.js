// https://github.com/tapio/live-server/issues/244

const fs = require('fs')
const path = require('path')
const rootDirectory = './publish/'
const extensions = ['html']

module.exports = function (req, _res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next()
  }

  if (req.url !== '/' && path.extname(req.url) === '') {
    const requestedPath = req.url.replace('/', '')
    let i = 0
    const check = () => {
      const path = rootDirectory + requestedPath + '.' + extensions[i]

      fs.access(path, (err) => {
        if (!err) {
          req.url += '.' + extensions[i]
          next()
        } else {
          if (++i >= extensions.length) {
            next()
          } else {
            check()
          }
        }
      })
    }

    check()
  } else {
    next()
  }
}
