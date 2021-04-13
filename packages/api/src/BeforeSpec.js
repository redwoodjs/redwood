const BeforeSpec = class {
  constructor(serviceNames) {
    this.befores = {}

    for (const name of serviceNames) {
      this._initBefore(name)
    }
  }

  run(functions, options = {}) {
    for (let [name, _list] of Object.entries(this.befores)) {
      if (
        (!options.only && !options.except) ||
        (options.only && options.only.includes(name)) ||
        (options.except && !options.except.includes(name))
      ) {
        // if currently false, set to an empty array so we can start adding functions
        if (this.befores[name] === false) {
          this._initBefore(name)
        }

        if (Array.isArray(functions)) {
          this.befores[name] = this.befores[name].concat(functions)
        } else {
          this.befores[name].push(functions)
        }
      }
    }
  }

  skip(functions, options = {}) {
    // covers the case where no functions are passed, which means skip ALL
    if (
      typeof functions === 'undefined' ||
      (typeof functions === 'object' && Object.keys(options).length === 0)
    ) {
      options = functions || {}
      functions = 'all'
    }

    for (let [name, _list] of Object.entries(this.befores)) {
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
      throw new Error(
        `Service call not authorized. If you really want to allow access, try before.skip({ only: ['${name}'] })`
      )
    } else {
      return this._invokeBefores(name)
    }
  }

  // initializes a service as having before functions to run, but none defined yet
  _initBefore(name) {
    this.befores[name] = []
  }

  // marks a service as having no needed before functions to run
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

module.exports = BeforeSpec
