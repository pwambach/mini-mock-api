var request = require('request-promise');
var API = require('../lib/mini-mock-api');

var basePath = '/api/v1';
var requestFromMockServer = function(path){
  return request({
    uri: 'http://localhost:8080' + basePath + path,
    json: true
  });
};

describe('File Router', function(){

  var server = new API({
    basePath: basePath,
    port: 8080,
    mockPath: 'example/mock-files',
    idAttribute: '_id',
  });

  beforeEach(function(){
    server.start();
  });

  afterEach(function(){
    server.stop();
  });

  it('should return the content of a JSON file if file exists', function(done){
    requestFromMockServer('/todos').then(function(response){
      expect(response.length).toBe(2);
      done();
    });
  });

  it('should return the object with the given id if file does not exist but route matches a file', function(done){
    requestFromMockServer('/todos/1').then(function(response){
      expect(response._id).toBe(1);
      done();
    });
  });

  it('should return a 404 if a file is not found', function(done){
    requestFromMockServer('/xyz').catch(function(error){
      expect(error.statusCode).toBe(404);
      done();
    });
  });

});


describe('Decorate Function', function(){

  var server = new API({
    basePath: basePath,
    port: 8080,
    mockPath: 'example/mock-files',
    idAttribute: '_id'
  });

  server.decorate = function(res, req){
    return {
      test: res
    };
  };

  beforeEach(function(){
    server.start();
  });

  afterEach(function(){
    server.stop();
  });

  it('should decorate the output if defined', function(done){
    requestFromMockServer('/todos/1').then(function(response){
      expect(response.test._id).toBe(1);
      done();
    });
  });
});

describe('CORS Option', function(){

  var server = new API({
    basePath: basePath,
    port: 8080,
    mockPath: 'example/mock-files',
    idAttribute: '_id',
    cors: true
  });

  beforeEach(function(){
    server.start();
  });

  afterEach(function(){
    server.stop();
  });

  it('should send CORS headers if cors option is enabled', function(done){
    request({
      uri: 'http://localhost:8080' + basePath + '/todos',
      json: true,
      transform: function(body, response){
        expect(response.headers['access-control-allow-origin']).toEqual('*');
        return body;
      }
    }).then(function(response){
      expect(response.length).toBe(2);
      done();
    });
  });
});


//   it('should sort the output if a sortParameter is defined', function(){
//
//   });
//
//   it('should sort the output if a custom sortParameter is defined', function(){
//
//   });
// });
