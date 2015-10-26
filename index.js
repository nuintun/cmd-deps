/**
 * Created by nuintun on 2015/4/29.
 */

'use strict';

// import lib
var util = require('./lib/util');
var parser = require('./lib/parser');

/**
 * cmd-deps
 * @param src
 * @param replace
 * @param async
 * @returns {String|Array}
 */
module.exports = function (src, replace, async){
  // is buffer
  if (Buffer.isBuffer(src)) src = src.toString();

  if (replace === true) {
    async = true;
    replace = undefined;
  }

  if (!util.string(src) || !/\brequire\b/.test(src)) {
    return replace ? src : [];
  }

  var REQUIRERE = async
    ? /^require\s*(?:(?:\.\s*[a-zA-Z_$][\w$]*)|(?:\[\s*(['"]).*?\1\s*\]))?\s*\(\s*(?:['"]|\[)/
    : /^require\s*\(\s*['"]/;
  var FLAGRE = /^require\s*(?:(?:\.\s*([a-zA-Z_$][\w$]*))|(?:\[\s*(['"])(.*?)\2\s*\]))/;
  var CHAINRE = /^[\w$]+(?:\s*\.\s*[\w$]+)*/;

  var index = 0;
  var peek = '';
  var length = src.length;
  var isReg = 1;
  var isReturn = 0;
  var deps = [];
  var parentheseState = 0;
  var parentheseStack = [];
  var braceState = 0;
  var braceStack = [];
  var mod = '';
  var modStart = 0;
  var modEnd = 0;
  var modName = 0;
  var modParenthese = [];
  var flag = null;

  while (index < length) {
    readch();

    if (isBlank()) {
      if (isReturn && (peek === '\n' || peek === '\r')) {
        braceState = 0;
        isReturn = 0;
      }
    } else if (isQuote()) {
      dealQuote();

      isReg = 1;
      isReturn = 0;
      braceState = 0;
    } else if (peek === '/') {
      readch();

      if (peek === '/') {
        index = src.indexOf('\n', index);

        if (index === -1) {
          index = src.length;
        }
      } else if (peek === '*') {
        var i = src.indexOf('\n', index);
        index = src.indexOf('*/', index);

        if (index === -1) {
          index = length;
        } else {
          index += 2;
        }

        if (isReturn && i !== -1 && i < index) {
          braceState = 0;
          isReturn = 0;
        }
      } else if (isReg) {
        dealReg();

        isReg = 0;
        isReturn = 0;
        braceState = 0;
      } else {
        index--;
        isReg = 1;
        isReturn = 0;
        braceState = 1;
      }
    } else if (isWord()) {
      dealWord();
    } else if (isNumber()) {
      dealNumber();

      isReturn = 0;
      braceState = 0;
    } else if (peek === '(') {
      parentheseStack.push(parentheseState);

      isReg = 1;
      isReturn = 0;
      braceState = 1;

      if (modName) {
        modParenthese.push(index);
      }
    } else if (peek === ')') {
      isReg = parentheseStack.pop();
      isReturn = 0;
      braceState = 0;

      if (modName) {
        modParenthese.pop();

        if (!modParenthese.length) {
          modName = 0;
          modEnd = index;

          mod = src.substring(modStart, modEnd);

          if (replace) {
            var replaced = parser(mod, replace, { flag: flag });

            src = src.slice(0, modStart) + replaced + src.slice(modEnd);

            if (replaced.length !== mod.length) {
              index = modStart + replaced.length;
              length = src.length;
            }
          } else {
            deps = deps.concat(parser(mod, { flag: flag }));
          }
        }
      }
    } else if (peek === '{') {
      if (isReturn) {
        braceState = 1;
      }

      braceStack.push(braceState);

      isReturn = 0;
      isReg = 1;
    } else if (peek === '}') {
      braceState = braceStack.pop();

      isReg = !braceState;
      isReturn = 0;
    } else {
      var next = src.charAt(index);

      if (peek === ';') {
        braceState = 0;
      } else if (peek === '-' && next === '-' || peek === '+' && next === '+' || peek === '=' && next === '>') {
        braceState = 0;
        index++;
      } else {
        braceState = 1;
      }

      isReg = peek !== ']';
      isReturn = 0;
    }
  }

  return replace ? src : deps;

  function readch(){
    peek = src.charAt(index++);
  }

  function isBlank(){
    return /\s/.test(peek);
  }

  function isQuote(){
    return peek === '"' || peek === "'";
  }

  function dealQuote(){
    var start = index;
    var c = peek;
    var end = src.indexOf(c, start);

    if (end === -1) {
      index = length;
    } else if (src.charAt(end - 1) !== '\\') {
      index = end + 1;
    } else {
      while (index < length) {
        readch();

        if (peek === '\\') {
          index++;
        } else if (peek === c) {
          break;
        }
      }
    }
  }

  function dealReg(){
    index--;

    while (index < length) {
      readch();

      if (peek === '\\') {
        index++;
      } else if (peek === '/') {
        break;
      } else if (peek === '[') {
        while (index < length) {
          readch();

          if (peek === '\\') {
            index++;
          } else if (peek === ']') {
            break;
          }
        }
      }
    }
  }

  function isWord(){
    return /[a-z_$]/i.test(peek);
  }

  function dealWord(){
    var substr = src.slice(index - 1);
    var r = /^[\w$]+/.exec(substr)[0];

    parentheseState = {
      'if': 1,
      'for': 1,
      'while': 1,
      'with': 1
    }[r];
    isReg = {
      'break': 1,
      'case': 1,
      'continue': 1,
      'debugger': 1,
      'delete': 1,
      'do': 1,
      'else': 1,
      'false': 1,
      'if': 1,
      'in': 1,
      'instanceof': 1,
      'return': 1,
      'typeof': 1,
      'void': 1
    }[r];
    isReturn = r === 'return';
    braceState = {
      'instanceof': 1,
      'delete': 1,
      'void': 1,
      'typeof': 1,
      'return': 1
    }.hasOwnProperty(r);

    if (r === 'require') {
      modName = REQUIRERE.test(substr);
    }

    if (r === 'require' && modName) {
      modStart = index - 1;
      r = REQUIRERE.exec(substr)[0];
      index += r.length - 3;
      flag = FLAGRE.exec(substr);
      flag = flag ? flag[1] || flag[3] : null;
    } else {
      index += CHAINRE.exec(substr)[0].length - 1;
    }
  }

  function isNumber(){
    return /\d/.test(peek) || peek === '.' && /\d/.test(src.charAt(index));
  }

  function dealNumber(){
    var r;
    var substr = src.slice(index - 1);

    if (peek === '.') {
      r = /^\.\d+(?:E[+-]?\d*)?\s*/i.exec(substr)[0];
    } else if (/^0x[\da-f]*/i.test(substr)) {
      r = /^0x[\da-f]*\s*/i.exec(substr)[0];
    } else {
      r = /^\d+\.?\d*(?:E[+-]?\d*)?\s*/i.exec(substr)[0];
    }

    index += r.length - 1;
    isReg = 0;
  }
};
