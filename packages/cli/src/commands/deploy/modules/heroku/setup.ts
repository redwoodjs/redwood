import fs from 'fs'
import path from 'path'

import { getPaths } from '../../../../lib'

import type { IHerokuContext } from './interfaces'

export async function copyTemplatesStep(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  fs.copyFileSync(
    path.join(__dirname, 'templates', 'app.json.template'),
    path.join(ctx.appPath?.base || './', 'app.json')
  )
  return ctx
}

export async function createContextStep(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  const paths = getPaths()
  const app = path.basename(paths.base)

  return {
    ...ctx,
    appName: _getInitialAppName(ctx.appName, app),
    appPath: paths,
  }
}

function _getInitialAppName(ctxName = '', fromPath: string) {
  if (ctxName && ctxName.length > 3) {
    return ctxName
  }
  return fromPath
}
