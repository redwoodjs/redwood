// Thrown if resolver function has no explicit `apply()` or `skip()`
// which includes it

export const InsecureServiceError = class extends Error {
  constructor(resolverName: string) {
    super(
      `Service call not authorized. If you really want to allow access, add \`before.skip({ only: ['${resolverName}'] })\` to your beforeResolver()`
    )
    this.name = 'InsecureServiceError'
  }
}

// Thrown if service has no `beforeResolver()` defined
export const MissingBeforeResolver = class extends Error {
  constructor(servicePath: string) {
    super(
      `Must define a \`beforeResolver()\` in ${servicePath.replaceAll(
        '_',
        '/'
      )}`
    )
    this.name = 'MissingBeforeResolver'
  }
}

interface BeforeResolverInterface {
  befores?: Record<string, BeforeFunctionCollection | boolean> // {}
}

type RuleFunction = () => unknown
type BeforeFunctionCollection = Array<RuleFunction>

type RuleOptions =
  | {
      only: string[]
      except: undefined
    }
  | {
      except: string[]
      only: undefined
    }

export const BeforeResolverSpec = class implements BeforeResolverInterface {
  befores: Record<string, BeforeFunctionCollection | false>

  constructor(serviceNames: string[]) {
    this.befores = {}

    for (const name of serviceNames) {
      this._initBefore(name)
    }
  }

  apply(functions: RuleFunction | Array<RuleFunction>, options?: RuleOptions) {
    // @TODO Let's use this.befores.map?

    for (const [name, _list] of Object.entries(this.befores)) {
      if (
        !options ||
        (options?.only && options.only.includes(name)) ||
        (options?.except && !options.except.includes(name))
      ) {
        // if currently false, set to an empty array so we can start adding functions
        if (this.befores[name] === false) {
          this._initBefore(name)
        }

        this.befores[name] = [
          ...(<BeforeFunctionCollection>this.befores[name]), // typecast because it could be bool
          ...[functions].flat(),
        ]
      }
    }
  }

  skip(
    functionsOrOptions?: RuleFunction | Array<RuleFunction> | RuleOptions,
    opts?: RuleOptions
  ) {
    let functionsToSkip: Array<RuleFunction> | undefined
    let options: RuleOptions | undefined

    let applyToAll = false

    // covers the case where no functions are passed, which means skip ALL
    if (this._isOptions(functionsOrOptions)) {
      // Options supplied in first param
      applyToAll = true
      options = functionsOrOptions
    } else {
      // Rule functions supplied in first param (and maybe options in second)
      functionsToSkip = [functionsOrOptions].flat()
      options = opts
    }

    Object.keys(this.befores).forEach((name) => {
      const rulesForFunction = this.befores[name]

      if (
        !options ||
        (options.only && options.only.includes(name)) ||
        (options.except && !options.except.includes(name))
      ) {
        if (Array.isArray(functionsToSkip) && Array.isArray(rulesForFunction)) {
          this.befores[name] = rulesForFunction.filter(
            (func) => !functionsToSkip.includes(func)
          )
        } else if (applyToAll) {
          this.befores[name] = []
        }

        if (this.befores[name].length === 0) {
          this._clearBefore(name)
        }
      }
    })
  }

  verify(name: string) {
    if (this._canSkipService(name)) {
      return []
    } else if (this._noBeforesDefined(name)) {
      throw new InsecureServiceError(name)
    } else {
      return this._invokeBefores(name)
    }
  }

  // initializes a service as having before functions to apply, but none defined yet
  _initBefore(name: string) {
    this.befores[name] = []
  }

  _isOptions(
    functionsOrOptions?: RuleFunction | Array<RuleFunction> | RuleOptions
  ): functionsOrOptions is RuleOptions {
    return (
      typeof functionsOrOptions === 'undefined' ||
      (typeof functionsOrOptions === 'object' &&
        !Array.isArray(functionsOrOptions))
    )
  }

  // marks a service as having no needed before functions to apply
  _clearBefore(name: string) {
    this.befores[name] = false
  }

  _canSkipService(name: string) {
    return this.befores[name] === false
  }

  _noBeforesDefined(name: string) {
    const rulesForName = this.befores[name]

    return Array.isArray(rulesForName) && rulesForName.length === 0
  }

  // returns an array of the result of every before function being run
  _invokeBefores(name: string) {
    const rulesForName = this.befores[name]

    return rulesForName.map((rule: RuleFunction) => {
      return rule.call(this, name)
    })
  }
}
