// @ts-check
import React from 'react'

import ReactDOMServer from 'react-dom/server'

import TestComponent from './TestComponent'
import TSGuy from './TSGuy'

export const runPrerender = () => {
  const output = ReactDOMServer.renderToStaticMarkup(<TestComponent />)
  const tsOutput = ReactDOMServer.renderToStaticMarkup(<TSGuy />)
  console.log(output)

  console.log(tsOutput)
}
