define(function() {
  
  'use strict';
  
  var hashpath = {};
  
  function read() {
    var path = location.hash.match(/^#?\/*([^?]*?)(?:\?&*(.*?)&*)?$/);
    var query = path[2];
    path = path[1];
    hashpath.parts = Object.freeze(path.split(/\/+/g));
    hashpath.full = '/' + hashpath.parts.join('/');
    if (hashpath.parts.slice(-1)[0] === '') {
      hashpath.parts.length--;
    }
    var canonical = '#' + hashpath.full;
    hashpath.query = Object.create(null);
    if (query) {
      query.split(/&+/g).forEach(function(part) {
        var kv = part.split('=');
        hashpath.query[kv[0]] = (kv.length === 1) ? true : kv.slice(1).join('=');
      });
    }
    Object.freeze(hashpath.query);
    var paramNames = Object.keys(hashpath.query);
    if (paramNames.length !== 0) {
      canonical += '?' + paramNames.map(function(paramName) {
        if (hashpath.query[paramName] === true) return paramName;
        return paramName + '=' + hashpath.query[paramName];
      }).join('&');
    }
    if (canonical !== location.hash) {
      history.replaceState(undefined, undefined, canonical);
    }
  }
  
  Object.defineProperty(hashpath, 'folderMode', {
    get: function() {
      return /^[^?]*\/(\?|$)/.test(location.hash);
    },
    set: function(v) {
      history.replaceState(
        undefined,
        undefined,
        location.hash.replace(/^#\/([^?]*?)\/?(\?.*)?$/, v ? '$1/$2' : '$1$2');
    },
  });
  
  window.addEventListener('hashchange', read);
  
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
