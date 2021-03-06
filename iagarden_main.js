
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
  
  function renderTemplate(templateSelector, id) {
    var template = document.querySelector('#templates > ' + templateSelector).cloneNode(true);
    var replacements = template.querySelectorAll('[data-template]');
    for (var i = 0; i < replacements.length; i++) {
      replacements[i].parentNode.replaceChild(
        renderTemplate(replacements[i].dataset.template),
        replacements[i]);
    }
    if (id) template.setAttribute('id', id);
    return template;
  }
  
  document.body.appendChild(renderTemplate('.home', '/'));
  var localTemplate = renderTemplate('.local-storage', '/!LOCAL/');
  localTemplate.querySelector('a.parent').setAttribute('href', '#/');
  document.body.appendChild(localTemplate);
  document.body.appendChild(renderTemplate('.not-found', '/!404/'));
  
  function activate(activateMe) {
    if (typeof activateMe === 'string') {
      var el = document.getElementById(activateMe);
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
  
  function initCollection(template, itemRecord) {
    var fileContainer = template.querySelector('.files');
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
  
  function initItem(template, itemRecord) {
    var fileContainer = template.querySelector('.files');
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
    var existing = document.getElementById(hashpath.full);
    if (existing) {
      activate(existing);
      return;
    }
    if (/^!/.test(hashpath[0])) {
      activate('/!404/');
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
      var template = renderTemplate('.content', hashpath.full);
      if (hashpath.parts.length > 0) {
        template.querySelector('a.parent').setAttribute('href', '#' + hashpath.full.replace(/\/[^\/]+\/?$/, '/'));
      }
      template.querySelector('.title').innerText = itemRecord.title || itemRecord.identifier;
      document.body.appendChild(template);
      activate(template);
      console.log(itemRecord);
      if (itemRecord.mediatype === 'collection') {
        return initCollection(template, itemRecord);
      }
      else {
        return initItem(template, itemRecord);
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
  
});
