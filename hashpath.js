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
  
  function encodePath() {
    var parts = hashpath.parts;
    var query = hashpath.query;
    for (var i = 0; i < arguments.length; i++) {
      if (Array.isArray(arguments[i])) {
        parts = arguments[i];
      }
      else if (typeof arguments[i] === 'object' && arguments[i] !== null) {
        query = arguments[i];
      }
    }
    var encoded = '/' + parts.join('/');
    if (encoded !== '/') encoded += '/';
    var paramNames = Object.keys(query);
    if (paramNames.length !== 0) {
      encoded += '?' + paramNames.map(function(paramName) {
        if (query[paramName] === true) return paramName;
        return paramName = '=' + query[paramName];
      });
    }
    return encoded;
  }
  
  hashpath.navigate = function() {
    location.hash = '#' + encodePath.apply(null, arguments);
  };
  
  hashpath.setCanonical = function() {
    history.replaceState(undefined, undefined, '#' + encodePath.apply(null, arguments));
  };
  
  return hashpath;
  
});
