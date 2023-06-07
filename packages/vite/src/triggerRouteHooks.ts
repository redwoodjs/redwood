/// <reference types="vite/client" />

import { Request } from 'express'

import { MetaHook, ServerDataHook, TagDescriptor } from '@redwoodjs/web'
import type { RouteHookEvent, RouteHookOutput } from '@redwoodjs/web'

interface RouteHooks {
  serverData?: ServerDataHook
  meta?: MetaHook<any>
}

interface TriggerRouteHooksParam {
  routeHooks: RouteHooks
  req: Request
  parsedParams?: Record<string, any>
  appRouteHookOutput?: RouteHookOutput
}

export const triggerRouteHooks = async ({
  routeHooks,
  req,
  parsedParams = {},
  appRouteHookOutput,
}: TriggerRouteHooksParam) => {
  const event: RouteHookEvent = {
    params: parsedParams,
    headers: req.headers || {},
    query: req.query as any, // @TODO we should parse query parameters the same way as RW router
    // cookies: req.cookies || {}, // @TODO we probably need some sort of cookie parser
    appRouteHook: appRouteHookOutput,
  }

  let serverData = {}
  let meta: TagDescriptor[] = []

  try {
    serverData = (await routeHooks?.serverData?.(event)) || {}
  } catch (e: any) {
    throw new Error(`Error in serverData hook: ${e.message}`)
  }

  try {
    const metaRouteHookOutput =
      (await routeHooks?.meta?.({ ...event, serverData })) || []

    // Convert it to an array, if it's not already
    meta = Array.isArray(metaRouteHookOutput)
      ? metaRouteHookOutput
      : [metaRouteHookOutput]
  } catch (e: any) {
    throw new Error(`Error in meta hook: ${e.message}`)
  }

  return {
    serverData,
    meta,
  }
}
