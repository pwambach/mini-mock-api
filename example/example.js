var API = require('../lib/mini-mock-api');

var server = new API({
  basePath: '/api/v1',
  port: 8080,
  mockPath: 'mock-files',
  idAttribute: '_id',
  cors: true
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

//add custom post method localhost:8080/api/v1/custom
server.post('custom', function(request, response){
  response.json({status: 'okay'});
});

//add custom post method localhost:8080/root
server.postFromRoot('root', function(request, response){
  response.json({status: 'okay'});
});

server.start();
