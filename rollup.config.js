/**
 * @module rollup
 * @license MIT
 * @version 2017/10/24
 */

'use strict';

import pkg from './package.json';

const banner = `/**
 * @module ${pkg.name}
 * @author ${pkg.author.name}
 * @license ${pkg.license}
 * @version ${pkg.version}
 * @description ${pkg.description}
 * @see ${pkg.homepage}
 */
`;

export default {
  input: 'src/index.js',
  output: {
    banner,
    strict: true,
    indent: true,
    format: 'cjs',
    interop: false,
    exports: 'auto',
    esModule: false,
    file: 'index.js',
    preferConst: true
  },
  external: ['acorn', 'acorn-walk']
};
