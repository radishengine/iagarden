define(function() {

  'use strict';
  
  return {
    getURL: function(item, filename) {
      return '//cors.archive.org/cors/' + item + '/' + filename;
    },
    fetchBlob: function(item, filename) {
      return fetch(this.getURL(item, filename))
      .then(function(request) {
        return request.blob();
      });
    },
    fetchXml: function(item, filename) {
      return fetch(this.getURL(item, filename))
      .then(function(request) {
        return request.text();
      })
      .then(function(text) {
        var parser = new DOMParser();
        return parser.parseFromString(text, 'application/xml');
      });
    },
    fetchFileList: function(item) {
      return this.fetchXml(item, item + '_files.xml')
      .then(function(xml) {
        if (xml.documentElement.nodeName !== 'files') {
          return Promise.reject('bad xml');
        }
        var list = [];
        for (var el = xml.documentElement.firstElementChild; el; el = el.nextElementSibling) {
          if (el.nodeName !== 'file') {
            console.warn('unexpected element: ' + el.nodeName);
            continue;
          }
          var fileInfo = Object.create(null);
          for (var i = 0; i < el.attributes.length; i++) {
            fileInfo[el.attributes[i].name] = el.attributes[i].value;
          }
          for (var el2 = el.firstElementChild; el2; el2 = el2.nextElementSibling) {
            fileInfo[el2.nodeName] = el2.textContent.trim();
          }
          list.push(fileInfo);
        }
        return list;
      });
    },
  };

});
