# cmd-deps

> Transform cmd and get cmd dependences
>
> [![NPM Version][npm-image]][npm-url]
> [![Download Status][download-image]][npm-url]
> [![Linux Status][travis-image]][travis-url]
> [![Windows Status][appveyor-image]][appveyor-url]
> [![Test Coverage][coveralls-image]][coveralls-url]
> [![Dependencies][david-image]][david-url]

### Installation

```
npm install cmd-deps
```

### Api

* parseDependencies(code:String, options:Object):Object
* parseDependencies(code:String, replace:Function, options:Object):Object

### Example

source:

```js
require('a');
//require('b');
/require('c')/;
('require("d")');
if (true) /require('e')/;
do /require('f')/.test(s);
while (false);
require.async('g');
require.async(['h']);
```

js:

```js
const parseDependencies = require('cmd-deps');
const dependencies = parseDependencies(source, { flags: ['async'] }).dependencies;

// print dependencies
console.log(dependencies);
```

parser output:

```js
[
  {
    flag: null,
    path: 'a'
  },
  {
    flag: 'async',
    path: 'g'
  },
  {
    flag: 'async',
    path: 'h'
  }
];
```

## License

[MIT](LICENSE)

[travis-image]: http://img.shields.io/travis/nuintun/cmd-deps.svg?style=flat-square&label=linux
[travis-url]: https://travis-ci.org/nuintun/cmd-deps
[appveyor-image]: https://img.shields.io/appveyor/ci/nuintun/cmd-deps.svg?style=flat-square&label=windows
[appveyor-url]: https://ci.appveyor.com/project/nuintun/cmd-deps
[coveralls-image]: http://img.shields.io/coveralls/nuintun/cmd-deps/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/nuintun/cmd-deps?branch=master
[david-image]: http://img.shields.io/david/nuintun/cmd-deps.svg?style=flat-square
[david-url]: https://david-dm.org/nuintun/cmd-deps
[npm-image]: http://img.shields.io/npm/v/cmd-deps.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/cmd-deps
[download-image]: http://img.shields.io/npm/dm/cmd-deps.svg?style=flat-square
