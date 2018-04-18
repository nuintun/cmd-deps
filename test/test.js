/**
 * @module test
 * @license MIT
 * @version 2017/11/10
 */

'use strict';

const cdeps = require('../index');
const expect = require('chai').expect;

describe('get the right deps', () => {
  const code = 'require("a");require(\'b"\');require("c\\"")';
  const result = cdeps(code).dependencies;

  it('flag', () => {
    expect(result.map(o => o.flag)).to.eql([null, null, null]);
  });

  it('path', () => {
    expect(result.map(o => o.path)).to.eql(['a', 'b"', 'c"']);
  });

  it('use replace', () => {
    const code = 'require("a");require("b");';
    const result = cdeps(code, path => 'woot/' + path).code;

    expect(result).to.equal('require("woot/a");require("woot/b");');
  });

  it('reg & comment', () => {
    const code = '(1)/*\n*/ / require("a")';
    const result = cdeps(code).dependencies.map(o => o.path);

    expect(result).to.eql(['a']);
  });

  it('include async', () => {
    let code = 'require.async("a")';
    let result = cdeps(code, path => path + '1', { flags: ['async'] }).code;

    expect(result).to.equal('require.async("a1")');

    code = 'require["async"]("a");';
    result = cdeps(code, path => '1', { flags: ['async'] }).code;

    expect(result).to.equal('require["async"]("1");');

    code = 'require.async(["a", "b"]);';
    result = cdeps(code, path => '1', { flags: ['async'] }).code;

    expect(result).to.equal('require.async(["1", "1"]);');

    code = 'require["async"](["a", "b"]);';
    result = cdeps(code, path => '1', { flags: ['async'] }).code;

    expect(result).to.equal('require["async"](["1", "1"]);');
  });

  it('async flag', () => {
    const code = 'require.async("a")';
    const result = cdeps(code, { flags: ['async'] }).dependencies;

    expect(result[0].flag).to.equal('async');
  });

  it('custom flag', () => {
    const code = 'require.custom("a")';
    const result = cdeps(code, { flags: ['custom'] }).dependencies;

    expect(result[0].flag).to.equal('custom');
  });

  it('return', () => {
    const code = "return require('highlight.js').highlightAuto(code).value;";
    const result = cdeps(code, { acorn: { allowReturnOutsideFunction: true } }).dependencies;

    expect(result.length).to.equal(1);
  });

  it('callback', () => {
    const code = 'require.async("slider", function(){\nalert("loaded");\n});';
    const result = cdeps(code, { flags: ['async'] }).dependencies;

    expect(result.length).to.equal(1);
  });

  it('block & reg 1', () => {
    const code = '({}/require("a"))';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(1);
  });

  it('block & reg 2', () => {
    const code = 'return {}/require("a")';
    const result = cdeps(code, { acorn: { allowReturnOutsideFunction: true } }).dependencies;

    expect(result.length).to.equal(1);
  });

  it('block & reg 3', () => {
    const code = 'v={}/require("a")';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(1);
  });
});

describe('ignores', () => {
  it('in quote', () => {
    const code = '"require(\'a\')"';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('in comment', () => {
    const code = '//require("a")';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('in multi comment', () => {
    const code = '/*\nrequire("a")*/';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('in reg', () => {
    const code = '/require("a")/';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('in ifstmt with no {}', () => {
    const code = 'if(true)/require("a")/';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('in dostmt with no {}', () => {
    const code = 'do /require("a")/.test(code); while(false)';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('reg / reg', () => {
    const code = '/require("a")/ / /require("b")';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('ignore variable', () => {
    const code = 'require("a" + b)';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('unend string', () => {
    const code = 'require("a';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('unend comment', () => {
    const code = '/*';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('unend reg', () => {
    const code = '/abc';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('ignore async', () => {
    const code = 'require.async("a")';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('block & reg 1', () => {
    const code = '{}/require("a")/';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('block & reg 2', () => {
    const code = 'return\n{}/require("a")/';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('block & reg 3', () => {
    const code = '()=>{}/require("a")/';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('block & reg 4', () => {
    const code = '(1)\n{}/require("a")/';
    const result = cdeps(code).dependencies;

    expect(result.length).to.equal(0);
  });

  it('require /**/', () => {
    const code = 'require/**/("a")';
    const result = cdeps(code).dependencies.map(o => o.path);

    expect(result).to.eql(['a']);
  });

  it('require. /**/', () => {
    const code = 'require.async/**/("a")';
    const result = cdeps(code, { flags: ['async'] }).dependencies.map(o => o.path);

    expect(result).to.eql(['a']);
  });

  it('require /**/ .', () => {
    const code = 'require/**/.async("a")';
    const result = cdeps(code, { flags: ['async'] }).dependencies.map(o => o.path);

    expect(result).to.eql(['a']);
  });

  it('require /**/ . /**/', () => {
    const code = 'require/**/.async/**/("a")';
    const result = cdeps(code, { flags: ['async'] }).dependencies.map(o => o.path);

    expect(result).to.eql(['a']);
  });
});

describe('callback', () => {
  it('none', () => {
    const code = 'test("a")';
    const result = cdeps(code, () => '1').code;

    expect(result).to.equal(code);
  });

  it('one', () => {
    const code = 'require("a")';
    const result = cdeps(code, path => path + '1').code;

    expect(result).to.equal('require("a1")');
  });

  it('tow', () => {
    const code = 'require("a");require("b");';
    const result = cdeps(code, path => path + '1').code;

    expect(result).to.equal('require("a1");require("b1");');
  });

  it('same length as item', () => {
    const code = 'require("a");require("b");';
    const result = cdeps(code, () => '123456789012').code;

    expect(result).to.equal('require("123456789012");require("123456789012");');
  });
});
