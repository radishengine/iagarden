
requirejs.config({
  waitSeconds: 0, // no timeout
});

var normalizedPath = location.pathname.replace(/\/index\.html$/i, '/');
var normalizedHash = location.hash;
var normalizedQuery = location.search || '?';
var hashQueryPos = normalizedHash.indexOf('?');
if (hashQueryPos !== -1) {
  normalizedQuery += (normalizedQuery.length > 1 ? '&' : '') + normalizedHash.slice(hashQueryPos + 1);
  normalizedHash = normalizedHash.slice(0, hashQueryPos);
}
normalizedHash = normalizedHash.replace(/^#?$/, '#/');
if (normalizedQuery === '?') normalizedQuery = '';

history.replaceState(undefined, undefined, normalizedPath + normalizedHash + normalizedQuery);

requirejs(['domReady!', 'ia', 'hashpath'], function(domReady, ia, hashpath) {

  'use strict';
  
  function regexEscape(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
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
  
  function activate(activateMe) {
    if (typeof activateMe === 'string') {
      var el = document.getElementById(activateMe);
      if (!el) return;
      activateMe = el;
    }
    var articles = document.querySelectorAll('body > article');
    var found = false;
    for (var i = 0; i < articles.length; i++) {
      if (articles[i] === activateMe) {
        articles[i].classList.add('active');
        found = true;
      }
      else {
        articles[i].classList.remove('active');
      }
    }
    if (!found) {
      document.getElementById('/!404/').classList.add('active');
    }
  }
  
  function strOrArrayContains(sOrA, needle) {
    if (sOrA === needle) return true;
    if (!Array.isArray(needle)) return false;
    return sOrA.indexOf(needle) !== -1;
  }
  
  function initCollection(itemRecord) {
    var fileContainer = document.getElementById('files');
    fileContainer.innerHTML = '';
    return ia.getCollectionItems(itemRecord.identifier)
    .then(function(results) {
      for (var i = 0; i < results.length; i++) {
        var element = document.createElement('A');
        element.setAttribute('href', '#/' + results[i].identifier + '/');
        element.className = 'file folder item';
        element.innerText = results[i].identifier;
        fileContainer.appendChild(element);
      }
    });
  }
  
  function initItem(itemRecord) {
    var fileContainer = document.getElementById('files');
    fileContainer.innerHTML = '';
    return ia.getFileRecords(itemRecord.identifier)
    .then(function(files) {
      var insensitiveMatch;
      var addedFolders = Object.create(null);
      files.forEach(function(fileInfo) {
        var pathParts = fileInfo.name.split('/');
        for (var i = 1; i < pathParts.length; i++) {
          var folder = pathParts.slice(0, i).join('/');
          if (folder in addedFolders) continue;
          addedFolders[folder] = true;
          var element = document.createElement('A');
          element.setAttribute('href', '#/' + itemRecord.identifier + '/' + folder + '/');
          element.className = 'file folder';
          element.dataset.folder = pathParts.slice(0, i-1).join('/');
          element.dataset.filename = element.innerText = pathParts[i-1];
          fileContainer.appendChild(element);
        }
        var element = document.createElement('A');
        element.setAttribute('href', '#/' + itemRecord.identifier + '/' + fileInfo.name);
        element.className = 'file';
        Object.assign(element.dataset, fileInfo);
        element.dataset.folder = pathParts.slice(0, -1).join('/');
        element.dataset.filename = element.innerText = pathParts.slice(-1)[0];
        fileContainer.appendChild(element);
      });
    });
  }
  
  function loadHash() {
    if (hashpath.full === '/') {
      activate('/');
      return;
    }
    if (/^\/!/.test(hashpath.full)) {
      activate(hashpath.parts[0]);
      return;
    }
    loadWhile(ia.getItemRecord(hashpath.parts[0]).then(function(itemRecord) {
      if (itemRecord === null) {
        return ia.normalizeItemName(hashpath.parts[0])
        .then(function(normalized) {
          if (normalized === null) {
            document.body.classList.add('notfound');
            return;
          }
          hashpath.setCanonical([normalized].concat(hashpath.parts.slice(1)));
          loadHash();
        });
      }
      document.getElementById('title').innerText = itemRecord.title || itemRecord.identifier;
      console.log(itemRecord);
      document.body.classList.remove('notfound');
      if (itemRecord.mediatype === 'collection') {
        return initCollection(itemRecord);
      }
      else {
        return initItem(itemRecord);
      }
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
