# cmd-deps
=========

>Get commonjs dependences

>[![NPM Version][npm-image]][npm-url] [![Download Status][download-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Test Coverage][coveralls-image]][coveralls-url] [![Dependencies][david-image]][david-url]

### Installation
```
npm install cmd-deps
```

### Api
* parseDependencies(code:String, callback:Function = null, flag:Boolean = false):String
* parseDependencies(code:String, flag:Boolean = false):String
  * flag means if use "require.async" like, the result should have a property "flag" of "async"

### Example
js:
```js
require('a');
//require('b');
/require('c')/;
'require("d")';
if(true)/require('e')/;
do /require('f')/.test(s); while(false);
```
parser output:
```js
{
  "path": "a",
  "flag": null
}
```

## License

[MIT](LICENSE)

[travis-image]: http://img.shields.io/travis/Nuintun/cmd-deps.svg?style=flat-square
[travis-url]: https://travis-ci.org/Nuintun/cmd-deps
[coveralls-image]: http://img.shields.io/coveralls/Nuintun/cmd-deps/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/Nuintun/cmd-deps?branch=master
[david-image]: http://img.shields.io/david/nuintun/cmd-deps.svg?style=flat-square
[david-url]: https://david-dm.org/Nuintun/cmd-deps
[npm-image]: http://img.shields.io/npm/v/cmd-deps.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/cmd-deps
[download-image]: http://img.shields.io/npm/dm/cmd-deps.svg?style=flat-square