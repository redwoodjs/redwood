import fs from 'fs/promises'

/**
 * RSC build. Step 6.
 * Make RW specific env vars available to server components.
 * For client components this is done as a side-effect of importing from
 * @redwoodjs/web (see packages/web/src/config.ts).
 * The import of entries.js that we're adding this to is handled by the
 * RSC worker we've got set up
 */
export async function rscBuildRwEnvVars(webDistServerEntries: string) {
  await fs.appendFile(
    webDistServerEntries,
    `

globalThis.RWJS_API_GRAPHQL_URL = RWJS_ENV.RWJS_API_GRAPHQL_URL
globalThis.RWJS_API_URL = RWJS_ENV.RWJS_API_URL
globalThis.__REDWOOD__APP_TITLE = RWJS_ENV.__REDWOOD__APP_TITLE
globalThis.RWJS_EXP_STREAMING_SSR = RWJS_ENV.RWJS_EXP_STREAMING_SSR
globalThis.RWJS_EXP_RSC = RWJS_ENV.RWJS_EXP_RSC
`
  )

  // TODO (RSC): See if we can just import that config.ts file from
  // @redwoodjs/web/dist/config here
  // Or find some other way to not duplicate the definitions
  // Want to look at `noExternal` in our worker to do RWJS_ENV transforms.
  // And/or possibly optimizeDeps. I'm not sure. Also, right now we're getting
  // "`require` is not defined" errors. Probably some ESM/CJS issue
  // Also seems like when using noExternal we have to use just @redwoodjs/web
  // instead of @redwoodjs/web/dist/config which I think would be better
  //
  // console.log('adding rwjs/web import to entries.js')
  // return fs.appendFile(
  //   webDistServerEntries,
  //   `\nimport '@redwoodjs/web/dist/config'`
  // )
}
