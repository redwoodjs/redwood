// Copied from
// https://github.com/nksaraf/fully-react/blob/4f738132a17d94486c8da19d8729044c3998fc54/packages/fully-react/src/shared/assets.tsx
// And then modified to work with our codebase

import React, { use } from 'react'

const linkProps = [
  ['js', { rel: 'modulepreload', crossOrigin: '' }],
  ['jsx', { rel: 'modulepreload', crossOrigin: '' }],
  ['ts', { rel: 'modulepreload', crossOrigin: '' }],
  ['tsx', { rel: 'modulepreload', crossOrigin: '' }],
  ['css', { rel: 'stylesheet', precedence: 'high' }],
  ['woff', { rel: 'preload', as: 'font', type: 'font/woff', crossOrigin: '' }],
  [
    'woff2',
    { rel: 'preload', as: 'font', type: 'font/woff2', crossOrigin: '' },
  ],
  ['gif', { rel: 'preload', as: 'image', type: 'image/gif' }],
  ['jpg', { rel: 'preload', as: 'image', type: 'image/jpeg' }],
  ['jpeg', { rel: 'preload', as: 'image', type: 'image/jpeg' }],
  ['png', { rel: 'preload', as: 'image', type: 'image/png' }],
  ['webp', { rel: 'preload', as: 'image', type: 'image/webp' }],
  ['svg', { rel: 'preload', as: 'image', type: 'image/svg+xml' }],
  ['ico', { rel: 'preload', as: 'image', type: 'image/x-icon' }],
  ['avif', { rel: 'preload', as: 'image', type: 'image/avif' }],
  ['mp4', { rel: 'preload', as: 'video', type: 'video/mp4' }],
  ['webm', { rel: 'preload', as: 'video', type: 'video/webm' }],
] as const

type Linkprop = (typeof linkProps)[number][1]

const linkPropsMap = new Map<string, Linkprop>(linkProps)

/**
 * Generates a link tag for a given file. This will load stylesheets and preload
 * everything else. It uses the file extension to determine the type.
 */
export const Asset = ({ file }: { file: string }) => {
  const ext = file.split('.').pop()
  const props = ext ? linkPropsMap.get(ext) : null

  if (!props) {
    return null
  }

  return <link href={file} {...props} />
}

export function Assets() {
  // TODO (RSC) Currently we only handle server assets.
  // Will probably need to handle client assets as well.
  // Do we also need special code for SSR?
  // if (isClient) return <ClientAssets />

  // @ts-expect-error Need experimental types here for this to work
  return <ServerAssets />
}

const findAssets = async () => {
  return [...new Set([...(await rwRscGlobal.findAssets(''))]).values()]
}

const AssetList = ({ assets }: { assets: string[] }) => {
  return (
    <>
      {assets.map((asset) => {
        return <Asset file={asset} key={asset} />
      })}
    </>
  )
}

async function ServerAssets() {
  const allAssets = await findAssets()

  return <AssetList assets={allAssets} />
}

export function ClientAssets() {
  const allAssets = use(findAssets())

  return <AssetList assets={allAssets} />
}
