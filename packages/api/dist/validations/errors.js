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
var errors_exports = {};
__export(errors_exports, {
  AbsenceValidationError: () => AbsenceValidationError,
  AcceptanceValidationError: () => AcceptanceValidationError,
  BetweenLengthValidationError: () => BetweenLengthValidationError,
  CustomValidationError: () => CustomValidationError,
  EmailValidationError: () => EmailValidationError,
  EqualLengthValidationError: () => EqualLengthValidationError,
  EqualNumericalityValidationError: () => EqualNumericalityValidationError,
  EvenNumericalityValidationError: () => EvenNumericalityValidationError,
  ExclusionValidationError: () => ExclusionValidationError,
  FormatValidationError: () => FormatValidationError,
  GreaterThanNumericalityValidationError: () => GreaterThanNumericalityValidationError,
  GreaterThanOrEqualNumericalityValidationError: () => GreaterThanOrEqualNumericalityValidationError,
  InclusionValidationError: () => InclusionValidationError,
  IntegerNumericalityValidationError: () => IntegerNumericalityValidationError,
  LessThanNumericalityValidationError: () => LessThanNumericalityValidationError,
  LessThanOrEqualNumericalityValidationError: () => LessThanOrEqualNumericalityValidationError,
  MaxLengthValidationError: () => MaxLengthValidationError,
  MinLengthValidationError: () => MinLengthValidationError,
  NegativeNumericalityValidationError: () => NegativeNumericalityValidationError,
  OddNumericalityValidationError: () => OddNumericalityValidationError,
  OtherThanNumericalityValidationError: () => OtherThanNumericalityValidationError,
  PositiveNumericalityValidationError: () => PositiveNumericalityValidationError,
  PresenceValidationError: () => PresenceValidationError,
  ServiceValidationError: () => ServiceValidationError,
  TypeNumericalityValidationError: () => TypeNumericalityValidationError,
  UniquenessValidationError: () => UniquenessValidationError
});
module.exports = __toCommonJS(errors_exports);
var import_humanize_string = __toESM(require("humanize-string"));
var import_title_case = require("title-case");
var import_errors = require("../errors");
class ServiceValidationError extends import_errors.RedwoodError {
  constructor(message, substitutions = {}) {
    let errorMessage = message;
    let extensions = {};
    for (const [key, value] of Object.entries(substitutions)) {
      errorMessage = errorMessage.replaceAll(
        `\${${key}}`,
        (0, import_title_case.titleCase)((0, import_humanize_string.default)(String(value)))
      );
      extensions = {
        code: "BAD_USER_INPUT",
        properties: {
          messages: {
            [String(value)]: [errorMessage]
          }
        }
      };
    }
    super(errorMessage, extensions);
    this.name = "ServiceValidationError";
    Object.setPrototypeOf(this, ServiceValidationError.prototype);
  }
}
class AbsenceValidationError extends ServiceValidationError {
  constructor(name, message = "${name} is not absent", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "AbsenceValidationError";
    Object.setPrototypeOf(this, AbsenceValidationError.prototype);
  }
}
class AcceptanceValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be accepted", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "AcceptanceValidationError";
    Object.setPrototypeOf(this, AcceptanceValidationError.prototype);
  }
}
class EmailValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be formatted like an email address", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "EmailValidationError";
    Object.setPrototypeOf(this, EmailValidationError.prototype);
  }
}
class ExclusionValidationError extends ServiceValidationError {
  constructor(name, message = "${name} is reserved", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "ExclusionValidationError";
    Object.setPrototypeOf(this, ExclusionValidationError.prototype);
  }
}
class FormatValidationError extends ServiceValidationError {
  constructor(name, message = "${name} is not formatted correctly", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "FormatValidationError";
    Object.setPrototypeOf(this, FormatValidationError.prototype);
  }
}
class InclusionValidationError extends ServiceValidationError {
  constructor(name, message = "${name} is reserved", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "InclusionValidationError";
    Object.setPrototypeOf(this, InclusionValidationError.prototype);
  }
}
class MinLengthValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must have at least ${min} characters", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "MinLengthValidationError";
    Object.setPrototypeOf(this, MinLengthValidationError.prototype);
  }
}
class MaxLengthValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must have no more than ${max} characters", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "MaxLengthValidationError";
    Object.setPrototypeOf(this, MaxLengthValidationError.prototype);
  }
}
class EqualLengthValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must have exactly ${equal} characters", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "EqualLengthValidationError";
    Object.setPrototypeOf(this, EqualLengthValidationError.prototype);
  }
}
class BetweenLengthValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be between ${min} and ${max} characters", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "BetweenLengthValidationError";
    Object.setPrototypeOf(this, BetweenLengthValidationError.prototype);
  }
}
class PresenceValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be present", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "PresenceValidationError";
    Object.setPrototypeOf(this, PresenceValidationError.prototype);
  }
}
class TypeNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must by a number", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "TypeNumericalityValidationError";
    Object.setPrototypeOf(this, TypeNumericalityValidationError.prototype);
  }
}
class IntegerNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be an integer", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "IntegerNumericalityValidationError";
    Object.setPrototypeOf(this, IntegerNumericalityValidationError.prototype);
  }
}
class LessThanNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be less than ${lessThan}", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "LessThanNumericalityValidationError";
    Object.setPrototypeOf(this, LessThanNumericalityValidationError.prototype);
  }
}
class LessThanOrEqualNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be less than or equal to ${lessThanOrEqual}", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "LessThanOrEqualNumericalityValidationError";
    Object.setPrototypeOf(
      this,
      LessThanOrEqualNumericalityValidationError.prototype
    );
  }
}
class GreaterThanNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be greater than ${greaterThan}", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "GreaterThanNumericalityValidationError";
    Object.setPrototypeOf(
      this,
      GreaterThanNumericalityValidationError.prototype
    );
  }
}
class GreaterThanOrEqualNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be greater than or equal to ${greaterThanOrEqual}", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "GreaterThanOrEqualNumericalityValidationError";
    Object.setPrototypeOf(
      this,
      GreaterThanOrEqualNumericalityValidationError.prototype
    );
  }
}
class EqualNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must equal ${equal}", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "EqualNumericalityValidationError";
    Object.setPrototypeOf(this, EqualNumericalityValidationError.prototype);
  }
}
class OtherThanNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must not equal ${otherThan}", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "OtherThanNumericalityValidationError";
    Object.setPrototypeOf(this, OtherThanNumericalityValidationError.prototype);
  }
}
class EvenNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be even", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "EvenNumericalityValidationError";
    Object.setPrototypeOf(this, EvenNumericalityValidationError.prototype);
  }
}
class OddNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be odd", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "OddNumericalityValidationError";
    Object.setPrototypeOf(this, OddNumericalityValidationError.prototype);
  }
}
class PositiveNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be positive", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "PositiveNumericalityValidationError";
    Object.setPrototypeOf(this, PositiveNumericalityValidationError.prototype);
  }
}
class NegativeNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = "${name} must be negative", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "NegativeNumericalityValidationError";
    Object.setPrototypeOf(this, NegativeNumericalityValidationError.prototype);
  }
}
class CustomValidationError extends ServiceValidationError {
  constructor(name, message = "", substitutions = {}) {
    super(message, Object.assign(substitutions, { name }));
    this.name = "CustomValidationError";
    Object.setPrototypeOf(this, CustomValidationError.prototype);
  }
}
class UniquenessValidationError extends ServiceValidationError {
  constructor(name, message, substitutions = {}) {
    const errorMessage = message ? message : `${name} must be unique`;
    super(errorMessage, Object.assign(substitutions, { name }));
    this.name = "UniquenessValidationError";
    Object.setPrototypeOf(this, UniquenessValidationError.prototype);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AbsenceValidationError,
  AcceptanceValidationError,
  BetweenLengthValidationError,
  CustomValidationError,
  EmailValidationError,
  EqualLengthValidationError,
  EqualNumericalityValidationError,
  EvenNumericalityValidationError,
  ExclusionValidationError,
  FormatValidationError,
  GreaterThanNumericalityValidationError,
  GreaterThanOrEqualNumericalityValidationError,
  InclusionValidationError,
  IntegerNumericalityValidationError,
  LessThanNumericalityValidationError,
  LessThanOrEqualNumericalityValidationError,
  MaxLengthValidationError,
  MinLengthValidationError,
  NegativeNumericalityValidationError,
  OddNumericalityValidationError,
  OtherThanNumericalityValidationError,
  PositiveNumericalityValidationError,
  PresenceValidationError,
  ServiceValidationError,
  TypeNumericalityValidationError,
  UniquenessValidationError
});
