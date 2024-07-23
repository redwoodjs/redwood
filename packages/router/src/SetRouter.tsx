'use client'

import React, { useRef, Suspense, useEffect } from 'react'

import { createFromFetch } from 'react-server-dom-webpack/client'

import { useLocation } from '@redwoodjs/router'

// import { useLocation } from '@redwoodjs/router/dist/location'

const BASE_PATH = '/rw-rsc/'

interface SetRouterProps {
  children: React.ReactNode
}

const rscCache = new Map<string, Thenable<React.ReactElement>>()

function rscFetch(rscId: string, props: Record<string, unknown>) {
  const serializedProps = JSON.stringify(props)

  const cached = rscCache.get(serializedProps)
  if (cached) {
    return cached
  }

  const searchParams = new URLSearchParams()
  searchParams.set('props', serializedProps)

  // TODO (RSC): During SSR we should not fetch (Is this function really
  // called during SSR?)
  const response = fetch(
    'http://localhost:8910' + BASE_PATH + rscId + '?' + searchParams,
    {
      headers: { 'rw-rsc': '1' },
    },
  )

  const componentPromise = createFromFetch<never, React.ReactElement>(response)
  rscCache.set(serializedProps, componentPromise)

  return componentPromise
}

// This should be added last to all the set wrappers
// Like this:
//       <Set wrap={[NavigationLayout, SetRouter]}>
// But instead of explicitly doing it like that, it should be done in the Set
// component itself
export const SetRouter = ({ children }: SetRouterProps) => {
  const [color, setColor] = React.useState('purple')
  const [pathname, setPathname] = React.useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const loc = useLocation()

  // useEffect to "hide" from SSR
  useEffect(() => {
    setPathname(loc.pathname)
  }, [loc.pathname])

  return (
    <div
      style={{
        border: `2px solid ${color}`,
        margin: '2px',
        padding: '2px',
        borderRadius: '4px',
      }}
    >
      <button
        onClick={() => {
          const color = (inputRef.current || { value: '' }).value || 'purple'
          console.log('SetRouter button clicked', color)
          setColor(color)
        }}
      >
        SetRouter button
      </button>
      <input ref={inputRef} />
      <button
        onClick={() => {
          // rscFetch('__rwjs__Router', {
          //   location: { pathname: '/about' },
          // }).then((data: React.ReactElement) => {
          //   setTimeout(() => {
          //     console.log('data', data[0])
          //     setColor('green')
          //   }, 1000)
          // })
          console.log('inputRef.current', inputRef.current)
          console.log('inputRef.current.value', (inputRef.current as any).value)
          const pathname = (inputRef.current || { value: '' }).value || '/about'
          setPathname(pathname)
        }}
      >
        rscFetch
      </button>
      {/* <Suspense fallback={<div>Loading...</div>}>
        {color === 'green'
          ? rscCache.get(JSON.stringify({ location: { pathname: '/about' } }))
          : 'not green'}
      </Suspense> */}
      <Suspense fallback={<div>Loading...</div>}>
        {pathname
          ? (rscFetch('__rwjs__Routes', {
              location: { pathname, search: 'skip-set' },
            }) as unknown as React.ReactNode)
          : children}
      </Suspense>
      {/* <Suspense fallback={children}>
        {rscFetch('__rwjs__Routes', {
          location: {
            pathname: pathname,
            search: 'skip-set',
          },
        })}
      </Suspense> */}
      {/* <Suspense fallback={<div>Loading...</div>}>
        <UseFetch />
      </Suspense> */}
    </div>
  )
}

// const UseFetch = (): any => {
//   return use(rscFetch('__rwjs__Router', { location: { pathname: '/about' } }))
// }
