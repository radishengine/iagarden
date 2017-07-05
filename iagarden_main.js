requirejs(['domReady!', 'ia'], function(domReady, ia) {

  'use strict';
  
  function loadHash() {
    var hash = (location.hash || '').match(/^#?\/?([a-zA-Z0-9_-\.]+)\/?(.*)$/);
    if (!hash) {
      hash = localStorage.get('lastValidHash') || '#/amigaformat045disk_1993-04/');
      history.replaceState(undefined, undefined, hash);
      hash = (location.hash || '').match(/^#?\/?([a-zA-Z0-9_-\.]+)\/?(.*)$/);
    }
    localStorage.set('lastValidHash', '#/' + hash[1] + '/' + hash[2]);
    var itemName = hash[1];
    var fileContainer = document.getElementById('files');
    ia.getFileList(itemName).then(function(files) {
      files.forEach(function(fileInfo) {
        var element = document.createElement('A');
        element.setAttribute('href', ia.getLinkURL(itemName, fileInfo.name));
        // element.setAttribute('href', '#/' + itemName + '/' + fileInfo.name);
        element.className = 'file';
        Object.assign(element.dataset, fileInfo);
        element.innerText = fileInfo.name;
        fileContainer.appendChild(element);
      });
    });
  }
  window.addEventListener('hashchange', loadHash);
  loadHash();
  
});
