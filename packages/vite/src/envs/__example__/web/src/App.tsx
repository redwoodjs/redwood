import React from 'react'

const vite = `\
  import RefreshRuntime from "/@react-refresh"
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
`

export default function ({ children }) {
  return (
    <html lang="en">
      <head>
        <title>RSC FTW</title>
      </head>
      <body>
        <div id="root">{children}</div>
        <script type="module" dangerouslySetInnerHTML={{ __html: vite }} />
        <script type="module" src="/src/envs/entry-client.tsx"></script>
      </body>
    </html>
  )
}
