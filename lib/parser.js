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
function parse(src, options){
  if (!options) options = {};

  return acorn.parse(src, {
    ranges: defined(options.ranges, false),
    ecmaVersion: defined(options.ecmaVersion, 6),
    locations: defined(options.locations, null),
    allowReturnOutsideFunction: defined(options.allowReturnOutsideFunction, true),
    strictSemicolons: defined(options.strictSemicolons, false),
    allowTrailingCommas: defined(options.allowTrailingCommas, true),
    forbidReserved: defined(options.forbidReserved, false)
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
function walk(src, options, cb){
  var syntax;

  // Parse ast
  try {
    syntax = parse(src, options);
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
module.exports = function (src, replace, options){
  var offset = 0;
  var modules = [];

  if (replace && typeof replace === 'object' && !Array.isArray(replace)) {
    options = replace;
    replace = undefined;
  }

  options = options || {};
  options.parse = options.parse || {};

  if (typeof src !== 'string') src = src + '';
  if (typeof options.word !== 'string') options.word = 'require';
  if (!(new RegExp('\\b' + options.word + '\\b')).test(src)) return modules;
  if (replace && typeof replace !== 'function') replace = noop;

  // Walk code
  walk(src, options.parse, function (node){
    if (isRequire(node, options.word, options.flag)) {
      var args = node.arguments;
      var flag = node.callee.property ? options.flag : null;

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
          update = replace(value, options.flag);

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