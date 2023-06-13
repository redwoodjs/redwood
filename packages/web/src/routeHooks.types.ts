import { TagDescriptor } from './components/htmlTags'

export type RouteHookOutput = {
  meta: TagDescriptor[]
  serverData: Record<string, any>
}
export interface RouteHookEvent {
  params: Record<string, string> // this has to be provided from RW router
  headers: Record<string, string | string[] | undefined>
  query: Record<string, string | string[] | undefined>
  // cookies: Record<string, string> @TODO pass in parsed cookies
  // @MARK @TODO: this is the previous output, but we call it appRouteHook, we should rename it
  appRouteHook?: RouteHookOutput
}

export type ServerDataHook = (event: RouteHookEvent) => any
export type MetaHook<T = unknown> = (
  event: RouteHookEvent & { serverData: T }
) => Promise<TagDescriptor[] | TagDescriptor> | TagDescriptor[] | TagDescriptor
