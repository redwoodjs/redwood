declare module 'react-server-dom-webpack/node-loader'
declare module 'react-server-dom-webpack/server'
declare module 'react-server-dom-webpack/server.node.unbundled'
declare module 'react-server-dom-webpack/client'
declare module 'acorn-loose'

declare module '@redwoodjs/internal/dist/files' {
  export function findRouteHooksSrc(): string[]
}

declare module '@redwoodjs/internal/dist/routes' {
  export function getProjectRoutes(): Array<any>
  export type RouteSpec = any
}

declare module '@redwoodjs/internal/dist/build/web' {
  export async function buildWeb(args: { verbose?: boolean }): any
}

declare module '@redwoodjs/web/dist/components/ServerInject' {
  export function ServerHtmlProvider(): any
  export function createInjector(): any
  export function ServerInjectedHtml(): any
}
