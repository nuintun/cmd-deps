/**
 * @module utils
 * @license MIT
 * @version 2017/11/10
 */

// Variable declaration
const toString = Object.prototype.toString;

/**
 * @function string
 * @param {any} string
 * @returns {boolean}
 */
export function string(string) {
  return toString.call(string) === '[object String]';
}

/**
 * @function fn
 * @param {any} fn
 * @returns {boolean}
 */
export function fn(fn) {
  return toString.call(fn) === '[object Function]';
}

/**
 * @function object
 * @param {any} object
 * @returns {boolean}
 */
export function object(object) {
  return toString.call(object) === '[object Object]';
}

/**
 * @function encode
 * @param {sting} path
 * @returns {string}
 */
export function encode(path) {
  return path.replace(/['"]/g, '\\$&');
}
