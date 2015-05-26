/**
 * Created by nuintun on 2015/5/4.
 */

'use strict';

// Import lib
var util = require('./util');
var acorn = require('acorn');

// The parse function
function parse(src, options){
  if (!options) options = {};

  return acorn.parse(src, {
    ranges: util.defined(options.ranges, false),
    ecmaVersion: util.defined(options.ecmaVersion, 6),
    locations: util.defined(options.locations, null),
    allowReturnOutsideFunction: util.defined(options.allowReturnOutsideFunction, true),
    strictSemicolons: util.defined(options.strictSemicolons, false),
    allowTrailingCommas: util.defined(options.allowTrailingCommas, true),
    forbidReserved: util.defined(options.forbidReserved, false)
  });
}

// Executes visitor on the object and its children (recursively).
function traverse(object, visitor){
  var key;
  var child;

  if (visitor.call(null, object) !== false) {
    for (key in object) {
      if (object.hasOwnProperty(key)) {
        child = object[key];

        if (child !== null && is.object(child)) {
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

  if (replace && util.object(replace)) {
    options = replace;
    replace = undefined;
  }

  options = options || {};

  if (!util.string(src)) return modules;
  if (!util.string(options.word)) options.word = 'require';
  if (!(new RegExp('\\b' + options.word + '\\b')).test(src)) return modules;
  if (replace && !util.fn(replace)) replace = util.noop;

  // The handle function
  var handle = function (node, flag){
    var update;
    var value = node.value;

    // Push modules in to array
    modules.push({
      flag: flag,
      path: value
    });

    // Replace code
    if (replace) {
      update = replace(value, flag);

      if (util.string(update)) {
        src = src.substring(0, node.start + offset + 1) + update + src.substring(node.end + offset - 1);
        offset += update.length - value.length;
      }
    }
  };

  // Walk code
  walk(src, options.parse, function (node){
    if (isRequire(node, options.word, options.flag)) {
      var args = node.arguments;
      var flag = node.callee.property ? options.flag : null;

      // When arguments length > 0
      if (args.length) {
        args = args[0];

        if (args.type === 'Literal') {
          handle(args, flag);
        } else if (args.type === 'ArrayExpression') {
          args.elements.forEach(function (args){
            if (args.type === 'Literal') {
              handle(args, flag);
            }
          });
        }
      }
    }
  });

  return replace ? src : modules;
};