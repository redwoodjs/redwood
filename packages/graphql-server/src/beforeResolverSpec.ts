import type {
  RuleValidator,
  ValidatorCollection,
  BeforeResolverSpecType,
  RuleOptions,
  SkipArgs,
} from './types'

// Thrown if resolver function has no explicit `apply()` or `skip()`
// which includes it

export const InsecureServiceError = class extends Error {
  constructor(resolverName: string) {
    super(
      `Service call not authorized. If you really want to allow access, add \`rules.skip({ only: ['${resolverName}'] })\` to your beforeResolver()`
    )
    this.name = 'InsecureServiceError'
  }
}

export const BeforeResolverSpec = class implements BeforeResolverSpecType {
  befores: Record<string, ValidatorCollection>

  constructor(serviceNames: string[]) {
    this.befores = {}
    serviceNames.forEach((name) => this._initValidators(name))
  }

  public add(
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

  public skip(...args: SkipArgs) {
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

  public async verify(name: string, args: Array<unknown>) {
    if (this._canSkipService(name)) {
      return []
    } else if (this._isInsecureService(name)) {
      throw new InsecureServiceError(name)
    } else {
      return await this._invokeValidators(name, args)
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
  async _invokeValidators(name: string, args: Array<unknown>) {
    const validators = this.befores[name].validators
    const results = []

    for (const rule of validators) {
      results.push(await rule.apply(this, [name, ...[args].flat()]))
    }

    return results
  }

  _forEachService(iterator: (serviceName: string) => void) {
    return Object.keys(this.befores).forEach(iterator)
  }
}
