'use strict';

// Import lib
var util = require('./util');
var acorn = require('acorn');

// The parse function
function parse(src, options) {
  if (!options) options = {};

  return acorn.parse(src, {
    sourceType: options.sourceType,
    ranges: util.defined(options.ranges, false),
    locations: util.defined(options.locations, null),
    ecmaVersion: util.defined(options.ecmaVersion, 6),
    allowHashBang: util.defined(options.allowHashBang, true),
    allowReserved: util.defined(options.allowReserved, true),
    allowReturnOutsideFunction: util.defined(options.allowReturnOutsideFunction, true),
    allowImportExportEverywhere: util.defined(options.allowImportExportEverywhere, true)
  });
}

// Executes visitor on the object and its children (recursively).
function traverse(object, visitor) {
  var key;
  var child;

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
function walk(src, options, callback) {
  var syntax;

  // Parse ast
  try {
    syntax = parse(src, options);
  } catch (error) {
    // Parse ast wrong, do nothing
  }

  // If parse success
  if (syntax) {
    traverse(syntax, callback);
  }

  return syntax;
}

// The is require function
function isRequire(node, word, flags) {
  if (node.type === 'CallExpression') {
    node = node.callee;

    if (flags.length && node.type === 'MemberExpression') {
      return node.object.type === 'Identifier' && node.object.name === word
        && ((node.property.type === 'Identifier' && flags.indexOf(node.property.name) !== -1)
          || (node.property.type === 'Literal' && flags.indexOf(node.property.value) !== -1));
    } else {
      return node.type === 'Identifier' && node.name === word;
    }
  }
}

/**
 * Exports module
 */
module.exports = function(src, replace, options) {
  var deps = [];
  var offset = 0;

  if (replace && util.object(replace)) {
    options = replace;
    replace = undefined;
  }

  options = options || {};

  if (!util.string(src)) return deps;
  if (!util.string(options.word)) options.word = 'require';
  if (!(new RegExp('\\b' + options.word + '\\b')).test(src)) return deps;
  if (!Array.isArray(options.flags)) options.flags = [];
  if (replace && !util.fn(replace)) replace = util.noop;

  // The handle function
  var handle = function(node, flag) {
    var update;
    var value = node.value;

    // Push deps in to array
    deps.push({
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
  walk(src, options.parse, function(node) {
    if (isRequire(node, options.word, options.flags)) {
      var args = node.arguments;
      var property = node.callee.property;
      var flag = property ? property.name : null;

      // When arguments length > 0
      if (args.length) {
        args = args[0];

        if (args.type === 'Literal') {
          handle(args, flag);
        } else if (args.type === 'ArrayExpression') {
          args.elements.forEach(function(args) {
            if (args.type === 'Literal') {
              handle(args, flag);
            }
          });
        }
      }
    }
  });

  // return result
  return replace ? src : deps;
};
