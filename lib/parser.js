/**
 * @module parser
 * @license MIT
 * @version 2017/11/10
 */

'use strict';

// Import lib
const utils = require('./utils');
const acorn = require('acorn');

// The parse function
function parse(src, options) {
  if (!options) options = {};

  return acorn.parse(src, {
    sourceType: options.sourceType,
    ranges: utils.defined(options.ranges, false),
    locations: utils.defined(options.locations, null),
    ecmaVersion: utils.defined(options.ecmaVersion, 6),
    allowHashBang: utils.defined(options.allowHashBang, true),
    allowReserved: utils.defined(options.allowReserved, true),
    allowReturnOutsideFunction: utils.defined(options.allowReturnOutsideFunction, true),
    allowImportExportEverywhere: utils.defined(options.allowImportExportEverywhere, true)
  });
}

// Executes visitor on the object and its children (recursively).
function traverse(object, visitor) {
  if (visitor.call(null, object) !== false) {
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        let child = object[key];

        if (child !== null && typeof child === 'object') {
          traverse(child, visitor);
        }
      }
    }
  }
}

// The tree walk function
function walk(src, options, callback) {
  let syntax;

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
  let offset = 0;
  const deps = [];

  if (replace && utils.object(replace)) {
    options = replace;
    replace = undefined;
  }

  options = options || {};

  if (!utils.string(src)) return deps;
  if (!utils.string(options.word)) options.word = 'require';
  if (!(new RegExp('\\b' + options.word + '\\b')).test(src)) return deps;
  if (!Array.isArray(options.flags)) options.flags = [];
  if (replace && !utils.fn(replace)) replace = utils.noop;

  // The handle function
  const handle = (node, flag) => {
    let update;
    const value = node.value;

    // Push deps in to array
    deps.push({
      flag: flag,
      path: value
    });

    // Replace code
    if (replace) {
      update = replace(value, flag);

      if (utils.string(update)) {
        src = src.substring(0, node.start + offset + 1) + update + src.substring(node.end + offset - 1);
        offset += update.length - value.length;
      }
    }
  };

  // Walk code
  walk(src, options.parse, (node) => {
    if (isRequire(node, options.word, options.flags)) {
      const args = node.arguments;
      const property = node.callee.property;
      const flag = property ? property.name : null;

      // When arguments length > 0
      if (args.length) {
        args = args[0];

        if (args.type === 'Literal') {
          handle(args, flag);
        } else if (args.type === 'ArrayExpression') {
          args.elements.forEach((args) => {
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
