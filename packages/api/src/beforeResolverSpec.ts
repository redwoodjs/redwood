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

type BeforeFunctionOptions = {
  // @TODO make only and except mutually exclusive
  only?: string[]
  except?: string[]
}

export const BeforeResolverSpec = class implements BeforeResolverInterface {
  befores: Record<string, BeforeFunctionCollection | false>

  constructor(serviceNames: string[]) {
    this.befores = {}

    for (const name of serviceNames) {
      this._initBefore(name)
    }
  }

  apply(
    functions: RuleFunction | Array<RuleFunction>,
    options?: BeforeFunctionOptions
  ) {
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
    functionsOrOptions?: RuleFunction | Array<RuleFunction>,
    opts?: BeforeFunctionOptions
  ) {
    let functions: RuleFunction | Array<RuleFunction> | 'all'
    let options: BeforeFunctionOptions | undefined
    // covers the case where no functions are passed, which means skip ALL
    if (
      typeof functionsOrOptions === 'undefined' ||
      (typeof functionsOrOptions === 'object' &&
        Object.keys(options).length === 0)
    ) {
      functions = 'all'
      options = <BeforeFunctionOptions>functionsOrOptions
    } else {
      functions = functionsOrOptions
      options = opts
    }

    for (const [name, _list] of Object.entries(this.befores)) {
      if (
        (!options.only && !options.except) ||
        (options.only && options.only.includes(name)) ||
        (options.except && !options.except.includes(name))
      ) {
        if (Array.isArray(functions)) {
          for (const func of this.befores[name]) {
            this.befores[name] = this.befores[name].filter((s) => s !== func)
          }
        } else {
          if (functions === 'all') {
            this.befores[name] = []
          } else {
            this.befores[name] = this.befores[name].filter(
              (s) => s !== functions
            )
          }
        }

        if (this.befores[name].length === 0) {
          this._clearBefore(name)
        }
      }
    }
  }

  verify(name) {
    if (this._canSkipService(name)) {
      return true
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

  // marks a service as having no needed before functions to apply
  _clearBefore(name) {
    this.befores[name] = false
  }

  _canSkipService(name) {
    return this.befores[name] === false
  }

  _noBeforesDefined(name) {
    return this.befores[name].length === 0
  }

  _invokeBefores(name) {
    for (const func of this.befores[name]) {
      func.call(this, name)
    }
    return true
  }
}
