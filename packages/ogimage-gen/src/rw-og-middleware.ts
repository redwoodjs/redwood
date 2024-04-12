import path from 'node:path'

import { createElement } from 'react'

import mime from 'mime-types'
import { renderToString } from 'react-dom/server'

import type { RWRouteManifestItem } from '@redwoodjs/internal'
import { getPaths } from '@redwoodjs/project-config'
import { LocationProvider, matchPath } from '@redwoodjs/router'
// @TODO HELP ESM-CJS ISSUE HERE >>>
// We have to set tsconfig.moduleResolution >= "Node16", but if we do that project-config imports have an error
import type { MiddlewareRequest } from '@redwoodjs/vite/dist/middleware'
import type { MiddlewareResponse } from '@redwoodjs/vite/dist/middleware'

import { getRoutesList } from './getRoutesList.js'
import { OGIMAGE_DEFAULTS } from './hooks'

interface MwOptions {
  App: React.FC
  Document: React.FC
  cssPaths: string[]
}

const supportedExtensions = ['jpg', 'png']

type SUPPORTED_EXT = (typeof supportedExtensions)[number]

interface ScreenshotOptions {
  viewport: {
    width: number
    height: number
  }
  format: {
    [key in SUPPORTED_EXT]: {
      type: string
      quality?: number
    }
  }
}

interface ComponentElementProps {
  Component: React.FC<{ data: unknown }>
  data: unknown
  routeParams: Record<string, unknown>
  debug: boolean
}

export default class OgImageMiddleware {
  options: MwOptions
  App: React.FC
  Document: React.FC<{ css: string[]; meta: string[] }>

  // Initialized in invoke() 👇
  route?: RWRouteManifestItem
  url?: URL
  imageProps?: {
    width: number
    height: number
    quality: number
  }

  constructor(options: MwOptions) {
    // this.req = req
    this.options = options
    // this.url = new URL(req.url)

    this.App = options.App
    this.Document = options.Document
  }

  async invoke(req: MiddlewareRequest, mwResponse: MiddlewareResponse) {
    const url = new URL(req.url)
    const { pathname, origin } = url
    const routes = await getRoutesList()

    let currentRoute: RWRouteManifestItem | undefined = undefined
    let parsedParams: {
      params?: Record<string, unknown>
    } = {}

    // Skip processing if not a file request
    if (!pathname.includes('.')) {
      return mwResponse
    }

    // Remove the extension for the match
    const [routePathname, extension] = pathname.split('.')

    // @TODO can we make this a function and share it with `createStreamingHandler`?
    // We could potentially memoize it too
    for (const route of routes) {
      const { match, ...rest } = matchPath(route.pathDefinition, routePathname)
      if (match) {
        currentRoute = route
        parsedParams = rest
        break
      }
    }

    // If no match with the router, or not a supported extension bail
    if (!currentRoute || !supportedExtensions.includes(extension)) {
      return mwResponse
    }

    // Combine search params and params from route pattern
    // /user/{id:Int} => /user/1?background=red => { id: 1, background: 'red'}
    const mergedParams = {
      ...Object.fromEntries(url.searchParams.entries()),
      ...(parsedParams.params || {}),
    }

    this.imageProps = {
      width: mergedParams.width
        ? parseInt(mergedParams.width as string)
        : OGIMAGE_DEFAULTS.width,
      height: mergedParams.height
        ? parseInt(mergedParams.height as string)
        : OGIMAGE_DEFAULTS.height,
      quality: mergedParams.quality
        ? parseInt(mergedParams.quality as string)
        : OGIMAGE_DEFAULTS.quality,
    }

    const debug = !!mergedParams.debug

    const screenshotOptions: ScreenshotOptions = {
      viewport: {
        width: this.imageProps.width,
        height: this.imageProps.height,
      },
      format: {
        png: { type: 'png' },
        jpg: {
          type: 'jpeg',
          quality: this.imageProps.quality,
        },
      },
    }

    const { chromium } = await import('playwright')
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: screenshotOptions.viewport })

    // Bail if the relativeFilePath is unknown. Not sure how this could happen
    // if (!currentRoute.relativeFilePath) {
    //   console.error('og-middleware: No relativeFilePath found in route')
    //   return mwResponse
    // }

    const ogImgFilePath = path.join(
      getPaths().web.src,
      currentRoute.relativeFilePath.replace(/\.([jt]sx)/, `.${extension}.$1`),
    )

    const { data, Component } = await this.importComponent(ogImgFilePath)

    const dataOut = await data(mergedParams)

    const htmlOutput = renderToString(
      createElement(
        LocationProvider,
        {
          location: this.url,
        },
        createElement(
          this.Document,
          {
            css: this.options.cssPaths.map((file) => `${origin}${file}`),
            meta: [],
          },
          createElement(
            this.App,
            {},
            this.componentElements({
              Component,
              data: dataOut,
              routeParams: mergedParams,
              debug,
            }),
          ),
        ),
      ),
    )

    if (debug) {
      mwResponse.headers.append('Content-Type', 'text/html')
      mwResponse.body = htmlOutput
    } else {
      await page.setContent(htmlOutput)
      const image = await page.screenshot(
        // @TODO TYPESCRIPT 😡
        screenshotOptions.format[extension as SUPPORTED_EXT] as any,
      )
      await browser.close()

      mwResponse.headers.append(
        'Content-Type',
        // as string, because the lookup is guaranteed in this case
        mime.lookup(extension) as string,
      )

      mwResponse.body = image
    }

    return mwResponse
  }

  get debugElement() {
    return createElement(
      'div',
      {
        style: {
          position: 'absolute',
          top: '0',
          left: '0',
          border: '1px dashed red',
          pointerEvents: 'none',
          width: this.imageProps?.width,
          height: this.imageProps?.height,
        },
      },
      createElement(
        'div',
        {
          style: {
            position: 'absolute',
            left: '0',
            right: '0',
            bottom: '-1.5rem',
            textAlign: 'center',
            color: 'red',
            fontWeight: 'normal',
          },
        },
        `${this.imageProps?.width} x ${this.imageProps?.height}`,
      ),
    )
  }

  componentElements({
    Component,
    data,
    routeParams,
    debug,
  }: ComponentElementProps) {
    const element = createElement(Component, {
      data,
      ...routeParams,
    })

    if (debug) {
      return [
        createElement(
          'div',
          {
            style: { width: this.imageProps?.width },
          },
          element,
        ),
        this.debugElement,
      ]
    } else {
      return element
    }
  }

  async importComponent(filePath: string) {
    console.info(filePath)

    try {
      const { data, output } = await import(
        /* @vite-ignore */
        filePath
      )
      return { data, Component: output }
    } catch (e) {
      console.error(`OG Image component import failed: ${filePath}`)
      console.error(e)
      throw e
    }
  }
}
