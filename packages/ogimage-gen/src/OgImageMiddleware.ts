import path from 'node:path'

import { createElement } from 'react'

import mime from 'mime-types'
import { renderToString } from 'react-dom/server'

import type { RWRouteManifestItem } from '@redwoodjs/internal'
import { getPaths } from '@redwoodjs/project-config'
import { LocationProvider, matchPath } from '@redwoodjs/router'
import type {
  MiddlewareRequest,
  MiddlewareResponse,
  MiddlewareInvokeOptions,
} from '@redwoodjs/vite/dist/middleware'

import { getRoutesList } from './getRoutesList.js'
import { OGIMAGE_DEFAULTS } from './hooks.js'

interface MwOptions {
  App: React.FC
  Document: React.FC
  /**
   * Override the css paths that'll be included
   */
  cssPaths?: string[]
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
  imageProps?: {
    width: number
    height: number
    quality: number
  }

  constructor(options: MwOptions) {
    this.options = options

    this.App = options.App
    this.Document = options.Document
  }

  async invoke(
    req: MiddlewareRequest,
    mwResponse: MiddlewareResponse,
    invokeOptions: MiddlewareInvokeOptions,
  ) {
    const url = new URL(req.url)
    const { pathname } = url
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

    // @TODO
    // I think it doesn't work with jsx paths in my project at the moment
    // Try renaming AboutPage.png.jsx -> AboutPage.png.tsx
    const ogImgFilePath = this.getOgComponentPath(currentRoute, extension)

    const { data, Component } = await this.importComponent(
      ogImgFilePath,
      invokeOptions,
    )

    let dataOut
    if (data && typeof data === 'function') {
      dataOut = await data(mergedParams)
    }

    // @TODO @TODO @TODO @TODO @TODO
    // Should we add playwright as a dependency to ogimage-gen? Or should we make it a peer dependency?
    // Trouble is, even when you have it as a dependency you need to run yarn playwright install
    // before you can use it. So it's not really a "just works" thing.
    // Does this mean when you deploy you need to add a post install script or something?
    const { chromium } = await import('playwright')
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: screenshotOptions.viewport })

    // If the user overrides the cssPaths, use them. Otherwise use the default css list
    // That gets passed from createReactStreamingHandler
    const cssPathsToUse = this.options.cssPaths || invokeOptions.cssPaths || []

    const htmlOutput = renderToString(
      createElement(
        LocationProvider,
        {
          location: url,
        },
        createElement(
          this.Document,
          {
            css: cssPathsToUse,
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
      // This is a very important step! We set the page URL to the origin (root of your website)
      // This allows assets like CSS, Images, etc. to be loaded with just relative paths
      const baseUrl = url.origin

      // @TODO can we use something other than page.goto? Because we just need the url to be set
      // Maybe this is OK, but just slows things down a bit
      await page.goto(baseUrl)

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

  public getOgComponentPath(
    currentRoute: RWRouteManifestItem,
    extension: SUPPORTED_EXT,
  ) {
    if (process.env.NODE_ENV === 'development') {
      return path.join(
        getPaths().web.src,
        currentRoute.relativeFilePath.replace(/\.([jt]sx)/, `.${extension}.$1`),
      )
    } else {
      return `${path.join(
        getPaths().web.distServer,
        'ogImage',
        currentRoute.relativeFilePath.replace(/\.([jt]sx)/, ''),
      )}.${extension}.mjs` // @MARK: Hardcoded mjs!
    }
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

  public async importComponent(
    filePath: string,
    invokeOptions: MiddlewareInvokeOptions,
  ) {
    console.info(filePath)

    try {
      if (invokeOptions.viteDevServer) {
        const { data, output } =
          await invokeOptions.viteDevServer.ssrLoadModule(filePath)
        return { data, Component: output }
      } else {
        const { data, output } = await import(filePath)
        return { data, Component: output }
      }
    } catch (e) {
      console.error(`OG Image component import failed: ${filePath}`)
      console.error(e)
      throw e
    }
  }
}
