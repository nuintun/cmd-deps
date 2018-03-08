/**
 * @module test
 * @license MIT
 * @version 2017/11/10
 */

'use strict';

const cdeps = require('../index');
const expect = require('chai').expect;
const parser = require('../lib/parser');

describe('inside parser', () => {
  const s = 'require.async("a")';

  it('second argument is object', () => {
    const res = parser(s, { flags: ['async'] });

    expect(res.map(o => o.flag)).to.eql(['async']);
    expect(res.map(o => o.path)).to.eql(['a']);
  });
});

describe('get the right deps', () => {
  const s = 'require("a");require(\'b"\');require("c\\"")';
  const res = cdeps(s);

  it('flag', () => {
    expect(res.map(o => o.flag)).to.eql([null, null, null]);
  });

  it('path', () => {
    expect(res.map(o => o.path)).to.eql(['a', 'b"', 'c"']);
  });

  it('use replace', () => {
    const s = 'require("a");require("b");';
    const res = cdeps(s, path => 'woot/' + path);

    expect(res).to.equal('require("woot/a");require("woot/b");');
  });

  it('reg & comment', () => {
    const s = '(1)/*\n*/ / require("a")';
    const res = cdeps(s, true).map(o => o.path);

    expect(res).to.eql(['a']);
  });

  it('include async', () => {
    let s = 'require.async("a")';
    let res = cdeps(s, path => path + '1', true);

    expect(res).to.equal('require.async("a1")');

    s = 'require["async"]("a");';
    res = cdeps(s, () => '1', true);

    expect(res).to.equal('require["async"]("1");');

    s = 'require.async(["a", "b"]);';
    res = cdeps(s, () => '1', true);

    expect(res).to.equal('require.async(["1", "1"]);');

    s = 'require["async"](["a", "b"]);';
    res = cdeps(s, () => '1', true);

    expect(res).to.equal('require["async"](["1", "1"]);');
  });

  it('async flag', () => {
    const s = 'require.async("a")';
    const res = cdeps(s, true);

    expect(res[0].flag).to.equal('async');
  });

  it('custom flag', () => {
    const s = 'require.custom("a")';
    const res = cdeps(s, ['custom']);

    expect(res[0].flag).to.equal('custom');
  });

  it('return', () => {
    const s = "return require('highlight.js').highlightAuto(code).value;";
    const res = cdeps(s);

    expect(res.length).to.equal(1);
  });

  it('callback', () => {
    const s = 'require.async("slider", function(){\nalert("loaded");\n});';
    const res = cdeps(s, true);

    expect(res.length).to.equal(1);
  });

  it('block & reg 1', () => {
    const s = '({}/require("a"))';
    const res = cdeps(s);

    expect(res.length).to.equal(1);
  });

  it('block & reg 2', () => {
    const s = 'return {}/require("a")';
    const res = cdeps(s);

    expect(res.length).to.equal(1);
  });

  it('block & reg 3', () => {
    const s = 'v={}/require("a")';
    const res = cdeps(s);

    expect(res.length).to.equal(1);
  });
});

describe('ignores', () => {
  it('in quote', () => {
    const s = '"require(\'a\')"';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('in comment', () => {
    const s = '//require("a")';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('in multi comment', () => {
    const s = '/*\nrequire("a")*/';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('in reg', () => {
    const s = '/require("a")/';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('in ifstmt with no {}', () => {
    const s = 'if(true)/require("a")/';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('in dostmt with no {}', () => {
    const s = 'do /require("a")/.test(s); while(false)';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('reg / reg', () => {
    const s = '/require("a")/ / /require("b")';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('ignore variable', () => {
    const s = 'require("a" + b)';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('unend string', () => {
    const s = 'require("a';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('unend comment', () => {
    const s = '/*';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('unend reg', () => {
    const s = '/abc';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('ignore async', () => {
    const s = 'require.async("a")';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('block & reg 1', () => {
    const s = '{}/require("a")/';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('block & reg 2', () => {
    const s = 'return\n{}/require("a")/';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('block & reg 3', () => {
    const s = '()=>{}/require("a")/';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('block & reg 4', () => {
    const s = '(1)\n{}/require("a")/';
    const res = cdeps(s);

    expect(res.length).to.equal(0);
  });

  it('require /**/', () => {
    const s = 'require/**/("a")';
    const res = cdeps(s, true).map(o => o.path);

    expect(res).to.eql(['a']);
  });

  it('require. /**/', () => {
    const s = 'require.async/**/("a")';
    const res = cdeps(s, true).map(o => o.path);

    expect(res).to.eql(['a']);
  });

  it('require /**/ .', () => {
    const s = 'require/**/.async("a")';
    const res = cdeps(s, true).map(o => o.path);

    expect(res).to.eql(['a']);
  });

  it('require /**/ . /**/', () => {
    const s = 'require/**/.async/**/("a")';
    const res = cdeps(s, true).map(o => o.path);

    expect(res).to.eql(['a']);
  });
});

describe('callback', () => {
  it('none', () => {
    const s = 'test("a")';
    const res = cdeps(s, () => {
      return '1';
    });

    expect(res).to.equal(s);
  });

  it('one', () => {
    const s = 'require("a")';
    const res = cdeps(s, path => path + '1');

    expect(res).to.equal('require("a1")');
  });

  it('tow', () => {
    const s = 'require("a");require("b");';
    const res = cdeps(s, path => path + '1');

    expect(res).to.equal('require("a1");require("b1");');
  });

  it('same length as item', () => {
    const s = 'require("a");require("b");';
    const res = cdeps(s, () => '123456789012');

    expect(res).to.equal('require("123456789012");require("123456789012");');
  });
});
