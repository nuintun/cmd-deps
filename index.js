/**
 * @module index
 * @license MIT
 * @version 2017/11/10
 */

'use strict';

// Import lib
const utils = require('./lib/utils');
const parser = require('./lib/parser');

/**
 * @function cmd
 * @param {string} src
 * @param {Function} replace
 * @param {Array} flags
 * @returns {string|Array}
 */
module.exports = function(src, replace, flags) {
  // Is buffer
  if (Buffer.isBuffer(src)) src = src.toString();

  // Normalize arguments
  if (replace === true || Array.isArray(replace)) {
    flags = replace === true ? ['async'] : replace;
    replace = undefined;
  }

  // Flags
  if (flags === true) {
    flags = ['async'];
  }

  // Is has require
  if (!utils.string(src) || !/\brequire\b/.test(src)) {
    return replace ? src : [];
  }

  // return result
  return parser(src, replace, { flags: flags });
};
