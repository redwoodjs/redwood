// @TODO!! Move to fastify

// import type { Application } from 'express'
// import { createProxyMiddleware } from 'http-proxy-middleware'

// interface ApiProxyOptions {
//   apiUrl: string
//   apiHost?: string
// }

// const withApiProxy = (
//   app: Application,
//   { apiUrl, apiHost }: ApiProxyOptions
// ) => {
//   // If apiHost is supplied, it means the functions are running elsewhere
//   // So we should just proxy requests
//   if (apiHost) {
//     app.use(
//       createProxyMiddleware(apiUrl, {
//         changeOrigin: true,
//         pathRewrite: {
//           [`^${apiUrl}`]: '/', // remove base path
//         },
//         target: apiHost,
//       })
//     )
//   }

//   return app
// }

// export default withApiProxy
