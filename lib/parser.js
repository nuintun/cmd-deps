/**
 * Created by nuintun on 2015/5/4.
 */

'use strict';

// import lib
var util = require('./util');
var acorn = require('acorn');

// the parse function
function parse(src, options){
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

// executes visitor on the object and its children (recursively).
function traverse(object, visitor){
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

// the tree walk function
function walk(src, options, callback){
  var syntax;

  // parse ast
  try {
    syntax = parse(src, options);
  } catch (error) {
    // parse ast wrong, do nothing
  }

  // if parse success
  if (syntax) {
    traverse(syntax, callback);
  }

  return syntax;
}

// the is require function
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

/**
 * exports module
 */
module.exports = function (src, replace, options){
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
  if (replace && !util.fn(replace)) replace = util.noop;

  // the handle function
  var handle = function (node, flag){
    var update;
    var value = node.value;

    // push deps in to array
    deps.push({
      flag: flag,
      path: value
    });

    // replace code
    if (replace) {
      update = replace(value, flag);

      if (util.string(update)) {
        src = src.substring(0, node.start + offset + 1) + update + src.substring(node.end + offset - 1);
        offset += update.length - value.length;
      }
    }
  };

  // walk code
  walk(src, options.parse, function (node){
    if (isRequire(node, options.word, options.flag)) {
      var args = node.arguments;
      var flag = node.callee.property ? options.flag : null;

      // when arguments length > 0
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

  return replace ? src : deps;
};
