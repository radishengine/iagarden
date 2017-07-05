requirejs(['domReady!', 'ia'], function(domReady, ia) {

  'use strict';
  
  function regexEscape(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  }
  
  function loadHash() {
    var hash = (location.hash || '').match(/^#?\/?([a-zA-Z0-9_\-\.]+)\/?(.*?)\/?$/);
    if (!hash) {
      hash = localStorage.getItem('lastValidHash') || '#/amigaformat045disk_1993-04/';
      history.replaceState(undefined, undefined, hash);
      hash = hash.match(/^#?\/?([a-zA-Z0-9_\-\.]+)\/?(.*?)\/?$/);
    }
    localStorage.setItem('lastValidHash', '#/' + hash[1] + '/' + hash[2]);
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
    ia.fetchFileList(itemName).then(function(files) {
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
      }
    });
  }
  window.addEventListener('hashchange', loadHash);
  loadHash();
  
});
