'use strict';

var express = require('express');
var fs = require('fs');
var path = require('path');
var _ = require('lodash-node');
var Q = require('q');
var fs_readFile = Q.denodeify(fs.readFile);
var customMethods = [
  'get', 'post', 'put', 'delete'
];

var MiniMockAPI = function(options){
  this.defaults = {
    mockPath: 'mocks',
    basePath: '/api',
    port: 8080,
    idAttribute: 'uuid',
    sortParameter: 'sortOrder'
  };
  this.options = _.extend(this.defaults, options);
  this.app = express();
  return this;
};


/*
 * Handle all API requests with json files found in file system (./mocks).
 * If a file is not found the server assumes that a single item was requested
 * and tries to search a specific id in the parent collection
 * e.g. for tasks/123 it will search in tasks.json for an item with idAttribute === 123
 *
 */
MiniMockAPI.prototype.initMockRoute = function(filePath){
  this.app.get(filePath, function(request, response){
      var strippedRequestPath = request.path.substring(this.options.basePath.length),
          fileName = this.getFileName(strippedRequestPath);

      fs_readFile(fileName, 'utf8').then(

        function handleFileFound(data){
          var responseData = sort(JSON.parse(data), request.query[this.options.sortParameter]);
          console.log('Serving: ' + fileName);
          response.json(this.decorate(responseData, request));
        }.bind(this),

        function handleError(){
          var splitted = splitPathInIdAndPath(strippedRequestPath);
          if(splitted){
            fs_readFile(this.getFileName(splitted.path), 'utf8').then(

              function handleSingleItem(data){
                var queryObj = {};

                queryObj[this.options.idAttribute] = splitted.id;

                //search single item
                var foundItem = _.findWhere(JSON.parse(data), queryObj);
                //try again with number instead of string
                if(!foundItem){
                  queryObj[this.options.idAttribute] = parseInt(splitted.id, 10);
                  foundItem = _.findWhere(JSON.parse(data), queryObj);
                }
                if(foundItem){
                  console.log('Serving: ' + path.join(this.getFileName(splitted.path), splitted.id));
                  response.json(this.decorate(foundItem, request));
                } else {
                  response.sendStatus(404);
                }
              }.bind(this),

              function(err) {
                console.log('No mock data found:', strippedRequestPath);
                response.sendStatus(404);
              }.bind(this)
            );
          }
        }.bind(this)
      );
    }.bind(this));
}

/*
 * This function can be overridden. Allows to modify responses globally.
 */
MiniMockAPI.prototype.decorate = function(data) {
  return data;
};

/*
 * Configure express mock route (has to be set up here because custom routes should be defined earlier)
 * and start server
 */
MiniMockAPI.prototype.start = function() {
  this.initMockRoute(path.join(this.options.basePath, '*'));
  this.expressInstance = this.app.listen(this.options.port);
  console.log('Listening on:', this.options.port);
};

//Stop server
MiniMockAPI.prototype.stop = function() {
  if(this.expressInstance){
    this.expressInstance.close();
    console.log('Stopped listening on:', this.options.port);
  }
};

/*
 * adds convenient functions for custom routes
 * e.g. server.post('abc', function(req, res)) instead of server.app.post(server.options.basePath ...)
 */
customMethods.forEach(function(method){
  MiniMockAPI.prototype[method] = function(relativeRoute, fn) {
    this.app[method](path.join(this.options.basePath, relativeRoute), fn);
  };
  MiniMockAPI.prototype[method + 'FromRoot'] = function(absoluteRoute, fn) {
    this.app[method](absoluteRoute, fn);
  };
});


// get filename relative to mock path
MiniMockAPI.prototype.getFileName = function(filePath) {
  return path.join(process.cwd(), this.options.mockPath, filePath+'.json');
};

// split path in subpath and uuid
var splitPathInIdAndPath = function(filePath){
  var parts = filePath.split('/');
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
