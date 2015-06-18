var API = require('../lib/mini-mock-api');

var server = new API({
  BASE_PATH: '/api/v2',
  PORT: 8080,
  MOCK_FILE_PATH: 'mock-files',
  ID_ATTRIBUTE: '_id'
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
