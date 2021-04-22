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
  befores?: Record<string, BeforeFunctionCollection> // {}
}

type RuleFunction = () => unknown
type BeforeFunctionCollection = {
  validators: Array<RuleFunction>
  skippable: boolean
}

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
  befores: Record<string, BeforeFunctionCollection>

  constructor(serviceNames: string[]) {
    this.befores = {}
    serviceNames.forEach((name) => this._initValidators(name))
  }

  apply(functions: RuleFunction | Array<RuleFunction>, options?: RuleOptions) {
    this._forEachService((serviceName) => {
      if (this._shouldApplyValidator(serviceName, options)) {
        // If currently skippable, reset back to state that lets us add validators
        if (this.befores[serviceName].skippable) {
          this._initValidators(serviceName)
        }

        this.befores[serviceName].validators = [
          ...(<Array<RuleFunction>>this.befores[serviceName].validators), // typecast because it could be bool
          ...[functions].flat(),
        ]
      }
    })
  }

  skip(...args: Array<RuleFunction | Array<RuleFunction> | RuleOptions>) {
    const { skipValidators, options, applyToAll } = this._skipArgs(args)

    this._forEachService((serviceName) => {
      const validators = this.befores[serviceName].validators

      if (this._shouldSkipValidator(serviceName, options)) {
        if (skipValidators.length > 0) {
          this.befores[serviceName].validators = validators.filter(
            (func) => !skipValidators.includes(func)
          )
        } else if (applyToAll) {
          this._markServiceSkippable(serviceName)
        }

        // if we just removed every validator then we're technically skipping
        if (this.befores[serviceName].validators.length === 0) {
          this._markServiceSkippable(serviceName)
        }
      }
    })
  }

  verify(name: string) {
    if (this._canSkipService(name)) {
      return []
    } else if (this._isInsecureService(name)) {
      throw new InsecureServiceError(name)
    } else {
      return this._invokeValidators(name)
    }
  }

  // Initializes a service as having validators to apply, but none
  // defined yet, and definitely not skippable
  _initValidators(name: string) {
    this.befores[name] = { validators: [], skippable: false }
  }

  _shouldApplyValidator(name: string, options: RuleOptions) {
    return (
      !options ||
      (options?.only && options.only.includes(name)) ||
      (options?.except && !options.except.includes(name))
    )
  }

  _shouldSkipValidator(name: string, options: RuleOptions) {
    return (
      !options ||
      (options.only && options.only.includes(name)) ||
      (options.except && !options.except.includes(name))
    )
  }

  _skipArgs(args) {
    const [functionsOrOptions, opts] = args

    let skipValidators: Array<RuleFunction | undefined>
    let options: RuleOptions | undefined
    let applyToAll = false

    // covers the case where no functions are passed, which means skip ALL
    if (this._isOptions(functionsOrOptions)) {
      // Options supplied in first param
      applyToAll = true
      skipValidators = []
      options = functionsOrOptions
    } else {
      // Rule functions supplied in first param (and maybe options in second)
      skipValidators = [functionsOrOptions].flat()
      options = opts
    }

    return { skipValidators, options, applyToAll }
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
  _markServiceSkippable(name: string) {
    this.befores[name].validators = []
    this.befores[name].skippable = true
  }

  _canSkipService(name: string) {
    return this.befores[name].skippable === true
  }

  _isInsecureService(name: string) {
    const rules = this.befores[name]
    return rules.validators.length === 0 && !rules.skippable
  }

  // Returns an array of the results of every validation function being run.
  // We don't do anything with this list currently, but maybe we can pass it
  // through to the service at some point so the user can do something with it?
  _invokeValidators(name: string) {
    const validators = this.befores[name].validators

    return validators.map((rule: RuleFunction) => {
      return rule.call(this, name)
    })
  }

  _forEachService(iterator: () => unknown) {
    return Object.keys(this.befores).forEach(iterator)
  }
}
