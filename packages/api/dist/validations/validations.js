"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var validations_exports = {};
__export(validations_exports, {
  validate: () => validate,
  validateUniqueness: () => validateUniqueness,
  validateWith: () => validateWith,
  validateWithSync: () => validateWithSync
});
module.exports = __toCommonJS(validations_exports);
var import_client = require("@prisma/client");
var import_pascalcase = __toESM(require("pascalcase"));
var ValidationErrors = __toESM(require("./errors"));
const VALIDATORS = {
  // Requires that the given value is `null` or `undefined`
  //
  // `allowEmptyString`: if true, counts "" as being absent (does not throw)
  //
  // { absence: true }
  // { absence: { allowEmptyString: true, message: '...' } }
  absence: (value, name, options) => {
    const absenceOptions = { allowEmptyString: false };
    Object.assign(absenceOptions, options);
    if (value === "") {
      if (!absenceOptions.allowEmptyString) {
        validationError("absence", name, options);
      }
    } else if (value != null) {
      validationError("absence", name, options);
    }
  },
  // Requires that the given field be `true` and nothing else, unless an array
  // of valid values is included with an `in` option
  //
  // { acceptance: true }
  // { acceptance: { in: ['true','1'], message: '...' } }
  acceptance: (value, name, options) => {
    let acceptedValues;
    if (typeof options === "object") {
      acceptedValues = options.in || [];
    } else {
      acceptedValues = [true];
    }
    if (!acceptedValues.includes(value)) {
      validationError("acceptance", name, options);
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
      validationError("email", name, options);
    }
  },
  // Requires that the given value NOT be in the list of possible values
  //
  // { exclusion: ['foo', 'bar'] }
  // { exclusion: { in: ['foo','bar'], message: '...' } }
  exclusion: (value, name, options) => {
    const [exclusionList, val] = prepareExclusionInclusion(value, options);
    if (exclusionList.includes(val)) {
      validationError("exclusion", name, options);
    }
  },
  // Requires that the given value match a regular expression
  //
  // { format: /^foobar$/ }
  // { format: { pattern: /^foobar$/, message: '...' } }
  format: (value, name, options) => {
    const pattern = options instanceof RegExp ? options : options.pattern;
    if (pattern == null) {
      throw new ValidationErrors.FormatValidationError(
        name,
        "No pattern for format validation"
      );
    }
    if (!pattern.test(String(value))) {
      validationError("format", name, options);
    }
  },
  // Requires that the given value be in the list of possible values
  //
  // { inclusion: ['foo', 'bar'] }
  // { inclusion: { in: ['foo','bar'], message: '...' } }
  inclusion: (value, name, options) => {
    const [inclusionList, val] = prepareExclusionInclusion(value, options);
    if (!inclusionList.includes(val)) {
      validationError("inclusion", name, options);
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
      validationError("minLength", name, options, { min: options.min });
    }
    if (options.max && len > options.max) {
      validationError("maxLength", name, options, { max: options.max });
    }
    if (options.equal && len !== options.equal) {
      validationError("equalLength", name, options, { equal: options.equal });
    }
    if (options.between && (len < options.between[0] || len > options.between[1])) {
      validationError("betweenLength", name, options, {
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
    if (typeof value !== "number") {
      validationError("typeNumericality", name, options);
    }
    if (typeof options === "boolean") {
      return;
    } else {
      if (options.integer && !Number.isInteger(value)) {
        validationError("integerNumericality", name, options);
      }
      if (options.lessThan != null && value >= options.lessThan) {
        validationError("lessThanNumericality", name, options, {
          lessThan: options.lessThan
        });
      }
      if (options.lessThanOrEqual != null && value > options.lessThanOrEqual) {
        validationError("lessThanOrEqualNumericality", name, options, {
          lessThanOrEqual: options.lessThanOrEqual
        });
      }
      if (options.greaterThan != null && value <= options.greaterThan) {
        validationError("greaterThanNumericality", name, options, {
          greaterThan: options.greaterThan
        });
      }
      if (options.greaterThanOrEqual != null && value < options.greaterThanOrEqual) {
        validationError("greaterThanOrEqualNumericality", name, options, {
          greaterThanOrEqual: options.greaterThanOrEqual
        });
      }
      if (options.equal != null && value !== options.equal) {
        validationError("equalNumericality", name, options, {
          equal: options.equal
        });
      }
      if (options.otherThan != null && value === options.otherThan) {
        validationError("otherThanNumericality", name, options, {
          otherThan: options.otherThan
        });
      }
      if (options.even && value % 2 !== 0) {
        validationError("evenNumericality", name, options);
      }
      if (options.odd && value % 2 !== 1) {
        validationError("oddNumericality", name, options);
      }
      if (options.positive && value <= 0) {
        validationError("positiveNumericality", name, options);
      }
      if (options.negative && value >= 0) {
        validationError("negativeNumericality", name, options);
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
    Object.assign(presenceOptions, options);
    if (!presenceOptions.allowNull && value === null || !presenceOptions.allowUndefined && value === void 0 || !presenceOptions.allowEmptyString && value === "") {
      validationError("presence", name, options);
    }
  },
  custom: (_value, name, options) => {
    try {
      options.with();
    } catch (e) {
      const message = options.message || e.message || e;
      validationError("custom", name, { message });
    }
  }
};
const fieldsToString = (fields) => {
  const output = [];
  for (const [key, _value] of Object.entries(fields)) {
    output.push(key);
  }
  return output.join(", ");
};
const validationError = (type, name, options, substitutions = {}) => {
  const errorClassName = `${(0, import_pascalcase.default)(
    type
  )}ValidationError`;
  const ErrorClass = ValidationErrors[errorClassName];
  const errorMessage = typeof options === "object" ? options.message : void 0;
  throw new ErrorClass(name, errorMessage, substitutions);
};
const prepareExclusionInclusion = (value, options) => {
  const inputList = Array.isArray(options) && options || options.in || [];
  const caseSensitive = Array.isArray(options) ? true : options.caseSensitive ?? true;
  return caseSensitive ? [inputList, value] : [
    inputList.map((s) => s.toLowerCase()),
    value.toLowerCase()
  ];
};
function validate(value, labelOrRecipe, recipe) {
  let label, validationRecipe;
  if (typeof labelOrRecipe === "object") {
    label = "";
    validationRecipe = labelOrRecipe;
  } else {
    label = labelOrRecipe;
    validationRecipe = recipe;
  }
  for (const [validator, options] of Object.entries(validationRecipe)) {
    if (typeof options === "undefined") {
      continue;
    }
    VALIDATORS[validator](value, label, options);
  }
}
const validateWithSync = (func) => {
  try {
    func();
  } catch (e) {
    const message = e.message || e;
    throw new ValidationErrors.ServiceValidationError(message);
  }
};
const validateWith = async (func) => {
  try {
    await func();
  } catch (e) {
    const message = e.message || e;
    throw new ValidationErrors.ServiceValidationError(message);
  }
};
async function validateUniqueness(model, fields, optionsOrCallback, callback) {
  const { $self, $scope, ...rest } = fields;
  let options = {};
  let validCallback;
  let db = null;
  if (typeof optionsOrCallback === "function") {
    validCallback = optionsOrCallback;
  } else {
    options = optionsOrCallback;
    validCallback = callback;
  }
  if (options.db) {
    const { db: customDb, ...restOptions } = options;
    options = restOptions;
    db = customDb;
  } else {
    db = new import_client.PrismaClient();
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
  return await db.$transaction(async (tx) => {
    const found = await tx[model].findFirst({ where });
    if (found) {
      validationError("uniqueness", fieldsToString(fields), options);
    }
    return validCallback(tx);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  validate,
  validateUniqueness,
  validateWith,
  validateWithSync
});
