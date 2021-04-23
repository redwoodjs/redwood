import type {
  BeforeResolverInterface,
  RuleValidator,
  ValidatorCollection,
} from './types'

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

type SkipArgs = [RuleValidator | Array<RuleValidator>, RuleOptions?]
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
  befores: Record<string, ValidatorCollection>

  constructor(serviceNames: string[]) {
    this.befores = {}
    serviceNames.forEach((name) => this._initValidators(name))
  }

  apply(
    functions: RuleValidator | Array<RuleValidator>,
    options?: RuleOptions
  ) {
    this._forEachService((name) => {
      if (this._shouldApplyValidator(name, options)) {
        // If currently skippable, reset back to state that lets us add validators
        if (this.befores[name].skippable) {
          this._initValidators(name)
        }

        this.befores[name].validators = [
          ...(<Array<RuleValidator>>this.befores[name].validators), // typecast because it could be bool
          ...[functions].flat(),
        ]
      }
    })
  }

  skip(...args: SkipArgs) {
    const { skipValidators, options, applyToAll } = this._parseSkipArgs(args)

    this._forEachService((name) => {
      const validators = this.befores[name].validators

      if (this._shouldSkipValidator(name, options)) {
        if (skipValidators.length > 0) {
          this.befores[name].validators = validators.filter(
            (func) => !skipValidators.includes(func)
          )
        } else if (applyToAll) {
          this._markServiceSkippable(name)
        }

        // if we just removed every validator then we're technically skipping
        if (this.befores[name].validators.length === 0) {
          this._markServiceSkippable(name)
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

  _shouldApplyValidator(name: string, options?: RuleOptions) {
    return (
      !options ||
      (options?.only && options.only.includes(name)) ||
      (options?.except && !options.except.includes(name))
    )
  }

  _shouldSkipValidator(name: string, options?: RuleOptions) {
    return (
      !options ||
      (options.only && options.only.includes(name)) ||
      (options.except && !options.except.includes(name))
    )
  }

  _parseSkipArgs([functionsOrOptions, opts]: SkipArgs) {
    let skipValidators: Array<RuleValidator | undefined>
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
    functionsOrOptions?: RuleValidator | Array<RuleValidator> | RuleOptions
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

    return validators.map((rule: RuleValidator) => {
      return rule.call(this, name)
    })
  }

  _forEachService(iterator: (serviceName: string) => void) {
    return Object.keys(this.befores).forEach(iterator)
  }
}
