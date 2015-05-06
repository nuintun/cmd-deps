/**
 * Created by nuintun on 2015/5/4.
 */

'use strict';

// Import lib
var acorn = require('acorn');

// Noop function
function noop(){}

// Get the first argument that is not equal undefined
function defined(){
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] !== undefined) return arguments[i];
  }
}

// The parse function
function parse(src, opts){
  if (!opts) opts = {};

  return acorn.parse(src, {
    ranges: defined(opts.ranges, false),
    ecmaVersion: defined(opts.ecmaVersion, 6),
    locations: defined(opts.locations, null),
    allowReturnOutsideFunction: defined(opts.allowReturnOutsideFunction, true),
    strictSemicolons: defined(opts.strictSemicolons, false),
    allowTrailingCommas: defined(opts.allowTrailingCommas, true),
    forbidReserved: defined(opts.forbidReserved, false)
  });
}

// Executes visitor on the object and its children (recursively).
function traverse(object, visitor){
  var key, child;

  if (visitor.call(null, object) !== false) {
    for (key in object) {
      if (object.hasOwnProperty(key)) {
        child = object[key];

        if (child !== null && typeof child === 'object') {
          traverse(child, visitor);
        }
      }
    }
  }
}

// The tree walk function
function walk(src, opts, cb){
  var syntax;

  // Parse ast
  try {
    syntax = parse(src, opts);
  } catch (e) {
    // Parse ast wrong, do nothing
  }

  // If parse success
  if (syntax) {
    traverse(syntax, cb);
  }

  return syntax;
}

// The is require function
function isRequire(node, word, flag){
  if (node.type === 'CallExpression') {
    node = node.callee;

    if (flag && node.type === 'MemberExpression') {
      return node.object.type === 'Identifier' && node.object.name === word
        && ((node.property.type === 'Identifier' && node.property.name === flag)
        || (node.property.type === 'Literal' && node.property.value === flag));
    } else {
      return node.type === 'Identifier' && node.name === word;
    }
  }
}

// Exports
module.exports = function (src, replace, opts){
  var offset = 0;
  var modules = [];

  if (replace && typeof replace === 'object' && !Array.isArray(replace)) {
    opts = replace;
    replace = undefined;
  }

  opts = opts || {};
  opts.parse = opts.parse || {};

  if (typeof src !== 'string') src = src + '';
  if (typeof opts.word !== 'string') opts.word = 'require';
  if (src.indexOf(opts.word) === -1) return modules;
  if (replace && typeof replace !== 'function') replace = noop;

  // Walk code
  walk(src, opts.parse, function (node){
    if (isRequire(node, opts.word, opts.flag)) {
      var args = node.arguments;
      var flag = node.callee.property ? opts.flag : null;

      // The handle function
      var handle = function (node){
        var update,
          value = node.value;

        // Push modules in to array
        modules.push({
          flag: flag,
          path: value
        });

        // Replace code
        if (replace) {
          update = replace(value, opts.flag);

          if (typeof update === 'string') {
            src = src.substring(0, node.start + offset + 1) + update + src.substring(node.end + offset - 1);
            offset += update.length - value.length;
          }
        }
      };

      // When arguments length > 0
      if (args.length) {
        args = args[0];

        if (args.type === 'Literal') {
          handle(args);
        } else if (args.type === 'ArrayExpression') {
          args.elements.forEach(function (args){
            if (args.type === 'Literal') {
              handle(args);
            }
          });
        }
      }
    }
  });

  return replace ? src : modules;
};