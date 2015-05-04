/**
 * Created by nuintun on 2015/5/4.
 */

'use strict';

var fs = require('fs'),
  parser = require('../'),
  code = fs.readFileSync('./cmd.js', { encoding: 'utf8' });

console.time('crequire');
var parsered = parser(code, true);
console.log(JSON.stringify(parsered, null, 2));
console.timeEnd('crequire');