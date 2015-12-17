/**
 * Created by nuintun on 2015/4/29.
 */

'use strict';

// import lib
var util = require('./lib/util');
var parser = require('./lib/parser');

/**
 * cmd-deps
 * @param src
 * @param replace
 * @param flags
 * @returns {String|Array}
 */
module.exports = function (src, replace, flags){
  // is buffer
  if (Buffer.isBuffer(src)) src = src.toString();

  // normalize arguments
  if (replace === true || Array.isArray(replace)) {
    flags = replace === true ? ['async'] : replace;
    replace = undefined;
  }

  // flags
  if (flags === true) {
    flags = ['async'];
  }

  // is has require
  if (!util.string(src) || !/\brequire\b/.test(src)) {
    return replace ? src : [];
  }

  // return result
  return parser(src, replace, { flags: flags });
};
