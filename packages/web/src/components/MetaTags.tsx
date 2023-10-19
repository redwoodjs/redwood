import React from 'react'

import { Head as HelmetHead } from '../index'

// Ideally we wouldn't include this for non experiment builds
// But.... not worth the effort to remove it from bundle atm
import PortalHead from './PortalHead'

// type RobotsParams =
//   | 'noindex'
//   | 'index'
//   | 'follow'
//   | 'nofollow'
//   | 'none'
//   | 'noarchive'
//   | 'nocache'
//   | 'nosnippet'
// interface MetaTagsProps {
//   /**
//    * @description
//    * og:image by default
//    */
//   tag?: `og:${string}`

//   /**
//    * @description
//    * website by default. See https://ogp.me/#types
//    */
//   ogType?: string
//   ogWidth?: string
//   ogHeight?: string

//   locale?: string

//   /**
//    * @description
//    * Link to image/video to display when unfurled
//    **/
//   ogContentUrl?: string

//   /**
//    * @description
//    * The url to link back to. This must be a canonical (absolute) URL.
//    * Use `ogContentUrl` to set the actual image to be displayed
//    **/
//   ogUrl?: `${'http://' | 'https://'}${string}`
//   contentType?: string

//   /**
//    * @description
//    * String or array of strings to provide crawlers instructions for how to crawl or index web page content.
//    **/
//   robots?: RobotsParams | RobotsParams[]
//   title?: string
//   description?: string
//   author?: string

//   /**
//    * @description
//    * Any additional metatags
//    */
//   children?: React.ReactNode
// }

const propToMetaTag = (
  parentKey: string,
  parentValue: Array<unknown> | Record<string, unknown> | string,
  options: { attr: 'name' | 'property' }
) => {
  if (Array.isArray(parentValue)) {
    // array of attributes
    return parentValue.map((value) => {
      return propToMetaTag(parentKey, value, options)
    })
  } else if (typeof parentValue === 'object') {
    // namespaced attributes, <meta> name attribute changes to 'property'
    return Object.entries(parentValue)
      .filter(([_, v]) => v !== null)
      .map(([key, value]) => {
        return propToMetaTag(`${parentKey}:${key}`, value, { attr: 'property' })
      })
  } else {
    // plain text
    const attributes = { [options['attr']]: parentKey, content: parentValue }
    return <meta {...attributes} />
  }
}

/**
 * Add commonly used <meta> tags for unfurling/seo purposes
 * using the open graph protocol https://ogp.me/
 * @example
 * <MetaTags title="About Page" ogContentUrl="/static/about-og.png"/>
 */
export const MetaTags = (props: Record<string, any>) => {
  const { children, ...metaProps } = props

  let Head: typeof HelmetHead | typeof PortalHead = HelmetHead

  if (process.env.NODE_ENV === 'test' || RWJS_ENV.RWJS_EXP_STREAMING_SSR) {
    Head = PortalHead
  }

  const tags = Object.entries(metaProps)
    .filter(([_, v]) => v !== null)
    .map(([key, value]) => {
      return propToMetaTag(key, value, { attr: 'name' })
    })
    .flat()

  // custom overrides
  if (metaProps.og) {
    // add og:title
    if (metaProps.title && !metaProps.og.title && metaProps.og.title !== null) {
      tags.push(<meta property="og:title" content={metaProps.title} />)
    }

    // add og:description
    if (
      metaProps.description &&
      !metaProps.og.description &&
      metaProps.og.description !== null
    ) {
      tags.push(
        <meta property="og:description" content={metaProps.description} />
      )
    }

    // add og:type
    if (!metaProps.og.type && metaProps.og.type !== null) {
      tags.push(<meta property="og:type" content="website" />)
    }
  }

  return (
    <Head>
      {tags.map((tag, i) => (
        <React.Fragment key={i}>{tag}</React.Fragment>
      ))}
      {children}
    </Head>
  )

  // {locale && (
  //   <Head>
  //     <html lang={locale} />
  //     <meta property="og:locale" content={locale} />
  //   </Head>
  // )}

  // {robots && (
  //   <Head>
  //     <meta
  //       name="robots"
  //       content={Array.isArray(robots) ? robots.join(', ') : robots}
  //     />
  //   </Head>
  // )}
}
