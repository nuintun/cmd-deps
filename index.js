/**
 * Created by nuintun on 2015/4/29.
 */

'use strict';

var parser = require('./lib/parser');

// Parse dependencies
function parseDependencies(s, replace, async){
  if (replace === true) {
    async = true;
    replace = null;
  }

  if (s.indexOf('require') === -1) {
    return replace ? s : [];
  }

  var REQUIRERE = async
    ? /^require\s*(?:(?:\.\s*[a-zA-Z_$][\w$]*)|(?:\[\s*(['"]).*?\1\s*\]))?\s*\(\s*(?:['"]|\[)/
    : /^require\s*\(\s*['"]/;
  var FLAGRE = /^require\s*(?:(?:\.\s*([a-zA-Z_$][\w$]*))|(?:\[\s*(['"])(.*)?\2\s*\]))/;
  var CHAINRE = /^[\w$]+(?:\s*\.\s*[\w$]+)*/;

  var index = 0, peek = '', length = s.length, isReg = 1, isReturn = 0, meta = [];
  var parentheseState = 0, parentheseStack = [], braceState = 0, braceStack = [];
  var mod = '', modStart = 0, modEnd = 0, modName = 0, modParenthese = [], flag = null;

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
        index = s.indexOf('\n', index);

        if (index === -1) {
          index = s.length;
        }
      } else if (peek === '*') {
        var i = s.indexOf('\n', index);
        index = s.indexOf('*/', index);

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

          mod = s.substring(modStart, modEnd);

          if (replace) {
            var replaced = parser(mod, replace, { flag: flag });

            s = s.slice(0, modStart) + replaced + s.slice(modEnd);

            if (replaced.length != mod.length) {
              index = modStart + replaced.length;
              length = s.length;
            }
          } else {
            meta = meta.concat(parser(mod, { flag: flag }).meta);
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
      var next = s.charAt(index);

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

  return replace ? s : meta;

  function readch(){
    peek = s.charAt(index++);
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
    var end = s.indexOf(c, start);

    if (end === -1) {
      index = length;
    } else if (s.charAt(end - 1) !== '\\') {
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
    var s2 = s.slice(index - 1);
    var r = /^[\w$]+/.exec(s2)[0];

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
      modName = REQUIRERE.test(s2);
    }

    if (r === 'require' && modName) {
      modStart = index - 1;
      r = REQUIRERE.exec(s2)[0];
      index += r.length - 3;
      flag = FLAGRE.exec(s2);
      flag = flag ? flag[1] || flag[3] : null;
    } else {
      index += CHAINRE.exec(s2)[0].length - 1;
    }
  }

  function isNumber(){
    return /\d/.test(peek) || peek === '.' && /\d/.test(s.charAt(index));
  }

  function dealNumber(){
    var s2 = s.slice(index - 1);
    var r;

    if (peek === '.') {
      r = /^\.\d+(?:E[+-]?\d*)?\s*/i.exec(s2)[0];
    } else if (/^0x[\da-f]*/i.test(s2)) {
      r = /^0x[\da-f]*\s*/i.exec(s2)[0];
    } else {
      r = /^\d+\.?\d*(?:E[+-]?\d*)?\s*/i.exec(s2)[0];
    }

    index += r.length - 1;
    isReg = 0;
  }
}

module.exports = parseDependencies;