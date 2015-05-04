/**
 * Created by nuintun on 2015/4/29.
 */

'use strict';

define(function (require, exports, module){
  var fork = 'pause',
    path = require('{{path}}'),
    jquery = require('jquery');

  require.async('sizzle');
  require['async']('zepto', function (){
    // comments
  });
  require.async(['start', fork, 'stop']);
  require.async(fork ? 'fork' : 'unfork');
});

function ancestor(node, visitors, base, state){
  if (!base) base = exports.base;
  if (!state) state = [];
  (function c(node, st, override){
    var type = override || node.type,
      found = visitors[type];
    if (node != st[st.length - 1]) {
      st = st.slice();
      st.push(node);
    }
    base[type](node, st, c);
    if (found) found(node, st);
  })(node, state);
}
