import { TagDescriptor } from './components/htmlTags'

export interface RouteHookEvent {
  params: Record<string, string> // this has to be provided from RW router
  headers: Record<string, string | string[] | undefined>
  query: Record<string, string | string[] | undefined>
  cookies: Record<string, string>
}

export type ServerDataHook = (event: RouteHookEvent) => any
export type MetaHook<T = unknown> = (
  event: RouteHookEvent & { serverData: T }
) => Promise<TagDescriptor[] | TagDescriptor> | TagDescriptor[] | TagDescriptor
