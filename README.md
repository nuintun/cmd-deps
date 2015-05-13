umd-deps
=========

>Get cmd or amd dependences

>[![NPM Version][npm-image]][npm-url] [![Download Status][download-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Test Coverage][coveralls-image]][coveralls-url] [![Dependencies][david-image]][david-url]

### Installation
```
npm install umd-deps
```

### Api
* parseDependencies(code:String, callback:Function = null, flag:Boolean = false):String
* parseDependencies(code:String, flag:Boolean = false):Array
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
require.async('g');
require.async(['h']);
```

parser output:
```js
[
  {  
    "flag": null,
    "path": "a"
  },
  {  
    "flag": 'async',
    "path": "g"
  },
  {  
      "flag": 'async',
      "path": "h"
    }
]
```

## License

[MIT](LICENSE)

[travis-image]: http://img.shields.io/travis/Nuintun/umd-deps.svg?style=flat-square
[travis-url]: https://travis-ci.org/Nuintun/umd-deps
[coveralls-image]: http://img.shields.io/coveralls/Nuintun/umd-deps/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/Nuintun/umd-deps?branch=master
[david-image]: http://img.shields.io/david/nuintun/umd-deps.svg?style=flat-square
[david-url]: https://david-dm.org/Nuintun/umd-deps
[npm-image]: http://img.shields.io/npm/v/umd-deps.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/umd-deps
[download-image]: http://img.shields.io/npm/dm/umd-deps.svg?style=flat-square
