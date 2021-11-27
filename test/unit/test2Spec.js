'use strict';

describe('sample test' , function() {
  var someVariable;

  beforeEach( function() {
    //module("app.filters");
  });

  beforeEach(function() {
    someVariable = "someVariable";
  });

  it('some test 1',  function() {
    expect(someVariable).not.toBeNull();
  });

  it('some test 2',  function() {
    expect(someVariable).toEqual("someVariable");
  });
});