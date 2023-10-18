import { render, screen, waitFor } from '@testing-library/react'

import '@testing-library/jest-dom'
import { MetaTags } from './MetaTags'

describe('MetaTags', () => {
  it('renders nothing if no props or children', () => {
    const meta = <MetaTags />

    const { container } = render(meta)
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(0)
  })

  it('renders non-namespaced props', () => {
    const meta = <MetaTags title="My Title" />

    const { container } = render(meta, { container: document.head })
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(1)
    expect(metaTags[0]).toHaveAttribute('name', 'title')
    expect(metaTags[0]).toHaveAttribute('content', 'My Title')
  })

  it('renders children', () => {
    const meta = (
      <MetaTags>
        <meta name="foo" content="bar" />
      </MetaTags>
    )

    const { container } = render(meta, { container: document.head })
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(1)
    expect(metaTags[0]).toHaveAttribute('name', 'foo')
    expect(metaTags[0]).toHaveAttribute('content', 'bar')
  })

  it('renders props and children', () => {
    const meta = (
      <MetaTags title="My Title">
        <meta httpEquiv="refresh" content="30" />
      </MetaTags>
    )

    const { container } = render(meta, { container: document.head })
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(2)
    expect(metaTags[0]).toHaveAttribute('name', 'title')
    expect(metaTags[0]).toHaveAttribute('content', 'My Title')
    expect(metaTags[1]).toHaveAttribute('http-equiv', 'refresh')
    expect(metaTags[1]).toHaveAttribute('content', '30')
  })

  it('renders first-level namespaced props', () => {
    const meta = <MetaTags og={{ image: 'http://host.test/image.jpg' }} />

    const { container } = render(meta, { container: document.head })
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(1)
    expect(metaTags[0]).toHaveAttribute('property', 'og:image')
    expect(metaTags[0]).toHaveAttribute('content', 'http://host.test/image.jpg')
  })

  it('renders multiple first-level namespaced props', () => {
    const meta = (
      <MetaTags
        og={{ image: 'http://host.test/image.jpg' }}
        twitter={{ card: 'summary' }}
      />
    )

    const { container } = render(meta, { container: document.head })
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(2)
    expect(metaTags[0]).toHaveAttribute('property', 'og:image')
    expect(metaTags[0]).toHaveAttribute('content', 'http://host.test/image.jpg')
    expect(metaTags[1]).toHaveAttribute('property', 'twitter:card')
    expect(metaTags[1]).toHaveAttribute('content', 'summary')
  })

  it('renders second-level namespaced props', () => {
    const meta = <MetaTags og={{ image: { width: 100 } }} />

    const { container } = render(meta, { container: document.head })
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(1)
    expect(metaTags[0]).toHaveAttribute('property', 'og:image:width')
    expect(metaTags[0]).toHaveAttribute('content', '100')
  })

  it('renders combined first-level and second-level namespaced props', () => {
    const meta = (
      <MetaTags
        og={{
          image: 'http://host.test/image.jpg',
          display: { type: 'screen' },
        }}
      />
    )

    const { container } = render(meta, { container: document.head })
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(2)
    expect(metaTags[0]).toHaveAttribute('property', 'og:image')
    expect(metaTags[0]).toHaveAttribute('content', 'http://host.test/image.jpg')
    expect(metaTags[1]).toHaveAttribute('property', 'og:display:type')
    expect(metaTags[1]).toHaveAttribute('content', 'screen')
  })

  it('renders an array of non-namespaced props', () => {
    const meta = <MetaTags title={['Title 1', 'Title 2']} />

    const { container } = render(meta, { container: document.head })
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(2)
    expect(metaTags[0]).toHaveAttribute('name', 'title')
    expect(metaTags[0]).toHaveAttribute('content', 'Title 1')
    expect(metaTags[1]).toHaveAttribute('name', 'title')
    expect(metaTags[1]).toHaveAttribute('content', 'Title 2')
  })

  it('renders an array of namespaced props', () => {
    const meta = (
      <MetaTags
        og={{
          image: ['http://host.test/image1.jpg', 'http://host.test/image2.jpg'],
        }}
      />
    )

    const { container } = render(meta, { container: document.head })
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(2)
    expect(metaTags[0]).toHaveAttribute('property', 'og:image')
    expect(metaTags[0]).toHaveAttribute(
      'content',
      'http://host.test/image1.jpg'
    )
    expect(metaTags[1]).toHaveAttribute('property', 'og:image')
    expect(metaTags[1]).toHaveAttribute(
      'content',
      'http://host.test/image2.jpg'
    )
  })

  it('renders a mixture of namespaced array strings and objects', () => {
    const meta = (
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
        }}
      />
    )

    const { container } = render(meta, { container: document.head })
    const metaTags = container.querySelectorAll('meta')

    expect(metaTags.length).toEqual(7)
    expect(metaTags[0]).toHaveAttribute('property', 'og:image')
    expect(metaTags[0]).toHaveAttribute(
      'content',
      'http://host.test/image1.jpg'
    )
    expect(metaTags[1]).toHaveAttribute('property', 'og:image:width')
    expect(metaTags[1]).toHaveAttribute('content', '1024')
    expect(metaTags[2]).toHaveAttribute('property', 'og:image:height')
    expect(metaTags[2]).toHaveAttribute('content', '768')
    expect(metaTags[3]).toHaveAttribute('property', 'og:image')
    expect(metaTags[3]).toHaveAttribute(
      'content',
      'http://host.test/image2.jpg'
    )
    expect(metaTags[4]).toHaveAttribute('property', 'og:image')
    expect(metaTags[4]).toHaveAttribute(
      'content',
      'http://host.test/image3.jpg'
    )
    expect(metaTags[5]).toHaveAttribute('property', 'og:image:width')
    expect(metaTags[5]).toHaveAttribute('content', '640')
    expect(metaTags[6]).toHaveAttribute('property', 'og:image:height')
    expect(metaTags[6]).toHaveAttribute('content', '480')
  })
})
