/**
 * @module cmd-deps
 * @author nuintun
 * @license MIT
 * @version 3.0.1
 * @description Transform cmd and get cmd dependences.
 * @see https://github.com/nuintun/cmd-deps#readme
 */

'use strict';

const acorn = require('acorn');

/**
 * @module utils
 * @license MIT
 * @author nuintun
 */

// Variable declaration
const toString = Object.prototype.toString;

/**
 * @function string
 * @param {any} string
 * @returns {boolean}
 */
function string(string) {
  return toString.call(string) === '[object String]';
}

/**
 * @function fn
 * @param {any} fn
 * @returns {boolean}
 */
function fn(fn) {
  return toString.call(fn) === '[object Function]';
}

/**
 * @function object
 * @param {any} object
 * @returns {boolean}
 */
function object(object) {
  return toString.call(object) === '[object Object]';
}

/**
 * @function encode
 * @param {sting} path
 * @returns {string}
 */
function encode(path) {
  return path.replace(/['"]/g, '\\$&');
}

/**
 * @module index
 * @license MIT
 * @author nuintun
 */

/**
 * @function traverse
 * @description Executes visitor on the object and its children (recursively).
 * @param {Object} object
 * @param {Function} visitor
 */
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

/**
 * @function visit
 * @description Visit code
 * @param {string} code
 * @param {Object} options
 * @param {Function} callback
 */
function visit(code, options, callback) {
  let syntax;

  // Parse ast
  try {
    syntax = acorn.parse(code, options);
  } catch (error) {
    // Parse ast error, do nothing
  }

  // If parse success
  if (syntax) traverse(syntax, callback);
}

/**
 * @function isRequire
 * @description Check is require call expression
 * @param {Object} node
 * @param {string} word
 * @param {Array} flags
 */
function isRequire(node, word, flags) {
  if (node.type === 'CallExpression') {
    node = node.callee;

    if (flags.size && node.type === 'MemberExpression') {
      const object = node.object;
      const property = node.property;

      return (
        object.type === 'Identifier' &&
        object.name === word &&
        ((property.type === 'Literal' && flags.has(property.value)) ||
          (property.type === 'Identifier' && !node.computed && flags.has(property.name)))
      );
    } else {
      return node.type === 'Identifier' && node.name === word;
    }
  }

  return false;
}

/**
 * @function parser
 * @param {string|Buffer} code
 * @param {Function} [replace]
 * @param {Object} [options]
 * @param {string} [options.word]
 * @param {string[]} [options.flags]
 * @returns {Object}
 */
function parser(code, replace, options) {
  let offset = 0;
  const dependencies = [];

  // Is buffer
  if (Buffer.isBuffer(code)) code = code.toString();

  if (replace && object(replace)) {
    options = replace;
    replace = null;
  }

  options = options || {};

  if (!string(code)) code = '';
  if (!string(options.word)) options.word = 'require';
  if (!new RegExp(`\\b${options.word}\\b`).test(code)) return { code, dependencies };
  if (!Array.isArray(options.flags)) options.flags = [];
  if (replace && !fn(replace)) replace = null;

  // Use Set
  options.flags = new Set(options.flags);

  // The handle function
  const handle = (node, flag) => {
    let value = node.value;

    // Replace code
    if (replace) {
      const length = value.length;

      value = replace(value, flag);

      if (value && string(value)) {
        value = encode(value);
        code = code.substring(0, node.start + offset + 1) + value + code.substring(node.end + offset - 1);
        offset += value.length - length;
      }
    }

    // Push dependencie in to array
    dependencies.push({
      flag: flag,
      path: value
    });
  };

  // Visit code
  visit(code, options.acorn, node => {
    if (isRequire(node, options.word, options.flags)) {
      const args = node.arguments[0];

      // When arguments length > 0
      if (args) {
        const type = args.type;
        const property = node.callee.property;
        const flag = property ? property.name || property.value : null;

        if (type === 'Literal') {
          handle(args, flag);
        } else if (type === 'ArrayExpression') {
          args.elements.forEach(args => {
            if (args.type === 'Literal') {
              handle(args, flag);
            }
          });
        }
      }
    }
  });

  // return result
  return { code, dependencies };
}

module.exports = parser;
