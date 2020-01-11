import path from 'path'

import React from 'react'
import { render } from '@testing-library/react'

import { autoImportPages } from '../autoImportPages'

const MOCK_PAGES_DIR = path.resolve(__dirname, '../__mocks__/pages')

describe('router', () => {
  describe('autoImportPages', () => {
    it('imports the pages at the specified path', () => {
      const pages = autoImportPages({ path: MOCK_PAGES_DIR })
      expect(Object.keys(pages)).toEqual(['HelloWorld', 'MargleTheWorld'])
    })

    it('the pages are valid jsx elements', () => {
      const { HelloWorld, MargleTheWorld } = autoImportPages({
        path: MOCK_PAGES_DIR,
      })
      const { getByText } = render(
        <>
          <HelloWorld />
          <MargleTheWorld />
        </>
      )
      expect(getByText('Hello, world!')).toBeInTheDocument()
      expect(getByText('Meow!')).toBeInTheDocument()
    })
  })
})
