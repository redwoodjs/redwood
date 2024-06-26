// Base class for all job adapters. Provides a common interface for scheduling
// jobs. At a minimum, you must implement the `schedule` method in your adapter.
//
// Any object passed to the constructor is saved in `this.options` and should
// be used to configure your custom adapter. If `options.logger` is included
// you can access it via `this.logger`

import { NotImplementedError } from '../core/errors'

export class BaseAdapter {
  constructor(options) {
    this.options = options
    this.logger = options?.logger
  }

  schedule() {
    throw new NotImplementedError('schedule')
  }

  find() {
    throw new NotImplementedError('find')
  }

  clear() {
    throw new NotImplementedError('clear')
  }

  success() {
    throw new NotImplementedError('success')
  }

  failure() {
    throw new NotImplementedError('failure')
  }

  #log(message, { level = 'info' }) {
    this.logger[level](message)
  }
}
