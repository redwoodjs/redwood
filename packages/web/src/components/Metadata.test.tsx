import React from 'react'

import { render, waitFor } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { describe, beforeAll, it, expect, beforeEach, afterAll } from 'vitest'

import { Metadata } from './Metadata'

// DOCS: can return a structured object from the database and just give it to `og` and it works

describe('Metadata', () => {
  describe('Synchronous mode', () => {
    // By default react-helmet-async is rendering everything async. But there
    // is no reliable way to test the non-existence of elements in async mode.
    // Turning on SSR mode however makes it render synchronous. But we never
    // use HelmetProvider in SSR mode (RW doesn't support SSR yet). So ideally
    // we'd only test Helmet in normal async mode. So we have a tests here in
    // SSR mode for "doesn't render". The rest of the tests are in the normal
    // async mode.
    beforeAll(() => {
      HelmetProvider.canUseDOM = false
    })

    afterAll(() => {
      HelmetProvider.canUseDOM = true
    })

    let context: any

    beforeEach(() => {
      context = { helmet: {} }
    })

    it('renders nothing if no props or children', async () => {
      render(<Metadata />, {
        container: document.head,
        wrapper: ({ children }) => (
          // In SSR mode react-helmet-async renders to `context` synchronously
          <HelmetProvider context={context}>{children}</HelmetProvider>
        ),
      })

      // react-helmet-async inserts an empty <title> tag by default. Verify
      // that it stays empty
      const title = render(context.helmet.title.toComponent()).container
        .textContent

      expect(title).toEqual('')
      expect(context.helmet.base.toString()).toEqual('')
      expect(context.helmet.bodyAttributes.toString()).toEqual('')
      expect(context.helmet.htmlAttributes.toString()).toEqual('')
      expect(context.helmet.link.toString()).toEqual('')
      expect(context.helmet.meta.toString()).toEqual('')
      expect(context.helmet.noscript.toString()).toEqual('')
      expect(context.helmet.script.toString()).toEqual('')
      expect(context.helmet.style.toString()).toEqual('')
    })

    it('does not automatically add `og:title` if set to null', async () => {
      render(<Metadata title="My Title" og={{ title: null }} />, {
        container: document.head,
        wrapper: ({ children }) => (
          // In SSR mode react-helmet-async renders to `context` synchronously
          <HelmetProvider context={context}>{children}</HelmetProvider>
        ),
      })

      expect(context.helmet.base.toString()).toEqual('')
      expect(context.helmet.bodyAttributes.toString()).toEqual('')
      expect(context.helmet.htmlAttributes.toString()).toEqual('')
      expect(context.helmet.link.toString()).toEqual('')
      expect(context.helmet.meta.toString()).not.toContain('"og:title"')
      expect(context.helmet.noscript.toString()).toEqual('')
      expect(context.helmet.script.toString()).toEqual('')
      expect(context.helmet.style.toString()).toEqual('')
      expect(context.helmet.title.toString()).toContain('>My Title<')
    })

    it('does not automatically add `og:description` if set to null', () => {
      render(
        <Metadata description="Lorem ipsum" og={{ description: null }} />,
        {
          container: document.head,
          wrapper: ({ children }) => (
            // In SSR mode react-helmet-async renders to `context` synchronously
            <HelmetProvider context={context}>{children}</HelmetProvider>
          ),
        },
      )

      expect(context.helmet.meta.toString()).not.toContain('"og:description"')
    })

    it('does not automatically add `og:type` if set to null', () => {
      render(<Metadata og={{ type: null }} />, {
        container: document.head,
        wrapper: ({ children }) => (
          // In SSR mode react-helmet-async renders to `context` synchronously
          <HelmetProvider context={context}>{children}</HelmetProvider>
        ),
      })

      expect(context.helmet.meta.toString()).not.toContain('"og:type"')
    })

    it('does not create a standard name/content tag for the `charSet` prop', () => {
      render(<Metadata charSet="utf-8" />, {
        container: document.head,
        wrapper: ({ children }) => (
          // In SSR mode react-helmet-async renders to `context` synchronously
          <HelmetProvider context={context}>{children}</HelmetProvider>
        ),
      })

      expect(context.helmet.meta.toString()).toContain('charset="utf-8"')
      expect(context.helmet.meta.toString()).not.toContain('name="charset"')
      expect(context.helmet.meta.toString()).not.toContain('content="utf-8"')
    })
  })

  it('renders non-namespaced props', async () => {
    const input = <Metadata title="My Title" />
    const output = <meta name="title" content="My Title" />

    await expectToContain(input, output)
  })

  it('renders children', async () => {
    const input = (
      <Metadata>
        <link href="main.css" rel="stylesheet" />
        <meta name="foo" content="bar" />
      </Metadata>
    )
    const output = (
      <>
        <link href="main.css" rel="stylesheet" />
        <meta name="foo" content="bar" />
      </>
    )

    await expectToContain(input, output)
  })

  it('renders props and children', async () => {
    const input = (
      <Metadata title="My Title">
        <meta httpEquiv="refresh" content="30" />
      </Metadata>
    )
    const output = (
      <>
        <meta name="title" content="My Title" />
        <meta httpEquiv="refresh" content="30" />
      </>
    )

    await expectToContain(input, output)
  })

  it('renders first-level namespaced props', async () => {
    const input = <Metadata og={{ image: 'http://host.test/image.jpg' }} />
    const output = (
      <meta property="og:image" content="http://host.test/image.jpg" />
    )

    await expectToContain(input, output)
  })

  it('renders multiple first-level namespaced props', async () => {
    const input = (
      <Metadata
        og={{ image: 'http://host.test/image.jpg' }}
        twitter={{ card: 'summary' }}
      />
    )
    const output = (
      <>
        <meta property="og:image" content="http://host.test/image.jpg" />
        <meta property="twitter:card" content="summary" />
      </>
    )

    await expectToContain(input, output)
  })

  it('renders second-level namespaced props', async () => {
    const input = <Metadata og={{ image: { width: 100 } }} />
    const output = <meta property="og:image:width" content="100" />

    await expectToContain(input, output)
  })

  it('renders combined first-level and second-level namespaced props', async () => {
    const input = (
      <Metadata
        og={{
          image: 'http://host.test/image.jpg',
          display: { type: 'screen' },
        }}
      />
    )
    const output = (
      <>
        <meta property="og:image" content="http://host.test/image.jpg" />
        <meta property="og:display:type" content="screen" />
      </>
    )

    await expectToContain(input, output)
  })

  it('renders an array of non-namespaced props', async () => {
    const input = <Metadata title={['Title 1', 'Title 2']} />
    const output = (
      <>
        <meta name="title" content="Title 1" />
        <meta name="title" content="Title 2" />
      </>
    )

    await expectToContain(input, output)
  })

  it('renders an array of namespaced props', async () => {
    const input = (
      <Metadata
        og={{
          image: ['http://host.test/image1.jpg', 'http://host.test/image2.jpg'],
        }}
      />
    )
    const output = (
      <>
        <meta property="og:image" content="http://host.test/image1.jpg" />
        <meta property="og:image" content="http://host.test/image2.jpg" />
      </>
    )

    await expectToContain(input, output)
  })

  it('renders a mixture of namespaced array strings and objects', async () => {
    const input = (
      <Metadata
        og={{
          image: [
            'http://host.test/image1.jpg',
            { width: 1024, height: 768 },
            'http://host.test/image2.jpg',
            'http://host.test/image3.jpg',
            { width: 640 },
            { height: 480 },
          ],
        }}
      />
    )
    const output = (
      <>
        <meta property="og:image" content="http://host.test/image1.jpg" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="768" />
        <meta property="og:image" content="http://host.test/image2.jpg" />
        <meta property="og:image" content="http://host.test/image3.jpg" />
        <meta property="og:image:width" content="640" />
        <meta property="og:image:height" content="480" />
      </>
    )

    await expectToContain(input, output)
  })

  it('adds a <title> tag if `title` attribute present', async () => {
    const input = <Metadata title="My Title" />
    const output = <title>My Title</title>

    await expectToContain(input, output)
  })

  // This test doesn't work with react-helmet-async. It only renders a single
  // <title> tag. (The last one given, so Title 2 in this case.)
  // it('adds multiple <title> tags in proper order if `title` attribute is an array', async () => {
  //   const input = <Metadata title={['Title 1', 'Title 2']} />
  //   const output = (
  //     <>
  //       <title>Title 1</title>
  //       <title>Title 2</title>
  //     </>
  //   )

  //   await expectToContain(input, output)
  // })

  it('adds multiple <meta name="title" /> tags in proper order if `title` attribute is an array', async () => {
    const input = <Metadata title={['Title 1', 'Title 2']} />
    const output = (
      <>
        <meta name="title" content="Title 1" />
        <meta name="title" content="Title 2" />
      </>
    )

    await expectToContain(input, output)
  })

  it('adds an `og:title` tag if any `og` key present', async () => {
    const input = <Metadata title="My Title" og />
    const output = (
      <>
        <meta name="title" content="My Title" />
        <meta property="og:title" content="My Title" />
      </>
    )

    await expectToContain(input, output)
  })

  it('does not automatically add `og:title` if already present', async () => {
    const input = <Metadata title="My Title" og={{ title: 'OG Title' }} />
    const output = (
      <>
        <meta name="title" content="My Title" />
        <meta property="og:title" content="OG Title" />
      </>
    )

    await expectToContain(input, output)
  })

  it('adds an `og:description` tag if any `og` key present', async () => {
    const input = <Metadata description="Lorem ipsum" og />
    const output = (
      <>
        <meta name="description" content="Lorem ipsum" />
        <meta property="og:description" content="Lorem ipsum" />
      </>
    )

    await expectToContain(input, output)
  })

  it('does not automatically add `og:description` if already present', async () => {
    const input = (
      <Metadata
        description="Lorem ipsum"
        og={{ description: 'Dolar sit amet' }}
      />
    )
    const output = (
      <>
        <meta name="description" content="Lorem ipsum" />
        <meta property="og:description" content="Dolar sit amet" />
      </>
    )

    await expectToContain(input, output)
  })

  it('adds an `og:type` tag if any `og` key present', async () => {
    const input = <Metadata rel="test" og />
    const output = (
      <>
        <meta property="og:type" content="website" />
      </>
    )

    await expectToContain(input, output)
  })

  it('does not automatically add `og:type` if already present', async () => {
    const input = <Metadata og={{ type: 'article' }} />
    const output = (
      <>
        <meta property="og:type" content="article" />
      </>
    )

    await expectToContain(input, output)
  })

  it('adds a special `charSet` meta tag if `charSet` prop present', async () => {
    const input = <Metadata charSet="utf-8" />
    const output = (
      <>
        <meta charSet="utf-8" />
      </>
    )

    await expectToContain(input, output)
  })

  it('renders a typical collection of <meta> tags', async () => {
    const input = (
      <Metadata
        title="My Title"
        description="Lorem ipsum"
        charSet="utf-8"
        locale="en-US"
        og={{
          image: ['http://host.test/image1.jpg', { width: 1024, height: 768 }],
        }}
        twitter={{
          card: 'summary',
          site: '@username',
        }}
      />
    )
    const output = (
      <>
        <title>My Title</title>
        <meta name="title" content="My Title" />
        <meta name="description" content="Lorem ipsum" />
        <meta name="locale" content="en-US" />
        <meta property="og:image" content="http://host.test/image1.jpg" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="768" />
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:site" content="@username" />
        <meta charSet="utf-8" />
        <meta property="og:title" content="My Title" />
        <meta property="og:description" content="Lorem ipsum" />
        <meta property="og:type" content="website" />
      </>
    )

    await expectToContain(input, output)
  })
})

async function expectToContain(input: JSX.Element, output: JSX.Element) {
  // <Metadata /> needs a <HelmetProvider> when it's using react-helmet-async
  const wrapper = ({ children }: { children: JSX.Element }) => (
    <HelmetProvider>
      {/* Need an extra known element that we can await that's not getting */}
      {/* wrapped in any react-helmet-async element because of */}
      {/* https://stackoverflow.com/a/64862701/88106 */}
      <base href="https://example.org" data-testid="find-me" />
      {children}
    </HelmetProvider>
  )

  const inputScreen = render(input, {
    container: document.head,
    wrapper,
  })

  await waitFor(() => inputScreen.getByTestId('find-me'))
  // react-helmet-async adds `data-rh` to elements it inserts. And even if no
  // extra element is added, it still inserts an empty <title> tag with the
  // data-rh attribute on it. So we know it'll always be there
  await waitFor(() => getByAttribute(inputScreen, 'data-rh'))

  const inputHtml = inputScreen.container.innerHTML.replace(
    / data-rh="true"/g,
    '',
  )

  // Had to create a new element for the second render, or I got duplicate
  // elements in some cases. Looked like leftovers from the input render
  const outputHead = document.createElement('head')

  render(output, { container: outputHead })

  expect(inputHtml).toContain(outputHead.innerHTML)
}

function getByAttribute(screen: RenderResult, attr: string) {
  const el = screen.container.querySelector(`[${attr}]`)

  if (!el) {
    throw new Error(`No element found with attribute ${attr}`)
  }
}
