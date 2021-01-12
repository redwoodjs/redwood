// @ts-check
import React from 'react'

import ReactDOMServer from 'react-dom/server'

export const runPrerender = async ({ input, output }) => {
  const { default: PageToRender } = await import(input)
  console.log(PageToRender)
  const out = ReactDOMServer.renderToStaticMarkup(<PageToRender />)
  console.log(out)
}
