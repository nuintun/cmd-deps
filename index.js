/**
 * @module index
 * @license MIT
 * @version 2017/11/10
 */

// Import lib
import * as acorn from 'acorn';
import * as utils from './lib/utils';

/**
 * @function parse
 * @description The parse function
 * @param {string} code
 * @param {Object} options
 * @returns {AST}
 */
function parse(code, options) {
  options = options || {};

  return acorn.parse(code, {
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
    syntax = parse(code, options);
  } catch (error) {
    // Parse ast error, do nothing
  }

  // If parse success
  if (syntax) traverse(syntax, callback);
}

/**
 * @function isRequire
 * @description The is require function
 * @param {Object} node
 * @param {string} word
 * @param {Array} flags
 */
function isRequire(node, word, flags) {
  if (node.type === 'CallExpression') {
    node = node.callee;

    if (flags.length && node.type === 'MemberExpression') {
      return (
        node.object.type === 'Identifier' &&
        node.object.name === word &&
        ((node.property.type === 'Identifier' && flags.indexOf(node.property.name) !== -1) ||
          (node.property.type === 'Literal' && flags.indexOf(node.property.value) !== -1))
      );
    } else {
      return node.type === 'Identifier' && node.name === word;
    }
  }
}

/**
 * @function parser
 * @param {string} code
 * @param {Function} replace
 * @param {Object} options
 * @returns {Object}
 */
export default function parser(code, replace, options) {
  let offset = 0;
  const dependencies = [];

  if (replace && utils.object(replace)) {
    options = replace;
    replace = null;
  }

  options = options || {};

  if (!utils.string(code)) code = '';
  if (!utils.string(options.word)) options.word = 'require';
  if (!new RegExp(`\\b${options.word}\\b`).test(code)) return { code, dependencies };
  if (!Array.isArray(options.flags)) options.flags = [];
  if (replace && !utils.fn(replace)) replace = null;

  // The handle function
  const handle = (node, flag) => {
    let update;
    const value = node.value;

    // Push dependencie in to array
    dependencies.push({
      flag: flag,
      path: value
    });

    // Replace code
    if (replace) {
      update = replace(value, flag);

      if (update && utils.string(update)) {
        update = utils.encode(update);
        code = code.substring(0, node.start + offset + 1) + update + code.substring(node.end + offset - 1);
        offset += update.length - value.length;
      }
    }
  };

  // Visit code
  visit(code, options.acorn, node => {
    if (isRequire(node, options.word, options.flags)) {
      let args = node.arguments;
      const property = node.callee.property;
      const flag = property ? property.name : null;

      // When arguments length > 0
      if (args.length) {
        args = args[0];

        if (args.type === 'Literal') {
          handle(args, flag);
        } else if (args.type === 'ArrayExpression') {
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
