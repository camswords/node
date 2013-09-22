// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.




var common = require('../common');
var assert = require('assert');
var http = require('http');
var net = require('net');

var testsComplete = 0;

var testCases = [
  { path: "/200", reasonPhrase: "OK", response: 'HTTP/1.1 200 OK\r\n\r\n' },
  { path: "/500", reasonPhrase: "Internal Server Error", response: 'HTTP/1.1 500 Internal Server Error\r\n\r\n' },
  { path: "/302", reasonPhrase: "Moved Temporarily", response: 'HTTP/1.1 302 Moved Temporarily\r\n\r\n' },
  { path: "/missing", reasonPhrase: "", response: 'HTTP/1.1 200 \r\n\r\n' },
  { path: "/missing-no-space", reasonPhrase: "", response: 'HTTP/1.1 200\r\n\r\n' }
];
testCases.findByPath = function(path) {
  var matching = this.filter(function(testCase) { return testCase.path === path; });
  if (matching.length === 0) { throw "failed to find test case with path " + path; }
  return matching[0];
};

var server = net.createServer(function(connection) {
  connection.on('data', function(data) {
    var path = data.toString().match(/GET (.*) HTTP.1.1/)[1];
    var testCase = testCases.findByPath(path);

    connection.write(testCase.response);
    connection.end();
  });
});

var runTest = function(testCaseIndex) {
  var testCase = testCases[testCaseIndex];

  http.get({ port: common.PORT, path: testCase.path }, function(response) {
    console.log('client: expected reason phrase: ' + testCase.reasonPhrase);
    console.log('client: actual reason phrase: ' + response.reasonPhrase);
    assert.equal(testCase.reasonPhrase, response.reasonPhrase);

    response.on('end', function() {
      testsComplete++;

      if (testCaseIndex + 1 < testCases.length) {
        runTest(testCaseIndex + 1);
      } else {
        server.close();
      }
    });

    response.resume();
  });
};

server.listen(common.PORT, function() { runTest(0); });

process.on('exit', function() {
  assert.equal(testCases.length, testsComplete);
});

