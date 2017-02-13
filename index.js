'use strict';

// Import lib
var util = require('./lib/util');
var parser = require('./lib/parser');

/**
 * Cmd deps
 *
 * @param src
 * @param replace
 * @param flags
 * @returns {String|Array}
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
  if (!util.string(src) || !/\brequire\b/.test(src)) {
    return replace ? src : [];
  }

  // return result
  return parser(src, replace, { flags: flags });
};
