/**
 * index.js
 * ~~~~~~~~~~~
 * This module provides the helper functions to validate your primitives in JS.
 
 */

const { all, _any, convertToFloat, convertToInteger, getType } = require('./utils');

const any = () => new AnyState();
const number = () => new NumberState();
const string = () => new StringState();
const symbol = primitiveType('symbol');
const boolean = primitiveType('boolean');
const object = validationSchema => new ObjectState(validationSchema);
const list = validationSchema => new ListState(validationSchema);

/**
 * Checks the value with the type and returns the result payload.
 *
 * @param {any} value
 * @param {string} type
 *
 * @return {object}
 */
function primitiveTypeCheck(value, type) {
  const actualType = getType(value);

  if (actualType !== type) {
    return typeError(type, actualType);
  }

  return success(value);
}

function success(value) {
  return {
    error: null,
    value: value
  };
}

/**
 * Formats the error payload.
 *
 * @param {string} expected
 * @param {string} actual
 *
 * @returns {object}
 */
function typeError(expected, actual) {
  return {
    error: `Expected ${expected} but got ${actual}`,
    value: null
  };
}

function emptyError() {
  return {
    error: 'Value is required.',
    value: null
  };
}
/**
 * Factory function for boolean and symbol primitives.
 *
 * @param {string} type
 *
 * @returns {function}
 */
function primitiveType(type) {
  return function() {
    return {
      _optional: false,
      validate: function(value) {
        if (this._optional && (value === undefined || value === null)) {
          // safely return
          return success(value);
        }
        if (getType(value) === 'string' && value.length === 0) {
          return emptyError();
        }

        return primitiveTypeCheck(value, type);
      },
      optional: function() {
        this._optional = true;

        return this;
      }
    };
  };
}

/**
 * Checks weather the number represented in string has unparsable codepoints
 * and returns the appropriate result payload.
 *
 * @param {string} value
 *
 * @returns {object}
 */
function checkForString(value) {
  let dotCount = 0;
  const codePointsFlag = Object.values(value).map((_, index) => {
    const codePoint = value.codePointAt(index);

    if (codePoint === 46) {
      dotCount++;
    }

    return (codePoint >= 48 && codePoint <= 57) || codePoint === 46
      ? false
      : true;
  });

  if (_any(codePointsFlag)) {
    return typeError('number', 'string');
  }
  // also check for ".34." that is more than one "."
  if (dotCount > 1) {
    return typeError('number', 'string');
  }

  return success(value);
}

/**
 * Length mixins for string, array and object.
 */
const LengthMixins = {
  minLength: function(length) {
    const lengthType = getType(length);

    if (lengthType !== 'number') {
      throw new TypeError(
        `Argument to the minLength must be of type number but got ${lengthType}.`
      );
    }
    if (this._maxLength !== null && this._minLength >= this._maxLength) {
      throw new Error(
        'Min length must be less than Max Length. Length Mismatch.'
      );
    }
    this._minLength = length;

    return this;
  },
  maxLength: function(length) {
    const lengthType = getType(length);

    if (lengthType !== 'number') {
      throw new TypeError(
        `Argument to the minLength must be of type numner but got ${lengthType}.`
      );
    }

    if (this._minLength !== null && length <= this._minLength) {
      throw new Error(
        'Max length must be greater than Min Length. Length Mismatch.'
      );
    }

    this._maxLength = length;

    return this;
  }
};

function AnyState() {
  this._optional = false;
  this._allowUndefinedNull = false;
}

AnyState.prototype = {
  validate: function(payload) {
    if (this._optional && (payload === undefined || payload === null)) {
      return success(payload);
    }

    const actualType = getType(payload);

    if (
      !this._allowUndefinedNull &&
      (actualType === 'undefined' || actualType === 'null')
    ) {
      return typeError('any', actualType);
    }

    return success(payload);
  },
  optional: function() {
    this._optional = true;

    return this;
  },
  allowUndefinedNull: function() {
    this._allowUndefinedNull = true;

    return this;
  }
};
function NumberState() {
  this._type = 'number';
  this._optional = false;
  this._min = null;
  this._max = null;
  this._toFloat = false;
  this._toInteger = false;
  this._decimalPlaces = null;
}

NumberState.prototype = {
  validate: function(payload) {
    if (this._optional && (payload === undefined || payload === null)) {
      return success(payload);
    }

    if (getType(payload) === 'string') {
      //
      if (payload.length === 0) {
        return emptyError();
      }
      const includeStringValidation = checkForString(payload);

      if (includeStringValidation.error) {
        return includeStringValidation;
      }
    }
    // check for infinity
    if (payload === Infinity) {
      return {
        error: 'Expected number but got Infinity.Invalid!',
        value: null
      };
    }

    if (payload === null || payload === undefined) {
      return {
        error: `Expected number but got ${payload}.Invalid!`,
        value: null
      }
    }
    const parsableNumber = parseFloat(payload);
    const value = primitiveTypeCheck(parsableNumber, this._type);

    if (value.error) {
      return value;
    }

    if (this._min !== null || this._max !== null) {
      const rangeResult = rangeCheck(
        parsableNumber,
        {
          min: this._min,
          max: this._max
        },
        this._type
      );

      if (rangeResult.error) {
        return rangeResult;
      }
    }
    let convertedPayload = payload;

    if (this._toInteger) {
      convertedPayload = convertToInteger(payload);
    } else if (this._toFloat) {
      convertedPayload = convertToFloat(payload, this._decimalPlaces);
    }

    return success(convertedPayload);
  },
  optional: function() {
    this._optional = true;

    return this;
  },
  max: function(value) {
    if (getType(value) !== 'number') {
      throw new TypeError(`${value} must be of type number.`);
    }
    if (this._min !== null && value <= this._min) {
      throw new Error(
        `Max value ${value} must be greater than min value ${this._min}`
      );
    }
    this._max = value;

    return this;
  },
  min: function(value) {
    if (getType(value) !== 'number') {
      throw new TypeError(`${value} must be of type number.`);
    }
    if (this._max !== null && value >= this._max) {
      throw new Error(
        `Min value ${value} must be less than max value ${this._max}`
      );
    }
    this._min = value;

    return this;
  },
  toInteger: function() {
    // check to see if _toFloat is true
    if (this._toFloat) {
      throw new Error(
        'Invalid Conversion scheme. Cannot be both float and integer.'
      );
    }
    this._toInteger = true;

    return this;
  },
  toFloat: function(decimalPlaces = 3) {
    if (this._toInteger) {
      throw new Error(
        'Invalid conversion scheme. Cannot be both integer and float.'
      );
    }
    if (getType(decimalPlaces) !== 'number') {
      throw new TypeError('Invalid argument to function "toFloat".');
    }
    this._toFloat = true;
    this._decimalPlaces = decimalPlaces;

    return this;
  }
};

function StringState() {
  this._type = 'string';
  this._optional = false;
  this._minLength = null;
  this._maxLength = null;
}

StringState.prototype = {
  validate: function(payload) {
    if (this._optional && (payload === undefined || payload === null)) {
      return success(payload);
    }

    const value = primitiveTypeCheck(payload, this._type);

    if (value.error) {
      return value;
    }

    if (getType(payload) === 'string' && payload.length === 0) {
      return emptyError();
    }
    if (this._minLength !== null || this._maxLength !== null) {
      const lengthResult = lengthCheck(
        Object.values(payload),
        {
          minLength: this._minLength,
          maxLength: this._maxLength
        },
        this._type
      );

      if (lengthResult.error) {
        return lengthResult;
      }
    }

    return success(payload);
  },
  optional: function() {
    this._optional = true;

    return this;
  },
  ...LengthMixins
};

function ObjectState(validationSchema) {
  this._type = 'object';
  this._optional = false;
  this._minLength = null;
  this._maxLength = null;
  this.validationSchema = validationSchema;
}

ObjectState.prototype = {
  validate: function(payload) {
    // here we write our validation rule
    if (this._optional && (payload === undefined || payload === null)) {
      // safely return
      return success(payload);
    }

    const value = primitiveTypeCheck(payload, 'object');

    if (value.error) {
      return value;
    }
    // before validating each item we first validate the length
    if (this._minLength !== null || this._maxLength !== null) {
      const lengthResult = lengthCheck(
        Object.keys(payload),
        {
          minLength: this._minLength,
          maxLength: this._maxLength
        },
        this._type
      );

      if (lengthResult.error) {
        return lengthResult;
      }
    }
    const errorPayload = {};
    const valuePayload = {};

    Object.keys(this.validationSchema).forEach(key => {
      const validation = this.validationSchema[key];

      if (
        typeof validation !== 'object' ||
        validation === null ||
        !validation.validate ||
        typeof validation.validate !== 'function'
      ) {
        throw new TypeError(`Invalid schema for ${key}`);
      }
      const val = payload[key];

      const { error, value } = validation.validate(val);

      if (error !== null) {
        errorPayload[key] = error;
      } else {
        valuePayload[key] = value;
      }
    });

    return {
      error: Object.keys(errorPayload).length ? errorPayload : null,
      value: Object.keys(valuePayload).length ? valuePayload : null
    };
  },
  optional: function() {
    this._optional = true;

    return this;
  },
  ...LengthMixins
};

function lengthError(type, lengthSchema, minFailed) {
  if (minFailed) {
    return {
      error: `${type} must have minimum length of ${lengthSchema.minLength}`,
      value: null
    };
  }

  return {
    error: `${type} must have maximum length of ${lengthSchema.maxLength}`,
    value: null
  };
}

function rangeError(type, rangeSchema, minFailed) {
  if (minFailed) {
    return {
      error: `Must be greater than ${rangeSchema.min}.`,
      value: null
    };
  }

  return {
    error: `Must be less than ${rangeSchema.max}.`,
    value: null
  };
}

// Range check for number
function rangeCheck(value, rangeSchema, type) {
  if (typeof value !== 'number') {
    throw new TypeError(`${value} must be of type number.`);
  }
  const { min, max } = rangeSchema;

  if (min !== null && getType(min) === 'number' && value <= min) {
    return rangeError(type, rangeSchema, true);
  }

  if (max !== null && getType(max) === 'number' && value >= max) {
    return rangeError(type, rangeSchema, false);
  }

  return success(value);
}

// length check for string/array
function lengthCheck(value, lengthSchema, type) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${value} must be of type Array.`);
  }
  if (
    lengthSchema.minLength !== null &&
    getType(lengthSchema.minLength) === 'number' &&
    value.length < lengthSchema.minLength
  ) {
    return lengthError(type, lengthSchema, true);
  }

  const maxLength = lengthSchema.maxLength;

  if (
    maxLength !== null &&
    getType(maxLength) === 'number' &&
    value.length > maxLength
  ) {
    return lengthError(type, lengthSchema, false);
  }

  return success(value);
}

function ListState(validationSchema) {
  this._type = 'array';
  this._optional = false;
  this._maxLength = null;
  this._minLength = null;
  this.validationSchema = validationSchema;
}

ListState.prototype = {
  validate: function(payload) {
    if (this._optional && (payload === undefined || payload === null)) {
      // safely return from the validation
      return success(payload);
    }
    const value = primitiveTypeCheck(payload, 'array');

    if (value.error) {
      return value;
    }

    // before validating each item we irst validate the length
    if (this._minLength !== null || this._maxLength !== null) {
      const lengthResult = lengthCheck(
        payload,
        {
          minLength: this._minLength,
          maxLength: this._maxLength
        },
        this._type
      );

      if (lengthResult.error) {
        return lengthResult;
      }
    }
    const res = payload.reduce((acc, val, index) => {
      const { error, value } = this.validationSchema.validate(val);

      return error !== null
        ? { ...acc, [index]: { error: error, value: value } }
        : { ...acc };
    }, {});

    if (all(Object.values(res).map(v => v.error === null))) {
      return {
        error: null,
        value: payload
      };
    }

    return {
      error: res,
      value: null
    };
  },
  optional: function() {
    this._optional = true;

    return this;
  },
  ...LengthMixins
};


module.exports = {
  any,
  number,
  string,
  symbol,
  boolean,
  list,
  object
};