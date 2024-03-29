/**
 * @module index
 * @license MIT
 * @author nuintun
 */

// Import lib
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import * as utils from './lib/utils';

/**
 * @function visit
 * @description Visit code
 * @param {string} code
 * @param {Object} options
 * @param {Function} callback
 */
function visit(code, options, callback) {
  let syntax;

  options = { ecmaVersion: 'latest', ...options };

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
export default function parse(code, replace, options) {
  let offset = 0;

  const dependencies = [];

  // Is buffer
  if (Buffer.isBuffer(code)) {
    code = code.toString();
  }

  if (replace && utils.object(replace)) {
    options = replace;
    replace = null;
  }

  options = options || {};

  if (!utils.string(code)) {
    code = '';
  }

  if (!utils.string(options.word)) {
    options.word = 'require';
  }

  if (!new RegExp(`\\b${options.word}\\b`).test(code)) {
    return { code, dependencies };
  }

  if (!Array.isArray(options.flags)) {
    options.flags = [];
  }

  if (replace && !utils.fn(replace)) {
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

      if (path && utils.string(path)) {
        path = utils.encode(path);
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
