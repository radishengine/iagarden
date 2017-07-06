define(function() {

  'use strict';
  
  return {
    openDB: function() {
      var self = this;
      return self._db = self._db || new Promise(function(resolve, reject) {
        var opening = indexedDB.open('ia', 1);
        opening.onerror = function(e) {
          reject('db error ' + e.target.errorCode);
        };
        opening.onupgradeneeded = function(e) {
          var db = e.target.result;
          var itemStore = db.createObjectStore('item', {keyPath:'identifier'});
          itemStore.createIndex('collection', 'collection', {multiEntry:true});
          itemStore.createIndex('subject', 'subject', {multiEntry:true});
          itemStore.createIndex('mediatype', 'mediatype');
          var fileStore = db.createObjectStore('file', {keyPath:['item', 'name']});
        };
        opening.onsuccess = function(e) {
          resolve(e.target.result);
        };
      });
    },
    tryFetchItemRecordFromDB: function(itemName) {
      return this.openDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          db.transaction(['item']).objectStore('item').openCursor(itemName).onsuccess = function(e) {
            var cursor = e.target.result;
            resolve(cursor ? cursor.value : null);
          };
        });
      });
    },
    tryFetchFileRecordsFromDB: function(itemName) {
      return this.openDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          var records = [];
          var trn = db.transaction(['file']);
          trn.oncomplete = function() {
            resolve(records);
          };
          trn.onabort = function() {
            reject();
          };
          trn.objectStore('file')
          .openCursor(IDBKeyRange.bound([itemName, ''], [itemName, []]))
          .onsuccess = function(e) {
            var cursor = e.target.result;
            if (!cursor) return;
            records.push(cursor.value);
            cursor.continue();
          };
        });
      });
    },
    putItemRecord: function(record) {
      return this.openDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          var trn = db.transaction(['item'], 'readwrite');
          trn.oncomplete = resolve;
          trn.onabort = reject;
          trn.objectStore('item').put(record);
        });
      });
    },
    putFileRecords: function(records) {
      return this.openDB().then(function(db) {
        return new Promise(function(resolve, reject) {
          var trn = db.transaction(['file'], 'readwrite');
          trn.oncomplete = resolve;
          trn.onabort = reject;
          var fileStore = trn.objectStore('file');
          for (var i = 0; i < records.length; i++) {
            fileStore.put(records[i]);
          }
        });
      });
    },
    getFetchURL: function(item, filename) {
      return '//cors.archive.org/cors/' + item + '/' + filename;
    },
    getLinkURL: function(item, filename) {
      return '//archive.org/download/' + item + '/' + filename;
    },
    fetchBlob: function(item, filename) {
      return fetch(this.getFetchURL(item, filename))
      .then(function(request) {
        return request.blob();
      });
    },
    fetchXml: function(item, filename) {
      return fetch(this.getFetchURL(item, filename))
      .then(function(request) {
        return request.text();
      })
      .then(function(text) {
        var parser = new DOMParser();
        return parser.parseFromString(text, 'application/xml');
      });
    },
    downloadItemRecord: function(itemName) {
      return this.fetchXml(itemName, itemName + '_meta.xml')
      .then(function(xml) {
        if (xml.documentElement.nodeName !== 'metadata') {
          return Promise.reject('bad xml');
        }
        var meta = Object.create(null);
        for (var el = xml.documentElement.firstElementChild; el; el = el.nextElementSibling) {
          if (el.nodeName in meta) {
            if (typeof meta[el.nodeName].push === 'function') {
              meta[el.nodeName].push(el.textContent);
            }
            else {
              meta[el.nodeName] = [meta[el.nodeName], el.textContent];
            }
          }
          else {
            meta[el.nodeName] = el.textContent;
          }
        }
        return meta;
      });
    },
    getItemRecord: function(itemName) {
      var self = this;
      return this.tryFetchItemRecordFromDB(itemName)
      .then(function(record) {
        if (record !== null) return record;
        return self.downloadItemRecord(itemName)
        .then(function(record) {
          self.putItemRecord(record);
          return record;
        });
      });
    },
    getFileRecords: function(itemName) {
      var self = this;
      return this.tryFetchFileRecordsFromDB(itemName)
      .then(function(records) {
        if (records.length > 0) return records;
        return self.downloadFileRecords(itemName)
        .then(function(records) {
          self.putFileRecords(records);
          return records;
        });
      });
    },
    downloadFileRecords: function(item) {
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
          fileInfo.item = item;
          list.push(fileInfo);
        }
        return list;
      });
    },
  };

});
