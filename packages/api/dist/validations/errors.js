"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.UniquenessValidationError = exports.TypeNumericalityValidationError = exports.ServiceValidationError = exports.PresenceValidationError = exports.PositiveNumericalityValidationError = exports.OtherThanNumericalityValidationError = exports.OddNumericalityValidationError = exports.NegativeNumericalityValidationError = exports.MinLengthValidationError = exports.MaxLengthValidationError = exports.LessThanOrEqualNumericalityValidationError = exports.LessThanNumericalityValidationError = exports.IntegerNumericalityValidationError = exports.InclusionValidationError = exports.GreaterThanOrEqualNumericalityValidationError = exports.GreaterThanNumericalityValidationError = exports.FormatValidationError = exports.ExclusionValidationError = exports.EvenNumericalityValidationError = exports.EqualNumericalityValidationError = exports.EqualLengthValidationError = exports.EmailValidationError = exports.CustomValidationError = exports.BetweenLengthValidationError = exports.AcceptanceValidationError = exports.AbsenceValidationError = void 0;
var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/entries"));
var _replaceAll = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/replace-all"));
var _setPrototypeOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/set-prototype-of"));
var _assign = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/assign"));
var _humanizeString = _interopRequireDefault(require("humanize-string"));
var _titleCase = require("title-case");
var _errors = require("../errors");
class ServiceValidationError extends _errors.RedwoodError {
  constructor(message, substitutions = {}) {
    let errorMessage = message;
    let extensions = {};

    // in the main error message, replace instances of a string like
    // `{max}` with any substituted values that are titlecased and humanized
    for (const [key, value] of (0, _entries.default)(substitutions)) {
      errorMessage = (0, _replaceAll.default)(errorMessage).call(errorMessage, `\${${key}}`, (0, _titleCase.titleCase)((0, _humanizeString.default)(String(value))));

      // this mimics the Apollo Server use of error codes and extensions needed
      // for the web side FormError handlings to show the message at the field level
      // with an UserInputError (aka 'BAD_USER_INPUT" code) style error
      // @see: https://www.apollographql.com/docs/apollo-server/data/errors/#including-custom-error-details
      extensions = {
        code: 'BAD_USER_INPUT',
        properties: {
          messages: {
            [String(value)]: [errorMessage]
          }
        }
      };
    }
    super(errorMessage, extensions);
    this.name = 'ServiceValidationError';
    (0, _setPrototypeOf.default)(this, ServiceValidationError.prototype);
  }
}
exports.ServiceValidationError = ServiceValidationError;
class AbsenceValidationError extends ServiceValidationError {
  constructor(name, message = '${name} is not absent', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'AbsenceValidationError';
    (0, _setPrototypeOf.default)(this, AbsenceValidationError.prototype);
  }
}
exports.AbsenceValidationError = AbsenceValidationError;
class AcceptanceValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be accepted', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'AcceptanceValidationError';
    (0, _setPrototypeOf.default)(this, AcceptanceValidationError.prototype);
  }
}
exports.AcceptanceValidationError = AcceptanceValidationError;
class EmailValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be formatted like an email address', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'EmailValidationError';
    (0, _setPrototypeOf.default)(this, EmailValidationError.prototype);
  }
}
exports.EmailValidationError = EmailValidationError;
class ExclusionValidationError extends ServiceValidationError {
  constructor(name, message = '${name} is reserved', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'ExclusionValidationError';
    (0, _setPrototypeOf.default)(this, ExclusionValidationError.prototype);
  }
}
exports.ExclusionValidationError = ExclusionValidationError;
class FormatValidationError extends ServiceValidationError {
  constructor(name, message = '${name} is not formatted correctly', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'FormatValidationError';
    (0, _setPrototypeOf.default)(this, FormatValidationError.prototype);
  }
}
exports.FormatValidationError = FormatValidationError;
class InclusionValidationError extends ServiceValidationError {
  constructor(name, message = '${name} is reserved', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'InclusionValidationError';
    (0, _setPrototypeOf.default)(this, InclusionValidationError.prototype);
  }
}
exports.InclusionValidationError = InclusionValidationError;
class MinLengthValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must have at least ${min} characters', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'MinLengthValidationError';
    (0, _setPrototypeOf.default)(this, MinLengthValidationError.prototype);
  }
}
exports.MinLengthValidationError = MinLengthValidationError;
class MaxLengthValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must have no more than ${max} characters', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'MaxLengthValidationError';
    (0, _setPrototypeOf.default)(this, MaxLengthValidationError.prototype);
  }
}
exports.MaxLengthValidationError = MaxLengthValidationError;
class EqualLengthValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must have exactly ${equal} characters', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'EqualLengthValidationError';
    (0, _setPrototypeOf.default)(this, EqualLengthValidationError.prototype);
  }
}
exports.EqualLengthValidationError = EqualLengthValidationError;
class BetweenLengthValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be between ${min} and ${max} characters', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'BetweenLengthValidationError';
    (0, _setPrototypeOf.default)(this, BetweenLengthValidationError.prototype);
  }
}
exports.BetweenLengthValidationError = BetweenLengthValidationError;
class PresenceValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be present', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'PresenceValidationError';
    (0, _setPrototypeOf.default)(this, PresenceValidationError.prototype);
  }
}
exports.PresenceValidationError = PresenceValidationError;
class TypeNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must by a number', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'TypeNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, TypeNumericalityValidationError.prototype);
  }
}
exports.TypeNumericalityValidationError = TypeNumericalityValidationError;
class IntegerNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be an integer', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'IntegerNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, IntegerNumericalityValidationError.prototype);
  }
}
exports.IntegerNumericalityValidationError = IntegerNumericalityValidationError;
class LessThanNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be less than ${lessThan}', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'LessThanNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, LessThanNumericalityValidationError.prototype);
  }
}
exports.LessThanNumericalityValidationError = LessThanNumericalityValidationError;
class LessThanOrEqualNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be less than or equal to ${lessThanOrEqual}', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'LessThanOrEqualNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, LessThanOrEqualNumericalityValidationError.prototype);
  }
}
exports.LessThanOrEqualNumericalityValidationError = LessThanOrEqualNumericalityValidationError;
class GreaterThanNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be greater than ${greaterThan}', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'GreaterThanNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, GreaterThanNumericalityValidationError.prototype);
  }
}
exports.GreaterThanNumericalityValidationError = GreaterThanNumericalityValidationError;
class GreaterThanOrEqualNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be greater than or equal to ${greaterThanOrEqual}', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'GreaterThanOrEqualNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, GreaterThanOrEqualNumericalityValidationError.prototype);
  }
}
exports.GreaterThanOrEqualNumericalityValidationError = GreaterThanOrEqualNumericalityValidationError;
class EqualNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must equal ${equal}', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'EqualNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, EqualNumericalityValidationError.prototype);
  }
}
exports.EqualNumericalityValidationError = EqualNumericalityValidationError;
class OtherThanNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must not equal ${otherThan}', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'OtherThanNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, OtherThanNumericalityValidationError.prototype);
  }
}
exports.OtherThanNumericalityValidationError = OtherThanNumericalityValidationError;
class EvenNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be even', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'EvenNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, EvenNumericalityValidationError.prototype);
  }
}
exports.EvenNumericalityValidationError = EvenNumericalityValidationError;
class OddNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be odd', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'OddNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, OddNumericalityValidationError.prototype);
  }
}
exports.OddNumericalityValidationError = OddNumericalityValidationError;
class PositiveNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be positive', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'PositiveNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, PositiveNumericalityValidationError.prototype);
  }
}
exports.PositiveNumericalityValidationError = PositiveNumericalityValidationError;
class NegativeNumericalityValidationError extends ServiceValidationError {
  constructor(name, message = '${name} must be negative', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'NegativeNumericalityValidationError';
    (0, _setPrototypeOf.default)(this, NegativeNumericalityValidationError.prototype);
  }
}
exports.NegativeNumericalityValidationError = NegativeNumericalityValidationError;
class CustomValidationError extends ServiceValidationError {
  constructor(name,
  // Since CustomValidationError is derived from either a raised error or a string, the message is always passed.
  // but for the sake of consistency, we'll keep the message optional.
  message = '', substitutions = {}) {
    super(message, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'CustomValidationError';
    (0, _setPrototypeOf.default)(this, CustomValidationError.prototype);
  }
}
exports.CustomValidationError = CustomValidationError;
class UniquenessValidationError extends ServiceValidationError {
  constructor(name, message, substitutions = {}) {
    const errorMessage = message ? message : `${name} must be unique`;
    super(errorMessage, (0, _assign.default)(substitutions, {
      name
    }));
    this.name = 'UniquenessValidationError';
    (0, _setPrototypeOf.default)(this, UniquenessValidationError.prototype);
  }
}
exports.UniquenessValidationError = UniquenessValidationError;