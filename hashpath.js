define(function() {
  
  'use strict';
  
  var hashpath = {};
  
  function read() {
    var split = location.hash.replace(/^#/, '').split('?', 2);
    hashpath.parts = Object.freeze(split[0].split(/\/+/g).filter(function(part) {
      return (part !== '');
    }));
    var canonical = '/' + hashpath.parts.join('/');
    if (canonical !== '/') canonical += '/';
    hashpath.query = Object.create(null);
    location.search.replace(/^\?/, '').split(/&+/g).forEach(function(part) {
      if (part === '') return;
      var kv = part.split('=', 1);
      hashpath.query[kv[0]] = (kv.length === 1) ? true : kv[1];
    });
    if (split[1]) {
      split[1].split(/&+/g).forEach(function(part) {
        if (part === '') return;
        var kv = part.split('=', 1);
        hashpath.query[kv[0]] = (kv.length === 1) ? true : kv[1];
      });
    }
    Object.freeze(hashpath.query);
    var paramNames = Object.keys(hashpath.query);
    if (paramNames.length !== 0) {
      canonical += '?' + paramNames.map(function(paramName) {
        if (hashpath.query[paramName] === true) return paramName;
        return paramName + '=' + hashpath.query[paramName];
      });
    }
    var pathBase = './' + location.pathname.match(/[^\/]*$/);
    if (canonical !== location.hash || location.search !== '') {
      history.replaceState(undefined, undefined, pathBase + '#' + canonical);
    }
  }
  
  window.addEventListener('hashchange', read());
  
  read();
  
  return hashpath;
  
});
