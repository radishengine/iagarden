requirejs(['domReady', 'ia'], function(domReady, ia) {

  'use strict';
  
  var itemElements = document.querySelectorAll('[data-ia-item]');
  
  function initItemElement(el) {
    ia.fetchFileList(el.dataset.iaItem)
    .then(function(files) {
      files.forEach(function(fileInfo) {
        var element = document.createElement('DIV');
        element.className = 'file';
        Object.assign(element.dataset, fileInfo);
        element.innerText = fileInfo.name;
        el.appendChild(element);
      });
    });
  }
  
  for (var i = 0; i < itemElements.length; i++) {
    initItemElement(itemElements[i]);
  }

});
