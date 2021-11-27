var request = require('request');

describe("test1", function() {
  it("should respond with hello world", function(done) {
    request("http://www.google.com", function(error, response, body){
      console.log(response);
      //expect(body).toEqual("hello world");
      done();
    });
  });

  var request = function (str, func) {
    func('1', '2', 'hello world');
  };

  it("should respond with hello world", function(done) {
    request("http://localhost:3000/hello", function(error, response, body){
      console.log(response);
      expect(body).toEqual("hello world");
      done();
    });
  });

  it("should respond with hello world", function(done) {
    request("http://localhost:3000/hello", function(error, response, body){
      expect(body).toEqual("hello world");
      done();
    });
  }, 250); // timeout after 250 ms

});
