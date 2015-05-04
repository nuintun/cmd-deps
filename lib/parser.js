/**
 * Created by nuintun on 2015/5/4.
 */

'use strict';

var aparse = require('acorn').parse;
var escodegen = require('escodegen');

function noop(){}

function defined(){
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] !== undefined) return arguments[i];
  }
}

function parse(src, opts){
  if (!opts) opts = {};

  return aparse(src, {
    ecmaVersion: defined(opts.ecmaVersion, 6),
    ranges: defined(opts.ranges, opts.range),
    locations: defined(opts.locations, opts.loc),
    allowReturnOutsideFunction: defined(opts.allowReturnOutsideFunction, true),
    strictSemicolons: defined(opts.strictSemicolons, false),
    allowTrailingCommas: defined(opts.allowTrailingCommas, true),
    forbidReserved: defined(opts.forbidReserved, false)
  });
}

function traverse(node, cb){
  if (Array.isArray(node)) {
    node.forEach(function (item){
      if (item != null) {
        traverse(item, cb);
      }
    });
  } else if (node && typeof node === 'object') {
    cb(node);

    Object.keys(node).forEach(function (key){
      if (node[key]) {
        traverse(node[key], cb);
      }
    });
  }
}

function walk(src, opts, cb){
  var ast = parse(src, opts);

  traverse(ast, cb);

  return ast;
}

function isRequire(node, word, flag){
  if (node.type === 'CallExpression') {
    node = node.callee;

    if (flag && node.type === 'MemberExpression') {
      return node.object.type === 'Identifier' && node.object.name === word
        && ((node.property.type === 'Identifier' && node.property.name === flag)
        || (node.property.type === 'Literal' && node.property.value === flag))
    } else {
      return node.type === 'Identifier' && node.name === word;
    }
  }
}

module.exports = function (src, replace, opts){
  var modules = { meta: [], expressions: [] };

  if (typeof replace === 'object' && !Array.isArray(replace)) {
    opts = replace;
    replace = undefined;
  }

  opts = opts || {};
  opts.parse = opts.parse || {};
  opts.parse.tolerant = true;

  if (typeof src !== 'string') src = src + '';
  if (typeof opts.word !== 'string') opts.word = 'require';
  if (opts.nodes) modules.nodes = [];
  if (src.indexOf(opts.word) == -1) return modules;
  if (replace && typeof replace !== 'function') replace = noop();

  var ast = walk(src, opts.parse, function (node){
    if (isRequire(node, opts.word, opts.flag)) {
      var args = node['arguments'];
      var flag = node.callee.property ? opts.flag : null;

      var handle = function (node){
        modules.meta.push({
          flag: flag,
          path: node.value
        });

        if (replace) node.value = replace(node.value, opts.flag);
      };

      if (args.length) {
        args = args[0];

        if (args.type === 'Literal') {
          handle(args);
        } else if (args.type === 'ArrayExpression') {
          args.elements.forEach(function (args){
            if (args.type === 'Literal') {
              handle(args);
            } else {
              modules.expressions.push(escodegen.generate(args));
            }
          });
        } else {
          modules.expressions.push(escodegen.generate(args));
        }
      }

      if (opts.nodes) modules.nodes.push(node);
    }
  });

  return replace ? escodegen.generate(ast) : modules;
};