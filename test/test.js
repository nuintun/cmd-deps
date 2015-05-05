var cmdDeps = require('../');
var expect = require('expect.js');

describe('get the right deps', function (){
  var s = 'var RE=/[\\\\]/,str="\\\\"||"[\\\\]"||"/*";require("a");require(\'b"\');require("c\\"");';
  var res = cmdDeps(s);

  it('path', function (){
    expect(res.map(function (o){
      return o.path;
    })).to.eql(['a', 'b"', 'c"']);
  });

  it('use replace', function (){
    var s = 'require("a");require("b");var num=0||.7e+7||7.7e+7||0xff;/*';
    var res = cmdDeps(s, function (path){
      return 'woot/' + path;
    });

    expect(res).to.eql('require("woot/a");require("woot/b");var num=0||.7e+7||7.7e+7||0xff;/*');
  });

  it('reg & comment', function (){
    var s = '(1)/*\n*/ / require("a");return/*\nreturn*/;return/\\/;';
    var res = cmdDeps(s, true).map(function (o){
      return o.path;
    });

    expect(res).to.eql(["a"]);
  });

  it('include async', function (){
    var s = 'require.async("a");';
    var res = cmdDeps(s, function (){
      return '1';
    }, true);

    expect(res).to.eql('require.async("1");');

    s = 'require["async"]("a");';
    res = cmdDeps(s, function (){
      return '1';
    }, true);

    expect(res).to.eql('require["async"]("1");');

    s = 'require.async(["a", "b"]);';
    res = cmdDeps(s, function (){
      return '1';
    }, true);

    expect(res).to.eql('require.async(["1", "1"]);');

    s = 'require["async"](["a", "b"]);';
    res = cmdDeps(s, function (){
      return '1';
    }, true);

    expect(res).to.eql('require["async"](["1", "1"]);');
  });

  it('async flag', function (){
    var s = 'require.async("a");';
    var res = cmdDeps(s, function (path, flag){
      return flag;
    }, true);

    expect(res).to.eql('require.async("async");');
  });

  it('custom flag', function (){
    var s = 'require.custom("a");';
    var res = cmdDeps(s, function (path, flag){
      return flag;
    }, true);

    expect(res).to.eql('require.custom("custom");');
  });

  it('return', function (){
    var s = "return require('highlight.js').highlightAuto(code).value;";
    var res = cmdDeps(s);

    expect(res.length).to.eql(1);
  });

  it('callback', function (){
    var s = 'require.async("slider", function(){\nalert("loaded");\n});';
    var res = cmdDeps(s, true);

    expect(res.length).to.eql(1);
  });

  it('block & reg 1', function (){
    var s = '({}/require("a"))';
    var res = cmdDeps(s);

    expect(res.length).to.eql(1);
  });

  it('block & reg 2', function (){
    var s = 'return {}/require("a");';
    var res = cmdDeps(s);

    expect(res.length).to.eql(1);
  });

  it('block & reg 3', function (){
    var s = 'v={}/require("a");';
    var res = cmdDeps(s);

    expect(res.length).to.eql(1);
  });
});

describe('ignores', function (){
  it('in quote', function (){
    var s = '"require(\'a\')"';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('in comment', function (){
    var s = '//require("a")';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('in multi comment', function (){
    var s = '/*\nrequire("a")*/';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('in reg', function (){
    var s = '/require("a")/';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('in ifstmt with no {}', function (){
    var s = 'if(true)/require("a")/;';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('in dostmt with no {}', function (){
    var s = 'do /require("a")/.test(s); while(false);';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('reg / reg', function (){
    var s = '/require("a")/ / /require("b")/;';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('ignore variable', function (){
    var s = 'require("a" + b);';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('unend string', function (){
    var s = 'require("a';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('unend comment', function (){
    var s = '/*';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('unend reg', function (){
    var s = '/abc';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('ignore async', function (){
    var s = 'require.async("a");';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('block & reg 1', function (){
    var s = '{}/require("a")/;';
    var res = cmdDeps(s);
    expect(res.length).to.eql(0);
  });

  it('block & reg 2', function (){
    var s = 'return\n{}/require("a")/;';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('block & reg 3', function (){
    var s = '()=>{}/require("a")/;';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });

  it('block & reg 4', function (){
    var s = '(1)\n{}/require("a")/;';
    var res = cmdDeps(s);

    expect(res.length).to.eql(0);
  });
});

describe('callback', function (){
  it('none', function (){
    var s = 'test("a");';
    var res = cmdDeps(s, function (){
      return '1';
    });

    expect(res).to.eql(s);
  });

  it('one', function (){
    var s = 'require("a");';
    var res = cmdDeps(s, function (){
      return '1';
    });

    expect(res).to.eql('require("1");');
  });

  it('two', function (){
    var s = 'require("a");require("b");';
    var res = cmdDeps(s, function (path){
      return 'root/' + path;
    });

    expect(res).to.eql('require("root/a");require("root/b");');
  });

  it('same length as item', function (){
    var s = 'require("a");require("b");';
    var res = cmdDeps(s, function (){
      return '123456789012';
    });

    expect(res).to.eql('require("123456789012");require("123456789012");');
  });
});