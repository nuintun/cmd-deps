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

  if (replace === true) {
    flags = ['async'];
    replace = undefined;
  }

  if (flags === true) {
    flags = ['async'];
  }

  if (!util.string(src) || !/\brequire\b/.test(src)) {
    return replace ? src : [];
  }

  return parser(src, replace, flags);
};
