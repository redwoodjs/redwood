"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.validate = validate;
exports.validateUniqueness = validateUniqueness;
exports.validateWithSync = exports.validateWith = void 0;
require("core-js/modules/es.array.push.js");
var _assign = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/assign"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _isInteger = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/number/is-integer"));
var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/entries"));
var _isArray = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/array/is-array"));
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _client = require("@prisma/client");
var _pascalcase = _interopRequireDefault(require("pascalcase"));
var ValidationErrors = _interopRequireWildcard(require("./errors"));
// Handles validating values in services

// We extend ValidationRecipe to get its method's documentation.
// Adding docs below will completely overwrite ValidationRecipe's.

const VALIDATORS = {
  // Requires that the given value is `null` or `undefined`
  //
  // `allowEmptyString`: if true, counts "" as being absent (does not throw)
  //
  // { absence: true }
  // { absence: { allowEmptyString: true, message: '...' } }
  absence: (value, name, options) => {
    const absenceOptions = {
      allowEmptyString: false
    };
    (0, _assign.default)(absenceOptions, options);
    if (value === '') {
      if (!absenceOptions.allowEmptyString) {
        validationError('absence', name, options);
      }
    } else if (value != null) {
      validationError('absence', name, options);
    }
  },
  // Requires that the given field be `true` and nothing else, unless an array
  // of valid values is included with an `in` option
  //
  // { acceptance: true }
  // { acceptance: { in: ['true','1'], message: '...' } }
  acceptance: (value, name, options) => {
    let acceptedValues;
    if (typeof options === 'object') {
      acceptedValues = options.in || [];
    } else {
      acceptedValues = [true];
    }
    if (!(0, _includes.default)(acceptedValues).call(acceptedValues, value)) {
      validationError('acceptance', name, options);
    }
  },
  // Requires that the given value be formatted like an email address. Uses a
  // very simple regex which checks for at least 1 character that is not an @,
  // then an @, then at least one character that isn't a period, then a period,
  // then any character. There cannot be any spaces present.
  //
  // { email: true }
  // { email: { message: '...' } }
  email: (value, name, options) => {
    const pattern = /^[^@\s]+@[^.\s]+\.[^\s]+$/;
    if (!pattern.test(String(value))) {
      validationError('email', name, options);
    }
  },
  // Requires that the given value NOT be in the list of possible values
  //
  // { exclusion: ['foo', 'bar'] }
  // { exclusion: { in: ['foo','bar'], message: '...' } }
  exclusion: (value, name, options) => {
    const [exclusionList, val] = prepareExclusionInclusion(value, options);
    if ((0, _includes.default)(exclusionList).call(exclusionList, val)) {
      validationError('exclusion', name, options);
    }
  },
  // Requires that the given value match a regular expression
  //
  // { format: /^foobar$/ }
  // { format: { pattern: /^foobar$/, message: '...' } }
  format: (value, name, options) => {
    const pattern = options instanceof RegExp ? options : options.pattern;
    if (pattern == null) {
      throw new ValidationErrors.FormatValidationError(name, 'No pattern for format validation');
    }
    if (!pattern.test(String(value))) {
      validationError('format', name, options);
    }
  },
  // Requires that the given value be in the list of possible values
  //
  // { inclusion: ['foo', 'bar'] }
  // { inclusion: { in: ['foo','bar'], message: '...' } }
  inclusion: (value, name, options) => {
    const [inclusionList, val] = prepareExclusionInclusion(value, options);
    if (!(0, _includes.default)(inclusionList).call(inclusionList, val)) {
      validationError('inclusion', name, options);
    }
  },
  // Requires that the given string be a certain length:
  //
  // `min`: must be at least `min` characters
  // `max`: must be no more than `max` characters
  // `equal`: must be exactly `equal` characters
  // `between`: an array consisting of the `min` and `max` length
  //
  // { length: { min: 4 } }
  // { length: { min: 2, max: 16 } }
  // { length: { between: [2, 16], message: '...' } }
  length: (value, name, options) => {
    const len = String(value).length;
    if (options.min && len < options.min) {
      validationError('minLength', name, options, {
        min: options.min
      });
    }
    if (options.max && len > options.max) {
      validationError('maxLength', name, options, {
        max: options.max
      });
    }
    if (options.equal && len !== options.equal) {
      validationError('equalLength', name, options, {
        equal: options.equal
      });
    }
    if (options.between && (len < options.between[0] || len > options.between[1])) {
      validationError('betweenLength', name, options, {
        min: options.between[0],
        max: options.between[1]
      });
    }
  },
  // Requires that number value meets some criteria:
  //
  // `integer`: value must be an integer
  // `lessThan`: value must be less than `lessThan`
  // `lessThanOrEqual`: value must be less than or equal to `lessThanOrEqual`
  // `greaterThan`: value must be greater than `greaterThan`
  // `greaterThanOrEqual`: value must be greater than or equal to `greaterThanOrEqual`
  // `equal`: value must equal `equal`
  // `otherThan`: value must be anything other than `otherThan`
  // `even`: value must be an even number
  // `odd`: value must be an odd number
  // `positive`: value must be a positive number
  // `negative`: value must be a negative number
  //
  // { numericality: true }
  // { numericality: { integer: true } }
  // { numericality: { greaterThan: 3.5, message: '...' } }
  numericality: (value, name, options) => {
    if (typeof value !== 'number') {
      validationError('typeNumericality', name, options);
    }

    // if there are no options, all we can do is check that value is a number
    if (typeof options === 'boolean') {
      return;
    } else {
      if (options.integer && !(0, _isInteger.default)(value)) {
        validationError('integerNumericality', name, options);
      }
      if (options.lessThan != null && value >= options.lessThan) {
        validationError('lessThanNumericality', name, options, {
          lessThan: options.lessThan
        });
      }
      if (options.lessThanOrEqual != null && value > options.lessThanOrEqual) {
        validationError('lessThanOrEqualNumericality', name, options, {
          lessThanOrEqual: options.lessThanOrEqual
        });
      }
      if (options.greaterThan != null && value <= options.greaterThan) {
        validationError('greaterThanNumericality', name, options, {
          greaterThan: options.greaterThan
        });
      }
      if (options.greaterThanOrEqual != null && value < options.greaterThanOrEqual) {
        validationError('greaterThanOrEqualNumericality', name, options, {
          greaterThanOrEqual: options.greaterThanOrEqual
        });
      }
      if (options.equal != null && value !== options.equal) {
        validationError('equalNumericality', name, options, {
          equal: options.equal
        });
      }
      if (options.otherThan != null && value === options.otherThan) {
        validationError('otherThanNumericality', name, options, {
          otherThan: options.otherThan
        });
      }
      if (options.even && value % 2 !== 0) {
        validationError('evenNumericality', name, options);
      }
      if (options.odd && value % 2 !== 1) {
        validationError('oddNumericality', name, options);
      }
      if (options.positive && value <= 0) {
        validationError('positiveNumericality', name, options);
      }
      if (options.negative && value >= 0) {
        validationError('negativeNumericality', name, options);
      }
    }
  },
  // Requires that the given value is not `null` or `undefined`. By default will
  // consider an empty string to pass
  //
  // `allowEmptyString`: if set to `false` will throw an error if value is ""
  // `allowNull`: if `true` will allow `null`
  // `allowUndefined`: if `true` will allow `undefined`
  //
  // Default behavior is equivalent to:
  //   { allowNull: false, allowUndefined: false, allowEmptyString: true }
  //
  // { presence: true }
  // { presence: { allowEmptyString: false, message: '...' } }
  presence: (value, name, options) => {
    const presenceOptions = {
      allowNull: false,
      allowUndefined: false,
      allowEmptyString: true
    };
    (0, _assign.default)(presenceOptions, options);
    if (!presenceOptions.allowNull && value === null || !presenceOptions.allowUndefined && value === undefined || !presenceOptions.allowEmptyString && value === '') {
      validationError('presence', name, options);
    }
  },
  custom: (_value, name, options) => {
    try {
      options.with();
    } catch (e) {
      const message = options.message || e.message || e;
      validationError('custom', name, {
        message
      });
    }
  }
};

// Turns the keys of an object into a comma-delimited string
//
// { email: 'rob@redwood.com', name: 'Rob' } => 'email, name'
const fieldsToString = fields => {
  const output = [];
  for (const [key, _value] of (0, _entries.default)(fields)) {
    output.push(key);
  }
  return output.join(', ');
};

// Throws the requisite error message for a failed validation
const validationError = (type, name, options, substitutions = {}) => {
  const errorClassName = `${(0, _pascalcase.default)(type)}ValidationError`;
  const ErrorClass = ValidationErrors[errorClassName];
  const errorMessage = typeof options === 'object' ? options.message : undefined;
  throw new ErrorClass(name, errorMessage, substitutions);
};

// Generate the final list and value used for exclusion/inclusion by taking
// case-sensitivity into consideration. The returned array and value then
// can simply be used with Array.includes to perform exclusion/inclusion checks.
const prepareExclusionInclusion = (value, options) => {
  const inputList = (0, _isArray.default)(options) && options || options.in || [];

  // default case sensitivity to true
  const caseSensitive = (0, _isArray.default)(options) ? true : options.caseSensitive ?? true;
  return caseSensitive ? [inputList, value] : [(0, _map.default)(inputList).call(inputList, s => s.toLowerCase()), value.toLowerCase()];
};

// Main validation function, `directives` decides which actual validators
// above to use
//
// validate('firstName', 'Rob', { presence: true, length: { min: 2 } })

function validate(value, labelOrRecipe, recipe) {
  let label, validationRecipe;
  if (typeof labelOrRecipe === 'object') {
    label = '';
    validationRecipe = labelOrRecipe;
  } else {
    label = labelOrRecipe;
    validationRecipe = recipe;
  }
  for (const [validator, options] of (0, _entries.default)(validationRecipe)) {
    if (typeof options === 'undefined') {
      continue;
    }
    VALIDATORS[validator](value, label, options);
  }
}

// Run a custom validation function which should either throw or return nothing.
// Why not just write your own function? Because GraphQL will swallow it and
// just send "Something went wrong" back to the client. This captures any custom
// error you throw and turns it into a ServiceValidationError which will show
// the actual error message.
const validateWithSync = func => {
  try {
    func();
  } catch (e) {
    const message = e.message || e;
    throw new ValidationErrors.ServiceValidationError(message);
  }
};

// Async version is the default
exports.validateWithSync = validateWithSync;
const validateWith = async func => {
  try {
    await func();
  } catch (e) {
    const message = e.message || e;
    throw new ValidationErrors.ServiceValidationError(message);
  }
};

// Wraps `callback` in a transaction to guarantee that `field` is not found in
// the database and that the `callback` is executed before someone else gets a
// chance to create the same value.
//
// In the case of updating an existing record, a uniqueness check will fail
// (because the existing record itself will be returned from the database). In
// this case you can provide a `$self` key with the `where` object to exclude
// the current record.
//
// There is an optional `$scope` key which contains additional the `where`
// clauses to include when checking whether the field is unique. So rather than
// a product name having to be unique across the entire database, you could
// check that it is only unique among a subset of records with the same
// `companyId`.
//
// return validateUniqueness('user', { email: 'rob@redwoodjs.com' }, { message: '...'}, (db) => {
//   return db.create(data: { email })
// })
//
// return validateUniqueness('user', {
//   email: 'rob@redwoodjs.com',
//   $self: { id: 123 }
// }, (db) => {
//   return db.create(data: { email })
// })
//
// return validateUniqueness('user', {
//   email: 'rob@redwoodjs.com',
//   $scope: { companyId: input.companyId }
// }, (db) => {
//   return db.create(data: { email })
// })
//
// const myCustomDb = new PrismaClient({
//   log: emitLogLevels(['info', 'warn', 'error']),
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL,
//     },
//   },
// })
// return validateUniqueness('user', { email: 'rob@redwoodjs.com' }, { prismaClient: myCustomDb}, (db) => {
//   return db.create(data: { email })
// })
exports.validateWith = validateWith;
async function validateUniqueness(model, fields, optionsOrCallback, callback) {
  const {
    $self,
    $scope,
    ...rest
  } = fields;
  let options = {};
  let validCallback;
  let db = null;
  if (typeof optionsOrCallback === 'function') {
    validCallback = optionsOrCallback;
  } else {
    options = optionsOrCallback;
    validCallback = callback;
  }
  if (options.db) {
    const {
      db: customDb,
      ...restOptions
    } = options;
    options = restOptions;
    db = customDb;
  } else {
    db = new _client.PrismaClient();
  }
  const where = {
    AND: [rest],
    NOT: []
  };
  if ($scope) {
    where.AND.push($scope);
  }
  if ($self) {
    where.NOT.push($self);
  }
  return await db.$transaction(async tx => {
    const found = await tx[model].findFirst({
      where
    });
    if (found) {
      validationError('uniqueness', fieldsToString(fields), options);
    }
    return validCallback(tx);
  });
}