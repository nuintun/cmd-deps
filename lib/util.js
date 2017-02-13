'use strict';

// Variable declaration
var toString = Object.prototype.toString;

/**
 * Exports module
 */
module.exports = {
  // The noop function
  noop: function() {},
  // Get the first argument that is not equal undefined
  defined: function() {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined) return arguments[i];
    }
  },
  // Is string
  string: function(string) {
    return toString.call(string) === '[object String]';
  },
  // Is function
  fn: function(fn) {
    return toString.call(fn) === '[object Function]';
  },
  // Is object
  object: function(object) {
    return toString.call(object) === '[object Object]';
  }
};
