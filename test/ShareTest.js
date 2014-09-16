"use strict"

var temp = require("temp").track()
var ncp = require("ncp")
var assert = require("assert")
var fs = require("fs")
var httpMocks = require("node-mocks-http")
var EventEmitter = require("events").EventEmitter

var Share = require("../lib/Share.js")

describe("Share", function () {
  var share, tempDirPath

  beforeEach(function (done) {
    temp.mkdir("http-file-share-test", function (err, path) {
      assert.ifError(err)

      tempDirPath = path

      ncp("./test/data/", tempDirPath + "/", function (err) {
        err && err.forEach(console.error)
        assert.ifError(err)

        share = new Share(tempDirPath)

        return done()
      })
    })
  })

  afterEach(function (done) {
    temp.cleanup(function (err, stats) {
      assert.ifError(err)
      return done()
    })
  })

  it("should construct an object", function () {
    assert.ok(share)
  })

  it("should successfully copy files to temporary directory", function (done) {
    fs.exists(tempDirPath + "/a.json", function (result) {
      assert.ok(result)
      return done()
    })
  })

  describe(".prototype.handleRequest", function () {
    var response

    var createRequest = function (method, url, body) {
      var request = httpMocks.createRequest({
        "method": method,
        "url": url
      })

      if (body) {
        request.body = body
      }

      return extendMockRequest(request)
    }

    var get = function (url) { return createRequest("GET", url) }
    var del = function (url) { return createRequest("DELETE", url) }
    var put = function (url, body) { return createRequest("PUT", url, body) }

    var handleRequestTest = function (request, responseEndHandler) {
      response.on("end", responseEndHandler)
      share.handleRequest(request, response)
    }

    beforeEach(function () {
      response = httpMocks.createResponse({
        "eventEmitter": EventEmitter
      })
    })

    it("should respond with a 501 for an unsupported request method", function (done) {
      handleRequestTest(createRequest("TRACE", "/blarggg"), function () {
        assert.strictEqual(response.statusCode, 501)
        return done()
      })
    })

    it("should respond with a 404 for a nonexistent file", function (done) {
      handleRequestTest(get("/does-not-exist.txt"), function () {
        assert.strictEqual(response.statusCode, 404)
        return done()
      })
    })

    it("should respond with a 200 for a file that exists", function (done) {
      handleRequestTest(get("/a.json"), function () {
        assert.strictEqual(response.statusCode, 200)
        return done()
      })
    })

    it("should respond with the contents of the requested file", function (done) {
      handleRequestTest(get("/a.json"), function () {
        assertResponseContainsJSONFileContent(response, "a.json")
        return done()
      })
    })

    it("should respond with a 204 when a file is successfully deleted" , function (done) {
      handleRequestTest(del("/a.json"), function () {
        assert.strictEqual(response.statusCode, 204)
        assert.ok(! fs.existsSync(tempDirPath + "/a.json"))
        return done()
      })
    })

    it("should respond with a 404 when a file is deleted but does not exist", function (done) {
      handleRequestTest(del("/nonexistent.txt"), function () {
        assert.strictEqual(response.statusCode, 404)
        return done()
      })
    })

    it("should respond with a 204 when a file is PUT and data should be written", function (done) {
      handleRequestTest(put("/new-file.txt", "foo\n"), function () {
        assert.strictEqual(response.statusCode, 204)
        assert.ok(fs.existsSync(tempDirPath + "/new-file.txt"))
        assert.strictEqual(fs.readFileSync(tempDirPath + "/new-file.txt").toString(), "foo\n")
        return done()
      })
    })

    it("should respond with the right file when a base route has been specified", function (done) {
      share.setBaseRoute("/foo/bar")
      handleRequestTest(get("/foo/bar/a.json"), function () {
        assert.strictEqual(response.statusCode, 200)
        assertResponseContainsJSONFileContent(response, "a.json")
        return done()
      })
    })

    it("should not attempt to read files outside of the base directory", function (done) {
      share.setBasePath(tempDirPath + "/1/")
      handleRequestTest(get("/../a.json"), function () {
        assert.strictEqual(response.statusCode, 403)
        assert.strictEqual(response._getData(), "")
        return done()
      })
    })

    function assertResponseContainsJSONFileContent (response, file) {
      var fileContent = fs.readFileSync(tempDirPath + "/" + file)
      assert.ok(JSON.parse(fileContent))
      assert.ok(JSON.parse(response._getData()))
      assert.strictEqual(response._getData().toString(), fileContent.toString())
    }
  })
})

function extendMockRequest (request) {
  // node-mocks-http doesn't give us a pipe method on IncomingMessage mock
  request.pipe = request.pipe || function (dest) {
    process.nextTick(function () {
      dest.write(new Buffer(request.body))
      process.nextTick(function () {
        dest.end()
      })
    })
  }

  return request
}
