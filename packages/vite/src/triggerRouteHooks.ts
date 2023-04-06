/// <reference types="vite/client" />

import { Request } from 'express'

import { TagDescriptor } from '@redwoodjs/web'

interface RouteHookEvent {
  params: Record<string, string> // this has to be provided from RW router
  headers: Record<string, string | string[] | undefined>
  query: Record<string, string | string[] | undefined>
  cookies: Record<string, string>
}

interface RouteHooks {
  serverData?: (event: RouteHookEvent) => any
  meta?: (event: RouteHookEvent & { serverData: any }) => TagDescriptor[]
}

export const triggerRouteHooks = async (
  routeHooks: RouteHooks,
  req: Request
) => {
  const event: RouteHookEvent = {
    params: {}, // @TODO
    headers: req.headers || {},
    query: req.query as any, // @TODO we should parse query parameters the same way as RW router
    cookies: req.cookies || {},
  }

  let serverData = {}
  let meta: TagDescriptor[] = []

  try {
    serverData = (await routeHooks?.serverData?.(event)) || {}
  } catch (e: any) {
    throw new Error(`Error in serverData hook: ${e.message}`)
  }

  try {
    meta = (await routeHooks?.meta?.({ ...event, serverData })) || []
  } catch (e: any) {
    throw new Error(`Error in meta hook: ${e.message}`)
  }

  return {
    serverData,
    meta,
  }
}
