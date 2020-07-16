import { getDMMF } from '@prisma/sdk'
// TODO: re-implement a higher quality version of these in ./project
import { getPaths, processPagesDir } from '@redwoodjs/internal/dist/paths'
import { join } from 'path'
import { URL_file } from '../x/URL'
import { BaseNode, Host } from '../ide'
import { lazy, memo } from '../x/decorators'
import {
  followsDirNameConvention,
  isCellFileName,
  isLayoutFileName,
} from '../x/path'
import { RWCell } from './RWCell'
import { RWComponent } from './RWComponent'
import { RWFunction } from './RWFunction'
import { RWLayout } from './RWLayout'
import { RWPage } from './RWPage'
import { RWRouter } from './RWRouter'
import { RWSDL } from './RWSDL'
import { RWService } from './RWService'
import { RWTOML } from './RWTOML'

export interface RWProjectOptions {
  projectRoot: string
  host: Host
}

const allFilesGlob = '/**/*.{js,jsx,ts,tsx}'

/**
 * Represents a Redwood project.
 * This is the root node.
 */
export class RWProject extends BaseNode {
  constructor(public opts: RWProjectOptions) {
    super()
  }
  parent = undefined

  get host() {
    return this.opts.host
  }

  get projectRoot() {
    return this.opts.projectRoot
  }

  @lazy() get id() {
    return URL_file(this.projectRoot)
  }

  children() {
    return [
      this.redwoodTOML,
      ...this.pages,
      this.router,
      ...this.services,
      ...this.sdls,
      ...this.layouts,
      ...this.components,
    ]
  }

  /**
   * Path constants that are relevant to a Redwood project.
   */
  @lazy() get pathHelper() {
    return getPaths(this.projectRoot)
  }
  /**
   * Checks for the presence of a tsconfig.json at the root.
   * TODO: look for this file at the root? or within each side? (api/web)
   */
  @lazy() get isTypeScriptProject(): boolean {
    return this.host.existsSync(join(this.projectRoot, 'tsconfig.json'))
  }
  // TODO: do we move this to a separate node? (ex: RWDatabase)
  @memo() async prismaDMMF() {
    return await getDMMF({
      datamodel: this.host.readFileSync(this.pathHelper.api.dbSchema),
    })
  }
  @memo() async prismaDMMFModelNames() {
    return (await this.prismaDMMF()).datamodel.models.map((m) => m.name)
  }
  @lazy() get redwoodTOML(): RWTOML {
    return new RWTOML(join(this.projectRoot, 'redwood.toml'), this)
  }
  @lazy() private get processPagesDir() {
    return processPagesDir(this.pathHelper.web.pages)
  }
  @lazy() get pages(): RWPage[] {
    return this.processPagesDir.map((p) => new RWPage(p.const, p.path, this))
  }
  @lazy() get router() {
    return new RWRouter(this.pathHelper.web.routes, this)
  }

  // TODO: move to path helper
  servicesFilePath(name: string) {
    // name = blog,posts
    const ext = this.isTypeScriptProject ? '.ts' : '.js'
    return join(this.pathHelper.api.services, name, name + ext)
  }

  // TODO: move to path helper
  @lazy() get defaultNotFoundPageFilePath() {
    const ext = this.isTypeScriptProject ? '.tsx' : '.js' // or jsx?
    return join(this.pathHelper.web.pages, 'NotFoundPage', 'NotFoundPage' + ext)
  }

  @lazy() get services() {
    // TODO: what is the official logic?
    // TODO: Support both `/services/todos/todos.js` AND `/services/todos.js`
    return this.host
      .globSync(this.pathHelper.api.services + allFilesGlob)
      .filter(followsDirNameConvention)
      .map((x) => new RWService(x, this))
  }

  @lazy() get sdls() {
    return this.host
      .globSync(this.pathHelper.api.graphql + '/**/*.sdl.{js,ts}')
      .map((x) => new RWSDL(x, this))
  }

  @lazy() get layouts(): RWLayout[] {
    // TODO: what is the official logic?
    return this.host
      .globSync(this.pathHelper.web.layouts + allFilesGlob)
      .filter(followsDirNameConvention)
      .filter(isLayoutFileName)
      .map((x) => new RWLayout(x, this))
  }

  @lazy() get functions(): RWFunction[] {
    // TODO: what is the official logic?
    return this.host
      .globSync(this.pathHelper.api.functions + allFilesGlob)
      .map((x) => new RWFunction(x, this))
  }

  @lazy() get components(): RWComponent[] {
    return this.host
      .globSync(this.pathHelper.web.components + allFilesGlob)
      .map((file) => {
        if (isCellFileName(file)) {
          const possibleCell = new RWCell(file, this)
          return possibleCell.isCell
            ? possibleCell
            : new RWComponent(file, this)
        }
        return new RWComponent(file, this)
      })
  }

  @lazy() get sides() {
    return ['web', 'api']
  }

  /**
   * A "Cell" is a component that ends in `Cell.{js, jsx, tsx}`, but does not
   * have a default export AND does not export `QUERY`
   **/
  @lazy() get cells(): RWCell[] {
    return this.host
      .globSync(this.pathHelper.web.components + '/**/*Cell.{js,jsx,tsx}')
      .map((file) => new RWCell(file, this))
      .filter((file) => file.isCell)
  }
}
