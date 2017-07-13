requirejs(['domReady!', 'ia'], function(domReady, ia) {

  'use strict';
  
  function regexEscape(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  }
  
  if (/\/index\.html$/i.test(location.pathname)) {
    history.replaceState(undefined, undefined, './' + location.hash);
  }
  
  function loadWhile(promise) {
    document.body.classList.add('loading');
    return Promise.resolve(promise)
    .then(function(result) {
      document.body.classList.remove('loading');
      return result;
    },
    function(r) {
      document.body.classList.remove('loading');
      return Promise.reject(r);
    });
  }
  
  function loadHash() {
    var parts = location.hash.replace(/^#/, '').split('?', 2);
    var pathParts = parts[0].split('/').filter(function(v) { return !!v; });
    var params = Object.create(null);
    if (parts[1]) {
      parts[1].split('&').forEach(function(param) {
        var pair = param.split('=', 2);
        params[pair[0]] = pair.length === 1 ? true : pair[1];
      });
    }
    console.log(pathParts, params);
    
    if (pathParts.length === 0 || !/^[a-zA-Z0-9_\.\-]+$/.test(pathParts[0])) {
      hash = localStorage.getItem('lastValidHash') || '#/amigaformat045disk_1993-04/';
      history.replaceState(undefined, undefined, hash);
      loadHash();
      return;
    }
    
    loadWhile(ia.getItemRecord(pathParts[0]).then(function(itemRecord) {
      if (itemRecord === null) {
        return ia.normalizeItemName(pathParts[0])
        .then(function(normalized) {
          if (normalized === null) {
            document.body.classList.add('notfound');
            return;
          }
          pathParts[0] = normalized;
          history.replaceState(undefined, undefined, '#/' + pathParts.map(function(v) { return v + '/'; }));
          loadHash();
        });
      }
      document.getElementById('title').innerText = itemRecord.title || itemRecord.identifier;
      console.log(itemRecord);
      document.body.classList.remove('notfound');
    }));
    
    return;
    
    var hash = (location.hash || '').match(/^#?\/?([a-zA-Z0-9_\-\.]+)\/?(.*?)\/?$/);
    if (!hash) {
      hash = localStorage.getItem('lastValidHash') || '#/amigaformat045disk_1993-04/';
      history.replaceState(undefined, undefined, hash);
      hash = hash.match(/^#?\/?([a-zA-Z0-9_\-\.]+)\/?(.*?)\/?$/);
    }
    localStorage.setItem('lastValidHash', '#/' + hash[1] + '/' + (hash[2] ? hash[2] + '/' : ''));
    var itemName = hash[1];
    var fileContainer = document.getElementById('files');
    while (fileContainer.lastChild) fileContainer.removeChild(fileContainer.lastChild);
    var sensitive, insensitive;
    if (!hash[2]) {
      sensitive = insensitive = /^()(.*)$/;
    }
    else {
      sensitive = new RegExp('^(' + hash[2] + '/)(.+)$');
      insensitive = new RegExp('^(' + hash[2] + '/)(.+)$', 'i');
    }
    var subfolders = Object.create(null);
    document.body.classList.add('loading');
    ia.getFileRecords(itemName).then(function(files) {
      var insensitiveMatch;
      files.forEach(function(fileInfo) {
        var sensitiveMatch = fileInfo.name.match(sensitive);
        if (!sensitiveMatch) {
          insensitiveMatch = insensitiveMatch || fileInfo.name.match(insensitive);
          return;
        }
        var subIndex = sensitiveMatch[2].indexOf('/');
        if (subIndex !== -1) {
          var subfolder = sensitiveMatch[2].slice(0, subIndex);
          if (!(subfolder in subfolders)) {
            subfolders[subfolder] = true;
            var element = document.createElement('A');
            element.setAttribute('href', '#/' + itemName + '/' + sensitiveMatch[1] + subfolder + '/');
            element.className = 'file folder';
            element.innerText = subfolder;
            fileContainer.appendChild(element);
          }
          return;
        }
        var element = document.createElement('A');
        element.setAttribute('href', ia.getLinkURL(itemName, fileInfo.name));
        // element.setAttribute('href', '#/' + itemName + '/' + fileInfo.name);
        element.className = 'file';
        Object.assign(element.dataset, fileInfo);
        element.innerText = sensitiveMatch[2];
        fileContainer.appendChild(element);
      });
      if (!fileContainer.firstElementChild && insensitiveMatch) {
        history.replaceState(undefined, undefined, '#/' + itemName + '/' + insensitiveMatch[1]);
        loadHash();
      }
      else {
        document.body.classList.remove('loading');
      }
    },
    function(reason) {
      document.body.classList.remove('loading');
    });
  }
  window.addEventListener('hashchange', loadHash);
  loadHash();
  
  document.getElementById('back').onclick = function(e) {
    var hash = location.hash.match(/^(#.+\/)[^/]+\/?$/);
    if (hash) {
      location.hash = hash[1];
      return;
    }
    var itemName = location.hash.match(/^#\/?([^\/]+)\/?$/);
    if (itemName) {
      document.body.classList.add('loading');
      ia.getItemRecord(itemName[1]).then(function(item) {
        document.body.classList.remove('loading');
        var collection = item.collection;
        if (Array.isArray(collection)) collection = collection[0];
        if (collection) location.hash = '#/' + collection + '/';
      });
    }
  };
  
});
