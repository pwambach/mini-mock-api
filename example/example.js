var API = require('../lib/mini-mock-api');

var server = new API({
  basePath: '/api/v1',
  port: 8080,
  mockPath: 'mock-files',
  idAttribute: '_id'
});

//wrap data in 'results' and add total amount
server.decorate = function(data){
  if(data.length){
    return {
      results: data,
      total: data.length
    };
  }
  return data;
};

server.start();
