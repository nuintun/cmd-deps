/**
 * @module cmd-deps
 * @author nuintun
 * @license MIT
 * @version 3.1.0
 * @description Transform cmd and get cmd dependences.
 * @see https://github.com/nuintun/cmd-deps#readme
 */

'use strict';

const acorn = require('acorn');
const walk = require('acorn-walk');

/**
 * @module utils
 * @license MIT
 * @author nuintun
 */

// Variable declaration
const { toString } = Object.prototype;

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
  if (syntax) {
    walk.full(syntax, callback);
  }
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
      const { object } = node;

      if (object.type !== 'Identifier' || object.name !== word) return false;

      const { type, name, value } = node.property;

      return (type === 'Literal' && flags.has(value)) || (type === 'Identifier' && !node.computed && flags.has(name));
    } else {
      return node.type === 'Identifier' && node.name === word;
    }
  }

  return false;
}

/**
 * @function parse
 * @param {string|Buffer} code
 * @param {Function} [replace]
 * @param {Object} [options]
 * @param {string} [options.word]
 * @param {string[]} [options.flags]
 * @returns {Object}
 */
function parse(code, replace, options) {
  let offset = 0;

  const dependencies = [];

  // Is buffer
  if (Buffer.isBuffer(code)) {
    code = code.toString();
  }

  if (replace && object(replace)) {
    options = replace;
    replace = null;
  }

  options = options || {};

  if (!string(code)) {
    code = '';
  }

  if (!string(options.word)) {
    options.word = 'require';
  }

  if (!new RegExp(`\\b${options.word}\\b`).test(code)) {
    return { code, dependencies };
  }

  if (!Array.isArray(options.flags)) {
    options.flags = [];
  }

  if (replace && !fn(replace)) {
    replace = null;
  }

  // Use Set
  options.flags = new Set(options.flags);

  // The handle function
  const handle = (node, flag) => {
    let { value: path } = node;

    // Replace code
    if (replace) {
      const { length } = path;

      path = replace(path, flag);

      if (path && string(path)) {
        path = encode(path);
        code = code.substring(0, node.start + offset + 1) + path + code.substring(node.end + offset - 1);
        offset += path.length - length;
      }
    }

    // Push dependencie in to array
    dependencies.push({ flag, path });
  };

  // Visit code
  visit(code, options.acorn, node => {
    if (isRequire(node, options.word, options.flags)) {
      const [args] = node.arguments;

      // When arguments length > 0
      if (args) {
        const { type } = args;
        const { property } = node.callee;
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

module.exports = parse;
