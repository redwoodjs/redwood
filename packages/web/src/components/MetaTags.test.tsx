import { render } from '@testing-library/react'

import '@testing-library/jest-dom'
import { MetaTags } from './MetaTags'

describe('MetaTags', () => {
  it('renders nothing if no props or children', () => {
    const meta = <MetaTags />

    const { container } = render(meta, { container: document.head })
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(0)
  })

  it('renders non-namespaced props', () => {
    const input = <MetaTags title="My Title" />
    const output = (
      <>
        <meta name="title" content="My Title" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('renders children', () => {
    const input = (
      <MetaTags>
        <meta name="foo" content="bar" />
      </MetaTags>
    )
    const output = (
      <>
        <meta name="foo" content="bar" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('renders props and children', () => {
    const input = (
      <MetaTags title="My Title">
        <meta httpEquiv="refresh" content="30" />
      </MetaTags>
    )
    const output = (
      <>
        <meta name="title" content="My Title" />
        <meta httpEquiv="refresh" content="30" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('renders first-level namespaced props', () => {
    const input = (
      <MetaTags og={{ image: 'http://host.test/image.jpg', type: null }} />
    )
    const output = (
      <>
        <meta property="og:image" content="http://host.test/image.jpg" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('renders multiple first-level namespaced props', () => {
    const input = (
      <MetaTags
        og={{ image: 'http://host.test/image.jpg', type: null }}
        twitter={{ card: 'summary' }}
      />
    )
    const output = (
      <>
        <meta property="og:image" content="http://host.test/image.jpg" />
        <meta property="twitter:card" content="summary" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('renders second-level namespaced props', () => {
    const input = <MetaTags og={{ image: { width: 100 }, type: null }} />
    const output = (
      <>
        <meta property="og:image:width" content="100" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('renders combined first-level and second-level namespaced props', () => {
    const input = (
      <MetaTags
        og={{
          image: 'http://host.test/image.jpg',
          display: { type: 'screen' },
          type: null,
        }}
      />
    )
    const output = (
      <>
        <meta property="og:image" content="http://host.test/image.jpg" />
        <meta property="og:display:type" content="screen" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('renders an array of non-namespaced props', () => {
    const input = <MetaTags title={['Title 1', 'Title 2']} />
    const output = (
      <>
        <meta name="title" content="Title 1" />
        <meta name="title" content="Title 2" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('renders an array of namespaced props', () => {
    const input = (
      <MetaTags
        og={{
          image: ['http://host.test/image1.jpg', 'http://host.test/image2.jpg'],
          type: null,
        }}
      />
    )
    const output = (
      <>
        <meta property="og:image" content="http://host.test/image1.jpg" />
        <meta property="og:image" content="http://host.test/image2.jpg" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('renders a mixture of namespaced array strings and objects', () => {
    const input = (
      <MetaTags
        og={{
          image: [
            'http://host.test/image1.jpg',
            { width: 1024, height: 768 },
            'http://host.test/image2.jpg',
            'http://host.test/image3.jpg',
            { width: 640 },
            { height: 480 },
          ],
          type: null,
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

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('adds an og:title tag if any og key present', () => {
    const input = <MetaTags title="My Title" og={{ type: null }} />
    const output = (
      <>
        <meta name="title" content="My Title" />
        <meta property="og:title" content="My Title" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('does not automatically add og:title if already present', () => {
    const input = (
      <MetaTags title="My Title" og={{ title: 'OG Title', type: null }} />
    )
    const output = (
      <>
        <meta name="title" content="My Title" />
        <meta property="og:title" content="OG Title" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('does not automatically add og:title if set to null', () => {
    const input = <MetaTags title="My Title" og={{ title: null, type: null }} />
    const output = (
      <>
        <meta name="title" content="My Title" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('adds an og:description tag if any og key present', () => {
    const input = <MetaTags description="Lorem ipsum" og={{ type: null }} />
    const output = (
      <>
        <meta name="description" content="Lorem ipsum" />
        <meta property="og:description" content="Lorem ipsum" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('does not automatically add og:description if already present', () => {
    const input = (
      <MetaTags
        description="Lorem ipsum"
        og={{ description: 'Dolar sit amet', type: null }}
      />
    )
    const output = (
      <>
        <meta name="description" content="Lorem ipsum" />
        <meta property="og:description" content="Dolar sit amet" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('does not automatically add og:description if set to null', () => {
    const input = (
      <MetaTags
        description="Lorem ipsum"
        og={{ description: null, type: null }}
      />
    )
    const output = (
      <>
        <meta name="description" content="Lorem ipsum" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('adds an og:type tag if any og key present', () => {
    const input = <MetaTags rel="test" og={{}} />
    const output = (
      <>
        <meta name="rel" content="test" />
        <meta property="og:type" content="website" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('does not automatically add og:type if already present', () => {
    const input = <MetaTags rel="test" og={{ type: 'article' }} />
    const output = (
      <>
        <meta name="rel" content="test" />
        <meta property="og:type" content="article" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })

  it('does not automatically add og:type if set to null', () => {
    const input = (
      <MetaTags
        description="Lorem ipsum"
        og={{ description: null, type: null }}
      />
    )
    const output = (
      <>
        <meta name="description" content="Lorem ipsum" />
      </>
    )

    expect(
      render(input, { container: document.head }).container.innerHTML
    ).toEqual(render(output, { container: document.head }).container.innerHTML)
  })
})
