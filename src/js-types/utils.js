/**
 * Returns the precise type of any value
 *
 * @param {any} value
 * @returns {string}
 */
function getType(value) {
  let val = `${value}`;

  if (isNaN(value) && val === 'NaN') {
    return 'NaN';
  }

  if (value === undefined && val === 'undefined') {
    return 'undefined';
  }

  if (value === null && val === 'null') {
    return 'null';
  }

  if (Array.isArray(value)) {
    return 'array';
  }

  return typeof value;
}

/**
 * Returns true if any of the value is true on the list.
 *
 * @param {array} args
 *
 * @returns {boolean}
 */
function _any(args) {
  if (getType(args) !== 'array') {
    throw new TypeError('Must be of type number');
  }

  return args.reduce((acc, val) => acc || val, false);
}

/**
 * Converts any parsable value to rounded integer.
 *
 * @param {any} value
 *
 * @returns {integer}
 */
function convertToInteger(value) {
  // value might be string i.e parsable number, integer, float
  return Math.round(parseFloat(value));
}

/**
 * Converts any value to float given the precision value.
 *
 * @param {any} value
 * @param {number} decimalPlaces
 *
 * @returns {float}
 */
function convertToFloat(value, decimalPlaces) {
  // value might be string i.e parsable fnumber, integer, float
  return parseFloat(parseFloat(value).toFixed(decimalPlaces));
}

/**
 * Returns true if all of the value is true on the list.
 *
 * @param {array} args
 *
 * @returns {boolean}
 */
function all(args) {
  if (!Array.isArray(args)) {
    throw new TypeError('Argument must be of type array.');
  }

  return args.reduce((acc, val) => acc && val, true);
}

module.exports = {
  getType,
  _any,
  all,
  convertToFloat,
  convertToInteger
}
