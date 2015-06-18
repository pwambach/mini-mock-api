'use strict';

var express = require('express');
var fs = require('fs');
var _ = require('lodash-node');
var Q = require('q');
var fs_readFile = Q.denodeify(fs.readFile);


var MiniMockAPI = function(options){
  this.defaults = {
    MOCK_FILE_PATH: 'mocks',
    BASE_PATH: '/api',
    PORT: 8080,
    ID_ATTRIBUTE: 'uuid',
    SORT_PARAMETER: 'sortOrder'
  };
  this.options = _.extend(this.defaults, options);
  this.app = express();

  /*
   * Handle all API requests with json files found in file system (./mocks).
   * If a file is not found the server assumes that a single item was requested
   * and tries to search a specific id in the parent collection
   * e.g. for tasks/123 it will search in tasks.json for an item with ID_ATTRIBUTE === 123
   *
   */
  this.app.get(this.options.BASE_PATH + '/*', function(request, response){
    var strippedRequestPath = request.path.substring(this.options.BASE_PATH.length),
        filename = this.getFilename(strippedRequestPath);

    fs_readFile(filename, 'utf8').then(

      function handleFileFound(data){
        var responseData = sort(JSON.parse(data), request.query[this.options.SORT_PARAMETER]);
        console.log('Serving: ' + filename);
        response.json(this.decorate(responseData));
      }.bind(this),

      function handleError(){
        var splitted = splitPathInIdAndPath(strippedRequestPath);
        if(splitted){
          fs_readFile(this.getFilename(splitted.path), 'utf8').then(

            function handleSingleItem(data){
              var queryObj = {};

              queryObj[this.options.ID_ATTRIBUTE] = splitted.id;

              //search single item
              var foundItem = _.findWhere(JSON.parse(data), queryObj);
              //try again with number instead of string
              if(!foundItem){
                queryObj[this.options.ID_ATTRIBUTE] = parseInt(splitted.id, 10);
                foundItem = _.findWhere(JSON.parse(data), queryObj);
              }
              if(foundItem){
                console.log('Serving: ' + this.getFilename(splitted.path) + ' /' + splitted.id);
                response.json(this.decorate(foundItem));
              } else {
                response.sendStatus(404);
              }
            }.bind(this),

            function(err) {
              console.log(err);
              response.sendStatus(404);
            }
          );
        }
      }.bind(this)
    );
  }.bind(this));
  return this;
};

/*
 * This function can be overridden. Allows to modify responses globally.
 */
MiniMockAPI.prototype.decorate = function(data) {
  return data;
};

MiniMockAPI.prototype.start = function() {
  this.expressInstance = this.app.listen(this.options.PORT);
  console.log('Listening on:', this.options.PORT);
};

MiniMockAPI.prototype.stop = function() {
  if(this.expressInstance){
    this.expressInstance.close();
    console.log('Stopped listening on:', this.options.PORT);
  }
};

MiniMockAPI.prototype.getFilename = function(path) {
  return process.cwd() + '/' + this.options.MOCK_FILE_PATH + path + '.json';
};

// split path in subpath and uuid
var splitPathInIdAndPath = function(path){
  var parts = path.split('/');
  if(parts.length > 0){
    var id = parts.pop();
    return {
      id: id,
      path: parts.join('/')
    }
  } else {
    return false;
  }
};

/*
 * Sort data array by property
 * leading + is ASC
 * leading - is DESC
 */
var sort = function(data, sortOrder) {
  if(sortOrder){
    data = _.sortBy(data, sortOrder.substr(1));
    if(sortOrder[0] === '-'){
      data.reverse();
    }
  }
  return data;
};

module.exports = MiniMockAPI;
