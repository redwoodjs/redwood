## TODO

rw-serve
Not intended for production use
- Runs web on port
- Listens on port/apiRootPath

webCliOptions = {
  port: 8910
  socket
},

rw-serve api
Intended for production use
- runs api on port/apiRootPath

apiCliOptions = {
  port: 8911
  socket
  apiRootPath: '/',
},

rw-serve web
Intended for production use(?)
- runs web on port

webCliOptions = {
  port: 8910
  socket
  apiHost: redwood.toml.apiUrl,
},
