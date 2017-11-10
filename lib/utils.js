/**
 * @module utils
 * @license MIT
 * @version 2017/11/10
 */

'use strict';

// Variable declaration
const toString = Object.prototype.toString;

/**
 * @function noop
 */
function noop() {}

/**
 * @function string
 * @param {any} string
 * @returns {boolean}
 */
function string(string) {
  return toString.call(string) === '[object String]';
}

/**
 * @function fn
 * @param {any} fn
 * @returns {boolean}
 */
function fn(fn) {
  return toString.call(fn) === '[object Function]';
}

/**
 * @function object
 * @param {any} object
 * @returns {boolean}
 */
function object(object) {
  return toString.call(object) === '[object Object]';
}

/**
 * @function defined
 */
function defined() {
  for (let i = 0; i < arguments.length; i++) {
    if (arguments[i] !== undefined) return arguments[i];
  }
}

/**
 * Exports module
 */
module.exports = {
  noop,
  string,
  fn,
  object,
  defined
};
